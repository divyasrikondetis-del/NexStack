import { useLanguage } from "../../contexts/LanguageContext";

function RightSidebar() {
  const { t } = useLanguage();
  const hotTags = [
    "react",
    "javascript",
    "node.js",
    "express",
    "mongodb",
    "html",
    "css",
    "vite",
    "redux",
    "next.js",
  ];

  return (
    <aside
      style={{
        width: "270px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "sticky",
        top: "90px",
        height: "fit-content",
      }}
    >
      {/* Overflow Blog */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e3e6e8",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#2f3337",
            fontSize: "18px",
          }}
        >
          📢 {t("overflowBlog")}
        </h3>

        <ul
          style={{
            paddingLeft: "18px",
            color: "#555",
            lineHeight: "1.8",
          }}
        >
          <li>🚀 {t("welcomeToNexStack")}</li>
          <li>💡 {t("tipsForQuestions")}</li>
          <li>🔥 {t("learnMern")}</li>
        </ul>
      </div>

      {/* Featured */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e3e6e8",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#2f3337",
            fontSize: "18px",
          }}
        >
          📌 {t("featuredOnMeta")}
        </h3>

        <ul
          style={{
            paddingLeft: "18px",
            color: "#555",
            lineHeight: "1.8",
          }}
        >
          <li>{t("askClearQuestions")}</li>
          <li>{t("helpOtherDevelopers")}</li>
          <li>{t("voteUseful")}</li>
        </ul>
      </div>

      {/* Hot Tags */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e3e6e8",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#2f3337",
            fontSize: "18px",
          }}
        >
          🏷️ {t("hotTags")}
        </h3>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {hotTags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "7px 12px",
                borderRadius: "20px",
                background: "#e1ecf4",
                color: "#39739d",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e3e6e8",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#2f3337",
            fontSize: "18px",
          }}
        >
          📊 {t("communityStats")}
        </h3>

        <p>
          <strong>{t("questions")}:</strong> {t("Live Count")}
        </p>
        <p>
          <strong>{t("answers")}:</strong> {t("Live Count")}
        </p>
        <p>
          <strong>{t("users")}:</strong> {t("Registered Members")}
        </p>
      </div>
    </aside>
  );
}

export default RightSidebar;