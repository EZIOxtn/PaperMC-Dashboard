// ConfirmRemove.jsx
import React from "react";


type infox ={
  item: string,
  player:string,
  qte: number,
  imgx: string
  onCancel: ()=> void ,
onConfirm: ()=> void}

export default function ConfirmRemove({ item, player, qte,imgx,  onCancel, onConfirm}: infox) {
  if (!item || !player) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.03)",
        backdropFilter: "blur(1px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: "#0a0a0a94",
          border: "2px solid #0f0",
          padding: 28,
          borderRadius: 12,
          width: 380,
          textAlign: "center",
          boxShadow: "0 0 20px #0f0",
        }}
      >
        <h3
          style={{
            color: "#0f0",
            marginBottom: 12,
            fontSize: 20,
            textShadow: "0 0 6px #0f0",
          }}
        >
          Confirm Action
        </h3>

        <p
          style={{
            color: "#ddd",
            marginBottom: 20,
            lineHeight: 1.5,
            fontSize: 15,
          }}
        >
          Are you sure you want to remove
          <br />
          <span style={{ color: "#9ff29f", fontWeight: "bold" }}>x{qte} {item.replace("_"," ")}</span>
          <br />
          <img
                src={imgx}
                alt={"13"}
                style={{
                  width: 44,
                  height: 44,
                  display: "block",
                  margin: "0 auto 4px",
                  
                  borderRadius: 4,
                 // background: "#111",
                 // boxShadow: "0 1px 3px rgba(0,255,0,0.2)",
                }}
              />
              <br />
          from player
          <br />
          <span style={{ color: "#93f093", fontWeight: "bold" }}>{player}</span>
          <br />
          This action cannot be undone.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onCancel}
            style={{
              background: "#222",
              border: "2px solid #666",
              padding: "8px 20px",
              borderRadius: 6,
              color: "#ccc",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#aaa")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#666")}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: "#300",
              border: "2px solid #f00",
              padding: "8px 18px",
              borderRadius: 6,
              color: "#faa",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 10px #f00")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            Yes, Remove
          </button>
        </div>
      </div>
    </div>
  );
}
