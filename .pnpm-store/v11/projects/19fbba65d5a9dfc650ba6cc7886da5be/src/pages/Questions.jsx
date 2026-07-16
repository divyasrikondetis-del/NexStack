import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Question from "../components/Question/Question";

function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("newest");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/questions");
        let data = response.data;

        // Apply filters
        if (filter === "newest") {
          data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (filter === "active") {
          data = data.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
        } else if (filter === "unanswered") {
          data = data.filter(q => (q.answers?.length || 0) === 0);
        }

        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filter]);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>Loading questions...</h2>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>All Questions</h1>
        <button
          onClick={() => navigate("/ask")}
          style={{
            background: "#0a95ff",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Ask Question
        </button>
      </div>

      <br />

      <h3>{questions.length} Questions</h3>

      <div style={{ margin: "20px 0" }}>
        <button
          onClick={() => setFilter("newest")}
          style={{
            marginRight: "10px",
            padding: "5px 15px",
            cursor: "pointer",
            background: filter === "newest" ? "#0a95ff" : "white",
            color: filter === "newest" ? "white" : "black",
            border: "1px solid #ddd",
            borderRadius: "3px"
          }}
        >
          Newest
        </button>
        <button
          onClick={() => setFilter("active")}
          style={{
            marginRight: "10px",
            padding: "5px 15px",
            cursor: "pointer",
            background: filter === "active" ? "#0a95ff" : "white",
            color: filter === "active" ? "white" : "black",
            border: "1px solid #ddd",
            borderRadius: "3px"
          }}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("unanswered")}
          style={{
            padding: "5px 15px",
            cursor: "pointer",
            background: filter === "unanswered" ? "#0a95ff" : "white",
            color: filter === "unanswered" ? "white" : "black",
            border: "1px solid #ddd",
            borderRadius: "3px"
          }}
        >
          Unanswered
        </button>
      </div>

      {questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        questions.map((question) => (
          <Question
            key={question._id}
            id={question._id}
            title={question.title}
            description={question.description}
            votes={question.votes || 0}
            answers={question.answers?.length || 0}
            views={question.views || 0}
            tags={question.tags || []}
          />
        ))
      )}
    </div>
  );
}

export default Questions;