import { useEffect, useState } from 'react';
import { dayKey } from '../utils/format';

/** Current time, re-rendering every `intervalMs` so clocks and "today" stay live */
export const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};

/** Today's YYYY-MM-DD in Tashkent; changes by itself at midnight */
export const useToday = () => dayKey(useNow());
