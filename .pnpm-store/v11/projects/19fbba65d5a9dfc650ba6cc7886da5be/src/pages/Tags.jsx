import { useEffect, useState } from "react";
import axios from "axios";

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get("http://localhost:5000/questions");
        // Extract all unique tags from questions
        const allTags = response.data.flatMap(q => q.tags || []);
        const tagCount = {};
        
        allTags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });

        const sortedTags = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }));

        setTags(sortedTags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>Loading tags...</h2>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <h1>Tags</h1>
      <p>Showing {tags.length} tags</p>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "20px" }}>
        {tags.map((tag, index) => (
          <div
            key={index}
            style={{
              padding: "10px 16px",
              background: "#f8f9fa",
              borderRadius: "5px",
              border: "1px solid #ddd",
              minWidth: "100px",
              textAlign: "center"
            }}
          >
            <span style={{
              padding: "4px 10px",
              background: "#e1ecf4",
              color: "#39739d",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "bold"
            }}>
              {tag.name}
            </span>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#6b6b6b" }}>
              {tag.count} question{tag.count > 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tags;