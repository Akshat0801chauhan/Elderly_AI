import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import AddMedicineForm from "./AddMedicineForm";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ Fetch medicines
  const fetchMedicines = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/medicine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch medicines");

      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Fetch progress
  const fetchProgress = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/medicine/progress", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch progress");

      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

  if (!confirmLogout) return;
  try {
    await fetch("http://localhost:8080/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  } catch {}

  localStorage.removeItem("token");
  navigate("/");
};
  const markTaken = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/medicine/take/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchMedicines();
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // 🔥 IMPORTANT: protect dashboard
    if (!token) {
      navigate("/");
      return;
    }

    fetchMedicines();
    fetchProgress();
  }, []);

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Memory Helper</h2>
        <p className="sub">Your caring companion</p>
        <div className="menu" onClick={() => navigate("/profile")}>
          👤 Profile
        </div>

        <div className="menu">💊 Medicine</div>
        <div className="menu">❤️ Memories</div>
        <div className="menu">✔ Activities</div>

       

        <div
          className="menu"
          onClick={handleLogout}
        >
          🚪 Logout
        </div>
         
      </div>

      {/* Main */}
      <div className="main">
        <h2>Medications Today</h2>

        {medicines.length === 0 && !showForm ? (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <p>No medicines added yet</p>
            <button onClick={() => setShowForm(true)}>
              + Add Medicine
            </button>
          </div>
        ) : (
          <>
            <button
              style={{ marginBottom: "15px" }}
              onClick={() => setShowForm(true)}
            >
              + Add Medicine
            </button>

            {showForm && (
              <AddMedicineForm
                close={() => {
                  setShowForm(false);
                  setEditingMed(null);
                }}
                fetchMedicines={fetchMedicines}
                fetchProgress={fetchProgress}
                existing={editingMed}
              />
            )}

            {medicines.map((med) => (
              <div className="card" key={med.id}>
                <div>
                  <h3>{med.name}</h3>
                  <p>{med.dosage}</p>
                </div>

                <span className="time">{med.time}</span>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className={med.taken ? "taken" : "take"}
                    onClick={() => !med.taken && markTaken(med.id)}
                  >
                    {med.taken ? "✔ Taken" : "Take Now"}
                  </button>

                  <button
                    onClick={() => {
                      setEditingMed(med);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Progress */}
      <div className="progress-box">
        <h3>Progress</h3>

        <p>{progress} of {medicines.length}</p>

        <div className="progress-bar">
          <div
            className="fill"
            style={{
              width: `${(progress / (medicines.length || 1)) * 100}%`,
            }}
          ></div>
        </div>

        <p className="msg">You are doing wonderfully today!</p>
      </div>
    </div>
  );
}