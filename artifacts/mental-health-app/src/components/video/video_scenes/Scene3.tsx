import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1400),
      setTimeout(() => setPhase(5), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const cards = [
    { text: "How's your sleep?", color: "bg-[#B8A9D9]" },
    { text: "Feeling drained?", color: "bg-[#F5C842]" },
    { text: "Hard to focus?", color: "bg-[#E8735A]" }
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, x: '100vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col md:flex-row items-center gap-12 w-full px-[10vw]">
        <div className="flex-1">
          <motion.h2 
            className="text-[4.5vw] font-display font-black text-[#2A2426] leading-tight"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
          >
            Adaptive<br/>Questions.
          </motion.h2>
          <motion.p 
            className="text-[1.8vw] text-[#2A2426]/70 mt-4"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          >
            Questions that adjust to you, not the other way around.
          </motion.p>
        </div>

        <div className="flex-1 relative h-[40vh] w-full">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className={`absolute left-0 right-0 p-8 rounded-2xl shadow-xl ${card.color} text-[#2A2426] font-display font-bold text-[2vw]`}
              style={{ top: `${i * 15}%`, zIndex: 10 - i }}
              initial={{ opacity: 0, y: 50, rotate: -5 }}
              animate={phase >= i + 2 ? { opacity: 1, y: 0, rotate: i % 2 === 0 ? -2 : 2 } : { opacity: 0, y: 50, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {card.text}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
