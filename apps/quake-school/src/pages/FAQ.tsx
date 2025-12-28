/**
 * FAQ Page
 * 常見問題
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // 地震知識
  {
    category: '地震知識',
    question: '什麼是地震？',
    answer:
      '地震是地球內部板塊運動或斷層活動所引起的地表震動。台灣位於環太平洋地震帶，歐亞板塊與菲律賓海板塊在此交會，因此地震頻繁。了解地震的成因有助於我們正確認識這個自然現象。',
  },
  {
    category: '地震知識',
    question: '地震的規模和震度有什麼不同？',
    answer:
      '規模（芮氏規模）表示地震釋放的能量大小，只有一個數值。震度則表示某個地點感受到的搖晃程度，同一地震在不同地點的震度會不同。距離震央越近，震度通常越大。',
  },
  // 防災準備
  {
    category: '防災準備',
    question: '家庭防災包應該準備什麼？',
    answer:
      '建議準備：飲用水（每人每天3公升，至少3天份）、乾糧、手電筒、電池、急救包、重要證件影本、現金（包含零錢）、保暖衣物、哨子、收音機、常用藥物、眼鏡備用等。定期檢查並更新過期物品。',
  },
  {
    category: '防災準備',
    question: '如何規劃家庭避難路線？',
    answer:
      '首先確認住家附近的避難場所位置（通常是學校、公園等空曠處），規劃從家中到避難場所的最短路線，並準備備用路線。與家人約定集合地點，確保每個成員都知道避難計畫。',
  },
  // 緊急應變
  {
    category: '緊急應變',
    question: '地震發生時該如何反應？',
    answer:
      '記住「趴下、掩護、穩住」三步驟：(1)趴下：降低重心，雙手雙膝著地。(2)掩護：找堅固的桌子或家具躲避，保護頭頸部。(3)穩住：抓住掩護物，等待震動結束。不要慌張奔跑或使用電梯。',
  },
  {
    category: '緊急應變',
    question: '地震時在不同場所該怎麼辦？',
    answer:
      '在室內：遠離窗戶和可能倒塌的家具，躲在桌下或牆角。在戶外：遠離建築物、電線桿和招牌，蹲下保護頭部。在車上：慢慢靠邊停車，留在車內，避開橋樑和高架道路。',
  },
  // 應用程式
  {
    category: '應用程式',
    question: '這個應用可以離線使用嗎？',
    answer:
      '可以！Quake-School 支援 PWA（漸進式網頁應用程式）技術。首次訪問後，您可以將網頁「加入主畫面」，之後即使沒有網路也能瀏覽所有防災知識和避難指南。',
  },
  {
    category: '應用程式',
    question: '如何將 Quake-School 加入手機主畫面？',
    answer:
      'iOS：使用 Safari 開啟網頁，點擊分享按鈕，選擇「加入主畫面」。Android：使用 Chrome 開啟網頁，點擊選單按鈕，選擇「加入主畫面」或「安裝應用程式」。',
  },
];

// 按類別分組
const groupedFAQ = faqData.reduce<Record<string, FAQItem[]>>((acc, item) => {
  const category = item.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category]?.push(item);
  return acc;
}, {});

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full py-4 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        type="button"
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
        )}
      </button>
      {isOpen && <div className="pb-4 text-gray-600 leading-relaxed">{item.answer}</div>}
    </div>
  );
}

export function Component() {
  return (
    <div className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">常見問題</h1>
          <p className="text-lg text-gray-600">
            關於地震防災的常見問題與解答，幫助您更好地了解如何保護自己和家人。
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-3xl mx-auto space-y-8">
          {Object.entries(groupedFAQ).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xl font-bold text-red-600 mb-4">{category}</h2>
              <div className="bg-white rounded-xl shadow-md px-6">
                {items.map((item, index) => (
                  <FAQAccordion key={index} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Component;
