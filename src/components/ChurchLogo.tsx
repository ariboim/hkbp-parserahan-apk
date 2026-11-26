import React, { useState } from 'react';

export type ChurchLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ChurchLogoVariant = 'framed' | 'pennant';

interface ChurchLogoProps {
  size?: ChurchLogoSize;
  variant?: ChurchLogoVariant;
  className?: string;
  alt?: string;
}

const FRAMED_SIZE_CLASSES: Record<ChurchLogoSize, string> = {
  xs: 'w-10 h-11 p-1 rounded-xl',
  sm: 'w-12 h-14 p-1.5 rounded-xl',
  md: 'w-14 h-16 p-1.5 rounded-2xl',
  lg: 'w-[74px] h-[88px] p-2 rounded-2xl',
  xl: 'w-24 h-28 p-2.5 rounded-3xl',
};

const PENNANT_WIDTH_CLASSES: Record<ChurchLogoSize, string> = {
  xs: 'w-8',
  sm: 'w-10',
  md: 'w-12',
  lg: 'w-16',
  xl: 'w-24',
};

export const CHURCH_LOGO_SRC = '/assets/aistudio/logopaserahan_873b14d8';

export const ChurchLogo: React.FC<ChurchLogoProps> = ({
  size = 'md',
  variant = 'framed',
  className = '',
  alt = 'Logo Resmi HKBP Jatisampurna Wijk Parserahan · Trifena et Trifosa',
}) => {
  const [imgError, setImgError] = useState(false);

  const pennantGraphic = (
    <div
      className="relative aspect-[29/37] w-full overflow-hidden bg-[#0F276D] select-none"
      style={{
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 79.05%, 50% 100%, 0% 79.05%)',
      }}
    >
      {!imgError ? (
        <img
          src={CHURCH_LOGO_SRC}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="sync"
          onError={() => setImgError(true)}
          className="absolute max-w-none pointer-events-none"
          style={{
            width: '147.1264%',
            height: '115.3153%',
            left: '-23.5632%',
            top: '-7.6577%',
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white text-center p-1 border border-white/70">
          <span className="text-[10px] font-extrabold leading-none">✝</span>
          <span className="text-[7px] font-bold tracking-wider mt-0.5 leading-tight">
            HKBP
          </span>
        </div>
      )}
    </div>
  );

  if (variant === 'pennant') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 drop-shadow-[0_6px_14px_rgba(9,24,72,0.35)] ${PENNANT_WIDTH_CLASSES[size]} ${className}`}
      >
        {pennantGraphic}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 bg-gradient-to-b from-[#1746A2] via-[#0F2C7A] to-[#081948] border border-white/30 ring-1 ring-blue-300/20 shadow-[0_8px_22px_rgba(5,16,48,0.42)] overflow-hidden ${FRAMED_SIZE_CLASSES[size]} ${className}`}
    >
      <div className="w-full flex items-center justify-center drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)]">
        {pennantGraphic}
      </div>
    </div>
  );
};
