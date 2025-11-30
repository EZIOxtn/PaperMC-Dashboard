# PaperMC Dashboard

![PaperMC Dashboard](https://img.shields.io/badge/PaperMC-Dashboard-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Express.js](https://img.shields.io/badge/Express.js-4-green?style=for-the-badge&logo=express)
![Node.js](https://img.shields.io/badge/Node.js-18-green?style=for-the-badge&logo=nodedotjs)

A modern, feature-rich dashboard for managing PaperMC Minecraft servers with real-time monitoring, player management, and comprehensive server administration capabilities.

## 🚀 Features

### Server Management
- **Real-time Server Status**: Monitor server uptime, TPS, and performance metrics
- **Remote Control**: Start, stop, restart, and manage multiple PaperMC servers
- **Configuration Management**: Edit server properties and configurations through the web interface
- **Plugin Management**: Install, update, and manage server plugins remotely

### Player Management
- **Online Player Tracking**: View currently connected players with detailed information
- **Player Statistics**: Track player activity, playtime, and server statistics
- **Chat Monitoring**: Real-time chat logs and moderation tools
- **Whitelist & Ban Management**: Manage player access and server security

### Monitoring & Analytics
- **Performance Metrics**: CPU, RAM, and network usage monitoring
- **World Statistics**: Track world size, entities, and chunks
- **Custom Dashboards**: Create personalized monitoring views
- **Historical Data**: View server performance trends over time

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Customizable interface themes
- **Real-time Updates**: Live data refresh using WebSocket connections
- **Interactive Charts**: Beautiful data visualization with Chart.js

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript 5**: Type-safe JavaScript development
- **Material-UI**: React component library for consistent design
- **Chart.js**: Data visualization and analytics charts
- **Socket.io Client**: Real-time bidirectional communication
- **Axios**: HTTP client for API requests

### Backend
- **Node.js 18+**: JavaScript runtime environment
- **Express.js 4**: Fast, unopinionated web framework
- **Socket.io**: Real-time event-based communication
- **Rcon Client**: Remote console connection to Minecraft servers
- **Winston**: Structured logging for better debugging

### Database & Storage
- **JSON Configuration**: Server settings and preferences storage

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher (or **yarn** 1.22+)
- **PaperMC Server** 1.19+ with RCON enabled
- **Git** for cloning the repository

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/EZIOxtn/PaperMC-Dashboard.git
cd PaperMC-Dashboard
```

### 2. Install Dependencies

```bash
# Install both frontend and backend dependencies
npm run install:all

# Or install separately
cd paperGUI && npm install
cd ../server && npm install
```

### 3. Configure Your Server

Edit the server configuration file:

```bash
/config.json 
```

Update `server/config.json` with your PaperMC server details:

```json
{
   
    "defJava": "java",
    "defjavaArgs": [
      "-Xmx2G",
      "-Xms1G",
      "-jar",
      "jarPath",  
      "--nogui"],
    "serverPath": "paper-server",
    "serverJar": "./paper-1.21.4-232.jar"

    
    



}
```

### 4. Enable RCON on Your PaperMC Server

Make sure RCON is enabled in your `server.properties` file:

```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_rcon_password
```

### 5. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start separately
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd paperGUI && npm run dev
```

### 6. Access the Dashboard

Open your browser and navigate to:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`

## 📁 Project Structure

```
PaperMC-Dashboard/
├── paperGUI/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── assets/     # assets folde 'must be decompressed'
│   │   ├── pages/        # pages
│   │   └── utils/        # Utility functions  'api , js parser'
│   ├── app...
├── server/                # Express.js backend application
|   |-- index.js
│   ├── config.json       # Server configuration
│   ├── package.json
│   └── tsconfig.json
├── scripts/              # Build and deployment scripts
├── package.json          # Root package.json
└── README.md
```

## ⚙️ Configuration

### Server Configuration

The main configuration is stored in `server/config.json`:

## 🔧 API Reference

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/status
```

### Server Management

```http
POST    /api/server/start            # start the server
POST    /api/server/stop             # stop ..
POST   /api/server/restart           # restart ..
GET   /api/server/status             # server status
POST   /api/server/command           # paper server command execution
GET    /api/players                  # player list
GET/POST    /api/player/:::          # Players commands
....
```

### Player Management


## 🔒 Security Considerations

- ⚠ the server has no security yet, FOR PERSONAL USE ONLY NOT FOR COMMERCIAL


#
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PaperMC Team** for the amazing Minecraft server software
- **React Community** for the excellent UI library
- **Express.js Team** for the robust backend framework
- **Material-UI Team** for the beautiful component library
- All contributors and users of this dashboard

## 📞 Support

If you encounter any issues or have questions:

- 📋 **Issues**: [GitHub Issues](https://github.com/EZIOxtn/PaperMC-Dashboard/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/EZIOxtn/PaperMC-Dashboard/discussions)

## 🔮 Roadmap

- [ ] **Multi-server Support**: Enhanced management for multiple server instances
- [ ] **Plugin Marketplace**: Direct plugin installation and management
- [ ] **Mobile App**: Native mobile application for iOS and Android
- [ ] **Security** : security support
- [ ] **Advanced Analytics**: More detailed server analytics and reporting
- [ ] **Integration APIs**: Third-party service integrations (Discord, Slack, etc.)
- [ ] **Cluster Management**: Support for server clusters and load balancing

---

**Made with ❤️ for the Minecraft Community**

<div align="center">
  <sub>Built with React, TypeScript, and Express.js</sub>
</div>
