/**
 * 馬關條約歷史頁面 - FAQ SEO 頁面
 * [SEO Target Keywords]:
 * - 馬關條約
 * - 馬關條約強制續約
 * - 馬關續約
 * - 馬關條約改名
 * - 台灣割讓
 *
 * [Created: 2025-12-04]
 * [BDD: Green Light - SEO FAQ Page Implementation]
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink, Calendar, MapPin, FileText, Scale } from 'lucide-react';
import { SEOHelmet } from '../../components/SEOHelmet';

// FAQ 資料 - 馬關條約
const faqData = [
  {
    question: '什麼是馬關條約？',
    answer:
      '馬關條約（日語：下関条約，しものせきじょうやく）是1895年4月17日，清朝與日本在日本山口縣下關市（舊稱馬關）簽訂的和平條約，正式結束甲午戰爭。條約規定清朝將台灣、澎湖列島及遼東半島割讓給日本，並賠償白銀2億兩。這份條約開啟了台灣長達50年的日本殖民統治時期。',
  },
  {
    question: '馬關條約是在什麼背景下簽訂的？',
    answer:
      '1894年，清朝與日本因朝鮮問題爆發甲午戰爭。清朝在戰爭中節節敗退，北洋艦隊全軍覆沒。1895年初，日軍攻佔威海衛，清朝被迫派遣李鴻章赴日議和。在日本的軍事壓力下，清朝接受了喪權辱國的條款。',
  },
  {
    question: '馬關條約的主要內容是什麼？',
    answer:
      '馬關條約主要內容包括：1. 清朝承認朝鮮獨立；2. 割讓台灣、澎湖列島、遼東半島給日本；3. 賠償軍費白銀2億兩；4. 開放沙市、重慶、蘇州、杭州為通商口岸；5. 日本在通商口岸享有設廠製造權。後因俄、法、德三國干涉，日本歸還遼東半島，但索取3000萬兩「贖遼費」。',
  },
  {
    question: '台灣人對馬關條約有什麼反應？',
    answer:
      '馬關條約簽訂後，台灣官紳強烈反對割讓。1895年5月25日，台灣民主國成立，推舉唐景崧為總統，試圖以獨立國家身份抵抗日本接收。然而，日軍於5月29日登陸澳底，台灣民主國僅存在150天便瓦解。此後台灣各地仍有武裝抗日運動，持續至1915年西來庵事件後才逐漸平息。',
  },
  {
    question: '什麼是「馬關條約強制續約」或「馬關續約」？',
    answer:
      '「馬關條約強制續約」或「馬關續約」是網路上流傳的說法，指稱台灣在馬關條約中被「租借」而非「割讓」，租期為99年或50年，期滿後應歸還中國。但這是錯誤的歷史認知。馬關條約第二條明確寫明「永遠讓與日本」，是完全的主權移轉，並無任何租借或續約條款。台灣的地位變化是由1951年舊金山和約決定的。',
  },
  {
    question: '馬關條約對台灣有什麼長期影響？',
    answer:
      '馬關條約開啟台灣50年日本殖民統治，影響深遠：1. 政治：台灣成為日本第一個海外殖民地；2. 經濟：日本建設鐵路、港口、水利，發展糖業；3. 教育：推行日語教育，建立現代學校體系；4. 社會：戶籍制度、衛生制度現代化；5. 文化：皇民化運動改變部分台灣人的文化認同。',
  },
  {
    question: '馬關條約與改日本姓有什麼關係？',
    answer:
      '馬關條約本身並未涉及姓名問題。改日本姓（改姓名運動）是1937年皇民化運動開始後才推行的政策，距離馬關條約已有42年。但馬關條約確立了日本對台灣的殖民統治權，為後來的皇民化運動奠定了法律基礎。',
  },
  {
    question: '馬關條約何時失效？',
    answer:
      '1945年8月15日日本宣布投降，同年10月25日中華民國政府在台北舉行受降典禮，接收台灣。但馬關條約的正式廢止是在1952年4月28日《中日和約》（台北和約）生效時。該條約第四條規定：「茲承認中國與日本國間在1941年12月9日以前所締結之一切條約、專約及協定，均因戰爭結果而歸無效。」',
  },
  {
    question: '馬關條約的原件現在保存在哪裡？',
    answer:
      '馬關條約的日方原件保存於日本外務省外交史料館。中方原件原保存於北京，現藏於台北國立故宮博物院。條約簽訂地點——日本下關市的春帆樓，現已改建為「日清講和記念館」，展示相關歷史文物。',
  },
  {
    question: '如何查詢祖先在日治時期的姓名？',
    answer:
      '您可以透過以下管道查詢：1. 向戶政事務所申請日治時期舊戶籍謄本；2. 查閱國史館台灣文獻館的數位典藏；3. 詢問家中長輩是否保留相關文件。本網站的「姓名變換所」功能也能根據歷史文獻，查詢您的姓氏在皇民化時期可能對應的日式姓名。',
  },
];

export default function ShimonosekiTreaty() {
  return (
    <>
      <SEOHelmet
        title="馬關條約歷史 - 1895年台灣割讓與日本殖民統治的開端"
        description="深入了解1895年馬關條約的歷史背景、條約內容、台灣人的反應，以及對台灣50年殖民統治的深遠影響。破解「馬關續約」的錯誤迷思。"
        pathname="/history/shimonoseki/"
        keywords={[
          '馬關條約',
          '馬關條約強制續約',
          '馬關續約',
          '馬關條約改名',
          '台灣割讓',
          '甲午戰爭',
          '下關條約',
          '日治時期',
          '台灣歷史',
          '李鴻章',
          '台灣民主國',
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
              <span className="text-sm font-bold tracking-wider">1895年4月17日</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4 font-serif leading-tight">
              馬關條約歷史
              <span className="block text-xl md:text-2xl text-stone-600 mt-2 font-normal">
                台灣割讓與日本殖民統治的開端
              </span>
            </h1>
            <p className="text-stone-600 max-w-xl mx-auto">
              了解這份改變台灣命運的歷史條約，以及它對後續皇民化運動的影響
            </p>
          </header>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Calendar className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">1895</div>
              <div className="text-xs text-stone-500">簽訂年份</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <MapPin className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">下關</div>
              <div className="text-xs text-stone-500">簽訂地點</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <FileText className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">2億兩</div>
              <div className="text-xs text-stone-500">賠款金額</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Scale className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">50年</div>
              <div className="text-xs text-stone-500">殖民期間</div>
            </div>
          </div>

          {/* Myth Buster */}
          <section className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-amber-800 mb-3 flex items-center">
              <span className="mr-2">⚠️</span>
              破解迷思：「馬關條約強制續約」
            </h2>
            <p className="text-amber-900 leading-relaxed">
              網路上流傳「馬關條約是租借條約，期滿需續約」的說法是<strong>錯誤的</strong>。
              馬關條約第二條明確寫明台灣是「<strong>永遠讓與日本</strong>」，
              是完全的主權移轉，並無任何租借或續約條款。台灣的地位變化是由1951年舊金山和約決定的，
              而非任何虛構的「馬關續約」。
            </p>
          </section>

          {/* Introduction */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-red-800 mr-3" />
              <h2 className="text-xl font-bold text-stone-800">歷史背景</h2>
            </div>
            <div className="prose prose-stone max-w-none">
              <p className="text-stone-700 leading-relaxed mb-4">
                1894年，清朝與日本因朝鮮問題爆發甲午戰爭。這場戰爭徹底暴露了清朝「洋務運動」的失敗，
                北洋艦隊在黃海海戰中慘敗，威海衛陷落，清朝被迫求和。
              </p>
              <p className="text-stone-700 leading-relaxed mb-4">
                1895年3月，清朝派遣李鴻章赴日本下關（馬關）與日本首相伊藤博文談判。
                在日本的軍事壓力下，李鴻章被迫接受苛刻條款， 於4月17日簽訂了這份改變東亞格局的條約。
              </p>
              <p className="text-stone-700 leading-relaxed">
                馬關條約的簽訂，不僅標誌著清朝的衰敗， 也開啟了台灣長達50年的日本殖民統治時期，
                為後來的皇民化運動、改姓名政策埋下了伏筆。
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

          {/* Timeline */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6">重要時間軸</h2>
            <div className="space-y-4">
              {[
                { year: '1894', event: '甲午戰爭爆發' },
                { year: '1895/4/17', event: '馬關條約簽訂' },
                { year: '1895/5/25', event: '台灣民主國成立' },
                { year: '1895/10/21', event: '日軍佔領台南，台灣民主國瓦解' },
                { year: '1937', event: '皇民化運動開始' },
                { year: '1940', event: '改姓名運動推行' },
                { year: '1945', event: '日本投降，台灣光復' },
                { year: '1952', event: '中日和約生效，馬關條約正式廢止' },
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm font-bold text-red-800">{item.year}</div>
                  <div className="flex-1 text-stone-700">{item.event}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-4">延伸閱讀</h2>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/history/kominka/"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  皇民化運動歷史（1937-1945年）
                </Link>
              </li>
              <li>
                <Link
                  to="/history/san-francisco/"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  舊金山和約與台灣地位（1951年）
                </Link>
              </li>
              <li>
                <a
                  href="https://zh.wikipedia.org/wiki/馬關條約"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  維基百科：馬關條約
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
              <Link to="/about/" className="hover:text-red-700 transition-colors">
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
