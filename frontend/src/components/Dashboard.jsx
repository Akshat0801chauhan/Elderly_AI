import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import {
  FaPills, FaCheck, FaExclamationCircle, FaClock, FaArrowRight,
  FaTint, FaWalking, FaRobot, FaUtensils, FaCamera, FaUserCheck, FaSearch, FaShieldAlt,
  FaEdit, FaTrash
} from "react-icons/fa";
import {
  buildCaregiverEndpoint,
  clearSelectedElderlyUser,
  getSelectedElderlyUser,
  setSelectedElderlyUser,
} from "../utils/caregiverContext";

const API_BASE_URL = "http://localhost:8080";

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
  const [faceFile, setFaceFile] = useState(null);
  const [facePreviewUrl, setFacePreviewUrl] = useState("");
  const [faceServiceStatus, setFaceServiceStatus] = useState("checking");
  const [knownFaces, setKnownFaces] = useState([]);
  const [faceAction, setFaceAction] = useState("");
  const [faceError, setFaceError] = useState("");
  const [faceResult, setFaceResult] = useState(null);
  const [selectedSavedFace, setSelectedSavedFace] = useState(null);
  const [recognitionPopup, setRecognitionPopup] = useState(null);
  const [enrollmentPopup, setEnrollmentPopup] = useState(null);
  const [editingFace, setEditingFace] = useState(null);
  const [deletingFace, setDeletingFace] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRelation, setEditRelation] = useState("");
  const [faceName, setFaceName] = useState("");
  const [faceRelation, setFaceRelation] = useState("");
  const [savedFaceImages, setSavedFaceImages] = useState({});
  const [linkedElderlyUsers, setLinkedElderlyUsers] = useState([]);
  const [selectedElderlyId, setSelectedElderlyId] = useState(getSelectedElderlyUser()?.id || "");
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const savedFaceImagesRef = useRef({});

  useEffect(() => {
    return () => {
      if (facePreviewUrl) {
        URL.revokeObjectURL(facePreviewUrl);
      }
    };
  }, [facePreviewUrl]);

  useEffect(() => {
    return () => {
      Object.values(savedFaceImagesRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const loadFaceData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [healthRes, facesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ai/face/health`, { headers }),
        fetch(`${API_BASE_URL}/api/ai/face/faces`, { headers }),
      ]);

      setFaceServiceStatus(healthRes.ok ? "online" : "offline");

      if (facesRes.ok) {
        const facesData = await facesRes.json();
        const faces = Array.isArray(facesData?.faces) ? facesData.faces : [];
        setKnownFaces(faces);
        await preloadFaceImages(token, faces);
      } else {
        setKnownFaces([]);
        setSavedFaceImages({});
      }
    } catch (err) {
      console.error(err);
      setFaceServiceStatus("offline");
      setKnownFaces([]);
      setSavedFaceImages({});
    }
  };

  const preloadFaceImages = async (token, faces) => {
    const nextImages = {};
    for (const face of faces) {
      if (!face.imageUrl || !face.slug) continue;
      try {
        const res = await fetch(`${API_BASE_URL}${face.imageUrl}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) continue;
        const blob = await res.blob();
        nextImages[face.slug] = URL.createObjectURL(blob);
      } catch (err) {
        console.error(err);
      }
    }

    setSavedFaceImages((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      savedFaceImagesRef.current = nextImages;
      return nextImages;
    });

    return nextImages;
  };

  const fetchSelectedElderlyMedicines = async (token, elderlyUser) => {
    if (!elderlyUser?.id) {
      setLogs([]);
      clearSelectedElderlyUser();
      setSelectedElderlyId("");
      return;
    }

    setSelectedElderlyId(elderlyUser.id);
    setSelectedElderlyUser(elderlyUser);

    const response = await fetch(buildCaregiverEndpoint(elderlyUser.id, "/medicines/today"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      clearSelectedElderlyUser();
      navigate("/");
      return;
    }

    if (!response.ok) {
      setLogs([]);
      return;
    }

    const text = await response.text();
    setLogs(text ? JSON.parse(text) : []);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const profileRes = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.status === 401 || profileRes.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      const profileData = profileRes.ok ? await profileRes.json() : null;
      const nextRole = profileData?.role || "";
      setRole(nextRole);
      setProfileName(profileData?.name || "");
      setFaceName("");
      setFaceRelation("");

      if (nextRole === "CAREGIVER") {
        const linkedRes = await fetch(`${API_BASE_URL}/api/caregiver/elderly-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (linkedRes.status === 401 || linkedRes.status === 403) {
          localStorage.removeItem("token");
          navigate("/");
          return;
        }

        const linkedUsers = linkedRes.ok ? await linkedRes.json() : [];
        setLinkedElderlyUsers(linkedUsers);
        setFaceServiceStatus("offline");
        setKnownFaces([]);
        setSavedFaceImages({});

        if (!linkedUsers.length) {
          setLogs([]);
          clearSelectedElderlyUser();
          setSelectedElderlyId("");
          return;
        }

        const storedSelection = getSelectedElderlyUser();
        const matchingSelection = linkedUsers.find((user) => user.id === storedSelection?.id);
        if (matchingSelection) {
          await fetchSelectedElderlyMedicines(token, matchingSelection);
        } else {
          setLogs([]);
          clearSelectedElderlyUser();
          setSelectedElderlyId("");
        }
        return;
      }

      setLinkedElderlyUsers([]);
      clearSelectedElderlyUser();

      const medRes = await fetch(`${API_BASE_URL}/api/medicine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (medRes.status === 401 || medRes.status === 403) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!medRes.ok) {
        console.error("Fetch failed:", medRes.status);
        return;
      }

      const medText = await medRes.text();
      setLogs(medText ? JSON.parse(medText) : []);
      await loadFaceData(token);
    } catch (err) {
      console.error(err);
      setLogs([]);
      setRole("");
      setProfileName("");
      setFaceServiceStatus("offline");
      setKnownFaces([]);
      setLinkedElderlyUsers([]);
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
  const selectedElderly = linkedElderlyUsers.find((user) => user.id === selectedElderlyId) || getSelectedElderlyUser();
  const hasActiveElderlySelection = isElderly || Boolean(selectedElderlyId);
  const faceStatusLabel = faceServiceStatus === "online"
    ? "Ready"
    : faceServiceStatus === "checking"
      ? "Checking"
      : "Not available";
  const faceStatusTone = faceServiceStatus === "online" ? "ok" : faceServiceStatus === "checking" ? "checking" : "offline";

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

  const selectedSavedFaceImage = selectedSavedFace
    ? savedFaceImages[selectedSavedFace.slug] || ""
    : "";

  // FIX: Use imageUrl stored directly on recognitionPopup first,
  // then fall back to savedFaceImages cache
  const recognitionFaceImage = recognitionPopup
    ? savedFaceImages[recognitionPopup.slug] || recognitionPopup.imageUrl || ""
    : "";

  const fetchFaceImage = async (token, slug) => {
    if (!slug) return null;

    // Return cached version if already loaded
    if (savedFaceImages[slug]) return savedFaceImages[slug];

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/face/faces/${slug}/image`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setSavedFaceImages((prev) => {
        const next = {
          ...prev,
          [slug]: objectUrl,
        };
        savedFaceImagesRef.current = next;
        return next;
      });
      return objectUrl;
    } catch (err) {
      console.error(err);
      return null;
    }
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

  const handleElderlySelection = async (elderlyUser) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      await fetchSelectedElderlyMedicines(token, elderlyUser);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceFileChange = (event) => {
    const file = event.target.files?.[0];
    setFaceError("");
    setFaceResult(null);

    if (!file) {
      setFaceFile(null);
      if (facePreviewUrl) {
        URL.revokeObjectURL(facePreviewUrl);
      }
      setFacePreviewUrl("");
      return;
    }

    if (facePreviewUrl) {
      URL.revokeObjectURL(facePreviewUrl);
    }

    setFaceFile(file);
    setFacePreviewUrl(URL.createObjectURL(file));
  };

  const handleFaceAction = async (action) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    if (!faceFile) {
      setFaceError("Please choose an image first.");
      return;
    }

    if (action === "enroll" && !faceName.trim()) {
      setFaceError("Please enter the person's name before saving the photo.");
      return;
    }

    // Check for duplicate name before enrolling
    if (action === "enroll") {
      const existingFace = knownFaces.find(
        (face) => (face.name || "").toLowerCase() === faceName.trim().toLowerCase()
      );
      if (existingFace) {
        setEnrollmentPopup({
          name: existingFace.name,
          relation: existingFace.relation || "",
          slug: existingFace.slug || "",
          imageUrl: savedFaceImages[existingFace.slug] || "",
        });
        return;
      }
    }

    setFaceAction(action);
    setFaceError("");
    setFaceResult(null);

    try {
      const formData = new FormData();
      formData.append("image", faceFile);

      if (action === "enroll" && faceName.trim()) {
        formData.append("name", faceName.trim());
      }

      if (action === "enroll" && faceRelation.trim()) {
        formData.append("relation", faceRelation.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/face/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const rawText = await response.text();
      const data = rawText ? JSON.parse(rawText) : {};

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || data?.message || "Unable to complete the AI request.");
      }

      setFaceResult({
        mode: action,
        ...data,
      });

      if (action === "enroll") {
        await loadFaceData(token);
        setFaceName("");
        setFaceRelation("");
        setFaceFile(null);
        if (facePreviewUrl) {
          URL.revokeObjectURL(facePreviewUrl);
        }
        setFacePreviewUrl("");
      } else if (action === "recognize" && data?.recognized && data?.name) {
        // FIX: Backend now returns slug, relation and imageUrl directly in the recognize response.
        // Use them first. Fall back to searching knownFaces locally if backend didn't return them.
        const slug = data.slug || null;
        const relation = data.relation || "";

        // Step 1: Check if image is already cached in savedFaceImages
        let imageUrl = slug ? savedFaceImages[slug] || null : null;

        // Step 2: If not cached, fetch fresh from the server using slug from backend response
        if (!imageUrl && slug) {
          imageUrl = await fetchFaceImage(token, slug);
        }

        // Step 3: If no slug was returned, fall back to matching locally by name
        if (!imageUrl) {
          const matchedFace = knownFaces.find(
            (face) => (face.name || "").toLowerCase() === data.name.toLowerCase()
          );
          if (matchedFace?.slug) {
            imageUrl = savedFaceImages[matchedFace.slug] || await fetchFaceImage(token, matchedFace.slug);
          }
        }

        setRecognitionPopup({
          name: data.name,
          relation: relation,
          slug: slug || "",
          imageUrl: imageUrl || "",
        });
      }
    } catch (err) {
      console.error(err);
      setFaceError(err.message || "Unable to complete the AI request.");
    } finally {
      setFaceAction("");
    }
  };

  const handleEditFace = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    if (!editName.trim()) {
      setFaceError("Name cannot be empty.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      if (editRelation.trim()) {
        formData.append("relation", editRelation.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/face/faces/${editingFace.slug}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || errorData?.error || errorData?.message || "Failed to update face.");
      }

      await loadFaceData(token);
      setEditingFace(null);
      setEditName("");
      setEditRelation("");
    } catch (err) {
      console.error(err);
      setFaceError(err.message || "Failed to update face.");
    }
  };

  const handleDeleteFace = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/face/faces/${deletingFace.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || errorData?.error || errorData?.message || "Failed to delete face.");
      }

      await loadFaceData(token);
      setDeletingFace(null);
    } catch (err) {
      console.error(err);
      setFaceError(err.message || "Failed to delete face.");
    }
  };

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
                  {!isElderly && (
                    <div className="dash-caregiver-picker">
                      <div className="dash-caregiver-copy">
                        <p className="dash-card-title">Choose an elder to manage</p>
                        <h3 className="dash-face-heading">
                          {selectedElderly?.name ? `Currently managing ${selectedElderly.name}` : "No elder selected yet"}
                        </h3>
                        <p className="dash-face-subtext">
                          Choose one assigned elder to open their dashboard, medicines, and caretaker tools.
                        </p>
                      </div>
                      <div className="dash-caregiver-list">
                        {linkedElderlyUsers.map((elderlyUser) => (
                          <button
                            key={elderlyUser.id}
                            type="button"
                            className={`dash-caregiver-card ${selectedElderlyId === elderlyUser.id ? "dash-caregiver-card--active" : ""}`}
                            onClick={() => handleElderlySelection(elderlyUser)}
                          >
                            <strong>{elderlyUser.name}</strong>
                            <span>{elderlyUser.email}</span>
                            <small>{elderlyUser.phone || "No phone added"}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasActiveElderlySelection && (
                    <>
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
                    </>
                  )}
                </div>

                {!hasActiveElderlySelection && !isElderly ? (
                  <div className="dash-card dash-card--empty">
                    <p className="dash-card-title">Caretaker Dashboard</p>
                    <div className="dash-card-body">
                      <p className="dash-face-subtext">
                        Select an elder above to load their dashboard. Until then, no elderly dashboard is shown.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
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

                    <button
                      className="dash-manage-btn"
                      onClick={() => navigate("/medicines")}
                      disabled={!isElderly && !selectedElderlyId}
                    >
                      <FaPills /> {isElderly ? "Open medicines" : "Manage all medicines"} <FaArrowRight />
                    </button>
                  </>
                )}

                {isElderly && (
                <div className="dash-face-card">
                  <div className="dash-face-header">
                    <div>
                      <p className="dash-card-title">Photo Helper</p>
                      <h3 className="dash-face-heading">Save a face photo and identify people later</h3>
                      <p className="dash-face-subtext">
                        Choose a clear face photo. You can save someone once, then use another photo to check who it is.
                      </p>
                    </div>
                    <span className={`dash-face-status dash-face-status--${faceStatusTone}`}>
                      <FaShieldAlt /> {faceStatusLabel}
                    </span>
                  </div>

                  <div className="dash-face-grid">
                    <div className="dash-face-upload">
                      <div className="dash-face-field">
                        <label htmlFor="faceName" className="dash-face-field-label">Name</label>
                        <input
                          id="faceName"
                          className="dash-face-input"
                          type="text"
                          placeholder="Enter person's name"
                          value={faceName}
                          onChange={(event) => setFaceName(event.target.value)}
                        />
                      </div>

                      <div className="dash-face-field">
                        <label htmlFor="faceRelation" className="dash-face-field-label">Relation (optional)</label>
                        <input
                          id="faceRelation"
                          className="dash-face-input"
                          type="text"
                          placeholder="Son, daughter, grandson..."
                          value={faceRelation}
                          onChange={(event) => setFaceRelation(event.target.value)}
                        />
                      </div>

                      <label className="dash-face-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFaceFileChange}
                        />
                        {facePreviewUrl ? (
                          <img src={facePreviewUrl} alt="Selected face preview" className="dash-face-preview" />
                        ) : (
                          <div className="dash-face-placeholder">
                            <FaCamera />
                            <p>Choose a photo</p>
                            <span>Use a clear photo where the face is easy to see</span>
                          </div>
                        )}
                      </label>

                      <div className="dash-face-actions">
                        <button
                          className="dash-face-btn dash-face-btn--primary"
                          onClick={() => handleFaceAction("enroll")}
                          disabled={!faceFile || !faceName.trim() || !!faceAction || faceServiceStatus !== "online"}
                        >
                          <FaUserCheck />
                          {faceAction === "enroll" ? "Saving..." : "Save photo"}
                        </button>
                        <button
                          className="dash-face-btn dash-face-btn--secondary"
                          onClick={() => handleFaceAction("recognize")}
                          disabled={!faceFile || !!faceAction || faceServiceStatus !== "online"}
                        >
                          <FaSearch />
                          {faceAction === "recognize" ? "Checking..." : "Identify person"}
                        </button>
                      </div>

                      {faceError && <p className="dash-face-error">{faceError}</p>}
                    </div>

                    <div className="dash-face-info">
                      <div className="dash-face-panel">
                        <p className="dash-face-panel-title">Saved people</p>
                        {knownFaces.length > 0 ? (
                          <div className="dash-face-gallery">
                            {knownFaces.map((face) => (
                              <div
                                key={face.slug || face.name}
                                className="dash-face-saved-card-wrapper"
                              >
                                <button
                                  type="button"
                                  className="dash-face-saved-card"
                                  onClick={() => setSelectedSavedFace(face)}
                                >
                                  {savedFaceImages[face.slug] ? (
                                    <img
                                      src={savedFaceImages[face.slug]}
                                      alt={face.name}
                                      className="dash-face-saved-thumb"
                                    />
                                  ) : (
                                    <div className="dash-face-saved-fallback">
                                      <FaUserCheck />
                                      <span>No photo yet</span>
                                    </div>
                                  )}
                                  <span className="dash-face-tag">{face.name || "Unknown"}</span>
                                  {face.relation && (
                                    <span className="dash-face-relation">{face.relation}</span>
                                  )}
                                </button>
                                <div className="dash-face-card-actions">
                                  <button
                                    type="button"
                                    className="dash-face-action-btn dash-face-action-btn--edit"
                                    onClick={() => {
                                      setEditingFace(face);
                                      setEditName(face.name || "");
                                      setEditRelation(face.relation || "");
                                    }}
                                    title="Edit face"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    type="button"
                                    className="dash-face-action-btn dash-face-action-btn--delete"
                                    onClick={() => setDeletingFace(face)}
                                    title="Delete face"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="dash-face-muted">
                            {faceServiceStatus === "online"
                              ? "No saved people yet."
                              : "Start the face service to see saved people."}
                          </p>
                        )}
                      </div>

                      <div className="dash-face-panel">
                        <p className="dash-face-panel-title">Last result</p>
                        {faceResult ? (
                          <div className="dash-face-result">
                            <p className="dash-face-result-message">{faceResult.message}</p>
                            {faceResult.mode === "recognize" && (
                              <>
                                <div className="dash-face-result-row">
                                  <span>Status</span>
                                  <strong>{faceResult.recognized ? "Recognized" : "Not recognized"}</strong>
                                </div>
                                <div className="dash-face-result-row">
                                  <span>Name</span>
                                  <strong>{faceResult.name || "No match"}</strong>
                                </div>
                                <div className="dash-face-result-row">
                                  <span>Detected faces</span>
                                  <strong>{faceResult.detected_faces ?? 0}</strong>
                                </div>
                              </>
                            )}
                            {faceResult.mode === "enroll" && (
                              <div className="dash-face-result-row">
                                <span>Enrolled as</span>
                                <strong>{faceResult.name}</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="dash-face-muted">
                            Add a photo, then save it or check who is in the picture.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )}
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

      {selectedSavedFace && (
        <div className="dash-face-modal-backdrop" onClick={() => setSelectedSavedFace(null)}>
          <div className="dash-face-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dash-face-modal-header">
              <div>
                <p className="dash-card-title">Saved Face Preview</p>
                <h3 className="dash-face-modal-title">{selectedSavedFace.name}</h3>
              </div>
              <button
                type="button"
                className="dash-face-modal-close"
                onClick={() => setSelectedSavedFace(null)}
              >
                Close
              </button>
            </div>

            {selectedSavedFaceImage ? (
              <img
                src={selectedSavedFaceImage}
                alt={selectedSavedFace.name}
                className="dash-face-modal-image"
              />
            ) : (
              <p className="dash-face-muted">
                This person was saved without a photo preview. Save their photo again once to show the face here.
              </p>
            )}

            {selectedSavedFace.relation && (
              <p className="dash-face-modal-relation">
                Relation: <strong>{selectedSavedFace.relation}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {recognitionPopup && (
        <div className="dash-face-popup-backdrop" onClick={() => setRecognitionPopup(null)}>
          <div className="dash-face-popup" onClick={(event) => event.stopPropagation()}>
            <div className="dash-face-popup-header">
              <p className="dash-card-title">Person Matched</p>
              <button
                type="button"
                className="dash-face-modal-close"
                onClick={() => setRecognitionPopup(null)}
              >
                Close
              </button>
            </div>
            <div className="dash-face-popup-body">
              <div className="dash-face-popup-photo">
                {recognitionFaceImage ? (
                  <img
                    src={recognitionFaceImage}
                    alt={recognitionPopup.name}
                  />
                ) : (
                  <div className="dash-face-popup-fallback">
                    <FaUserCheck />
                  </div>
                )}
              </div>
              <div className="dash-face-popup-info">
                <h3>{recognitionPopup.name}</h3>
                {recognitionPopup.relation ? (
                  <p className="dash-face-popup-relation">
                    Relation: <strong>{recognitionPopup.relation}</strong>
                  </p>
                ) : (
                  <p className="dash-face-popup-relation">
                    Relation: <strong>Not provided</strong>
                  </p>
                )}
                <p className="dash-face-popup-note">
                  This person was matched with the photo you uploaded.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {enrollmentPopup && (
        <div className="dash-face-popup-backdrop" onClick={() => setEnrollmentPopup(null)}>
          <div className="dash-face-popup" onClick={(event) => event.stopPropagation()}>
            <div className="dash-face-popup-header">
              <p className="dash-card-title">Person Already Added</p>
              <button
                type="button"
                className="dash-face-modal-close"
                onClick={() => setEnrollmentPopup(null)}
              >
                Close
              </button>
            </div>
            <div className="dash-face-popup-body">
              <div className="dash-face-popup-photo">
                {enrollmentPopup.imageUrl ? (
                  <img
                    src={enrollmentPopup.imageUrl}
                    alt={enrollmentPopup.name}
                  />
                ) : (
                  <div className="dash-face-popup-fallback">
                    <FaUserCheck />
                  </div>
                )}
              </div>
              <div className="dash-face-popup-info">
                <h3>{enrollmentPopup.name}</h3>
                {enrollmentPopup.relation ? (
                  <p className="dash-face-popup-relation">
                    Relation: <strong>{enrollmentPopup.relation}</strong>
                  </p>
                ) : (
                  <p className="dash-face-popup-relation">
                    Relation: <strong>Not provided</strong>
                  </p>
                )}
                <p className="dash-face-popup-note">
                  This person is already saved in your faces. You can identify them using a new photo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingFace && (
        <div className="dash-face-modal-backdrop" onClick={() => setEditingFace(null)}>
          <div className="dash-face-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dash-face-modal-header">
              <div>
                <p className="dash-card-title">Edit Face</p>
                <h3 className="dash-face-modal-title">Update {editingFace.name}</h3>
              </div>
              <button
                type="button"
                className="dash-face-modal-close"
                onClick={() => setEditingFace(null)}
              >
                Close
              </button>
            </div>

            <div className="dash-face-edit-form">
              <div className="dash-face-field">
                <label htmlFor="editName" className="dash-face-field-label">Name</label>
                <input
                  id="editName"
                  className="dash-face-input"
                  type="text"
                  placeholder="Enter person's name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </div>

              <div className="dash-face-field">
                <label htmlFor="editRelation" className="dash-face-field-label">Relation (optional)</label>
                <input
                  id="editRelation"
                  className="dash-face-input"
                  type="text"
                  placeholder="Son, daughter, grandson..."
                  value={editRelation}
                  onChange={(event) => setEditRelation(event.target.value)}
                />
              </div>

              <div className="dash-face-edit-actions">
                <button
                  className="dash-face-btn dash-face-btn--secondary"
                  onClick={() => setEditingFace(null)}
                >
                  Cancel
                </button>
                <button
                  className="dash-face-btn dash-face-btn--primary"
                  onClick={handleEditFace}
                  disabled={!editName.trim()}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingFace && (
        <div className="dash-face-modal-backdrop" onClick={() => setDeletingFace(null)}>
          <div className="dash-face-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dash-face-modal-header">
              <div>
                <p className="dash-card-title">Delete Face</p>
                <h3 className="dash-face-modal-title">Remove {deletingFace.name}</h3>
              </div>
              <button
                type="button"
                className="dash-face-modal-close"
                onClick={() => setDeletingFace(null)}
              >
                Close
              </button>
            </div>

            <div className="dash-face-delete-confirm">
              <p>Are you sure you want to delete this face? This action cannot be undone.</p>
              <div className="dash-face-delete-actions">
                <button
                  className="dash-face-btn dash-face-btn--secondary"
                  onClick={() => setDeletingFace(null)}
                >
                  Cancel
                </button>
                <button
                  className="dash-face-btn dash-face-btn--danger"
                  onClick={handleDeleteFace}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}