import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { callsApi } from "../api/services";
import { Button, Panel } from "./ui";
import { useRealtimeStream } from "../hooks/useRealtimeStream";
import { playTone } from "../utils/sound";

export function CallRoom({
  callId,
  onEnded,
}: {
  callId?: string;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef<any>(null);
  const [status, setStatus] = useState("");
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  useRealtimeStream(callId ? "/calls/stream" : null, { callId }, ({ event, data }) => {
    if (["ping", "connected"].includes(event)) return;
    setEvents((items) => [`${event}: ${JSON.stringify(data).slice(0, 120)}`, ...items].slice(0, 5));
  });

  useEffect(() => {
    if (!callId) return;
    connectTwilioRoom();

    return () => {
      roomRef.current?.disconnect?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (remoteRef.current) remoteRef.current.innerHTML = "";
    };
  }, [callId]);

  async function connectTwilioRoom() {
    if (!callId) return;
    try {
      setStatus("Connecting secure media room...");
      const [{ connect }, tokenPayload] = await Promise.all([
        import("twilio-video"),
        callsApi.twilioToken(callId),
      ]);
      const token = String(tokenPayload.token ?? "");
      const roomName = String(tokenPayload.roomName ?? "");
      if (!token) throw new Error("Twilio token was not returned by the backend.");
      const room = await connect(token, { name: roomName || undefined, audio: true, video: false });
      roomRef.current = room;
      setMic(true);
      setCamera(false);
      setStatus(`Connected to ${room.name}. Waiting for the other participant.`);
      callsApi.join(callId).catch(() => undefined);

      room.localParticipant.audioTracks.forEach((publication: any) => {
        publication.track?.enable?.();
      });

      room.participants.forEach(attachParticipant);
      room.on("participantConnected", attachParticipant);
      room.on("participantDisconnected", detachParticipant);
      room.on("disconnected", () => {
        if (remoteRef.current) remoteRef.current.innerHTML = "";
      });
    } catch (error) {
      await startMedia(false);
      callsApi.join(callId).catch(() => undefined);
      setStatus(
        error instanceof Error
          ? `${error.message} Local media fallback is active.`
          : "Local media fallback is active.",
      );
    }
  }

  function attachParticipant(participant: any) {
    participant.tracks?.forEach((publication: any) => {
      if (publication.track) attachTrack(publication.track);
    });
    participant.on?.("trackSubscribed", attachTrack);
    participant.on?.("trackUnsubscribed", detachTrack);
  }

  function detachParticipant(participant: any) {
    participant.tracks?.forEach((publication: any) => {
      if (publication.track) detachTrack(publication.track);
    });
  }

  function attachTrack(track: any) {
    if (!remoteRef.current || !track.attach) return;
    const element = track.attach();
    element.className = "h-full w-full object-cover";
    remoteRef.current.appendChild(element);
  }

  function detachTrack(track: any) {
    track.detach?.().forEach((element: HTMLElement) => element.remove());
  }

  async function startMedia(withVideo: boolean) {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera(withVideo);
      setMic(true);
      setStatus(withVideo ? "Camera and microphone are live." : "Microphone is live.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not access microphone/camera.");
    }
  }

  function toggleMic() {
    const next = !mic;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    roomRef.current?.localParticipant?.audioTracks?.forEach((publication: any) => {
      next ? publication.track?.enable?.() : publication.track?.disable?.();
    });
    setMic(next);
  }

  async function toggleCamera() {
    if (!camera) {
      if (roomRef.current) {
        const { createLocalVideoTrack } = await import("twilio-video");
        const track = await createLocalVideoTrack();
        await roomRef.current.localParticipant.publishTrack(track);
        if (videoRef.current) videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
        setCamera(true);
        return;
      }
      await startMedia(true);
      return;
    }
    streamRef.current?.getVideoTracks().forEach((track) => track.stop());
    roomRef.current?.localParticipant?.videoTracks?.forEach((publication: any) => {
      publication.track?.stop?.();
      roomRef.current.localParticipant.unpublishTrack(publication.track);
    });
    setCamera(false);
  }

  async function endCall() {
    if (callId) await callsApi.end(callId, "Ended from call room");
    roomRef.current?.disconnect?.();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    playTone("success");
    onEnded();
  }

  if (!callId) return null;

  return (
    <Panel className="mt-4 border-civic-100 bg-civic-50/80">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-950">
          <div ref={remoteRef} className="absolute inset-0" />
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {!camera ? (
            <div className="absolute inset-0 grid place-items-center text-center text-white">
              <div>
                <p className="text-lg font-black">Voice call active</p>
                <p className="mt-1 text-sm text-white/70">Turn on camera for video preview.</p>
              </div>
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-civic-700">Live call room</p>
          <h3 className="mt-1 text-xl font-black text-ink-900">Call session connected</h3>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            This room controls browser microphone/camera and backend call state. Twilio/WebRTC peer media can plug into this same room using the issued call token.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={toggleMic}>{mic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}{mic ? "Mute" : "Unmute"}</Button>
            <Button variant="secondary" onClick={toggleCamera}>{camera ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}{camera ? "Camera off" : "Camera on"}</Button>
            <Button variant="danger" onClick={endCall}><PhoneOff className="h-4 w-4" />End</Button>
          </div>
          {status ? <p className="mt-3 rounded-md bg-white p-3 text-sm font-semibold text-ink-700">{status}</p> : null}
          {events.length ? (
            <div className="mt-3 space-y-2">
              {events.map((item, index) => (
                <p key={index} className="rounded-md bg-white/80 px-3 py-2 text-xs font-semibold text-ink-600">{item}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
