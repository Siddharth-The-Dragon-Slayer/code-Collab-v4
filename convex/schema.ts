import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // clerkId
    email: v.string(),
    name: v.string(),
    isPro: v.boolean(),
    proSince: v.optional(v.number()),
    lemonSqueezyCustomerId: v.optional(v.string()),
    lemonSqueezyOrderId: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),

  codeExecutions: defineTable({
    userId: v.string(),
    language: v.string(),
    code: v.string(),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),

  snippets: defineTable({
    userId: v.string(),
    title: v.string(),
    language: v.string(),
    code: v.string(),
    userName: v.string(), // store user's name for easy access
  }).index("by_user_id", ["userId"]),

  snippetComments: defineTable({
    snippetId: v.id("snippets"),
    userId: v.string(),
    userName: v.string(),
    content: v.string(), // This will store HTML content
  }).index("by_snippet_id", ["snippetId"]),

  stars: defineTable({
    userId: v.string(),
    snippetId: v.id("snippets"),
  })
    .index("by_user_id", ["userId"])
    .index("by_snippet_id", ["snippetId"])
    .index("by_user_id_and_snippet_id", ["userId", "snippetId"]),

  collaborationRooms: defineTable({
    roomId: v.string(), // unique room identifier
    title: v.string(),
    language: v.string(),
    code: v.string(),
    createdBy: v.string(), // userId
    createdByName: v.string(),
    isActive: v.boolean(),
    lastActivity: v.number(),
  }).index("by_room_id", ["roomId"])
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"]),

  roomParticipants: defineTable({
    roomId: v.string(),
    userId: v.string(),
    userName: v.string(),
    joinedAt: v.number(),
    lastSeen: v.number(),
    cursorPosition: v.optional(v.object({
      line: v.number(),
      column: v.number(),
    })),
    isActive: v.boolean(),
  }).index("by_room_id", ["roomId"])
    .index("by_user_id", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  codeChanges: defineTable({
    roomId: v.string(),
    userId: v.string(),
    userName: v.string(),
    changeType: v.union(v.literal("insert"), v.literal("delete"), v.literal("replace")),
    position: v.object({
      startLine: v.number(),
      startColumn: v.number(),
      endLine: v.number(),
      endColumn: v.number(),
    }),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_room_id", ["roomId"])
    .index("by_timestamp", ["timestamp"]),
});
