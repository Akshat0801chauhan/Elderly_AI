import React, { useEffect, useState } from "react";
import "./Medicines.css";
import Layout from "./Layout";
import AddMedicineForm from "./AddMedicineForm";
import { useNavigate } from "react-router-dom";
import {
  FaPills, FaCheck, FaExclamationCircle, FaClock,
  FaPen, FaTrash, FaPlus, FaSearch
} from "react-icons/fa";
import { buildCaregiverEndpoint, getSelectedElderlyUser } from "../utils/caregiverContext";

function parseTimeToday(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
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
  if (med.breakfastTiming && med.breakfastTiming !== "NONE") parts.push(`${med.breakfastTiming.toLowerCase()} breakfast`);
  if (med.lunchTiming && med.lunchTiming !== "NONE") parts.push(`${med.lunchTiming.toLowerCase()} lunch`);
  if (med.dinnerTiming && med.dinnerTiming !== "NONE") parts.push(`${med.dinnerTiming.toLowerCase()} dinner`);
  return parts.join(", ");
}

function isMedicineActiveOn(med, date) {
  if (!med.startDate) return false;
  const start = new Date(med.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(med.startDate);
  end.setDate(end.getDate() + (med.numberOfDays || 1) - 1);
  end.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d >= start && d <= end;
}

function MedCard({ log, status, isElderly, onTake, onEdit, onDelete, takingId }) {
  const med = log.medicine || log;
  const mealInfo = formatMeal(med);
  const showTakeAction = isElderly && status !== "completed" && med.id;
  const showManageActions = !isElderly;

  return (
    <div className={`mc mc--${status}`}>
      <div className="mc-left">
        <div className={`mc-icon mc-icon--${status}`}>
          {status === "completed" ? <FaCheck /> : status === "due" ? <FaExclamationCircle /> : <FaPills />}
        </div>
        <div className="mc-info">
          <p className="mc-name">{med.name}</p>
          <p className="mc-dosage">{med.dosage}</p>
          {mealInfo && <p className="mc-meta">{mealInfo}</p>}
          {med.notes && <p className="mc-meta">Notes: {med.notes}</p>}
        </div>
      </div>

      <div className="mc-right">
        <span className="mc-time">{formatAmPm(med.time)}</span>

        {status === "completed" && <span className="mc-badge mc-badge--done"><FaCheck /> Taken</span>}
        {status === "due" && <span className="mc-badge mc-badge--due"><FaExclamationCircle /> Due</span>}
        {status === "upcoming" && <span className="mc-badge mc-badge--upcoming"><FaClock /> Upcoming</span>}

        <div className="mc-actions">
          {showTakeAction ? (
            <button
              className="mc-take-btn"
              onClick={() => onTake(med.id)}
              disabled={takingId === med.id}
              title="Take now"
            >
              <FaCheck />
              {takingId === med.id ? "Saving..." : "Take now"}
            </button>
          ) : showManageActions ? (
            <>
              <button className="mc-action mc-action--edit" onClick={() => onEdit(log)} title="Edit">
                <FaPen />
              </button>
              <button className="mc-action mc-action--del" onClick={() => onDelete(med.id)} title="Delete">
                <FaTrash />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ medicines, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));

  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="cal-wrap">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))}>{"<"}</button>
        <span className="cal-title">{months[month]} {year}</span>
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))}>{">"}</button>
      </div>
      <div className="cal-days">
        {days.map((day) => <div key={day} className="cal-day-lbl">{day}</div>)}
      </div>
      <div className="cal-cells">
        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;
          const isToday = date.getTime() === today.getTime();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const hasMed = medicines.some((medicine) => isMedicineActiveOn(medicine, date));
          return (
            <div
              key={index}
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

function SchedulePanel({ medicines, date }) {
  const active = medicines
    .filter((medicine) => isMedicineActiveOn(medicine, date))
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  const label = diff === 0
    ? "Today"
    : diff === 1
      ? "Tomorrow"
      : diff === -1
        ? "Yesterday"
        : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="sched-panel">
      <p className="sched-label">{label}'s schedule</p>
      {active.length === 0 ? (
        <p className="sched-empty">No medicines on this day.</p>
      ) : (
        active.map((medicine) => (
          <div className="sched-item" key={medicine.id}>
            <div className="sched-dot" />
            <div>
              <p className="sched-name">{medicine.name} <span className="sched-dose">{medicine.dosage}</span></p>
              <p className="sched-time">{formatAmPm(medicine.time)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function Medicines() {
  const [logs, setLogs] = useState([]);
  const [allMeds, setAllMeds] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [takingId, setTakingId] = useState(null);
  const [caregiverTarget, setCaregiverTarget] = useState(getSelectedElderlyUser());

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isElderly = role === "ELDERLY";
  const isCaregiver = role === "CAREGIVER";
  const medicineBasePath = isCaregiver && caregiverTarget?.id
    ? buildCaregiverEndpoint(caregiverTarget.id, "/medicines")
    : "http://localhost:8080/api/medicine";

  const fetchProfile = async () => {
    const response = await fetch("http://localhost:8080/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      navigate("/");
      return null;
    }

    if (!response.ok) return null;
    const data = await response.json();
    setRole(data.role || "");
    return data;
  };

  const fetchToday = async (userRole, targetUser) => {
    const endpoint = userRole === "CAREGIVER" && targetUser?.id
      ? buildCaregiverEndpoint(targetUser.id, "/medicines/today")
      : "http://localhost:8080/api/medicine";

    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      const text = await response.text();
      setLogs(text ? JSON.parse(text) : []);
    } catch {
      setLogs([]);
    }
  };

  const fetchAll = async (userRole, targetUser) => {
    const endpoint = userRole === "CAREGIVER" && targetUser?.id
      ? buildCaregiverEndpoint(targetUser.id, "/medicines")
      : "http://localhost:8080/api/medicine/all";

    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      const text = await response.text();
      setAllMeds(text ? JSON.parse(text) : []);
    } catch {
      setAllMeds([]);
    }
  };

  const fetchAllData = async () => {
    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const profile = await fetchProfile();
      const nextRole = profile?.role || "";
      const targetUser = nextRole === "CAREGIVER" ? getSelectedElderlyUser() : null;
      setCaregiverTarget(targetUser);

      if (nextRole === "CAREGIVER" && !targetUser?.id) {
        setLogs([]);
        setAllMeds([]);
        return;
      }

      await Promise.all([
        fetchToday(nextRole, targetUser),
        fetchAll(nextRole, targetUser),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (medicineId) => {
    try {
      setTakingId(medicineId);
      const response = await fetch(`http://localhost:8080/api/medicine/take/${medicineId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      if (!response.ok) return;
      await fetchToday(role, caregiverTarget);
    } finally {
      setTakingId(null);
    }
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    await fetch(`${medicineBasePath}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const now = new Date();
  const completed = logs.filter((log) => log.taken);
  const due = logs.filter((log) => !log.taken && parseTimeToday(log.medicine?.time) <= now);
  const upcoming = logs
    .filter((log) => !log.taken && parseTimeToday(log.medicine?.time) > now)
    .sort((a, b) => parseTimeToday(a.medicine?.time) - parseTimeToday(b.medicine?.time));

  const filterLogs = (list) => (
    search
      ? list.filter((log) =>
          log.medicine?.name?.toLowerCase().includes(search.toLowerCase()) ||
          log.medicine?.dosage?.toLowerCase().includes(search.toLowerCase()))
      : list
  );

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

  if (isCaregiver && !caregiverTarget?.id) {
    return (
      <Layout>
        <div className="med-page">
          <div className="med-empty">
            <FaPills />
            <p>Select an elder from the dashboard before managing medicines.</p>
            <button className="med-add-btn" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="med-page">
        <div className="med-header">
          <div>
            <h2 className="med-page-title">Medicines</h2>
            <p className="med-page-sub">
              {isElderly
                ? "Track your medicines and mark them as taken"
                : `Manage daily medication${caregiverTarget?.name ? ` for ${caregiverTarget.name}` : ""}`}
            </p>
          </div>
          {!isElderly && (
            <button className="med-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
              <FaPlus /> Add Medicine
            </button>
          )}
        </div>

        <div className="med-tabs">
          {["today", ...(!isElderly ? ["calendar"] : [])].map((tab) => (
            <button
              key={tab}
              className={`med-tab ${activeTab === tab ? "med-tab--on" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "today" ? "Today" : "Calendar"}
            </button>
          ))}
        </div>

        {activeTab === "today" && (
          <>
            <div className="med-search-wrap">
              <FaSearch className="med-search-icon" />
              <input
                className="med-search"
                placeholder="Search medicines..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {logs.length === 0 ? (
              <div className="med-empty">
                <FaPills />
                <p>No medicines scheduled for today.</p>
                {!isElderly && (
                  <button className="med-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
                    <FaPlus /> Add Medicine
                  </button>
                )}
              </div>
            ) : (
              <div className="med-sections">
                <div className="med-section">
                  <div className="med-section-head med-section-head--due">
                    <FaExclamationCircle />
                    <span>Due</span>
                    <span className="med-section-badge">{due.length}</span>
                  </div>
                  <div className="med-section-body">
                    {filterLogs(due).length === 0 ? (
                      <p className="med-section-empty">No due medicines</p>
                    ) : (
                      filterLogs(due).map((log) => (
                        <MedCard
                          key={log.id}
                          log={log}
                          status="due"
                          isElderly={isElderly}
                          onTake={markAsTaken}
                          takingId={takingId}
                          onEdit={(item) => { setEditing(item.medicine || item); setShowForm(true); }}
                          onDelete={deleteMedicine}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="med-section">
                  <div className="med-section-head med-section-head--upcoming">
                    <FaClock />
                    <span>Upcoming</span>
                    <span className="med-section-badge">{upcoming.length}</span>
                  </div>
                  <div className="med-section-body">
                    {filterLogs(upcoming).length === 0 ? (
                      <p className="med-section-empty">No upcoming medicines</p>
                    ) : (
                      filterLogs(upcoming).map((log) => (
                        <MedCard
                          key={log.id}
                          log={log}
                          status="upcoming"
                          isElderly={isElderly}
                          onTake={markAsTaken}
                          takingId={takingId}
                          onEdit={(item) => { setEditing(item.medicine || item); setShowForm(true); }}
                          onDelete={deleteMedicine}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="med-section">
                  <div className="med-section-head med-section-head--done">
                    <FaCheck />
                    <span>Completed</span>
                    <span className="med-section-badge">{completed.length}</span>
                  </div>
                  <div className="med-section-body">
                    {filterLogs(completed).length === 0 ? (
                      <p className="med-section-empty">None taken yet</p>
                    ) : (
                      filterLogs(completed).map((log) => (
                        <MedCard
                          key={log.id}
                          log={log}
                          status="completed"
                          isElderly={isElderly}
                          onTake={markAsTaken}
                          takingId={takingId}
                          onEdit={(item) => { setEditing(item.medicine || item); setShowForm(true); }}
                          onDelete={deleteMedicine}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!isElderly && activeTab === "calendar" && (
          <div className="cal-layout">
            <MiniCalendar medicines={allMeds} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <SchedulePanel medicines={allMeds} date={selectedDate} />
          </div>
        )}

        {!isElderly && showForm && (
          <AddMedicineForm
            close={() => { setShowForm(false); setEditing(null); }}
            fetchMedicines={fetchAllData}
            fetchProgress={async () => {}}
            existing={editing}
            apiBasePath={medicineBasePath}
          />
        )}
      </div>
    </Layout>
  );
}
