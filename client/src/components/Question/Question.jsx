import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import "./Question.css";

function Question({
  id,
  title,
  description,
  votes,
  answers,
  views,
  tags,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <a
      href={`/questions/${id}`}
      className="question-link"
      onClick={(e) => {
        e.preventDefault();
        navigate(`/questions/${id}`);
      }}
    >
      <div className="question-card">
        <div className="question-stats">
          <div className="stat-box">
            <h3>{votes}</h3>
            <span>{t("votes")}</span>
          </div>

          <div className="stat-box">
            <h3>{answers}</h3>
            <span>{t("answers")}</span>
          </div>

          <div className="stat-box">
            <h3>{views}</h3>
            <span>{t("views")}</span>
          </div>
        </div>

        <div className="question-content">
          <h2 className="question-title">{title}</h2>

          <p className="question-description">
            {description}
          </p>

          <div className="tags">
            {tags &&
              tags.map((tag, index) => (
                <span className="tag" key={index}>
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </a>
  );
}

export default Question;