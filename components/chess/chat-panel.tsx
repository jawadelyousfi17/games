"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessagePayload } from "@/lib/chess/realtime";

type ChatPanelProps = {
  messages: ChatMessagePayload[];
  /** Caller's user id — drives left/right alignment and the "you" styling. */
  selfUserId: string | null;
  /** Disables the composer for spectators (non-participants). */
  canSend: boolean;
  /** Called when the user submits a non-empty message. */
  onSend: (body: string) => void | Promise<void>;
};

const MAX_LEN = 500;

/**
 * Two-pane chat for the right rail: scrollable message log on top, single-
 * line composer on the bottom. Auto-scrolls to the newest message; the
 * composer disables for spectators.
 */
export function ChatPanel({
  messages,
  selfUserId,
  canSend,
  onSend,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pin to bottom on every new message. Done as a layout effect would
  // overshoot if the list height shrinks; useEffect after paint is fine.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending || !canSend) return;
    setSending(true);
    try {
      await onSend(body);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 pb-2 pt-1"
      >
        {messages.length === 0 ? (
          <p className="pt-6 text-center text-[12px] font-medium text-navy-400">
            No messages yet — say hi.
          </p>
        ) : (
          messages.map((m) => (
            <Message
              key={m.id}
              message={m}
              isSelf={m.userId === selfUserId}
            />
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-2 flex items-center gap-2 border-t border-white/5 pt-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          placeholder={canSend ? "Send a message" : "Spectators can't chat"}
          disabled={!canSend || sending}
          maxLength={MAX_LEN}
          className="h-10 flex-1 rounded-md bg-navy-800 px-3 text-[14px] text-white ring-1 ring-white/5 placeholder:text-navy-400 focus:outline-none focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend || sending || !draft.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-lime text-navy-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.22)] transition hover:bg-brand-lime-light active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </form>
    </div>
  );
}

function Message({
  message,
  isSelf,
}: {
  message: ChatMessagePayload;
  isSelf: boolean;
}) {
  const time = formatTime(message.createdAt);
  return (
    <div
      className={`flex items-end gap-2 ${
        isSelf ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <Avatar className="h-7 w-7 flex-shrink-0 rounded-full border border-white/10">
        <AvatarFallback className="rounded-full bg-navy-700 text-[10px] font-bold text-white">
          {message.login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
          isSelf
            ? "rounded-br-sm bg-brand-lime/15 text-white ring-1 ring-brand-lime/30"
            : "rounded-bl-sm bg-navy-800 text-white ring-1 ring-white/5"
        }`}
      >
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-navy-200">
            {isSelf ? "You" : message.login}
          </span>
          <span className="text-[10px] text-navy-400">{time}</span>
        </div>
        <div className="break-words font-medium">{message.body}</div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
