import React, { useState, useEffect } from 'react';
import summitLogoImg from '../assets/images/SummitLogo.png';

interface Props {
  className?: string;
  logoUrl?: string;
}

export const SummitLogo: React.FC<Props> = ({
  className = "h-full max-h-[90%] w-auto object-contain",
  logoUrl,
}) => {
  const resolveLogoUrl = (url?: string) => {
    if (!url) return summitLogoImg;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBase}${cleanPath}`;
  };

  const [imgSrc, setImgSrc] = useState(() => resolveLogoUrl(logoUrl));

  useEffect(() => {
    setImgSrc(resolveLogoUrl(logoUrl));
  }, [logoUrl]);

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





