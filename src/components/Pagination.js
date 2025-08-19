// src/components/Pagination.js
import React from 'react';
import './Pagination.css';

const Pagination = ({ nftsPerPage, totalNfts, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalNfts / nftsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (pageNumbers.length <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  // Calculate which page numbers to show
  const getVisiblePageNumbers = () => {
    const maxPagesToShow = 5;
    
    if (pageNumbers.length <= maxPagesToShow) {
      return pageNumbers;
    }
    
    // Always include first, last, current and one page on each side of current
    const firstPage = 1;
    const lastPage = pageNumbers.length;
    
    let startPage = Math.max(currentPage - 1, firstPage);
    let endPage = Math.min(currentPage + 1, lastPage);
    
    // Adjust if we're at the start or end
    if (currentPage <= 2) {
      endPage = maxPagesToShow;
    } else if (currentPage >= lastPage - 1) {
      startPage = lastPage - maxPagesToShow + 1;
    } else {
      // In the middle, show current and 2 on each side
      startPage = Math.max(currentPage - 2, firstPage);
      endPage = Math.min(currentPage + 2, lastPage);
    }
    
    const visiblePages = [];
    
    // Add first page
    visiblePages.push(1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      visiblePages.push('...');
    }
    
    // Add pages in the middle
    for (let i = Math.max(startPage, 2); i <= Math.min(endPage, lastPage - 1); i++) {
      visiblePages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < lastPage - 1) {
      visiblePages.push('...');
    }
    
    // Add last page if we have more than one page
    if (lastPage > 1) {
      visiblePages.push(lastPage);
    }
    
    return visiblePages;
  };

  return (
    <nav className="pagination-container">
      <button 
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-button prev"
      >
        Previous
      </button>
      
      <ul className="pagination">
        {getVisiblePageNumbers().map((number, index) => (
          <li key={index} className="page-item">
            {number === '...' ? (
              <span className="ellipsis">...</span>
            ) : (
              <button
                onClick={() => paginate(number)}
                className={`page-link ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            )}
          </li>
        ))}
      </ul>
      
      <button 
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === pageNumbers.length}
        className="pagination-button next"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;