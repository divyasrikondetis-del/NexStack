import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQuestions, translateBatch } from "../api";
import Question from "../components/Question/Question";
import { useLanguage } from "../contexts/LanguageContext";
import "./Home.css";

function Home({ search, setSearch }) {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("newest");
  const [selectedTag, setSelectedTag] = useState("");
  const { t, language } = useLanguage();

  const translateQuestions = async (questionsList) => {
    if (language === "en" || !Array.isArray(questionsList) || questionsList.length === 0) {
      return questionsList;
    }

    try {
      const texts = [];
      const mapping = [];

      questionsList.forEach((question, questionIndex) => {
        texts.push(question.title || "");
        mapping.push({ questionIndex, field: "title" });
        texts.push(question.description || "");
        mapping.push({ questionIndex, field: "description" });
      });

      if (texts.length === 0) {
        return questionsList;
      }

      const response = await translateBatch(texts, language);
      const translatedTexts = response.data.translatedTexts || [];
      const translatedQuestions = questionsList.map((question) => ({ ...question }));

      translatedTexts.forEach((translatedText, index) => {
        const mappingItem = mapping[index];
        if (!mappingItem) return;
        translatedQuestions[mappingItem.questionIndex][mappingItem.field] = translatedText || translatedQuestions[mappingItem.questionIndex][mappingItem.field];
      });

      return translatedQuestions;
    } catch (translateError) {
      console.error("Translation error for home questions", translateError);
      return questionsList;
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetchQuestions();
      const translated = await translateQuestions(response.data);
      setQuestions(translated);
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
  }, [language]);

  const tags = useMemo(() => {
    return [...new Set(questions.flatMap((q) => q.tags || []))];
  }, [questions]);

  let filteredQuestions = questions.filter((question) => {
    const text = (search || "").toLowerCase();
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
        <h2>{t("loadingQuestions")}</h2>
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

      {/* Hero - All text now uses translations */}
      <section className="home-hero">
        <div>
          <span className="home-badge">
            {t("community")} Q&A
          </span>

          <h1>
            {t("Find answers and share your technical questions")}
          </h1>

          <p className="home-intro">
            {t("Browse real developer questions, join discussions, and post your own programming issues.")}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/ask")}
        >
          {t("askQuestion")}
        </button>
      </section>

      {/* Summary */}
      <section className="home-summary">
        <div className="summary-card">
          <h4>{questions.length}</h4>
          <p>{t("questions")}</p>
        </div>

        <div className="summary-card">
          <h4>
            {questions.reduce(
              (sum, q) => sum + (q.answers?.length || 0),
              0
            )}
          </h4>
          <p>{t("answers")}</p>
        </div>

        <div className="summary-card">
          <h4>{tags.length}</h4>
          <p>{t("tags")}</p>
        </div>
      </section>

      {/* Filters */}
      <section className="home-filters">
        <div className="left">
          <h2 className="section-title">
            {t("allQuestions")}
          </h2>
          <p className="text-muted">
            {t("questionsCount").replace("{count}", filteredQuestions.length)}
          </p>
        </div>

        <div className="filter-group">
          <button
            className={filter === "newest" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("newest")}
          >
            {t("newest")}
          </button>

          <button
            className={filter === "active" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("active")}
          >
            {t("active")}
          </button>

          <button
            className={filter === "unanswered" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("unanswered")}
          >
            {t("unanswered")}
          </button>
        </div>
      </section>

      {/* Search */}
      <input
        className="search-input"
        type="text"
        placeholder={t("searchQuestions")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tag Buttons */}
      <div className="tag-buttons">
        <button
          className={selectedTag === "" ? "active" : ""}
          onClick={() => setSelectedTag("")}
        >
          {t("all")}
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

      {/* Question List */}
      <section className="question-list">
        {filteredQuestions.length === 0 ? (
          <h2 style={{ textAlign: "center" }}>
            {t("noQuestionsFound")}
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