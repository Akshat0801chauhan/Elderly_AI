import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome, FaUser, FaHeart, FaCheck, FaSignOutAlt, FaPills,
} from "react-icons/fa";

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    const shouldLogout = window.confirm("Are you sure you want to log out?");
    if (!shouldLogout) return;
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (paths) =>
    Array.isArray(paths)
      ? paths.some(p => location.pathname === p)
      : location.pathname === paths;

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">✨ Memory Helper</h2>
        <p className="sub">Your caring companion</p>

        <div className={`menu ${isActive(["/", "/dashboard"]) ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}>
          <FaHome /> <span>Home</span>
        </div>

        <div className={`menu ${isActive("/medicines") ? "active" : ""}`}
          onClick={() => navigate("/medicines")}>
          <FaPills /> <span>Medicines</span>
        </div>

        <div className={`menu ${isActive("/profile") ? "active" : ""}`}
          onClick={() => navigate("/profile")}>
          <FaUser /> <span>Profile</span>
        </div>
        <div
          className={`menu ${isActive("/assistant") ? "active" : ""}`}
          onClick={() => navigate("/assistant")}>
          <FaCheck /> <span>Personal AI</span>
        </div>

        <div className="menu">
          <FaHeart /> <span>Memories</span>
        </div>



        <div className="menu logout" onClick={handleLogout}>
          <FaSignOutAlt /> <span>Logout</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {children}

    </div>
  );
}
