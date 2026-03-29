"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, X, Loader2, Bot } from "lucide-react";

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onMapCommand?: (cmd: {
    action: string;
    country: string;
    lat: number;
    lng: number;
  }) => void;
  pendingMessage?: string | null;
  onPendingMessageHandled?: () => void;
}

export default function ChatPanel({
  isOpen,
  onToggle,
  onMapCommand,
  pendingMessage,
  onPendingMessageHandled,
}: ChatPanelProps) {
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: string; text: string }[]
  >([
    {
      role: "assistant",
      text: 'Welcome to Mars. Ask me about any conflict zone, region safety, or current events. Try:\n\n• "What is happening in Sudan?"\n• "Is it safe to travel to eastern DRC?"\n• "Show me Myanmar"\n• "Compare Syria vs Yemen"',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pendingHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      pendingMessage &&
      isOpen &&
      !isLoading &&
      pendingMessage !== pendingHandledRef.current
    ) {
      pendingHandledRef.current = pendingMessage;
      onPendingMessageHandled?.();
      // Auto-send the pending message
      setChatMessages((prev) => [
        ...prev,
        { role: "user", text: pendingMessage },
      ]);
      setIsLoading(true);

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: pendingMessage,
          history: chatMessages.slice(-10),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setChatMessages((prev) => [
              ...prev,
              { role: "assistant", text: `Error: ${data.error}` },
            ]);
          } else {
            setChatMessages((prev) => [
              ...prev,
              { role: "assistant", text: data.response },
            ]);
            if (data.mapCommand && onMapCommand) {
              onMapCommand(data.mapCommand);
            }
          }
        })
        .catch(() => {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", text: "Failed to connect. Please try again." },
          ]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [pendingMessage, isOpen, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages.slice(-10),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Error: ${data.error}` },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.response },
        ]);
        if (data.mapCommand && onMapCommand) {
          onMapCommand(data.mapCommand);
        }
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Failed to connect. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-14 bottom-[88px] w-full sm:w-[380px] z-30 flex flex-col glass border-l border-white/[0.04] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent-glow" />
          <h2 className="text-sm font-display font-semibold text-white">
            Mars
          </h2>
          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent-glow text-2xs font-mono border border-accent/20">
            LIVE
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent/20 text-white/90 border border-accent/20"
                  : "bg-surface-200/80 text-muted-light/80 border border-white/[0.04]"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-accent-glow/60" />
                  <span className="text-2xs font-mono text-accent-glow/50">
                    MARS
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-200/80 border border-white/[0.04] rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-light/50">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing conflict data...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
          <MessageSquare className="w-4 h-4 text-muted/50 shrink-0" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
            placeholder="Ask about any conflict or location..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-muted/40 outline-none font-body"
            disabled={isLoading}
          />
          <button
            onClick={handleChatSend}
            disabled={!chatInput.trim() || isLoading}
            className="p-1.5 rounded-lg bg-accent/80 text-white hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-center text-2xs text-muted/30 mt-2 font-mono">
          Powered by Gemini AI · ACLED data
        </p>
      </div>
    </aside>
  );
}
