import React, { useState } from 'react';
import './CSS_Calculator.css'; // Import the CSS file for styling

const SIPCalculator = () => {
  const [investmentType, setInvestmentType] = useState('monthly');
  const [monthlyInvestment, setMonthlyInvestment] = useState('');
  const [oneTimeInvestment, setOneTimeInvestment] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [duration, setDuration] = useState('');
  const [futureValue, setFutureValue] = useState(null);
  const [investmentValue, setInvestmentValue] = useState(null);
  const [totalReturns, setTotalReturns] = useState(null);

  const calculateMonthlySIPFutureValue = (P, r, n) => {
    const i = r / 100 / 12; // Monthly interest rate
    const fv = P * (((1 + i) ** n - 1) * (1 + i)) / i;
    const v_i = P * n;
    return [fv, v_i];
  };

  const calculateOneTimeFutureValue = (P, r, n) => {
    const i = r / 100 / 12; // Monthly interest rate
    const fv = P * (1 + i) ** n;
    const v_i = P;
    return [fv, v_i];
  };

  const formatFutureValue = (value) => {
    if (value >= 1e7) {
      return `${(value / 1e7).toFixed(2)} Cr`; // Crores
    } else if (value >= 1e5) {
      return `${(value / 1e5).toFixed(2)} Lakhs`; // Lakhs
    } else {
      return `₹${value.toFixed(2)}`; // Less than 1 Lakh
    }
  };

  const calculateTotalReturn = (fv, v_i) => {
    return fv - v_i;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let fv, v_i;
    if (investmentType === 'monthly') {
      [fv, v_i] = calculateMonthlySIPFutureValue(
        parseFloat(monthlyInvestment),
        parseFloat(expectedReturn),
        parseInt(duration)
      );
    } else if (investmentType === 'one-time') {
      [fv, v_i] = calculateOneTimeFutureValue(
        parseFloat(oneTimeInvestment),
        parseFloat(expectedReturn),
        parseInt(duration)
      );
    }

    setFutureValue(fv);
    setInvestmentValue(v_i);
    setTotalReturns(calculateTotalReturn(fv, v_i));
  };

  return (
    <div className="calculator-container">
      <h2 className="calculator-title">Mutual Fund SIP Calculator</h2>
      <form onSubmit={handleSubmit} className="calculator-form">
        <div className="form-group">
          <label>Select Investment Type:</label>
          <select
            value={investmentType}
            onChange={(e) => setInvestmentType(e.target.value)}
            required
          >
            <option value="monthly">Monthly Investment</option>
            <option value="one-time">One-Time Investment(LumSum)</option>
          </select>
        </div>

        {investmentType === 'monthly' && (
          <div className="form-group">
            <label>Monthly Investment (P):</label>
            <input
              type="number"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(e.target.value)}
              required
            />
          </div>
        )}

        {investmentType === 'one-time' && (
          <div className="form-group">
            <label>One-Time Investment (P):</label>
            <input
              type="number"
              value={oneTimeInvestment}
              onChange={(e) => setOneTimeInvestment(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Expected Annual Return (r in %):</label>
          <input
            type="number"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Investment Duration (n in months):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="calculate-button">
          Calculate
        </button>
      </form>

      {investmentValue !== null && (
        <div className="result">
          <h3>Invested Value (V_I): {formatFutureValue(investmentValue)}</h3>
        </div>
      )}
      {futureValue !== null && (
        <div className="result">
          <h3>Future Value (FV): {formatFutureValue(futureValue)}</h3>
        </div>
      )}
      {totalReturns !== null && (
        <div className="result">
          <h3>Total Returns: {formatFutureValue(totalReturns)}</h3>
        </div>
      )}
    </div>
  );
};

export default SIPCalculator;
