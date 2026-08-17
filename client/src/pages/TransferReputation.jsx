import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
      const res = await axios.get("http://localhost:5000/users");
      const filtered = res.data.filter(
        (u) => u._id !== currentUser._id
      );
      setUsers(filtered);
    } catch (err) {
      setMessage("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!receiverId) {
      setMessage("Please select a user");
      return;
    }

    if (!reason.trim()) {
      setMessage("Please enter a reason");
      return;
    }

    try {
      await axios.post("http://localhost:5000/reputation/transfer", {
        senderId: currentUser._id,
        receiverId,
        points: Number(points),
        reason,
      });

      setMessage("✅ Reputation transferred successfully!");
      setPoints(10);
      setReason("");
      setReceiverId("");
      loadUsers();
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Transfer failed"));
    }
  };

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", padding: 30, borderRadius: 12 }}>
      <h2>⭐ Transfer Reputation</h2>

      <div style={{ background: "#eef6ff", padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <h3>Sender (You)</h3>
        <p style={{ fontSize: 20, fontWeight: "bold" }}>👤 {currentUser?.name}</p>
        <p>Reputation: {currentUser?.reputation || 0}</p>
      </div>

      <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 10, marginBottom: 25 }}>
        <h3>Select Receiver</h3>
        <select
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
        >
          <option value="">-- Select a user --</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} (Reputation: {user.reputation || 0})
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleTransfer}>
        <label style={{ fontWeight: "bold" }}>Points (1-50)</label>
        <input
          type="number"
          value={points}
          min="1"
          max="50"
          onChange={(e) => setPoints(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #ccc", marginBottom: 20, marginTop: 8 }}
        />

        <label style={{ fontWeight: "bold" }}>Reason</label>
        <textarea
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #ccc", marginBottom: 20, marginTop: 8 }}
        />

        <button
          type="submit"
          style={{ width: "100%", padding: 14, background: "#0A95FF", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold" }}
        >
          ⭐ Transfer Reputation
        </button>
      </form>

      {message && (
        <div style={{ marginTop: 20, padding: 15, borderRadius: 8, background: message.includes("✅") ? "#d4edda" : "#f8d7da", color: message.includes("✅") ? "#155724" : "#721c24" }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default TransferReputation;