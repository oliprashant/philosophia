'use client';
// src/components/ui/Clock.tsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-3 text-xs font-sans text-[var(--text-faint)]" aria-live="polite" aria-atomic="true">
      <time dateTime={time.toISOString()} className="tabular-nums tracking-wide">
        {format(time, 'EEEE, MMMM d yyyy')}
      </time>
      <span className="text-[var(--border)]">·</span>
      <time dateTime={time.toISOString()} className="tabular-nums font-medium text-[var(--text-muted)]">
        {format(time, 'HH:mm:ss')}
      </time>
    </div>
  );
}
