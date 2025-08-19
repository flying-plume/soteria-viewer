// src/components/TraitFilter.js
import React from 'react';
import './TraitFilter.css';

const TraitFilter = ({ traits, selectedTraits, onTraitChange }) => {
  const handleClearFilters = () => {
    Object.keys(selectedTraits).forEach(traitType => {
      onTraitChange(traitType, '');
    });
  };

  if (Object.keys(traits).length === 0) {
    return <div className="trait-filter empty">No traits available for filtering</div>;
  }

  return (
    <div className="trait-filter">
      <div className="filter-header">
        <h3>Filter by Traits</h3>
        {Object.keys(selectedTraits).some(key => selectedTraits[key]) && (
          <button className="clear-filters" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>
      
      <div className="traits-container">
        {Object.entries(traits).map(([traitType, values]) => (
          <div key={traitType} className="trait-group">
            <label className="trait-label">{traitType}</label>
            <select
              value={selectedTraits[traitType] || ''}
              onChange={(e) => onTraitChange(traitType, e.target.value)}
              className="trait-select"
            >
              <option value="">All</option>
              {values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TraitFilter;