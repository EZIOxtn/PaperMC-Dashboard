# PaperMC Dashboard - Python Flask Server

This is the Python Flask version of the PaperMC Dashboard backend server.

## Installation

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
cd server
pip install -r requirements.txt
```

Or on Windows:
```bash
cd server
python -m pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the `server` directory:

```env
SERVER_PATH=D:/papermcGUI/paperGUI/server/paper-server
SERVER_JAR=C:/Users/E Z I O/AppData/Roaming/.minecraft/paper-1.21.4-232.jar
JAVA_PATH=java
PORT=3001
```

Or set environment variables directly.

## Running

**Development:**
```bash
python app.py
```

**Production:**
```bash
python app.py
```

The server will start on `http://localhost:3001` (or the port specified in PORT env var).

## API Endpoints

Same as the Node.js version:
- `POST /api/server/start` - Start the server
- `POST /api/server/stop` - Stop the server
- `POST /api/server/restart` - Restart the server
- `GET /api/server/status` - Get server status
- `POST /api/server/command` - Execute a command
- `GET /api/server/properties` - Get server.properties
- `POST /api/server/properties` - Update server.properties
- `GET /api/plugins` - Get plugins list
- `GET /api/players` - Get players list
- `GET /api/tps` - Get TPS
- `GET /api/logs` - Get server logs
- WebSocket: Real-time logs and status updates (via Socket.IO)

## Notes

- Uses Flask-SocketIO for WebSocket support
- Requires eventlet for async support
- Frontend may need Socket.IO client library if not already using it

