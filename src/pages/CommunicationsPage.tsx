import { MessageSquare, PhoneCall, Volume2 } from "lucide-react";
import { useState } from "react";

import { moduleApi } from "../api/services";
import { ResourcePage } from "./ResourcePage";
import { Badge, Button, Panel } from "../components/ui";
import { playTone } from "../utils/sound";

export function ChatPage() {
  return (
    <ResourcePage
      title="Chat"
      eyebrow="Real-time communication"
      path="/chat/conversations"
      searchPlaceholder="Search conversations"
      description="Conversation inbox for citizen, engineer, and officer coordination. Message streams, participants, attachments, archive, mute, and read state are backed by the chat API."
      columns={[
        { header: "Conversation", cell: (row) => <div className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.title ?? row.subject ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.lastMessage ?? row.type ?? "Conversation")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? row.state ?? "ACTIVE")} /> },
        { header: "Unread", cell: (row) => String(row.unreadCount ?? row.unread ?? 0) },
        { header: "Updated", key: "updatedAt" },
      ]}
      actions={[
        { label: "mark read", run: (row) => moduleApi.patch(`/chat/conversations/${row.id}/read`) },
      ]}
    />
  );
}

export function CallsPage() {
  const [message, setMessage] = useState("");

  async function callAction(kind: "ring" | "end", id: unknown) {
    setMessage("");
    try {
      if (kind === "ring") {
        playTone("ring");
        await moduleApi.post(`/calls/${id}/ring`, { note: "Ring from RRIMS frontend" });
      } else {
        await moduleApi.post(`/calls/${id}/end`, { reason: "Ended from RRIMS frontend" });
        playTone("success");
      }
      setMessage(`${kind} action sent successfully.`);
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Call action failed.");
    }
  }

  return (
    <>
      <Panel className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-civic-700" />
            <div>
              <h2 className="font-bold text-ink-900">Sound enabled call console</h2>
              <p className="text-sm text-ink-500">Browser sound plays on user-triggered ring, success, and error events.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => playTone("ring")}>Test ring</Button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-civic-50 p-3 text-sm font-medium text-civic-800">{message}</p> : null}
      </Panel>
      <ResourcePage
        title="Calls"
        eyebrow="Voice and video response"
        path="/calls/active"
        searchPlaceholder="Search active calls"
        description="Active emergency and coordination calls. The backend also exposes history, participants, Twilio token issuance, signaling, and call timeline routes."
        columns={[
          { header: "Call", cell: (row) => <div className="flex items-center gap-3"><PhoneCall className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.title ?? row.callType ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.roomName ?? row.channel ?? "Live call")}</p></div></div> },
          { header: "Status", cell: (row) => <Badge value={String(row.status ?? "ACTIVE")} /> },
          { header: "Started", key: "startedAt" },
          { header: "Participants", cell: (row) => String(row.participantCount ?? row.participants ?? 0) },
        ]}
        actions={[
          { label: "ring", run: (row) => callAction("ring", row.id) },
          { label: "end", run: (row) => callAction("end", row.id) },
        ]}
      />
    </>
  );
}
