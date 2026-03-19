import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Side: Illustration / Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-20 text-white">
          <h1 className="text-6xl font-extrabold mb-6 tracking-tight">Code Circle</h1>
          <p className="text-xl text-indigo-100 text-center leading-relaxed">
            The ultimate hub for college developers to collaborate, learn, and grow together. Join the elite circle.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 w-full max-w-md">
            <div className="p-4 glass-card text-center">
              <span className="block text-2xl font-bold">500+</span>
              <span className="text-sm opacity-80 font-medium">Members</span>
            </div>
            <div className="p-4 glass-card text-center">
              <span className="block text-2xl font-bold">50+</span>
              <span className="text-sm opacity-80 font-medium">Projects</span>
            </div>
          </div>
        </div>
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-bold text-white mb-3">{title}</h2>
            <p className="text-slate-400 font-medium">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
