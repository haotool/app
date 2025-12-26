/**
 * Christmas Greetings - Random Messages
 * @file christmas-greetings.ts
 * @description 20 種有趣可愛的聖誕祝福訊息
 *
 * 功能：
 * - 提供多樣化的聖誕祝福
 * - 隨機選擇機制
 * - 包含表情符號增加趣味性
 */

/**
 * 20 種有趣可愛的聖誕祝福訊息
 */
export const CHRISTMAS_GREETINGS = [
  '🎄 聖誕快樂！願你的匯率永遠划算！',
  '🎅 Santa 說：今天換匯特別準！',
  '⛄ 雪人提醒：記得比較匯率喔！',
  '🎁 聖誕禮物：免手續費的好匯率！',
  '✨ 聖誕魔法：讓你的錢包更鼓！',
  '🌟 聖誕之星：照亮最佳匯率之路！',
  '🔔 叮叮噹～匯率更新囉！',
  '🎊 歡慶聖誕！理財從匯率開始！',
  '🦌 麋鹿說：跟著趨勢走準沒錯！',
  '🎀 聖誕驚喜：今日匯率超給力！',
  '❄️ 白色聖誕：清晰透明的匯率資訊！',
  '🍪 薑餅人：甜蜜的匯率好滋味！',
  '🎺 天使報佳音：匯率趨勢看這裡！',
  '🕯️ 平安夜：換匯也要安心喔！',
  '🎵 聖誕歌聲：匯率波動像旋律～',
  '🧦 聖誕襪：裝滿省錢的好匯率！',
  '🎨 聖誕彩燈：照亮你的理財之路！',
  '🌲 聖誕樹說：長按我就關閉動畫囉！',
  '💝 聖誕愛心：用最好的匯率傳遞祝福！',
  '🎉 新年將至：提前祝你財源滾滾！',
] as const;

/**
 * 隨機選擇一則聖誕祝福
 * @returns 隨機的聖誕祝福訊息
 */
export function getRandomChristmasGreeting(): string {
  const randomIndex = Math.floor(Math.random() * CHRISTMAS_GREETINGS.length);
  return CHRISTMAS_GREETINGS[randomIndex] ?? CHRISTMAS_GREETINGS[0];
}
