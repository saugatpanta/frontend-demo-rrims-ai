import { Mic, Paperclip, PhoneCall, RefreshCw, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { callsApi, chatApi, unwrapList, type GenericRecord } from "../api/services";
import { Avatar, Button, EmptyState, Field, inputClass, Panel, SkeletonRows } from "./ui";
import { useAsync } from "../hooks/useAsync";
import { dateLabel, titleCase } from "../utils/format";
import { playTone } from "../utils/sound";

type UploadMediaType = "IMAGE" | "AUDIO" | "DOCUMENT";

export function CommunicationConsole({
  conversationId,
  title = "Conversation",
  compact = false,
}: {
  conversationId?: string;
  title?: string;
  compact?: boolean;
}) {
  const [refresh, setRefresh] = useState(0);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messages = useAsync(
    () => (conversationId ? chatApi.messages(conversationId, { limit: 50 }) : Promise.resolve([])),
    [conversationId, refresh],
  );
  const rows = messages.data ? unwrapList<GenericRecord>(messages.data).slice().reverse() : [];

  useEffect(() => {
    setText("");
    setStatus("");
  }, [conversationId]);

  async function sendMessage(type: "TEXT" | "VOICE_NOTE" = "TEXT", content = text) {
    if (!conversationId || !content.trim()) return;
    setStatus("");
    try {
      await chatApi.sendMessage(conversationId, { type, content: content.trim() });
      setText("");
      setRefresh((value) => value + 1);
      playTone("success");
    } catch (error) {
      playTone("error");
      setStatus(error instanceof Error ? error.message : "Could not send message.");
    }
  }

  async function uploadFile(file?: File, forcedMediaType?: UploadMediaType) {
    if (!conversationId || !file) return;
    setStatus("");
    try {
      await chatApi.addAttachment(conversationId, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        mediaType: forcedMediaType ?? mediaTypeFor(file),
        contentBase64: await fileToBase64(file),
      });
      if ((forcedMediaType ?? mediaTypeFor(file)) === "AUDIO") {
        await chatApi.sendMessage(conversationId, {
          type: "VOICE_NOTE",
          content: `Voice message: ${file.name}`,
          metadata: { fileName: file.name, mimeType: file.type },
        });
      }
      setRefresh((value) => value + 1);
      playTone("success");
    } catch (error) {
      playTone("error");
      setStatus(error instanceof Error ? error.message : "Could not upload attachment.");
    }
  }

  async function startRecording() {
    setStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type });
        await uploadFile(file, "AUDIO");
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      playTone("error");
      setStatus(error instanceof Error ? error.message : "Microphone permission is required for voice notes.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function startCall() {
    if (!conversationId) return;
    setStatus("");
    try {
      const call = await callsApi.create(conversationId, "VOICE");
      const callId = String(call.id ?? call.callId ?? "");
      if (callId) await callsApi.ring(callId, "Calling from assigned work-order conversation");
      playTone("ring");
      setStatus("Call started. The other participant has been invited.");
    } catch (error) {
      playTone("error");
      setStatus(error instanceof Error ? error.message : "Could not start call.");
    }
  }

  if (!conversationId) {
    return <EmptyState title="No conversation selected" body="Open an assigned work-order conversation or choose a chat thread." />;
  }

  return (
    <Panel className={compact ? "p-4" : undefined}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-civic-700">Engineer-client channel</p>
          <h2 className="mt-1 text-xl font-black text-ink-900">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={startCall}>
            <PhoneCall className="h-4 w-4" />
            Call
          </Button>
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        {messages.loading ? <SkeletonRows count={3} /> : null}
        {!messages.loading && rows.length === 0 ? (
          <EmptyState title="No messages yet" body="Send a message, voice note, or attachment to start coordination." />
        ) : null}
        {rows.map((message) => {
          const metadata = (message.metadata ?? {}) as Record<string, unknown>;
          const sender = (message.sender as GenericRecord | undefined) ?? {};
          const senderName = String(sender.fullName ?? sender.username ?? message.senderName ?? "Participant");
          return (
            <div key={String(message.id)} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar userId={sender.id ? String(sender.id) : undefined} name={senderName} size="sm" />
                  <p className="truncate text-sm font-black text-ink-900">{senderName}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ink-500">{dateLabel(String(message.createdAt ?? ""))}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">{String(message.content ?? "")}</p>
              {message.type ? <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-civic-700">{titleCase(String(message.type))}</p> : null}
              {metadata.fileName ? (
                <div className="mt-2 rounded-md bg-civic-50 px-3 py-2 text-xs font-semibold text-civic-800">
                  {metadata.downloadUrl ? (
                    <a className="underline decoration-civic-300 underline-offset-4" href={String(metadata.downloadUrl)} target="_blank" rel="noreferrer">
                      Attachment: {String(metadata.fileName)}
                    </a>
                  ) : (
                    <span>Attachment: {String(metadata.fileName)}</span>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <Field label="Message">
          <textarea
            className={`${inputClass} min-h-24 py-3`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type a message for the assigned engineer or client..."
          />
        </Field>
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={() => sendMessage()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300/80 bg-white/90 px-4 text-sm font-black text-ink-700 shadow-sm transition hover:border-civic-200 hover:bg-civic-50">
            <Paperclip className="h-4 w-4" />
            Attach
            <input className="hidden" type="file" onChange={(event) => uploadFile(event.target.files?.[0])} />
          </label>
          {recording ? (
            <Button variant="danger" onClick={stopRecording}>
              <Square className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button variant="secondary" onClick={startRecording}>
              <Mic className="h-4 w-4" />
              Voice
            </Button>
          )}
        </div>
      </div>
      {status ? <p className="mt-3 rounded-md bg-civic-50 p-3 text-sm font-semibold text-civic-800">{status}</p> : null}
    </Panel>
  );
}

function mediaTypeFor(file: File): UploadMediaType {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
