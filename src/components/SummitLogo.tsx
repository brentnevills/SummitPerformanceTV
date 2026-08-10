import React from 'react';
import summitLogoImg from '../assets/images/SummitLogo.png';

interface Props {
  className?: string;
  logoUrl?: string;
}

export const SummitLogo: React.FC<Props> = ({
  className = "h-full max-h-[90%] w-auto object-contain",
  logoUrl,
}) => {
  const displayUrl = logoUrl || '/SummitLogo.png' || summitLogoImg;

  return (
    <img
      src={displayUrl}
      alt="Summit Performance Rehab & Wellness Centre"
      className={className}
      onError={(e) => {
        // Fallback to imported asset or /SummitLogo.png
        const target = e.currentTarget;
        if (target.src !== summitLogoImg) {
          target.src = summitLogoImg;
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};



