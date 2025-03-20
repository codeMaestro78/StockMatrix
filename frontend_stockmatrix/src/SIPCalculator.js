import React, { useState, useEffect } from "react";
import "./CSS_SIPCalculator.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SIPCalculator = () => {
  // State variables for input fields
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);
  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  // Calculate SIP returns
  const calculateSIP = () => {
    const monthlyRate = annualReturn / 12 / 100;
    const months = timePeriod * 12;
    const monthlyInflationRate = inflationRate / 12 / 100;

    let futureValue = 0;
    let totalInvestment = 0;
    let yearlyData = [];
    let inflationAdjustedValue = 0;

    // Monthly calculation for accurate results
    for (let i = 1; i <= months; i++) {
      totalInvestment += monthlyInvestment;
      futureValue = (futureValue + monthlyInvestment) * (1 + monthlyRate);

      // Calculate inflation-adjusted value
      const inflationFactor = Math.pow(1 + monthlyInflationRate, i);
      inflationAdjustedValue = futureValue / inflationFactor;

      // Store yearly data for chart
      if (i % 12 === 0) {
        const year = i / 12;
        yearlyData.push({
          year,
          investment: totalInvestment,
          returns: futureValue - totalInvestment,
          totalValue: futureValue,
          inflationAdjustedValue,
        });
      }
    }

    // Calculate wealth gained and absolute return
    const wealthGained = futureValue - totalInvestment;
    const absoluteReturn = (wealthGained / totalInvestment) * 100;

    setResults({
      totalInvestment,
      futureValue,
      wealthGained,
      absoluteReturn,
      inflationAdjustedValue,
      yearlyData,
    });

    // Prepare chart data
    prepareChartData(yearlyData);
    prepareComparisonData(yearlyData);
  };

  // Prepare data for the growth chart
  const prepareChartData = (yearlyData) => {
    const labels = yearlyData.map((data) => `Year ${data.year}`);
    const investmentData = yearlyData.map((data) => data.investment);
    const returnsData = yearlyData.map((data) => data.returns);
    const inflationAdjustedData = yearlyData.map(
      (data) => data.inflationAdjustedValue
    );

    setChartData({
      labels,
      datasets: [
        {
          label: "Total Investment",
          data: investmentData,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "Returns",
          data: returnsData,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Inflation-Adjusted Value",
          data: inflationAdjustedData,
          backgroundColor: "rgba(255, 159, 64, 0.5)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1,
          borderDash: [5, 5],
        },
      ],
    });
  };

  // Prepare data for the comparison chart
  const prepareComparisonData = (yearlyData) => {
    const lastYearData = yearlyData[yearlyData.length - 1];

    setComparisonData({
      labels: ["Investment vs. Returns"],
      datasets: [
        {
          label: "Total Investment",
          data: [lastYearData.investment],
          backgroundColor: "rgba(54, 162, 235, 0.7)",
        },
        {
          label: "Wealth Gained",
          data: [lastYearData.returns],
          backgroundColor: "rgba(75, 192, 192, 0.7)",
        },
        {
          label: "Inflation-Adjusted Value",
          data: [lastYearData.inflationAdjustedValue],
          backgroundColor: "rgba(255, 159, 64, 0.7)",
        },
      ],
    });
  };

  // Calculate on initial render and when inputs change
  useEffect(() => {
    calculateSIP();
  }, [monthlyInvestment, annualReturn, timePeriod, inflationRate]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lac`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)}K`;
    } else {
      return `₹${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="sip-calculator-container">
      <h1 className="calculator-title">SIP Calculator</h1>
      <p className="calculator-description">
        Calculate the potential returns on your Systematic Investment Plan (SIP)
        with our easy-to-use calculator.
      </p>

      <div className="calculator-grid">
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="monthlyInvestment">Monthly Investment (₹)</label>
            <input
              type="number"
              id="monthlyInvestment"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              min="100"
              max="1000000"
            />
            <input
              type="range"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              min="100"
              max="100000"
              step="100"
              className="slider"
            />
          </div>

          <div className="input-group">
            <label htmlFor="annualReturn">Expected Annual Return (%)</label>
            <input
              type="number"
              id="annualReturn"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              min="1"
              max="30"
              step="0.1"
            />
            <input
              type="range"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              min="1"
              max="30"
              step="0.5"
              className="slider"
            />
          </div>

          <div className="input-group">
            <label htmlFor="timePeriod">Time Period (Years)</label>
            <input
              type="number"
              id="timePeriod"
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              min="1"
              max="40"
            />
            <input
              type="range"
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              min="1"
              max="40"
              step="1"
              className="slider"
            />
          </div>

          <div className="input-group">
            <label htmlFor="inflationRate">Expected Inflation Rate (%)</label>
            <input
              type="number"
              id="inflationRate"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              min="0"
              max="15"
              step="0.1"
            />
            <input
              type="range"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              min="0"
              max="15"
              step="0.5"
              className="slider"
            />
          </div>
        </div>

        <div className="results-section">
          {results && (
            <>
              <div className="results-summary">
                <div className="result-card">
                  <h3>Total Investment</h3>
                  <div className="result-value">
                    {formatCurrency(results.totalInvestment)}
                  </div>
                </div>
                <div className="result-card highlight">
                  <h3>Future Value</h3>
                  <div className="result-value">
                    {formatCurrency(results.futureValue)}
                  </div>
                </div>
                <div className="result-card">
                  <h3>Wealth Gained</h3>
                  <div className="result-value">
                    {formatCurrency(results.wealthGained)}
                  </div>
                </div>
                <div className="result-card">
                  <h3>Absolute Return</h3>
                  <div className="result-value">
                    {results.absoluteReturn.toFixed(2)}%
                  </div>
                </div>
                <div className="result-card">
                  <h3>Inflation-Adjusted Value</h3>
                  <div className="result-value">
                    {formatCurrency(results.inflationAdjustedValue)}
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <h3>Growth Over Time</h3>
                {chartData && (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              let label = context.dataset.label || "";
                              if (label) {
                                label += ": ";
                              }
                              if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                              }
                              return label;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return formatCurrency(value);
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>

              <div className="chart-container">
                <h3>Investment vs. Returns</h3>
                {comparisonData && (
                  <Bar
                    data={comparisonData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              let label = context.dataset.label || "";
                              if (label) {
                                label += ": ";
                              }
                              if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                              }
                              return label;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return formatCurrency(value);
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="calculator-info">
        <h3>About SIP Calculator</h3>
        <p>
          A Systematic Investment Plan (SIP) allows you to invest a fixed amount
          regularly in mutual funds or other investment vehicles. This
          calculator helps you estimate the potential returns on your SIP
          investments over time.
        </p>
        <h4>How it works:</h4>
        <ul>
          <li>
            <strong>Monthly Investment:</strong> The fixed amount you plan to
            invest each month.
          </li>
          <li>
            <strong>Expected Annual Return:</strong> The estimated annual return
            rate on your investments.
          </li>
          <li>
            <strong>Time Period:</strong> The duration for which you plan to
            continue your SIP.
          </li>
          <li>
            <strong>Inflation Rate:</strong> The expected average inflation rate
            over your investment period.
          </li>
        </ul>
        <p>
          <strong>Note:</strong> This calculator provides estimates based on the
          inputs provided. Actual returns may vary based on market conditions
          and other factors.
        </p>
      </div>
    </div>
  );
};

export default SIPCalculator;
