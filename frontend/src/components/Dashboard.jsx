import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import { FaPills, FaCheck, FaExclamationCircle, FaClock, FaArrowRight } from "react-icons/fa";
import { useRef } from "react";
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
      </div>
    </div>
  );
}

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
      </div>
    </Layout>
  );
}