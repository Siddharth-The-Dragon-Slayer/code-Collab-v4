import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new collaboration room
export const createRoom = mutation({
  args: {
    title: v.string(),
    language: v.string(),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Generate a unique room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const roomDocId = await ctx.db.insert("collaborationRooms", {
      roomId,
      title: args.title,
      language: args.language,
      code: args.code || "",
      createdBy: identity.subject,
      createdByName: user.name,
      isActive: true,
      lastActivity: Date.now(),
    });

    // Add creator as first participant
    await ctx.db.insert("roomParticipants", {
      roomId,
      userId: identity.subject,
      userName: user.name,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
    });

    return { roomId, roomDocId };
  },
});

// Join an existing room
export const joinRoom = mutation({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if room exists
    const room = await ctx.db
      .query("collaborationRooms")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    if (!room) throw new Error("Room not found");
    if (!room.isActive) throw new Error("Room is no longer active");

    // Check if user is already in the room
    const existingParticipant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .first();

    if (existingParticipant) {
      // Update existing participant
      await ctx.db.patch(existingParticipant._id, {
        lastSeen: Date.now(),
        isActive: true,
      });
    } else {
      // Add new participant
      await ctx.db.insert("roomParticipants", {
        roomId: args.roomId,
        userId: identity.subject,
        userName: user.name,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        isActive: true,
      });
    }

    // Update room activity
    await ctx.db.patch(room._id, {
      lastActivity: Date.now(),
    });

    return room;
  },
});

// Leave a room
export const leaveRoom = mutation({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        isActive: false,
        lastSeen: Date.now(),
      });
    }
  },
});

// Get room details
export const getRoom = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("collaborationRooms")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    return room;
  },
});

// Get active participants in a room
export const getRoomParticipants = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    return participants;
  },
});

// Update code in room
export const updateRoomCode = mutation({
  args: {
    roomId: v.string(),
    code: v.string(),
    changeType: v.union(v.literal("insert"), v.literal("delete"), v.literal("replace")),
    position: v.object({
      startLine: v.number(),
      startColumn: v.number(),
      endLine: v.number(),
      endColumn: v.number(),
    }),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Update room code
    const room = await ctx.db
      .query("collaborationRooms")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    if (!room) throw new Error("Room not found");

    await ctx.db.patch(room._id, {
      code: args.code,
      lastActivity: Date.now(),
    });

    // Record the change
    await ctx.db.insert("codeChanges", {
      roomId: args.roomId,
      userId: identity.subject,
      userName: user.name,
      changeType: args.changeType,
      position: args.position,
      content: args.content,
      timestamp: Date.now(),
    });

    // Update participant activity
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        lastSeen: Date.now(),
      });
    }
  },
});

// Update cursor position
export const updateCursorPosition = mutation({
  args: {
    roomId: v.string(),
    line: v.number(),
    column: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        cursorPosition: {
          line: args.line,
          column: args.column,
        },
        lastSeen: Date.now(),
      });
    }
  },
});

// Get recent code changes for synchronization
export const getRecentChanges = query({
  args: { 
    roomId: v.string(),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const since = args.since || Date.now() - 60000; // Last minute by default
    
    const changes = await ctx.db
      .query("codeChanges")
      .withIndex("by_room_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.gte(q.field("timestamp"), since)
        )
      )
      .order("asc")
      .collect();

    return changes;
  },
});

// Get user's rooms
export const getUserRooms = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const rooms = await ctx.db
      .query("collaborationRooms")
      .withIndex("by_created_by")
      .filter((q) => q.eq(q.field("createdBy"), identity.subject))
      .order("desc")
      .collect();

    return rooms;
  },
});

// Save room as snippet
export const saveRoomAsSnippet = mutation({
  args: {
    roomId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const room = await ctx.db
      .query("collaborationRooms")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    if (!room) throw new Error("Room not found");

    const snippetId = await ctx.db.insert("snippets", {
      userId: identity.subject,
      userName: user.name,
      title: args.title,
      language: room.language,
      code: room.code,
    });

    return snippetId;
  },
});