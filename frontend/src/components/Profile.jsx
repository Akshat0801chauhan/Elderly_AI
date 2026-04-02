import { useEffect, useState } from "react";
import Layout from "./Layout";
import {
  FaUser, FaPhone, FaMapMarkerAlt, FaShieldAlt,
  FaEnvelope, FaSave, FaTimes, FaPen, FaCalendarAlt,
  FaVenusMars, FaTint
} from "react-icons/fa";
import "./Profile.css";

function Field({ label, icon: Icon, field, readOnly, editing, formData, profile, setFormData }) {
  return (
    <div className="pf-field">
      <p className="pf-field-label"><Icon className="pf-field-icon" /> {label}</p>
      {editing && !readOnly ? (
        <input
          className="pf-field-input"
          value={formData[field] || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
        />
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

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        setProfile(data);
        setFormData(data);
      } catch (err) {
        console.error(err);
        setError("Could not load profile");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setError("");
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

  if (!profile) {
    return (
      <Layout>
        <div className="pf-loading">
          <div className="pf-spinner" />
          Loading profile...
        </div>
      </Layout>
    );
  }

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const isElderly = profile.role === "ELDERLY";

  return (
    <Layout>
      <div className="pf-page">

        {/* Left: avatar card */}
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

        {/* Right: tabbed details */}
        <div className="pf-main">

          {/* Tab bar */}
          <div className="pf-tabs">
            {[
              { id: "general", label: "General info" },
              ...(isElderly ? [{ id: "health", label: "Health info" }] : []),
            ].map((t) => (
              <button
                key={t.id}
                className={`pf-tab ${activeTab === t.id ? "pf-tab--on" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* General Info */}
          {activeTab === "general" && (
            <div className="pf-section">
              <div className="pf-section-header">
                <h3>General Information</h3>
                {editing && <span className="pf-editing-badge">Editing</span>}
              </div>
              <div className="pf-grid">
                <Field label="Full Name" icon={FaUser} field="name" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Email" icon={FaEnvelope} field="email" readOnly editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Phone" icon={FaPhone} field="phone" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Role" icon={FaShieldAlt} field="role" readOnly editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                {isElderly && (
                  <Field label="Date of Birth" icon={FaCalendarAlt} field="dateOfBirth" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                )}
                {isElderly && (
                  <Field label="Gender" icon={FaVenusMars} field="gender" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                )}
              </div>

              {/* Address full width */}
              <div className="pf-field pf-field--full">
                <p className="pf-field-label"><FaMapMarkerAlt className="pf-field-icon" /> Address</p>
                {editing ? (
                  <input
                    className="pf-field-input"
                    value={formData.address || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                ) : (
                  <p className="pf-field-value">{profile.address || "-"}</p>
                )}
              </div>
            </div>
          )}

          {/* Health Info */}
          {isElderly && activeTab === "health" && (
            <div className="pf-section">
              <div className="pf-section-header">
                <h3>Health Information</h3>
                {editing && <span className="pf-editing-badge">Editing</span>}
              </div>
              <div className="pf-grid">
                <Field label="Blood Type" icon={FaTint} field="bloodType" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Allergies" icon={FaShieldAlt} field="allergies" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Chronic Diseases" icon={FaUser} field="chronicDiseases" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
                <Field label="Past Illnesses" icon={FaCalendarAlt} field="pastIllnesses" editing={editing} formData={formData} profile={profile} setFormData={setFormData} />
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
