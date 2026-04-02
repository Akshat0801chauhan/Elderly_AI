import React, { useEffect, useState } from "react";
import "./Medicines.css";
import Layout from "./Layout";
import AddMedicineForm from "./AddMedicineForm";
import { useNavigate } from "react-router-dom";
import {
  FaPills, FaCheck, FaExclamationCircle, FaClock,
  FaPen, FaTrash, FaPlus, FaSearch
} from "react-icons/fa";

function parseTimeToday(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d;
}

function formatAmPm(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatMeal(med) {
  const parts = [];
  if (med.breakfastTiming && med.breakfastTiming !== "NONE")
    parts.push(`${med.breakfastTiming.toLowerCase()} breakfast`);
  if (med.lunchTiming && med.lunchTiming !== "NONE")
    parts.push(`${med.lunchTiming.toLowerCase()} lunch`);
  if (med.dinnerTiming && med.dinnerTiming !== "NONE")
    parts.push(`${med.dinnerTiming.toLowerCase()} dinner`);
  return parts.join(", ");
}

function isMedicineActiveOn(med, date) {
  if (!med.startDate) return false;
  const start = new Date(med.startDate); start.setHours(0, 0, 0, 0);
  const end   = new Date(med.startDate);
  end.setDate(end.getDate() + (med.numberOfDays || 1) - 1);
  end.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  return d >= start && d <= end;
}


function MedCard({ log, status, onEdit, onDelete }) {
  const med = log.medicine || log;
  const mealInfo = formatMeal(med);

  return (
    <div className={`mc mc--${status}`}>
      {/* Left: icon + info */}
      <div className="mc-left">
        <div className={`mc-icon mc-icon--${status}`}>
          {status === "completed" ? <FaCheck /> : status === "due" ? <FaExclamationCircle /> : <FaPills />}
        </div>
        <div className="mc-info">
          <p className="mc-name">{med.name}</p>
          <p className="mc-dosage">{med.dosage}</p>
          {mealInfo && <p className="mc-meta">{mealInfo}</p>}
          {med.notes && <p className="mc-meta">📝 {med.notes}</p>}
        </div>
      </div>

      {/* Right: time + action */}
      <div className="mc-right">
        <span className="mc-time">{formatAmPm(med.time)}</span>

        {status === "completed" && (
          <span className="mc-badge mc-badge--done"><FaCheck /> Taken</span>
        )}
        {status === "due" && <span className="mc-badge mc-badge--due"><FaExclamationCircle /> Due</span>}
        {status === "upcoming" && (
          <span className="mc-badge mc-badge--upcoming"><FaClock /> Upcoming</span>
        )}

        <div className="mc-actions">
          <button
            className="mc-action mc-action--edit"
            onClick={() => onEdit(log)}
            title="Edit"
          >
            <FaPen />
          </button>
          <button
            className="mc-action mc-action--del"
            onClick={() => onDelete(med.id)}
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MINI CALENDAR ─────────────────────────────────────────────────────────────
function MiniCalendar({ medicines, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div className="cal-wrap">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
        <span className="cal-title">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="cal-days">
        {DAYS.map(d => <div key={d} className="cal-day-lbl">{d}</div>)}
      </div>
      <div className="cal-cells">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const isToday    = date.getTime() === today.getTime();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const hasMed     = medicines.some(m => isMedicineActiveOn(m, date));
          return (
            <div
              key={i}
              className={`cal-cell ${isToday ? "cal-cell--today" : ""} ${isSelected ? "cal-cell--sel" : ""}`}
              onClick={() => onSelectDate(date)}
            >
              {date.getDate()}
              {hasMed && <span className="cal-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SCHEDULE PANEL ────────────────────────────────────────────────────────────
function SchedulePanel({ medicines, date }) {
  const active = medicines
    .filter(m => isMedicineActiveOn(m, date))
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="sched-panel">
      <p className="sched-label">{label}'s schedule</p>
      {active.length === 0
        ? <p className="sched-empty">No medicines on this day.</p>
        : active.map(m => (
          <div className="sched-item" key={m.id}>
            <div className="sched-dot" />
            <div>
              <p className="sched-name">{m.name} <span className="sched-dose">{m.dosage}</span></p>
              <p className="sched-time">{formatAmPm(m.time)}</p>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Medicines() {
  const [logs, setLogs]       = useState([]);
  const [allMeds, setAllMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch]   = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchToday = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/medicine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      const text = await res.text();
      setLogs(text ? JSON.parse(text) : []);
    } catch { setLogs([]); }
  };

  const fetchAll = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/medicine/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      const text = await res.text();
      setAllMeds(text ? JSON.parse(text) : []);
    } catch { setAllMeds([]); }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchToday(), fetchAll()]);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    await fetch(`http://localhost:8080/api/medicine/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    await fetchToday();
    await fetchAll();
  };

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchAllData();
  }, []);

  const now = new Date();
  const completed = logs.filter(l => l.taken);
  const due = logs.filter(l => !l.taken && parseTimeToday(l.medicine?.time) <= now);
  const upcoming = logs
    .filter(l => !l.taken && parseTimeToday(l.medicine?.time) > now)
    .sort((a, b) => parseTimeToday(a.medicine?.time) - parseTimeToday(b.medicine?.time));

  // filter by search
  const filterLogs = (list) =>
    search
      ? list.filter(l =>
          l.medicine?.name?.toLowerCase().includes(search.toLowerCase()) ||
          l.medicine?.dosage?.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  if (loading) {
    return (
      <Layout>
        <div className="med-page">
          <div className="med-loading">
            <div className="med-spinner" />
            Retrieving your medication records...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="med-page">

        {/* ── Header ── */}
        <div className="med-header">
          <div>
            <h2 className="med-page-title">Medicines</h2>
            <p className="med-page-sub">Manage your daily medication</p>
          </div>
          <button className="med-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
            <FaPlus /> Add Medicine
          </button>
        </div>

        {/* ── Tab switcher ── */}
        <div className="med-tabs">
          {["today", "calendar"].map(tab => (
            <button
              key={tab}
              className={`med-tab ${activeTab === tab ? "med-tab--on" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "today" ? "Today" : "Calendar"}
            </button>
          ))}
        </div>

        {/* ── TODAY TAB ── */}
        {activeTab === "today" && (
          <>
            {/* Search */}
            <div className="med-search-wrap">
              <FaSearch className="med-search-icon" />
              <input
                className="med-search"
                placeholder="Search medicines..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {logs.length === 0 ? (
              <div className="med-empty">
                <FaPills />
                <p>No medicines scheduled for today.</p>
                <button className="med-add-btn" onClick={() => setShowForm(true)}>
                  <FaPlus /> Add Medicine
                </button>
              </div>
            ) : (
              /* ── Three horizontal section tabs ── */
              <div className="med-sections">

                {/* Due */}
                <div className="med-section">
                  <div className="med-section-head med-section-head--due">
                    <FaExclamationCircle />
                    <span>Due</span>
                    <span className="med-section-badge">{due.length}</span>
                  </div>
                  <div className="med-section-body">
                    {filterLogs(due).length === 0
                      ? <p className="med-section-empty">No due medicines</p>
                      : filterLogs(due).map(log => (
                        <MedCard key={log.id} log={log} status="due"
                          onEdit={l => { setEditing(l.medicine || l); setShowForm(true); }}
                          onDelete={deleteMedicine}
                        />
                      ))
                    }
                  </div>
                </div>

                {/* Upcoming */}
                <div className="med-section">
                  <div className="med-section-head med-section-head--upcoming">
                    <FaClock />
                    <span>Upcoming</span>
                    <span className="med-section-badge">{upcoming.length}</span>
                  </div>
                  <div className="med-section-body">
                    {filterLogs(upcoming).length === 0
                      ? <p className="med-section-empty">No upcoming medicines</p>
                      : filterLogs(upcoming).map(log => (
                        <MedCard key={log.id} log={log} status="upcoming"
                          onEdit={l => { setEditing(l.medicine || l); setShowForm(true); }}
                          onDelete={deleteMedicine}
                        />
                      ))
                    }
                  </div>
                </div>

                {/* Completed */}
                <div className="med-section">
                  <div className="med-section-head med-section-head--done">
                    <FaCheck />
                    <span>Completed</span>
                    <span className="med-section-badge">{completed.length}</span>
                  </div>
                  <div className="med-section-body">
                    {filterLogs(completed).length === 0
                      ? <p className="med-section-empty">None taken yet</p>
                      : filterLogs(completed).map(log => (
                        <MedCard key={log.id} log={log} status="completed"
                          onEdit={l => { setEditing(l.medicine || l); setShowForm(true); }}
                          onDelete={deleteMedicine}
                        />
                      ))
                    }
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* ── CALENDAR TAB ── */}
        {activeTab === "calendar" && (
          <div className="cal-layout">
            <MiniCalendar
              medicines={allMeds}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <SchedulePanel medicines={allMeds} date={selectedDate} />
          </div>
        )}

        {/* ── Form modal ── */}
        {showForm && (
          <AddMedicineForm
            close={() => { setShowForm(false); setEditing(null); }}
            fetchMedicines={fetchAllData}
            fetchProgress={async () => {}}
            existing={editing}
          />
        )}
      </div>
    </Layout>
  );
}
