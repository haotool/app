/**
 * About Page
 * 關於 Quake-School
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { Heart, Shield, BookOpen, Users } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: '安全第一',
    description: '我們致力於提供最準確、最實用的防災資訊，幫助每個人在災害來臨時做好準備。',
  },
  {
    icon: BookOpen,
    title: '知識普及',
    description: '透過淺顯易懂的方式，讓防災知識不再艱澀，人人都能輕鬆學習。',
  },
  {
    icon: Users,
    title: '社區互助',
    description: '鼓勵社區建立互助機制，讓防災成為全民參與的行動。',
  },
  {
    icon: Heart,
    title: '永續免費',
    description: 'Quake-School 承諾永遠免費提供服務，讓防災教育沒有門檻。',
  },
];

export function Component() {
  return (
    <div className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">關於 Quake-School</h1>
          <p className="text-lg text-gray-600">
            我們的使命是讓每一個台灣人都能擁有足夠的地震防災知識，
            在災害來臨時保護自己和家人的安全。
          </p>
        </div>

        {/* Mission Section */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">我們的使命</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                台灣位於環太平洋地震帶，地震是我們生活中不可避免的自然現象。
                然而，許多人對於地震防災的認知仍然不足，導致在災害發生時無法做出正確的反應。
              </p>
              <p>
                Quake-School 地震防災教室的誕生，就是為了解決這個問題。
                我們整合了來自中央氣象署、內政部消防署等官方單位的防災資訊，
                以及國內外的防災教育經驗，打造一個完整、易懂、離線可用的防災教育平台。
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">我們的價值</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <value.icon className="w-6 h-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto">
          <div className="bg-red-50 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">聯絡我們</h2>
            <p className="text-gray-600 mb-4">如果您有任何問題、建議或合作提案，歡迎與我們聯繫。</p>
            <a
              href="mailto:haotool.org@gmail.com"
              className="inline-flex items-center justify-center bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              haotool.org@gmail.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Component;
