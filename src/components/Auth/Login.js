import React from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import styles from "./Login.module.css"; // Import the CSS Module

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  // Provider Setup
  const googleProvider = new GoogleAuthProvider();
  const githubProvider = new GithubAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const microsoftProvider = new OAuthProvider("microsoft.com");

  // Generic Sign-In Function
  const handleSignIn = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard"); // Redirect to Dashboard after login
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Login to SynCodeX</h1>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={() => handleSignIn(googleProvider)}>
          <img className={styles.logo} src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Google_Logo.svg" alt="Google Logo" />
        </button>
        <button className={styles.button} onClick={() => handleSignIn(githubProvider)}>
          <img className={styles.logo} src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" />
        </button>
        <button className={styles.button} onClick={() => handleSignIn(facebookProvider)}>
          <img className={styles.logo} src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt=" Facebook Logo" />
        </button>
        <button className={styles.button} onClick={() => handleSignIn(microsoftProvider)}>
          <img className={styles.logo} src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Microsoft_logo.svg" alt="Microsoft Logo" />
        </button>
      </div>
    </div>
  );
};

export default Login;