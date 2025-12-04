/**
 * 舊金山和約歷史頁面 - FAQ SEO 頁面
 * [SEO Target Keywords]:
 * - 舊金山和約
 * - 舊金山和約台灣
 * - 台灣地位
 * - 日本放棄台灣
 *
 * [Created: 2025-12-04]
 * [BDD: Green Light - SEO FAQ Page Implementation]
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink, Calendar, Globe, FileText, Users } from 'lucide-react';
import { SEOHelmet } from '../../components/SEOHelmet';

// FAQ 資料 - 舊金山和約
const faqData = [
  {
    question: '什麼是舊金山和約？',
    answer:
      '舊金山和約（英語：Treaty of San Francisco），正式名稱為《對日和平條約》，是1951年9月8日由48個國家與日本在美國舊金山簽訂的和平條約。該條約於1952年4月28日生效，正式結束了第二次世界大戰中同盟國與日本的戰爭狀態，並確定了戰後日本的領土範圍。',
  },
  {
    question: '舊金山和約與台灣有什麼關係？',
    answer:
      '舊金山和約第二條規定：「日本放棄對台灣及澎湖列島的一切權利、權利名義與要求。」這是日本正式放棄台灣主權的法律依據。然而，條約並未明確指定台灣的接收國，這成為日後「台灣地位未定論」的重要法律基礎。',
  },
  {
    question: '為什麼中華民國沒有簽署舊金山和約？',
    answer:
      '1951年簽約時，中華民國政府已遷台，而中華人民共和國剛成立。英國承認中華人民共和國，美國承認中華民國，兩國對於誰代表「中國」無法達成共識。為避免爭議，最終決定不邀請任何一方參加和會。中華民國後於1952年另與日本簽訂《中日和約》（台北和約）。',
  },
  {
    question: '什麼是「台灣地位未定論」？',
    answer:
      '「台灣地位未定論」是一種法律見解，認為舊金山和約只規定日本「放棄」台灣，但未指定接收國，因此台灣的主權歸屬在國際法上仍未確定。支持此論點者認為，台灣的最終地位應由台灣人民自決。反對者則認為，《開羅宣言》、《波茨坦公告》及中華民國的實際統治已確立台灣屬於中國。',
  },
  {
    question: '舊金山和約生效後，日本人在台灣的地位如何變化？',
    answer:
      '1952年舊金山和約生效後，在台灣的日本人正式失去日本國籍（就台灣而言），需選擇離開或申請中華民國國籍。大多數日本人選擇遣返日本。同時，原本持有日本國籍的台灣人，其國籍問題也在《中日和約》中處理，多數被認定為中華民國國籍。',
  },
  {
    question: '舊金山和約與皇民化運動有什麼關係？',
    answer:
      '舊金山和約標誌著日本對台灣殖民統治的法律終結。在此之前的皇民化運動（1937-1945）期間，許多台灣人被迫或自願改為日本姓名。和約生效後，這些改過日本姓名的台灣人，其姓名在法律上恢復為原本的漢姓，日本姓名不再具有官方效力。',
  },
  {
    question: '舊金山和約對台灣改姓名者有什麼影響？',
    answer:
      '舊金山和約生效後，皇民化時期改過日本姓名的台灣人，在戶籍上恢復使用原本的漢姓。日本姓名成為歷史記錄，不再具有法律效力。然而，這段改姓經歷仍保留在舊戶籍資料中，後人可透過申請舊戶籍謄本查詢祖先的日本姓名。',
  },
  {
    question: '舊金山和約的簽約國有哪些？',
    answer:
      '舊金山和約由48個國家與日本簽訂。主要簽約國包括美國、英國、法國、澳洲、紐西蘭、加拿大、菲律賓、印尼等。蘇聯、波蘭、捷克斯洛伐克雖出席和會但拒絕簽字。中華民國和中華人民共和國均未受邀參加。印度和緬甸則選擇不出席。',
  },
  {
    question: '舊金山和約何時生效？',
    answer:
      '舊金山和約於1951年9月8日簽訂，1952年4月28日正式生效。日本將4月28日定為「主權恢復日」，紀念該條約生效、日本恢復主權的日子。然而，沖繩和小笠原群島直到1970年代才由美國歸還日本。',
  },
  {
    question: '如何查詢祖先在皇民化時期的日本姓名？',
    answer:
      '您可以透過以下方式查詢：1. 向戶政事務所申請日治時期舊戶籍謄本；2. 查閱國史館台灣文獻館的數位典藏；3. 詢問家中長輩是否保留相關文件。本網站的「姓名變換所」功能也能根據歷史文獻，查詢您的姓氏在皇民化時期可能對應的日式姓名。',
  },
];

// Article Schema JSON-LD
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '舊金山和約歷史 - 1951年台灣地位與日本放棄主權的法律依據',
  description:
    '深入了解1951年舊金山和約的歷史背景、條約內容、對台灣地位的影響，以及與皇民化改姓運動的關係。',
  author: {
    '@type': 'Organization',
    name: 'haotool',
    url: 'https://haotool.org',
  },
  publisher: {
    '@type': 'Organization',
    name: 'haotool',
    logo: {
      '@type': 'ImageObject',
      url: 'https://app.haotool.org/nihonname/icons/icon-512x512.png',
    },
  },
  datePublished: '2025-12-04',
  dateModified: '2025-12-04',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://app.haotool.org/nihonname/history/san-francisco',
  },
  image: 'https://app.haotool.org/nihonname/og-image.png',
  keywords: [
    '舊金山和約',
    '對日和平條約',
    '台灣地位',
    '日本放棄台灣',
    '台灣地位未定論',
    '中日和約',
  ],
};

export default function SanFranciscoTreaty() {
  return (
    <>
      <SEOHelmet
        title="舊金山和約歷史 - 1951年台灣地位與日本放棄主權的法律依據"
        description="深入了解1951年舊金山和約的歷史背景、條約內容、對台灣地位的影響，以及與皇民化改姓運動的關係。"
        pathname="/history/san-francisco"
        keywords={[
          '舊金山和約',
          '對日和平條約',
          '台灣地位',
          '日本放棄台灣',
          '台灣地位未定論',
          '中日和約',
          '台北和約',
          '日治時期',
          '台灣歷史',
          '皇民化運動',
        ]}
        faq={faqData}
        jsonLd={articleSchema}
        breadcrumbs={[
          { name: '首頁', url: '/' },
          { name: '歷史專區', url: '/history' },
          { name: '舊金山和約', url: '/history/san-francisco' },
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
            <div className="inline-flex items-center justify-center space-x-2 text-red-800 mb-4">
              <Calendar size={20} />
              <span className="text-sm font-bold tracking-wider">1951年9月8日</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4 font-serif leading-tight">
              舊金山和約歷史
              <span className="block text-xl md:text-2xl text-stone-600 mt-2 font-normal">
                台灣地位與日本放棄主權的法律依據
              </span>
            </h1>
            <p className="text-stone-600 max-w-xl mx-auto">
              了解這份結束二戰、決定台灣命運的重要國際條約
            </p>
          </header>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Calendar className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">1951</div>
              <div className="text-xs text-stone-500">簽訂年份</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Globe className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">舊金山</div>
              <div className="text-xs text-stone-500">簽訂地點</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <Users className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">48國</div>
              <div className="text-xs text-stone-500">簽約國家</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-200">
              <FileText className="w-6 h-6 mx-auto text-red-700 mb-2" />
              <div className="text-2xl font-bold text-stone-800">第2條</div>
              <div className="text-xs text-stone-500">台灣條款</div>
            </div>
          </div>

          {/* Key Point */}
          <section className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">📜</span>
              條約第二條原文
            </h2>
            <blockquote className="text-blue-900 leading-relaxed italic border-l-2 border-blue-300 pl-4">
              &ldquo;Japan renounces all right, title and claim to Formosa and the
              Pescadores.&rdquo;
              <br />
              <span className="text-sm not-italic">
                「日本放棄對台灣及澎湖列島的一切權利、權利名義與要求。」
              </span>
            </blockquote>
          </section>

          {/* Introduction */}
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-stone-200">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-red-800 mr-3" />
              <h2 className="text-xl font-bold text-stone-800">歷史背景</h2>
            </div>
            <div className="prose prose-stone max-w-none">
              <p className="text-stone-700 leading-relaxed mb-4">
                1945年8月15日，日本宣布無條件投降，第二次世界大戰結束。
                然而，戰後的和平條約談判因冷戰對立而延宕多年。
                直到1951年，在美國主導下，終於召開舊金山和會。
              </p>
              <p className="text-stone-700 leading-relaxed mb-4">
                舊金山和約是戰後國際秩序重建的重要文件。
                對台灣而言，這份條約確立了日本放棄台灣主權的法律依據，
                但也因未明確指定接收國，留下了「台灣地位」的爭議空間。
              </p>
              <p className="text-stone-700 leading-relaxed">
                和約生效後，皇民化時期改過日本姓名的台灣人，
                其日本姓名在法律上失去效力，恢復使用原本的漢姓。
                這段歷史，正是本網站「姓名變換所」功能所要探索的主題。
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
            <h2 className="text-xl font-bold text-stone-800 mb-6">相關時間軸</h2>
            <div className="space-y-4">
              {[
                { year: '1895', event: '馬關條約：日本取得台灣主權' },
                { year: '1937-1945', event: '皇民化運動：改姓名政策推行' },
                { year: '1945/8/15', event: '日本投降' },
                { year: '1945/10/25', event: '台灣光復，中華民國接收台灣' },
                { year: '1951/9/8', event: '舊金山和約簽訂' },
                { year: '1952/4/28', event: '舊金山和約生效，日本正式放棄台灣' },
                { year: '1952/4/28', event: '中日和約（台北和約）簽訂' },
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-28 text-sm font-bold text-red-800">{item.year}</div>
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
                  to="/history/kominka"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  皇民化運動歷史（1937-1945年）
                </Link>
              </li>
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
                <a
                  href="https://zh.wikipedia.org/wiki/舊金山和約"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  維基百科：舊金山和約
                </a>
              </li>
              <li>
                <a
                  href="https://zh.wikipedia.org/wiki/中日和約"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-red-700 hover:text-red-900 transition-colors"
                >
                  <ExternalLink size={14} className="mr-2" />
                  維基百科：中日和約（台北和約）
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
