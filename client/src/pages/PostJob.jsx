import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJob } from "../api";

function PostJob() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in before posting a job.");
      return;
    }

    if (!title.trim() || !company.trim() || !location.trim() || !description.trim()) {
      setError("Title, company, location, and description are required.");
      return;
    }

    try {
      await postJob({
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        salary: salary.trim() || "Not disclosed",
        description: description.trim(),
        requirements: requirements
          .split(",")
          .map((req) => req.trim())
          .filter(Boolean),
        postedBy: user._id,
      });

      setSuccess("Job posted successfully.");
      setTitle("");
      setCompany("");
      setLocation("");
      setSalary("");
      setDescription("");
      setRequirements("");

      setTimeout(() => {
        navigate("/jobs");
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to post job.");
    }
  };

  return (
    <div style={{ flex: 1, padding: "40px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1>Post a Job</h1>

        {error && (
          <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "10px", background: "#f8d7da", color: "#842029" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "10px", background: "#d1e7dd", color: "#0f5132" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Job Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
              required
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              required
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote or city name"
              required
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Salary</label>
            <input
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. $120k - $140k"
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and technologies"
              rows={6}
              required
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px", resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Requirements</label>
            <input
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Add comma-separated requirements"
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: "14px 24px", background: "#0a95ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostJob;
