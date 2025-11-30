import React from "react";

export default function TopBar() {
  const text = "PaperMC Dashboard";

  return (
    <div
      style={{
        height: 60,
        background: "#111",
        borderBottom: "2px solid #0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
         fontFamily: "Minecraft",
      }}
    >
      {/* Animated letters */}
      <div style={{ display: "flex", gap: 2 }}>
        {text.split("").map((char, index) => (
          <span
            key={index}
            style={{
              display: "inline-block",
              fontSize: 22,
              fontWeight: "bold",
              color: "#0f0",
              animation: `neonMove 1.5s ${index * 0.05}s infinite alternate`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>

      {/* Embedded CSS for animation */}
      <style>
        {`
          @keyframes neonMove {
            0% {
              transform: translateY(0px);
              text-shadow: 0 0 4px #0f0;
              color: #0f0;
            }
            50% {
              transform: translateY(-5px);
              text-shadow: 0 0 6px #0f0, 0 0 12px #0f0, 0 0 18px #0f0;
              color: #afffaf;
            }
            100% {
              transform: translateY(0px);
              text-shadow: 0 0 4px #0f0;
              color: #0f0;
            }
          }
        `}
      </style>
    </div>
  );
}
