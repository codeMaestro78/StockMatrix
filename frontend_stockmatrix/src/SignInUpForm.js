import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import './App.css';

const SignInUpForm = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [redirectToHome, setRedirectToHome] = useState(false); // State to trigger redirection
  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
  };

  const handleSignUp = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required for sign up');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        setFormData({ name: '', email: '', password: '' });
        setError('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error creating user');
    }
  };

  const handleSignIn = async () => {
    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required for sign in');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const result = await response.json();
      if (response.ok) {
        setRedirectToHome(true); 
        setFormData({ email: '', password: '' });
        setError('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error signing in');
    }
  };

  if (redirectToHome) {
    return <Navigate to="/Home" />; // Redirect to home page
  }

  return (
    <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
      <div className="form-container sign-up-container">
        <form action="#" onSubmit={(e) => e.preventDefault()}>
          <h1>Create Account</h1>
          <div className="social-container">
           <a href="https://www.facebook.com" className="social" target="_blank" rel="noopener noreferrer">
  <i className="fab fa-facebook-f"></i>
</a>
<a href="https://plus.google.com" className="social" target="_blank" rel="noopener noreferrer">
  <i className="fab fa-google-plus-g"></i>
</a>
<a href="https://www.linkedin.com" className="social" target="_blank" rel="noopener noreferrer">
  <i className="fab fa-linkedin-in"></i>
</a>

          </div>
          <span>or use your email for registration</span>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" />
          <button type="button" onClick={handleSignUp}>Sign Up</button>
          {error && <p>{error}</p>}
        </form>
      </div>
      <div className="form-container sign-in-container">
        <form action="#" onSubmit={(e) => e.preventDefault()}>
          <h1>Sign in</h1>
          <div className="social-container">
             <a href="https://www.facebook.com" className="social" target="_blank" rel="noopener noreferrer">
  <i className="fab fa-facebook-f"></i>
</a>
<a href="https://plus.google.com" className="social" target="_blank" rel="noopener noreferrer">
  <i className="fab fa-google-plus-g"></i>
</a>
<a href="https://www.linkedin.com" className="social" target="_blank" rel="noopener noreferrer">
  <i className="fab fa-linkedin-in"></i>
</a>

          </div>
          <span>or use your account</span>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" />
          <a href="#">Forgot your password?</a>
          <button type="button" onClick={handleSignIn}>Sign In</button>
          {error && <p>{error}</p>}
        </form>
      </div>
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome to StockMatrix – Transforming Data Into Financial Insight</h1>
            <p>To keep connected with us please login with your personal info</p>
            <button className="ghost" onClick={handleSignInClick}>Sign In</button>
          </div>
          <div className="overlay-panel overlay-right">
           <h1>Welcome, Clients!</h1>
<p>Share your personal details to begin your journey with us.</p>

            <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInUpForm;
