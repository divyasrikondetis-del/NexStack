import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { askQuestion, fetchQuestionById, updateQuestion } from "../api";

function AskQuestion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editId = params.get("id");
  const isEdit = params.get("edit") === "true";

  useEffect(() => {
    const loadForEdit = async () => {
      if (isEdit && editId) {
        try {
          const res = await fetchQuestionById(editId);
          const q = res.data;
          setTitle(q.title || "");
          setDescription(q.description || "");
          setTags((q.tags || []).join(", "));
        } catch (err) {
          setError("Unable to load question for editing.");
        }
      }
    };
    loadForEdit();
  }, [isEdit, editId]);

  const notifyHomeFeed = (question) => {
    localStorage.setItem(
      "questionPosted",
      JSON.stringify({
        id: question._id,
        title: question.title,
        timestamp: Date.now(),
      })
    );

    window.dispatchEvent(new CustomEvent("question-posted", { detail: question }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in before asking a question.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const questionData = {
        title: title.trim(),
        description: description.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        user: user._id,
      };

      if (isEdit && editId) {
        const response = await updateQuestion(editId, questionData);
        setSuccess("Question updated successfully.");
        setTimeout(() => navigate(`/questions/${response.data._id}`), 800);
      } else {
        const response = await askQuestion(questionData);
        notifyHomeFeed(response.data);
        setSuccess("Question posted successfully.");
        setTitle("");
        setDescription("");
        setTags("");
        setTimeout(() => {
          navigate(`/questions/${response.data._id}`);
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to post question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: "40px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1>Ask a Question</h1>

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
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a clear, specific title"
              required
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your question in detail"
              rows={8}
              required
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px", resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags separated by commas"
              style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px" }}
            />
            <p style={{ marginTop: "8px", color: "#6b6b6b" }}>
              Example: react, node.js, mongodb
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ padding: "14px 24px", background: isSubmitting ? "#6c757d" : "#0a95ff", color: "white", border: "none", borderRadius: "8px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            {isSubmitting ? "Submitting..." : isEdit ? "Update Question" : "Post Question"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AskQuestion;
