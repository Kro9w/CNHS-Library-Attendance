import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

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

  return (
    <>
      <div style={hoverZoneStyle} onMouseEnter={() => setVisible(true)} />
      <div style={containerStyle} onMouseLeave={() => setVisible(false)}>
        <div
          className="d-flex justify-content-center gap-3 p-3 bg-light shadow"
          style={{ borderRadius: "25px", width: "80%" }}
        >
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            className="btn btn-outline-info"
            onClick={() => navigate("/statistics")}
          >
            Statistics
          </button>
          <button
            className="btn btn-outline-success"
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
