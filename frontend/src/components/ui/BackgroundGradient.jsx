import React from 'react';
import useThemeStore from '../../store/useThemeStore';

const BackgroundGradient = () => {
  const { theme } = useThemeStore();

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
      {theme === 'dark' ? (
        <>
          {/* Dark mode: deep nebula gradients */}
          <div 
            className="absolute top-[-15%] left-[-10%] w-[65%] h-[65%] rounded-full blur-[140px] opacity-[0.15]"
            style={{
              background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
              animation: 'pulse 8s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[120px] opacity-[0.1]"
            style={{
              background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
              animation: 'pulse 12s ease-in-out infinite 2s',
            }}
          />
          <div 
            className="absolute top-[30%] right-[5%] w-[35%] h-[35%] rounded-full blur-[100px] opacity-[0.08]"
            style={{
              background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
              animation: 'pulse 10s ease-in-out infinite 1s',
            }}
          />
          {/* Subtle grid */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '80px 80px'
            }}
          />
        </>
      ) : (
        <>
          {/* Light mode: soft, warm gradients */}
          <div 
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-[0.25]"
            style={{
              background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)',
              animation: 'pulse 8s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-[0.2]"
            style={{
              background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)',
              animation: 'pulse 12s ease-in-out infinite 2s',
            }}
          />
          <div 
            className="absolute top-[20%] right-[15%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-[0.15]"
            style={{
              background: 'radial-gradient(circle, #fbcfe8 0%, transparent 70%)',
              animation: 'pulse 10s ease-in-out infinite 1s',
            }}
          />
          {/* Subtle dot pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '32px 32px'
            }}
          />
        </>
      )}
    </div>
  );
};

export default BackgroundGradient;
