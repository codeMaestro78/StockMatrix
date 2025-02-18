import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./CSS_Calculator.css";

const SIPCalculator = () => {
  const [investmentType, setInvestmentType] = useState("monthly");
  const [monthlyInvestment, setMonthlyInvestment] = useState("");
  const [oneTimeInvestment, setOneTimeInvestment] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [duration, setDuration] = useState("");
  const [inflationRate, setInflationRate] = useState("");
  const [futureValue, setFutureValue] = useState(null);
  const [investmentValue, setInvestmentValue] = useState(null);
  const [totalReturns, setTotalReturns] = useState(null);
  const [chartData, setChartData] = useState([]);

  const calculateMonthlySIPFutureValue = (P, r, n) => {
    const i = r / 100 / 12;
    const fv = (P * (((1 + i) ** n - 1) * (1 + i))) / i;
    const v_i = P * n;
    return [fv, v_i];
  };

  const calculateOneTimeFutureValue = (P, r, n) => {
    const i = r / 100 / 12;
    const fv = P * (1 + i) ** n;
    const v_i = P;
    return [fv, v_i];
  };

  const formatFutureValue = (value) => {
    if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
    if (value >= 1e5) return `${(value / 1e5).toFixed(2)} Lakhs`;
    return `₹${value.toFixed(2)}`;
  };

  const calculateTotalReturn = (fv, v_i) => fv - v_i;

  const calculateInflationAdjustedReturn = (fv, inflation, n) => {
    const realReturn = fv / (1 + inflation / 100) ** (n / 12);
    return realReturn;
  };

  const generateChartData = (P, r, n) => {
    const i = r / 100 / 12;
    let data = [];
    let fv = 0;
    for (let month = 1; month <= n; month++) {
      if (investmentType === "monthly") {
        fv += P * (1 + i) ** month;
      } else {
        fv = P * (1 + i) ** month;
      }
      data.push({ month, value: fv.toFixed(2) });
    }
    return data;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let fv, v_i;
    if (investmentType === "monthly") {
      [fv, v_i] = calculateMonthlySIPFutureValue(
        parseFloat(monthlyInvestment),
        parseFloat(expectedReturn),
        parseInt(duration)
      );
    } else {
      [fv, v_i] = calculateOneTimeFutureValue(
        parseFloat(oneTimeInvestment),
        parseFloat(expectedReturn),
        parseInt(duration)
      );
    }
    setFutureValue(fv);
    setInvestmentValue(v_i);
    setTotalReturns(calculateTotalReturn(fv, v_i));
    setChartData(
      generateChartData(
        investmentType === "monthly"
          ? parseFloat(monthlyInvestment)
          : parseFloat(oneTimeInvestment),
        parseFloat(expectedReturn),
        parseInt(duration)
      )
    );
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
            <option value="one-time">One-Time Investment</option>
          </select>
        </div>
        {investmentType === "monthly" && (
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
        {investmentType === "one-time" && (
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
          <label>Expected Annual Return (%):</label>
          <input
            type="number"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Investment Duration (months):</label>
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

      {futureValue !== null && (
        <div className="result">
          <h3>Future Value: {formatFutureValue(futureValue)}</h3>
          <h3>Total Returns: {formatFutureValue(totalReturns)}</h3>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="chart-container">
          <h3>Investment Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: "Months", position: "insideBottom" }}
              />
              <YAxis
                label={{
                  value: "Value (₹)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SIPCalculator;
