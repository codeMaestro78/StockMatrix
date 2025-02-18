import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import StockSearch from './StockSearch';
import logo from '../src/Stockmatrix.png';

function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const handleLoginClick = () => {
    navigate('/signin');
  };

  const handleMutualFundsClick = () => {
    window.open('/mutualfunds', '_blank'); // Open Mutual Funds in a new tab
  };

  const handleMutualFundsCalculatorClick = () => {
    navigate('/calculator'); // Navigate to the MutualFunds Calculator page
  };

  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="navbar-left">
          <a href="#" className="brand">
            <img src={logo} alt="StockMatrix Logo" className="logo-img" />
          </a>
          <a href="#">HOME</a>
          <a href="#">SCREENS</a>
          <div className="dropdown">
            <a href="#" className="dropbtn">TOOLS</a>
            <div className="dropdown-content">
              <a href="#" onClick={handleMutualFundsClick}>Mutual Funds</a> 
              <a href="#" onClick={handleMutualFundsCalculatorClick}>SIP Calculator</a>
            </div>
          </div>
        </div>
        <div className={`navbar-right ${isOpen ? 'open' : ''}`}>
          <button className="login-btn" onClick={handleLoginClick}>LOGIN</button>
        </div>
        <div className='dropdown'>
          <a href='#' className='dropbtn'>MORE</a>
          
          <div className='dropdown-content'>
            <a href='#'></a>
          </div>
        </div>
        <div className="hamburger" onClick={toggleNavbar}>
          <div className={`line ${isOpen ? 'open' : ''}`}></div>
          <div className={`line ${isOpen ? 'open' : ''}`}></div>
          <div className={`line ${isOpen ? 'open' : ''}`}></div>
        </div>
      </nav>

      <div className="hero-section">
        <h1 className="hero-logo">Welcome To StockMatrix</h1>
        <p className="hero-subtitle">Stock analysis and screening tool for investors of India</p>
        <div className="stock-search-section">
          <StockSearch />
        </div>
      </div>
    </div>
  );
}

export default Home;
