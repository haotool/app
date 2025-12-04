/**
 * FAQ Page - 常見問題
 * [Created: 2025-12-05] 整合 About 和 Guide 的 FAQ
 *
 * 參考: ratewise FAQ 頁面結構
 * SEO 優化: FAQPage Schema + 完整 FAQ 內容
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, BookOpen, History, Wrench } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';

// FAQ 資料分類
const faqCategories = [
  {
    id: 'history',
    title: '歷史背景',
    icon: History,
    items: [
      {
        question: '什麼是皇民化運動？',
        answer:
          '皇民化運動是1937-1945年間日本殖民政府在台灣推行的同化政策，包含推行日本語、改日本姓名、參拜神社等內容。這是日本殖民統治末期為了將台灣人「同化」為日本人所推行的政策。',
      },
      {
        question: '改姓是強制的嗎？',
        answer:
          '改姓採申請許可制，並非強制。但當時社會氛圍下，許多家庭為了子女升學、就業等現實考量而申請改姓。申請改姓需要符合一定條件，如「國語」（日語）能力、生活習慣等。',
      },
      {
        question: '改姓的原則是什麼？',
        answer:
          '主要有五種變異法：明示法（如林→小林）、拆字法（如林→二木）、同音法（如蔡→佐井）、郡望法（如陳→穎川）、暗示法（如柯→青山）。這些方法讓台灣人在改姓時能保留與原姓的某種連結。',
      },
      {
        question: '為什麼要了解這段歷史？',
        answer:
          '了解皇民化運動的歷史，可以幫助我們理解台灣在日治時期的社會變遷，以及當時人民面對殖民政策時的選擇與困境。這是台灣歷史的重要一頁。',
      },
    ],
  },
  {
    id: 'usage',
    title: '使用方法',
    icon: Wrench,
    items: [
      {
        question: '如何使用日本名字產生器？',
        answer:
          '只需在輸入框中輸入你的中文姓氏，系統會自動根據歷史文獻匹配對應的日文姓氏。點擊「名字」區域可以隨機產生有趣的諧音梗名字。',
      },
      {
        question: '為什麼我的姓氏找不到對應的日文姓氏？',
        answer:
          '目前資料庫收錄了約 90+ 個台灣常見姓氏的對應日文姓氏，共計 1,700+ 筆對照記錄。如果你的姓氏較為罕見，可能暫時沒有收錄。歡迎透過 About 頁面聯繫我們補充。',
      },
      {
        question: '諧音梗名字是怎麼產生的？',
        answer:
          '我們收集了約 500 個有趣的諧音梗日文名字，這些名字的日文發音與中文、台語或其他語言的詞彙相似，產生有趣的雙關效果。',
      },
      {
        question: '自訂的諧音梗名字會保存在哪裡？',
        answer:
          '自訂的諧音梗名字會儲存在你的瀏覽器 localStorage 中，不會上傳到伺服器。清除瀏覽器資料會同時清除這些自訂名字。',
      },
      {
        question: '可以用這個名字當作正式的日本名字嗎？',
        answer:
          '這個產生器主要是娛樂用途，產生的諧音梗名字可能不適合正式場合。如果需要正式的日本名字，建議諮詢專業的翻譯或命名服務。',
      },
    ],
  },
  {
    id: 'data',
    title: '資料來源',
    icon: BookOpen,
    items: [
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
      {
        question: '資料準確性如何？',
        answer:
          '所有資料皆經過歷史文獻交叉比對，並標註來源。每筆姓氏對照都可以展開查看詳細的來源與變異法說明，確保資料的可追溯性。',
      },
      {
        question: '為什麼有些姓氏有多個日本姓氏對應？',
        answer:
          '這是歷史真實情況。改姓採申請制，同一漢姓可根據不同變異法（明示法、拆字法、同音法等）改為不同的日本姓氏。例如「林」可改為「小林」（明示法）或「二木」（拆字法）。',
      },
      {
        question: '如何確認結果的準確性？',
        answer:
          '每筆姓氏對照都可以展開查看「來源說明」，包含變異法分類（如明示法、拆字法）及歷史文獻引用。你可以點擊「顯示來源」查看詳細資料。',
      },
    ],
  },
  {
    id: 'privacy',
    title: '隱私與技術',
    icon: HelpCircle,
    items: [
      {
        question: '我的資料會被上傳到伺服器嗎？',
        answer:
          '完全不會。所有資料（自訂諧音名、瀏覽紀錄）都儲存在你的瀏覽器 localStorage，不會傳送到任何伺服器。我們無法存取你的個人資料。',
      },
      {
        question: '這個生成器可以離線使用嗎？',
        answer:
          '可以！本應用支援 PWA (Progressive Web App) 技術。首次訪問後，你可以將網頁「加入主畫面」，之後即可離線使用姓氏查詢功能。',
      },
      {
        question: '瀏覽器不支援怎麼辦？',
        answer:
          '本應用建議使用現代瀏覽器（Chrome, Firefox, Safari, Edge 最新版）。如遇到顯示或功能問題，請嘗試更新瀏覽器或清除快取後重新載入。',
      },
    ],
  },
];

// 將所有 FAQ 項目扁平化為 SEO 用的格式
const allFaqItems = faqCategories.flatMap((category) => category.items);

export default function FAQ() {
  return (
    <>
      <SEOHelmet
        title="常見問題 FAQ - 皇民化改姓生成器"
        description="皇民化改姓生成器常見問題解答：了解皇民化運動歷史背景、改姓原則、使用方法、資料來源等完整說明。"
        pathname="/faq"
        keywords={[
          '皇民化運動 FAQ',
          '日本名字產生器常見問題',
          '改姓原則說明',
          '日治時期改姓',
          '台灣歷史教育',
        ]}
        faq={allFaqItems}
        breadcrumbs={[
          { name: '首頁', url: '/' },
          { name: '常見問題', url: '/faq' },
        ]}
      />

      <div className="min-h-[100dvh] h-auto bg-stone-100 py-8 md:py-12 px-4 overflow-y-auto overflow-x-hidden">
        <div className="max-w-3xl mx-auto pb-8">
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-red-800" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4 font-serif">
              常見問題
            </h1>
            <p className="text-stone-600">關於皇民化改姓生成器的所有疑問解答</p>
          </header>

          {/* Quick Navigation */}
          <nav className="mb-8 p-4 bg-white rounded-xl shadow-sm">
            <h2 className="text-sm font-bold text-stone-500 mb-3 uppercase tracking-wider">
              快速導航
            </h2>
            <div className="flex flex-wrap gap-2">
              {faqCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="inline-flex items-center px-3 py-2 text-sm text-stone-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <category.icon size={16} className="mr-2" />
                  {category.title}
                </a>
              ))}
            </div>
          </nav>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="bg-white rounded-xl p-6 shadow-sm scroll-mt-20"
              >
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <category.icon className="w-5 h-5 text-red-800" />
                  </div>
                  <h2 className="text-xl font-bold text-stone-800">{category.title}</h2>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, index) => (
                    <details
                      key={index}
                      className="group border border-stone-200 rounded-lg overflow-hidden"
                    >
                      <summary className="cursor-pointer p-4 bg-stone-50 hover:bg-red-50 transition-colors flex items-center justify-between">
                        <span className="font-medium text-stone-800 pr-4">{item.question}</span>
                        <span className="flex-shrink-0 text-stone-400 group-open:rotate-180 transition-transform">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </span>
                      </summary>
                      <div className="p-4 bg-white border-t border-stone-200">
                        <p className="text-stone-600 leading-relaxed">{item.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Related Links */}
          <div className="mt-12 p-6 bg-red-50 rounded-xl">
            <h2 className="text-lg font-bold text-red-900 mb-4">相關頁面</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/guide"
                className="flex items-center p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Wrench size={20} className="text-red-700 mr-3" />
                <div>
                  <div className="font-medium text-stone-800">使用指南</div>
                  <div className="text-xs text-stone-500">8 步驟完整教學</div>
                </div>
              </Link>
              <Link
                to="/about"
                className="flex items-center p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <BookOpen size={20} className="text-red-700 mr-3" />
                <div>
                  <div className="font-medium text-stone-800">關於本站</div>
                  <div className="text-xs text-stone-500">歷史背景與資料來源</div>
                </div>
              </Link>
              <Link
                to="/history"
                className="flex items-center p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <History size={20} className="text-red-700 mr-3" />
                <div>
                  <div className="font-medium text-stone-800">歷史專區</div>
                  <div className="text-xs text-stone-500">深入了解皇民化運動</div>
                </div>
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-red-800 text-white font-bold rounded-lg hover:bg-red-900 transition-colors shadow-lg"
            >
              開始產生日本名字
            </Link>
          </div>

          {/* Footer */}
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
