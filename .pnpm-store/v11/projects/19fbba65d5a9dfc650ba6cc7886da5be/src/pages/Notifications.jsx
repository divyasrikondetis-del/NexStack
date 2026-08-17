import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  deleteNotification,
} from "../api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await fetchNotifications(currentUser._id);
      setNotifications(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      loadNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "30px auto",
        padding: "20px",
      }}
    >
      <h2>🔔 Notifications</h2>

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              background: notification.read
                ? "#fff"
                : "#eef6ff",
            }}
          >
            <h4>{notification.message}</h4>

            <p>
              <strong>Type:</strong>{" "}
              {notification.type}
            </p>

            <p>
              <strong>From:</strong>{" "}
              {notification.fromUserId?.name}
            </p>

            <p>
              {new Date(
                notification.createdAt
              ).toLocaleString()}
            </p>

            {!notification.read && (
              <button
                onClick={() =>
                  handleRead(notification._id)
                }
                style={{
                  marginRight: "10px",
                }}
              >
                Mark Read
              </button>
            )}

            <button
              onClick={() =>
                handleDelete(notification._id)
              }
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;