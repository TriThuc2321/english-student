import { useEffect, useRef } from 'react';

export function useSectionTimer(
  running: boolean,
  onTick: (seconds: number) => void,
): void {
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const interval = setInterval(() => {
      // Background tabs throttle intervals, so count real elapsed time instead of ticks.
      const elapsed = Math.floor((Date.now() - last) / 1000);
      if (elapsed < 1) return;
      last += elapsed * 1000;
      onTickRef.current(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);
}
