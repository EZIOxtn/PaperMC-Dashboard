import { useState, useEffect, useRef } from "react";
import { ApiClient } from "../utils/api";

type ConsoleProps = {
  logs?: string[];
};

export default function ConsolePanel({ logs: initialLogs = [] }: ConsoleProps) {
  const [logs, setLogs] = useState<string[]>(initialLogs);
  const [autoScroll, setAutoScroll] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------------------
  // LOAD INITIAL LOGS + SOCKET.IO REAL-TIME LOGS
  // --------------------------------------------------------------------
  useEffect(() => {
    // Load initial logs (if API exists)
    ApiClient.getLogs(100)
      .then((data) => {
        if (data.success && data.logs) {
          setLogs(data.logs);
        }
      })
      .catch((err) => console.error("Error loading logs:", err));

    const onLog = (data: { line?: string; message?: string }) => {
      const msg = data.line || data.message;
      if (!msg) return;

      setLogs(prev => {
        if (prev[prev.length - 1] === msg) return prev;
        return [...prev, msg].slice(-1000);
      });
    };

    // Subscribe
    ApiClient.on("log", onLog);

    // Cleanup
    return () => {
      ApiClient.off("log", onLog);
    };
  }, []);

  // --------------------------------------------------------------------
  // AUTO SCROLL TO BOTTOM (when new logs arrive)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const onUserScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    const isBottom = scrollHeight - (scrollTop + clientHeight) < 40;
    setAutoScroll(isBottom);
  };

  // --------------------------------------------------------------------
  // COLORING (MC/Paper logs)
  // --------------------------------------------------------------------
  const colorize = (line: string) => {
    const u = line.toUpperCase();

    if (u.includes("ERROR") || u.includes("FATAL") || u.includes("SEVERE"))
      return { color: "#ff3b3b", fontWeight: "bold" };

    if (u.includes("WARN"))
      return { color: "#ffaa00" };

    if (u.includes("INFO"))
      return { color: "#99ccff" };

    if (u.includes("DONE") || u.includes("READY"))
      return { color: "#00ffea", fontWeight: "bold" };

    return { color: "#d9d9d9" };
  };

  // --------------------------------------------------------------------

  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #0a0a0a;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #0f0;
      border-radius: 10px;
      border: 2px solid #0a0a0a;
    }
     .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #0c0;
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        background: "#0a0a0a",
        borderRadius: "12px",
        border: "1px solid #222",
        boxShadow: "0 8px 24px rgba(0,255,0,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
        overflow: "hidden", fontFamily: "Minecraft"
      }}>
        {/* Console Header */}
        <div style={{
          padding: "12px 16px",
          background: "#111",
          borderBottom: "1px solid #222",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ color: "#0f0", fontWeight: "bold", fontSize: 16 }}>
            Live Console
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#888", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              style={{ accentColor: "#0f0" }}
            />
            Auto-scroll
          </label>
        </div>

        {/* Console Log Area */}
        <div
          ref={containerRef}
          onScroll={onUserScroll}
          className="custom-scrollbar"
          style={{
            background: "#000",
            color: "#d9d9d9", // Softer default color
            padding: "10px 15px",
            height: "430px",
            overflowY: "auto",
            fontFamily: "'Fira Code', 'Consolas', monospace",
            fontSize: 13,
            lineHeight: 1.6
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: "#777" }}>Waiting for logs...</div>
          ) : (
            logs.map((line, idx) => {
              const match = line.match(/^(\[.*?\])?\s*(.*)$/);
              const timestamp = match ? match[1] || "" : "";
              const message = match ? match[2] || "" : line;
              
              return (
                <div key={idx} style={{ display: "flex", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  <span style={{ color: "#555", marginRight: 12, userSelect: "none", minWidth: 30 }}>{idx + 1}</span>
                  <span style={{ color: "#888", marginRight: 12 }}>{timestamp}</span>
                  <span style={colorize(message)}>{message}</span>
                </div>
              );
            })
          )}

          <div ref={endRef} />
        </div>
      </div>
    </>
  );
}
