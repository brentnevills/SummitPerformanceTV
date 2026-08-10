import React, { useState } from 'react';
import summitLogoImg from '../assets/images/SummitLogo.png';

interface Props {
  className?: string;
  logoUrl?: string;
}

export const SummitLogo: React.FC<Props> = ({
  className = "h-full max-h-[90%] w-auto object-contain",
  logoUrl,
}) => {
  const [imgSrc, setImgSrc] = useState(logoUrl || '/SummitLogo.png');

  return (
    <img
      src={imgSrc}
      alt="Summit Performance Rehab & Wellness Centre"
      className={className}
      onError={() => {
        if (imgSrc !== summitLogoImg) {
          setImgSrc(summitLogoImg);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};




