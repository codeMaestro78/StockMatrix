import React, { useState } from 'react';
import './CSS_StockSearch.css'; 
import { Oval } from 'react-loader-spinner';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StockSearch = () => {

  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);


  

  const handleSearch = async () => { 
    setLoading(true);
    setError(null);
    setStockData(null); // Clear previous data before new search

    try {
      const symbol = searchTerm.endsWith('.NS') || searchTerm.endsWith('.BO') ? searchTerm : `${searchTerm}.NS`;
      const response = await fetch('http://127.0.0.1:8000/api/get-stock/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      setStockData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    try {
      const symbol = searchTerm.endsWith('.NS') || searchTerm.endsWith('.BO') ? searchTerm : `${searchTerm}.NS`;
      const response = await fetch('http://127.0.0.1:8000/api/get-stock/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, format }),  // Ensure format matches server expectations
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}_historical_data.${format}`;  // Ensure extension matches format
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      setError(error.message);
    }
  };
 const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="stock-search-container">
      <input
        type="text"
        placeholder="Enter stock symbol (e.g., AAPL, RELIANCE)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        className="stock-input"
      />
      <button onClick={handleSearch} disabled={loading} className="search-button">
        {loading ? 'Searching...' : 'Search Stock'}
      </button> <br/>
      <button onClick={() => handleDownload('csv')} disabled={loading} className="download-button">
        Download CSV
      </button>
      {error && <div className="error">Error: {error}</div>}
      {loading && (
        <div className="spinner-container">
          <Oval height={80} width={80} color="#4fa94d" visible={true} />
        </div>
      )}
      {stockData && <StockDetails data={stockData} />}
    </div>
  );
};

const StockDetails = ({ data }) => {
  if (!data) return null;

  const { details, graph, analysis,  forecast, sentimentAnalysis } = data;
  const company = details;

  // Helper function to format numbers in INR
  const formatNumber = (number) => {
    return typeof number === 'number' ? `₹${number.toFixed(2)}` : 'N/A';
  };

  
  return (
    <div className="stock-details">
      <h1>{company.longName || 'N/A'}</h1>
      <div className="stock-info-company">
        <p><strong>Symbol:</strong> {company.symbol || 'N/A'}</p>
        <p><strong>Industry:</strong> {company.industry || 'N/A'}</p>
        <p><strong>Sector:</strong> {company.sector || 'N/A'}</p>
      </div>

      <h2 className="stock-info-heading">Stock Information</h2>
      <table className="stock-info-table">
        <tbody>
          <tr>
            <td>Open Price:</td>
            <td>{formatNumber(data.stock.open)}</td>
          </tr>
          <tr>
            <td>Close Price:</td>
            <td>{formatNumber(data.stock.close)}</td>
          </tr>
          <tr>
            <td>Current Price:</td>
            <td>{formatNumber(data.stock.currentPrice)}</td>
          </tr>
          <tr>
            <td>Previous Close:</td>
            <td>{formatNumber(data.stock.previousClose)}</td>
          </tr>
          <tr>
            <td>Day Low:</td>
            <td>{formatNumber(data.stock.dayLow)}</td>
          </tr>
          <tr>
            <td>Day High:</td>
            <td>{formatNumber(data.stock.dayHigh)}</td>
          </tr>
          <tr>
            <td>Market Cap:</td>
            <td>{formatNumber(data.stock.marketCap)}</td>
          </tr>
          <tr>
    <td>P/E Ratio:</td>
  <td>{data.stock.peRatio !== 'N/A' ? data.stock.peRatio.toFixed(2) : 'N/A'}</td>
</tr>
          <tr>
            <td>Dividend Yield:</td>
            <td>{formatNumber(data.stock.dividendYield)}%</td>
          </tr>
          <tr>
            <td>Book Value:</td>
            <td>{formatNumber(data.stock.bookValue)}</td>
          </tr>
          <tr>
            <td>Face Value:</td>
            <td>{formatNumber(data.stock.faceValue)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="financials-heading">Financials</h2>
      <table className="financials-table">
        <tbody>
          <tr>
            <td>Revenue:</td>
            <td>{formatNumber(data.financials.revenue)}</td>
          </tr>
          <tr>
            <td>Gross Margins:</td>
            <td>{(data.financials.grossMargins * 100).toFixed(2)}%</td>
          </tr>
          <tr>
            <td>Operating Margins:</td>
            <td>{(data.financials.operatingMargins * 100).toFixed(2)}%</td>
          </tr>
          <tr>
            <td>Net Income:</td>
            <td>{formatNumber(data.financials.netIncomeToCommon)}</td>
          </tr>
          <tr>
  <td>Return on Equity (ROE):</td>
  <td>
    {data.financials.returnOnEquity !== 'N/A' 
      ? `${(data.financials.returnOnEquity * 100).toFixed(2)}%` 
      : 'N/A'}
  </td>
</tr>
        </tbody>
      </table>

      <h2 className="analyst-heading">Analyst Opinions</h2>
      <table className="analyst-table">
        <tbody>
          <tr>
            <td>Target Mean Price:</td>     
            <td>{formatNumber(data.analystOpinions.targetMeanPrice)}</td>
          </tr>
          <tr>
            <td>Recommendation:</td>
            <td>{data.analystOpinions.recommendationKey || 'N/A'}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="technical-indicators-heading">Technical Indicators</h2>
      <table className="technical-indicators-table">
        <tbody>
          <tr>
            <td>RSI:</td>
            <td>{data.technicalIndicators.RSI.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {graph && (
        <div>
          <h2 className="stock-info-heading">Stock Price Chart</h2>
          <img src={`data:image/jpeg;base64,${graph}`} alt="Stock Price Chart" className="stock-chart" />
        </div>
      )}

      <h2 className="forecast-heading">Forecast</h2>
      <table className="forecast-table">
        <tbody>
          {forecast.futurePrices.map((price, index) => (
            <tr key={index}>
              <td>Day {index + 1}:</td>
              <td>{formatNumber(price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="analysis-heading">Analysis</h2>
      <p className="analysis-content">{analysis || 'N/A'}</p>

      <h2 className="sentiment-heading">Sentiment Analysis</h2>
      <p className="sentiment-content">
        Average Sentiment Score: {sentimentAnalysis.averageSentiment !== 'N/A' ? sentimentAnalysis.averageSentiment.toFixed(2) : 'N/A'}
      </p>
      <h2 className="sentiment-heading">Recent Headlines:</h2>
      <ul>
        {sentimentAnalysis.headlines.map((headline, index) => (
          <li key={index}>
            <a href={headline.link} target="_blank" rel="noopener noreferrer">
              {headline.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
    
  );

};

export default StockSearch;
