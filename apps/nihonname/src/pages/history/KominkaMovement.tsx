/**
 * 皇民化運動歷史頁面 - FAQ SEO 頁面
 * [SEO Target Keywords]:
 * - 皇民化改姓運動
 * - 皇民化運動
 * - 日治時期改名
 * - 改日本姓
 * - 台灣人改姓名單
 *
 * [Created: 2025-12-04]
 * [BDD: Green Light - SEO FAQ Page Implementation]
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink, Calendar, Users, FileText, Scale } from 'lucide-react';
import { SEOHelmet } from '../../components/SEOHelmet';

// FAQ 資料 - 皇民化運動
const faqData = [
  {
    question: '什麼是皇民化運動？',
    answer:
      '皇民化運動（日語：皇民化運動，こうみんかうんどう）是1937年至1945年間，日本殖民政府在台灣推行的同化政策。其目的是將台灣人「改造」成效忠日本天皇的「皇國臣民」，主要措施包括：廢止漢文報紙、推行日語教育、改日本姓名、參拜神社、廢止傳統宗教等。',
  },
  {
    question: '皇民化運動是從什麼時候開始的？',
    answer:
      '皇民化運動於1937年（昭和12年）正式展開，當時正值中日戰爭爆發。日本殖民政府為了動員台灣人支援戰爭，加速推動同化政策。運動持續至1945年日本戰敗投降為止，前後歷時約8年。',
  },
  {
    question: '改姓名（改日本姓）是強制的嗎？',
    answer:
      '改姓名（日語：改姓名，かいせいめい）採申請許可制，並非法律上的強制。但在當時的社會氛圍下，不改姓名者在升學、就業、配給物資等方面會受到歧視或不利待遇，因此許多台灣人家庭為了子女的前途而「自願」申請改姓。據統計，至1943年底約有7.6%的台灣人完成改姓。',
  },
  {
    question: '改姓的原則是什麼？',
    answer:
      '根據《内地式改姓名の仕方》等歷史文獻，改姓主要有三種原則：1. 語意翻譯（如：林→林 Hayashi、高→高山 Takayama）；2. 字形拆解（如：林→二木 Futaki、黃→共田 Tomoda）；3. 讀音近似（如：蔡→佐井 Sai、許→許田 Kyoda）。',
  },
  {
    question: '為什麼要推動改姓名運動？',
    answer:
      '日本殖民政府推動改姓名運動的主要目的有：1. 消除台灣人的民族認同，使其認同日本；2. 配合戰時動員，讓台灣人以「日本人」身份參與戰爭；3. 便於戶籍管理和社會控制；4. 作為「皇民化」程度的指標，用以評估同化政策的成效。',
  },
  {
    question: '改姓後原本的姓氏怎麼辦？',
    answer:
      '改姓後，原本的漢姓會從戶籍資料中刪除，改為日式姓名。但許多家庭會私下保留族譜或記錄，以便日後恢復。1945年日本戰敗後，國民政府接收台灣，大多數改過姓的台灣人都恢復了原本的漢姓。',
  },
  {
    question: '皇民化運動對台灣社會有什麼影響？',
    answer:
      '皇民化運動對台灣社會產生深遠影響：1. 語言方面：許多台灣人學會日語，至今仍有老一輩能說流利日語；2. 教育方面：日式教育體系影響台灣教育發展；3. 文化方面：部分日本文化元素融入台灣社會；4. 認同方面：造成部分台灣人的認同混淆，這個議題至今仍有討論。',
  },
  {
    question: '有多少台灣人改了日本姓？',
    answer:
      '根據歷史統計，至1943年底約有17萬戶（約7.6%）台灣人家庭完成改姓手續。到1945年戰爭結束時，估計約有2-3%的台灣人持有日本姓名。相較於朝鮮半島的「創氏改名」（約80%完成率），台灣的改姓比例相對較低。',
  },
  {
    question: '現在還能查到祖先改過的日本姓嗎？',
    answer:
      '部分歷史資料仍可查詢：1. 國史館台灣文獻館保存的日治時期戶籍資料；2. 各地戶政事務所的舊戶籍謄本；3. 家族保留的族譜或文件。本網站的「姓名變換所」功能也能根據歷史文獻，查詢您的姓氏在當時可能對應的日式姓名。',
  },
  {
    question: '皇民化運動與「志願兵制度」有什麼關係？',
    answer:
      '皇民化運動與志願兵制度密切相關。1942年日本開始在台灣實施「陸軍特別志願兵制度」，1943年實施「海軍特別志願兵制度」。改過日本姓名被視為「皇民化」程度較高的證明，在志願兵選拔中較有優勢。約有20萬台灣人以日本兵身份參與二戰。',
  },
];

export default function KominkaMovement() {
  return (
    <>
      <SEOHelmet
        title="皇民化運動歷史 - 1937-1945年台灣改姓名運動完整解析"
        description="深入了解1937-1945年日本殖民時期台灣皇民化運動的歷史背景、改姓原則、社會影響，以及如何查詢祖先的日本姓名。"
        pathname="/history/kominka"
        keywords={[
          '皇民化運動',
          '皇民化改姓運動',
          '日治時期改名',
          '改日本姓',
          '台灣人改姓名單',
          '日治時代改姓名單',
          '日本姓名',
          '台灣歷史',
          '日治時期',
          '改姓運動',
          '內地式改姓名',
        ]}
      />
      {/* [fix:2025-12-06] JSON-LD (faq, articleSchema, breadcrumbs) 已移至 vite.config.ts onPageRendered hook */}

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
            <div className="inline-flex items-center justify-center space-x-2 text-red-800 mb-4">
              <Calendar size={20} />
              <span className="text-sm font-bold tracking-wider">1937-1945</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4 font-serif leading-tight">
              皇民化運動歷史
              <span className="block text-xl md:text-2xl text-stone-600 mt-2 font-normal">
                台灣改姓名運動完整解析
              </span>
            </h1>
            <p className="text-stone-600 max-w-xl mx-auto">
              深入了解日本殖民時期的同化政策，探索台灣人改日本姓名的歷史脈絡
            </p>
          </header>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Calendar className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">8年</div>
              <div className="text-xs text-stone-500">運動期間</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Users className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">7.6%</div>
              <div className="text-xs text-stone-500">改姓比例</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <FileText className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">17萬</div>
              <div className="text-xs text-stone-500">改姓戶數</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Scale className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">3種</div>
              <div className="text-xs text-stone-500">改姓原則</div>
            </div>
          </div>

          {/* Introduction */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-red-800 mr-3" />
              <h2 className="text-xl font-bold text-stone-800">歷史背景</h2>
            </div>
            <div className="prose prose-stone max-w-none">
              <p className="text-stone-700 leading-relaxed mb-4">
                皇民化運動（日語：皇民化運動）是日本殖民政府在1937年至1945年間，於台灣推行的大規模同化政策。
                這項政策的目標是將台灣人「改造」成效忠日本天皇的「皇國臣民」，
                其中最具爭議性的措施之一就是「改姓名」運動。
              </p>
              <p className="text-stone-700 leading-relaxed mb-4">
                在這段歷史時期，許多台灣人家庭為了子女的升學、就業機會，
                或是為了避免社會歧視，而申請將漢姓改為日式姓名。
                雖然改姓並非法律強制，但在當時的社會壓力下， 這個「自願」的選擇往往帶有無奈的成分。
              </p>
              <p className="text-stone-700 leading-relaxed">
                本網站的「姓名變換所」功能，正是基於這段歷史，
                讓您能夠探索自己的姓氏在當時可能對應的日式姓名， 以此紀念並了解這段特殊的歷史時期。
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm mr-3">
                FAQ
              </span>
              常見問題
            </h2>
            <div className="space-y-6">
              {faqData.map((item, index) => (
                <article
                  key={index}
                  className="border-b border-stone-100 pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="font-bold text-stone-800 mb-3 text-lg">{item.question}</h3>
                  <p className="text-stone-600 leading-relaxed">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-4">延伸閱讀</h2>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/history/shimonoseki"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  馬關條約與台灣割讓（1895年）
                </Link>
              </li>
              <li>
                <Link
                  to="/history/san-francisco"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  舊金山和約與台灣地位（1951年）
                </Link>
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
                  href="https://www.th.gov.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  國史館台灣文獻館
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
            <p className="text-stone-500 text-xs mb-3">
              本頁面僅供歷史教育用途，資料來源詳見參考文獻
            </p>
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
