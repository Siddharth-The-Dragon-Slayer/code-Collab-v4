"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import CollaborativeEditor from "../../../components/CollaborativeEditor";
import { toast } from "react-hot-toast";

export default function CollaborationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const joinRoom = useMutation(api.collaboration.joinRoom);
  const leaveRoom = useMutation(api.collaboration.leaveRoom);

  useEffect(() => {
    if (!roomId) return;

    // Join the room when component mounts
    const handleJoinRoom = async () => {
      try {
        await joinRoom({ roomId });
      } catch (error) {
        console.error("Failed to join room:", error);
        toast.error("Failed to join collaboration room");
        router.push("/");
      }
    };

    handleJoinRoom();

    // Leave room when component unmounts
    return () => {
      leaveRoom({ roomId }).catch(console.error);
    };
  }, [roomId, joinRoom, leaveRoom, router]);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white">Invalid room ID</p>
      </div>
    );
  }

  return <CollaborativeEditor roomId={roomId} />;
}