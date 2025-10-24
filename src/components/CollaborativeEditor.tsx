"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "@/app/(root)/_constants";
import { Users, Copy, Check, Save, Play } from "lucide-react";
import { toast } from "react-hot-toast";

interface CollaborativeEditorProps {
  roomId: string;
}

export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const editorRef = useRef<any>(null);
  const lastChangeRef = useRef<number>(0);

  // Convex queries and mutations
  const room = useQuery(api.collaboration.getRoom, { roomId });
  const participants = useQuery(api.collaboration.getRoomParticipants, { roomId });
  const updateRoomCode = useMutation(api.collaboration.updateRoomCode);
  const updateCursorPosition = useMutation(api.collaboration.updateCursorPosition);
  const saveRoomAsSnippet = useMutation(api.collaboration.saveRoomAsSnippet);

  // Initialize code from room
  useEffect(() => {
    if (room && room.code !== code) {
      setCode(room.code);
      lastChangeRef.current = Date.now();
    }
  }, [room]);

  // Handle code changes
  const handleCodeChange = useCallback(
    async (value: string | undefined) => {
      if (!value || !room) return;
      
      const now = Date.now();
      if (now - lastChangeRef.current < 100) return; // Debounce
      
      setCode(value);
      lastChangeRef.current = now;

      try {
        await updateRoomCode({
          roomId,
          code: value,
          changeType: "replace",
          position: {
            startLine: 0,
            startColumn: 0,
            endLine: 0,
            endColumn: 0,
          },
          content: value,
        });
      } catch (error) {
        console.error("Failed to update room code:", error);
      }
    },
    [roomId, updateRoomCode, room]
  );

  // Handle cursor position changes
  const handleCursorPositionChange = useCallback(
    async (e: any) => {
      if (!e || !room) return;
      
      try {
        await updateCursorPosition({
          roomId,
          line: e.position.lineNumber,
          column: e.position.column,
        });
      } catch (error) {
        console.error("Failed to update cursor position:", error);
      }
    },
    [roomId, updateCursorPosition, room]
  );

  // Copy room link
  const copyRoomLink = async () => {
    const link = `${window.location.origin}/collaborate/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Room link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Save as snippet
  const handleSaveAsSnippet = async () => {
    if (!saveTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await saveRoomAsSnippet({
        roomId,
        title: saveTitle,
      });
      toast.success("Saved as snippet!");
      setShowSaveDialog(false);
      setSaveTitle("");
    } catch (error) {
      toast.error("Failed to save snippet");
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading collaboration room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-[#121218] border-b border-[#ffffff0a] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ffffff08] rounded-lg flex items-center justify-center">
                <img
                  src={`/${room.language}.png`}
                  alt={room.language}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <h1 className="text-white font-semibold">{room.title}</h1>
                <p className="text-[#808086] text-sm">Collaborative Session</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Participants */}
            <div className="flex items-center gap-2 bg-[#ffffff08] px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-[#808086]" />
              <span className="text-[#808086] text-sm">
                {participants?.length || 0} online
              </span>
            </div>

            {/* Copy Link */}
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-2 bg-[#ffffff08] hover:bg-[#ffffff12] px-3 py-1.5 rounded-lg text-[#808086] hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </>
              )}
            </button>

            {/* Save as Snippet */}
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Participants List */}
      {participants && participants.length > 0 && (
        <div className="bg-[#121218] border-b border-[#ffffff0a] px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#808086] text-sm">Active users:</span>
              {participants.map((participant) => (
                <div
                  key={participant._id}
                  className="flex items-center gap-2 bg-[#ffffff08] px-2 py-1 rounded text-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white">{participant.userName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="calc(100vh - 120px)"
          language={LANGUAGE_CONFIG[room.language]?.monacoLanguage || room.language}
          value={code}
          onChange={handleCodeChange}
          onCursorPositionChange={handleCursorPositionChange}
          theme="vs-dark"
          beforeMount={defineMonacoThemes}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 16,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            renderWhitespace: "selection",
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            fontLigatures: true,
            wordWrap: "on",
            lineNumbers: "on",
            folding: true,
            bracketMatching: "always",
            autoIndent: "full",
          }}
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121218] border border-[#ffffff0a] rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              Save as Snippet
            </h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Enter snippet title..."
              className="w-full bg-[#0a0a0f] border border-[#ffffff0a] rounded-lg px-3 py-2 text-white placeholder-[#808086] focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-[#ffffff08] hover:bg-[#ffffff12] text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsSnippet}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}