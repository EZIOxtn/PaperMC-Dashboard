import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import os from 'os';
import https from 'https';
import { createWriteStream } from 'fs';
import { time } from 'console';





const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

async function ensurePaperServerDir() {
  try {
   
    await fs.access("paper-server")
      .catch(async () => {
        
        await fs.mkdir("paper-server");
        console.log("Created 'paper-server' directory.");
      });
  } catch (err) {
    console.error(err);
    console.log(
      "Please create the 'paper-server' directory yourself inside the server folder."
    );
  }
}

ensurePaperServerDir();

const configurationContent = await fs.readFile('./config.json', 'utf-8');
const config = JSON.parse(configurationContent);
console.log(config.serverJar);
// Configuration - Update this path to your PaperMC server directory
const SERVER_PATH = process.env.SERVER_PATH || path.join(process.cwd(), config.serverPath || 'paper-server');
const SERVER_JAR = process.env.SERVER_JAR || config.serverJar || 'paper-1.21.4-232.jar';
const JAVA_PATH = process.env.JAVA_PATH || 'java'; // Use 'java' from PATH by default
const SERVER_PORT = 25565; // Default Minecraft port
const API_PORT = process.env.PORT || 3001;
// Function to broadcast a message to all players

// Interval to run every 30 seconds
const colors = ["0","1","2","3","4","P","5","6","7","8","9","a","b","c","d","e","f"];
let i = 0;

setInterval(async () => {
  const message = "§" + colors[i % colors.length] + "this server use dashbord from ! §r https://github.com/EZIOxtn";
  await executeCommand(`tellraw @a {"text":"${message}"}`);
  i++;
}, 30000);
// Plugin configuration
const REQUIRED_PLUGINS = [
  {
    name: 'SkinsRestorer',
    filename: 'SkinsRestorer.jar',
    isZip: false,
    url: 'https://hangarcdn.papermc.io/plugins/SRTeam/SkinsRestorer/versions/15.9.0/PAPER/SkinsRestorer.jar'
  },
  {
    name: 'PlaceholdeAPI',
    filename: 'PlaceholderAPI.jar',
    isZip: false,
    url: 'https://hangarcdn.papermc.io/plugins/HelpChat/PlaceholderAPI/versions/2.11.7/PAPER/PlaceholderAPI-2.11.7.jar'
  } ,
  {
    name: 'ezioxdashbordmc',
    filename: 'ezioxdashbordmc.zip',
    isZip: true,
    url: 'https://release-assets.githubusercontent.com/github-production-release-asset/1101925822/7a0bbdbc-14ce-40d4-ae6f-22a2d02f5faa?sp=r&sv=2018-11-09&sr=b&spr=https&se=2025-11-22T16%3A18%3A03Z&rscd=attachment%3B+filename%3Dezioxdashbordmc.zip&rsct=application%2Foctet-stream&skoid=96c2d410-5711-43a1-aedd-ab1947aa7ab0&sktid=398a6654-997b-47e9-b12b-9515b896b4de&skt=2025-11-22T15%3A18%3A03Z&ske=2025-11-22T16%3A18%3A03Z&sks=b&skv=2018-11-09&sig=OKC70HNZvHc7HofIBFIXPZ3F0j9FJ3PeHtjXPqzdJls%3D&jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmVsZWFzZS1hc3NldHMuZ2l0aHVidXNlcmNvbnRlbnQuY29tIiwia2V5Ijoia2V5MSIsImV4cCI6MTc2MzgyNTI3MCwibmJmIjoxNzYzODI0OTcwLCJwYXRoIjoicmVsZWFzZWFzc2V0cHJvZHVjdGlvbi5ibG9iLmNvcmUud2luZG93cy5uZXQifQ.9504hX9T3Lc3kX1-0Ng0Z7-B_RoSjYPvI5WHfLXiJv4&response-content-disposition=attachment%3B filename%3Dezioxdashbordmc.zip&response-content-type=application%2Foctet-stream'
  }
];
const serverSavePlayerKillDir = "./paper-server/plugins/dashbordmc";
let serverProcess = null;
let serverStatus = 'stopped'; // stopped, starting, running, stopping
const logs = [];
const maxLogs = 1000;

// Broadcast message to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}
//get player kills 
async function getPlayerKills(key) {
  try {
    const filepath = path.join(serverSavePlayerKillDir, "kills.json");

    // Will throw if file doesn't exist
    const data = await fs.readFile(filepath, "utf8");

    const json = JSON.parse(data);

    return json[key] ?? null;

  } catch (err) {
    console.error("Error in getPlayerKills:", err);
    return null;
  }
}

// Add log entry
function addLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  logs.push(logEntry);
  if (logs.length > maxLogs) logs.shift();
  broadcast({ type: 'log', message: logEntry });
}

// Download a file with progress display
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    let downloadedBytes = 0;
    let totalBytes = 0;

    https.get(url, (response) => {
      // Get total file size from content-length header
      totalBytes = parseInt(response.headers['content-length'], 10);
      
      if (totalBytes) {
        addLog(`Downloading ${path.basename(dest)} (${(totalBytes / 1024 / 1024).toFixed(2)} MB)...`);
      }

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
        const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
        
        // Log progress every 10% or every second
        if (percent % 10 < 0.5 || downloadedBytes % 1000000 < 50000) {
          addLog(`  ↓ ${percent}% (${downloadedMB}MB / ${totalMB}MB)`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        addLog(`✓ Successfully downloaded ${path.basename(dest)}`);
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Check and download required plugins
async function ensurePluginsExist() {
  try {
    const pluginsDir = path.join(SERVER_PATH, 'plugins');
    
    // Ensure plugins directory exists
    try {
      await fs.access(pluginsDir);
    } catch {
      addLog('Creating plugins directory...');
      await fs.mkdir(pluginsDir, { recursive: true });
    }

    addLog('Checking required plugins...');

    for (const plugin of REQUIRED_PLUGINS) {
      const pluginPath = path.join(pluginsDir, plugin.filename);
      
      try {
    await fs.access(pluginPath);
    addLog(`✓ ${plugin.name} is already installed`);
} catch {
    addLog(`⚠ ${plugin.name} not found, downloading...`);

    try {
        // Detect if URL ends with .zip
       const isZip = plugin.isZip;


        // Temp download path
        const tempDownload = path.join(SERVER_PATH, "plugins", plugin.name + (isZip ? ".zip" : ".jar"));

        // Download file first
        await downloadFile(plugin.url, tempDownload);

        if (isZip) {
            addLog(`📦 Extracting ZIP for ${plugin.name}...`);
            const extract = (await import("extract-zip")).default;

            try {
                // Extract into plugin folder
                await extract(tempDownload, { dir: path.join(SERVER_PATH, "plugins") });

                addLog(`✓ ZIP extracted successfully for ${plugin.name}`);
            } catch (zipErr) {
                addLog(`✗ Failed to extract ZIP for ${plugin.name}: ${zipErr.message}`);
                throw zipErr;
            }

            // Clean up zip file
           
        } else {
            // If not ZIP → treat as normal .jar plugin
            await fs.rename(tempDownload, pluginPath);
            addLog(`✓ Downloaded ${plugin.name} (.jar) successfully`);
        }

    } catch (err) {
        addLog(`✗ Error handling plugin ${plugin.name}: ${err.message}`);
        throw err;
    }
}

    }

    addLog('✓ All required plugins are ready!');
    return true;
  } catch (error) {
    addLog(`✗ Error checking plugins: ${error.message}`);
    throw error;
  }
}

// Attach event handlers to server process
function attachProcessHandlers(process) {
  // Handle stdout
  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => addLog(line));
  });

  // Handle stderr
  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => addLog(`[STDERR] ${line}`));
  });

  // Handle process exit
  process.on('exit', (code) => {
    serverProcess = null;
    serverStatus = 'stopped';
    broadcast({ type: 'status', status: serverStatus });
    addLog(`Server stopped with code ${code}`);
  });
}

// Find Java executable
async function findJavaExecutable() {
  // If explicitly set and is absolute path, verify it exists
  if (path.isAbsolute(JAVA_PATH)) {
    try {
      await fs.access(JAVA_PATH);
      return JAVA_PATH;
    } catch {
      addLog(`WARNING: Java not found at ${JAVA_PATH}, searching...`);
    }
  }

  // If JAVA_PATH is 'java', try to find it
  if (JAVA_PATH === 'java') {
    // On Windows, use 'where' command
    if (os.platform() === 'win32') {
      try {
        const { stdout } = await execAsync('where java');
        const javaPath = stdout.trim().split('\n')[0]?.trim();
        console.log(javaPath);
        if (javaPath) {
          try {
            await fs.access(javaPath);
            return javaPath;
          } catch {
            // Path doesn't exist
          }
        }
      } catch {
        // where command failed
      }
    }
    
    // Try common Java locations on Windows
    if (os.platform() === 'win32') {
      const commonPaths = [
        'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
        'C:\\Program Files\\Java\\jdk-20\\bin\\java.exe',
        'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
        'C:\\Program Files\\Java\\jdk-11\\bin\\java.exe',
        'C:\\Program Files\\Java\\jre1.8.0_51\\bin\\java.exe',
        'C:\\Program Files\\Java\\jre-21\\bin\\java.exe',
        'C:\\Program Files\\Java\\jre-17\\bin\\java.exe',
        'C:\\Program Files\\Java\\jre-11\\bin\\java.exe',
        process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
      ].filter(Boolean);

      for (const javaPath of commonPaths) {
        try {
          await fs.access(javaPath);
          return javaPath;
        } catch {
          continue;
        }
      }
    }
  }else{return "java";}

  // Fallback to whatever JAVA_PATH is set to
  return JAVA_PATH;
}

// Start PaperMC server
async function startServer() {
  if (serverProcess || serverStatus !== 'stopped') {
    return { success: false, message: 'Server is already running or starting' };
  }

  try {
    // Clear previous session logs from memory
    logs.length = 0;
    addLog('Initialized new server session log.');
    
    serverStatus = 'starting';
    broadcast({ type: 'status', status: serverStatus });
    addLog('Starting PaperMC server...');

    // Check and download required plugins first
    addLog('═══════════════════════════════════════');
    addLog('Checking required plugins...');
    addLog('═══════════════════════════════════════');
    await ensurePluginsExist();
    addLog('═══════════════════════════════════════');

    // Find Java executable
    const javaExecutable = await findJavaExecutable();
    addLog(`Using Java: ${javaExecutable}`);
    console.log(javaExecutable);

    const serverDir = SERVER_PATH;
    // Check if SERVER_JAR is an absolute path, if not, join with serverDir
    const jarPath = path.isAbsolute(SERVER_JAR) 
      ? SERVER_JAR 
      : path.join(serverDir, SERVER_JAR);

    // Check if server jar exists
    try {
      await fs.access(jarPath);
    } catch {
      addLog(`ERROR: Server jar not found at ${jarPath}`);
      serverStatus = 'stopped';
      broadcast({ type: 'status', status: serverStatus });
      return { success: false, message: 'Server jar not found' };
    }

    // Start server process
    // Use absolute path to JAR file, but run from serverDir (where server.properties, eula.txt, etc. are)
    const javaArgs = [
      '-Xmx2G',
      '-Xms1G',
      '-jar',
    
      jarPath,  // Use full absolute path to JAR
      '--nogui'
    ];

    addLog(`Starting with command: ${javaExecutable} ${javaArgs.join(' ')}`);
    
    // On Windows, if path has spaces, we need to handle it properly
    const spawnOptions = {
      cwd: serverDir,  // Run from server directory where config files are
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false  // Don't use shell forS security
    };

    // Spawn the process
    // Note: spawn handles paths with spaces correctly when passed as first argument
    serverProcess = spawn(JAVA_PATH, javaArgs, spawnOptions);

    // Handle spawn errors immediately
    serverProcess.on('error', (error) => {
      const errorMsg = error.code === 'ENOENT' 
        ? `Java executable not found at "${javaExecutable}". Please install Java or set JAVA_PATH environment variable to the full path (e.g., C:/Program Files/Java/jre1.8.0_51/bin/java.exe)`
        : `Failed to start server: ${error.message}`;
      addLog(`ERROR: ${errorMsg}`);
      serverStatus = 'stopped';
      broadcast({ type: 'status', status: serverStatus });
      serverProcess = null;
    });

    // Attach handlers
    attachProcessHandlers(serverProcess);

    // Wait a bit to see if server starts successfully 
    
serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  
const regex = /Done \(\d+(\.\d+)?s\)! For help, type "help"/;

if (regex.test(text)) {
  serverStatus = 'running';
  broadcast({ type: 'status', status: serverStatus });
  addLog('Server started successfully!');
}
});

    return { success: true, message: 'Server starting' };
  } catch (error) {
    serverStatus = 'stopped';
    broadcast({ type: 'status', status: serverStatus });
    addLog(`ERROR: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Stop server
async function stopServer() {
  if (!serverProcess || serverStatus === 'stopped') {
    return { success: false, message: 'Server is not running' };
  }

  try {
    serverStatus = 'stopping';
    broadcast({ type: 'status', status: serverStatus });
    addLog('Stopping server...');

    // Send stop command to server
    serverProcess.stdin.write('stop\n');

    // Force kill after 10 seconds if still running
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
    }, 10000);

    return { success: true, message: 'Server stopping' };
  } catch (error) {
    addLog(`ERROR: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Restart server
async function restartServer() {
  await stopServer();
  await new Promise(resolve => setTimeout(resolve, 3000));
  return await startServer();
}

// Execute command
async function executeCommand(command) {
  if (!serverProcess || serverStatus !== 'running') {
    return { success: false, message: 'Server is not running' };
  }

  try {
    serverProcess.stdin.write(`${command}\n`);
    
    addLog(`[COMMAND] ${command}`);
    return { success: true, message: 'Command executed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Read server.properties
async function getServerProperties() {
  try {
    const propsPath = path.join(SERVER_PATH, 'server.properties');
    const content = await fs.readFile(propsPath, 'utf-8');
    const properties = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          properties[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return { success: true, properties };
  } catch (error) {
    return { success: false, message: error.message, properties: {} };
  }
}

// Update server.properties
async function updateServerProperties(updates) {
  try {
    const propsPath = path.join(SERVER_PATH, 'server.properties');
    const content = await fs.readFile(propsPath, 'utf-8');
    
    let lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key] = line.split('=');
        if (key && updates.hasOwnProperty(key.trim())) {
          return `${key.trim()}=${updates[key.trim()]}`;
        }
      }
      return line;
    });

    // Add new properties that don't exist
    Object.keys(updates).forEach(key => {
      const exists = lines.some(line => {
        const [lineKey] = line.split('=');
        return lineKey && lineKey.trim() === key;
      });
      if (!exists) {
        updatedLines.push(`${key}=${updates[key]}`);
      }
    });

    await fs.writeFile(propsPath, updatedLines.join('\n'), 'utf-8');
    return { success: true, message: 'Properties updated' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get plugins list
async function getPlugins() {
  try {
    const pluginsDir = path.join(SERVER_PATH, 'plugins');
    await fs.access(pluginsDir);
    const files = await fs.readdir(pluginsDir);
    const plugins = files
      .filter(file => file.endsWith('.jar'))
      .map(file => ({
        name: file.replace('.jar', ''),
        file: file,
        enabled: true // Could check plugin.yml to determine actual status
      }));
    return { success: true, plugins };
  } catch (error) {
    return { success: true, plugins: [] }; // Return empty array if plugins dir doesn't exist
  }
}

function readJsonValue(folderPath='./ExamplePlugin/playerdata', fileName, key) {
    const filePath = path.join(folderPath, fileName);

    try {
        // Check if folder exists
        if (!fs.existsSync(folderPath)) {
            console.error(`Folder not found: ${folderPath}`);
            return null;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return null;
        }

        // Read file and parse JSON
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        // Return requested key
        return jsonData[key] !== undefined ? jsonData[key] : null;
    } catch (err) {
        console.error(`Error reading JSON: ${err.message}`);
        return null;
    }
}

// Get players list from usercache.json and active log detection
async function getPlayers() {
  try {
    const usercachePath = path.join(SERVER_PATH, 'usercache.json');
    const defaultSkin = 'https://textures.minecraft.net/texture/389c99b3fc8c0bfc5bffcdf5936f3246c1ab82a14bb2b3bd0c1afbb57992f1a6'; // Default Steve skin

    // Try to read usercache.json for player list
    let basePlayers = [];
    
    try {
      const usercacheContent = await fs.readFile(usercachePath, 'utf-8');
      const usercacheData = JSON.parse(usercacheContent);
      
      if (Array.isArray(usercacheData)) {
        basePlayers = usercacheData.map(entry => ({
          name: entry.name,
          uuid: entry.uuid,
          lastLogin: entry.lastLogin
        }));
      }
    } catch (err) {
      addLog(`Warning: Could not read usercache.json: ${err.message}`);
    }

    // Enhance players with skin data from ExamplePlugin
    const players = await Promise.all(basePlayers.map(async (player) => {
      const playerDataPath = path.join(SERVER_PATH, 'plugins', 'dashbordmc', 'playerdata', `${player.name}.json`);
      try {
        const playerDataContent = await fs.readFile(playerDataPath, 'utf-8');
        const playerData = JSON.parse(playerDataContent);
        return {
          ...player,
          skin: playerData.skin?.textures_base64 || defaultSkin,
        };
      } catch (error) {
        // File might not exist or is invalid, which is fine. Assign default skin.
        return {
          ...player,
          skin: defaultSkin,
        };
      }
    }));
    
    // If server is running, use 'list' command to get online players
    let onlinePlayers = [];
  
if (serverStatus === 'running') {
      try {
        const filepath = path.join(SERVER_PATH, 'plugins', 'dashbordmc', `online.json`);
  const raw = await fs.readFile(filepath, "utf8");
  const onlineData = JSON.parse(raw);

  const onlineArray = Object.values(onlineData);

  onlinePlayers = onlineArray.map(p => {
    const fullPlayer = players.find(x => x.uuid === p.uuid || x.name === p.name);
    
    return fullPlayer
      ? { ...fullPlayer, status: "online" }
      : { ...p, status: "online" };
  });

} catch (err) {
  addLog(`Warning: Could not read online.json: ${err.message}`);
}

    }

    
    return { 
      success: true, 
      players: onlinePlayers,    // List of online players
      allPlayers: players,       // List of all players from usercache
      message: `${onlinePlayers.length} player(s) online`
    };
  } catch (error) {
    return { 
      success: false, 
      players: [], 
      allPlayers: [],
      message: error.message 
    };
  }
}
async function readOldPlayers(){
  // 1. Read usercache.json before the list command
let basePlayers = [];
try {
  const usercachePath = path.join(SERVER_PATH, 'usercache.json');
  const usercacheContent = await fs.readFile(usercachePath, 'utf-8');
  const usercacheData = JSON.parse(usercacheContent);

  if (Array.isArray(usercacheData)) {
    basePlayers = usercacheData.map(entry => ({
      name: entry.name,
      uuid: entry.uuid,
      lastLogin: entry.lastLogin
    }));
  }
  return basePlayers;
} catch (err) {
  addLog(`Warning: Could not read usercache.json: ${err.message}`);
}
return basePlayers;

}
// Get banned players list
async function getBannedPlayers() {
  try {
    const bannedPath = path.join(SERVER_PATH, 'banned-players.json');
    let bannedPlayers = [];
    
    try {
      const bannedContent = await fs.readFile(bannedPath, 'utf-8');
      bannedPlayers = JSON.parse(bannedContent);
      
      if (!Array.isArray(bannedPlayers)) {
        bannedPlayers = [];
      }
    } catch (err) {
      addLog(`Warning: Could not read banned-players.json: ${err.message}`);
    }
    
    return { 
      success: true, 
      bannedPlayers,
      message: `${bannedPlayers.length} banned player(s)`
    };
  } catch (error) {
    return { 
      success: false, 
      bannedPlayers: [], 
      message: error.message 
    };
  }
}

// Ban a player
async function banPlayer(playerName, reason = 'Banned by admin') {
  try {
    if (!serverProcess || serverStatus !== 'running') {
      return { success: false, message: 'Server is not running' };
    }

    // Execute ban command on server
    await executeCommand(`ban ${playerName} ${reason}`);
    
    // Log the action
    addLog(`🚫 Player banned: ${playerName} (Reason: ${reason})`);
    
    return { success: true, message: `Player ${playerName} has been banned` };
  } catch (error) {
    addLog(`Error banning player ${playerName}: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Unban a player
async function unbanPlayer(playerName) {
  try {
    // Execute pardon command on server
    await executeCommand(`pardon ${playerName}`);
    
    // Log the action
    addLog(`✓ Player unbanned: ${playerName}`);
    
    return { success: true, message: `Player ${playerName} has been unbanned` };
  } catch (error) {
    addLog(`Error unbanning player ${playerName}: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Send a command to server and collect console output produced after it
async function sendCommandAndCollectOutput(command, timeoutMs = 4000) {
  if (!serverProcess || serverStatus !== 'running') {
    return { success: false, message: 'Server is not running', output: '' };
  }

  const startIndex = logs.length;
  // Send command
  await executeCommand(command);

  const endTime = Date.now() + timeoutMs;
  // Poll logs for new entries
  while (Date.now() < endTime) {
    await new Promise((r) => setTimeout(r, 100));
    const newLines = logs.slice(startIndex).map(l => {
      // strip timestamp prefix added by addLog
      const idx = l.indexOf('] ');
      return idx !== -1 ? l.substring(idx + 2) : l;
    });
    if (newLines.length > 0) {
      return { success: true, output: newLines.join('\n') };
    }
  }

  return { success: false, message: 'No console output within timeout', output: '' };
}

// Get detailed player information by querying /getdata command (plugin response)
async function getPlayerDetails(playerName) {
  try {
    if (!serverProcess || serverStatus !== 'running') {
      return { success: false, message: 'Server is not running', raw: null };
    }

    // Issue /getdata command (plugin will respond with JSON in console)
    //const res = await sendCommandAndCollectOutput(`getdata ${playerName}`, 3000);
    let res;
    let raw;
    try {
      const filepath = path.join(SERVER_PATH, 'plugins', 'dashbordmc', 'playerdata', `${playerName}.json`);

    // Will throw if file doesn't exist
     res = await fs.readFile(filepath, "utf8");

     raw = JSON.parse(res);
    } catch (error) {
      console.error(error)
    }
    
    

    // Return raw console output; let frontend parse the JSON
    
    return { success: true, raw };
  } catch (error) {
    return { success: false, message: error.message, raw: null };
  }
}
function parseTps(line) {
  const regex = /TPS from last 1m, 5m, 15m:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/;

  const match = line.match(regex);
  if (!match) return null;

  return {
    tps1m: parseFloat(match[1]),
    tps5m: parseFloat(match[2]),
    tps15m: parseFloat(match[3]),
  };
}

// Get TPS (Ticks Per Second)
async function getTPS() {
  if (serverStatus !== 'running') {
    return { success: false, tps: 0, message: 'Server is not running' };
  }
  
  // TPS monitoring requires a plugin like spark or via RCON
  // For now, return placeholder
  try {
    // Use sendCommandAndCollectOutput so we capture the console output produced by the command
    const res = await sendCommandAndCollectOutput('tps', 3000);
    if (!res.success) {
      return { success: false, tps: 0, message: res.message || 'No console output' };
    }

    const parsed = parseTps(res.output || '');
    return { success: true, data: parsed };

  } catch (error) {
    return { success: false, tps: 0, message: error.message };
  }
  
}

// Get world information (size, type, difficulty)
async function getWorldInfo() {
  try {
    const worldDir = path.join(SERVER_PATH, 'world');
    const netherDir = path.join(SERVER_PATH, 'world_nether');
    const endDir = path.join(SERVER_PATH, 'world_the_end');

    // Function to calculate directory size recursively
    async function getDirSize(dirPath) {
      let size = 0;
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            size += await getDirSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          }
        }
      } catch {
        return 0;
      }
      return size;
    }

    // Get sizes
    const worldSize = await getDirSize(worldDir);
    const netherSize = await getDirSize(netherDir);
    const endSize = await getDirSize(endDir);

    // Read server.properties to get difficulty and world type
    const propsPath = path.join(SERVER_PATH, 'server.properties');
    let difficulty = 'unknown';
    let worldType = 'default';
    let levelName = 'world';

    try {
      const content = await fs.readFile(propsPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.includes('difficulty=')) {
          const val = line.split('=')[1]?.trim();
          const diffMap = { '0': 'peaceful', '1': 'easy', '2': 'normal', '3': 'hard' };
          difficulty = diffMap[val] || val || 'unknown';
        }
        if (line.includes('level-type=')) {
          worldType = line.split('=')[1]?.trim() || 'default';
        }
        if (line.includes('level-name=')) {
          levelName = line.split('=')[1]?.trim() || 'world';
        }
      });
    } catch {
      // Ignore errors
    }

    return {
      success: true,
      worlds: [
        {
          name: 'Overworld',
          path: levelName,
          size: worldSize,
          sizeFormatted: formatBytes(worldSize)
        },
        {
          name: 'Nether',
          path: 'world_nether',
          size: netherSize,
          sizeFormatted: formatBytes(netherSize)
        },
        {
          name: 'The End',
          path: 'world_the_end',
          size: endSize,
          sizeFormatted: formatBytes(endSize)
        }
      ],
      difficulty,
      worldType,
      totalWorldSize: worldSize + netherSize + endSize,
      totalWorldSizeFormatted: formatBytes(worldSize + netherSize + endSize)
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Format bytes to human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get system and server statistics
async function getServerStats() {
  try {
    // Get players info
    const playersResult = await getPlayers();
    const playerCount = playersResult.players?.length || 0;
    const totalPlayers = playersResult.allPlayers?.length || 0;

    // Get plugins info
    const pluginsResult = await getPlugins();
    const pluginCount = pluginsResult.plugins?.length || 0;

    // Get world info
    const worldResult = await getWorldInfo();

    // Get system RAM info (in bytes)
    const totalRam = os.totalmem();
    const usedRam = totalRam - os.freemem();
    const availableRam = os.freemem();

    // Get CPU info
    const cpus = os.cpus();
    const cpuType = cpus[0]?.model || 'Unknown CPU';
    const cpuCores = cpus.length;
    const cpuSpeed = cpus[0]?.speed || 0;

    return {
      success: true,
      server: {
        status: serverStatus,
        difficulty: worldResult.difficulty || 'unknown',
        worldType: worldResult.worldType || 'default'
      },
      worlds: worldResult.worlds || [],
      players: {
        online: playerCount,
        total: totalPlayers,
        maxPlayers: 20 // Could read from server.properties
      },
      ram: {
        total: totalRam,
        totalFormatted: formatBytes(totalRam),
        used: usedRam,
        usedFormatted: formatBytes(usedRam),
        available: availableRam,
        availableFormatted: formatBytes(availableRam),
        usagePercent: parseFloat(((usedRam / totalRam) * 100).toFixed(2))
      },
      cpu: {
        type: cpuType,
        cores: cpuCores,
        speed: cpuSpeed + ' MHz'
      },
      plugins: {
        total: pluginCount,
        list: pluginsResult.plugins || []
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Read latest.log
async function getLogs(lines = 100) {
  try {
    const logsPath = path.join(SERVER_PATH, 'logs', 'latest.log');
    const content = await fs.readFile(logsPath, 'utf-8');
    const logLines = content.split('\n').filter(line => line.trim());
    return { 
      success: true, 
      logs: logLines.slice(-lines),
      totalLines: logLines.length
    };
  } catch (error) {
    return { success: false, logs: [], message: error.message };
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('Client connected to WebSocket');
  
  // Send initial state
  ws.send(JSON.stringify({ 
    type: 'status', 
    status: serverStatus 
  }));
  
  // Send recent logs
  logs.slice(-50).forEach(log => {
    ws.send(JSON.stringify({ type: 'log', message: log }));
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// API Routes

// Server control
app.post('/api/server/start', async (req, res) => {
  const result = await startServer();
  res.json(result);
});

app.post('/api/server/stop', async (req, res) => {
  const result = await stopServer();
  res.json(result);
});

app.post('/api/server/restart', async (req, res) => {
  const result = await restartServer();
  res.json(result);
});

app.get('/api/server/status', (req, res) => {
  res.json({ status: serverStatus });
});

// Command execution
app.post('/api/server/command', async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, message: 'Command is required' });
  }
  const result = await executeCommand(command);
  res.json(result);
});

// Server properties
app.get('/api/server/properties', async (req, res) => {
  const result = await getServerProperties();
  res.json(result);
});

app.post('/api/server/properties', async (req, res) => {
  const { properties } = req.body;
  if (!properties) {
    return res.status(400).json({ success: false, message: 'Properties object is required' });
  }
  const result = await updateServerProperties(properties);
  res.json(result);
});

// Plugins
app.get('/api/plugins', async (req, res) => {
  const result = await getPlugins();
  res.json(result);
});

// Players
app.get('/api/players', async (req, res) => {
  const result = await getPlayers();
  res.json(result);
});
app.post('/api/player/cmd/:name', async (req, res) => {

  const bd = req.body;
  const name = req.params.name;
  if (!name) return res.status(400).json({ success: false, message: 'Player name is required' });
  if (bd == null) return res.status(400).json({ success: false, message: 'Invalid body' });
  const result = await executeCommand(`kill ${name} `);
  res.json({ success: true, message: `Executed command ${bd.command} on player ${name}` });


});

// Give experience to a player
app.post('/api/players/givexp/:name', async (req, res) => {
  const { xp } = req.body;
  const name = req.params.name;

  if (!xp) {
    return res.status(400).json({ success: false, message: 'XP amount is required' });
  }
  if (!name) {
    return res.status(400).json({ success: false, message: 'Player name is required' });
  }

  try {
    const result = await executeCommand(`xp add ${name} ${xp}`);
    res.json({ success: true, message: `Added ${xp} XP to player ${name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add XP', error: error.message });
  }
});

app.post('/api/players/give/:name', async (req, res) => {
if (!req.body.item) {
    return res.status(400).json({ success: false, message: 'Item is required' });
  }
  if (!req.body.amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }
  const name = req.params.name;
  if (!name) return res.status(400).json({ success: false, message: 'Player name is required' });
  const result = await executeCommand(`give ${name} ${req.body.item} ${req.body.amount} `);
  res.json({ success: true, message: `Gave ${req.body.amount} of ${req.body.item} to player ${name}` });


});
// Player details (queries server console for player NBT/data)
app.get('/api/player/:name', async (req, res) => {
  const name = req.params.name;
  if (!name) return res.status(400).json({ success: false, message: 'Player name is required' });
  const result = await getPlayerDetails(name);
  res.json(result);
});

// Banned Players
app.get('/api/banned-players', async (req, res) => {
  const result = await getBannedPlayers();
  res.json(result);
});

// Ban a player
app.post('/api/players/ban', async (req, res) => {
  const { playerName, reason } = req.body;
  if (!playerName) {
    return res.status(400).json({ success: false, message: 'Player name is required' });
  }
  const result = await banPlayer(playerName, reason || 'Banned by admin');
  res.json(result);
});

// Unban a player
app.post('/api/players/unban', async (req, res) => {
  const { playerName } = req.body;
  if (!playerName) {
    return res.status(400).json({ success: false, message: 'Player name is required' });
  }
  const result = await unbanPlayer(playerName);
  res.json(result);
});
//send message to player
// POST /api/players/message/:name
app.post('/api/players/message/:name', async (req, res) => {
  const name = req.params.name;
  const { text } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Player name is required' });
  }

  // send the message here however your logic works
  
  const result = await executeCommand(`title ${name} title "${text}" `);

  res.json({ success: true, result });
});

// TPS
app.get('/api/tps', async (req, res) => {
  const result = await getTPS();
  res.json(result);
});

// Server Statistics
app.get('/api/stats', async (req, res) => {
  const result = await getServerStats();
  res.json(result);
});

// Logs
app.get('/api/logs', async (req, res) => {
  const lines = parseInt(req.query.lines) || 100;
  const result = await getLogs(lines);
  res.json(result);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverStatus });
});

app.post("/api/worlds/delete", async (req, res) => {
  try {
    const { world } = req.body;

    if (!world) {
      return res.json({ success: false, message: "World name required" });
    }

    const worldPath = path.join(process.cwd(), "paper-server", world);

    // Check if world exists
    try {
      await fs.stat(worldPath);
    } catch {
      return res.json({ success: false, message: "World does not exist" });
    }

    // Delete folder
    await fs.rm(worldPath, { recursive: true, force: true });

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.json({ success: false, message: "Internal server error" });
  }
});
app.post("/api/players/getkill", async (req, res) => {
  const { uid } = req.body;
  console.log(uid);
  if (!uid) {
    return res.json({ success: false, message: "uid missing" });
  }

  try {
    const kills = await getPlayerKills(uid);

    if (kills) {
      return res.json({ success: true, kills });
    } else {
      return res.json({ success: false, kills: null });
    }

  } catch (err) {
    console.error("Error:", err);
    return res.json({ success: false });
  }
});
app.get('/api/config', async (req, res) => {
      try {
        const config = await fs.readFile('./config.json', 'utf-8');
        res.json({ success: true, config: JSON.parse(config) });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to read config', error: error.message });
      }


});
app.post('/api/players/tp', async (req, res)  => {
    const { player, X, Y, Z } = req.body || {};

    if (!player || X === undefined || Y === undefined || Z === undefined) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: player, X, Y, Z"
        });
    }

   
    const command = `tp ${player} ${X} ${Y} ${Z}`;
    const f = await executeCommand(command)
    console.log("Teleport Command:", command);

    // Respond OK
    res.json({
        success: true,
        message: `Player ${player} teleported to ${X} ${Y} ${Z}`
    });
});
app.post('/api/players/removeitem', async (req, res)  => {
    const {  Player,itemObj, Amt} = req.body || {};

    if (!Player || !itemObj || !Amt) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: player, item"
        });
    }

   
    const command = `clear ${Player} ${itemObj} ${Amt}`;
    const f = await executeCommand(command)
    console.log("clear Command:", command);

    // Respond OK
    res.json({
        success: true,
        message: `Cleared ${Amt} of ${itemObj} from ${Player} `
    });
});
server.listen(API_PORT, () => {
  console.log(`PaperMC Dashboard API server running on http://localhost:${API_PORT}`);
  console.log(`Configure SERVER_PATH environment variable to point to your PaperMC server directory`);
  addLog(`API server started on port ${API_PORT}`);
});

