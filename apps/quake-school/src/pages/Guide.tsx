/**
 * Guide Page
 * 防災指南
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { AlertTriangle, CheckCircle, Package, Phone, Radio } from 'lucide-react';

const beforeEarthquake = [
  '準備家庭防災包，定期檢查並更新內容物',
  '固定高大家具和書櫃，防止地震時傾倒',
  '確認瓦斯開關位置，學會緊急關閉方法',
  '規劃家庭避難路線和集合地點',
  '儲備至少 3 天份的飲用水和食物',
  '記錄重要聯絡電話和緊急聯絡人',
  '了解住家附近的避難場所位置',
  '參加社區防災演練，熟悉應變流程',
];

const duringEarthquake = [
  {
    title: '趴下 (Drop)',
    description: '立即降低重心，雙手雙膝著地，避免被震倒受傷。',
  },
  {
    title: '掩護 (Cover)',
    description: '躲到堅固的桌子下方，用雙手保護頭部和頸部。',
  },
  {
    title: '穩住 (Hold On)',
    description: '抓緊掩護物，等待地震結束，不要慌張移動。',
  },
];

const afterEarthquake = [
  '確認自己和家人是否受傷，必要時進行簡單急救',
  '檢查瓦斯、水電是否有洩漏或損壞',
  '如有火災，立即滅火或離開建築物',
  '避免使用電梯，走樓梯離開建築物',
  '收聽廣播獲取官方資訊，不要聽信謠言',
  '檢查建築物結構，有裂縫要避免進入',
  '準備好面對餘震，保持警覺',
  '幫助有需要的鄰居，特別是老人和小孩',
];

const emergencyKit = [
  { item: '飲用水', description: '每人每天 3 公升，至少準備 3 天份' },
  { item: '乾糧', description: '餅乾、罐頭、能量棒等不需烹煮的食物' },
  { item: '手電筒', description: '附備用電池，LED 款較省電' },
  { item: '急救包', description: '繃帶、消毒藥水、常用藥物' },
  { item: '收音機', description: '手搖式或電池式，接收官方訊息' },
  { item: '哨子', description: '受困時發出求救信號' },
  { item: '現金', description: '包含零錢，ATM 可能無法使用' },
  { item: '證件影本', description: '身分證、健保卡、護照影本' },
  { item: '保暖衣物', description: '毛毯、雨衣、備用衣物' },
  { item: '個人用品', description: '眼鏡、常用藥物、衛生用品' },
];

export function Component() {
  return (
    <div className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">地震防災指南</h1>
          <p className="text-lg text-gray-600">
            完整的地震防災知識，從事前準備到緊急應變， 幫助您和家人安全度過地震。
          </p>
        </div>

        {/* Before Earthquake */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">地震前：做好準備</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <ul className="space-y-3">
              {beforeEarthquake.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* During Earthquake */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">地震時：正確應變</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {duringEarthquake.map((step, index) => (
              <div
                key={index}
                className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">{step.title}</h3>
                <p className="text-gray-700">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* After Earthquake */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">地震後：安全確認</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <ul className="space-y-3">
              {afterEarthquake.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Emergency Kit */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">防災包清單</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {emergencyKit.map((kit, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-r border-gray-100 last:border-b-0 sm:odd:border-r sm:even:border-r-0"
                >
                  <h3 className="font-semibold text-gray-900">{kit.item}</h3>
                  <p className="text-sm text-gray-600">{kit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Emergency Numbers */}
        <section className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">緊急聯絡電話</h2>
          </div>
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">119</div>
                <div className="text-red-200">消防局 / 救護車</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">110</div>
                <div className="text-red-200">警察局</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">1999</div>
                <div className="text-red-200">市民服務專線</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Component;
