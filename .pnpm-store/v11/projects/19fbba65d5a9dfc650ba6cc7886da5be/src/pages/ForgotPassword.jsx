import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await forgotPassword(email);

      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "450px",
        margin: "60px auto",
        background: "#fff",
        padding: "30px",
        borderRadius: "10px",
        border: "1px solid #ddd",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>
        Forgot Password
      </h2>

      <p style={{ color: "#666", marginBottom: "20px" }}>
        Enter your registered email address.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "15px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#0a95ff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
          }}
        >
          {loading ? "Sending..." : "Reset Password"}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#e8f5e9",
            border: "1px solid #4caf50",
            borderRadius: "8px",
            color: "#2e7d32",
            lineHeight: "1.6",
          }}
        >
          <strong>{message}</strong>

          <p style={{ marginTop: "10px" }}>
            📧 Please check your registered email inbox.
          </p>

          <p>
            🔑 A temporary password has been sent to your email.
          </p>

          <p>
            🔐 Return to the Login page and sign in using your email and the temporary password.
          </p>

          <p>
            ⚙️ After logging in, change your password to something you can remember.
          </p>

          <p>
            <strong>
              Don't forget to check your Spam/Junk folder if you don't see the email.
            </strong>
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: "25px",
          textAlign: "center",
        }}
      >
        <Link
          to="/auth"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#0a95ff",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: "600",
          }}
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;