import React, { useState } from "react";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  alt?: string;
}

export const GOOGLE_DRIVE_LOGO_ID = "18QOnOf0PprYyR0DrJPk64wpRM5IUlnNf";
export const PRIMARY_LOGO_URL = `https://lh3.googleusercontent.com/d/${GOOGLE_DRIVE_LOGO_ID}`;
export const FALLBACK_THUMBNAIL_URL = `https://drive.google.com/thumbnail?id=${GOOGLE_DRIVE_LOGO_ID}&sz=w800`;
export const FALLBACK_UC_URL = `https://drive.google.com/uc?export=view&id=${GOOGLE_DRIVE_LOGO_ID}`;

export const AppLogo: React.FC<AppLogoProps> = ({
  className = "",
  size = "md",
  alt = "ScoreArena Logo",
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const sources = [
    PRIMARY_LOGO_URL,
    FALLBACK_THUMBNAIL_URL,
    FALLBACK_UC_URL,
  ];

  const sizeClasses = {
    sm: "w-7 h-7 min-w-[28px]",
    md: "w-11 h-11 min-w-[44px]",
    lg: "w-14 h-14 min-w-[56px]",
    xl: "w-20 h-20 min-w-[80px]",
  };

  const handleError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    // Elegant Table Tennis pingpong badge fallback if Google Drive privacy settings block the image
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20 p-2 overflow-hidden select-none ${sizeClasses[size]} ${className}`}
        title="ScoreArena Tenis Meja ITTF"
      >
        <span className="text-xl sm:text-2xl filter drop-shadow">🏓</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden bg-slate-900/10 dark:bg-white/10 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-md shadow-indigo-500/10 transition-transform duration-200 hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-600 text-white animate-pulse">
          <span className="text-xs font-mono font-bold">🏓</span>
        </div>
      )}
      <img
        src={sources[currentSrcIndex]}
        alt={alt}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-contain p-1 transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
