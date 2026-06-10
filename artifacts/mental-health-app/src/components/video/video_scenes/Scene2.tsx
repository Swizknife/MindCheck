import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="w-32 h-32 mb-8 bg-[#E8735A] rounded-full flex items-center justify-center shadow-xl"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <span className="text-white text-5xl font-display font-bold">M</span>
      </motion.div>

      <motion.h2 
        className="text-[5vw] font-display font-black text-[#2A2426] tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Meet MindCheck
      </motion.h2>

      <motion.p 
        className="text-[2vw] font-body text-[#2A2426]/70 mt-4 max-w-[60%] text-center"
        initial={{ opacity: 0, filter: 'blur(5px)' }}
        animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(5px)' }}
        transition={{ duration: 0.6 }}
      >
        No judgment. No clinical jargon. 
        Just a safe space to understand yourself.
      </motion.p>
    </motion.div>
  );
}
