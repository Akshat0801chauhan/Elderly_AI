import React, { useEffect, useState } from "react";
import "./Dashboard.css";
<<<<<<< HEAD
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import { FaPills, FaCheck, FaExclamationCircle, FaClock, FaArrowRight } from "react-icons/fa";
import { useRef } from "react";
=======
import AddMedicineForm from "./AddMedicineForm";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import { FaPills, FaCheck, FaPen, FaClock, FaExclamationCircle } from "react-icons/fa";


// Parse "HH:mm" → today's Date object for comparison
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
function parseTimeToday(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

<<<<<<< HEAD
function formatAmPm(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getTimeUntil(timeStr) {
  const t = parseTimeToday(timeStr);
  if (!t) return null;
  const diff = t - new Date();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
}

function ProgressRing({ taken, total }) {
  const pct = total > 0 ? taken / total : 0;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="#d18b2c"
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-num">{taken}/{total}</span>
        <span className="ring-sub">taken</span>
=======
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
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
const hasFetched = useRef(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:8080/api/medicine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Fetch failed:", res.status);
        return;
      }

      const text = await res.text();
      setLogs(text ? JSON.parse(text) : []);

    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const markTaken = async (medicineId) => {
  const token = localStorage.getItem("token");

  await fetch(`http://localhost:8080/api/medicine/take/${medicineId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // reload safely
  setLoading(true);
  await fetchData();
};

 useEffect(() => {
  if (hasFetched.current) return; 
  hasFetched.current = true;

  const controller = new AbortController();

  const load = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/medicine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error("Fetch failed:", res.status);
        return;
      }

      const data = await res.json();
      setLogs(data);

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  load();


  return () => {
    controller.abort();
  };

}, [navigate]);

  const now = new Date();
  const total = logs.length;
  const taken = logs.filter(l => l.taken).length; 

  const due = logs.filter(
    l => !l.taken && parseTimeToday(l.medicine?.time) <= now
  );

  const upcoming = logs
    .filter(l => !l.taken && parseTimeToday(l.medicine?.time) > now)
    .sort(
      (a, b) =>
        parseTimeToday(a.medicine?.time) -
        parseTimeToday(b.medicine?.time)
    );

  const nextMed = upcoming[0];
  const allDone = total > 0 && due.length === 0 && upcoming.length === 0;

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Layout>
      <div className="dash-main">

        {/* Greeting */}
        <div className="dash-greeting">
          <h2>{greeting()}, stay healthy! 💛</h2>
          <p className="dash-date">
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {loading ? (
          <div className="dash-loading">Loading your medicines...</div>
        ) : (
          <>
            {/* Top Row */}
            <div className="dash-top-row">

              {/* Progress */}
              <div className="dash-card dash-card--ring">
                <p className="dash-card-label">Today's Progress</p>
                <ProgressRing taken={taken} total={total} />
                {allDone && <p className="dash-all-done">🎉 All done for today!</p>}
              </div>

              {/* Next Medicine */}
              <div className="dash-card dash-card--next">
                <p className="dash-card-label">Next Medicine</p>
                {nextMed ? (
                  <>
                    <div className="next-med-name">{nextMed.medicine?.name}</div>
                    <div className="next-med-dosage">{nextMed.medicine?.dosage}</div>
                    <div className="next-med-time">
                      <FaClock /> {formatAmPm(nextMed.medicine?.time)}
                    </div>
                    <div className="next-med-countdown">
                      {getTimeUntil(nextMed.medicine?.time)}
                    </div>
                  </>
                ) : (
                  <div className="next-med-empty">
                    {allDone ? "All medicines taken ✓" : "No upcoming medicines"}
                  </div>
                )}
              </div>
            </div>

            {/* Due Section */}
            {due.length > 0 && (
              <div className="dash-reminder-section">
                <h3 className="dash-section-title dash-section-title--due">
                  <FaExclamationCircle /> Due Now
                </h3>

                {due.map(log => (
                  <div className="reminder-card reminder-card--due" key={log.id}>
                    <div className="reminder-left">
                      <div className="reminder-icon reminder-icon--due"><FaPills /></div>
                      <div>
                        <p className="reminder-name">{log.medicine?.name}</p>
                        <p className="reminder-detail">
                          {log.medicine?.dosage} · {formatAmPm(log.medicine?.time)}
                        </p>
                      </div>
                    </div>

                    <button
                      className="reminder-take-btn"
                      onClick={() => markTaken(log.medicine?.id)}
                    >
                      Take Now
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              className="dash-manage-btn"
              onClick={() => navigate("/medicines")}
            >
              Manage all medicines <FaArrowRight />
            </button>
          </>
        )}
=======
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
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
      </div>
    </Layout>
  );
}