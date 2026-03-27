import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button 
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Information"
      >
        <Info size={16} />
      </button>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 mt-2 -ml-32 text-xs text-white bg-gray-800 rounded-lg shadow-lg left-1/2 opacity-100 transition-opacity">
          {content}
          <div className="absolute -top-1 left-1/2 w-2 h-2 -ml-1 bg-gray-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;