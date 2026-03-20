import React from 'react';

const GoogleButton = ({ onClick, loading, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={className || "w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm border border-slate-200 mt-4 disabled:opacity-70"}
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 flex-shrink-0" />
      <span>Continue with Google</span>
    </button>
  );
};

export default GoogleButton;
