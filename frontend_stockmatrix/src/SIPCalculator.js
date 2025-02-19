import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import "./CSS_Calculator.css";

const SIPCalculator = () => {
  const [formData, setFormData] = useState({
    investmentType: "monthly",
    monthlyInvestment: "",
    oneTimeInvestment: "",
    expectedReturn: "",
    duration: "",
    inflationRate: "",
    taxRate: "",
    riskLevel: "moderate",
  });

  const [results, setResults] = useState({
    futureValue: null,
    investmentValue: null,
    totalReturns: null,
    inflationAdjustedValue: null,
    taxableAmount: null,
    monthlyWithdrawal: null,
  });

  const [chartData, setChartData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Risk-based return rates
  const riskReturnRates = {
    conservative: { min: 6, max: 8 },
    moderate: { min: 8, max: 12 },
    aggressive: { min: 12, max: 15 },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateMonthlySIP = (P, r, n, inflation, tax) => {
    const i = r / 100 / 12;
    const infl = inflation / 100 / 12;
    const fv = (P * (((1 + i) ** n - 1) * (1 + i))) / i;
    const v_i = P * n;
    const inflationAdjustedValue = fv / (1 + infl) ** n;
    const taxableAmount = (fv - v_i) * (tax / 100);
    const monthlyWithdrawal = fv / (n * 12);

    return {
      futureValue: fv,
      investmentValue: v_i,
      totalReturns: fv - v_i,
      inflationAdjustedValue,
      taxableAmount,
      monthlyWithdrawal,
    };
  };

  const calculateOneTime = (P, r, n, inflation, tax) => {
    const i = r / 100 / 12;
    const infl = inflation / 100 / 12;
    const fv = P * (1 + i) ** (n * 12);
    const inflationAdjustedValue = fv / (1 + infl) ** n;
    const taxableAmount = (fv - P) * (tax / 100);
    const monthlyWithdrawal = fv / (n * 12);

    return {
      futureValue: fv,
      investmentValue: P,
      totalReturns: fv - P,
      inflationAdjustedValue,
      taxableAmount,
      monthlyWithdrawal,
    };
  };

  const generateDetailedChartData = (P, r, n, inflation) => {
    const i = r / 100 / 12;
    const infl = inflation / 100 / 12;
    let data = [];
    let fv = 0;
    let investedAmount = 0;

    for (let month = 1; month <= n; month++) {
      if (formData.investmentType === "monthly") {
        investedAmount += P;
        fv += P * (1 + i) ** month;
      } else {
        investedAmount = P;
        fv = P * (1 + i) ** month;
      }

      const inflationAdjustedValue = fv / (1 + infl) ** month;

      data.push({
        month,
        projectedValue: parseFloat(fv.toFixed(2)),
        investedAmount: parseFloat(investedAmount.toFixed(2)),
        inflationAdjustedValue: parseFloat(inflationAdjustedValue.toFixed(2)),
      });
    }
    return data;
  };

  const generateComparisonData = () => {
    const conservative = calculateMonthlySIP(
      parseFloat(formData.monthlyInvestment || formData.oneTimeInvestment),
      riskReturnRates.conservative.max,
      parseInt(formData.duration),
      parseFloat(formData.inflationRate),
      parseFloat(formData.taxRate)
    ).futureValue;

    const aggressive = calculateMonthlySIP(
      parseFloat(formData.monthlyInvestment || formData.oneTimeInvestment),
      riskReturnRates.aggressive.max,
      parseInt(formData.duration),
      parseFloat(formData.inflationRate),
      parseFloat(formData.taxRate)
    ).futureValue;

    return [
      { name: "Conservative", value: conservative },
      { name: "Current Plan", value: results.futureValue },
      { name: "Aggressive", value: aggressive },
    ];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const {
      investmentType,
      monthlyInvestment,
      oneTimeInvestment,
      expectedReturn,
      duration,
      inflationRate,
      taxRate,
    } = formData;

    const calculationResults =
      investmentType === "monthly"
        ? calculateMonthlySIP(
            parseFloat(monthlyInvestment),
            parseFloat(expectedReturn),
            parseInt(duration),
            parseFloat(inflationRate),
            parseFloat(taxRate)
          )
        : calculateOneTime(
            parseFloat(oneTimeInvestment),
            parseFloat(expectedReturn),
            parseInt(duration),
            parseFloat(inflationRate),
            parseFloat(taxRate)
          );

    setResults(calculationResults);
    setChartData(
      generateDetailedChartData(
        parseFloat(monthlyInvestment || oneTimeInvestment),
        parseFloat(expectedReturn),
        parseInt(duration),
        parseFloat(inflationRate)
      )
    );
    setComparisonData(generateComparisonData());
  };

  return (
    <div className="calculator-container">
      <h2 className="calculator-title">Advanced SIP Calculator</h2>

      <form onSubmit={handleSubmit} className="calculator-form">
        {/* Basic Options */}
        <div className="form-section">
          <h3>Basic Options</h3>
          <div className="form-group">
            <label>Investment Type:</label>
            <select
              name="investmentType"
              value={formData.investmentType}
              onChange={handleInputChange}
            >
              <option value="monthly">Monthly SIP</option>
              <option value="one-time">One-Time Investment</option>
            </select>
          </div>

          {formData.investmentType === "monthly" ? (
            <div className="form-group">
              <label>Monthly Investment (₹):</label>
              <input
                type="number"
                name="monthlyInvestment"
                value={formData.monthlyInvestment}
                onChange={handleInputChange}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>One-Time Investment (₹):</label>
              <input
                type="number"
                name="oneTimeInvestment"
                value={formData.oneTimeInvestment}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="form-section">
          <h3>
            Advanced Options
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="toggle-button"
            >
              {showAdvancedOptions ? "Hide" : "Show"}
            </button>
          </h3>

          {showAdvancedOptions && (
            <>
              <div className="form-group">
                <label>Risk Level:</label>
                <select
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleInputChange}
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div className="form-group">
                <label>Inflation Rate (%):</label>
                <input
                  type="number"
                  name="inflationRate"
                  value={formData.inflationRate}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Tax Rate (%):</label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
            </>
          )}
        </div>

        <button type="submit" className="calculate-button">
          Calculate
        </button>
      </form>

      {results.futureValue && (
        <div className="results-container">
          <div className="results-grid">
            <div className="result-item">
              <h4>Future Value</h4>
              <p>₹{results.futureValue.toFixed(2)}</p>
            </div>
            <div className="result-item">
              <h4>Total Investment</h4>
              <p>₹{results.investmentValue.toFixed(2)}</p>
            </div>
            <div className="result-item">
              <h4>Total Returns</h4>
              <p>₹{results.totalReturns.toFixed(2)}</p>
            </div>
            <div className="result-item">
              <h4>Inflation Adjusted Value</h4>
              <p>₹{results.inflationAdjustedValue.toFixed(2)}</p>
            </div>
            <div className="result-item">
              <h4>Tax Payable</h4>
              <p>₹{results.taxableAmount.toFixed(2)}</p>
            </div>
            <div className="result-item">
              <h4>Monthly Withdrawal</h4>
              <p>₹{results.monthlyWithdrawal.toFixed(2)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-container">
            <div className="chart-wrapper">
              <h3>Investment Growth Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="projectedValue"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Projected Value"
                  />
                  <Area
                    type="monotone"
                    dataKey="investedAmount"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Invested Amount"
                  />
                  <Area
                    type="monotone"
                    dataKey="inflationAdjustedValue"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="Inflation Adjusted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-wrapper">
              <h3>Investment Strategy Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SIPCalculator;
