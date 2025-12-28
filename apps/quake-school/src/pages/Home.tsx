/**
 * Home Page
 * 地震防災教室首頁
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, HelpCircle, Shield, Smartphone, Wifi } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: '地震知識',
    description: '了解地震的成因、類型和台灣的地震特性',
  },
  {
    icon: Shield,
    title: '防災準備',
    description: '家庭防災包準備清單和緊急聯絡方式',
  },
  {
    icon: AlertTriangle,
    title: '緊急應變',
    description: '地震發生時的正確反應和避難要點',
  },
  {
    icon: Smartphone,
    title: 'PWA 支援',
    description: '加入主畫面，隨時離線瀏覽防災資訊',
  },
];

export function Component() {
  return (
    <div className="py-8 sm:py-12">
      {/* Hero Section */}
      <section className="container mx-auto px-4 text-center mb-12">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Quake-School
            <br />
            <span className="text-red-600">地震防災教室</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8">
            台灣位於環太平洋地震帶，地震是我們必須面對的自然災害。
            <br className="hidden sm:block" />
            學習正確的防災知識，保護自己和家人的安全。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/guide/"
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <BookOpen className="w-5 h-5" aria-hidden="true" />
              開始學習防災知識
            </Link>
            <Link
              to="/faq/"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg font-medium border-2 border-red-600 hover:bg-red-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              常見問題
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">功能特色</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                <feature.icon className="w-6 h-6 text-red-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PWA Install Banner */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 sm:p-8 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wifi className="w-6 h-6" aria-hidden="true" />
            <span className="text-lg font-medium">離線也能使用</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3">將 Quake-School 加入主畫面</h2>
          <p className="text-red-100 mb-4 max-w-lg mx-auto">
            支援 PWA 技術，將網頁加入手機或電腦主畫面後，
            即使沒有網路也能瀏覽防災知識，隨時做好準備。
          </p>
        </div>
      </section>
    </div>
  );
}

export default Component;
