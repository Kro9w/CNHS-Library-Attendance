import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  // State to manage hover effect for each button
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const hoverZoneStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "10px",
    zIndex: 1001,
  };

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: "10px",
    left: 0,
    right: 0,
    transform: visible ? "translateY(0)" : "translateY(-100%)",
    transition: "transform 0.3s ease-in-out",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    width: "100%",
  };

  // Base style for buttons
  const btnStyle: React.CSSProperties = {
    backgroundColor: "var(--light-gray)",
    color: "var(--green)",
    border: "none",
    borderRadius: "25px",
    padding: "0.5rem 1.5rem",
    fontWeight: "600",
    fontFamily: "Poppins, sans-serif",
    transition: "all 0.3s ease",
  };

  // Style for buttons on hover
  const btnHoverStyle: React.CSSProperties = {
    backgroundColor: "white",
    color: "var(--dark-green)",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  };

  return (
    <>
      <div style={hoverZoneStyle} onMouseEnter={() => setVisible(true)} />
      <div style={containerStyle} onMouseLeave={() => setVisible(false)}>
        <div
          className="d-flex justify-content-center gap-3 p-3 shadow"
          style={{
            borderRadius: "50px",
            width: "auto",
            backgroundColor: "var(--green)",
          }}
        >
          <button
            style={{
              ...btnStyle,
              ...(hoveredButton === "home" ? btnHoverStyle : {}),
            }}
            onMouseEnter={() => setHoveredButton("home")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            style={{
              ...btnStyle,
              ...(hoveredButton === "statistics" ? btnHoverStyle : {}),
            }}
            onMouseEnter={() => setHoveredButton("statistics")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => navigate("/statistics")}
          >
            Statistics
          </button>
          <button
            style={{
              ...btnStyle,
              ...(hoveredButton === "admin" ? btnHoverStyle : {}),
            }}
            onMouseEnter={() => setHoveredButton("admin")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        </div>
      </div>
    </>
  );
};

export default NavBar;
