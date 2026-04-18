import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./Activity.css";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaPencilAlt,
  FaPlus,
  FaTrash,
  FaTasks,
  FaUserFriends,
} from "react-icons/fa";
import { getSelectedElderlyUser } from "../utils/caregiverContext";

const API_BASE_URL = "http://localhost:8080";

function parseTimeToday(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatAmPm(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sortActivities(list) {
  return [...list].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}

function normalizeActivity(item) {
  return {
    ...item,
    isMandatory: Boolean(item?.isMandatory ?? item?.mandatory),
    completed: Boolean(item?.completed),
    missed: Boolean(item?.missed),
  };
}

function ActivityFormModal({ onClose, onSubmit, saving, initialData, elderId }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    time: initialData?.time || "09:00",
    isMandatory: true,
  });
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      setError("Please enter an activity title.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        elderId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        time: formData.time,
        isMandatory: formData.isMandatory,
      });
    } catch (submissionError) {
      setError(submissionError.message || "Unable to save activity.");
    }
  };

  return (
    <div className="activity-modal-backdrop" onClick={onClose}>
      <div className="activity-modal" onClick={(event) => event.stopPropagation()}>
        <div className="activity-modal-header">
          <div>
            <p className="activity-section-kicker">Activity Plan</p>
            <h3>{initialData ? "Update activity" : "Add a new activity"}</h3>
          </div>
          <button type="button" className="activity-modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="activity-form" onSubmit={handleSubmit}>
          <div className="activity-form-note">
            <FaExclamationCircle />
            <div>
              <strong>Caregiver activities are compulsory by default.</strong>
              <p>Every task added here is saved as mandatory for the elder's routine.</p>
            </div>
          </div>

          <label className="activity-field">
            <span>Title</span>
            <input
              type="text"
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Morning walk"
            />
          </label>

          <label className="activity-field">
            <span>Description</span>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Short note for the elder or caregiver"
            />
          </label>

          <div className="activity-form-row">
            <label className="activity-field">
              <span>Time</span>
              <input
                type="time"
                value={formData.time}
                onChange={(event) => updateField("time", event.target.value)}
              />
            </label>

            <div className="activity-lock-card">
              <span className="activity-lock-label">Priority</span>
              <strong>Mandatory</strong>
              <p>Saved automatically as compulsory.</p>
            </div>
          </div>

          {error && <p className="activity-form-error">{error}</p>}

          <button type="submit" className="activity-primary-btn" disabled={saving}>
            <FaCheck />
            {saving ? "Saving..." : initialData ? "Save changes" : "Create activity"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ActivityTile({ item, tone, isElderly, onComplete, onEdit, onDelete, savingId }) {
  const isSaving = savingId === item.id;
  const statusLabel = item.completed
    ? "Completed and recorded"
    : item.missed
      ? "Compulsory task missed"
      : item.isMandatory
        ? "Compulsory for today"
        : "Scheduled for today";

  return (
    <div className={`activity-tile activity-tile--${tone} ${item.isMandatory ? "activity-tile--mandatory" : "activity-tile--optional"}`}>
      <div className="activity-tile-top">
        <div>
          <p className="activity-tile-time">{formatAmPm(item.time)}</p>
          <h4>{item.title}</h4>
        </div>
        {item.isMandatory ? (
          <span className="activity-tag activity-tag--mandatory">Caregiver Mandatory</span>
        ) : (
          <span className="activity-tag activity-tag--optional">Optional</span>
        )}
      </div>

      <p className="activity-tile-desc">
        {item.description || "A simple routine item to support daily consistency and comfort."}
      </p>

      <div className="activity-tile-footer">
        <div className="activity-status-line">
          {item.completed ? (
            <span className="activity-status activity-status--done"><FaCheckCircle /> Completed</span>
          ) : item.missed ? (
            <span className="activity-status activity-status--missed"><FaExclamationCircle /> Missed</span>
          ) : (
            <span className="activity-status activity-status--pending"><FaClock /> Planned</span>
          )}
        </div>

        <div className="activity-tile-actions">
          {isElderly && !item.completed && (
            <button
              type="button"
              className="activity-icon-btn activity-icon-btn--confirm"
              onClick={() => onComplete(item.id)}
              disabled={isSaving}
              title="Mark complete"
            >
              <FaCheck />
            </button>
          )}

          {!isElderly && (
            <>
              <button
                type="button"
                className="activity-icon-btn"
                onClick={() => onEdit(item)}
                title="Edit activity"
              >
                <FaPencilAlt />
              </button>
              <button
                type="button"
                className="activity-icon-btn activity-icon-btn--danger"
                onClick={() => onDelete(item.id)}
                title="Delete activity"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`activity-tile-alert activity-tile-alert--${item.isMandatory ? "mandatory" : tone}`}>
        <FaExclamationCircle />
        <span>{statusLabel}</span>
      </div>
    </div>
  );
}

export default function Activity() {
  const [role, setRole] = useState("");
  const [profileName, setProfileName] = useState("");
  const [selectedElderly, setSelectedElderly] = useState(getSelectedElderlyUser());
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [consistency, setConsistency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const now = new Date();
  const isElderly = role === "ELDERLY";
  const isCaregiver = role === "CAREGIVER";

  const normalizedActivities = useMemo(
    () => activities.map((item) => normalizeActivity(item)),
    [activities]
  );

  const sortedActivities = useMemo(
    () => sortActivities(normalizedActivities),
    [normalizedActivities]
  );

  const filteredActivities = sortedActivities;

  const pendingItems = filteredActivities.filter((item) => !item.completed && !item.missed);
  const missedItems = filteredActivities.filter((item) => item.missed);
  const mandatoryItems = normalizedActivities.filter((item) => item.isMandatory);
  const pendingMandatoryItems = filteredActivities.filter((item) => item.isMandatory && !item.completed && !item.missed);
  const nextPlanned = pendingItems.find((item) => parseTimeToday(item.time) >= now) || pendingItems[0] || null;

  const summaryCards = [
    {
      tone: "green",
      title: "Completed",
      count: progress.completed,
      caption: "finished today",
    },
    {
      tone: "orange",
      title: "Pending",
      count: Math.max(progress.total - progress.completed, 0),
      caption: "still planned",
    },
    {
      tone: "purple",
      title: "Mandatory",
      count: mandatoryItems.length,
      caption: "important routines",
    },
  ];

  const fetchActivityData = useCallback(async (currentRole) => {
    if (currentRole === "CAREGIVER") {
      const targetUser = getSelectedElderlyUser();
      setSelectedElderly(targetUser);

      if (!targetUser?.id) {
        setActivities([]);
        setProgress({ completed: 0, total: 0 });
        setConsistency(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/activity/elder/${targetUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!response.ok) {
        setActivities([]);
        setProgress({ completed: 0, total: 0 });
        setConsistency(0);
        return;
      }

      const data = await response.json();
      const nextActivities = Array.isArray(data.activities) ? data.activities.map((item) => normalizeActivity(item)) : [];
      setActivities(nextActivities);
      setProgress(data.progress || { completed: 0, total: 0 });
      const nextMandatoryCount = nextActivities.filter((item) => item.isMandatory).length;
      const nextMandatoryDone = nextActivities.filter((item) => item.isMandatory && item.completed).length;
      setConsistency(nextMandatoryCount === 0 ? 100 : Math.round((nextMandatoryDone / nextMandatoryCount) * 100));
      return;
    }

    const [activityResponse, progressResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/activity/today`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/api/activity/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (
      activityResponse.status === 401 || activityResponse.status === 403
      || progressResponse.status === 401 || progressResponse.status === 403
    ) {
      localStorage.removeItem("token");
      navigate("/");
      return;
    }

    const activityText = await activityResponse.text();
    const progressText = await progressResponse.text();
    const activityData = activityText ? JSON.parse(activityText) : [];
    const progressData = progressText ? JSON.parse(progressText) : { completed: 0, total: 0 };

    const nextActivities = Array.isArray(activityData) ? activityData.map((item) => normalizeActivity(item)) : [];
    setActivities(nextActivities);
    setProgress(progressData);
    const mandatoryCount = nextActivities.filter((item) => item.isMandatory).length;
    const mandatoryDone = nextActivities.filter((item) => item.isMandatory && item.completed).length;
    setConsistency(mandatoryCount === 0 ? 100 : Math.round((mandatoryDone / mandatoryCount) * 100));
  }, [navigate, token]);

  const fetchProfileAndData = useCallback(async () => {
    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setRole(data.role || "");
      setProfileName(data.name || "");
      await fetchActivityData(data.role || "");
    } finally {
      setLoading(false);
    }
  }, [fetchActivityData, navigate, token]);

  useEffect(() => {
    fetchProfileAndData();
  }, [fetchProfileAndData]);

  const handleComplete = async (activityId) => {
    try {
      setSavingId(activityId);
      const response = await fetch(`${API_BASE_URL}/api/activity/complete/${activityId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!response.ok) {
        return;
      }

      await fetchActivityData("ELDERLY");
    } finally {
      setSavingId("");
    }
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm("Delete this activity?")) return;

    const response = await fetch(`${API_BASE_URL}/api/activity/${activityId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      navigate("/");
      return;
    }

    await fetchActivityData("CAREGIVER");
  };

  const handleSaveActivity = async (payload) => {
    setSavingForm(true);
    try {
      const endpoint = editingActivity
        ? `${API_BASE_URL}/api/activity/${editingActivity.id}`
        : `${API_BASE_URL}/api/activity`;

      const response = await fetch(endpoint, {
        method: editingActivity ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      const rawText = await response.text();
      const data = rawText ? JSON.parse(rawText) : {};
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to save activity.");
      }

      setShowForm(false);
      setEditingActivity(null);
      await fetchActivityData("CAREGIVER");
    } finally {
      setSavingForm(false);
    }
  };

  const firstName = profileName.trim().split(" ").filter(Boolean)[0];

  if (loading) {
    return (
      <Layout>
        <div className="activity-page">
          <div className="activity-loading">
            <div className="activity-spinner" />
            Loading today&apos;s activity plan...
          </div>
        </div>
      </Layout>
    );
  }

  if (isCaregiver && !selectedElderly?.id) {
    return (
      <Layout>
        <div className="activity-page">
          <div className="activity-empty">
            <FaUserFriends />
            <h3>Select an elder first</h3>
            <p>Choose an elder from the dashboard before managing activity schedules.</p>
            <button className="activity-primary-btn" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="activity-page">
        <div className="activity-layout">
          <div className="activity-main">
            <div className="activity-header">
              <div>
                <h2>
                  {firstName ? `Hello, ${firstName}` : "Activity Planner"}
                </h2>
                <p>
                  {formatShortDate(now)}
                  {isCaregiver && selectedElderly?.name ? ` | Managing ${selectedElderly.name}` : ""}
                </p>
              </div>

              <div className="activity-header-actions">
                {isCaregiver && (
                  <button
                    type="button"
                    className="activity-primary-btn"
                    onClick={() => {
                      setEditingActivity(null);
                      setShowForm(true);
                    }}
                  >
                    <FaPlus />
                    Add New Task
                  </button>
                )}
              </div>
            </div>

            <div className="activity-highlight-grid">
              {summaryCards.map((card) => (
                <div key={card.title} className={`activity-highlight activity-highlight--${card.tone}`}>
                  <div className="activity-highlight-head">
                    <div className="activity-highlight-icon">
                      <FaTasks />
                    </div>
                    <span>{card.title}</span>
                  </div>
                  <strong>{card.count}</strong>
                  <p>{card.caption}</p>
                  <div className="activity-highlight-bar">
                    <span style={{ width: `${progress.total ? Math.max((card.count / progress.total) * 100, 12) : 12}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {(missedItems.length > 0 || pendingMandatoryItems.length > 0) && (
              <div className={`activity-alert-banner ${missedItems.length > 0 ? "activity-alert-banner--danger" : "activity-alert-banner--warning"}`}>
                <div className="activity-alert-icon">
                  <FaExclamationCircle />
                </div>
                <div className="activity-alert-copy">
                  <strong>
                    {missedItems.length > 0
                      ? `${missedItems.length} compulsory activit${missedItems.length > 1 ? "ies have" : "y has"} been missed today`
                      : `${pendingMandatoryItems.length} compulsory activit${pendingMandatoryItems.length > 1 ? "ies are" : "y is"} still pending`}
                  </strong>
                  <p>
                    {missedItems.length > 0
                      ? "These tasks have passed their scheduled time and should be reviewed urgently."
                      : "These caregiver-set tasks are expected today and stay highlighted until completed."}
                  </p>
                </div>
              </div>
            )}

            <div className="activity-content-grid">
              <section className="activity-panel">
                <div className="activity-panel-head">
                  <div>
                    <h3>Task Summary</h3>
                    <p>A quick view of today&apos;s routine health.</p>
                  </div>
                </div>

                <div className="activity-summary-grid">
                  <div className="activity-summary-card">
                    <strong>{progress.total}</strong>
                    <span>Total planned</span>
                  </div>
                  <div className="activity-summary-card">
                    <strong>{progress.completed}</strong>
                    <span>Completed</span>
                  </div>
                  <div className="activity-summary-card">
                    <strong>{missedItems.length}</strong>
                    <span>Missed so far</span>
                  </div>
                  <div className="activity-summary-card activity-summary-card--accent">
                    <strong>{consistency}%</strong>
                    <span>Consistency</span>
                  </div>
                </div>
              </section>

              <section className="activity-panel">
                <div className="activity-panel-head">
                  <div>
                    <h3>Upcoming Task</h3>
                    <p>Designed around the next step that matters most today.</p>
                  </div>
                </div>

                {nextPlanned ? (
                  <div className="activity-upcoming-stack">
                    <div className="activity-upcoming-card activity-upcoming-card--priority">
                      <div>
                        <h4>{nextPlanned.title}</h4>
                        <p>{nextPlanned.description || "Keep this task simple and easy to follow."}</p>
                      </div>
                      <div className="activity-upcoming-meta">
                        <span>{formatAmPm(nextPlanned.time)}</span>
                        {nextPlanned.isMandatory && <strong>Mandatory</strong>}
                      </div>
                    </div>

                    {pendingItems.slice(1, 3).map((item) => (
                      <div key={item.id} className={`activity-upcoming-card ${item.isMandatory ? "activity-upcoming-card--mandatory" : ""}`}>
                        <div>
                          <h4>{item.title}</h4>
                          <p>{item.description || "Planned activity for later today."}</p>
                        </div>
                        <div className="activity-upcoming-meta">
                          <span>{formatAmPm(item.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="activity-inline-empty">
                    <FaCheckCircle />
                    <p>No pending activities right now.</p>
                  </div>
                )}
              </section>
            </div>

            <section className="activity-panel activity-panel--full">
              <div className="activity-panel-head">
                <div>
                  <h3>Today&apos;s Activities</h3>
                  <p>Clear, large cards with quick actions for the current day.</p>
                </div>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="activity-inline-empty">
                  <FaCalendarAlt />
                  <p>No activities planned for today.</p>
                </div>
              ) : (
                <div className="activity-tile-grid">
                  {filteredActivities.map((item) => (
                    <ActivityTile
                      key={item.id}
                      item={item}
                      tone={item.completed ? "done" : item.missed ? "missed" : "pending"}
                      isElderly={isElderly}
                      onComplete={handleComplete}
                      onEdit={(selectedItem) => {
                        setEditingActivity(selectedItem);
                        setShowForm(true);
                      }}
                      onDelete={handleDelete}
                      savingId={savingId}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="activity-side">
            <div className="activity-side-hero">
              <div className="activity-side-month">
                <div className="activity-side-icon">
                  <FaCalendarAlt />
                </div>
                <h3>
                  {now.toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>

              <div className="activity-side-copy">
                <p>
                  {isElderly
                    ? "Your daily routine is laid out clearly so it is easy to follow one task at a time."
                    : "A caregiver-friendly schedule view to keep the elder's day balanced and visible."}
                </p>
              </div>
            </div>

            <div className="activity-timeline">
              {sortedActivities.length === 0 ? (
                <div className="activity-side-empty">
                  <p>No activities planned for today.</p>
                </div>
              ) : (
                filteredActivities.map((item) => (
                  <div key={item.id} className={`activity-timeline-item activity-timeline-item--${item.completed ? "done" : item.missed ? "missed" : "pending"}`}>
                    <div className="activity-timeline-marker" />
                    <div className="activity-timeline-copy">
                      <p className="activity-timeline-time">{formatAmPm(item.time)}</p>
                      <strong>{item.title}</strong>
                      <span>
                        {item.completed
                          ? "Completed"
                          : item.missed
                            ? "Missed compulsory"
                            : item.isMandatory
                              ? "Compulsory"
                              : "Scheduled"}
                      </span>
                      {item.isMandatory && <small className="activity-timeline-badge">Caregiver-set</small>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        {showForm && isCaregiver && selectedElderly?.id && (
          <ActivityFormModal
            onClose={() => {
              setShowForm(false);
              setEditingActivity(null);
            }}
            onSubmit={handleSaveActivity}
            saving={savingForm}
            initialData={editingActivity}
            elderId={selectedElderly.id}
          />
        )}
      </div>
    </Layout>
  );
}
