import React from 'react';
import summitLogoImg from '../assets/images/summit_logo_banner_1786374147471.jpg';

interface Props {
  className?: string;
  logoUrl?: string;
}

export const SummitLogo: React.FC<Props> = ({
  className = "h-full max-h-[90%] w-auto object-contain",
  logoUrl,
}) => {
  const displayUrl = logoUrl || summitLogoImg;

  return (
    <img
      src={displayUrl}
      alt="Summit Performance Rehab & Wellness Centre"
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};


