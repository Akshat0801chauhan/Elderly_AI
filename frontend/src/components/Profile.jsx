import { useEffect, useState } from "react";
import Layout from "./Layout";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const token = localStorage.getItem("token");

  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/profile", {
          method:"GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      {/* MAIN */}
      <div className="main">
        <h2>My Profile 👤</h2>

        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">👤</div>
            <div>
              <h3>{profile.name}</h3>
              <p>{profile.email}</p>
            </div>
          </div>

          <div className="profile-details">
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Address:</strong> {profile.address}</p>
          </div>

          <button
            className="edit-btn"
            onClick={() => {
              setEditing(true);
              setFormData(profile);
            }}
          >
            Edit Profile
          </button>
        </div>

        {/* EDIT FORM */}
        {editing && (
          <div className="form">
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

            <div style={{ marginTop: "10px" }}>
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="progress-box">
        <h3>Account Info</h3>
        <p>Status: Active ✅</p>
        <p>Role: {profile.role}</p>
      </div>
    </Layout>
  );
}