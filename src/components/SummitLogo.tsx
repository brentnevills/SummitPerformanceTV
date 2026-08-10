import React, { useState, useEffect } from 'react';

interface Props {
  className?: string;
  logoUrl?: string;
}

export const SummitLogo: React.FC<Props> = ({
  className = "h-full max-h-[90%] w-auto object-contain",
  logoUrl,
}) => {
  const [hasError, setHasError] = useState(false);

  const resolveLogoUrl = (rawUrl?: string) => {
    const target = rawUrl || 'SummitLogo.png';
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('data:') || target.startsWith('blob:')) {
      return target;
    }
    const cleanPath = target.startsWith('/') ? target.slice(1) : target;
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBase}${cleanPath}`;
  };

  const [imgSrc, setImgSrc] = useState(() => resolveLogoUrl(logoUrl));

  useEffect(() => {
    setHasError(false);
    setImgSrc(resolveLogoUrl(logoUrl));
  }, [logoUrl]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-navy-800/80 text-white font-bold px-4 py-2 rounded border border-accent/40 ${className}`}>
        <span className="tracking-wider text-sm md:text-base font-serif text-accent uppercase">
          Summit Performance Rehab
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt="Summit Performance Rehab & Wellness Centre"
      className={className}
      onError={() => {
        setHasError(true);
      }}
      referrerPolicy="no-referrer"
    />
  );
};
