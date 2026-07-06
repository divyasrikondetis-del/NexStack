import { useEffect, useState } from "react";
import { fetchUsers } from "../api";

function User() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const { data } = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.log(error);
      }
    };

    getUsers();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h2>All Users</h2>

      {users.map((user) => (
        <div
          key={user._id}
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "15px",
            width: "350px",
          }}
        >
          <p><b>Name:</b> {user.name}</p>
          <p><b>Email:</b> {user.email}</p>
        </div>
      ))}
    </div>
  );
}

export default User;