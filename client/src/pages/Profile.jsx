import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchUserById } from "../api";

function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data } = await fetchUserById(id);
      setUser(data);
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return <h2 style={{ padding: 40 }}>Loading...</h2>;
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: 30,
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 30,
          textAlign: "center",
        }}
      >
        <img
          src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff&size=128`}
          alt="avatar"
          style={{
            borderRadius: "50%",
            width: 120,
            height: 120,
          }}
        />

        <h1>{user.name}</h1>

        <p>{user.email}</p>

        <hr />

        <h3>About</h3>

        <p>{user.about || "No bio added yet."}</p>

        <h3>Skills</h3>

        {user.tags?.length ? (
          user.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#0d6efd",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 20,
                marginRight: 10,
              }}
            >
              {tag}
            </span>
          ))
        ) : (
          <p>No skills added.</p>
        )}

        <hr />

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <div>
            <h2>{user.followers?.length || 0}</h2>
            <p>Followers</p>
          </div>

          <div>
            <h2>{user.following?.length || 0}</h2>
            <p>Following</p>
          </div>
        </div>

        <hr />

        <p>
          Joined on{" "}
          {new Date(user.joinedOn).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default Profile;