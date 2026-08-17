function RightSidebar() {
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
          📢 The Overflow Blog
        </h3>

        <ul
          style={{
            paddingLeft: "18px",
            color: "#555",
            lineHeight: "1.8",
          }}
        >
          <li>🚀 Welcome to NexStack</li>
          <li>💡 Tips for asking better programming questions</li>
          <li>🔥 Learn MERN Stack through real projects</li>
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
          📌 Featured on Meta
        </h3>

        <ul
          style={{
            paddingLeft: "18px",
            color: "#555",
            lineHeight: "1.8",
          }}
        >
          <li>Ask clear and detailed questions.</li>
          <li>Help other developers by answering.</li>
          <li>Vote for useful questions and answers.</li>
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
          🏷️ Hot Tags
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
          📊 Community Stats
        </h3>

        <p><strong>Questions:</strong> Live Count</p>
        <p><strong>Answers:</strong> Live Count</p>
        <p><strong>Users:</strong> Registered Members</p>
      </div>
    </aside>
  );
}

export default RightSidebar;