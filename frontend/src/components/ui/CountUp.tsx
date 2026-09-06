import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

interface CountUpProps {
  value: number | string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number | string>(0);

  useEffect(() => {
    // Parse numeric part
    if (typeof value === 'number') {
      const controls = animate(0, value, {
        duration,
        ease: [0.16, 1, 0.3, 1], // fluid cubic bezier
        onUpdate: (latest) => {
          setDisplayValue(Math.round(latest));
        },
      });
      return () => controls.stop();
    }

    if (typeof value === 'string') {
      // Remove commas or whitespace to check if numeric
      const cleanStr = value.replace(/,/g, '').trim();
      const num = parseFloat(cleanStr);

      if (!isNaN(num) && isFinite(num) && String(num) === cleanStr) {
        const controls = animate(0, num, {
          duration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (latest) => {
            setDisplayValue(Math.round(latest).toLocaleString());
          },
        });
        return () => controls.stop();
      }

      // If it contains prefix/suffix like "14.2k" or "#12"
      const match = cleanStr.match(/^([^\d.]*)(\d+(?:\.\d+)?)([^\d.]*)$/);
      if (match) {
        const pre = match[1];
        const numVal = parseFloat(match[2]);
        const suf = match[3];
        const isDecimal = match[2].includes('.');

        const controls = animate(0, numVal, {
          duration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (latest) => {
            const formatted = isDecimal ? latest.toFixed(1) : Math.round(latest).toString();
            setDisplayValue(`${pre}${formatted}${suf}`);
          },
        });
        return () => controls.stop();
      }

      // Non-numeric string fallback
      setDisplayValue(value);
    }
  }, [value, duration]);

  return (
    <span className={`inline-block font-mono tracking-tight ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export default CountUp;
