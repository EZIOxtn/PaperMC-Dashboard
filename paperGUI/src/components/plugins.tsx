import { useState, useEffect } from "react";
import { ApiClient } from "../utils/api";

type Plugin = {
  name: string;
  file: string;
  enabled: boolean;
};

export default function PluginsPanel() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getPlugins();
      if (data.success) {
        setPlugins(data.plugins || []);
      } else {
        setError(data.message || "Failed to load plugins");
      }
    } catch (err) {
      setError("Error loading plugins");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div style={{ padding: 20 }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    }}
  >
    <h2
      style={{
        color: "#0f0",
        margin: 0,
        fontFamily: "Consolas, monospace",
        textShadow: "0 0 6px #0f0",
        letterSpacing: 1,
      }}
    >
      Plugins
    </h2>

    <button
      onClick={loadPlugins}
      style={{
        padding: "8px 18px",
        background: "#0f0",
        border: "2px solid #0f0",
        color: "#000",
        fontWeight: "bold",
        cursor: "pointer",
        borderRadius: 6,
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 12px #0f0")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      Refresh
    </button>
  </div>

  {/* Loading */}
  {loading && plugins.length === 0 ? (
    <div style={{ color: "#666", fontFamily: "monospace" }}>
      Loading plugins...
    </div>
  ) : error ? (
    <div
      style={{
        background: "#200",
        padding: 15,
        borderRadius: 8,
        border: "2px solid #f00",
        color: "#f00",
        fontFamily: "Consolas, monospace",
      }}
    >
      {error}
    </div>
  ) : plugins.length === 0 ? (
    <div
      style={{
        background: "#111",
        padding: 15,
        borderRadius: 8,
        border: "2px solid #666",
        color: "#666",
        fontFamily: "Consolas, monospace",
      }}
    >
      No plugins found.  
      Plugins should be in the{" "}
      <span style={{ color: "#0f0" }}>plugins/</span> directory.
    </div>
  ) : (
    <>
      <div
        style={{
          color: "#666",
          marginBottom: 15,
          fontFamily: "monospace",
        }}
      >
        Found <span style={{ color: "#0f0" }}>{plugins.length}</span>{" "}
        plugin{plugins.length !== 1 ? "s" : ""}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {plugins.map((plugin, index) => (
          <div
            key={index}
            style={{
              background: "#0a0a0a",
              padding: 18,
              borderRadius: 8,
              border: `2px solid ${plugin.enabled ? "#0f0" : "#333"}`,
              boxShadow: plugin.enabled
                ? "0 0 12px #0f055"
                : "0 0 8px #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = plugin.enabled
                ? "0 0 16px #0f0"
                : "0 0 10px #333")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = plugin.enabled
                ? "0 0 12px #0f055"
                : "0 0 8px #000")
            }
          >
            <div>
              <div
                style={{
                  color: plugin.enabled ? "#0f0" : "#666",
                  fontSize: 17,
                  fontWeight: "bold",
                  fontFamily: "Consolas, monospace",
                  textShadow: plugin.enabled ? "0 0 6px #0f0" : "none",
                }}
              >
                {plugin.name}
              </div>

              <div
                style={{
                  color: "#666",
                  fontSize: 12,
                  fontFamily: "monospace",
                  marginTop: 5,
                }}
              >
                {plugin.file}
              </div>
            </div>

            <div
              style={{
                padding: "4px 12px",
                background: plugin.enabled ? "#0f0" : "#444",
                color: plugin.enabled ? "#000" : "#ccc",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: "bold",
                fontFamily: "Consolas",
                textShadow: plugin.enabled ? "0 0 5px #0f0" : "none",
                border: plugin.enabled ? "1px solid #0f0" : "1px solid #444",
              }}
            >
              {plugin.enabled ? "ENABLED" : "DISABLED"}
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>

  );
}

