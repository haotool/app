/**
 * CSV 諧音梗資料處理腳本
 *
 * 功能：
 * 1. 讀取三個 CSV 檔案
 * 2. 解析並清洗資料
 * 3. 去重
 * 4. 產生 TypeScript 格式的諧音梗資料
 *
 * 使用方式：node scripts/process-csv-puns.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV 檔案路徑
const CSV_FILES = [
  '/Users/azlife.eth/Downloads/taiwan_jp_pun_names_320.csv',
  '/Users/azlife.eth/Downloads/taiwan_japanese_puns.csv',
  '/Users/azlife.eth/Downloads/taiwan_japanese_name_puns.csv',
];

// 分類對照表
const CATEGORY_MAP = {
  國語: 'classic',
  台語: 'taiwanese',
  粵語: 'cantonese',
  'Mandarin pun': 'classic',
  'Taiwanese pun': 'taiwanese',
  'Cantonese pun': 'cantonese',
  '人名/日常': 'life',
  '人名/窮忙': 'wealth',
  '人名/購物': 'life',
  '人名/發票': 'life',
  '人名/吐槽': 'classic',
  '人名/黑色幽默': 'classic',
  '人名/誇張': 'classic',
  '人名/台語': 'taiwanese',
  '人名/食物': 'food',
  '人名/節慶': 'life',
  '人名/運動': 'life',
  '人名/飲料': 'food',
  '人名/身份': 'life',
  '人名/金錢': 'wealth',
  '人名/交通': 'life',
  '人名/動物': 'nature',
  '人名/房產': 'life',
  '人名/地名': 'place',
  '人名/情緒': 'life',
  '人名/提醒': 'life',
  日常: 'life',
  職場: 'life',
  天氣: 'nature',
  交通: 'life',
  金錢: 'wealth',
  飲料: 'food',
  遊戲: 'internet',
  食物: 'food',
  娛樂: 'internet',
  睡眠: 'life',
  日文: 'common',
};

// 簡易漢字到羅馬拼音對照表 (擴充版)
const KANJI_TO_ROMAJI = {
  // 常見姓氏
  田: 'Ta',
  中: 'Naka',
  山: 'Yama',
  川: 'Kawa',
  本: 'Moto',
  木: 'Ki',
  林: 'Hayashi',
  森: 'Mori',
  村: 'Mura',
  井: 'I',
  石: 'Ishi',
  野: 'No',
  原: 'Hara',
  藤: 'Fuji',
  佐: 'Sa',
  伊: 'I',
  加: 'Ka',
  松: 'Matsu',
  竹: 'Take',
  梅: 'Ume',
  花: 'Hana',
  月: 'Tsuki',
  日: 'Hi',
  星: 'Hoshi',
  空: 'Sora',
  海: 'Umi',
  島: 'Shima',
  高: 'Taka',
  小: 'Ko',
  大: 'Ō',
  長: 'Naga',
  上: 'Ue',
  下: 'Shita',
  東: 'Higashi',
  西: 'Nishi',
  南: 'Minami',
  北: 'Kita',
  内: 'Uchi',
  外: 'Soto',
  前: 'Mae',
  後: 'Ato',
  新: 'Shin',
  古: 'Furu',
  白: 'Shiro',
  黒: 'Kuro',
  赤: 'Aka',
  青: 'Ao',
  金: 'Kin',
  銀: 'Gin',
  鉄: 'Tetsu',
  水: 'Mizu',
  火: 'Hi',
  風: 'Kaze',
  雷: 'Rai',
  雪: 'Yuki',
  桜: 'Sakura',
  菊: 'Kiku',
  蓮: 'Ren',
  葉: 'Ha',
  草: 'Kusa',
  根: 'Ne',
  枝: 'Eda',
  // 數字
  一: 'Ichi',
  二: 'Ni',
  三: 'San',
  四: 'Shi',
  五: 'Go',
  六: 'Roku',
  七: 'Nana',
  八: 'Hachi',
  九: 'Kyū',
  十: 'Jū',
  百: 'Hyaku',
  千: 'Sen',
  万: 'Man',
  // 常見名字用字
  子: 'Ko',
  男: 'Otoko',
  女: 'Onna',
  人: 'Hito',
  王: 'Ō',
  国: 'Kuni',
  城: 'Shiro',
  寺: 'Tera',
  神: 'Kami',
  仏: 'Hotoke',
  天: 'Ten',
  地: 'Chi',
  心: 'Kokoro',
  愛: 'Ai',
  美: 'Mi',
  幸: 'Sachi',
  福: 'Fuku',
  吉: 'Kichi',
  正: 'Masa',
  真: 'Ma',
  太: 'Ta',
  郎: 'Rō',
  助: 'Suke',
  介: 'Suke',
  平: 'Hei',
  治: 'Ji',
  明: 'Aki',
  光: 'Hikari',
  輝: 'Teru',
  和: 'Kazu',
  安: 'Yasu',
  康: 'Yasu',
  健: 'Ken',
  勇: 'Yū',
  智: 'Tomo',
  賢: 'Ken',
  徳: 'Toku',
  義: 'Yoshi',
  信: 'Nobu',
  忠: 'Tada',
  孝: 'Taka',
  夏: 'Natsu',
  冬: 'Fuyu',
  春: 'Haru',
  秋: 'Aki',
  朝: 'Asa',
  夜: 'Yoru',
  昼: 'Hiru',
  芙: 'Fu',
  蓉: 'Yō',
  澪: 'Mio',
  凛: 'Rin',
  翔: 'Shō',
  颯: 'Sō',
  蒼: 'Sō',
  // 諧音梗常用字
  穗: 'Sui',
  稻: 'Tō',
  宮: 'Miya',
  源: 'Gen',
  圓: 'En',
  窮: 'Kyū',
  道: 'Dō',
  穹: 'Kyū',
  睡: 'Sui',
  公: 'Kō',
  園: 'En',
  友: 'Tomo',
  芊: 'Sen',
  錢: 'Sen',
  沒: 'Bai',
  梅: 'Ume',
  依: 'I',
  衣: 'I',
  服: 'Fuku',
  庫: 'Ku',
  褲: 'Ku',
  內: 'Nai',
  泉: 'Izumi',
  蓮: 'Ren',
  莉: 'Ri',
  卡: 'Ka',
  由: 'Yu',
  宰: 'Sai',
  具: 'Gu',
  麻: 'Ma',
  載: 'Sai',
  用: 'Yō',
  知: 'Chi',
  世: 'Yo',
  岡: 'Oka',
  門: 'Mon',
  矢: 'Ya',
  牙: 'Ga',
  佑: 'Yū',
  池: 'Ike',
  久: 'Hisa',
  武: 'Bu',
  滿: 'Man',
  壠: 'Rō',
  后: 'Go',
  粉: 'Ko',
  杏: 'An',
  谷: 'Tani',
  澤: 'Sawa',
  鈴: 'Suzu',
  舞: 'Mai',
  櫻: 'Sakura',
  京: 'Kyō',
  塚: 'Tsuka',
  杖: 'Jō',
  夕: 'Yū',
  玖: 'Ku',
  菜: 'Na',
  河: 'Kawa',
  渦: 'Ka',
  曜: 'Yō',
  犬: 'Ken',
  步: 'Ho',
  堂: 'Dō',
  乃: 'No',
  嵐: 'Arashi',
  貴: 'Taka',
  僑: 'Kyō',
  仔: 'Shi',
  裁: 'Sai',
  傅: 'Fu',
  志: 'Shi',
  戶: 'Ko',
  投: 'Tō',
  耀: 'Yō',
  布: 'Fu',
  拉: 'Ra',
  甲: 'Ka',
  熊: 'Kuma',
  政: 'Sei',
  甫: 'Fu',
  耿: 'Kō',
  痴: 'Chi',
  氣: 'Ki',
  累: 'Rui',
  肚: 'To',
  餓: 'E',
  想: 'Sō',
  覺: 'Kaku',
  無: 'Mu',
  聊: 'Ryō',
  等: 'Tō',
  緊: 'Kin',
  關: 'Kan',
  係: 'Kei',
  賀: 'Ka',
  力: 'Riki',
  雅: 'Ga',
  路: 'Ro',
  足: 'Ashi',
  甘: 'Kan',
  歹: 'Tai',
  勢: 'Sei',
  爽: 'Sō',
  快: 'Kai',
  袂: 'Bē',
  曉: 'Akira',
  講: 'Kō',
  免: 'Men',
  驚: 'Kyō',
  啦: 'Ra',
  攏: 'Rō',
  代: 'Dai',
  誌: 'Shi',
  給: 'Kyū',
  來: 'Rai',
  這: 'Sha',
  套: 'Tō',
  閉: 'Hei',
  嘴: 'Kuchi',
  是: 'Shi',
  什: 'Jū',
  麼: 'Ma',
  要: 'Yō',
  亂: 'Ran',
  話: 'Wa',
  聽: 'Chō',
  懂: 'Dō',
  死: 'Shi',
  好: 'Hō',
  喔: 'O',
  波: 'Ha',
  綺: 'Ki',
  尚: 'Shō',
  班: 'Han',
  翔: 'Shō',
  嘉: 'Ka',
  坂: 'Saka',
  今: 'Kon',
  魚: 'Gyo',
  塊: 'Kai',
  店: 'Ten',
  賞: 'Shō',
  車: 'Sha',
  倭: 'Wa',
  帶: 'Tai',
  茶: 'Cha',
  瑤: 'Yō',
  奶: 'Nai',
  玩: 'Wan',
  油: 'Yu',
  熙: 'Ki',
  吃: 'Chi',
  帆: 'Han',
  飯: 'Han',
  糖: 'Tō',
  餅: 'Hei',
  肉: 'Niku',
  咖: 'Ka',
  啡: 'Hi',
  酒: 'Shu',
  看: 'Kan',
  買: 'Bai',
  賣: 'Bai',
  房: 'Bō',
  走: 'Sō',
  悶: 'Mon',
  打: 'Da',
  先: 'Sen',
  仙: 'Sen',
  閑: 'Kan',
  咸: 'Kan',
  再: 'Sai',
  在: 'Zai',
  補: 'Ho',
  布: 'Fu',
  不: 'Fu',
  妮: 'Ni',
  霓: 'Ni',
  你: 'Ni',
  她: 'Ta',
  他: 'Ta',
  塔: 'Ta',
  向: 'Kō',
  香: 'Kō',
  翔: 'Shō',
  帥: 'Sui',
  教: 'Kyō',
  鄒: 'Sō',
  奏: 'Sō',
  亭: 'Tei',
  庭: 'Tei',
  達: 'Tatsu',
  戲: 'Gi',
  希: 'Ki',
  系: 'Kei',
  影: 'Ei',
  英: 'Ei',
  迎: 'Gei',
  灣: 'Wan',
  晚: 'Ban',
  芳: 'Hō',
  方: 'Hō',
  撤: 'Tetsu',
  徹: 'Tetsu',
  余: 'Yo',
  玉: 'Gyoku',
  雨: 'Ame',
  番: 'Ban',
  查: 'Sa',
  奈: 'Na',
  角: 'Kaku',
  載: 'Sai',
  宰: 'Sai',
  麥: 'Baku',
  友: 'Yū',
  有: 'Yū',
  佑: 'Yū',
  游: 'Yū',
  遊: 'Yū',
  祐: 'Yū',
  侑: 'Yū',
  悠: 'Yū',
  裕: 'Yū',
  優: 'Yū',
  // 更多諧音梗常用字
  坊: 'Bō',
  屋: 'Oku',
  重: 'Jū',
  正: 'Sei',
  經: 'Kei',
  箱: 'Hako',
  涼: 'Ryō',
  炒: 'Chō',
  藥: 'Yaku',
  趁: 'Chin',
  早: 'Sō',
  栗: 'Kuri',
  咖: 'Ka',
  啡: 'Hi',
  宏: 'Kō',
  柑: 'Kan',
  玲: 'Rei',
  稻: 'Ina',
  徹: 'Tetsu',
  露: 'Ro',
  邊: 'Hen',
  停: 'Tei',
  憲: 'Ken',
  樹: 'Ki',
  段: 'Dan',
  式: 'Shiki',
  左: 'Sa',
  転: 'Ten',
  皇: 'Kō',
  登: 'Tō',
  粟: 'Awa',
  黃: 'Kō',
  燈: 'Tō',
  兆: 'Chō',
  象: 'Shō',
  照: 'Shō',
  相: 'Sō',
  邈: 'Byō',
  茄: 'Ka',
  秒: 'Byō',
  慧: 'Kei',
  卓: 'Taku',
  仁: 'Jin',
  鶴: 'Tsuru',
  會: 'Kai',
  啄: 'Taku',
  露: 'Tsuyu',
  亀: 'Kame',
  龜: 'Kame',
  在: 'Zai',
  那: 'Na',
  飼: 'Shi',
  悟: 'Go',
  零: 'Rei',
  堂: 'Dō',
  去: 'Kyo',
  兵: 'Hei',
  辣: 'Ra',
  薩: 'Sa',
  咪: 'Mi',
  呀: 'Ya',
  奥: 'Oku',
  淚: 'Rui',
  音: 'On',
  娜: 'Na',
  瀧: 'Taki',
  宗: 'Sō',
  稀: 'Ki',
  哲: 'Tetsu',
  利: 'Ri',
  賀: 'Ka',
  休: 'Kyū',
  部: 'Bu',
  香: 'Ka',
  正: 'Masa',
  淺: 'Asa',
  會: 'E',
  夕: 'Seki',
  晴: 'Sei',
  淨: 'Jō',
  口: 'Kuchi',
  督: 'Toku',
  史: 'Shi',
  渡: 'Wata',
  次: 'Ji',
  卷: 'Maki',
  倦: 'Ken',
  富: 'Tomi',
  舞: 'Mai',
  伸: 'Shin',
  紀: 'Ki',
  明: 'Mei',
  琴: 'Koto',
  遲: 'Chi',
  佐: 'Sa',
  淮: 'Wai',
  杞: 'Ki',
  琴: 'Koto',
  秀: 'Shū',
  莹: 'Ei',
  景: 'Kei',
  樱: 'Sakura',
  名: 'Na',
  仰: 'Gyō',
  耕: 'Kō',
  种: 'Shu',
  竖: 'Jū',
  龙: 'Ryū',
  夫: 'Fu',
  良: 'Ryō',
  合: 'Gō',
  雅: 'Ga',
  瓦: 'Ga',
  搭: 'Ta',
  哇: 'Wa',
  賀: 'Ga',
  稻: 'Ina',
  修: 'Shū',
  報: 'Hō',
  學: 'Gaku',
  士: 'Shi',
  亞: 'A',
  玉: 'Tama',
  平: 'Hira',
  底: 'Tei',
  鍋: 'Nabe',
  河: 'Gawa',
  僑: 'Kyō',
  橋: 'Hashi',
  喜: 'Ki',
  郎: 'Rō',
  秋: 'Aki',
  稲: 'Ina',
  姫: 'Hime',
  萬: 'Man',
  毛: 'Mō',
  澤: 'Taku',
  熱: 'Netsu',
  爛: 'Ran',
  瑜: 'Yu',
  充: 'Jū',
  庶: 'Sho',
  芒: 'Bō',
  果: 'Ka',
  神: 'Jin',
  忠: 'Chū',
  沖: 'Oki',
  暁: 'Akira',
  浩: 'Kō',
  里: 'Ri',
  紀: 'Ki',
  拍: 'Haku',
  軌: 'Ki',
  鬼: 'Ki',
  辻: 'Tsuji',
  慘: 'San',
  鷲: 'Washi',
  棟: 'Tō',
  桃: 'Momo',
  昭: 'Shō',
  龍: 'Ryū',
  龙: 'Ryū',
  亀: 'Kame',
  也: 'Ya',
  整: 'Sei',
};

/**
 * 將漢字轉換為羅馬拼音
 */
function convertToRomaji(kanji) {
  let result = '';
  for (const char of kanji) {
    result += KANJI_TO_ROMAJI[char] || char;
  }
  // 首字母大寫
  return result
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * 解析 CSV 行
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 處理 taiwan_jp_pun_names_320.csv
 */
function processFile1(content) {
  const lines = content.split('\n').filter((line) => line.trim());
  const results = [];

  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 5) continue;

    const [id, punName, surname, givenName, phrase, dialect, category] = fields;
    if (!punName || punName.trim() === '') continue;

    const kanji = punName.trim();
    const meaning = phrase ? phrase.trim() : '';
    const dialectType = dialect ? dialect.trim() : '國語';
    const cat = category ? category.trim() : '';

    results.push({
      kanji,
      meaning: `${dialectType === '台語' ? '台語諧音' : '中文諧音'}：${meaning}`,
      category: CATEGORY_MAP[dialectType] || CATEGORY_MAP[cat] || 'classic',
      source: 'taiwan_jp_pun_names_320.csv',
    });
  }

  return results;
}

/**
 * 處理 taiwan_japanese_puns.csv
 */
function processFile2(content) {
  const lines = content.split('\n').filter((line) => line.trim());
  const results = [];

  // 跳過標題行 (可能有 BOM)
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 3) continue;

    const [name, pun, category] = fields;
    if (!name || name.trim() === '') continue;

    const kanji = name.trim().replace(/^\uFEFF/, ''); // 移除 BOM
    const meaning = pun ? pun.trim() : '';
    const cat = category ? category.trim() : '';

    results.push({
      kanji,
      meaning: meaning || kanji,
      category: CATEGORY_MAP[cat] || 'classic',
      source: 'taiwan_japanese_puns.csv',
    });
  }

  return results;
}

/**
 * 處理 taiwan_japanese_name_puns.csv
 */
function processFile3(content) {
  const lines = content.split('\n').filter((line) => line.trim());
  const results = [];

  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 3) continue;

    const [id, name, meaning, dialect] = fields;
    if (!name || name.trim() === '') continue;

    const kanji = name.trim();
    const meaningText = meaning ? meaning.trim() : '';
    const dialectType = dialect ? dialect.trim() : '國語';

    results.push({
      kanji,
      meaning: `${dialectType === '台語' ? '台語諧音' : '中文諧音'}：${meaningText}`,
      category: CATEGORY_MAP[dialectType] || 'classic',
      source: 'taiwan_japanese_name_puns.csv',
    });
  }

  return results;
}

/**
 * 主處理函數
 */
async function main() {
  console.log('開始處理 CSV 檔案...\n');

  const allPuns = [];

  // 處理每個 CSV 檔案
  for (const filePath of CSV_FILES) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`處理檔案: ${path.basename(filePath)}`);

      let puns;
      if (filePath.includes('taiwan_jp_pun_names_320')) {
        puns = processFile1(content);
      } else if (filePath.includes('taiwan_japanese_puns')) {
        puns = processFile2(content);
      } else if (filePath.includes('taiwan_japanese_name_puns')) {
        puns = processFile3(content);
      }

      console.log(`  - 解析出 ${puns.length} 筆資料`);
      allPuns.push(...puns);
    } catch (err) {
      console.error(`處理 ${filePath} 時發生錯誤:`, err.message);
    }
  }

  console.log(`\n總計解析: ${allPuns.length} 筆資料`);

  // 去重 (以 kanji 為 key)
  const uniqueMap = new Map();
  for (const pun of allPuns) {
    if (!uniqueMap.has(pun.kanji)) {
      uniqueMap.set(pun.kanji, pun);
    }
  }

  const uniquePuns = Array.from(uniqueMap.values());
  console.log(`去重後: ${uniquePuns.length} 筆資料`);

  // 補上羅馬拼音
  const finalPuns = uniquePuns.map((pun) => ({
    kanji: pun.kanji,
    romaji: convertToRomaji(pun.kanji),
    meaning: pun.meaning,
    category: pun.category,
  }));

  // 過濾無效資料
  const validPuns = finalPuns.filter(
    (pun) =>
      pun.kanji &&
      pun.kanji.length >= 2 &&
      pun.kanji.length <= 10 &&
      !pun.kanji.includes('http') &&
      !pun.kanji.includes('www'),
  );

  console.log(`有效資料: ${validPuns.length} 筆`);

  // 產生 TypeScript 程式碼
  const tsCode = generateTypeScript(validPuns);

  // 寫入檔案
  const outputPath = path.join(__dirname, '../src/data/csvIntegratedPuns.ts');
  fs.writeFileSync(outputPath, tsCode, 'utf-8');

  console.log(`\n✅ 已產生檔案: ${outputPath}`);
  console.log(`   包含 ${validPuns.length} 筆諧音梗資料`);
}

/**
 * 產生 TypeScript 程式碼
 */
function generateTypeScript(puns) {
  const grouped = {
    classic: [],
    taiwanese: [],
    cantonese: [],
    life: [],
    wealth: [],
    food: [],
    place: [],
    internet: [],
    nature: [],
    common: [],
  };

  for (const pun of puns) {
    const cat = pun.category || 'classic';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pun);
  }

  let code = `/**
 * CSV 整合諧音梗資料庫
 * 
 * 來源：
 * - taiwan_jp_pun_names_320.csv
 * - taiwan_japanese_puns.csv
 * - taiwan_japanese_name_puns.csv
 * 
 * 自動產生時間：${new Date().toISOString()}
 * 總筆數：${puns.length}
 */
import type { PunName } from '../types';

`;

  // 產生各分類的陣列
  for (const [category, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;

    const varName = `CSV_${category.toUpperCase()}_PUNS`;
    code += `/**\n * ${getCategoryName(category)} (${items.length} 筆)\n */\n`;
    code += `export const ${varName}: PunName[] = [\n`;

    for (const item of items) {
      const kanji = escapeString(item.kanji);
      const romaji = escapeString(item.romaji);
      const meaning = escapeString(item.meaning);
      code += `  { kanji: '${kanji}', romaji: '${romaji}', meaning: '${meaning}', category: '${category}' },\n`;
    }

    code += `];\n\n`;
  }

  // 產生合併陣列
  const categoryVars = Object.keys(grouped)
    .filter((cat) => grouped[cat].length > 0)
    .map((cat) => `CSV_${cat.toUpperCase()}_PUNS`);

  code += `/**\n * 所有 CSV 整合諧音梗\n */\n`;
  code += `export const ALL_CSV_PUNS: PunName[] = [\n`;
  for (const varName of categoryVars) {
    code += `  ...${varName},\n`;
  }
  code += `];\n\n`;

  code += `/**\n * CSV 諧音梗總數\n */\n`;
  code += `export const CSV_PUNS_COUNT = ${puns.length};\n`;

  return code;
}

function getCategoryName(category) {
  const names = {
    classic: '經典諧音',
    taiwanese: '台語諧音',
    cantonese: '粵語諧音',
    life: '生活諧音',
    wealth: '財富相關',
    food: '食物飲料',
    place: '地名相關',
    internet: '網路迷因',
    nature: '自然風格',
    common: '常見日本名',
  };
  return names[category] || category;
}

function escapeString(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

main().catch(console.error);
