import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = { 
  hook: 4000, 
  intro: 4500, 
  flow: 4500, 
  mindbot: 4000, 
  outro: 5000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FDF6F0] font-sans">
      {/* Background image / texture */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/abstract-bg.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Floating Blobs (Persistent Background) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute w-[40vw] h-[40vw] rounded-full blur-[80px]"
          style={{ background: '#E8735A', opacity: 0.15 }}
          animate={{ 
            x: ['-20%', '20%', '-10%'], 
            y: ['-20%', '10%', '-30%'],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute w-[50vw] h-[50vw] rounded-full blur-[100px] bottom-0 right-0"
          style={{ background: '#F5C842', opacity: 0.15 }}
          animate={{ 
            x: ['10%', '-20%', '30%'], 
            y: ['10%', '-10%', '20%'],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute w-[45vw] h-[45vw] rounded-full blur-[90px] top-1/4 left-1/4"
          style={{ background: '#B8A9D9', opacity: 0.15 }}
          animate={{ 
            x: ['30%', '-10%', '10%'], 
            y: ['-10%', '30%', '0%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="hook" />}
        {currentScene === 1 && <Scene2 key="intro" />}
        {currentScene === 2 && <Scene3 key="flow" />}
        {currentScene === 3 && <Scene4 key="mindbot" />}
        {currentScene === 4 && <Scene5 key="outro" />}
      </AnimatePresence>
    </div>
  );
}
