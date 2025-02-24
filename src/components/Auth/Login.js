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
import styles from "./Login.module.css"; 

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
          <img className={styles.logo} src="assets/logo/google.png" alt="Google Logo" />
        </button>
        <button className={styles.button} onClick={() => handleSignIn(githubProvider)}>
          <img className={styles.logo} src="assets/logo/github.png" alt="GitHub Logo" />
        </button>
        <button className={styles.button} onClick={() => handleSignIn(facebookProvider)}>
          <img className={styles.logo} src="assets/logo/facebook.png" alt="Facebook Logo" />
        </button>
        <button className={styles.button} onClick={() => handleSignIn(microsoftProvider)}>
          <img className={styles.logo} src="assets/logo/microsoft.png" alt="Microsoft Logo" />
        </button>
      </div>
    </div>
  );
};

export default Login;