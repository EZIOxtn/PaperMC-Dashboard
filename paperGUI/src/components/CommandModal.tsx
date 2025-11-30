import { useState } from "react";


interface CommandModalProps {
  onClose: () => void;
  playerN: string;
}
const COLORS = [
  { code: "§0", name: "Black", color: "#000000" },
  { code: "§1", name: "Dark Blue", color: "#0000AA" },
  { code: "§2", name: "Dark Green", color: "#00AA00" },
  { code: "§3", name: "Dark Aqua", color: "#00AAAA" },
  { code: "§4", name: "Dark Red", color: "#AA0000" },
  { code: "§5", name: "Dark Purple", color: "#AA00AA" },
  { code: "§6", name: "Gold", color: "#FFAA00" },
  { code: "§a", name: "Green", color: "#55FF55" },
  { code: "§b", name: "Aqua", color: "#55FFFF" },
  { code: "§c", name: "Red", color: "#FF5555" },
  { code: "§e", name: "Yellow", color: "#FFFF55" },
  { code: "§f", name: "White", color: "#FFFFFF" }
];
export default function CommandModal({ onClose,playerN }: CommandModalProps) {

  const [text, setText] = useState("");
  const [color, setColor] = useState("§f"); // default white
  const [loading, setLoading] = useState(false);
const sendCommand = async () => {
  setLoading(true);

  await fetch(`http://localhost:3001/api/players/message/${playerN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: color + text
    })
  });

  setLoading(false);
  onClose();
};


  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <h3 style={{ color: "#dfffe0" }}>Send Colored Text</h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter message..."
          style={styles.textarea}
        />

        <div style={{ margin: "10px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COLORS.map((c) => (
            <div
              key={c.code}
              onClick={() => setColor(c.code)}
              style={{
                width: 26,
                height: 26,
                background: c.color,
                border: color === c.code ? "2px solid #fff" : "1px solid #444",
                cursor: "pointer",
                borderRadius: 4
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button onClick={onClose} style={styles.cancel}>Cancel</button>
          <button onClick={sendCommand} style={styles.send}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },
  modal: {
    background: "#122",
    padding: 20,
    borderRadius: 10,
    width: 350,
    border: "1px solid #234",
    boxShadow: "0 0 15px #000"
  },
  textarea: {
    width: "100%",
    height: 80,
    background: "#011",
    color: "#dfffe0",
    borderRadius: 6,
    border: "1px solid #234",
    padding: 8,
    fontSize: 14
  },
  cancel: {
    background: "#300",
    padding: "8px 14px",
    border: "1px solid #511",
    borderRadius: 6,
    color: "#eee",
    cursor: "pointer"
  },
  send: {
    background: "#013301",
    padding: "8px 14px",
    border: "1px solid #234",
    borderRadius: 6,
    color: "#dfffe0",
    cursor: "pointer"
  }
};
