/**
 * 地震知識小學堂 - 首頁
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import Logo from '../components/Logo';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsPressed(true);
    setTimeout(() => navigate('/lessons'), 200);
  };

  return (
    <>
      <Helmet>
        <title>地震知識小學堂 | 互動式地震衛教</title>
        <meta
          name="description"
          content="透過互動式教學了解地震科學知識。規模看大小，震度看搖晃，掌握科學，守護安全！"
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative flex flex-col items-center justify-center min-h-screen text-center px-8 bg-sky-50 overflow-hidden"
      >
        <div className="relative z-10 w-full max-w-sm">
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
            }}
            className="w-36 h-36 bg-white rounded-[3.5rem] mb-12 mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(14,165,233,0.15)] border-4 border-white overflow-hidden p-5"
          >
            <Logo className="w-full h-full" animate={true} />
          </motion.div>

          <div className="space-y-4 mb-14">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-black text-slate-800 tracking-tighter leading-none"
            >
              地震<span className="text-sky-500 italic">小學堂</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 text-lg font-bold"
            >
              規模看大小，震度看搖晃
              <br />
              掌握科學，守護安全！
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: isPressed ? 0.95 : 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            onClick={handleStart}
            className="w-full py-6 bg-sky-500 text-white rounded-[2.2rem] font-black text-xl shadow-2xl shadow-sky-200 transition-all active:bg-sky-600"
            aria-label="開始探索地震知識"
          >
            開始探索
          </motion.button>
        </div>

        {/* 背景裝飾 */}
        <div
          className="absolute top-1/4 -left-10 w-40 h-40 bg-sky-100/50 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 -right-10 w-60 h-60 bg-blue-100/50 rounded-full blur-3xl"
          aria-hidden="true"
        />
      </motion.div>
    </>
  );
};

export default Home;
