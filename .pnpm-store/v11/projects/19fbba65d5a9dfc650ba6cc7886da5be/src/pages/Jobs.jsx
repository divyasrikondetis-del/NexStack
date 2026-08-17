import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:5000/jobs");
        setJobs(response.data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>Loading jobs...</h2>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>💼 Jobs</h1>
        <button
          onClick={() => navigate("/post-job")}
          style={{
            background: "#0a95ff",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Post a Job
        </button>
      </div>

      <br />

      <h3>{jobs.length} Jobs Available</h3>

      {jobs.length === 0 ? (
        <p>No jobs posted yet.</p>
      ) : (
        jobs.map((job) => (
          <div
            key={job._id}
            style={{
              borderBottom: "1px solid #ddd",
              padding: "15px",
              marginBottom: "10px"
            }}
          >
            <h3 style={{ color: "#0a95ff", margin: 0 }}>{job.title}</h3>
            <p style={{ margin: "5px 0", color: "#3b4045" }}>
              🏢 {job.company} • 📍 {job.location}
            </p>
            <p style={{ margin: "5px 0", color: "#6b6b6b" }}>
              💰 {job.salary}
            </p>
            <p style={{ margin: "10px 0" }}>{job.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {job.requirements?.map((req, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 8px",
                    background: "#e1ecf4",
                    borderRadius: "5px",
                    fontSize: "12px"
                  }}
                >
                  {req}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#6b6b6b", marginTop: "10px" }}>
              Posted by: {job.postedBy?.name || "Unknown"} • {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default Jobs;