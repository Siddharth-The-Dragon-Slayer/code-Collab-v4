"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users, Plus, Clock, Code, ExternalLink, Copy } from "lucide-react";
import NavigationHeader from "../../components/NavigationHeader";
import CreateCollaborationRoom from "../../components/CreateCollaborationRoom";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function CollaboratePage() {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const userRooms = useQuery(api.collaboration.getUserRooms);

  const copyRoomLink = async (roomId: string) => {
    const link = `${window.location.origin}/collaborate/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Room link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }
    window.location.href = `/collaborate/${joinRoomId.trim()}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavigationHeader />
      
      {/* Header */}
      {/* <div className="bg-[#121218] border-b border-[#ffffff0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Collaboration Rooms
              </h1>
              <p className="text-[#808086]">
                Create or join real-time coding sessions with your team
              </p>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
          </div>
        </div>
      </div> */}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#121218] border border-[#ffffff0a] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Create New Room</h3>
                <p className="text-[#808086] text-sm">Start a new collaboration session</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              Create Room
            </button>
          </div>

          <div className="bg-[#121218] border border-[#ffffff0a] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Join Room</h3>
                <p className="text-[#808086] text-sm">Enter a room ID or use a shared link</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter room ID..."
                className="flex-1 bg-[#0a0a0f] border border-[#ffffff0a] rounded-lg px-3 py-2 text-white placeholder-[#808086] focus:outline-none focus:border-green-500"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button 
                onClick={handleJoinRoom}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Your Rooms */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Your Rooms</h2>
          
          {userRooms === undefined ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#121218] border border-[#ffffff0a] rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#ffffff08] rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-[#ffffff08] rounded w-48 mb-2"></div>
                        <div className="h-4 bg-[#ffffff08] rounded w-32 mb-3"></div>
                        <div className="h-3 bg-[#ffffff08] rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : userRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#ffffff08] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#808086]" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">No rooms yet</h3>
              <p className="text-[#808086] mb-6">Create your first collaboration room to get started</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Your First Room
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {userRooms.map((room) => (
                <div key={room._id} className="bg-[#121218] border border-[#ffffff0a] rounded-2xl p-6 hover:border-[#ffffff20] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 bg-[#ffffff08] rounded-xl">
                        <img
                          src={`/${room.language}.png`}
                          alt={room.language}
                          className="w-6 h-6"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {room.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#808086] mb-3">
                          <div className="flex items-center gap-1">
                            <Code className="w-4 h-4" />
                            <span>{room.language}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(room.lastActivity).toLocaleDateString()}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${room.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span>{room.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <p className="text-[#b8b8b8] text-sm">
                          Room ID: <code className="bg-[#0a0a0f] px-2 py-1 rounded text-xs">{room.roomId}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyRoomLink(room.roomId)}
                        className="p-2 bg-[#ffffff08] hover:bg-[#ffffff12] text-[#808086] hover:text-white rounded-lg transition-colors"
                        title="Copy room link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/collaborate/${room.roomId}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Join
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateCollaborationRoom
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />
    </div>
  );
}