import { useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>Memory Helper</h2>
        <p className="sub">Your caring companion</p>

        <div className="menu" onClick={() => navigate("/profile")}>
          👤 Profile
        </div>

        <div className="menu" onClick={() => navigate("/dashboard")}>
          💊 Medicine
        </div>

        <div className="menu">❤️ Memories</div>
        <div className="menu">✔ Activities</div>

        <div className="menu" onClick={handleLogout}>
          🚪 Logout
        </div>
      </div>

      {/* 🔥 THIS IS THE MOST IMPORTANT LINE */}
      {children}

    </div>
  );
}