/**
 * 地震知識小學堂 - 關於頁面
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>關於 | 地震知識小學堂</title>
        <meta
          name="description"
          content="地震知識小學堂是一個專為行動裝置設計的互動式地震衛教應用程式，幫助大眾了解地震科學知識。"
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white"
      >
        <Header onBack={() => navigate('/')} title="關於我們" />

        <div className="px-6 py-8 max-w-screen-md mx-auto space-y-8">
          <section className="bg-sky-50/50 p-8 rounded-[2.5rem] border border-sky-100">
            <h1 className="text-2xl font-black text-slate-800 mb-4">地震知識小學堂</h1>
            <p className="text-slate-600 font-bold leading-relaxed mb-4">
              這是一個專為行動裝置設計的互動式地震衛教網頁應用程式。透過分級教學、互動模擬和測驗，幫助您深入了解地震科學知識。
            </p>
            <p className="text-slate-600 font-bold leading-relaxed">
              規模看大小，震度看搖晃。掌握科學，守護安全！
            </p>
          </section>

          <section className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-4">核心功能</h2>
            <ul className="space-y-3 text-slate-600 font-bold">
              <li className="flex items-start gap-3">
                <span className="text-sky-500">✓</span>
                <span>分級教學：從基礎到進階的地震知識</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-sky-500">✓</span>
                <span>互動模擬：即時視覺化地震規模與震度</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-sky-500">✓</span>
                <span>知識測驗：5 題精選考題鞏固觀念</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-sky-500">✓</span>
                <span>離線可用：PWA 技術支援離線瀏覽</span>
              </li>
            </ul>
          </section>

          <section className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-4">技術棧</h2>
            <div className="flex flex-wrap gap-2">
              {['React 19', 'TypeScript', 'Tailwind CSS', 'Motion', 'Vite SSG', 'PWA'].map(
                (tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-sky-100 text-sky-600 rounded-full text-sm font-bold"
                  >
                    {tech}
                  </span>
                ),
              )}
            </div>
          </section>

          <footer className="text-center text-sm text-slate-500 font-bold py-4">
            <p>© 2025 haotool.org. All rights reserved.</p>
            <p className="mt-1">版本: {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
          </footer>
        </div>
      </motion.div>
    </>
  );
};

export default About;
