import React, { useEffect, useState } from "react";
import "./Medicines.css";
import Layout from "./Layout";
import AddMedicineForm from "./AddMedicineForm";
import { useNavigate } from "react-router-dom";
import { FaPills, FaCheck, FaExclamationCircle, FaClock, FaPen, FaTrash, FaPlus } from "react-icons/fa";

// ── HELPERS ───────────────────────────────────────────────────────────────────

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
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatMeal(med) {
  const parts = [];
  if (med.breakfastTiming && med.breakfastTiming !== "NONE") parts.push(`${med.breakfastTiming.toLowerCase()} breakfast`);
  if (med.lunchTiming     && med.lunchTiming     !== "NONE") parts.push(`${med.lunchTiming.toLowerCase()} lunch`);
  if (med.dinnerTiming    && med.dinnerTiming     !== "NONE") parts.push(`${med.dinnerTiming.toLowerCase()} dinner`);
  return parts.join(", ");
}

function isMedicineActiveOn(med, date) {
  if (!med.startDate) return false;
  const start = new Date(med.startDate);
  const end   = new Date(med.startDate);
  end.setDate(end.getDate() + (med.numberOfDays || 1) - 1);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
  return d >= start && d <= end;
}

// ── MINI CALENDAR ─────────────────────────────────────────────────────────────

function MiniCalendar({ medicines, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date());

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const today = new Date(); today.setHours(0,0,0,0);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const MONTH_NAMES = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];
  const DAY_NAMES   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div className="cal-wrap">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{MONTH_NAMES[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-grid cal-grid--days">
        {DAY_NAMES.map(d => <div key={d} className="cal-day-label">{d}</div>)}
      </div>

      <div className="cal-grid cal-grid--cells">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const isToday    = date.getTime() === today.getTime();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const hasMed     = medicines.some(m => isMedicineActiveOn(m, date));
          return (
            <div
              key={date.getDate()}
              className={`cal-cell ${isToday ? "cal-cell--today" : ""} ${isSelected ? "cal-cell--selected" : ""}`}
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

// ── MEDICINE CARD ─────────────────────────────────────────────────────────────

function MedCard({ log, status, onTake, onEdit, onDelete }) {
  const med = log.medicine || log;
  const mealInfo = formatMeal(med);

  return (
    <div className={`med-card med-card--${status}`}>
      <div className="med-left">
        <div className={`med-icon med-icon--${status}`}>
          {status === "completed" ? <FaCheck /> : status === "due" ? <FaExclamationCircle /> : <FaPills />}
        </div>
        <div>
          <h3>{med.name}</h3>
          <p className="med-dosage">{med.dosage}</p>
          {mealInfo && <p className="med-meta">{mealInfo}</p>}
          {med.notes && <p className="med-meta">📝 {med.notes}</p>}
        </div>
      </div>
      <div className="med-right">
        <span className="med-time">{formatAmPm(med.time)}</span>
        {status === "completed" && <span className="badge badge--done"><FaCheck /> Taken</span>}
        {status === "due"       && <button className="take-btn" onClick={() => onTake(med.id)}>Take Now</button>}
        {status === "upcoming"  && <span className="badge badge--upcoming"><FaClock /> Upcoming</span>}
        <div className="med-actions">
          <button className="action-btn action-btn--edit" onClick={() => onEdit(log)}><FaPen /></button>
          <button className="action-btn action-btn--del"  onClick={() => onDelete(med.id)}><FaTrash /></button>
        </div>
      </div>
    </div>
  );
}

// ── SCHEDULE LIST (for selected date) ─────────────────────────────────────────

function ScheduleForDate({ medicines, date }) {
  const active = medicines.filter(m => isMedicineActiveOn(m, date))
                          .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const label = (() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const d     = new Date(date); d.setHours(0,0,0,0);
    if (d.getTime() === today.getTime()) return "Today";
    const diff = Math.round((d - today) / 86400000);
    if (diff === 1)  return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  })();

  return (
    <div className="schedule-panel">
      <p className="schedule-date-label">{label}'s schedule</p>
      {active.length === 0 ? (
        <p className="schedule-empty">No medicines scheduled for this day.</p>
      ) : (
        active.map(m => (
          <div className="schedule-item" key={m.id}>
            <div className="schedule-dot" />
            <div>
              <p className="schedule-name">{m.name} <span className="schedule-dosage">{m.dosage}</span></p>
              <p className="schedule-time">{formatAmPm(m.time)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function Medicines() {
  const [logs, setLogs]           = useState([]);   // today's logs with taken status
  const [allMeds, setAllMeds]     = useState([]);   // all medicines for calendar
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today"); // "today" | "calendar"

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchToday = async () => {
    try {
      const res  = await fetch("http://localhost:8080/api/medicine", { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      setLogs(text ? JSON.parse(text) : []);
    } catch { setLogs([]); }
  };

  const fetchAll = async () => {
    try {
      const res  = await fetch("http://localhost:8080/api/medicine/all", { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      setAllMeds(text ? JSON.parse(text) : []);
    } catch { setAllMeds([]); }
  };

  const fetchProgress = async () => {}; // stub — not needed here

  const markTaken = async (medicineId) => {
    await fetch(`http://localhost:8080/api/medicine/take/${medicineId}`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    await fetchToday();
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
    if (!token) return navigate("/login");
    fetchToday();
    fetchAll();
  }, []);

  // Categorise today's logs
  const now      = new Date();
  const completed = logs.filter(l =>  l.taken);
  const due       = logs.filter(l => !l.taken && parseTimeToday(l.medicine?.time) <= now);
  const upcoming  = logs.filter(l => !l.taken && parseTimeToday(l.medicine?.time) > now)
                        .sort((a, b) => parseTimeToday(a.medicine?.time) - parseTimeToday(b.medicine?.time));

  const Section = ({ title, items, status, accent }) => {
    if (items.length === 0) return null;
    return (
      <div className="med-section">
        <div className="med-section-header" style={{ borderColor: accent }}>
          <span className="med-section-dot" style={{ background: accent }} />
          <h3 className="med-section-title">{title}</h3>
          <span className="med-section-count" style={{ background: accent + "22", color: accent }}>{items.length}</span>
        </div>
        {items.map(log => (
          <MedCard
            key={log.id}
            log={log}
            status={status}
            onTake={markTaken}
            onEdit={(l) => { setEditing(l.medicine || l); setShowForm(true); }}
            onDelete={deleteMedicine}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="med-page">

        {/* ── Header ── */}
        <div className="med-page-header">
          <div>
            <h2>Medicines</h2>
            <p className="med-page-sub">Manage your medication schedule</p>
          </div>
          <button className="med-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
            <FaPlus /> Add Medicine
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="med-tabs">
          <button className={`med-tab ${activeTab === "today" ? "med-tab--active" : ""}`} onClick={() => setActiveTab("today")}>Today</button>
          <button className={`med-tab ${activeTab === "calendar" ? "med-tab--active" : ""}`} onClick={() => setActiveTab("calendar")}>Calendar</button>
        </div>

        {/* ── Today tab ── */}
        {activeTab === "today" && (
          <div>
            {logs.length === 0 && (
              <div className="med-empty">
                <FaPills className="med-empty-icon" />
                <p>No medicines scheduled for today.</p>
                <button className="med-add-btn" onClick={() => setShowForm(true)}><FaPlus /> Add Medicine</button>
              </div>
            )}
            <Section title="Due — Take Now" items={due}       status="due"       accent="#e53e3e" />
            <Section title="Upcoming"       items={upcoming}  status="upcoming"  accent="#d18b2c" />
            <Section title="Completed"      items={completed} status="completed" accent="#38a169" />
          </div>
        )}

        {/* ── Calendar tab ── */}
        {activeTab === "calendar" && (
          <div className="cal-layout">
            <MiniCalendar
              medicines={allMeds}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <ScheduleForDate medicines={allMeds} date={selectedDate} />
          </div>
        )}

        {/* ── Form modal ── */}
        {showForm && (
          <AddMedicineForm
            close={() => { setShowForm(false); setEditing(null); }}
            fetchMedicines={async () => { await fetchToday(); await fetchAll(); }}
            fetchProgress={fetchProgress}
            existing={editing}
          />
        )}
      </div>
    </Layout>
  );
}