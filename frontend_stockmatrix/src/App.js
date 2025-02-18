import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInUpForm from './SignInUpForm';
import Home from './Home';
import StockSearch from './StockSearch';
import Mutual_Fund from './Mutual_Fund';
import SIPCalculator from './SIPCalculator';

const App = () => {
  return (
      <Router>
  
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignInUpForm />} />
            <Route path="/stock-search" element={<StockSearch />} />
        <Route path="/mutualfunds" element={<Mutual_Fund />} />
        <Route path="/calculator" element={<SIPCalculator />}/>
          </Routes>
  
      </Router>
  );
};

export default App;
