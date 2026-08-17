import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQuestions } from "../api";
import Question from "../components/Question/Question";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("newest");
  const [selectedTag, setSelectedTag] = useState("");

  const loadQuestions = async () => {
    try {
      setLoading(true);

      const response = await fetchQuestions();

      setQuestions(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();

    window.addEventListener("question-posted", loadQuestions);

    return () => {
      window.removeEventListener("question-posted", loadQuestions);
    };
  }, []);

  const tags = useMemo(() => {
    return [...new Set(questions.flatMap((q) => q.tags || []))];
  }, [questions]);

  let filteredQuestions = questions.filter((question) => {
    const text = search.toLowerCase();

    const matchSearch =
      question.title.toLowerCase().includes(text) ||
      question.description.toLowerCase().includes(text) ||
      (question.tags || []).join(" ").toLowerCase().includes(text);

    const matchTag =
      selectedTag === "" ||
      (question.tags || []).includes(selectedTag);

    return matchSearch && matchTag;
  });

  if (filter === "newest") {
    filteredQuestions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (filter === "active") {
    filteredQuestions.sort(
      (a, b) => (b.views || 0) - (a.views || 0)
    );
  }

  if (filter === "unanswered") {
    filteredQuestions = filteredQuestions.filter(
      (q) => (q.answers?.length || 0) === 0
    );
  }

  if (loading) {
    return (
      <main className="home-loading">
        <h2>Loading Questions...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main className="home-loading">
        <h2 style={{ color: "red" }}>{error}</h2>
      </main>
    );
  }

  return (
    <main className="home-page">

      {/* Hero */}

      <section className="home-hero">

        <div>

          <span className="home-badge">
            Community Q&A
          </span>

          <h1>
            Find answers and share your technical questions
          </h1>

          <p className="home-intro">
            Browse real developer questions, join discussions,
            and post your own programming issues.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/ask")}
        >
          Ask Question
        </button>

      </section>

      {/* Summary */}

      <section className="home-summary">

        <div className="summary-card">
          <h4>{questions.length}</h4>
          <p>Questions</p>
        </div>

        <div className="summary-card">
          <h4>
            {questions.reduce(
              (sum, q) => sum + (q.answers?.length || 0),
              0
            )}
          </h4>
          <p>Answers</p>
        </div>

        <div className="summary-card">
          <h4>{tags.length}</h4>
          <p>Tags</p>
        </div>

      </section>
            {/* Filters */}

      <section className="home-filters">

        <div className="left">
          <h2 className="section-title">
            All Questions
          </h2>

          <p className="text-muted">
            {filteredQuestions.length} Questions
          </p>
        </div>

        <div className="filter-group">

          <button
            className={filter === "newest" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("newest")}
          >
            Newest
          </button>

          <button
            className={filter === "active" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("active")}
          >
            Active
          </button>

          <button
            className={filter === "unanswered" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("unanswered")}
          >
            Unanswered
          </button>

        </div>

      </section>

      <input
        className="search-input"
        type="text"
        placeholder="Search questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="tag-buttons">

        <button
          className={selectedTag === "" ? "active" : ""}
          onClick={() => setSelectedTag("")}
        >
          All
        </button>

        {tags.map((tag) => (
          <button
            key={tag}
            className={selectedTag === tag ? "active" : ""}
            onClick={() => setSelectedTag(tag)}
          >
            {tag}
          </button>
        ))}

      </div>

      <section className="question-list">

        {filteredQuestions.length === 0 ? (

          <h2 style={{ textAlign: "center" }}>
            No Questions Found
          </h2>

        ) : (

          filteredQuestions.map((question) => (

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

      </section>

    </main>
  );
}

export default Home;