# PaperMC Dashboard

A modern web-based GUI dashboard for managing your local PaperMC (Minecraft) server. Built with React + TypeScript (frontend) and Node.js/Express (backend).

## Features

- ✅ **Real-time Console**: Live server console output with WebSocket streaming
- ✅ **Server Controls**: Start, stop, and restart your PaperMC server
- ✅ **Command Execution**: Execute Minecraft server commands directly from the dashboard
- ✅ **Players List**: View online players (requires RCON or plugin)
- ✅ **TPS Monitoring**: Monitor server performance with Ticks Per Second display
- ✅ **Plugins Management**: View installed plugins
- ✅ **Server Properties Editor**: Edit server.properties file with a user-friendly interface
- ✅ **Logs Viewer**: View server logs

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Java (for running PaperMC server)
- PaperMC server JAR file

## Installation

1. Clone or download this repository

2. Install all dependencies:
```bash
npm run install:all
```

Or install manually:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Configuration

### Backend Configuration

Before starting the server, you need to configure the backend to point to your PaperMC server directory.

**Option 1: Environment Variables**

Create a `.env` file in the `server` directory (or set environment variables):

```env
SERVER_PATH=D:/Minecraft/PaperServer
SERVER_JAR=paper.jar
JAVA_PATH=java
PORT=3001
```

**Option 2: Edit server/index.js**

Edit the configuration constants at the top of `server/index.js`:

```javascript
const SERVER_PATH = process.env.SERVER_PATH || 'D:/Minecraft/PaperServer';
const SERVER_JAR = process.env.SERVER_JAR || 'paper.jar';
const JAVA_PATH = process.env.JAVA_PATH || 'java';
const API_PORT = process.env.PORT || 3001;
```

### Frontend Configuration

If your backend runs on a different port or URL, create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

## Running the Application

### Development Mode

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns)
The backend API will be available at `http://localhost:3001`

### Production Mode

**Build the frontend:**
```bash
npm run build
```

**Start the backend:**
```bash
npm run server
```

## Directory Structure

```
paperGUI/
├── server/                 # Backend Node.js server
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── src/                   # Frontend React application
│   ├── components/        # React components
│   │   ├── console.tsx
│   │   ├── commandbar.tsx
│   │   ├── servercontrol.tsx
│   │   ├── players.tsx
│   │   ├── tps.tsx
│   │   ├── plugins.tsx
│   │   └── settings.tsx
│   ├── pages/
│   │   └── Dashbord.tsx
│   ├── utils/
│   │   └── api.ts         # API client
│   └── ...
├── package.json           # Frontend dependencies
└── README.md
```

## API Endpoints

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
- WebSocket: Real-time logs and status updates

## Advanced Features

### Players List & TPS Monitoring

For accurate players list and TPS monitoring, you'll need to:

1. **Option 1: Enable RCON** in server.properties:
   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=yourpassword
   ```

2. **Option 2: Install a plugin** like:
   - [Spark](https://spark.lucko.me/) for TPS monitoring
   - [EssentialsX](https://essentialsx.net/) for player management

The backend will need to be extended to use RCON protocol for these features. Currently, it returns placeholder data.

### Server Path Requirements

Make sure your PaperMC server directory contains:
- The server JAR file (e.g., `paper.jar`)
- `server.properties` file
- `logs/` directory
- `plugins/` directory (optional)

## Troubleshooting

### Server won't start
- Check that `SERVER_PATH` points to the correct directory
- Ensure the JAR file name matches `SERVER_JAR`
- Verify Java is installed and accessible
- Check backend console for error messages

### WebSocket connection fails
- Ensure backend server is running
- Check that ports are not blocked by firewall
- Verify `VITE_API_URL` matches your backend URL

### Can't see players/TPS data
- Install a plugin like Spark for TPS
- Enable RCON for players list
- The backend may need RCON integration (currently returns placeholder data)

## Security Notes

⚠️ **Important**: This dashboard is designed for local use. For production or remote access:

1. Add authentication/authorization
2. Use HTTPS/WSS for encrypted connections
3. Implement rate limiting
4. Validate and sanitize all inputs
5. Secure the RCON password if using RCON

## License

This project is open source and available for personal use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
