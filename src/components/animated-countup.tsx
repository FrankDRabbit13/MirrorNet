"use client";

import { useEffect, useState } from "react";

export function AnimatedCountup({
  value,
  decimals = 1,
  className,
  style,
}: {
  value: number;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const current = Math.min((value * progress) / duration, value);
      setCount(current);

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };

    const frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value]);

  return <span className={className} style={style}>{count.toFixed(decimals)}</span>;
}
