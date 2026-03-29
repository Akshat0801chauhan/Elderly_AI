import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaHeart,
  FaCheck,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");

    try {
     
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
     
      console.error("Logout request failed", e);
    } finally {
      
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">✨ Memory Helper</h2>
        <p className="sub">Your caring companion</p>

        {/* HOME */}
        <div
          className={`menu ${
            location.pathname === "/" || location.pathname === "/dashboard"
              ? "active"
              : ""
          }`}
          onClick={() => {
            if (
              location.pathname !== "/" &&
              location.pathname !== "/dashboard"
            ) {
              navigate("/");
            }
          }}
        >
          <FaHome /> <span>Home</span>
        </div>

        {/* PROFILE */}
        <div
          className={`menu ${location.pathname === "/profile" ? "active" : ""}`}
          onClick={() => {
            if (location.pathname !== "/profile") {
              navigate("/profile");
            }
          }}
        >
          <FaUser /> <span>Profile</span>
        </div>

        {/* OTHER */}
        <div className="menu">
          <FaHeart /> <span>Memories</span>
        </div>

        <div className="menu">
          <FaCheck /> <span>Activities</span>
        </div>

        {/* LOGOUT */}
        <div className="menu logout" onClick={handleLogout}>
          <FaSignOutAlt /> <span>Logout</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {children}

    </div>
  );
}