/**
 * 地震知識小學堂 - 測驗頁面
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import QuizWidget from '../components/QuizWidget';

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleFinish = (score: number) => {
    setFinalScore(score);
  };

  const handleReset = () => {
    setFinalScore(null);
  };

  if (finalScore !== null) {
    return (
      <>
        <Helmet>
          <title>測驗結果 | 地震知識小學堂</title>
          <meta name="description" content="查看你的地震知識測驗成績，成為地震防災小達人！" />
        </Helmet>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-screen text-center px-10 bg-sky-500 text-white relative"
        >
          <div className="w-44 h-44 rounded-[3rem] bg-white flex flex-col items-center justify-center shadow-2xl mb-10 rotate-6 border-8 border-sky-400">
            <span className="text-[10px] font-black text-sky-400 uppercase mb-1">專家評分</span>
            <span className="text-7xl font-black text-slate-800 font-mono tracking-tighter">
              {finalScore}
            </span>
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight leading-none">課程圓滿達成！</h1>
          <p className="text-sky-100 font-bold mb-14 text-lg">你現在是地震防災小達人了！</p>
          <div className="flex flex-col w-full max-w-xs gap-4">
            <button
              onClick={handleReset}
              className="py-5 bg-white text-sky-600 rounded-[2rem] font-black text-xl shadow-lg"
              aria-label="重新挑戰測驗"
            >
              重新挑戰
            </button>
            <button
              onClick={() => navigate('/')}
              className="py-5 bg-sky-700/50 text-white rounded-[2rem] font-black text-lg border border-white/20"
              aria-label="回到首頁"
            >
              回到首頁
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>知識測驗 | 地震知識小學堂</title>
        <meta
          name="description"
          content="測試你的地震知識！5題精選考題，幫助鞏固正確觀念，成為地震防災小達人。"
        />
      </Helmet>

      <div className="fixed inset-0 bg-white flex flex-col p-6 z-[60]">
        <header className="flex items-center justify-between mb-6 shrink-0">
          <h1 className="text-lg font-black text-slate-800 tracking-widest uppercase italic">
            知識檢定
          </h1>
          <button
            onClick={() => navigate('/lessons')}
            className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"
            aria-label="返回課程"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-grow overflow-y-auto no-scrollbar">
          <QuizWidget onFinish={handleFinish} onReset={() => navigate('/lessons')} />
        </div>
      </div>
    </>
  );
};

export default Quiz;
