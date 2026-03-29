import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import AddMedicineForm from "./AddMedicineForm";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import { FaPills, FaCheck, FaPen } from "react-icons/fa";

export default function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const navigate = useNavigate();

  // Safe fetch wrapper
  const isLoggingOut = React.useRef(false);

const safeFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  if (!token || isLoggingOut.current) {
    if (!isLoggingOut.current) navigate("/");
    return null;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {          // ← use 401, not 403
    if (!isLoggingOut.current) {
      isLoggingOut.current = true;
      alert("Session expired. Please login again.");
      localStorage.clear();
      navigate("/");
    }
    return null;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
  // Fetch medicines
  const fetchMedicines = async () => {
    const data = await safeFetch("http://localhost:8080/api/medicine");
    if (data) setMedicines(data);
  };

  // Fetch progress (FIXED)
  const fetchProgress = async () => {
    const data = await safeFetch(
      "http://localhost:8080/api/medicine/progress"
    );

    if (data) {
      setProgress(data.taken || 0); 
    }
  };

  //  Mark taken
  const markTaken = async (id) => {
    await safeFetch(
      `http://localhost:8080/api/medicine/take/${id}`,
      { method: "PUT" }
    );

    fetchMedicines();
    fetchProgress();
  };

  useEffect(() => {
    fetchMedicines();
    fetchProgress();
  }, []);

  return (
    <Layout>
      <div className="main">
        <h2>Medications Today</h2>

        <button className="add-btn" onClick={() => setShowForm(true)}>
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
          <div
            className={`med-card ${med.taken ? "done" : ""}`}
            key={med.id}
          >
            <FaPen
              className="edit-icon"
              onClick={() => {
                setEditingMed(med);
                setShowForm(true);
              }}
            />

            <div className="med-left">
              <div className="med-icon">
                <FaPills />
              </div>

              <div>
                <h3>{med.name}</h3>
                <p>{med.dosage}</p>
              </div>
            </div>

            <div className="med-right">
              <span className="time">{med.time}</span>

              <button
                className={med.taken ? "taken-btn" : "take-btn"}
                onClick={() => !med.taken && markTaken(med.id)}
              >
                {med.taken ? (
                  <>
                    <FaCheck /> Taken
                  </>
                ) : (
                  "Take Now"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PROGRESS */}
      <div className="progress-box">
        <h3>Daily Activities</h3>

        <div className="progress-header">
          <span>Progress</span>
          <span className="count">
            {progress} of {medicines.length}
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="fill"
            style={{
              width: `${
                (progress / (medicines.length || 1)) * 100
              }%`,
            }}
          ></div>
        </div>

        <p className="msg">You are doing wonderfully today!</p>
      </div>
    </Layout>
  );
}