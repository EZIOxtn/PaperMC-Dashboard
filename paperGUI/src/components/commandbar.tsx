import { useState } from "react";
import { ApiClient } from "../utils/api";

export default function CommandBar() {
  const [cmd, setCmd] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCommand = async (command: string) => {
    if (!command.trim() || loading) return;

    setLoading(true);
    try {
      await ApiClient.executeCommand(command);
      setCmd(""); // Clear input only for manual commands
    } catch (err) {
      console.error("Error executing command:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendCommand(cmd);
  };

  return (
    <div
  style={{
    marginTop: 15,
    padding: "15px 18px",
    background: "rgba(0,0,0,0.6)",
    border: "1px solid #0f0",
    borderRadius: 12,
    boxShadow: "0 0 12px #0f03", fontFamily: "Minecraft"
  }}
>
  {/* INPUT + SEND BUTTON */}
  <form
    onSubmit={handleSubmit}
    style={{
      display: "flex",
      gap: 12,
      alignItems: "center",
    }}
  >
    <input
      value={cmd}
      onChange={(e) => setCmd(e.target.value)}
      placeholder="Enter command..."
      disabled={loading}
      style={{
        flex: 1,
        padding: "12px",
        background: "#050505",
        border: "2px solid #0f0",
        color: "#0f0",
        borderRadius: 8,
        fontFamily: "Consolas, monospace",
        fontSize: 15,
        boxShadow: "0 0 8px #0f03 inset",
        transition: "0.15s",
        opacity: loading ? 0.6 : 1,
      }}
    />

    <button
      type="submit"
      disabled={loading || !cmd.trim()}
      style={{
        padding: "12px 22px",
        background: loading || !cmd.trim() ? "#333" : "#0f0",
        borderRadius: 8,
        color: loading || !cmd.trim() ? "#777" : "#000",
        border: "2px solid #0f0",
        fontWeight: "bold",
        cursor: loading || !cmd.trim() ? "not-allowed" : "pointer",
        fontFamily: "Consolas, monospace",
        boxShadow:
          loading || !cmd.trim()
            ? "none"
            : "0 0 10px #0f07, 0 0 3px #0f0 inset",
        transition: "0.15s",
      }}
    >
      {loading ? "Sending..." : "Send"}
    </button>
  </form>

  {/* QUICK COMMAND BUTTONS */}
  <div
  style={{
    marginTop: 14,
    display: "flex",
    flexDirection: "column", // stack all main groups vertically
    gap: 20,
    paddingTop: 10,
    borderTop: "1px solid #0f04",
  }}
>
  {/* General Commands */}
  <div style={{ color: "#0f0", fontWeight: "bold", fontSize: 16 }}>
      Quick CMD:
    </div>
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <QuickButton label="List players" cmd="list" send={sendCommand} />
    <QuickButton label="TPS" cmd="tps" send={sendCommand} />
    <QuickButton label="Plugins" cmd="plugins" send={sendCommand} />
    <QuickButton
      label="Broadcast (test)"
      cmd='say §aThis is a broadcast test'
      send={sendCommand}
    />
    <QuickButton label="Day" cmd="time set day" send={sendCommand} />
    <QuickButton label="Night" cmd="time set night" send={sendCommand} />
    <QuickButton label="Kill all mobs" cmd="kill @e[type=!player]" send={sendCommand} />
    <QuickButton label="Save World" cmd="save-all" send={sendCommand} />
  </div>

  {/* Gamemode */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      paddingTop: 10,
      borderTop: "1px solid #0f04",
    }}
  >
    <div style={{ color: "#0f0", fontWeight: "bold", fontSize: 16 }}>
      Players Gamemode:
    </div>
    <QuickButton label="creative" cmd="gamemode creative @a" send={sendCommand} />
    <QuickButton label="survival" cmd="gamemode survival @a" send={sendCommand} />
    <QuickButton label="adventure" cmd="gamemode adventure @a" send={sendCommand} />
    <QuickButton label="spectator" cmd="gamemode spectator @a" send={sendCommand} />
  </div>

  {/* Difficulty */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      paddingTop: 10,
      borderTop: "1px solid #0f04",
    }}
  >
    <div style={{ color: "#0f0", fontWeight: "bold", fontSize: 16 }}>
      Server Difficulty:
    </div>
    <QuickButton label="Hard" cmd="difficulty hard" send={sendCommand} />
    <QuickButton label="Normal" cmd="difficulty normal" send={sendCommand} />
    <QuickButton label="Easy" cmd="difficulty easy" send={sendCommand} />
    <QuickButton label="Peaceful" cmd="difficulty peaceful" send={sendCommand} />
  </div>
</div>

</div>

  );
}

function QuickButton({
  label,
  cmd,
  send,
}: {
  label: string;
  cmd: string;
  send: (cmd: string) => void;
}) {
  return (<button
  onClick={() => send(cmd)}
  style={{
    padding: "8px 16px",
    background: "rgba(0, 0, 0, 0.6)",
    border: "2px solid #0f0",
    color: "#0f0",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Consolas, monospace",
    letterSpacing: "0.5px",
    transition: "all 0.2s ease",
    boxShadow: "0 0 8px #0f03, inset 0 0 4px #0f03",
  }}
  onMouseEnter={(e) => {
    const btn = e.currentTarget as HTMLButtonElement; //  ✔ safe
    btn.style.background = "#0f0";
    btn.style.color = "#000";
    btn.style.boxShadow = "0 0 12px #0f07, inset 0 0 6px #0f05";
    btn.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
    const btn = e.currentTarget as HTMLButtonElement; //  ✔ safe
    btn.style.background = "rgba(0,0,0,0.6)";
    btn.style.color = "#0f0";
    btn.style.boxShadow = "0 0 8px #0f03, inset 0 0 4px #0f03";
    btn.style.transform = "translateY(0)";
  }}
>
  {label}
</button>

  );
}
