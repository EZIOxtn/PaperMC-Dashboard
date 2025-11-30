# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm run install:all
```

This installs both frontend and backend dependencies.

## Step 2: Configure Backend

Edit `server/index.js` and update these lines (around line 22):

```javascript
const SERVER_PATH = process.env.SERVER_PATH || 'D:/Minecraft/PaperServer'; // Change this!
const SERVER_JAR = process.env.SERVER_JAR || 'paper.jar'; // Your JAR filename
const JAVA_PATH = process.env.JAVA_PATH || 'java'; // Path to Java (or 'java' if in PATH)
```

**OR** create a `.env` file in the `server/` directory:

```env
SERVER_PATH=D:/Minecraft/PaperServer
SERVER_JAR=paper.jar
JAVA_PATH=java
PORT=3001
```

## Step 3: Verify Your PaperMC Server Directory

Make sure your server directory contains:
- ✅ Your PaperMC JAR file (e.g., `paper.jar`)
- ✅ `server.properties` file
- ✅ `logs/` directory
- ✅ `plugins/` directory (optional)

## Step 4: Start the Application

**Terminal 1 - Start Backend:**
```bash
npm run server:dev
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

## Step 5: Access the Dashboard

Open your browser to: `http://localhost:5173` (or the port Vite shows)

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (should be 18+)
- Verify server directory exists and contains the JAR file
- Check Java is installed: `java -version`

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check browser console for connection errors
- Verify `VITE_API_URL` in `.env` (or defaults to `http://localhost:3001`)

### WebSocket connection fails
- Ensure backend server is running
- Check firewall isn't blocking port 3001
- Look at backend console for WebSocket connection messages

### Server won't start from dashboard
- Check backend console for error messages
- Verify JAR file path is correct
- Ensure Java is accessible from the command line
- Check file permissions for server directory

## Next Steps

1. **Configure Java Memory**: Edit the `startServer()` function in `server/index.js` to adjust `-Xmx` and `-Xms` values
2. **Add RCON Support**: For accurate player lists, enable RCON in server.properties
3. **Install Plugins**: Add plugins like Spark for TPS monitoring
4. **Customize UI**: Modify components in `src/components/` to match your preferences

## Production Deployment

1. Build frontend: `npm run build`
2. Configure environment variables properly
3. Use PM2 or similar to keep backend running
4. Set up reverse proxy (nginx) for production
5. **Important**: Add authentication before exposing to internet!

