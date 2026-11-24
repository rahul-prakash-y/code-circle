import React, { useEffect, useRef } from 'react';

interface CountUpProps {
  value: number | string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

// Emil Kowalski fluid ease-out cubic-bezier(0.16, 1, 0.3, 1) timing function
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const span = spanRef.current;
    if (!span) return;

    let targetNum: number | null = null;
    let preStr = prefix;
    let sufStr = suffix;
    let isDecimal = false;

    if (typeof value === 'number') {
      targetNum = value;
    } else if (typeof value === 'string') {
      const cleanStr = value.replace(/,/g, '').trim();
      const num = parseFloat(cleanStr);
      if (!isNaN(num) && isFinite(num) && String(num) === cleanStr) {
        targetNum = num;
      } else {
        const match = cleanStr.match(/^([^\d.]*)(\d+(?:\.\d+)?)([^\d.]*)$/);
        if (match) {
          preStr = `${prefix}${match[1]}`;
          targetNum = parseFloat(match[2]);
          sufStr = `${match[3]}${suffix}`;
          isDecimal = match[2].includes('.');
        } else {
          span.textContent = `${prefix}${value}${suffix}`;
          return;
        }
      }
    }

    if (targetNum === null || isNaN(targetNum)) {
      span.textContent = `${prefix}${value}${suffix}`;
      return;
    }

    // Direct DOM mutation inside requestAnimationFrame loop (zero React state re-renders)
    let startTime: number | null = null;
    let rafId: number;
    const durationMs = duration * 1000;

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      const currentVal = targetNum! * easedProgress;

      const formattedVal = isDecimal
        ? currentVal.toFixed(1)
        : Math.round(currentVal).toLocaleString();

      if (spanRef.current) {
        spanRef.current.textContent = `${preStr}${formattedVal}${sufStr}`;
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [value, duration, prefix, suffix]);

  return (
    <span
      ref={spanRef}
      className={`inline-block font-mono tracking-tight ${className}`}
    >
      {prefix}
      {typeof value === 'number' ? '0' : value}
      {suffix}
    </span>
  );
};

export default CountUp;
