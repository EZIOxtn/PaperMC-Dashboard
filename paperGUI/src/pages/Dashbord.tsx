import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import ServerControls from "../components/servercontrol";
import ConsolePanel from "../components/console";
import CommandBar from "../components/commandbar";
import PlayersPanel from "../components/players";
import TPSPanel from "../components/tps";
import PluginsPanel from "../components/plugins";
import SettingsPanel from "../components/settings";
import PlayerDetails from "../components/playerDetails";
import MainDashboard from "../components/maindashboard";
import ServerConfig from "../components/ServerConfig";

function DashboardContent() {
  const navigate = useNavigate();

  // optional: for highlighting sidebar selection
  const [selected, setSelected] = useState("Dashboard");

  const handleSelect = (name: string) => {
    setSelected(name);

    // map selected to route
    switch (name) {
      case "Dashboard":
        navigate("/");
        break;
      case "Console":
        navigate("/console");
        break;
      case "Players":
        navigate("/players");
        break;
      case "TPS":
        navigate("/tps");
        break;
      case "Plugins":
        navigate("/plugins");
        break;
      case "Settings":
        navigate("/settings");
        break;
      case "Config":
        navigate("/config");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar selected={selected} onSelect={handleSelect} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />

        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <Routes>
            <Route path="/" element={<MainDashboard />} />
            <Route
              path="/console"
              element={
                <>
                  <ServerControls />
                  <ConsolePanel />
                  <CommandBar />
                </>
              }
            />
            <Route path="/players" element={<PlayersPanel />} />
            <Route path="/tps" element={<TPSPanel />} />
            <Route path="/plugins" element={<PluginsPanel />} />
            <Route path="/settings" element={<SettingsPanel />} />
            <Route path="/config" element={<ServerConfig />} />
            <Route path="/player/:playerName" element={<PlayerDetails />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Router>
      <DashboardContent />
    </Router>
  );
}
