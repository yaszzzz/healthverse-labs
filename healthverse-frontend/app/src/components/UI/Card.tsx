import React from 'react';
import ButtonCircle from './ButtonCircle';

interface CardProps {
  title: string;
  description: string;
  discoverLink: string;
}

const CaseCard: React.FC<CardProps> = ({
  title,
  description,
  discoverLink,
 
}) => {
  return (
    <div
      className="relative flex flex-col justify-between p-8 md:p-12 lg:p-16
                 bg-[#1E1E1E] text-white rounded-lg shadow-xl
                 max-w-4xl mx-auto min-h-[500px] md:min-h-[600px] lg:min-h-[700px]  aspect-square
                 overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg
          className="w-full h-full max-w-lg md:max-w-2xl lg:max-w-3xl text-gray-400 opacity-5"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z"
            stroke="currentColor"
            strokeWidth="1"
            className="opacity-50"
          />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" className="opacity-50" />
          <path
            d="M30 40 L70 40 M70 60 L30 60"
            stroke="currentColor"
            strokeWidth="1"
            className="opacity-50"
          />
        </svg>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Title */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
          {title}
        </h2>

        {/* Description */}
        <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-md md:max-w-lg mb-8 md:mb-12">
          {description}
        </p>

     
        <div className="grow"></div>

       
        <a
          href={discoverLink}
          className="flex items-center space-x-3 text-white text-lg md:text-xl font-semibold
                     hover:text-gray-300 transition-colors duration-200"
        >
         <ButtonCircle />
          <span>DISCOVER</span>
        </a>
      </div>
    </div>
  );
};

export default CaseCard;