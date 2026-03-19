import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const QuizTimer = ({ initialMinutes, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 300; // Less than 5 mins

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border transition-all ${
      isLowTime ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white'
    }`}>
      <Clock size={18} className={isLowTime ? 'animate-pulse' : ''} />
      <span className="font-mono text-xl font-black tabular-nums">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default QuizTimer;
