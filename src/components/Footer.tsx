
import React from 'react';

const Footer = () => {
  const handleTrndSkyClick = () => {
    window.open('https://trndsky.com', '_blank');
  };

  return (
    <footer className="mt-8 pt-4 border-t border-gray-200">
      <div className="text-center">
        <button
          onClick={handleTrndSkyClick}
          className="text-sm text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          برمجة وتطوير TRNDSKY
        </button>
      </div>
    </footer>
  );
};

export default Footer;
