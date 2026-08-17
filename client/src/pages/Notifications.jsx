import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  deleteNotification,
} from "../api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!currentUser) {
      console.log("❌ No user logged in");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("🔍 Fetching notifications for user:", currentUser._id);
      
      const response = await fetchNotifications(currentUser._id);
      console.log("✅ Full response:", response);
      
      // ✅ FIX: Handle the nested response format
      let data = [];
      if (response && response.data) {
        // If response has a data property (axios wrapper)
        data = response.data.notifications || response.data || [];
      } else if (response && response.notifications) {
        // If response directly has notifications property
        data = response.notifications;
      } else if (Array.isArray(response)) {
        // If response is an array
        data = response;
      } else {
        console.log("⚠️ Unexpected format:", response);
        data = [];
      }
      
      console.log("📊 Setting notifications:", data.length);
      setNotifications(data);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (err) {
      console.error("❌ Error marking read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      await loadNotifications();
    } catch (err) {
      console.error("❌ Error deleting:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
        <h2>🔔 Notifications</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
        <h2>🔔 Notifications</h2>
        <p style={{ color: "red" }}>❌ {error}</p>
        <button 
          onClick={loadNotifications}
          style={{
            padding: "8px 16px",
            background: "#0A95FF",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
      <h2>🔔 Notifications</h2>

      {!notifications || notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification._id || notification.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              background: notification.read || notification.isRead ? "#fff" : "#eef6ff",
            }}
          >
            <h4>{notification.message || notification.title || "Notification"}</h4>

            <p>
              <strong>Type:</strong> {notification.type || "General"}
            </p>

            {notification.sender && (
              <p>
                <strong>From:</strong> {typeof notification.sender === 'object' ? notification.sender.name : notification.sender}
              </p>
            )}

            {notification.fromUserId && (
              <p>
                <strong>From:</strong> {typeof notification.fromUserId === 'object' ? notification.fromUserId.name : notification.fromUserId}
              </p>
            )}

            <p style={{ color: "#666", fontSize: "13px" }}>
              {new Date(notification.createdAt || notification.timestamp || Date.now()).toLocaleString()}
            </p>

            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              {!notification.read && !notification.isRead && (
                <button
                  onClick={() => handleRead(notification._id || notification.id)}
                  style={{
                    padding: "6px 12px",
                    background: "#0A95FF",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Mark Read
                </button>
              )}

              <button
                onClick={() => handleDelete(notification._id || notification.id)}
                style={{
                  padding: "6px 12px",
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;