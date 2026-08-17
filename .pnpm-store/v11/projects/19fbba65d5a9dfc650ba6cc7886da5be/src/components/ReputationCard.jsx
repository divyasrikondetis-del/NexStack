import React from "react";

function ReputationCard({ reputation = 0 }) {
  const getBadge = () => {
    if (reputation >= 1000)
      return {
        name: "Diamond Member",
        emoji: "💎",
        color: "#00BCD4",
      };

    if (reputation >= 500)
      return {
        name: "Gold Member",
        emoji: "🥇",
        color: "#FFD700",
      };

    if (reputation >= 100)
      return {
        name: "Silver Member",
        emoji: "🥈",
        color: "#9E9E9E",
      };

    return {
      name: "Bronze Member",
      emoji: "🥉",
      color: "#CD7F32",
    };
  };

  const badge = getBadge();

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        margin: "20px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      <h2>⭐ Reputation</h2>

      <h1
        style={{
          margin: "10px 0",
          color: "#0A95FF",
        }}
      >
        {reputation}
      </h1>

      <div
        style={{
          display: "inline-block",
          background: badge.color,
          color: "#fff",
          padding: "8px 18px",
          borderRadius: 30,
          fontWeight: "bold",
        }}
      >
        {badge.emoji} {badge.name}
      </div>
    </div>
  );
}

export default ReputationCard;