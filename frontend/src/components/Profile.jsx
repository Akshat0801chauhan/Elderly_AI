import { useEffect, useState } from "react";
import Layout from "./Layout";
import {
  FaUser, FaPhone, FaMapMarkerAlt, FaShieldAlt,
  FaEnvelope, FaSave, FaTimes, FaPen, FaCalendarAlt,
  FaVenusMars, FaTint, FaArrowRight
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { getSelectedElderlyUser, setSelectedElderlyUser } from "../utils/caregiverContext";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Field({
  label, icon: Icon, field, readOnly, editing, formData, profile, setFormData, type = "text", options = [], max,
}) {
  const currentValue = formData[field] || "";

  return (
    <div className="pf-field">
      <p className="pf-field-label"><Icon className="pf-field-icon" /> {label}</p>
      {editing && !readOnly ? (
        type === "select" ? (
          <select
            className="pf-field-input"
            value={currentValue}
            onChange={(event) => setFormData((prev) => ({ ...prev, [field]: event.target.value }))}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            className="pf-field-input"
            type={type}
            max={max}
            value={currentValue}
            onChange={(event) => setFormData((prev) => ({ ...prev, [field]: event.target.value }))}
          />
        )
      ) : (
        <p className="pf-field-value">{profile[field] || "-"}</p>
      )}
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [linkedElderlyUsers, setLinkedElderlyUsers] = useState([]);
  const [selectedElderlyId, setSelectedElderlyId] = useState(getSelectedElderlyUser()?.id || "");

  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await fetch("http://localhost:8080/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) {
          throw new Error("Failed to load profile");
        }

        const profileData = await profileRes.json();
        setProfile(profileData);
        setFormData(profileData);

        if (profileData.role === "CAREGIVER") {
          const linkedRes = await fetch("http://localhost:8080/api/caregiver/elderly-users", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!linkedRes.ok) {
            throw new Error("Failed to load assigned elderly users");
          }

          const linkedUsers = await linkedRes.json();
          setLinkedElderlyUsers(linkedUsers);

          const activeUser = linkedUsers.find((user) => user.id === getSelectedElderlyUser()?.id);
          setSelectedElderlyId(activeUser?.id || "");
        }
      } catch (err) {
        console.error(err);
        setError("Could not load profile");
      }
    };

    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    try {
      setError("");
      const isElderlyUser = profile.role === "ELDERLY";

      if (isElderlyUser) {
        if (!formData.dateOfBirth) {
          setError("Date of birth is required for elderly users");
          return;
        }
        if (formData.dateOfBirth > today) {
          setError("Date of birth cannot be in the future");
          return;
        }
        if (!formData.gender) {
          setError("Gender is required for elderly users");
          return;
        }
        if (!formData.bloodType) {
          setError("Blood group is required for elderly users");
          return;
        }
      }

      const payload = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        imageUrl: formData.imageUrl,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        chronicDiseases: formData.chronicDiseases,
        pastIllnesses: formData.pastIllnesses,
      };

      const res = await fetch("http://localhost:8080/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Profile update failed");
      }

      const updatedProfile = { ...profile, ...payload };
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Profile update failed");
    }
  };

  const handleSetActiveElderly = (elderlyUser) => {
    setSelectedElderlyId(elderlyUser.id);
    setSelectedElderlyUser(elderlyUser);
  };

  if (!profile && !error) {
    return (
      <Layout>
        <div className="pf-loading">
          <div className="pf-spinner" />
          Loading profile...
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="pf-loading">{error}</div>
      </Layout>
    );
  }

  const initials = profile.name
    ? profile.name.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const isElderly = profile.role === "ELDERLY";
  const isCaregiver = profile.role === "CAREGIVER";

  return (
    <Layout>
      <div className="pf-page">
        <div className="pf-sidebar-card">
          <div className="pf-avatar">{initials}</div>
          <p className="pf-name">{profile.name || "-"}</p>
          <p className="pf-email">{profile.email || "-"}</p>
          <span className="pf-role-badge">{profile.role || "User"}</span>

          <div className="pf-divider" />

          <div className="pf-quick-info">
            {profile.phone && (
              <div className="pf-quick-row">
                <FaPhone className="pf-quick-icon" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.address && (
              <div className="pf-quick-row">
                <FaMapMarkerAlt className="pf-quick-icon" />
                <span>{profile.address}</span>
              </div>
            )}
          </div>

          {!editing ? (
            <button className="pf-edit-btn" onClick={() => setEditing(true)}>
              <FaPen /> Edit Profile
            </button>
          ) : (
            <div className="pf-edit-actions">
              <button className="pf-save-btn" onClick={handleSave}>
                <FaSave /> Save
              </button>
              <button className="pf-cancel-btn" onClick={() => { setEditing(false); setFormData(profile); }}>
                <FaTimes /> Cancel
              </button>
            </div>
          )}

          {saved && <p className="pf-saved">Profile updated!</p>}
          {error && <p className="error">{error}</p>}
        </div>

        <div className="pf-main">
          <div className="pf-tabs">
            {[
              { id: "general", label: "General info" },
              ...(isElderly ? [{ id: "health", label: "Health info" }] : []),
              ...(isCaregiver ? [{ id: "assigned", label: "Assigned elderly" }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                className={`pf-tab ${activeTab === tab.id ? "pf-tab--on" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <div className="pf-section">
              <div className="pf-section-header">
                <h3>{isCaregiver ? "Caretaker Profile" : "General Information"}</h3>
                {editing && <span className="pf-editing-badge">Editing</span>}
              </div>
              <div className="pf-grid">
                <Field label="Full Name" icon={FaUser} field="name" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Email" icon={FaEnvelope} field="email" readOnly editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Phone" icon={FaPhone} field="phone" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Role" icon={FaShieldAlt} field="role" readOnly editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                {isElderly && (
                  <Field
                    label="Date of Birth"
                    icon={FaCalendarAlt}
                    field="dateOfBirth"
                    type="date"
                    max={today}
                    editing={editing}
                    formData={formData}
                    profile={profile}
                    setFormData={setFormData}
                  />
                )}
                {isElderly && (
                  <Field
                    label="Gender"
                    icon={FaVenusMars}
                    field="gender"
                    type="select"
                    options={GENDER_OPTIONS}
                    editing={editing}
                    formData={formData}
                    profile={profile}
                    setFormData={setFormData}
                  />
                )}
              </div>

              <div className="pf-field pf-field--full">
                <p className="pf-field-label"><FaMapMarkerAlt className="pf-field-icon" /> Address</p>
                {editing ? (
                  <input
                    className="pf-field-input"
                    value={formData.address || ""}
                    onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
                  />
                ) : (
                  <p className="pf-field-value">{profile.address || "-"}</p>
                )}
              </div>
            </div>
          )}

          {isElderly && activeTab === "health" && (
            <div className="pf-section">
              <div className="pf-section-header">
                <h3>Health Information</h3>
                {editing && <span className="pf-editing-badge">Editing</span>}
              </div>
              <div className="pf-grid">
                <Field
                  label="Blood Group"
                  icon={FaTint}
                  field="bloodType"
                  type="select"
                  options={BLOOD_GROUP_OPTIONS}
                  editing={editing}
                  formData={formData}
                  profile={profile}
                  setFormData={setFormData}
                />
                <Field label="Allergies" icon={FaShieldAlt} field="allergies" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Chronic Diseases" icon={FaUser} field="chronicDiseases" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Past Illnesses" icon={FaCalendarAlt} field="pastIllnesses" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
              </div>
            </div>
          )}

          {isCaregiver && activeTab === "assigned" && (
            <div className="pf-section">
              <div className="pf-section-header">
                <h3>Assigned Elderly History</h3>
              </div>

              {linkedElderlyUsers.length === 0 ? (
                <p className="pf-empty-note">No elderly users are assigned to this caretaker yet.</p>
              ) : (
                <div className="pf-elderly-list">
                  {linkedElderlyUsers.map((elderlyUser) => {
                    const isActive = elderlyUser.id === selectedElderlyId;
                    return (
                      <div
                        key={elderlyUser.id}
                        className={`pf-elderly-card ${isActive ? "pf-elderly-card--active" : ""}`}
                      >
                        <div className="pf-elderly-top">
                          <div>
                            <p className="pf-elderly-name">{elderlyUser.name}</p>
                            <p className="pf-elderly-meta">{elderlyUser.email}</p>
                            <p className="pf-elderly-meta">{elderlyUser.phone || "No phone added"}</p>
                          </div>
                          <span className={`pf-elderly-badge ${isActive ? "pf-elderly-badge--active" : ""}`}>
                            {isActive ? "Active" : "Assigned"}
                          </span>
                        </div>

                        <div className="pf-elderly-actions">
                          <button
                            className="pf-elderly-btn"
                            onClick={() => handleSetActiveElderly(elderlyUser)}
                          >
                            {isActive ? "Active elderly" : "Set active"}
                          </button>
                          <button
                            className="pf-elderly-btn pf-elderly-btn--ghost"
                            onClick={() => {
                              handleSetActiveElderly(elderlyUser);
                              navigate("/dashboard");
                            }}
                          >
                            Open dashboard <FaArrowRight />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
