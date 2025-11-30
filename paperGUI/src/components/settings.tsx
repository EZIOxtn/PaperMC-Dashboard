import { useState, useEffect } from "react";
import { ApiClient } from "../utils/api";



export default function SettingsPanel() {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [editedProps, setEditedProps] = useState<Record<string, string>>({});
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [changesApplied, setChangesApplied] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiClient.getServerProperties();
      if (data.success) {
        setProperties(data.properties || {});
        setEditedProps({});
      } else {
        setError(data.message || "Failed to load server.properties");
      }
    } catch (err) {
      setError("Error loading server properties");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (key: string, value: string) => {
    setEditedProps((prev) => ({
      ...prev,
      [key]: value,
    }));
  };


  const handleSave = async () => {
    if (Object.keys(editedProps).length === 0) {
      setError("No changes to save");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const data = await ApiClient.updateServerProperties(editedProps);
      if (data.success) {
        setSuccess("✓ Properties saved successfully!");
        setProperties((prev) => ({ ...prev, ...editedProps }));
        setEditedProps({});
        setChangesApplied(true);
        setShowRestartDialog(true);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Failed to update properties");
      }
    } catch (err) {
      setError("Error updating server properties");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRestartServer = async () => {
    try {
      setRestarting(true);
      setShowRestartDialog(false);
      setSuccess("Restarting server...");
      const result = await ApiClient.restartServer();
      if (result.success) {
        setSuccess("✓ Server restarting with new settings!");
      } else {
        setError(result.message || "Failed to restart server");
      }
    } catch (err) {
      setError("Error restarting server");
      console.error(err);
    } finally {
      setRestarting(false);
    }
  };

  const handleDismissDialog = () => {
    setShowRestartDialog(false);
  };

  const handleReset = () => {
    setEditedProps({});
    setError("");
  };

  const hasChanges = Object.keys(editedProps).length > 0;

  // Common properties to show prominently
  const importantProps = [
    "server-name",
    "motd",
    "server-port",
    "max-players",
    "online-mode",
    "difficulty",
    "gamemode",
    "pvp",
    "spawn-protection",
    "view-distance",
    "simulation-distance",
  ];

  const sortedKeys = Object.keys(properties).sort((a, b) => {
    const aImportant = importantProps.includes(a);
    const bImportant = importantProps.includes(b);
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    return a.localeCompare(b);
  });
type PropType = "boolean" | "number" | "string";

function detectType(value: string | undefined): PropType {
  if (value === "true" || value === "false") return "boolean";
  if (value !== undefined && value.trim() !== "" && !isNaN(Number(value))) return "number";
  return "string";
}

  return (
    <>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#0f0", margin: 0 }}>Server Properties</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={loadProperties}
              disabled={loading || saving || restarting}
              style={{
                padding: "8px 16px",
                background: "#333",
                border: "none",
                color: "#0f0",
                fontWeight: "bold",
                cursor: loading || saving || restarting ? "not-allowed" : "pointer",
                borderRadius: 6,
                opacity: loading || saving || restarting ? 0.6 : 1,
              }}
            >
              Reload
            </button>
            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  disabled={saving || restarting}
                  style={{
                    padding: "8px 16px",
                    background: "#666",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: saving || restarting ? "not-allowed" : "pointer",
                    borderRadius: 6,
                    opacity: saving || restarting ? 0.6 : 1,
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || restarting}
                  style={{
                    padding: "8px 16px",
                    background: "#0f0",
                    border: "none",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: saving || restarting ? "not-allowed" : "pointer",
                    borderRadius: 6,
                    opacity: saving || restarting ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "✓ Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {success && (
          <div style={{
            background: "#0a3",
            padding: 15,
            borderRadius: 8,
            border: "2px solid #0f0",
            color: "#000",
            marginBottom: 20,
            fontWeight: "bold",
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            background: "#222",
            padding: 15,
            borderRadius: 8,
            border: "2px solid #f00",
            color: "#f00",
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: "#666" }}>Loading server.properties...</div>
        ) : sortedKeys.length === 0 ? (
          <div style={{
            background: "#222",
            padding: 15,
            borderRadius: 8,
            border: "2px solid #666",
            color: "#666",
          }}>
            No properties found. Make sure server.properties exists in the server directory.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {sortedKeys.map((key) => {
              const value = editedProps.hasOwnProperty(key) ? editedProps[key] : properties[key];
              const isEdited = editedProps.hasOwnProperty(key);
              const isImportant = importantProps.includes(key);

              return (
                <div
                  key={key}
                  style={{
                    background: isImportant ? "#1a1a1a" : "#111",
                    padding: 15,
                    borderRadius: 8,
                    border: `2px solid ${isEdited ? "#ff0" : isImportant ? "#0f0" : "#333"}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                    <div style={{ minWidth: 200, color: "#0f0", fontWeight: "bold", fontFamily: "monospace" }}>
                      {key}
                    </div>
                  {(() => {
  const type = detectType(value);

  // Dropdown options based on property key
  const dropdownOptions: Record<string, string[]> = {
    gamemode: ["survival", "creative", "adventure", "spectator"],
    difficulty: ["peaceful", "easy", "normal", "hard"],
  };

  switch (type) {
    case "boolean":
      return (
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => handlePropertyChange(key, e.target.checked ? "true" : "false")}
            style={{ transform: "scale(1.3)", cursor: "pointer" }}
          />
          <span style={{ color: "#0f0", fontSize: 13 }}>
            {value === "true" ? "Enabled" : "Disabled"}
          </span>
        </label>
      );

    case "number":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => handlePropertyChange(key, e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#000",
            border: "1px solid #0f0",
            color: "#0f0",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 14,
          }}
        />
      );

    default:
      // ⭐ If it's a gamemode or difficulty → show dropdown instead of text input
      if (dropdownOptions[key]) {
        return (
          <select
            value={value ?? ""}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "#000",
              border: "1px solid #0f0",
              color: "#0f0",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {dropdownOptions[key].map((opt) => (
              <option key={opt} value={opt} style={{ background: "#000", color: "#0f0" }}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      // Otherwise → fallback to your normal text input
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => handlePropertyChange(key, e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#000",
            border: "1px solid #0f0",
            color: "#0f0",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 14,
          }}
        />
      );
  }
})()}


                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20, padding: 15, background: "#1a1a1a", borderRadius: 8, border: "2px solid #666" }}>
          <div style={{ color: "#666", fontSize: 12, lineHeight: 1.6 }}>
            <strong style={{ color: "#0f0" }}>Note:</strong> Changes to server.properties require a server restart to take effect.
            Some properties may require additional configuration or may not be editable while the server is running.
          </div>
        </div>
      </div>

      {/* Restart Confirmation Dialog */}
      {showRestartDialog && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#111",
            border: "3px solid #0f0",
            borderRadius: 12,
            padding: 30,
            maxWidth: 500,
            boxShadow: "0 0 20px rgba(0, 255, 0, 0.3)",
          }}>
            <h3 style={{ color: "#0f0", marginTop: 0, marginBottom: 15, fontSize: 20 }}>
              Restart Server?
            </h3>
            <p style={{ color: "#ccc", marginBottom: 20, lineHeight: 1.6 }}>
              Your changes have been saved successfully! To apply these new settings, the server needs to be restarted.
            </p>
            <p style={{ color: "#888", marginBottom: 20, fontSize: 12, fontStyle: "italic" }}>
              This will disconnect all players currently on the server.
            </p>
            <div style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}>
              <button
                onClick={handleDismissDialog}
                disabled={restarting}
                style={{
                  padding: "10px 20px",
                  background: "#333",
                  border: "2px solid #666",
                  color: "#ccc",
                  fontWeight: "bold",
                  cursor: restarting ? "not-allowed" : "pointer",
                  borderRadius: 6,
                  opacity: restarting ? 0.6 : 1,
                }}
              >
                Restart Later
              </button>
              <button
                onClick={handleRestartServer}
                disabled={restarting}
                style={{
                  padding: "10px 20px",
                  background: "#f00",
                  border: "2px solid #f00",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: restarting ? "not-allowed" : "pointer",
                  borderRadius: 6,
                  opacity: restarting ? 0.6 : 1,
                }}
              >
                {restarting ? "Restarting..." : "✓ Restart Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

