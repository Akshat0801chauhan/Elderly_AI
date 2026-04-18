import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome, FaUser, FaHeart, FaCheck, FaSignOutAlt, FaPills, FaTasks,
} from "react-icons/fa";
import { clearSelectedElderlyUser, getSelectedElderlyUser } from "../utils/caregiverContext";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedElderly = getSelectedElderlyUser();

  const handleLogout = () => {
    const shouldLogout = window.confirm("Are you sure you want to log out?");
    if (!shouldLogout) return;
    clearSelectedElderlyUser();
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (paths) =>
    Array.isArray(paths)
      ? paths.some((path) => location.pathname === path)
      : location.pathname === paths;

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-top">
          <h2 className="logo">Memory Helper</h2>
          <p className="sub">Your caring companion</p>
          {selectedElderly?.name && (
            <p className="sub" style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
              Managing: {selectedElderly.name}
            </p>
          )}

          <div className="sidebar-nav">
            <div
              className={`menu ${isActive(["/", "/dashboard"]) ? "active" : ""}`}
              onClick={() => navigate("/dashboard")}
            >
              <FaHome /> <span>Home</span>
            </div>

            <div
              className={`menu ${isActive("/medicines") ? "active" : ""}`}
              onClick={() => navigate("/medicines")}
            >
              <FaPills /> <span>Medicines</span>
            </div>

            <div
              className={`menu ${isActive("/activity") ? "active" : ""}`}
              onClick={() => navigate("/activity")}
            >
              <FaTasks /> <span>Activities</span>
            </div>

            <div
              className={`menu ${isActive("/assistant") ? "active" : ""}`}
              onClick={() => navigate("/assistant")}
            >
              <FaCheck /> <span>Personal AI</span>
            </div>

            <div className="menu">
              <FaHeart /> <span>Memories</span>
            </div>

            <div
              className={`menu ${isActive("/profile") ? "active" : ""}`}
              onClick={() => navigate("/profile")}
            >
              <FaUser /> <span>Profile</span>
            </div>
          </div>
        </div>

        <div className="menu logout" onClick={handleLogout}>
          <FaSignOutAlt /> <span>Logout</span>
        </div>
      </div>

      {children}
    </div>
  );
}
