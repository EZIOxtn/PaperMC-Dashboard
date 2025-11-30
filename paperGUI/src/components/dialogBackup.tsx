// dialogBackup.jsx
import React from "react";

type infox = {
  world: string,
  typex: string, 
  imgx: string
  onCancel: () => void,
  onConfirm: () => void
}

export default function ConfirmBuckup({ world, imgx, onCancel, onConfirm }: infox) {
  if (!world) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 20, 40, 0.1)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      {/* Additional blur layer for stronger background blur */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(4px)",
          zIndex: -1,
        }}
      />
      
      <div
        style={{
          background: "linear-gradient(135deg, #0a1a2a 0%, #0d2b4a 100%)",
          border: "2px solid #4fc3f7",
          padding: 32,
          borderRadius: 16,
          width: 400,
          textAlign: "center",
          boxShadow: `
            0 0 30px #2196f3,
            0 8px 32px rgba(0, 100, 200, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: "radial-gradient(circle, #2196f3 0%, transparent 70%)",
            opacity: 0.3,
            borderRadius: "50%",
          }}
        />
        
        <h3
          style={{
            color: "#4fc3f7",
            marginBottom: 16,
            fontSize: 22,
            fontWeight: "600",
            textShadow: "0 0 10px #2196f3, 0 2px 4px rgba(0, 0, 0, 0.5)",
            letterSpacing: "0.5px",
          }}
        >
          Confirm Backup
        </h3>

        <p
          style={{
            color: "#e3f2fd",
            marginBottom: 24,
            lineHeight: 1.6,
            fontSize: 15,
            fontWeight: "400",
          }}
        >
          Are you sure you want to backup
          <br />
          <span style={{ 
            color: "#81d4fa", 
            fontWeight: "600",
            fontSize: "16px",
            textShadow: "0 0 6px #29b6f6"
          }}>
            {world.replace("_", " ")}
          </span>
          <br />
          
          <img
            src={imgx}
            alt="Backup preview"
            style={{
              width: 52,
              height: 52,
              display: "block",
              margin: "12px auto 8px",
              borderRadius: 8,
              border: "1px solid #29b6f6",
              boxShadow: "0 0 12px rgba(33, 150, 243, 0.4)",
              objectFit: "cover",
            }}
          />
          
          <br />
          <span style={{ 
            color: "#4fc3f7", 
            fontWeight: "300",
            fontSize: "12px",
            letterSpacing: "1px"
          }}>
            ••••••••••••
          </span>
          <br />
        </p>

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between",
          gap: 16,
          marginTop: 8
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "linear-gradient(135deg, #263238 0%, #37474f 100%)",
              border: "2px solid #546e7a",
              padding: "10px 24px",
              borderRadius: 8,
              color: "#e3f2fd",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s ease",
              flex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#90a4ae";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(120, 144, 156, 0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#546e7a";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
              border: "2px solid #42a5f5",
              padding: "10px 24px",
              borderRadius: 8,
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s ease",
              flex: 1,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px #2196f3, 0 4px 8px rgba(0, 100, 200, 0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.background = "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)";
            }}
          >
            Confirm Backup
          </button>
        </div>
      </div>
    </div>
  );
}