import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  transferReputation,
} from "../api";

function TransferReputation() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await fetchUsers();

      const filtered = res.data.filter(
        (user) => user._id !== currentUser._id
      );

      setUsers(filtered);
    } catch (err) {
      console.error("Failed to load users:", err);
      setMessage(
        err.response?.data?.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!receiverId) {
      setMessage("Please select a user");
      return;
    }

    if (!reason.trim()) {
      setMessage("Please enter a reason");
      return;
    }

    const numericPoints = Number(points);

    if (
      !Number.isFinite(numericPoints) ||
      numericPoints < 1 ||
      numericPoints > 50
    ) {
      setMessage("Points must be between 1 and 50");
      return;
    }

    try {
      await transferReputation({
        senderId: currentUser._id,
        receiverId,
        points: numericPoints,
        reason: reason.trim(),
      });

      setMessage("✅ Reputation transferred successfully!");

      setPoints(10);
      setReason("");
      setReceiverId("");

      await loadUsers();
    } catch (err) {
      console.error("Reputation transfer error:", err);

      setMessage(
        "❌ " +
          (err.response?.data?.message ||
            err.message ||
            "Transfer failed")
      );
    }
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        background: "#fff",
        padding: 30,
        borderRadius: 12,
      }}
    >
      <h2>⭐ Transfer Reputation</h2>

      {/* Sender */}
      <div
        style={{
          background: "#eef6ff",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <h3>Sender (You)</h3>

        <p
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          👤 {currentUser?.name}
        </p>

        <p>
          Reputation: {currentUser?.reputation || 0}
        </p>
      </div>

      {/* Receiver */}
      <div
        style={{
          background: "#f8f9fa",
          padding: 20,
          borderRadius: 10,
          marginBottom: 25,
        }}
      >
        <h3>Select Receiver</h3>

        <select
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        >
          <option value="">
            -- Select a user --
          </option>

          {users.map((user) => (
            <option
              key={user._id}
              value={user._id}
            >
              {user.name} (Reputation:{" "}
              {user.reputation || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Transfer form */}
      <form onSubmit={handleTransfer}>
        <label
          style={{
            fontWeight: "bold",
          }}
        >
          Points (1-50)
        </label>

        <input
          type="number"
          value={points}
          min="1"
          max="50"
          onChange={(e) => setPoints(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 20,
            marginTop: 8,
            boxSizing: "border-box",
          }}
        />

        <label
          style={{
            fontWeight: "bold",
          }}
        >
          Reason
        </label>

        <textarea
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you transferring reputation?"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 20,
            marginTop: 8,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 14,
            background: "#0A95FF",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⭐ Transfer Reputation
        </button>
      </form>

      {/* Message */}
      {message && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 8,
            background: message.includes("✅")
              ? "#d4edda"
              : "#f8d7da",
            color: message.includes("✅")
              ? "#155724"
              : "#721c24",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default TransferReputation;