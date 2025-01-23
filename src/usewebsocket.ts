// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState } from "react";
import { CONSTANTS } from "./trading";

interface WebSocketHookProps {
  url: string;
  onMessage: (data: any) => void;
}

export function useWebSocket({ url, onMessage }: WebSocketHookProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connect = () => {
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        ws.current.onerror = (event) => {
          setError("WebSocket error occurred");
          console.error("WebSocket error:", event);
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          // Attempt to reconnect after delay
          setTimeout(connect, CONSTANTS.WEBSOCKET_RECONNECT_DELAY);
        };
      } catch (e) {
        setError("Failed to establish WebSocket connection");
        console.error("WebSocket connection error:", e);
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  const sendMessage = (message: any) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, error, sendMessage };
}
