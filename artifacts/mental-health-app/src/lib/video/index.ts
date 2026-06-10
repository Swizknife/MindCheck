import { useState, useEffect } from 'react';

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  
  useEffect(() => {
    const durationValues = Object.values(durations);
    if (durationValues.length === 0) return;

    // Hook into global recording API if it exists
    if (typeof window !== 'undefined' && (window as any).startRecording) {
      (window as any).startRecording();
    }

    let isFirstPass = true;
    let timeout: NodeJS.Timeout;
    
    const playScene = (index: number) => {
      timeout = setTimeout(() => {
        const nextScene = index + 1;
        if (nextScene >= durationValues.length) {
          if (isFirstPass && typeof window !== 'undefined' && (window as any).stopRecording) {
            (window as any).stopRecording();
            isFirstPass = false;
          }
          setCurrentScene(0);
          playScene(0);
        } else {
          setCurrentScene(nextScene);
          playScene(nextScene);
        }
      }, durationValues[index]);
    };
    
    playScene(0);
    return () => clearTimeout(timeout);
  }, [JSON.stringify(durations)]); // Dependency on durations

  return { currentScene };
}
