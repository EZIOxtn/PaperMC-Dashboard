import { FiGithub, FiTwitter, FiGlobe } from "react-icons/fi"; // make sure you `npm install react-icons`

type SidebarProps = {
  selected: string;
  onSelect: (item: string) => void;
};

export default function Sidebar({ selected, onSelect }: SidebarProps) {
  const menu = ["Dashboard", "Console", "Players", "TPS", "Plugins", "Settings","Config"];

  return (
    <div
      style={{
        width: 220,
        background: "#0a0a0a",
        height: "100vh",
        paddingTop: 20,
        borderRight: "2px solid #0f0",
        boxShadow: "2px 0 12px rgba(0,255,0,0.15)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
         fontFamily: "Minecraft"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {menu.map((item) => {
          const isSelected = selected === item;
          return (
            <div
              key={item}
              onClick={() => onSelect(item)}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
                background: isSelected ? "#0f0" : "transparent",
                color: isSelected ? "#000" : "#0f0",
                fontWeight: "bold",
                borderRadius: 6,
                transition: "all 0.2s ease-in-out",
                boxShadow: isSelected
                  ? "inset 0 0 8px rgba(0,255,0,0.5)"
                  : "0 0 2px rgba(0,255,0,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "rgba(0,255,0,0.1)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              {item}
            </div>
          );
        })}
      </div>

      {/* Footer Section */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid #0f0",
          textAlign: "center",
          color: "#0f0",
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        <div style={{ marginBottom: 6 }}>Made with ❤️ by MyName</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <a
            href="https://github.com/MyUsername"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0f0", transition: "0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#afffaf")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#0f0")}
          >
            <FiGithub size={16} />
          </a>
          <a
            href="https://twitter.com/MyUsername"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0f0", transition: "0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#afffaf")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#0f0")}
          >
            <FiTwitter size={16} />
          </a>
          <a
            href="https://mywebsite.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0f0", transition: "0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#afffaf")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#0f0")}
          >
            <FiGlobe size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
