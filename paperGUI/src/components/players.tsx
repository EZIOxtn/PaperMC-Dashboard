import { useState, useEffect } from "react";
import { ApiClient } from "../utils/api";
import { useNavigate } from "react-router-dom";


interface Player {
  name: string;
  uuid?: string | null;
  skin?: string | null;
  status?: string;
  lastLogin?: number;
}

interface BannedPlayer {
  name: string;
  uuid?: string;
  created?: string;
  source?: string;
  reason?: string;
  expires?: string;
}
interface PlayerHeadProps {
  skin: string; // URL or Base64 of the Minecraft skin
  size?: number; // Size of the head image
  overlay?: boolean; 
}

type FaceAvatarProps = {
  skinUrl: string;        // URL of the Minecraft skin
  scale?: number;         // scaling factor
  overlay?: boolean;      // render hat layer
};

export default function PlayersPanel() {
  const navigate = useNavigate();
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [bannedPlayers, setBannedPlayers] = useState<BannedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [banReasonInput, setBanReasonInput] = useState<string>("");
  const [headSrc, setHeadSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // New state for loading
    

  useEffect(() => {
    loadPlayers();
    const interval = setInterval(loadPlayers, 60000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const [playersData, bannedData] = await Promise.all([
        ApiClient.getPlayers(),
        ApiClient.getBannedPlayers()
      ]);
      
      if (playersData.success) {
        setOnlinePlayers(playersData.players || []);
        setAllPlayers(playersData.allPlayers || []);
        setError("");
      } else {
        setError(playersData.message || "Failed to load players");
        setOnlinePlayers([]);
      }

      if (bannedData.success) {
        setBannedPlayers(bannedData.bannedPlayers || []);
      }
    } catch (err) {
      setError("Error loading players");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  

function PlayerHead({ skin , size = 64 , overlay = true}: PlayerHeadProps) {
  const [headSrc, setHeadSrc] = useState<string>(skin); // fallback to full skin

  useEffect(() => {
   if (!skin) return;

        // The 'size' variable in your original code is the final pixel size (e.g., 64).
        // The 'scale' needed for renderFaceJS is the factor (size / 8).
       
    async function renderFaceJS() {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = skin;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load skin image"));
        });

        const HEAD_X = 8, HEAD_Y = 8, LAYER_SIZE = 8;
        const OVERLAY_X = 40, OVERLAY_Y = 8;

        const finalWidth = LAYER_SIZE * size;
        const finalHeight = LAYER_SIZE * size;

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = finalWidth;
        finalCanvas.height = finalHeight;
        const ctx = finalCanvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        // Draw head front
        ctx.drawImage(img, HEAD_X, HEAD_Y, LAYER_SIZE, LAYER_SIZE, 0, 0, finalWidth, finalHeight);

        // Draw overlay if enabled
        if (overlay) {
          ctx.drawImage(img, OVERLAY_X, OVERLAY_Y, LAYER_SIZE, LAYER_SIZE, 0, 0, finalWidth, finalHeight);
        }

        setHeadSrc(finalCanvas.toDataURL("image/png"));
      } catch (err) {
        console.error(err);
      }
    }

    renderFaceJS();
    // Dependencies: Rerun effect whenever skin URL, size, or overlay changes
    }, [skin, size, overlay, setHeadSrc]);

  return (<img
      src={headSrc}
      width={size}
      height={size}
      alt="Player Head"
      style={{ imageRendering: "pixelated" }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/src/assets/steve.jpg";
      }}
    />
    );
}
const handlekill = async (playerName: string) => {
    try {
      const result = await ApiClient.killPlayer(playerName);
      if (result.success) {
        setSuccess(`✓ ${playerName} has been killed`);
        await loadPlayers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }

  };

  const handleBanClick = (playerName: string) => {
    setSelectedPlayer(playerName);
    setBanReasonInput("");
    setShowBanModal(true);
  };

  const confirmBan = async () => {
    if (!selectedPlayer) return;

    try {
      const result = await ApiClient.banPlayer(selectedPlayer, banReasonInput || "Banned by admin");
      if (result.success) {
        setSuccess(`✓ ${selectedPlayer} has been banned`);
        setShowBanModal(false);
        await loadPlayers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Failed to ban player");
      }
    } catch (err) {
      setError("Error banning player");
      console.error(err);
    }
  };

  const handleUnban = async (playerName: string) => {
    try {
      const result = await ApiClient.unbanPlayer(playerName);
      if (result.success) {
        setSuccess(`✓ ${playerName} has been unbanned`);
        await loadPlayers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message || "Failed to unban player");
      }
    } catch (err) {
      setError("Error unbanning player");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Minecraft" }}>
      {success && (
        <div style={{
          background: "#0a3",
          padding: 12,
          borderRadius: 6,
          border: "2px solid #0f0",
          color: "#000",
          marginBottom: 15,
          fontWeight: "bold",
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: "#300",
          padding: 12,
          borderRadius: 6,
          border: "2px solid #f00",
          color: "#f00",
          marginBottom: 15,
          fontWeight: "bold",
        }}>
          {error}
        </div>
      )}

      <h2 style={{ color: "#0f0", marginBottom: 20 }}>
        Online Players ({onlinePlayers.length})
      </h2>
      
      {loading && onlinePlayers.length === 0 ? (
        <div style={{ color: "#666" }}>Loading players...</div>
      ) : onlinePlayers.length === 0 ? (
        <div style={{ 
          background: "#222", 
          padding: 15, 
          borderRadius: 8, 
          border: "2px solid #666",
          color: "#666"
        }}>
          No players online
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
          {onlinePlayers.map((player, index) => (
            <div
              key={player.uuid || index}
              style={{
                background: "#111",
                padding: 15,
                borderRadius: 8,
                border: "2px solid #0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 15,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <PlayerHead
                  skin={player.skin ||"./assets/steve.jpg"}
                  size={64}
                />
                <div>
                  <div style={{ color: "#0f0", fontSize: 16, fontWeight: "bold" }}>
                    {player.name}
                  </div>
                  {player.status && (
                    <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                      Status: {player.status}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {player.uuid && (
                  <div style={{ color: "#666", fontSize: 12, fontFamily: "monospace" }}>
                    {player.uuid.substring(0, 8)}...
                  </div>
                )}
                <button
                  onClick={() => navigate(`/player/${player.name}`)}
                  style={{
                    padding: "6px 12px",
                    background: "#0f0",
                    border: "none",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  Details
                </button>
                <button
                  onClick={() => handleBanClick(player.name)}
                  style={{
                    padding: "6px 12px",
                    background: "#f00",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  Ban
                </button>
                <button
                  onClick={() => handlekill(player.name)}
                   style={{
                    padding: "6px 12px",
                    background: "rgba(40, 7, 140, 1)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                 kill
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    {allPlayers.length > 0 && (
  <div style={{ marginBottom: 40 }}>
    <h3 style={{ 
      color: "#aaa", 
      marginBottom: 20, 
      fontSize: 16, 
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1
    }}>
      All Players ({allPlayers.length})
    </h3>
    <div style={{ 
      background: "#1a1a1a", 
      padding: 20, 
      borderRadius: 12, 
      border: "2px solid #444",
      maxHeight: 400,
      overflowY: "auto",
      boxShadow: "0 0 15px rgba(0,0,0,0.5)"
    }}>
      {allPlayers.map((player, index) => (
        <div
          key={player.uuid || index}
          style={{
            padding: 12,
            borderBottom: index < allPlayers.length - 1 ? "1px solid #333" : "none",
            color: "#ddd",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
            transition: "background 0.2s, transform 0.2s",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = "#222";
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
        >
          {/* Player Head and Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PlayerHead
              skin={player.skin || "./assets/steve.jpg"}
              size={48} // Bigger head
            />
            <span style={{ fontWeight: "bold", fontSize: 16 }}>{player.name}</span>
          </div>

          {/* UUID */}
          <span style={{ fontFamily: "monospace", color: "#999", fontSize: 13 }}>
            {player.uuid ? player.uuid.substring(0, 8) : "N/A"}
          </span>
          <button
                  onClick={() => handleBanClick(player.name)}
                  style={{
                    padding: "6px 12px",
                    background: "#f00",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  Ban
                </button>
        </div>
      ))}
    </div>
  </div>
)}


      {bannedPlayers.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: "#f00", marginBottom: 15, fontSize: 16, fontWeight: "bold" }}>
            🚫 Banned Players ({bannedPlayers.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bannedPlayers.map((player, index) => (
              <div
                key={player.uuid || index}
                style={{
                  background: "#1a0a0a",
                  padding: 15,
                  borderRadius: 8,
                  border: "2px solid #f00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 15,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f00", fontSize: 16, fontWeight: "bold" }}>
                    {player.name}
                  </div>
                  {player.reason && (
                    <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                      Reason: {player.reason}
                    </div>
                  )}
                  {player.created && (
                    <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
                      Banned: {new Date(player.created).toLocaleString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleUnban(player.name)}
                  style={{
                    padding: "6px 12px",
                    background: "#0f0",
                    border: "none",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: "pointer",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  Unban
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, color: "#666", fontSize: 12 }}>
        Note: Online players are detected from server logs. All players are loaded from usercache.json. Banned players are loaded from banned-players.json.
      </div>

      {/* Ban Player Modal */}
      {showBanModal && (
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
            border: "3px solid #f00",
            borderRadius: 12,
            padding: 30,
            maxWidth: 400,
            boxShadow: "0 0 20px rgba(255, 0, 0, 0.3)",
          }}>
            <h3 style={{ color: "#f00", marginTop: 0, marginBottom: 15, fontSize: 20 }}>
              Ban Player?
            </h3>
            <p style={{ color: "#ccc", marginBottom: 15, lineHeight: 1.6 }}>
              You are about to ban: <strong style={{ color: "#0f0" }}>{selectedPlayer}</strong>
            </p>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: "#888", display: "block", marginBottom: 8, fontSize: 12 }}>
                Ban Reason (optional):
              </label>
              <input
                type="text"
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="Enter ban reason..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "#000",
                  border: "1px solid #f00",
                  color: "#f00",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowBanModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "#333",
                  border: "2px solid #666",
                  color: "#ccc",
                  fontWeight: "bold",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                style={{
                  padding: "10px 20px",
                  background: "#f00",
                  border: "2px solid #f00",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                ✓ Ban Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

