import React from 'react';

const StellarBackground = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden bg-[#030303]">
      {/* Primary Nebula */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          animationDuration: '8s'
        }}
      />
      
      {/* Secondary Nebula */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-10 animate-pulse"
        style={{
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          animationDuration: '12s',
          animationDelay: '2s'
        }}
      />

      {/* Tertiary Nebula */}
      <div 
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full blur-[80px] opacity-10 animate-pulse"
        style={{
          background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
          animationDuration: '10s',
          animationDelay: '1s'
        }}
      />

      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
};

export default StellarBackground;
