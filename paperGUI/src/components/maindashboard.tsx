import { useEffect, useState, useRef } from 'react';
import { ApiClient } from '../utils/api';






type ServerStats = {
  success: boolean;
  server: {
    status: string;
    difficulty: string;
    worldType: string;
  };
  worlds: Array<{
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
  }>;
  players: {
    online: number;
    total: number;
    maxPlayers: number;
  };
  ram: {
    total: number;
    totalFormatted: string;
    used: number;
    usedFormatted: string;
    available: number;
    availableFormatted: string;
    usagePercent: number;
  };
  cpu: {
    type: string;
    cores: number;
    speed: string;
  };
  plugins: {
    total: number;
    list: Array<any>;
  };
};

export default function MainDashboard() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const [srvStatus, setSrvStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);
     const [ConfirmBuckup, setConfirmBackup] = useState<string | "null">("null");
  const [confirmPlayer, setConfirmPlayer] = useState<string | "null">("null");
const [successMsg, setSuccessMsg] = useState<string | null>(null);
const [confirmWorld, setConfirmWorld] = useState<string | null>(null);
const [choicejson, setchoice] = useState<string | null>(null)


  async function fetchStats(background = false) {
    const hadData = !!stats;
    if (background && hadData) setIsRefreshing(true);
    else setLoading(true);
    if (!background) setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data);
      } else {
        if (!background) {
          setError(data.message || 'Failed to fetch server stats');
          setStats(null);
        } else {
          console.warn('Background fetch failed', data.message);
        }
      }
    } catch (err: any) {
      if (!background) {
        setError(String(err?.message || err || 'Unknown error'));
        setStats(null);
      } else {
        console.warn('Background fetch error', err);
      }
    } finally {
      if (background && hadData) setIsRefreshing(false);
      else setLoading(false);
    }
  }

   useEffect(() => {
    fetchStats();

    // Background polling every 5-10 seconds
    const schedule = async () => {
      const delay = 15000 + Math.floor(Math.random() * 5001);
      pollTimerRef.current = window.setTimeout(() => {
        fetchStats(true).then(schedule);
      }, delay) as unknown as number;
    };

    schedule();

    return () => {
      if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current as unknown as number);
    };
  }, []);

  // Subscribe to server status updates and fetch initial status
  useEffect(() => {
    let mounted = true;
    ApiClient.getServerStatus().then((d: any) => {
      if (!mounted) return;
      if (d && d.status) setSrvStatus(d.status);
    }).catch(() => {});

    const handle = (payload: any) => {
      if (payload && payload.status) setSrvStatus(payload.status);
    };

    ApiClient.on('status', handle);
    return () => {
      mounted = false;
      ApiClient.off('status', handle);
    };
  }, []);

  // Keep local srvStatus in sync with fetched stats when available
  useEffect(() => {
    if (stats?.server?.status) setSrvStatus(stats.server.status);
  }, [stats]);

  const handleToggleStartStop = async () => {
    setActionLoading(true);
    try {
      if (srvStatus === 'running') {
        await ApiClient.stopServer();
      } else {
        await ApiClient.startServer();
      }
    } catch (err) {
      console.warn('Server control error', err);
    } finally {
      setActionLoading(false);
    }
  };
  const backupworld = async (worldName: string) => {
        

  }
const cmdWorld = async (worldName: string, choice: number) => {
  console.log("Deleting world: " + worldName);
  
  setConfirmWorld(worldName); // show confirmation popup first
};
const confirmDelete = async () => {
  if (!confirmWorld) return;

  try {
    const res = await fetch("http://localhost:3001/api/worlds/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ world: confirmWorld }),
    });

    const data = await res.json();

    if (data.success) {
      setSuccessMsg(`World "${confirmWorld}" deleted successfully`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } else {
      alert("Failed to delete world: " + data.message);
    }
  } catch (err) {
    alert("Error deleting world");
    console.error(err);
  }

  setConfirmWorld(null);
};

  const handleRestart = async () => {
    setRestartLoading(true);
    try {
      await ApiClient.restartServer();
    } catch (err) {
      console.warn('Restart error', err);
    } finally {
      setRestartLoading(false);
    }
  };

  const card = {
    background: '#0b0b0b',
    padding: 18,
    borderRadius: 12,
    border: '1px solid #222',
    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
  } as const;

  const getStatusColor = (status: string) => {
    if (status === 'running') return '#7efc7e';
    if (status === 'starting') return '#ffeb3b';
    if (status === 'stopping') return '#ff9800';
    return '#ff6b6b';
  };

  const getRamColor = (percent: number) => {
    if (percent < 50) return '#7efc7e';
    if (percent < 75) return '#ffeb3b';
    return '#ff6b6b';
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'peaceful') return '#7efc7e';
    if (diff === 'easy') return '#7efc7e';
    if (diff === 'normal') return '#ffeb3b';
    return '#ff6b6b';
  };

  return (
    <div style={{ padding: 28, color: '#e6ffe8', fontFamily: "Minecraft" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#9ff29f', marginBottom: 4 }}>Server Dashboard</div>
          <div style={{ fontSize: 16, color: '#7a9a7a' }}>Real-time server statistics and monitoring</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => fetchStats(false)}
            style={{
              padding: '12px 20px',
              background: '#122',
              color: '#dfffe0',
              borderRadius: 8,
              border: '1px solid #234',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          {isRefreshing && (
            <div title="Refreshing..." style={{ color: '#9ff29f', fontSize: 20 }}>
              ⟳
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ color: '#a6a6a6', fontSize: 18, marginBottom: 20 }}>Loading server statistics...</div>
      )}
      {error && (
        <div style={{ background: '#3a0a0a', color: '#ffb3b3', padding: 16, borderRadius: 8, fontSize: 16, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!loading && stats && (
        <div>
          {/* Top Row: Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
            {/* Server Status */}
            <div style={card}>
              <div style={{ color: '#9fbf9f', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⚙️ Server Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: getStatusColor(srvStatus || stats.server.status),
                      boxShadow: `0 0 10px ${getStatusColor(srvStatus || stats.server.status)}`,
                    }}
                  />
                  <div style={{ fontSize: 18, fontWeight: 700, color: getStatusColor(srvStatus || stats.server.status) }}>
                    {(srvStatus || stats.server.status).toUpperCase()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {/* Start/Stop Toggle */}
                  <button
                    onClick={handleToggleStartStop}
                    disabled={!srvStatus || actionLoading}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      background: srvStatus === 'running' ? '#ff6b6b' : '#7efc7e',
                      color: srvStatus === 'running' ? '#fff' : '#022c02',
                      boxShadow: srvStatus === 'running' ? '0 6px 20px rgba(255,107,107,0.15)' : '0 6px 20px rgba(126,252,126,0.12)'
                    }}
                  >
                    {actionLoading ? (srvStatus === 'running' ? 'Stopping…' : 'Starting…') : (srvStatus === 'running' ? 'Stop Server' : 'Start Server')}
                  </button>

                  {/* Restart */}
                  <button
                    onClick={handleRestart}
                    disabled={!srvStatus || restartLoading}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: restartLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      background: '#7a4bff',
                      color: '#fff',
                      boxShadow: '0 6px 20px rgba(122,75,255,0.12)'
                    }}
                  >
                    {restartLoading ? 'Restarting…' : 'Restart'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 13, color: '#7a9a7a' }}>
                <div>Difficulty: <span style={{ color: getDifficultyColor(stats.server.difficulty) }}>{stats.server.difficulty}</span></div>
                <div style={{ marginTop: 6 }}>World Type: <span style={{ color: '#9ff29f' }}>{stats.server.worldType}</span></div>
              </div>
            </div>

            {/* Players */}
            <div style={card}>
              <div style={{ color: '#9fbf9f', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>👥 Players</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#7efc7e' }}>{stats.players.online}</div>
                  <div style={{ fontSize: 12, color: '#7a9a7a', marginTop: 4 }}>Online</div>
                </div>
                <div style={{ borderLeft: '1px solid #333', paddingLeft: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#ffeb3b' }}>{stats.players.total}</div>
                  <div style={{ fontSize: 12, color: '#7a9a7a', marginTop: 4 }}>Registered</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: '#7a9a7a' }}>
                Max Players: <span style={{ color: '#dfffe0', fontWeight: 600 }}>{stats.players.maxPlayers}</span>
              </div>
            </div>

            {/* Plugins */}
            <div style={card}>
              <div style={{ color: '#9fbf9f', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🔌 Plugins</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#b3d9ff', marginBottom: 12 }}>{stats.plugins.total}</div>
             
            </div>
          </div>

          {/* RAM Usage */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>💾 Memory (RAM)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#000', padding: 12, borderRadius: 8, border: '1px solid #1a3a1a' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Total</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#dfffe0' }}>{stats.ram.totalFormatted}</div>
              </div>
              <div style={{ background: '#000', padding: 12, borderRadius: 8, border: '1px solid #1a3a1a' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Used</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: getRamColor(stats.ram.usagePercent) }}>
                  {stats.ram.usedFormatted}
                </div>
              </div>
              <div style={{ background: '#000', padding: 12, borderRadius: 8, border: '1px solid #1a3a1a' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Available</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#7efc7e' }}>{stats.ram.availableFormatted}</div>
              </div>
            </div>

            {/* RAM Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#9fbf9f' }}>Usage</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: getRamColor(stats.ram.usagePercent) }}>
                  {stats.ram.usagePercent}%
                </div>
              </div>
              <div
                style={{
                  height: 24,
                  borderRadius: 8,
                  background: '#111',
                  border: '1px solid #222',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${stats.ram.usagePercent}%`,
                    background: `linear-gradient(90deg, ${getRamColor(stats.ram.usagePercent)}, ${getRamColor(stats.ram.usagePercent)}cc)`,
                    transition: 'width 300ms ease-out',
                  }}
                />
              </div>
            </div>
          </div>

          {/* CPU & World Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginBottom: 24 }}>
            {/* CPU */}
            <div style={card}>
              <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>⚡ CPU Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Processor</div>
                  <div style={{ fontSize: 14, color: '#dfffe0', fontWeight: 600, wordBreak: 'break-word' }}>
                    {stats.cpu.type}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#000', padding: 10, borderRadius: 6, border: '1px solid #1a3a1a' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Cores</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#b3d9ff' }}>{stats.cpu.cores}</div>
                  </div>
                  <div style={{ background: '#000', padding: 10, borderRadius: 6, border: '1px solid #1a3a1a' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Speed</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#b3d9ff' }}>{stats.cpu.speed}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* World Summary */}
            <div style={card}>
              <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🌍 Worlds</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.worlds.map((world, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: idx < stats.worlds.length - 1 ? '1px solid #222' : 'none' }}>
                    <div style={{ fontSize: 14, color: '#dfffe0', fontWeight: 600 }}>{world.name}</div>
                    <div style={{ fontSize: 14, color: '#9ff29f', fontWeight: 700 }}>{world.sizeFormatted}</div>
                  </div>
                ))}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, color: '#888' }}>Total Size</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#ffeb3b' }}>
                      {stats.worlds.reduce((acc, w) => acc + w.size, 0) > 0
                        ? `${(stats.worlds.reduce((acc, w) => acc + w.size, 0) / 1024 / 1024 / 1024).toFixed(2)} GB`
                        : '0 GB'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Worlds */}
          <div style={card}>
            <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📊 World Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
              {stats.worlds.map((world, idx) => (
  <div 
    key={idx} 
    style={{ 
      background: '#000', 
      padding: 14, 
      borderRadius: 8, 
      border: '1px solid #1a3a1a',
      position: 'relative'
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 700, color: '#dfffe0', marginBottom: 10 }}>
      {world.name}
    </div>

    <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
      Path: <span style={{ color: '#7a9a7a' }}>{world.path}</span>
    </div>

    <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
      Size: <span style={{ color: '#9ff29f', fontWeight: 600 }}>{world.sizeFormatted}</span>
    </div>
    <button
      onClick={() => cmdWorld(world.path, 1)}
      style={{
        marginTop: 8,
        padding: "6px 12px",
        background: "rgba(0, 51, 13, 1)",
        border: "1px solid rgba(4, 74, 21, 1)",
        borderRadius: 6,
        color: "rgba(53, 97, 61, 1)",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: "bold",
        width: "100%"
      }}
    >
       ⟳ backup
    </button>
    <button
      onClick={() => cmdWorld(world.path, 2)}
      style={{
        marginTop: 8,
        padding: "6px 12px",
        background: "#300",
        border: "1px solid #511",
        borderRadius: 6,
        color: "#f88",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: "bold",
        width: "100%"
      }}
    >
      🗑 Delete 
    </button>
  </div>
))}{confirmWorld && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
    }}
  >
    <div
      style={{
        background: "#111",
        border: "2px solid #0f0",
        padding: 25,
        borderRadius: 10,
        width: 350,
        textAlign: "center",
        boxShadow: "0 0 15px #0f0",
      }}
    >
      <h3 style={{ color: "#0f0", marginBottom: 15 }}>
        Are you sure?
      </h3>

      <p style={{ color: "#ccc", marginBottom: 25 }}>
        Do you really want to delete<br />
        <span style={{ color: "#9ff29f", fontWeight: "bold" }}>
          "{confirmWorld}"
        </span>
        ?<br />
        This action cannot be undone.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => setConfirmWorld(null)}
          style={{
            background: "#333",
            border: "2px solid #666",
            padding: "8px 18px",
            borderRadius: 6,
            color: "#ccc",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cancel
        </button>

        <button
          onClick={confirmDelete}
          style={{
            background: "#300",
            border: "2px solid #f00",
            padding: "8px 18px",
            borderRadius: 6,
            color: "#f88",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
)}


            </div>
          </div>
        </div>
      )}
    </div>
  );
}
