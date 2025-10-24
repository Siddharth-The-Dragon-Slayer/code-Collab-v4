"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LANGUAGE_CONFIG } from "../app/(root)/_constants";
import { Users, Plus, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface CreateCollaborationRoomProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCollaborationRoom({ isOpen, onClose }: CreateCollaborationRoomProps) {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [initialCode, setInitialCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const router = useRouter();
  const createRoom = useMutation(api.collaboration.createRoom);

  const handleCreateRoom = async () => {
    if (!title.trim()) {
      toast.error("Please enter a room title");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createRoom({
        title: title.trim(),
        language,
        code: initialCode || LANGUAGE_CONFIG[language]?.defaultCode || "",
      });

      toast.success("Collaboration room created!");
      router.push(`/collaborate/${result.roomId}`);
      onClose();
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create collaboration room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (!initialCode) {
      setInitialCode(LANGUAGE_CONFIG[newLanguage]?.defaultCode || "");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121218] border border-[#ffffff0a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ffffff0a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Create Collaboration Room</h2>
              <p className="text-[#808086] text-sm">Start coding together in real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#ffffff08] hover:bg-[#ffffff12] rounded-lg flex items-center justify-center text-[#808086] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Room Title */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Room Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your collaboration session"
              className="w-full bg-[#0a0a0f] border border-[#ffffff0a] rounded-lg px-3 py-2 text-white placeholder-[#808086] focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Programming Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleLanguageChange(key)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    language === key
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-[#ffffff08] border-[#ffffff0a] text-[#808086] hover:bg-[#ffffff12] hover:text-white"
                  }`}
                >
                  <img
                    src={config.logoPath}
                    alt={config.label}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Code */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Initial Code (Optional)
            </label>
            <textarea
              value={initialCode}
              onChange={(e) => setInitialCode(e.target.value)}
              placeholder="Enter some starter code for your collaboration session..."
              className="w-full bg-[#0a0a0f] border border-[#ffffff0a] rounded-lg px-3 py-2 text-white placeholder-[#808086] focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
              rows={8}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#ffffff0a]">
          <button
            onClick={onClose}
            className="flex-1 bg-[#ffffff08] hover:bg-[#ffffff12] text-white py-2 px-4 rounded-lg transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || !title.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Room
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}