import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import AddMedicineForm from "./AddMedicineForm";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import { FaPills, FaCheck, FaPen, FaClock, FaExclamationCircle } from "react-icons/fa";

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Parse "HH:mm" → today's Date object for comparison
function parseTimeToday(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function categorizeMedicines(medicines) {
  const now = new Date();
  const completed = [];
  const due       = [];
  const upcoming  = [];

  medicines.forEach((med) => {
    if (med.taken) {
      completed.push(med);
    } else {
      const medTime = parseTimeToday(med.time);
      if (medTime && medTime <= now) {
        due.push(med);       // time has passed, not taken
      } else {
        upcoming.push(med);  // time is in the future
      }
    }
  });

  // Sort due oldest-first (most overdue at top), upcoming soonest-first
  due.sort((a, b) => parseTimeToday(a.time) - parseTimeToday(b.time));
  upcoming.sort((a, b) => parseTimeToday(a.time) - parseTimeToday(b.time));

  return { completed, due, upcoming };
}

function formatMealTiming(med) {
  const parts = [];
  if (med.breakfastTiming && med.breakfastTiming !== "NONE")
    parts.push(`${med.breakfastTiming.toLowerCase()} breakfast`);
  if (med.lunchTiming && med.lunchTiming !== "NONE")
    parts.push(`${med.lunchTiming.toLowerCase()} lunch`);
  if (med.dinnerTiming && med.dinnerTiming !== "NONE")
    parts.push(`${med.dinnerTiming.toLowerCase()} dinner`);
  return parts.join(", ");
}

// ── MED CARD ──────────────────────────────────────────────────────────────────

function MedCard({ med, status, onTake, onEdit }) {
  const mealInfo = formatMealTiming(med);

  return (
    <div className={`med-card med-card--${status}`}>
      <FaPen
        className="edit-icon"
        onClick={() => onEdit(med)}
      />

      <div className="med-left">
        <div className={`med-icon med-icon--${status}`}>
          {status === "completed" && <FaCheck />}
          {status === "due"       && <FaExclamationCircle />}
          {status === "upcoming"  && <FaPills />}
        </div>
        <div>
          <h3>{med.name}</h3>
          <p className="med-dosage">{med.dosage}</p>
          {mealInfo && <p className="med-meal">{mealInfo}</p>}
          {med.notes && <p className="med-notes">📝 {med.notes}</p>}
        </div>
      </div>

      <div className="med-right">
        <span className="time">{med.time}</span>
        {status === "completed" && (
          <span className="status-badge badge--done"><FaCheck /> Taken</span>
        )}
        {status === "due" && (
          <button className="take-btn take-btn--due" onClick={() => onTake(med.id)}>
            Take Now
          </button>
        )}
        {status === "upcoming" && (
          <span className="status-badge badge--upcoming"><FaClock /> Upcoming</span>
        )}
      </div>
    </div>
  );
}

// ── SECTION ───────────────────────────────────────────────────────────────────

function Section({ title, medicines, status, onTake, onEdit, accent }) {
  if (medicines.length === 0) return null;

  return (
    <div className="med-section">
      <div className="med-section__header" style={{ borderColor: accent }}>
        <span className="med-section__dot" style={{ background: accent }} />
        <h3 className="med-section__title">{title}</h3>
        <span className="med-section__count" style={{ background: accent + "22", color: accent }}>
          {medicines.length}
        </span>
      </div>
      <div className="med-section__list">
        {medicines.map((med) => (
          <MedCard
            key={med.id}
            med={med}
            status={status}
            onTake={onTake}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [progress, setProgress]   = useState(0);
  const [showForm, setShowForm]   = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchMedicines = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/medicine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { console.error("fetchMedicines failed:", res.status); return; }
      const text = await res.text();
      setMedicines(text ? JSON.parse(text) : []);
    } catch (err) {
      console.error("fetchMedicines error:", err);
      setMedicines([]);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/medicine/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      setProgress(text ? JSON.parse(text) : 0);
    } catch {
      setProgress(0);
    }
  };

  const markTaken = async (id) => {
    await fetch(`http://localhost:8080/api/medicine/take/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchMedicines();
    await fetchProgress();
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    fetchMedicines();
    fetchProgress();
  }, []);

  const { completed, due, upcoming } = categorizeMedicines(medicines);
  const total = medicines.length;
  const progressPct = total > 0 ? Math.round((progress / total) * 100) : 0;

  const allDone  = total > 0 && due.length === 0 && upcoming.length === 0;
  const noneYet  = total === 0;

  return (
    <Layout>
      <div className="main">

        {/* ── Header ── */}
        <div className="dash-header">
          <h2>Medications Today</h2>
          <button className="add-btn" onClick={() => { setEditingMed(null); setShowForm(true); }}>
            + Add Medicine
          </button>
        </div>

        {/* ── Add / Edit form ── */}
        {showForm && (
          <AddMedicineForm
            close={() => { setShowForm(false); setEditingMed(null); }}
            fetchMedicines={fetchMedicines}
            fetchProgress={fetchProgress}
            existing={editingMed}
          />
        )}

        {/* ── Empty state ── */}
        {noneYet && (
          <div className="empty-state">
            <FaPills className="empty-icon" />
            <p>No medicines scheduled for today.</p>
            <button className="add-btn" onClick={() => setShowForm(true)}>
              + Add your first medicine
            </button>
          </div>
        )}

        {/* ── All done banner ── */}
        {allDone && (
          <div className="all-done-banner">
            <FaCheck /> All medicines taken for today. Great job! 🎉
          </div>
        )}

        {/* ── Due section (most urgent — shown first) ── */}
        <Section
          title="Due — Take Now"
          medicines={due}
          status="due"
          onTake={markTaken}
          onEdit={(med) => { setEditingMed(med); setShowForm(true); }}
          accent="#e53e3e"
        />

        {/* ── Upcoming section ── */}
        <Section
          title="Upcoming"
          medicines={upcoming}
          status="upcoming"
          onTake={markTaken}
          onEdit={(med) => { setEditingMed(med); setShowForm(true); }}
          accent="#d18b2c"
        />

        {/* ── Completed section ── */}
        <Section
          title="Completed"
          medicines={completed}
          status="completed"
          onTake={markTaken}
          onEdit={(med) => { setEditingMed(med); setShowForm(true); }}
          accent="#38a169"
        />

      </div>

      {/* ── Progress sidebar ── */}
      <div className="progress-box">
        <h3>Daily Activities</h3>

        <div className="progress-header">
          <span>Progress</span>
          <span className="count">{progress} of {total}</span>
        </div>

        <div className="progress-bar">
          <div className="fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Mini summary pills */}
        <div className="progress-pills">
          <div className="progress-pill pill--due">
            <span>{due.length}</span> Due
          </div>
          <div className="progress-pill pill--upcoming">
            <span>{upcoming.length}</span> Upcoming
          </div>
          <div className="progress-pill pill--done">
            <span>{completed.length}</span> Done
          </div>
        </div>

        <p className="msg">
          {allDone
            ? "You are doing wonderfully today! 🌟"
            : due.length > 0
            ? `${due.length} medicine${due.length > 1 ? "s" : ""} need${due.length === 1 ? "s" : ""} attention!`
            : "You are doing wonderfully today!"}
        </p>
      </div>
    </Layout>
  );
}