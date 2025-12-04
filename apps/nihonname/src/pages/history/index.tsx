/**
 * 歷史專區首頁 - SEO Landing Page
 * [SEO Target Keywords]:
 * - 日治時期歷史
 * - 台灣歷史
 * - 皇民化運動
 * - 馬關條約
 * - 舊金山和約
 *
 * [Created: 2025-12-04]
 * [BDD: Green Light - SEO Landing Page Implementation]
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, ExternalLink, Scroll, Scale, Globe } from 'lucide-react';
import { SEOHelmet } from '../../components/SEOHelmet';

// 歷史專區文章列表
const historyArticles = [
  {
    id: 'kominka',
    path: '/history/kominka',
    title: '皇民化運動',
    subtitle: '1937-1945年台灣改姓名運動',
    description:
      '深入了解日本殖民時期的同化政策，探索台灣人改日本姓名的歷史脈絡。包含改姓原則、社會影響、統計數據等完整解析。',
    icon: Scroll,
    year: '1937-1945',
    keywords: ['皇民化改姓運動', '改日本姓', '日治時期改名', '台灣人改姓名單'],
  },
  {
    id: 'shimonoseki',
    path: '/history/shimonoseki',
    title: '馬關條約',
    subtitle: '1895年台灣割讓與日本殖民統治的開端',
    description:
      '了解甲午戰爭後清朝與日本簽訂的馬關條約，以及它如何開啟台灣50年的日本殖民統治。破解「馬關續約」的錯誤迷思。',
    icon: Scale,
    year: '1895',
    keywords: ['馬關條約', '馬關條約強制續約', '馬關續約', '台灣割讓'],
  },
  {
    id: 'san-francisco',
    path: '/history/san-francisco',
    title: '舊金山和約',
    subtitle: '1951年台灣地位與日本放棄主權的法律依據',
    description:
      '深入了解結束二戰的舊金山和約，以及它對台灣地位的影響。探討條約第二條「日本放棄台灣」的歷史意義。',
    icon: Globe,
    year: '1951',
    keywords: ['舊金山和約', '對日和平條約', '台灣地位', '日本放棄台灣'],
  },
];

// Collection Page Schema JSON-LD
const collectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '台灣日治時期歷史專區',
  description:
    '探索台灣日治時期的重要歷史事件：皇民化運動、馬關條約、舊金山和約。深入了解改姓名政策的歷史背景與社會影響。',
  url: 'https://app.haotool.org/nihonname/history/',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: historyArticles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://app.haotool.org/nihonname${article.path}`,
      name: article.title,
      description: article.description,
    })),
  },
};

export default function HistoryIndex() {
  return (
    <>
      <SEOHelmet
        title="台灣日治時期歷史專區 - 皇民化運動、馬關條約、舊金山和約"
        description="探索台灣日治時期的重要歷史事件：皇民化運動、馬關條約、舊金山和約。深入了解改姓名政策的歷史背景與社會影響。"
        pathname="/history"
        keywords={[
          '日治時期歷史',
          '台灣歷史',
          '皇民化運動',
          '馬關條約',
          '舊金山和約',
          '改姓名運動',
          '日本殖民統治',
          '台灣割讓',
          '日治時代',
          '皇民化改姓',
        ]}
        jsonLd={collectionSchema}
        breadcrumbs={[
          { name: '首頁', url: '/' },
          { name: '歷史專區', url: '/history' },
        ]}
      />

      <div className="min-h-[100dvh] h-auto bg-stone-100 py-8 md:py-12 px-4 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto pb-8">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center text-stone-600 hover:text-red-800 mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            返回生成器
          </Link>

          {/* Header */}
          <header className="text-center mb-12">
            <div className="inline-flex items-center justify-center space-x-2 text-red-800 mb-4">
              <BookOpen size={20} />
              <span className="text-sm font-bold tracking-wider">HISTORY</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4 font-serif leading-tight">
              台灣日治時期歷史專區
            </h1>
            <p className="text-stone-600 max-w-2xl mx-auto">
              探索台灣在日本殖民統治時期的重要歷史事件，深入了解皇民化運動、改姓名政策的歷史背景與社會影響。
            </p>
          </header>

          {/* Timeline Overview */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 text-red-700 mr-2" />
              歷史時間軸
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-red-200"></div>
              <div className="space-y-6 pl-10">
                {[
                  {
                    year: '1895',
                    event: '馬關條約簽訂，台灣割讓日本',
                    link: '/history/shimonoseki',
                  },
                  { year: '1937', event: '皇民化運動開始', link: '/history/kominka' },
                  { year: '1940', event: '改姓名運動推行', link: '/history/kominka' },
                  { year: '1945', event: '日本投降，台灣光復', link: null },
                  { year: '1951', event: '舊金山和約簽訂', link: '/history/san-francisco' },
                  {
                    year: '1952',
                    event: '舊金山和約生效，日本正式放棄台灣',
                    link: '/history/san-francisco',
                  },
                ].map((item, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-10 w-4 h-4 bg-red-700 rounded-full border-4 border-white shadow"></div>
                    <div className="flex items-center">
                      <span className="font-bold text-red-800 w-16">{item.year}</span>
                      {item.link ? (
                        <Link
                          to={item.link}
                          className="text-stone-700 hover:text-red-700 transition-colors"
                        >
                          {item.event}
                        </Link>
                      ) : (
                        <span className="text-stone-700">{item.event}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Article Cards */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-stone-800 mb-6">專題文章</h2>
            <div className="grid gap-6 md:grid-cols-1">
              {historyArticles.map((article) => {
                const IconComponent = article.icon;
                return (
                  <Link
                    key={article.id}
                    to={article.path}
                    className="group bg-white rounded-xl p-6 shadow-sm border border-stone-200 hover:shadow-lg hover:border-red-200 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <IconComponent className="w-6 h-6 text-red-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            {article.year}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-1 group-hover:text-red-800 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-stone-500 mb-3">{article.subtitle}</p>
                        <p className="text-stone-600 text-sm leading-relaxed mb-3">
                          {article.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {article.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-stone-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* External Resources */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-4">外部資源</h2>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.th.gov.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  國史館台灣文獻館
                </a>
              </li>
              <li>
                <a
                  href="https://m.gamer.com.tw/home/creationDetail.php?sn=5844723"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  巴哈姆特：日治時期台灣人更改姓名活動及辦法
                </a>
              </li>
              <li>
                <a
                  href="https://zh.wikipedia.org/wiki/皇民化運動"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  維基百科：皇民化運動
                </a>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-red-900 text-white font-bold rounded-xl hover:bg-red-800 transition-colors shadow-lg"
            >
              <span className="mr-2">🏯</span>
              體驗姓名變換所
            </Link>
            <p className="text-stone-500 text-sm mt-4">探索您的姓氏在皇民化時期的日式對應</p>
          </div>

          {/* Footer */}
          <footer className="text-center mt-12 pt-6 border-t border-stone-200">
            <p className="text-stone-500 text-xs mb-3">本頁面僅供歷史教育用途</p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
              <Link to="/about" className="hover:text-red-700 transition-colors">
                關於本站
              </Link>
              <span className="text-stone-300">·</span>
              <a
                href="https://haotool.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-700 transition-colors"
              >
                好工具
              </a>
              <span className="text-stone-300">·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
