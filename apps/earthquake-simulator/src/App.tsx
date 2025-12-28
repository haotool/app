import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState } from './types';
import { LESSONS } from './data/lessons';
import EarthquakeSimulator from './components/EarthquakeSimulator';
import IntensityGrid from './components/IntensityGrid';
import QuizWidget from './components/QuizWidget';
import KeyNotesCard from './components/KeyNotesCard';
import Header from './components/Header';
import Logo from './components/Logo';
import DepthComparison from './components/DepthComparison';
import TectonicMotion from './components/TectonicMotion';
import SeismicWaves from './components/SeismicWaves';
import MagnitudeVisualizer from './components/MagnitudeVisualizer';

interface AppProps {
  initialStage?: keyof typeof AppState;
}

const App: React.FC<AppProps> = ({ initialStage }) => {
  const [stage, setStage] = useState<AppState>(
    initialStage ? AppState[initialStage] : AppState.LANDING,
  );
  const [simValue, setSimValue] = useState(5.0);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage]);

  // [fix:2025-12-29] 使用 initial={false} 避免 SSG 時 opacity:0 導致 NO_FCP
  // [context7:magicui.design/framer-motion-react:2025-12-29]
  const renderLanding = () => (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black text-slate-800 tracking-tighter leading-none"
          >
            地震<span className="text-sky-500 italic">小學堂</span>
          </motion.h1>
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-700 text-lg font-bold"
          >
            規模看大小，震度看搖晃
            <br />
            掌握科學，守護安全！
          </motion.p>
        </div>

        <motion.button
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            setStage(AppState.LESSON);
          }}
          className="w-full py-6 bg-sky-700 text-white rounded-[2.2rem] font-black text-xl shadow-2xl shadow-sky-200 transition-all active:bg-sky-800"
        >
          開始探索
        </motion.button>
      </div>

      <div className="absolute top-1/4 -left-10 w-40 h-40 bg-sky-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-10 w-60 h-60 bg-blue-100/50 rounded-full blur-3xl" />
    </motion.div>
  );

  const renderLessons = () => (
    <motion.div initial={false} animate={{ opacity: 1 }} className="pb-24 bg-white min-h-screen">
      <Header onBack={() => setStage(AppState.LANDING)} />

      <div className="px-6 py-8 space-y-12 max-w-screen-md mx-auto">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">能量模擬室</h3>
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
              Physics v1.2
            </span>
          </div>
          <EarthquakeSimulator value={simValue} onValueChange={setSimValue} />
        </section>

        <div className="space-y-10">
          {LESSONS.map((lesson, idx) => (
            <section
              key={lesson.id}
              className="relative bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50"
            >
              <div className="absolute top-6 right-8 text-5xl font-black text-sky-100/40">
                0{idx + 1}
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                    {lesson.title}
                  </h4>
                  <p className="text-sky-500 font-bold text-xs uppercase tracking-widest mt-1">
                    {lesson.subtitle}
                  </p>
                </div>

                {/* 動態組件插入點 */}
                {lesson.id === 'l0' && <TectonicMotion />}
                {lesson.id === 'lwave' && <SeismicWaves />}
                {lesson.id === 'l1' && <MagnitudeVisualizer />}
                {lesson.id === 'l4' && <DepthComparison />}

                <div className="space-y-3">
                  {lesson.paragraphs.map((p, i) => (
                    <p key={i} className="text-slate-600 text-base font-bold leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
                {lesson.tips && <KeyNotesCard tips={lesson.tips} />}
              </div>
            </section>
          ))}
        </div>

        <section className="bg-sky-50/50 p-8 rounded-[3rem] border border-sky-100 shadow-sm space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-800 mb-1">震度分級速查表</h3>
            <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Official Standard
            </p>
          </div>
          <IntensityGrid />
        </section>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            setStage(AppState.QUIZ);
          }}
          className="w-full py-6 bg-sky-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-sky-200 flex items-center justify-center space-x-3"
        >
          <span>參加實力大考驗</span>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderQuiz = () => (
    <div className="fixed inset-0 bg-white flex flex-col p-6 z-[60]">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-lg font-black text-slate-800 tracking-widest uppercase italic">
          Knowledge Check
        </h2>
        <button
          onClick={() => setStage(AppState.LESSON)}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>
      <div className="flex-grow overflow-y-auto no-scrollbar">
        <QuizWidget
          onFinish={(score) => {
            setFinalScore(score);
            setStage(AppState.REPORT);
          }}
          onReset={() => setStage(AppState.LESSON)}
        />
      </div>
    </div>
  );

  const renderReport = () => (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-10 bg-sky-700 text-white relative"
    >
      <div className="w-44 h-44 rounded-[3rem] bg-white flex flex-col items-center justify-center shadow-2xl mb-10 rotate-6 border-8 border-sky-400">
        <span className="text-[10px] font-black text-sky-400 uppercase mb-1">Expert Score</span>
        <span className="text-7xl font-black text-slate-800 font-mono tracking-tighter">
          {finalScore}
        </span>
      </div>
      <h2 className="text-4xl font-black mb-4 tracking-tight leading-none">課程圓滿達成！</h2>
      <p className="text-sky-100 font-bold mb-14 text-lg">你現在是地震防災小達人了！</p>
      <div className="flex flex-col w-full max-w-xs gap-4">
        <button
          onClick={() => setStage(AppState.QUIZ)}
          className="py-5 bg-white text-sky-600 rounded-[2rem] font-black text-xl shadow-lg"
        >
          重新挑戰
        </button>
        <button
          onClick={() => setStage(AppState.LANDING)}
          className="py-5 bg-sky-700/50 text-white rounded-[2rem] font-black text-lg border border-white/20"
        >
          回到首頁
        </button>
      </div>
    </motion.div>
  );

  return (
    <main
      className="max-w-screen-md mx-auto min-h-screen bg-white"
      role="main"
      aria-label="地震小學堂主要內容"
    >
      <AnimatePresence mode="wait">
        {stage === AppState.LANDING && renderLanding()}
        {stage === AppState.LESSON && renderLessons()}
        {stage === AppState.QUIZ && renderQuiz()}
        {stage === AppState.REPORT && renderReport()}
      </AnimatePresence>
    </main>
  );
};

export default App;
