import { useState, useEffect } from "react";
import { ApiClient } from "../utils/api";

export default function TPSPanel() {
  const [tps, setTps] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [tpsHistory, setTpsHistory] = useState<number[]>([]);

  useEffect(() => {
    loadTPS();
    const interval = setInterval(loadTPS, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTPS = async () => {
  try {
    setLoading(false);
    const data = await ApiClient.getTPS();

    if (data.success) {
      const currentTps = data.data?.tps1m ?? 0;
      setTps(currentTps);
      setError("");

      setTpsHistory((prev) => {
        const newHistory = [...prev, currentTps];
        return newHistory.slice(-30);
      });
    } else {
      setError(data.message || "Failed to load TPS");
    }
  } catch (err) {
    setError("Error loading TPS");
    console.error(err);
  }
};


  const getTPSColor = (tpsValue: number) => {
    if (tpsValue >= 19.5) return "#0f0"; // Excellent
    if (tpsValue >= 18) return "#ff0"; // Good
    if (tpsValue >= 15) return "#fa0"; // Moderate
    return "#f00"; // Poor
  };

  const getTPSStatus = (tpsValue: number) => {
    if (tpsValue >= 19.5) return "Excellent";
    if (tpsValue >= 18) return "Good";
    if (tpsValue >= 15) return "Moderate";
    return "Poor";
  };

  return (<div
  style={{
    padding: 25,
    background: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    border: "1px solid #0f0",
    boxShadow: "0 0 14px #0f03",
  }}
>
  <h2
    style={{
      color: "#0f0",
      marginBottom: 25,
      fontFamily: "Consolas, monospace",
      letterSpacing: 1,
      textShadow: "0 0 8px #0f06",
    }}
  >
    TPS Monitor
  </h2>

  <div
    style={{
      display: "flex",
      gap: 40,
      marginBottom: 35,
      alignItems: "center",
    }}
  >
    {/* CURRENT TPS CARD */}
    <div
      style={{
        padding: 20,
        background: "#0a0a0a",
        borderRadius: 10,
        border: `1px solid ${getTPSColor(tps)}`,
        boxShadow: `0 0 12px ${getTPSColor(tps)}33 inset`,
        minWidth: 180,
      }}
    >
      <div style={{ color: "#666", fontSize: 14, marginBottom: 5 }}>
        Current TPS
      </div>

      <div
        style={{
          fontSize: 54,
          fontWeight: "bold",
          color: getTPSColor(tps),
          fontFamily: "Consolas, monospace",
          textShadow: `0 0 12px ${getTPSColor(tps)}55`,
        }}
      >
        {tps.toFixed(2)}
      </div>

      <div
        style={{
          color: getTPSColor(tps),
          fontSize: 16,
          marginTop: 8,
          fontWeight: "bold",
          textShadow: `0 0 6px ${getTPSColor(tps)}55`,
        }}
      >
        {getTPSStatus(tps)}
      </div>
    </div>

    {/* TPS HISTORY */}
    <div style={{ flex: 1 }}>
      <div
        style={{
          color: "#888",
          fontSize: 14,
          marginBottom: 12,
        }}
      >
        TPS History (Last 30 readings)
      </div>

      <div
        style={{
          background: "#050505",
          padding: 18,
          borderRadius: 10,
          border: "1px solid #0f0",
          height: 160,
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          boxShadow: "0 0 10px #0f02 inset",
        }}
      >
        {tpsHistory.length === 0 ? (
          <div
            style={{
              color: "#555",
              width: "100%",
              textAlign: "center",
              fontFamily: "Consolas, monospace",
            }}
          >
            No data yet
          </div>
        ) : (
          tpsHistory.map((value, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                background: getTPSColor(value),
                height: `${(value / 20) * 100}%`,
                minHeight: 3,
                borderRadius: 3,
                boxShadow: `0 0 6px ${getTPSColor(value)}99`,
                transition: "height 0.15s ease",
              }}
              title={`${value.toFixed(2)} TPS`}
            />
          ))
        )}
      </div>
    </div>
  </div>

  {/* ERROR BOX */}
  {error && (
    <div
      style={{
        background: "#190000",
        padding: 15,
        borderRadius: 8,
        border: "2px solid #f00",
        color: "#f55",
        marginBottom: 25,
        boxShadow: "0 0 12px #f003 inset",
        fontFamily: "Consolas, monospace",
      }}
    >
      {error}
    </div>
  )}

  {/* FOOTER INFO */}
  <div style={{ marginTop: 20, color: "#777", fontSize: 12, lineHeight: 1.6 }}>
    <div>TPS Range: 0.0 — 20.0</div>
    <div>Target: 20.0 TPS (1 tick per 50ms)</div>

    <div style={{ marginTop: 12 }}>
      Note: For accurate TPS monitoring, install the{" "}
      <span
        style={{
          color: "#0f0",
          fontFamily: "Consolas, monospace",
          textShadow: "0 0 4px #0f05",
        }}
      >
        spark
      </span>{" "}
      plugin or configure RCON.
    </div>
  </div>
</div>

  );
}

