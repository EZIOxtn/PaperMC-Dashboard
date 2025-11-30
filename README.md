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
- **TypeScript 5**: Type-safe backend development
- **Socket.io**: Real-time event-based communication
- **Rcon Client**: Remote console connection to Minecraft servers
- **Winston**: Structured logging for better debugging

### Database & Storage
- **SQLite**: Lightweight file-based database for user data and configurations
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
cd client && npm install
cd ../server && npm install
```

### 3. Configure Your Server

Edit the server configuration file:

```bash
cp server/config.example.json server/config.json
```

Update `server/config.json` with your PaperMC server details:

```json
{
  "servers": [
    {
      "id": "survival",
      "name": "Survival Server",
      "host": "localhost",
      "port": 25565,
      "rconPort": 25575,
      "rconPassword": "your_rcon_password"
    }
  ],
  "dashboard": {
    "port": 3000,
    "sessionSecret": "your_session_secret_here"
  }
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
cd client && npm run dev
```

### 6. Access the Dashboard

Open your browser and navigate to:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`

## 📁 Project Structure

```
PaperMC-Dashboard/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API service functions
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── server/                # Express.js backend application
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic services
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   ├── config.json       # Server configuration
│   ├── package.json
│   └── tsconfig.json
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
├── package.json          # Root package.json
└── README.md
```

## ⚙️ Configuration

### Server Configuration

The main configuration is stored in `server/config.json`:

```json
{
  "servers": [
    {
      "id": "unique_server_id",
      "name": "Display Name",
      "host": "server_ip_address",
      "port": 25565,
      "rconPort": 25575,
      "rconPassword": "secure_password",
      "description": "Server description"
    }
  ],
  "dashboard": {
    "port": 3000,
    "sessionSecret": "random_secret_string",
    "enableAuth": false,
    "defaultTheme": "dark"
  },
  "logging": {
    "level": "info",
    "file": "logs/dashboard.log"
  }
}
```

### Environment Variables

You can also configure the dashboard using environment variables:

```bash
# Server Configuration
DASHBOARD_PORT=3000
SESSION_SECRET=your_secret_here
NODE_ENV=production

# Database
DATABASE_PATH=./data/dashboard.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/dashboard.log
```

## 🔧 API Reference

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/status
```

### Server Management

```http
GET    /api/servers                    # Get all servers
GET    /api/servers/:id                # Get specific server
POST   /api/servers/:id/start          # Start server
POST   /api/servers/:id/stop           # Stop server
POST   /api/servers/:id/restart        # Restart server
GET    /api/servers/:id/status         # Get server status
GET    /api/servers/:id/stats          # Get server statistics
```

### Player Management

```http
GET    /api/servers/:id/players        # Get online players
GET    /api/servers/:id/players/:name  # Get player info
POST   /api/servers/:id/players/kick   # Kick player
POST   /api/servers/:id/players/ban    # Ban player
DELETE /api/servers/:id/players/unban  # Unban player
```

### Server Commands

```http
POST   /api/servers/:id/command        # Execute server command
GET    /api/servers/:id/logs           # Get server logs
GET    /api/servers/:id/chat           # Get chat history
```

## 🎨 Customization

### Theming

The dashboard supports custom themes. You can modify the theme by editing:

```typescript
// client/src/theme/index.ts
export const customTheme = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#your_primary_color',
    },
    secondary: {
      main: '#your_secondary_color',
    },
  },
  // ... other theme options
};
```

### Adding Custom Components

1. Create your component in `client/src/components/`
2. Export it from `client/src/components/index.ts`
3. Import and use it in your pages

### Extending the API

1. Create new routes in `server/src/routes/`
2. Implement controllers in `server/src/controllers/`
3. Add services in `server/src/services/`

## 🔒 Security Considerations

- **RCON Security**: Always use strong RCON passwords
- **Network Security**: Consider using VPN or SSH tunnels for remote server access
- **Authentication**: Enable authentication in production environments
- **Firewall**: Configure proper firewall rules for RCON ports
- **HTTPS**: Use reverse proxy with SSL/HTTPS in production

## 🐛 Troubleshooting

### Common Issues

**RCON Connection Failed**
```bash
# Check if RCON is enabled in server.properties
enable-rcon=true
rcon.port=25575
rcon.password=your_password

# Verify firewall settings
sudo ufw allow 25575
```

**Frontend Not Loading**
```bash
# Check if ports are available
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Server Status Not Updating**
```bash
# Check WebSocket connection in browser console
# Verify server is running and accessible
curl http://localhost:3001/api/servers
```

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=papermc-dashboard:* npm run dev
```

## 📈 Performance Optimization

### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle size analysis and optimization
- Service worker for caching

### Backend Optimization
- Database query optimization
- Response caching strategies
- WebSocket connection pooling
- Memory usage monitoring

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript and ESLint configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

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
- 📧 **Email**: your-email@example.com

## 🔮 Roadmap

- [ ] **Multi-server Support**: Enhanced management for multiple server instances
- [ ] **Plugin Marketplace**: Direct plugin installation and management
- [ ] **Backup System**: Automated world and configuration backups
- [ ] **Mobile App**: Native mobile application for iOS and Android
- [ ] **Advanced Analytics**: More detailed server analytics and reporting
- [ ] **Integration APIs**: Third-party service integrations (Discord, Slack, etc.)
- [ ] **Cluster Management**: Support for server clusters and load balancing

---

**Made with ❤️ for the Minecraft Community**

<div align="center">
  <sub>Built with React, TypeScript, and Express.js</sub>
</div>
