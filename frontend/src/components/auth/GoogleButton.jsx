import React from 'react';

const GoogleButton = ({ onClick, loading, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={className || "w-full flex items-center justify-center gap-3 bg-surface-elevated hover:bg-surface-elevated/80 text-text-primary font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm border border-border hover:border-border-hover mt-4 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"}
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 flex-shrink-0" />
      <span>Continue with Google</span>
    </button>
  );
};

export default GoogleButton;
