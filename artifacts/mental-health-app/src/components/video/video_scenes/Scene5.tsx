import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#FDF6F0]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1 
          className="text-[7vw] font-display font-black text-[#2A2426] leading-none mb-4"
        >
          MindCheck
        </motion.h1>
        
        <motion.div 
          className="h-[4px] bg-gradient-to-r from-[#E8735A] via-[#F5C842] to-[#B8A9D9] w-full rounded-full mb-8"
          initial={{ scaleX: 0 }}
          animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        <motion.p 
          className="text-[2vw] font-body font-medium text-[#2A2426]/70 max-w-[80%] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          Just a safe space to understand what's going on in your head right now.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
