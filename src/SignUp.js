import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider, microsoftProvider, githubProvider } from './FirebaseConfig'; // Ensure this path is correct
import { useNavigate, Link } from 'react-router-dom'; // Import Link here
import './SignUp.css'; // Import the CSS file

const SignUp = () => {
  const navigate = useNavigate(); // Initialize navigate

  const handleSignIn = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log(user);
      // Navigate to the dashboard or any other page after successful sign-in
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing in:', error.message);
    }
  };

  return (
    <div className="wrapper">
      <div className="box">
        <div className="site-name">SynCodeX</div>
        <div className="signin-text">Sign In With</div>
        <div className="auth-buttons">
          <button className="btn github-btn" onClick={() => handleSignIn(githubProvider)}>
            <img src="https://img.icons8.com/?size=100&id=12599&format=png&color=000000" alt="GitHub Logo" />
            <span className="tooltip">GitHub</span>
          </button>
          <button className="btn google-btn" onClick={() => handleSignIn(googleProvider)}>
            <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google Logo" />
            <span className="tooltip">Google</span>
          </button>
          <button className="btn facebook-btn" onClick={() => handleSignIn(facebookProvider)}>
            <img src="https://img.icons8.com/?size=100&id=uLWV5A9vXIPu&format=png&color=000000" alt="Facebook Logo" />
            <span className="tooltip">Facebook</span>
          </button>
          <button className="btn microsoft-btn" onClick={() => handleSignIn(microsoftProvider)}>
            <img src="https://img.icons8.com/?size=100&id=22989&format=png&color=000000" alt="Microsoft Logo" />
            <span className="tooltip">Microsoft</span>
          </button>
        </div>
        <div className="back-to-login">
          <Link to="/"></Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
