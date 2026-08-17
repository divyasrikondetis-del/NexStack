import { Link } from "react-router-dom";
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
  return (
    <Link
      to={`/questions/${id}`}
      className="question-link"
    >
      <article className="question-card">

        {/* Left Stats */}
        <div className="question-stats">

          <div className="stat-box">
            <h3>{votes}</h3>
            <span>Votes</span>
          </div>

          <div className="stat-box">
            <h3>{answers}</h3>
            <span>Answers</span>
          </div>

          <div className="stat-box">
            <h3>{views}</h3>
            <span>Views</span>
          </div>

        </div>

        {/* Right Content */}
        <div className="question-content">

          <h2 className="question-title">
            {title}
          </h2>

          <p className="question-description">
            {description?.length > 180
              ? description.substring(0, 180) + "..."
              : description}
          </p>

          <div className="tags">

            {tags?.map((tag, index) => (
              <span
                key={index}
                className="tag"
              >
                {tag}
              </span>
            ))}

          </div>

        </div>

      </article>
    </Link>
  );
}

export default Question;