/**
 * 地震知識小學堂 - 課程頁面
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { LESSONS } from '../data/lessons';
import Header from '../components/Header';
import EarthquakeSimulator from '../components/EarthquakeSimulator';
import IntensityGrid from '../components/IntensityGrid';
import KeyNotesCard from '../components/KeyNotesCard';
import TectonicMotion from '../components/TectonicMotion';
import SeismicWaves from '../components/SeismicWaves';
import MagnitudeVisualizer from '../components/MagnitudeVisualizer';
import DepthComparison from '../components/DepthComparison';

const Lessons: React.FC = () => {
  const navigate = useNavigate();
  const [simValue, setSimValue] = useState(5.0);

  const handleGoToQuiz = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    navigate('/quiz');
  };

  return (
    <>
      <Helmet>
        <title>課程學習 | 地震知識小學堂</title>
        <meta
          name="description"
          content="學習地震成因、地震波、規模與震度等核心知識。透過互動模擬深入了解地震科學。"
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-24 bg-white min-h-screen"
      >
        <Header onBack={() => navigate('/')} />

        <div className="px-6 py-8 space-y-12 max-w-screen-md mx-auto">
          {/* 能量模擬室 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">
                能量模擬室
              </h2>
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
                Physics v1.2
              </span>
            </div>
            <EarthquakeSimulator value={simValue} onValueChange={setSimValue} />
          </section>

          {/* 課程內容 */}
          <div className="space-y-10">
            {LESSONS.map((lesson, idx) => (
              <section
                key={lesson.id}
                className="relative bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50"
              >
                <div
                  className="absolute top-6 right-8 text-5xl font-black text-sky-100/40"
                  aria-hidden="true"
                >
                  0{idx + 1}
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                      {lesson.title}
                    </h3>
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

          {/* 震度分級速查表 */}
          <section className="bg-sky-50/50 p-8 rounded-[3rem] border border-sky-100 shadow-sm space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-800 mb-1">震度分級速查表</h2>
              <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Official Standard
              </p>
            </div>
            <IntensityGrid />
          </section>

          {/* 前往測驗按鈕 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGoToQuiz}
            className="w-full py-6 bg-sky-500 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-sky-200 flex items-center justify-center space-x-3"
            aria-label="參加實力大考驗"
          >
            <span>參加實力大考驗</span>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default Lessons;
