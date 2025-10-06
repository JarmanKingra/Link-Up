import React, { useState } from "react";
import styles from "./auth.module.css";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

export default function Authentication() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState();
  const [message, setMessage] = useState();

  const [formState, setFormState] = useState(0);

  const [open, setOpen] = useState(false);

  const { handleRegister, handleLogin } = useContext(AuthContext);
  let handleAuth = async () => {
    try {
      if (formState === 1) {
        let result = await handleLogin(username, password);
      }
      if (formState === 0) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setUsername("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      console.log(err);
      const message =
        err?.response?.data?.message ?? err.message ?? "Something went wrong";
      setError(message);

      setError(message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome Back 👋</h2>
        <div className={styles.authOptions}>
          <div
            role="button"
            className={styles.authOptionsBtn}
            onClick={() => setFormState(1)}
          >
            Login
          </div>
          <div
            role="button"
            className={styles.authOptionsBtn}
            onClick={() => setFormState(0)}
          >
            Signup
          </div>
        </div>
        <form className={styles.form}>
          {formState == 0 && (
            <div className={styles.inputGroup}>
              <label>Name</label>
              <input
                type="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          {/* Username */}
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <p style={{ color: "red" }}>{error}</p>

          {/* Submit */}
          <div className={styles.button} role="button" onClick={handleAuth}>
            {formState === 0 ? "Signup" : "Login"}
          </div>
        </form>
      </div>
    </div>
  );
}
