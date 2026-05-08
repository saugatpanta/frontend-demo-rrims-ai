import { useEffect, useRef } from "react";

import { buildApiUrl } from "../api/client";

type StreamEvent = {
  event: string;
  data: unknown;
};

export function useRealtimeStream(
  path: string | null | undefined,
  query: Record<string, string | number | boolean | undefined | null> | undefined,
  onEvent: (event: StreamEvent) => void,
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!path) return;

    const controller = new AbortController();
    const streamPath = path;
    let buffer = "";

    async function connect() {
      try {
        const response = await fetch(buildApiUrl(streamPath, query), {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          chunks.forEach((chunk) => {
            const parsed = parseSseChunk(chunk);
            if (parsed) onEventRef.current(parsed);
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Realtime stream disconnected", error);
        }
      }
    }

    connect();
    return () => controller.abort();
  }, [path, JSON.stringify(query)]);
}

function parseSseChunk(chunk: string): StreamEvent | null {
  const lines = chunk.split("\n");
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "message";
  const dataLines = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  if (!dataLines.length) return { event, data: null };
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return { event, data: dataLines.join("\n") };
  }
}
