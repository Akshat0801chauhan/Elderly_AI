import { useEffect, useState } from "react";
import Layout from "./Layout";
import { FaUser, FaPen } from "react-icons/fa";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {
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
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <Layout>
      <div className="content">

        {/* LEFT */}
        <div className="left">
          <h2 className="section-title">My Profile</h2>

          <div className="profile-card">

            {/* EDIT ICON */}
            <FaPen
              className="edit-icon"
              onClick={() => {
                setEditing(true);
                setFormData(profile);
              }}
            />

            <div className="profile-header">
              <div className="avatar">
                <FaUser />
              </div>

              <div>
                <h3>{profile.name}</h3>
                <p className="email">{profile.email}</p>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <span className="label">Phone</span>
                <span className="value">{profile.phone}</span>
              </div>

              <div className="detail-row">
                <span className="label">Address</span>
                <span className="value">{profile.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <h3 className="section-title">Account Info</h3>

          <div className="info-card">
            <p className="label">Status</p>
            <p className="active">Active</p>

            <p className="label" style={{ marginTop: "10px" }}>Role</p>
            <p className="value">{profile.role}</p>
          </div>
        </div>

      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="form">
          <div className="form-card">
            <h3>Edit Profile</h3>

            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Name"
            />

            <input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Phone"
            />

            <input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Address"
            />

            <div className="form-actions">
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}