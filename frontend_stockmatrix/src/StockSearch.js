import React, { useState } from "react";
import "./CSS_StockSearch.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockSearch = () => {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a stock symbol");
      return;
    }

    setLoading(true);
    setError(null);
    setStockData(null);

    try {
      const symbol = searchTerm.trim();
      console.log("Searching for symbol:", symbol);

      // Make sure this is a POST request with the correct Content-Type
      const response = await fetch("http://127.0.0.1:8000/api/get-stock/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.error ||
              `Error: ${response.status} ${response.statusText}`
          );
        } catch (e) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log("Stock data received:", data);

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No data received from the server");
      }

      setStockData(data);
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message || "An error occurred while fetching stock data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!searchTerm.trim()) {
      setError("Please enter a stock symbol before downloading data");
      return;
    }

    setLoading(true);
    try {
      const symbol = searchTerm.trim();

      // Create a form and submit it to trigger the file download
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "http://127.0.0.1:8000/api/get-stock/";

      // Add necessary fields
      const symbolField = document.createElement("input");
      symbolField.type = "hidden";
      symbolField.name = "symbol";
      symbolField.value = symbol;
      form.appendChild(symbolField);

      const formatField = document.createElement("input");
      formatField.type = "hidden";
      formatField.name = "format";
      formatField.value = format;
      form.appendChild(formatField);

      // Add CSRF token if needed (adjust as per your Django setup)
      // const csrfField = document.createElement('input');
      // csrfField.type = 'hidden';
      // csrfField.name = 'csrfmiddlewaretoken';
      // csrfField.value = getCookie('csrftoken');
      // form.appendChild(csrfField);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error("Download error:", error);
      setError(
        `Failed to download ${format.toUpperCase()} file: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="stock-search-container">
      <h1 className="app-title">Stock Market Analysis</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="Enter stock symbol (e.g., AAPL, RELIANCE)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="stock-input"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? "Searching..." : "Search Stock"}
        </button>
      </div>

      <div className="download-section">
        <button
          onClick={() => handleDownload("csv")}
          disabled={loading}
          className="download-button"
        >
          Download CSV
        </button>
        <button
          onClick={() => handleDownload("excel")}
          disabled={loading}
          className="download-button"
        >
          Download Excel
        </button>
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading stock data...</p>
        </div>
      )}

      {stockData && <StockDetails data={stockData} />}
    </div>
  );
};

const StockDetails = ({ data }) => {
  if (!data) {
    console.log("No data provided to StockDetails component");
    return null;
  }

  console.log("Rendering StockDetails with data:", data); // Debug log

  // Ensure all required properties exist
  const details = data.details || {};
  const stock = data.stock || {};
  const financials = data.financials || {};
  const analystOpinions = data.analystOpinions || {};
  const technicalIndicators = data.technicalIndicators || {};
  const graph = data.graph || "";
  const analysis = data.analysis || "";
  const forecast = data.forecast || {
    futurePrices: [],
    forecastDates: [],
    averageForecast: 0,
    percentageChange: 0,
  };
  const sentimentAnalysis = data.sentimentAnalysis || {
    averageSentiment: 0,
    headlines: [],
  };

  // Helper function to format numbers in INR
  const formatNumber = (number) => {
    if (number === "N/A" || number === null || number === undefined) {
      return "N/A";
    }

    if (typeof number !== "number") {
      return number.toString();
    }

    // Format large numbers with appropriate suffixes
    if (number >= 1000000000) {
      return `₹${(number / 1000000000).toFixed(2)}B`;
    } else if (number >= 1000000) {
      return `₹${(number / 1000000).toFixed(2)}M`;
    } else if (number >= 1000) {
      return `₹${(number / 1000).toFixed(2)}K`;
    } else {
      return `₹${number.toFixed(2)}`;
    }
  };

  // Helper function to format percentages
  const formatPercentage = (value) => {
    if (value === "N/A" || value === null || value === undefined) {
      return "N/A";
    }

    if (typeof value !== "number") {
      return value.toString();
    }

    return `${(value * 100).toFixed(2)}%`;
  };

  // Helper function to determine color based on sentiment
  const getSentimentColor = (score) => {
    if (score > 0.3) return "positive";
    if (score < -0.3) return "negative";
    return "neutral";
  };

  // Forecast chart data
  const forecastChartData = {
    labels: forecast.forecastDates,
    datasets: [
      {
        label: "Price Forecast",
        data: forecast.futurePrices,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  };

  const forecastOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "30-Day Price Forecast",
      },
    },
  };

  // Function to get class based on value change (positive/negative)
  const getChangeClass = (value) => {
    if (value === "N/A" || value === null || value === undefined) return "";
    return parseFloat(value) >= 0 ? "positive-change" : "negative-change";
  };

  // Indicator health status
  const getRSIStatus = (value) => {
    if (value > 70) return "Overbought";
    if (value < 30) return "Oversold";
    return "Neutral";
  };

  const getMACDStatus = (macd, signal) => {
    if (macd > signal) return "Bullish";
    if (macd < signal) return "Bearish";
    return "Neutral";
  };

  const getMAStatus = (price, ma50, ma200) => {
    if (price > ma50 && ma50 > ma200) return "Strong Uptrend";
    if (price < ma50 && ma50 < ma200) return "Strong Downtrend";
    if (ma50 > ma200) return "Bullish Crossover";
    if (ma50 < ma200) return "Bearish Crossover";
    return "Neutral";
  };

  return (
    <div className="stock-details">
      <div className="stock-header">
        <h1>{details.longName || details.symbol}</h1>
        <div className="stock-price">
          <span className="current-price">
            {formatNumber(stock.currentPrice)}
          </span>
          <span className="previous-close">
            Previous Close: {formatNumber(stock.previousClose)}
          </span>
        </div>
      </div>

      <div className="stock-info-section">
        <div className="company-info">
          <h2>Company Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Symbol:</span>
              <span className="value">{details.symbol || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="label">Industry:</span>
              <span className="value">{details.industry || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="label">Sector:</span>
              <span className="value">{details.sector || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="label">Country:</span>
              <span className="value">{details.country || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="label">Exchange:</span>
              <span className="value">{details.exchange || "N/A"}</span>
            </div>
            {details.website && (
              <div className="info-item">
                <span className="label">Website:</span>
                <span className="value">
                  <a
                    href={details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {details.website}
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Chart */}
      <div className="stock-chart-section">
        <h2>Stock Price Chart</h2>
        <div className="chart-container">
          <img
            src={`data:image/jpeg;base64,${graph}`}
            alt="Stock Price Chart"
            className="stock-chart"
          />
        </div>
      </div>

      <div className="data-section">
        <div className="column">
          <div className="card">
            <h2>Stock Information</h2>
            <table className="data-table">
              <tbody>
                <tr>
                  <td>Open Price:</td>
                  <td>{formatNumber(stock.open)}</td>
                </tr>
                <tr>
                  <td>Close Price:</td>
                  <td>{formatNumber(stock.close)}</td>
                </tr>
                <tr>
                  <td>Current Price:</td>
                  <td>{formatNumber(stock.currentPrice)}</td>
                </tr>
                <tr>
                  <td>Previous Close:</td>
                  <td>{formatNumber(stock.previousClose)}</td>
                </tr>
                <tr>
                  <td>Day Low:</td>
                  <td>{formatNumber(stock.dayLow)}</td>
                </tr>
                <tr>
                  <td>Day High:</td>
                  <td>{formatNumber(stock.dayHigh)}</td>
                </tr>
                <tr>
                  <td>52 Week Low:</td>
                  <td>{formatNumber(stock.fiftyTwoWeekLow)}</td>
                </tr>
                <tr>
                  <td>52 Week High:</td>
                  <td>{formatNumber(stock.fiftyTwoWeekHigh)}</td>
                </tr>
                <tr>
                  <td>Volume:</td>
                  <td>
                    {stock.volume === "N/A"
                      ? "N/A"
                      : stock.volume.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td>Average Volume:</td>
                  <td>
                    {stock.averageVolume === "N/A"
                      ? "N/A"
                      : stock.averageVolume.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td>Market Cap:</td>
                  <td>{formatNumber(stock.marketCap)}</td>
                </tr>
                <tr>
                  <td>Dividend Yield:</td>
                  <td>{formatPercentage(stock.dividendYield)}</td>
                </tr>
                <tr>
                  <td>PE Ratio:</td>
                  <td>{stock.peRatio}</td>
                </tr>
                <tr>
                  <td>Book Value:</td>
                  <td>{stock.bookValue}</td>
                </tr>
                <tr>
                  <td>Face Value:</td>
                  <td>{stock.faceValue}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Financials</h2>
            <table className="data-table">
              <tbody>
                <tr>
                  <td>Revenue:</td>
                  <td>{formatNumber(financials.revenue)}</td>
                </tr>
                <tr>
                  <td>Gross Margins:</td>
                  <td>{formatPercentage(financials.grossMargins)}</td>
                </tr>
                <tr>
                  <td>Operating Margins:</td>
                  <td>{formatPercentage(financials.operatingMargins)}</td>
                </tr>
                <tr>
                  <td>Profit Margins:</td>
                  <td>{formatPercentage(financials.profitMargins)}</td>
                </tr>
                <tr>
                  <td>Net Income:</td>
                  <td>{formatNumber(financials.netIncomeToCommon)}</td>
                </tr>
                <tr>
                  <td>Return on Equity:</td>
                  <td>{formatPercentage(financials.returnOnEquity)}</td>
                </tr>
                <tr>
                  <td>Return on Assets:</td>
                  <td>{formatPercentage(financials.returnOnAssets)}</td>
                </tr>
                <tr>
                  <td>Debt to Equity:</td>
                  <td>{financials.debtToEquity}</td>
                </tr>
                <tr>
                  <td>Current Ratio:</td>
                  <td>{financials.currentRatio}</td>
                </tr>
                <tr>
                  <td>Quick Ratio:</td>
                  <td>{financials.quickRatio}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="column">
          <div className="card">
            <h2>Technical Indicators</h2>
            <table className="data-table">
              <tbody>
                <tr>
                  <td>RSI (14-day):</td>
                  <td>
                    <span
                      className={`indicator-value ${
                        technicalIndicators.RSI > 70
                          ? "overbought"
                          : technicalIndicators.RSI < 30
                          ? "oversold"
                          : "neutral"
                      }`}
                    >
                      {technicalIndicators.RSI.toFixed(2)} (
                      {getRSIStatus(technicalIndicators.RSI)})
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>MA50:</td>
                  <td>{formatNumber(technicalIndicators.MA50)}</td>
                </tr>
                <tr>
                  <td>MA200:</td>
                  <td>{formatNumber(technicalIndicators.MA200)}</td>
                </tr>
                <tr>
                  <td>MACD:</td>
                  <td>
                    <span
                      className={`indicator-value ${
                        technicalIndicators.MACD >
                        technicalIndicators.SignalLine
                          ? "positive-change"
                          : "negative-change"
                      }`}
                    >
                      {technicalIndicators.MACD.toFixed(2)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Signal Line:</td>
                  <td>{technicalIndicators.SignalLine.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>MA Status:</td>
                  <td>
                    <span
                      className={`indicator-value ${
                        getMAStatus(
                          stock.currentPrice,
                          technicalIndicators.MA50,
                          technicalIndicators.MA200
                        ).includes("Uptrend")
                          ? "positive-change"
                          : getMAStatus(
                              stock.currentPrice,
                              technicalIndicators.MA50,
                              technicalIndicators.MA200
                            ).includes("Downtrend")
                          ? "negative-change"
                          : ""
                      }`}
                    >
                      {getMAStatus(
                        stock.currentPrice,
                        technicalIndicators.MA50,
                        technicalIndicators.MA200
                      )}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>MACD Signal:</td>
                  <td>
                    <span
                      className={`indicator-value ${
                        getMACDStatus(
                          technicalIndicators.MACD,
                          technicalIndicators.SignalLine
                        ) === "Bullish"
                          ? "positive-change"
                          : getMACDStatus(
                              technicalIndicators.MACD,
                              technicalIndicators.SignalLine
                            ) === "Bearish"
                          ? "negative-change"
                          : ""
                      }`}
                    >
                      {getMACDStatus(
                        technicalIndicators.MACD,
                        technicalIndicators.SignalLine
                      )}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Analyst Opinions</h2>
            <table className="data-table">
              <tbody>
                <tr>
                  <td>Target Mean Price:</td>
                  <td>{formatNumber(analystOpinions.targetMeanPrice)}</td>
                </tr>
                <tr>
                  <td>Target High Price:</td>
                  <td>{formatNumber(analystOpinions.targetHighPrice)}</td>
                </tr>
                <tr>
                  <td>Target Low Price:</td>
                  <td>{formatNumber(analystOpinions.targetLowPrice)}</td>
                </tr>
                <tr>
                  <td>Recommendation:</td>
                  <td className="recommendation">
                    <span
                      className={`recommendation-${analystOpinions.recommendationKey}`}
                    >
                      {analystOpinions.recommendationKey === "N/A"
                        ? "N/A"
                        : analystOpinions.recommendationKey
                            .charAt(0)
                            .toUpperCase() +
                          analystOpinions.recommendationKey.slice(1)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Number of Analysts:</td>
                  <td>{analystOpinions.numberOfAnalystOpinions}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="analysis-section">
        <h2>Expert Analysis</h2>
        <div className="analysis-content">
          <p
            dangerouslySetInnerHTML={{
              __html: analysis.replace(/\n/g, "<br/>"),
            }}
          ></p>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="forecast-section">
        <h2>Price Forecast (Next 30 Days)</h2>
        <div className="forecast-summary">
          <div
            className={`forecast-change ${
              forecast.percentageChange >= 0
                ? "positive-change"
                : "negative-change"
            }`}
          >
            {forecast.percentageChange >= 0 ? "+" : ""}
            {forecast.percentageChange.toFixed(2)}% Forecasted Change
          </div>
          <div className="forecast-price">
            Average Forecast: {formatNumber(forecast.averageForecast)}
          </div>
        </div>
        <div className="forecast-chart">
          <Line data={forecastChartData} options={forecastOptions} />
        </div>
      </div>

      {/* Sentiment Analysis Section */}
      <div className="sentiment-section">
        <h2>News Sentiment Analysis</h2>
        <div
          className={`sentiment-summary ${getSentimentColor(
            sentimentAnalysis.averageSentiment
          )}`}
        >
          <div className="sentiment-score">
            Sentiment Score: {sentimentAnalysis.averageSentiment.toFixed(2)}
            <span className="sentiment-label">
              (
              {sentimentAnalysis.averageSentiment > 0.3
                ? "Positive"
                : sentimentAnalysis.averageSentiment < -0.3
                ? "Negative"
                : "Neutral"}
              )
            </span>
          </div>
        </div>
        <div className="news-headlines">
          <h3>Related Headlines</h3>
          <ul className="headlines-list">
            {sentimentAnalysis.headlines.map((news, index) => (
              <li key={index} className="headline-item">
                <div className="headline-title">{news.title}</div>
                <div className="headline-source">Source: {news.source}</div>
                {news.link && (
                  <div className="headline-link">
                    <a
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read More
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StockSearch;
