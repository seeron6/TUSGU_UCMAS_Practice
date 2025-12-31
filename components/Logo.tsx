import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Ensure you have placed your image at src/assets/logo.png
import logoSrc from '../assets/logo.png';

export const Logo: React.FC<{ size?: 'sm' | 'lg', variant?: 'white' | 'blue' }> = ({ size = 'lg', variant = 'blue' }) => {
  const isLarge = size === 'lg';
  
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const handleStart = () => {
    setIsPressing(true);
    longPressTriggeredRef.current = false;
    
    // Secret Admin Access: Long press for 3 seconds
    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      navigate('/admin/news');
      setIsPressing(false); 
    }, 3000);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressing(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      
      // If valid click (not a long press), go to website or home
      if (!longPressTriggeredRef.current) {
        window.open('https://www.tusgu.org/', '_blank');
      }
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center select-none cursor-pointer transition-transform active:scale-95"
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => {
        setIsPressing(false);
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
    >
      <div className={`
        relative transition-all duration-500
        ${isPressing ? 'scale-105 opacity-80' : ''}
      `}>
        {/* 
           Adjust the 'h-32' (height) classes below to fit your specific logo's aspect ratio.
           isLarge is used on the Dashboard, !isLarge is used in the Header.
        */}
        <img 
          src={logoSrc} 
          alt="TUSGU Logo" 
          className={`
            object-contain 
            ${isLarge ? 'h-32 md:h-40' : 'h-10'} 
            ${variant === 'white' ? 'brightness-0 invert' : ''} /* Optional: Makes logo white in header if it's transparent PNG */
          `} 
        />
      </div>
    </div>
  );
};
