import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import {
  FaPills, FaCheck, FaExclamationCircle, FaClock, FaArrowRight,
  FaTint, FaWalking, FaRobot, FaUtensils
} from "react-icons/fa";

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
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div className="ring-wrap">
      <svg width="124" height="124" viewBox="0 0 124 124">
        <circle cx="62" cy="62" r={r} fill="none" stroke="#f0f2f5" strokeWidth="10" />
        <circle
          cx="62"
          cy="62"
          r={r}
          fill="none"
          stroke="#d18b2c"
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 62 62)"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-num">{taken}/{total}</span>
        <span className="ring-sub">taken</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [role, setRole] = useState("");
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const [medRes, profileRes] = await Promise.all([
        fetch("http://localhost:8080/api/medicine", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8080/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (
        medRes.status === 401 || medRes.status === 403 ||
        profileRes.status === 401 || profileRes.status === 403
      ) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!medRes.ok) {
        console.error("Fetch failed:", medRes.status);
        return;
      }

      const [medText, profileData] = await Promise.all([
        medRes.text(),
        profileRes.ok ? profileRes.json() : Promise.resolve(null),
      ]);

      setLogs(medText ? JSON.parse(medText) : []);
      setRole(profileData?.role || "");
      setProfileName(profileData?.name || "");
    } catch (err) {
      console.error(err);
      setLogs([]);
      setRole("");
      setProfileName("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  const now = new Date();
  const total = logs.length;
  const taken = logs.filter((l) => l.taken).length;
  const due = logs.filter((l) => !l.taken && parseTimeToday(l.medicine?.time) <= now);
  const upcoming = logs
    .filter((l) => !l.taken && parseTimeToday(l.medicine?.time) > now)
    .sort((a, b) => parseTimeToday(a.medicine?.time) - parseTimeToday(b.medicine?.time));
  const nextMed = upcoming[0];
  const allDone = total > 0 && due.length === 0 && upcoming.length === 0;
  const isElderly = role === "ELDERLY";
  const checklistItems = [...due, ...upcoming].slice(0, 3);

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profileName.trim().split(" ").filter(Boolean)[0];

  const companionTitle = () => {
    if (due.length > 0) return "A few medicines need your attention";
    if (upcoming.length > 0) return "You are on track for today";
    if (allDone) return "Wonderful, today's medicines are done";
    return "A calm day ahead";
  };

  const companionNote = () => {
    if (due.length > 0) {
      return `Take ${due.length} due medicine${due.length > 1 ? "s" : ""} when you are ready, then continue your routine comfortably.`;
    }
    if (upcoming.length > 0 && nextMed?.medicine?.time) {
      return `Your next medicine is at ${formatAmPm(nextMed.medicine.time)}. Keep some water nearby so you are ready on time.`;
    }
    if (allDone) {
      return "Everything planned for today has been completed. You can relax and use Personal AI any time you need a reminder.";
    }
    return "No medicines are scheduled right now. It is a good time to rest, hydrate, and keep your routine gentle.";
  };

  const wellbeingTips = [
    {
      icon: FaTint,
      title: "Hydration",
      text: due.length > 0
        ? "Keep a glass of water nearby before your next medicine."
        : "Sip water through the day to stay refreshed and comfortable.",
    },
    {
      icon: FaUtensils,
      title: "Meals",
      text: nextMed
        ? "If needed, check meal timing on the medicines page before taking the next dose."
        : "Regular meal times can make your daily routine easier to follow.",
    },
    {
      icon: FaWalking,
      title: "Movement",
      text: "A short walk or a few light stretches can add comfort and energy to the day.",
    },
  ];

  return (
    <Layout>
      <div className="dash-main">
        <div className={`dash-layout ${isElderly ? "dash-layout--elderly" : ""}`}>
          <div className="dash-primary">
            <div className="dash-greeting">
              <h2>{firstName ? `${greeting()}, ${firstName}` : greeting()}</h2>
              <p className="dash-date">
                {now.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {loading ? (
              <div className="dash-loading">
                <div className="dash-spinner" />
                Loading your daily overview...
              </div>
            ) : (
              <>
                <div className="dash-stats-row">
                  <div className="stat-card stat-card--due">
                    <div className="stat-icon"><FaExclamationCircle /></div>
                    <div>
                      <p className="stat-num">{due.length}</p>
                      <p className="stat-label">Due</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card--upcoming">
                    <div className="stat-icon"><FaClock /></div>
                    <div>
                      <p className="stat-num">{upcoming.length}</p>
                      <p className="stat-label">Upcoming</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card--done">
                    <div className="stat-icon"><FaCheck /></div>
                    <div>
                      <p className="stat-num">{taken}</p>
                      <p className="stat-label">Taken</p>
                    </div>
                  </div>
                  <div className="stat-card stat-card--total">
                    <div className="stat-icon"><FaPills /></div>
                    <div>
                      <p className="stat-num">{total}</p>
                      <p className="stat-label">Total today</p>
                    </div>
                  </div>
                </div>

                <div className="dash-main-row">
                  <div className="dash-card">
                    <p className="dash-card-title">Today's Progress</p>
                    <div className="dash-card-body dash-card-body--center">
                      <ProgressRing taken={taken} total={total} />
                      {allDone && <p className="dash-all-done">All done for today!</p>}
                      {total === 0 && <p className="dash-no-med">No medicines today</p>}
                      {!allDone && total > 0 && (
                        <p className="dash-progress-msg">
                          {taken === 0 ? "Start taking your medicines" : `${total - taken} left to take`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="dash-card">
                    <p className="dash-card-title">Next Medicine</p>
                    <div className="dash-card-body">
                      {nextMed ? (
                        <div className="next-med-wrap">
                          <div className="next-med-icon"><FaPills /></div>
                          <div className="next-med-info">
                            <p className="next-med-name">{nextMed.medicine?.name}</p>
                            <p className="next-med-dosage">{nextMed.medicine?.dosage}</p>
                            <div className="next-med-time-row">
                              <FaClock size={12} />
                              <span>{formatAmPm(nextMed.medicine?.time)}</span>
                            </div>
                          </div>
                          {getTimeUntil(nextMed.medicine?.time) && (
                            <span className="next-med-badge">
                              {getTimeUntil(nextMed.medicine?.time)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="next-med-empty">
                          <FaCheck size={28} color="#38a169" />
                          <p>{allDone ? "All medicines taken" : "No upcoming medicines"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {due.length > 0 && (
                  <div className="dash-due-banner">
                    <div className="due-banner-left">
                      <FaExclamationCircle />
                      <div>
                        <p className="due-banner-title">
                          You have {due.length} medicine{due.length > 1 ? "s" : ""} due
                        </p>
                        <p className="due-banner-sub">
                          {due.map((l) => l.medicine?.name).join(", ")}
                        </p>
                      </div>
                    </div>
                    <button className="due-banner-btn" onClick={() => navigate("/medicines")}>
                      View <FaArrowRight />
                    </button>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div className="dash-upcoming-section">
                    <div className="section-header">
                      <p className="section-header-title">Upcoming Today</p>
                      <button className="section-header-link" onClick={() => navigate("/medicines")}>
                        View all <FaArrowRight size={11} />
                      </button>
                    </div>
                    <div className="upcoming-list">
                      {upcoming.slice(0, 3).map((log) => (
                        <div className="upcoming-item" key={log.id}>
                          <div className="upcoming-dot" />
                          <div className="upcoming-info">
                            <p className="upcoming-name">{log.medicine?.name}</p>
                            <p className="upcoming-dosage">{log.medicine?.dosage}</p>
                          </div>
                          <span className="upcoming-time">{formatAmPm(log.medicine?.time)}</span>
                          {getTimeUntil(log.medicine?.time) && (
                            <span className="upcoming-eta">{getTimeUntil(log.medicine?.time)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button className="dash-manage-btn" onClick={() => navigate("/medicines")}>
                  <FaPills /> {isElderly ? "Open medicines" : "Manage all medicines"} <FaArrowRight />
                </button>
              </>
            )}
          </div>

          {isElderly && !loading && (
            <aside className="dash-side">
              <div className="dash-side-hero">
                <p className="dash-side-kicker">Companion Note</p>
                <h3>{companionTitle()}</h3>
                <p>{companionNote()}</p>
                <button className="dash-side-btn" onClick={() => navigate("/assistant")}>
                  <FaRobot /> Ask Personal AI
                </button>
              </div>

              <div className="dash-side-card">
                <div className="section-header">
                  <p className="section-header-title">Today's Checklist</p>
                  <button className="section-header-link" onClick={() => navigate("/medicines")}>
                    Open <FaArrowRight size={11} />
                  </button>
                </div>
                {checklistItems.length > 0 ? (
                  <div className="dash-checklist">
                    {checklistItems.map((item) => (
                      <div className="dash-check-item" key={item.id}>
                        <div className="dash-check-icon">
                          <FaPills />
                        </div>
                        <div className="dash-check-copy">
                          <p>{item.medicine?.name}</p>
                          <span>{formatAmPm(item.medicine?.time)} • {item.medicine?.dosage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dash-side-empty">No pending medicines right now.</p>
                )}
              </div>

              <div className="dash-side-card">
                <p className="dash-card-title">Wellbeing Reminders</p>
                <div className="dash-tip-list">
                  {wellbeingTips.map((tip) => {
                    const Icon = tip.icon;
                    return (
                      <div className="dash-tip-item" key={tip.title}>
                        <div className="dash-tip-icon"><Icon /></div>
                        <div>
                          <p className="dash-tip-title">{tip.title}</p>
                          <p className="dash-tip-text">{tip.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}
