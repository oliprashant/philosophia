'use client';

import { createContext, useContext, useState } from 'react';

interface ReadingModeContextType {
  isReadingMode: boolean;
  toggleReadingMode: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const ReadingModeContext = createContext<ReadingModeContextType>({
  isReadingMode: false,
  toggleReadingMode: () => {},
  fontSize: 18,
  setFontSize: () => {},
});

export function useReadingMode() {
  return useContext(ReadingModeContext);
}

export default function ReadingModeProvider({ children }: { children: React.ReactNode }) {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const toggleReadingMode = () => setIsReadingMode(prev => !prev);

  return (
    <ReadingModeContext.Provider value={{ isReadingMode, toggleReadingMode, fontSize, setFontSize }}>
      {children}
    </ReadingModeContext.Provider>
  );
}