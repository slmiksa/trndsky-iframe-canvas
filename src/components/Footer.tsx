
import React from 'react';

const Footer = () => {
  const handleTrndSkyClick = () => {
    window.open('https://trndsky.com', '_blank');
  };

  return (
    <footer className="mt-8 pt-4 pb-8">
      <div className="text-center">
        <button
          onClick={handleTrndSkyClick}
          className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          برمجة وتطوير TRNDSKY
        </button>
      </div>
    </footer>
  );
};

export default Footer;
