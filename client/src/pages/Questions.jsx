import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQuestions, translateBatch } from "../api";
import Question from "../components/Question/Question";
import { useLanguage } from "../contexts/LanguageContext";

function Questions() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("newest");

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
      console.error("Translation error for questions list", translateError);
      return questionsList;
    }
  };

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchQuestions();
        let data = response.data;

        if (!Array.isArray(data)) {
          throw new Error("Invalid response from server.");
        }

        // Apply filters
        if (filter === "newest") {
          data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (filter === "active") {
          data = data.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
        } else if (filter === "unanswered") {
          data = data.filter(q => (q.answers?.length || 0) === 0);
        }

        const translated = await translateQuestions(data);
        setQuestions(translated);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to load questions. Please refresh or try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [filter, language]);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>{t("loadingQuestions")}</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2 style={{ color: "red" }}>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{t("allQuestions")}</h1>
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
          {t("askQuestion")}
        </button>
      </div>

      <br />

      <h3>{t("questionsCount").replace("{count}", questions.length)}</h3>

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
          {t("newest")}
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
          {t("active")}
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
          {t("unanswered")}
        </button>
      </div>

      {questions.length === 0 ? (
        <p>{t("noQuestionsFound")}</p>
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