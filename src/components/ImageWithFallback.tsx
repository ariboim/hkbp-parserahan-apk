import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackGradient?: string;
  fallbackLabel?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackGradient = 'from-blue-800 to-indigo-950',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex flex-col items-center justify-center p-4 text-center text-white`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-8 h-8 opacity-80 mb-2" />
        <span className="text-xs font-medium opacity-90 line-clamp-2 max-w-[180px]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
};
