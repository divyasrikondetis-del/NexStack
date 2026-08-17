import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api"; // ✅ Import your API instance

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!token || !userStr) {
      navigate("/login");
      return;
    }

    try {
      const currentUser = JSON.parse(userStr);
      setName(currentUser.name || "");
      setAbout(currentUser.about || "");
      setTags(currentUser.tags ? currentUser.tags.join(", ") : "");
    } catch (e) {
      console.error("Error parsing user:", e);
      navigate("/login");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      setError("Please login first");
      setTimeout(() => navigate("/login"), 1500);
      setLoading(false);
      return;
    }

    const currentUser = JSON.parse(userStr);

    const updatedData = {
      name: name.trim(),
      about: about.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    };

    try {
      // 1. Update profile using API
      const updateResponse = await API.patch(`/users/${currentUser._id}`, updatedData);
      console.log("Update successful:", updateResponse.data);

      // 2. Check if profile is complete for bonus
      if (updatedData.name && updatedData.about && updatedData.tags.length > 0) {
        try {
          const bonusRes = await API.patch("/users/complete-profile", {});
          console.log("Bonus earned:", bonusRes.data);
          setSuccess("✅ Profile updated! +10 reputation bonus earned! ⭐");
        } catch (bonusErr) {
          console.log("Bonus error:", bonusErr.response?.data);
          if (bonusErr.response?.status === 400) {
            setSuccess("✅ Profile updated successfully!");
          } else {
            setSuccess("✅ Profile updated successfully!");
          }
        }
      } else {
        setSuccess("✅ Profile updated! Fill all fields to earn +10 reputation bonus.");
      }

      // 3. Refresh user data
      const refreshed = await API.get(`/users/${currentUser._id}`);
      localStorage.setItem("user", JSON.stringify(refreshed.data));
      
      setTimeout(() => {
        navigate(`/profile/${currentUser._id}`);
      }, 2000);

    } catch (err) {
      console.error("Update error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "700px",
      margin: "40px auto",
      background: "#fff",
      padding: "30px",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      border: "1px solid #e1e4e8",
    }}>
      <h2 style={{ marginBottom: "20px" }}>Edit Profile</h2>
      
      {error && (
        <div style={{
          background: "#fde2e2",
          color: "#c00",
          padding: "12px",
          borderRadius: "5px",
          marginBottom: "20px",
          border: "1px solid #f5c6cb"
        }}>
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div style={{
          background: "#d4edda",
          color: "#155724",
          padding: "12px",
          borderRadius: "5px",
          marginBottom: "20px",
          border: "1px solid #c3e6cb"
        }}>
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "5px" }}>
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "5px" }}>
            About *
          </label>
          <textarea
            rows="5"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            required
            placeholder="Tell us about yourself..."
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              fontSize: "16px",
              fontFamily: "inherit",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "5px" }}>
            Skills (comma separated) *
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            required
            placeholder="React, Node, MongoDB"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box"
            }}
          />
          <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
            💡 Complete all fields to earn +10 reputation bonus
          </small>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#0A95FF",
              color: "#fff",
              border: "none",
              padding: "12px 30px",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
          
          <button
            type="button"
            onClick={() => {
              const userStr = localStorage.getItem("user");
              if (userStr) {
                const user = JSON.parse(userStr);
                navigate(`/profile/${user._id}`);
              } else {
                navigate("/");
              }
            }}
            style={{
              padding: "12px 30px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              background: "#fff",
              fontSize: "16px",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;