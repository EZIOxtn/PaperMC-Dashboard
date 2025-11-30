import { useState, useEffect } from "react";
import { ApiClient } from "../utils/api";

export default function ServerControls() {
  const [status, setStatus] = useState<"stopped" | "starting" | "running" | "stopping">("stopped");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get initial status
    ApiClient.getServerStatus().then((data) => {
      setStatus(data.status);
    });

    // Listen for status updates via WebSocket
    const handleStatus = (data: { status: string }) => {
      setStatus(data.status as any);
      setLoading(false);
    };

    ApiClient.on("status", handleStatus);
    return () => ApiClient.off("status", handleStatus);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    await ApiClient.startServer();
  };

  const handleStop = async () => {
    setLoading(true);
    await ApiClient.stopServer();
  };

  const handleRestart = async () => {
    setLoading(true);
    await ApiClient.restartServer();
  };

  const btnStyle = (disabled: boolean) => ({
    padding: "10px 20px",
    background: disabled ? "#666" : "#0f0",
    border: "none",
    color: disabled ? "#999" : "#000",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 6,
    opacity: loading ? 0.6 : 1,
  } as const);

  const canStart = status === "stopped" && !loading;
  const canStop = status === "running" && !loading;
  const canRestart = status === "running" && !loading;

  return (
   <div
  style={{
    display: "flex",
    gap: 15,
    marginBottom: 25,
    alignItems: "center",
    padding: "14px 20px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
  }}
>
  <button style={btnStyle(!canStart)} onClick={handleStart} disabled={!canStart}>
    ▶ Start
  </button>

  <button style={btnStyle(!canStop)} onClick={handleStop} disabled={!canStop}>
    ■ Stop
  </button>

  <button style={btnStyle(!canRestart)} onClick={handleRestart} disabled={!canRestart}>
    ↻ Restart
  </button>

  <div
    style={{
      marginLeft: "auto",
      color: status === "running" ? "#0f0" : "#f33",
      fontWeight: "bold",
      padding: "6px 14px",
      borderRadius: 8,
      background: "rgba(0,0,0,0.3)",
      border: `1px solid ${status === "running" ? "#0f0" : "#f33"}`,
      letterSpacing: "1px",
    }}
  >
    ● {status.toUpperCase()}
  </div>
</div>

  );
}
  