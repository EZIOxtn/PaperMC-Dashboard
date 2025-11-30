const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiClient {
  private static ws: WebSocket | null = null;
  private static listeners: Map<string, Set<(data: any) => void>> = new Map();
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 10;

  static connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // Flask-SocketIO uses Socket.IO protocol
    // Try Socket.IO first, fallback to raw WebSocket if needed
    // For Socket.IO, we need to use the Socket.IO client library
    // For now, try raw WebSocket connection (may need to update backend)
    const wsUrl = API_BASE.replace(/^http/, 'ws').replace(/\/$/, '');
    
    // Try Socket.IO WebSocket first
    let socketUrl = wsUrl + '/socket.io/?EIO=4&transport=websocket';
    this.ws = new WebSocket(socketUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        // Socket.IO sends protocol messages, need to parse them
        let dataStr = String(event.data);
        
        // Skip Socket.IO handshake/protocol messages (0, 40, etc.)
        if (dataStr.length === 1 && (dataStr === '0' || dataStr === '40')) {
          return;
        }
        
        // Parse Socket.IO event message (format: 42["message", {...}])
        // Message types: 0=connect, 40=ack, 42=event, etc.
        if (dataStr.startsWith('42')) {
          // Extract JSON array part after '42'
          const jsonStart = dataStr.indexOf('[');
          if (jsonStart !== -1) {
            const jsonStr = dataStr.substring(jsonStart);
            try {
              const parsed = JSON.parse(jsonStr);
              // parsed is an array: ["message", {type: "log", message: "..."}]
              if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0] === 'message') {
                const data = parsed[1];
                // data should be {type: "log"|"status", message: "...", status: "..."}
                const listeners = this.listeners.get(data.type);
                if (listeners) {
                  listeners.forEach(listener => listener(data));
                }
              }
            } catch (parseError) {
              console.error('Error parsing Socket.IO JSON:', parseError, jsonStr);
            }
          }
        } else if (dataStr.startsWith('{')) {
          // Try direct JSON parse for raw WebSocket (fallback)
          try {
            const data = JSON.parse(dataStr);
            const listeners = this.listeners.get(data.type);
            if (listeners) {
              listeners.forEach(listener => listener(data));
            }
          } catch (parseError) {
            // Ignore parse errors for non-JSON messages
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
      }
    };
  }

  static on(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    this.connect();
  }

  static off(type: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  static async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response.json();
  }

  // Server control
  static async startServer() {
    return this.request('/api/server/start', { method: 'POST' });
  }

  static async stopServer() {
    return this.request('/api/server/stop', { method: 'POST' });
  }

  static async restartServer() {
    return this.request('/api/server/restart', { method: 'POST' });
  }

  static async getServerStatus() {
    return this.request('/api/server/status');
  }

  // Command execution
  static async executeCommand(command: string) {
    return this.request('/api/server/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  // Server properties
  static async getServerProperties() {
    return this.request('/api/server/properties');
  }

  static async updateServerProperties(properties: Record<string, string>) {
    return this.request('/api/server/properties', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  // Plugins
  static async getPlugins() {
    return this.request('/api/plugins');
  }

  // Players
  static async getPlayers() {
    return this.request('/api/players');
  }
// get player kill 

static async hanlekillplayer(uuidx: string) {
  return this.request('/api/players/getkill', {
    method: 'POST',
    body: JSON.stringify({ uid: uuidx }), // correct key → correct value
  });
}

static async getConfig(){

    return this.request('/api/config');
}

static async saveConfig(config: Record<string, any>){

    return this.request('/api/config', {});

}

//teleport player to spawn

static tpPlayer(Player: string, x:number,y:number,z:number){
return this.request('/api/players/tp', {
    method: 'POST',
    body: JSON.stringify({ player: Player, X: x, Y:z, Z:y }), // correct key → correct value
  });

}
  // Player details (console-backed)
  static async getPlayerDetails(playerName: string) {
    const name = encodeURIComponent(playerName);
    return this.request(`/api/player/${name}`);
  }

  // Banned Players
  static async getBannedPlayers() {
    return this.request('/api/banned-players');
  }

  // Ban a player
  static async banPlayer(playerName: string, reason?: string) {
    return this.request('/api/players/ban', {
      method: 'POST',
      body: JSON.stringify({ playerName, reason }),
    });
  }

  // Unban a player
  static async unbanPlayer(playerName: string) {
    return this.request('/api/players/unban', {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    });
  }
  static async killPlayer(playerName: string) {
    const name = encodeURIComponent(playerName);
    return this.request(`/api/player/cmd/${name}`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    });
  }
  // TPS
  static async getTPS() {
    return this.request('/api/tps');
  }
  //remove item from player inventory
  static async removeItem(player: string,item : string, amount: string ){
    
    return this.request('/api/players/removeitem', {
      method: 'POST',
      body: JSON.stringify({ itemObj: item, Player: player , Amt: amount}),
    });
  }

  // Logs
  static async getLogs(lines?: number) {
    const query = lines ? `?lines=${lines}` : '';
    return this.request(`/api/logs${query}`);
  }
}

