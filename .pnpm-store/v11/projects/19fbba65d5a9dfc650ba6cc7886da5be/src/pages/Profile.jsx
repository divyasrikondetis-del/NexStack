import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchUserById,
  fetchReputationHistory,
} from "../api";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch user data
      const { data } = await fetchUserById(id);
      setUser(data);

      // Fetch reputation history
      try {
        const historyData = await fetchReputationHistory(id);
        setHistory(historyData.data || []);
      } catch (histErr) {
        console.log("Reputation history error:", histErr);
        setHistory([]); // Set empty array if history fails
      }
    } catch (err) {
      console.error("Error loading user:", err);
      setError(err.response?.data?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (reputation = 0) => {
    if (reputation >= 1000)
      return {
        name: "Diamond Member",
        emoji: "💎",
        color: "#00BCD4",
      };

    if (reputation >= 500)
      return {
        name: "Gold Member",
        emoji: "🥇",
        color: "#FFD700",
      };

    if (reputation >= 100)
      return {
        name: "Silver Member",
        emoji: "🥈",
        color: "#9E9E9E",
      };

    return {
      name: "Bronze Member",
      emoji: "🥉",
      color: "#CD7F32",
    };
  };

  if (loading) {
    return <h2 style={{ padding: 40 }}>Loading...</h2>;
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "red" }}>❌ {error}</h2>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  if (!user) {
    return <h2 style={{ padding: 40 }}>User not found</h2>;
  }

  const badge = getBadge(user.reputation);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: 30,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 30,
          textAlign: "center",
        }}
      >
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff&size=128`}
          alt="avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
          }}
        />

        <h1>{user.name}</h1>

        <p>{user.email}</p>
        
        {currentUser._id === user._id && (
          <button
            onClick={() => navigate("/edit-profile")}
            style={{
              marginTop: 15,
              background: "#28a745",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✏️ Edit Profile
          </button>
        )}

        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "#f8f9fa",
            borderRadius: 10,
          }}
        >
          <h2>⭐ Reputation : {user.reputation || 0}</h2>

          <h3 style={{ color: badge.color }}>
            {badge.emoji} {badge.name}
          </h3>
        </div>

        <hr />

        <h3>About</h3>

        <p>{user.about || "No bio added yet."}</p>

        <hr />

        <h3>Skills</h3>

        {user.tags?.length ? (
          user.tags.map((tag, index) => (
            <span
              key={index}
              style={{
                background: "#0A95FF",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: 20,
                marginRight: 10,
                marginBottom: 10,
                display: "inline-block",
              }}
            >
              {tag}
            </span>
          ))
        ) : (
          <p>No skills added yet.</p>
        )}

        <hr />

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <div>
            <h2>{user.followers?.length || 0}</h2>
            <p>Followers</p>
          </div>

          <div>
            <h2>{user.following?.length || 0}</h2>
            <p>Following</p>
          </div>
        </div>

        <hr />

        <h3>📜 Reputation History</h3>

        {history.length === 0 ? (
          <p>No reputation history yet.</p>
        ) : (
          history.map((item, index) => (
            <div
              key={item._id || index}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
                textAlign: "left",
              }}
            >
              <h4>{item.action || item.type || "Reputation Update"}</h4>

              <p>
                <strong>Points :</strong>{" "}
                <span
                  style={{
                    color: (item.points || item.amount || 0) >= 0
                      ? "green"
                      : "red",
                    fontWeight: "bold",
                  }}
                >
                  {(item.points || item.amount || 0) >= 0 ? "+" : ""}
                  {item.points || item.amount || 0}
                </span>
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {item.reason || item.description || "No reason provided"}
              </p>

              {item.sender && (
                <p>
                  <strong>Sender:</strong>{" "}
                  {typeof item.sender === 'object' ? item.sender.name : item.sender}
                </p>
              )}

              {item.receiver && (
                <p>
                  <strong>Receiver:</strong>{" "}
                  {typeof item.receiver === 'object' ? item.receiver.name : item.receiver}
                </p>
              )}

              <small>
                {new Date(
                  item.createdAt || item.timestamp || Date.now()
                ).toLocaleString()}
              </small>
            </div>
          ))
        )}

        <hr />

        {currentUser._id !== user._id && (
          <button
            onClick={() =>
              navigate(`/transfer-reputation/${user._id}`)
            }
            style={{
              background: "#0A95FF",
              color: "#fff",
              border: "none",
              padding: "14px 28px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 16,
              margin: "10px 0",
            }}
          >
            ⭐ Transfer Reputation
          </button>
        )}

        <hr />

        <p>
          Joined on{" "}
          {user.createdAt || user.joinedOn 
            ? new Date(user.createdAt || user.joinedOn).toLocaleDateString()
            : "Recently"}
        </p>
      </div>
    </div>
  );
}

export default Profile;