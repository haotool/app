/**
 * About page for NihonName
 * Historical context and attribution
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Github, ExternalLink } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';

const faqData = [
  {
    question: '什麼是皇民化運動？',
    answer:
      '皇民化運動是1937-1945年間日本殖民政府在台灣推行的同化政策，包含推行日本語、改日本姓名、參拜神社等內容。',
  },
  {
    question: '改姓是強制的嗎？',
    answer:
      '改姓採申請許可制，並非強制。但當時社會氛圍下，許多家庭為了子女升學、就業等現實考量而申請改姓。',
  },
  {
    question: '改姓的原則是什麼？',
    answer:
      '主要有五種變異法：明示法（如林→小林）、拆字法（如林→二木）、同音法（如蔡→佐井）、郡望法（如陳→穎川）、暗示法（如柯→青山）。',
  },
  {
    question: '資料來源是什麼？',
    answer:
      '本系統整合多方歷史文獻：國史館臺灣文獻館檔案、吳秀環論文、劉正元論文、《內地式改姓名の仕方》及田野調查，涵蓋超過 90 個漢姓、1,700+ 筆對照記錄。',
  },
  {
    question: '資料庫有多少筆記錄？',
    answer:
      '目前資料庫收錄 90+ 個台灣常見漢姓，共計 1,700+ 筆日本姓氏對照記錄，每筆記錄皆標註變異法說明與歷史來源。',
  },
];

export default function About() {
  return (
    <>
      <SEOHelmet
        title="關於皇民化改姓生成器"
        description="了解1940年代台灣皇民化運動的歷史背景、改姓原則與本系統的資料來源。"
        pathname="/about"
        keywords={['皇民化運動', '日治時期歷史', '台灣歷史', '改姓運動', '內地式改姓名']}
        faq={faqData}
        breadcrumbs={[
          { name: '首頁', url: '/' },
          { name: '關於', url: '/about' },
        ]}
      />

      {/* [fix:2025-12-04] 確保 About 頁面可以正常捲動 */}
      <div className="min-h-[100dvh] h-auto bg-stone-100 py-8 md:py-12 px-4 overflow-y-auto overflow-x-hidden">
        <div className="max-w-2xl mx-auto pb-8">
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
            <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4 font-serif">
              關於皇民化改姓生成器
            </h1>
            <p className="text-stone-600">探索1940年代台灣的歷史記憶</p>
          </header>

          {/* Content sections */}
          <div className="space-y-8">
            {/* Historical Background */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <BookOpen className="w-6 h-6 text-red-800 mr-3" />
                <h2 className="text-xl font-bold text-stone-800">歷史背景</h2>
              </div>
              <div className="prose prose-stone">
                <p>
                  1940年代的台灣正處於日本殖民統治末期，皇民化運動達到高峰。
                  作為同化政策的一環，日本政府開放台灣人申請「改姓名」，
                  將原有的漢姓名改為日式姓名。
                </p>
                <p>
                  本系統依據歷史文獻，重現當時的改姓對照關係， 讓後人得以一窺這段特殊的歷史時期。
                </p>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-stone-800 mb-6">常見問題</h2>
              <div className="space-y-6">
                {faqData.map((item, index) => (
                  <div key={index} className="border-b border-stone-100 pb-4 last:border-0">
                    <h3 className="font-bold text-stone-800 mb-2">{item.question}</h3>
                    <p className="text-stone-600 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Attribution */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-stone-800 mb-4">資料來源</h2>
              <p className="text-stone-600 text-sm mb-4">
                本系統整合多方歷史文獻，每筆姓氏對照皆可展開查看詳細來源與變異法說明。
              </p>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="https://home.gamer.com.tw/creationDetail.php?sn=5844723"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    【歷史說書】日治時期台灣人更改姓名活動及辦法
                  </a>
                </li>
                <li>
                  <a
                    href="https://home.gamer.com.tw/creationDetail.php?sn=2850704"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    日治時代改姓資料整理──取日文姓氏的參考
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.th.gov.tw/CP-218-218-1d8a9-1.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    臺灣總督府檔案事典 - 國史館臺灣文獻館
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.airitilibrary.com/Publication/alDetailedMesh?DocID=1018327X-200912-200912300004-200912300004-1-18"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    性別與改姓名：日治時期的改姓名實例分析
                  </a>
                </li>
                <li className="text-stone-600">《内地式改姓名の仕方》- 宮山豐源、廣田藤雄 著</li>
                <li className="text-stone-600">田野調查與口述歷史</li>
              </ul>
            </section>

            {/* Developer Info */}
            <section className="bg-stone-800 text-stone-100 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">開發者</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-stone-400">開發：</span>
                  <a
                    href="https://haotool.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    haotool
                  </a>
                </p>
                <p>
                  <span className="text-stone-400">作者：</span>
                  <a
                    href="https://www.threads.com/@azlife_1224/post/DR2NCeEj6Fo?xmt=AQF0K8pg5PLpzoBz7nnYMEI2CdxVzs2pUyIJHabwZWeYCw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    Threads：azlife_1224
                  </a>
                </p>
                <p className="pt-2">
                  <a
                    href="https://github.com/haotool/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-stone-300 hover:text-white transition-colors"
                  >
                    <Github size={16} className="mr-2" />
                    開源專案
                  </a>
                </p>
              </div>
            </section>
          </div>

          {/* Footer - 日式簡約風格 */}
          <footer className="text-center mt-12 pt-6 border-t border-stone-200">
            <p className="text-stone-500 text-xs mb-3">本系統僅供歷史教育與娛樂用途</p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
              <a
                href="https://haotool.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-700 transition-colors"
              >
                好工具
              </a>
              <span className="text-stone-300">·</span>
              <a
                href="https://www.threads.com/@azlife_1224/post/DR2NCeEj6Fo?xmt=AQF0K8pg5PLpzoBz7nnYMEI2CdxVzs2pUyIJHabwZWeYCw"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-700 transition-colors"
              >
                @azlife_1224
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
