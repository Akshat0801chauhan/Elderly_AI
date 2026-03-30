import { useEffect, useState } from "react";
import Layout from "./Layout";
import { FaUser, FaPhone, FaMapMarkerAlt, FaShieldAlt, FaEnvelope, FaSave, FaTimes } from "react-icons/fa";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data);
        setFormData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await fetch("http://localhost:8080/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      setProfile(formData);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <p style={{ padding: "20px" }}>Loading...</p>;

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Layout>
      <div className="profile-page">

        {/* ── TOP: Avatar + Name + Email ── */}
        <div className="profile-top">
          <div className="avatar-xl">{initials}</div>
          <div className="profile-top-info">
            <h2 className="profile-name">{profile.name}</h2>
            <p className="profile-email">{profile.email}</p>
          </div>
        </div>

        {/* ── BIG EDITABLE CARD ── */}
        <div className="profile-card">

          <div className="card-title-row">
            <h3 className="section-title">Profile Details</h3>
            {!editing ? (
              <button className="edit-btn" onClick={() => setEditing(true)}>
                Edit
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>
                  <FaSave /> Save
                </button>
                <button className="cancel-btn" onClick={() => { setEditing(false); setFormData(profile); }}>
                  <FaTimes /> Cancel
                </button>
              </div>
            )}
          </div>

          {saved && <p className="saved-msg">✓ Profile updated successfully</p>}

          <div className="fields-grid">

            {/* Name */}
            <div className="field-block">
              <div className="field-label">
                <FaUser className="field-icon" /> Full Name
              </div>
              {editing ? (
                <input
                  className="field-input"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="field-value">{profile.name || "—"}</p>
              )}
            </div>

            {/* Email */}
            <div className="field-block">
              <div className="field-label">
                <FaEnvelope className="field-icon" /> Email
              </div>
              {editing ? (
                <input
                  className="field-input"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="field-value">{profile.email || "—"}</p>
              )}
            </div>

            {/* Phone */}
            <div className="field-block">
              <div className="field-label">
                <FaPhone className="field-icon" /> Phone
              </div>
              {editing ? (
                <input
                  className="field-input"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="field-value">{profile.phone || "—"}</p>
              )}
            </div>

            {/* Role */}
            <div className="field-block">
              <div className="field-label">
                <FaShieldAlt className="field-icon" /> Role
              </div>
              <p className="field-value">{profile.role || "User"}</p>
            </div>

            {/* Address - full width */}
            <div className="field-block full-width">
              <div className="field-label">
                <FaMapMarkerAlt className="field-icon" /> Address
              </div>
              {editing ? (
                <input
                  className="field-input"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              ) : (
                <p className="field-value">{profile.address || "—"}</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
}