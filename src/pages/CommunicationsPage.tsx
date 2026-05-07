import { MessageSquare, PhoneCall } from "lucide-react";

import { moduleApi } from "../api/services";
import { ResourcePage } from "./ResourcePage";
import { Badge } from "../components/ui";

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
  return (
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
        { label: "ring", run: (row) => moduleApi.post(`/calls/${row.id}/ring`, { note: "Ring from RRIMS frontend" }) },
        { label: "end", run: (row) => moduleApi.post(`/calls/${row.id}/end`, { reason: "Ended from RRIMS frontend" }) },
      ]}
    />
  );
}
