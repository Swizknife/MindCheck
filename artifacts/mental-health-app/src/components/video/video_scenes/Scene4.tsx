import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#B8A9D9]/20"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ scale: 0, y: 50 }}
        animate={phase >= 1 ? { scale: 1, y: 0 } : { scale: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/mindbot.png`} 
          alt="MindBot" 
          className="w-48 h-48 object-contain drop-shadow-2xl"
        />
      </motion.div>

      <motion.div 
        className="mt-8 bg-white p-6 rounded-2xl shadow-lg max-w-lg relative"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45" />
        <p className="font-body text-[#2A2426] text-[1.5vw] font-medium relative z-10">
          Hey there! Take your time. I'm here to listen whenever you're ready. 💜
        </p>
      </motion.div>

      <motion.h2 
        className="mt-12 text-[4vw] font-display font-black text-[#2A2426]"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        Your 24/7 Companion
      </motion.h2>
    </motion.div>
  );
}
