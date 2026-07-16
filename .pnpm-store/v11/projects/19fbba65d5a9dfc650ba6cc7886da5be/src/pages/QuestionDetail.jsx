import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchQuestionById, fetchAnswers, addAnswer, voteQuestion, deleteQuestion, voteAnswer, deleteAnswer } from "../api";

function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const loadQuestion = useCallback(async () => {
    try {
      const [questionResponse, answersResponse] = await Promise.all([
        fetchQuestionById(id),
        fetchAnswers(id),
      ]);

      setQuestion(questionResponse.data);
      setAnswers(answersResponse.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Question not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id, loadQuestion]);

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) {
      setError("Please log in to post an answer.");
      return;
    }

    if (!answerText.trim()) {
      setError("Answer cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      await addAnswer(id, {
        content: answerText.trim(),
        user: currentUser._id,
      });
      setAnswerText("");
      setSuccess("Answer posted successfully.");
      await loadQuestion();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Unable to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteQuestion = async (vote) => {
    try {
      if (!currentUser) {
        setError("Please log in to vote on a question.");
        return;
      }

      const response = await voteQuestion(id, vote);
      setQuestion((prev) => (prev ? { ...prev, votes: response.data.votes } : prev));
      setSuccess("Vote recorded.");
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || "Unable to vote on question.");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm("Delete this question? This action cannot be undone.")) return;
    try {
      await deleteQuestion(id);
      // navigate back to questions list
      window.location.href = "/questions";
    } catch (e) {
      console.error(e);
      setError("Unable to delete question.");
    }
  };

  const handleVoteAnswer = async (answerId, v) => {
    try {
      if (!currentUser) {
        setError("Please log in to vote on an answer.");
        return;
      }

      const response = await voteAnswer(answerId, v);
      setAnswers((prev) =>
        prev.map((answer) =>
          answer._id === answerId ? { ...answer, votes: response.data.votes } : answer
        )
      );
      setSuccess("Vote recorded.");
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || "Unable to vote on answer.");
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      await deleteAnswer(answerId);
      await loadQuestion();
    } catch (e) {
      console.error(e);
      setError("Unable to delete answer.");

    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>Loading question...</h2>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2 style={{ color: "red" }}>{error || "Question not found"}</h2>
        <Link to="/questions">
          <button style={{
            background: "#0a95ff",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px"
          }}>
            Back to Questions
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <h1>{question.title}</h1>

      <div style={{
        margin: "20px 0",
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "5px"
      }}>
        <p style={{ fontSize: "16px", lineHeight: "1.8" }}>
          {question.description}
        </p>
      </div>

      <div style={{ marginTop: "15px" }}>
        {question.tags?.map((tag, i) => (
          <span
            key={i}
            style={{
              marginRight: "6px",
              marginBottom: "6px",
              display: "inline-block",
              padding: "6px 12px",
              background: "#e1ecf4",
              color: "#39739d",
              borderRadius: "5px",
              fontSize: "13px"
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div style={{
        marginTop: "24px",
        padding: "18px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "#ffffff"
      }}>
        <p><strong>Asked by:</strong> {question.user?.name || question.user?.email || "Unknown User"}</p>
        <p><strong>Created:</strong> {new Date(question.createdAt).toLocaleDateString()}</p>
        <p><strong>Views:</strong> {question.views || 0}</p>
        <p style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>Votes:</strong>
          <button onClick={() => handleVoteQuestion(1)} style={{ background: "#e6f4ff", border: "1px solid #cfefff", padding: "6px", borderRadius: "6px", cursor: "pointer" }}>▲</button>
          <span>{question.votes || 0}</span>
          <button onClick={() => handleVoteQuestion(-1)} style={{ background: "#fff1f0", border: "1px solid #ffd6d6", padding: "6px", borderRadius: "6px", cursor: "pointer" }}>▼</button>
        </p>

        {currentUser && currentUser._id === question.user?._id && (
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <Link to={`/ask?id=${id}&edit=true`}>
              <button style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}>Edit</button>
            </Link>
            <button onClick={handleDeleteQuestion} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e74c3c", background: "#ffeded", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
          </div>
        )}
      </div>

      <section style={{ marginTop: "30px" }}>
        <h2>{answers.length ? `${answers.length} Answer${answers.length > 1 ? "s" : ""}` : "No answers yet"}</h2>

        {answers.length > 0 && answers.map((answer) => (
          <div
            key={answer._id}
            style={{
              marginTop: "16px",
              padding: "18px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "56px" }}>
              <button onClick={() => handleVoteAnswer(answer._id, 1)} style={{ background: "#e6f4ff", border: "1px solid #cfefff", padding: "6px", borderRadius: "6px", cursor: "pointer" }}>▲</button>
              <strong>{answer.votes || 0}</strong>
              <button onClick={() => handleVoteAnswer(answer._id, -1)} style={{ background: "#fff1f0", border: "1px solid #ffd6d6", padding: "6px", borderRadius: "6px", cursor: "pointer" }}>▼</button>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ marginBottom: "10px", lineHeight: "1.8" }}>{answer.content}</p>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontSize: "14px" }}>
                <span>Answered by: {answer.user?.name || answer.user?.email || "Anonymous"}</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                  {currentUser && currentUser._id === answer.user?._id && (
                    <button onClick={() => handleDeleteAnswer(answer._id)} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #e74c3c", background: "#fff0f0", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>Post an answer</h2>

        {success && (
          <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "8px", background: "#d1fae5", color: "#064e3b" }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "8px", background: "#f8d7da", color: "#842029" }}>
            {error}
          </div>
        )}

        {currentUser ? (
          <form onSubmit={handleAnswerSubmit}>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={6}
              placeholder="Write your answer here..."
              style={{ width: "100%", padding: "14px", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "14px", resize: "vertical" }}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "14px",
                padding: "12px 20px",
                background: "#0a95ff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              {submitting ? "Submitting..." : "Post Answer"}
            </button>
          </form>
        ) : (
          <p>
            Please <Link to="/auth">log in</Link> to post an answer.
          </p>
        )}
      </section>

      <Link to="/questions">
        <button
          style={{
            marginTop: "24px",
            background: "#0a95ff",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          ? Back to Questions
        </button>
      </Link>
    </div>
  );
}

export default QuestionDetail;
