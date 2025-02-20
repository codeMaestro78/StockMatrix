import React, { useState, useEffect } from 'react';
import './CSS_MutualFund.css';

const MutualFunds = () => {
  const [fundsData, setFundsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

  useEffect(() => {
    fetch('http://localhost:8000/api/mutualfunds/')
      .then((response) => response.json())
      .then((data) => {
        setFundsData(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const handleDownload = () => {
    fetch('http://localhost:8000/api/mutualfunds/?download=true')
      .then((response) => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Network response was not ok.');
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'mutual_funds.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((err) => {
        console.error('Failed to download CSV:', err);
        setError(err);
      });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFundClick = (fundName) => {
    const searchQuery = encodeURIComponent(fundName);
    window.location.href = `https://www.google.com/search?q=${searchQuery}`;
  };

  const highlightText = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="highlight">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const sortedData = React.useMemo(() => {
    let sortedFunds = [...fundsData];
    if (sortConfig.key) {
      sortedFunds.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortedFunds;
  }, [fundsData, sortConfig]);

  const filteredData = sortedData.filter((fund) =>
    fund['Scheme Name'].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">
        Loading data, please wait<span className="animated-dots">...</span>
      </p>
      <p className="loading-tips">
        While you're waiting, here's a tip: Make sure to check the annualized returns to better understand the fund's performance over time!
      </p>
    </div>
  );
}


  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">
          Oops! Something went wrong while fetching the data. Please try again later.
        </p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="division-container">
      <h1 align="center" className="mutualfunds-tag">
        Mutual Funds
      </h1>
      <h1 align="center" className="note-box">
        Data in this table: Get Annualised historical returns. If 1Y column is 10%, that means the fund has given 10% returns in the last 1 year.
      </h1>
      <input
        type="text"
        placeholder="Search by Scheme Name"
        className="search-bar"
        value={searchTerm}
        onChange={handleSearch}
      />
      <table className="table-container">
        <thead>
          <tr>
            <th onClick={() => handleSort('Scheme Name')}>Scheme Name</th>
            <th onClick={() => handleSort('Plan')}>Plan</th>
            <th onClick={() => handleSort('Category Name')}>Category Name</th>
            <th onClick={() => handleSort('Crisil Rank')}>Crisil Rank</th>
            <th onClick={() => handleSort('AuM (Cr)')}>AuM (Cr)</th>
            <th onClick={() => handleSort('1W')}>1W</th>
            <th onClick={() => handleSort('1M')}>1M</th>
            <th onClick={() => handleSort('3M')}>3M</th>
            <th onClick={() => handleSort('6M')}>6M</th>
            <th onClick={() => handleSort('YTD')}>YTD</th>
            <th onClick={() => handleSort('1Y')}>1Y</th>
            <th onClick={() => handleSort('2Y')}>2Y</th>
            <th onClick={() => handleSort('3Y')}>3Y</th>
            <th onClick={() => handleSort('5Y')}>5Y</th>
            <th onClick={() => handleSort('10Y')}>10Y</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((fund, index) => (
            <tr key={index}>
              <td onClick={() => handleFundClick(fund['Scheme Name'])} className="clickable-fund-name">
                {fund['Scheme Name']}
              </td>
              <td>{fund['Plan']}</td>
              <td>{fund['Category Name']}</td>
              <td>{fund['Crisil Rank']}</td>
              <td>{fund['AuM (Cr)']}</td>
              <td>{fund['1W']}</td>
              <td>{fund['1M']}</td>
              <td>{fund['3M']}</td>
              <td>{fund['6M']}</td>
              <td>{fund['YTD']}</td>
              <td>{fund['1Y']}</td>
              <td>{fund['2Y']}</td>
              <td>{fund['3Y']}</td>
              <td>{fund['5Y']}</td>
              <td>{fund['10Y']}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button className="download-btn" onClick={handleDownload}>
        Download CSV
      </button>
    </div>
  );
};

export default MutualFunds;
