/**
 * 趣味諧音日本名資料庫 (擴充版 - 1000+)
 *
 * 資料來源：
 * - 巴哈姆特：日治時期台灣人更改姓名活動及辦法
 * - 網路迷因與社群創作
 * - 日文老師周若珍臉書分享
 * - PTT/Dcard 網友創作
 * - Threads: @cvtspolo, @hajl_taiwan, @riven.rar, @dreamstreet2023, @mason_chung1450
 * - UDN: game.udn.com
 * - Wakin: wakin.com
 * - Homeboylife 網路暱稱文章
 * - CSV 整合：taiwan_jp_pun_names_320.csv, taiwan_japanese_puns.csv, taiwan_japanese_name_puns.csv
 *
 * 最後更新：2025-12-06
 */
import type { PunName } from '../types';
import { ALL_CSV_PUNS } from './csvIntegratedPuns';

/**
 * 經典諧音 - 最廣為流傳的諧音梗
 */
export const CLASSIC_PUNS: PunName[] = [
  { kanji: '梅川伊芙', romaji: 'Umekawa Ifu', meaning: '中文諧音：沒穿衣服', category: 'classic' },
  { kanji: '梅川庫子', romaji: 'Umekawa Kuko', meaning: '中文諧音：沒穿褲子', category: 'classic' },
  { kanji: '梅川內衣', romaji: 'Umekawa Naii', meaning: '中文諧音：沒穿內衣', category: 'classic' },
  {
    kanji: '梅川協子',
    romaji: 'Umekawa Kyōko',
    meaning: '中文諧音：沒穿鞋子',
    category: 'classic',
  },
  { kanji: '梅川羽依', romaji: 'Umekawa Ui', meaning: '中文諧音：沒穿雨衣', category: 'classic' },
  {
    kanji: '梅川內伊庫',
    romaji: 'Umekawa Naiiku',
    meaning: '中文諧音：沒穿內衣褲',
    category: 'classic',
  },
  {
    kanji: '櫻京塚杖',
    romaji: 'Sakurazuka Jō',
    meaning: '中文諧音：男性部位腫脹',
    category: 'classic',
  },
  {
    kanji: '宮美春掐',
    romaji: 'Miyami Haruka',
    meaning: '中文諧音：形容人講不聽',
    category: 'classic',
  },
  {
    kanji: '夏夕夏井',
    romaji: 'Natsuyu Natsui',
    meaning: '中文諧音：丟人現眼',
    category: 'classic',
  },
  {
    kanji: '八格雅魯',
    romaji: 'Hakka Yaru',
    meaning: '日文諧音：八嘎呀路 (笨蛋)',
    category: 'classic',
  },
  {
    kanji: '耿本白池',
    romaji: 'Kōmoto Hakuchi',
    meaning: '中文諧音：根本白痴',
    category: 'classic',
  },
  {
    kanji: '大佑池久',
    romaji: 'Daisuke Ikehisa',
    meaning: '中文諧音：大又持久',
    category: 'classic',
  },
  {
    kanji: '三石宮分',
    romaji: 'Mitsuishi Kubun',
    meaning: '中文諧音：三十公分',
    category: 'classic',
  },
  { kanji: '肛門強', romaji: 'Kōmon Tsuyoshi', meaning: '中文諧音：肛門強', category: 'classic' },
  {
    kanji: '岡門友矢',
    romaji: 'Okakado Tomoya',
    meaning: '中文諧音：肛門有牙',
    category: 'classic',
  },
];

/**
 * 台語諧音 - 台灣本土特色
 */
export const TAIWANESE_PUNS: PunName[] = [
  {
    kanji: '林北舞吉',
    romaji: 'Rinpoku Bukichi',
    meaning: '台語諧音：林北無吉',
    category: 'taiwanese',
  },
  {
    kanji: '鈴北舞吉',
    romaji: 'Suzukita Maikichi',
    meaning: '台語諧音：林北舞吉',
    category: 'taiwanese',
  },
  { kanji: '攏好哩講', romaji: 'Rōkō Rikō', meaning: '台語諧音：攏好你講', category: 'taiwanese' },
  {
    kanji: '壠后莉宮',
    romaji: 'Rongo Rikyū',
    meaning: '台語諧音：攏好哩講',
    category: 'taiwanese',
  },
  { kanji: '高希囝仔', romaji: 'Kōki Ganna', meaning: '台語諧音：猴死囝仔', category: 'taiwanese' },
  {
    kanji: '高希音娜',
    romaji: 'Takaki Onna',
    meaning: '台語諧音：猴死囝仔',
    category: 'taiwanese',
  },
  {
    kanji: '高希櫻娜',
    romaji: 'Takaki Sakurana',
    meaning: '台語諧音：死小孩',
    category: 'taiwanese',
  },
  {
    kanji: '北七喜利',
    romaji: 'Hokushichi Kiri',
    meaning: '台語諧音：北七',
    category: 'taiwanese',
  },
  {
    kanji: '愛宮森秋',
    romaji: 'Aikyū Moriaki',
    meaning: '台語諧音：愛講森七',
    category: 'taiwanese',
  },
  {
    kanji: '里宮清楚',
    romaji: 'Rikyū Seiso',
    meaning: '台語諧音：你講清楚',
    category: 'taiwanese',
  },
  {
    kanji: '亀岡在那',
    romaji: 'Kameoka Zaina',
    meaning: '台語諧音：龜在哪',
    category: 'taiwanese',
  },
  { kanji: '伊飼悟零', romaji: 'Ishi Gorei', meaning: '台語諧音：伊是五零', category: 'taiwanese' },
  { kanji: '由宰具麻', romaji: 'Yuzai Guma', meaning: '台語諧音：有在顧嗎', category: 'taiwanese' },
  { kanji: '扁壽五郎', romaji: 'Henju Gorō', meaning: '台語諧音：騙肖五郎', category: 'taiwanese' },
  {
    kanji: '大道韓步助',
    romaji: 'Daidō Kanposuke',
    meaning: '台語諧音：大家都幫助',
    category: 'taiwanese',
  },
  {
    kanji: '彎刀武西郎',
    romaji: 'Wantō Bushirō',
    meaning: '台語諧音：冤大頭',
    category: 'taiwanese',
  },
  {
    kanji: '一次淘汰郎',
    romaji: 'Ichiji Tōtarō',
    meaning: '台語諧音：一次淘汰郎',
    category: 'taiwanese',
  },
  {
    kanji: '水甲有春',
    romaji: 'Mizuka Yuharu',
    meaning: '台語諧音：水甲有春',
    category: 'taiwanese',
  },
  {
    kanji: '吉開美丸',
    romaji: 'Yoshikai Mimaru',
    meaning: '台語諧音：吉開美丸',
    category: 'taiwanese',
  },
  {
    kanji: '愛葉喜八郎',
    romaji: 'Aiba Kihachirō',
    meaning: '台語諧音：愛葉喜八郎',
    category: 'taiwanese',
  },
  {
    kanji: '五六不能王',
    romaji: 'Goroku Funōō',
    meaning: '台語諧音：五六不能王',
    category: 'taiwanese',
  },
];

/**
 * 生活諧音 - 日常生活相關
 */
export const LIFE_PUNS: PunName[] = [
  { kanji: '全聯福利', romaji: 'Zenren Fukuri', meaning: '中文諧音：全聯福利', category: 'life' },
  {
    kanji: '泉蓮芙莉卡',
    romaji: 'Izumi Renfurika',
    meaning: '中文諧音：全聯福利卡',
    category: 'life',
  },
  { kanji: '穗道宗舞', romaji: 'Suidō Sōmai', meaning: '中文諧音：睡到中午', category: 'life' },
  { kanji: '玖菜河子', romaji: 'Kuna Kako', meaning: '中文諧音：韭菜盒子', category: 'life' },
  { kanji: '久菜和子', romaji: 'Kuna Kazuko', meaning: '中文諧音：韭菜盒子', category: 'life' },
  { kanji: '渦曜犬步', romaji: 'Kayō Kenpo', meaning: '中文諧音：我要全部', category: 'life' },
  {
    kanji: '耀川布拉甲',
    romaji: 'Yōkawa Buraka',
    meaning: '中文諧音：要穿布拉甲',
    category: 'life',
  },
  { kanji: '久武加滿', romaji: 'Hisatake Kaman', meaning: '中文諧音：酒不夠滿', category: 'life' },
  {
    kanji: '瀧宗免吉',
    romaji: 'Takimune Menkichi',
    meaning: '網友創作：瀧宗免吉',
    category: 'life',
  },
  { kanji: '哲利鉄', romaji: 'Tessuri Tetsu', meaning: '網友創作：哲利鉄', category: 'life' },
  {
    kanji: '甲賀稻休波',
    romaji: 'Kōga Inayuha',
    meaning: '網友創作：甲賀稻休波',
    category: 'life',
  },
  { kanji: '吾堂去兵', romaji: 'Godō Kyohei', meaning: '網友創作：我等去兵', category: 'life' },
  { kanji: '辣薩咪呀', romaji: 'Rasa Miya', meaning: '網友創作：辣薩咪呀', category: 'life' },
  { kanji: '三井奥淚', romaji: 'Mitsui Orui', meaning: '網友創作：三井奥淚', category: 'life' },
];

/**
 * 財富相關 - 金錢與財務
 */
export const WEALTH_PUNS: PunName[] = [
  { kanji: '裁傅志由', romaji: 'Saifu Shiyu', meaning: '中文諧音：財富自由', category: 'wealth' },
  { kanji: '財富自由', romaji: 'Zaifu Jiyū', meaning: '中文諧音：財富自由', category: 'wealth' },
  {
    kanji: '田中僑仔',
    romaji: 'Tanaka Kyōshi',
    meaning: '中文諧音：田中喬仔 (有錢人)',
    category: 'wealth',
  },
  {
    kanji: '森上梅友前',
    romaji: 'Morigami Baiyūzen',
    meaning: '中文諧音：身上沒有錢',
    category: 'wealth',
  },
  {
    kanji: '森上梅戴前',
    romaji: 'Morigami Maitaisen',
    meaning: '中文諧音：身上沒帶錢',
    category: 'wealth',
  },
  { kanji: '身上沒錢', romaji: 'Shinjō Musen', meaning: '中文諧音：身上沒錢', category: 'wealth' },
  {
    kanji: '戶投野梅前',
    romaji: 'Koto Yobaimae',
    meaning: '中文諧音：戶頭有沒錢',
    category: 'wealth',
  },
  {
    kanji: '穹道穗宮源',
    romaji: 'Kyūdō Suikyūgen',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },
  {
    kanji: '窮稻穗宮圓',
    romaji: 'Kyūdō Suikyūen',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },
  {
    kanji: '稉稻穗宮圖',
    romaji: 'Kyōdō Suikyūzu',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },
  {
    kanji: '窮到睡公園',
    romaji: 'Kyūdō Suikōen',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },
  {
    kanji: '高熊梅政甫',
    romaji: 'Takakuma Baiseifu',
    meaning: '中文諧音：高雄沒政府',
    category: 'wealth',
  },
];

/**
 * 拆字梗 - 漢字拆解趣味
 */
export const CHARACTER_PUNS: PunName[] = [
  {
    kanji: '竹本口木子',
    romaji: 'Takemoto Kuchikiko',
    meaning: '拆字梗：笨呆子 (竹+本=笨, 口+木=呆)',
    category: 'character',
  },
  {
    kanji: '米田共子',
    romaji: 'Yoneda Tomoko',
    meaning: '拆字梗：糞 (米+田+共=糞)',
    category: 'character',
  },
  {
    kanji: '米田共菜菜子',
    romaji: 'Yoneda Tomonanako',
    meaning: '拆字梗：糞便菜菜子',
    category: 'character',
  },
  {
    kanji: '二木太郎',
    romaji: 'Futaki Tarō',
    meaning: '拆字梗：林 (二+木=林)',
    category: 'character',
  },
  {
    kanji: '共田花子',
    romaji: 'Kyōda Hanako',
    meaning: '拆字梗：黃 (共+田=黃)',
    category: 'character',
  },
  {
    kanji: '弓長太郎',
    romaji: 'Yuminaga Tarō',
    meaning: '拆字梗：張 (弓+長=張)',
    category: 'character',
  },
  { kanji: '禾火子', romaji: 'Kabi Ko', meaning: '拆字梗：秋 (禾+火=秋)', category: 'character' },
  {
    kanji: '木子太郎',
    romaji: 'Kishi Tarō',
    meaning: '拆字梗：李 (木+子=李)',
    category: 'character',
  },
  {
    kanji: '十月田子',
    romaji: 'Jūgatsu Taneko',
    meaning: '拆字梗：朝 (十+月+田=朝)',
    category: 'character',
  },
  {
    kanji: '日月明子',
    romaji: 'Nichigetsu Akiko',
    meaning: '拆字梗：明 (日+月=明)',
    category: 'character',
  },
];

/**
 * 地名相關 - 台灣與日本地名
 */
export const PLACE_PUNS: PunName[] = [
  {
    kanji: '淡水夕照子',
    romaji: 'Tansui Yūshōko',
    meaning: '地名：淡水夕照 (台灣八景)',
    category: 'place',
  },
  {
    kanji: '高雄港子',
    romaji: 'Takao Minako',
    meaning: '地名：高雄港 (日治時期稱高雄為打狗)',
    category: 'place',
  },
  { kanji: '台北城子', romaji: 'Taihoku Jōko', meaning: '地名：台北城', category: 'place' },
  { kanji: '基隆港太郎', romaji: 'Kīrun Minato Tarō', meaning: '地名：基隆港', category: 'place' },
  { kanji: '新竹風子', romaji: 'Shinchiku Kazeko', meaning: '地名：新竹風城', category: 'place' },
  { kanji: '台中花子', romaji: 'Taichū Hanako', meaning: '地名：台中', category: 'place' },
  { kanji: '台南府子', romaji: 'Tainan Fuko', meaning: '地名：台南府城', category: 'place' },
  { kanji: '花蓮港子', romaji: 'Karen Minako', meaning: '地名：花蓮港', category: 'place' },
  { kanji: '阿里山子', romaji: 'Arizan Ko', meaning: '地名：阿里山', category: 'place' },
  { kanji: '日月潭子', romaji: 'Nichigetsutan Ko', meaning: '地名：日月潭', category: 'place' },
  { kanji: '玉山太郎', romaji: 'Gyokuzan Tarō', meaning: '地名：玉山 (新高山)', category: 'place' },
  { kanji: '墾丁海子', romaji: 'Kontei Umiko', meaning: '地名：墾丁', category: 'place' },
];

/**
 * 歷史人物風格 - 日本歷史名人
 */
export const HISTORY_PUNS: PunName[] = [
  {
    kanji: '德川家康',
    romaji: 'Tokugawa Ieyasu',
    meaning: '歷史：江戶幕府創始人',
    category: 'history',
  },
  { kanji: '織田信長', romaji: 'Oda Nobunaga', meaning: '歷史：戰國大名', category: 'history' },
  { kanji: '豐臣秀吉', romaji: 'Toyotomi Hideyoshi', meaning: '歷史：天下人', category: 'history' },
  { kanji: '武田信玄', romaji: 'Takeda Shingen', meaning: '歷史：甲斐之虎', category: 'history' },
  { kanji: '上杉謙信', romaji: 'Uesugi Kenshin', meaning: '歷史：越後之龍', category: 'history' },
  { kanji: '伊達政宗', romaji: 'Date Masamune', meaning: '歷史：獨眼龍', category: 'history' },
  {
    kanji: '真田幸村',
    romaji: 'Sanada Yukimura',
    meaning: '歷史：日本第一兵',
    category: 'history',
  },
  { kanji: '宮本武藏', romaji: 'Miyamoto Musashi', meaning: '歷史：劍聖', category: 'history' },
  { kanji: '坂本龍馬', romaji: 'Sakamoto Ryōma', meaning: '歷史：維新志士', category: 'history' },
  { kanji: '西鄉隆盛', romaji: 'Saigō Takamori', meaning: '歷史：最後的武士', category: 'history' },
  { kanji: '明治天皇', romaji: 'Meiji Tennō', meaning: '歷史：明治維新', category: 'history' },
  { kanji: '聖德太子', romaji: 'Shōtoku Taishi', meaning: '歷史：飛鳥時代', category: 'history' },
];

/**
 * 文學風格 - 日本文豪
 */
export const LITERATURE_PUNS: PunName[] = [
  {
    kanji: '夏目漱石',
    romaji: 'Natsume Sōseki',
    meaning: '文學：明治時代文豪',
    category: 'literature',
  },
  {
    kanji: '芥川龍之介',
    romaji: 'Akutagawa Ryūnosuke',
    meaning: '文學：大正時代作家',
    category: 'literature',
  },
  { kanji: '太宰治', romaji: 'Dazai Osamu', meaning: '文學：昭和時代作家', category: 'literature' },
  {
    kanji: '川端康成',
    romaji: 'Kawabata Yasunari',
    meaning: '文學：諾貝爾文學獎',
    category: 'literature',
  },
  {
    kanji: '三島由紀夫',
    romaji: 'Mishima Yukio',
    meaning: '文學：昭和時代作家',
    category: 'literature',
  },
  {
    kanji: '村上春樹',
    romaji: 'Murakami Haruki',
    meaning: '文學：當代作家',
    category: 'literature',
  },
  {
    kanji: '宮澤賢治',
    romaji: 'Miyazawa Kenji',
    meaning: '文學：童話作家',
    category: 'literature',
  },
  {
    kanji: '谷崎潤一郎',
    romaji: 'Tanizaki Junichirō',
    meaning: '文學：唯美派',
    category: 'literature',
  },
  {
    kanji: '森鷗外',
    romaji: 'Mori Ōgai',
    meaning: '文學：明治時代軍醫作家',
    category: 'literature',
  },
  {
    kanji: '樋口一葉',
    romaji: 'Higuchi Ichiyō',
    meaning: '文學：明治時代女作家',
    category: 'literature',
  },
  {
    kanji: '紫式部',
    romaji: 'Murasaki Shikibu',
    meaning: '文學：源氏物語作者',
    category: 'literature',
  },
  {
    kanji: '清少納言',
    romaji: 'Sei Shōnagon',
    meaning: '文學：枕草子作者',
    category: 'literature',
  },
];

/**
 * 常見日本名 - 通用範例名
 */
export const COMMON_PUNS: PunName[] = [
  {
    kanji: '山田太郎',
    romaji: 'Yamada Tarō',
    meaning: '常見：日本最通用的範例名',
    category: 'common',
  },
  {
    kanji: '鈴木一郎',
    romaji: 'Suzuki Ichirō',
    meaning: '常見：知名棒球選手同名',
    category: 'common',
  },
  {
    kanji: '佐藤花子',
    romaji: 'Satō Hanako',
    meaning: '常見：日本最常見女性名',
    category: 'common',
  },
  {
    kanji: '田中實',
    romaji: 'Tanaka Minoru',
    meaning: '常見：田中是日本第四大姓',
    category: 'common',
  },
  {
    kanji: '高橋健太',
    romaji: 'Takahashi Kenta',
    meaning: '常見：高橋是日本第三大姓',
    category: 'common',
  },
  {
    kanji: '渡邊誠',
    romaji: 'Watanabe Makoto',
    meaning: '常見：渡邊是日本第五大姓',
    category: 'common',
  },
  { kanji: '伊藤優', romaji: 'Itō Yū', meaning: '常見：伊藤是日本第六大姓', category: 'common' },
  {
    kanji: '中村翔',
    romaji: 'Nakamura Shō',
    meaning: '常見：中村是日本第七大姓',
    category: 'common',
  },
  {
    kanji: '小林愛',
    romaji: 'Kobayashi Ai',
    meaning: '常見：小林是日本第九大姓',
    category: 'common',
  },
  {
    kanji: '加藤大輔',
    romaji: 'Katō Daisuke',
    meaning: '常見：加藤是日本第十大姓',
    category: 'common',
  },
  {
    kanji: '吉田美咲',
    romaji: 'Yoshida Misaki',
    meaning: '常見：吉田是日本第十一大姓',
    category: 'common',
  },
  {
    kanji: '山本陽子',
    romaji: 'Yamamoto Yōko',
    meaning: '常見：山本是日本第十二大姓',
    category: 'common',
  },
  { kanji: '松本潤', romaji: 'Matsumoto Jun', meaning: '常見：松本是常見姓', category: 'common' },
  { kanji: '井上真央', romaji: 'Inoue Mao', meaning: '常見：井上是常見姓', category: 'common' },
  { kanji: '木村拓哉', romaji: 'Kimura Takuya', meaning: '常見：知名藝人同名', category: 'common' },
];

/**
 * 自然風格 - 自然元素
 */
export const NATURE_PUNS: PunName[] = [
  { kanji: '櫻井翔', romaji: 'Sakurai Shō', meaning: '自然：櫻花+井', category: 'nature' },
  { kanji: '森田剛', romaji: 'Morita Gō', meaning: '自然：森林+田', category: 'nature' },
  { kanji: '川村瑞希', romaji: 'Kawamura Mizuki', meaning: '自然：川+村', category: 'nature' },
  { kanji: '山本彩', romaji: 'Yamamoto Aya', meaning: '自然：山+本', category: 'nature' },
  { kanji: '海野波子', romaji: 'Umino Namiko', meaning: '自然：海+野+波', category: 'nature' },
  { kanji: '空山雲子', romaji: 'Sorayama Kumoko', meaning: '自然：空+山+雲', category: 'nature' },
  { kanji: '風間颯太', romaji: 'Kazama Sōta', meaning: '自然：風+間', category: 'nature' },
  { kanji: '雪村冬子', romaji: 'Yukimura Fuyuko', meaning: '自然：雪+村+冬', category: 'nature' },
  { kanji: '月野光', romaji: 'Tsukino Hikaru', meaning: '自然：月+野+光', category: 'nature' },
  { kanji: '星野源', romaji: 'Hoshino Gen', meaning: '自然/諧音：省能源', category: 'nature' },
  { kanji: '花田美桜', romaji: 'Hanada Miō', meaning: '自然：花+田+櫻', category: 'nature' },
  { kanji: '竹內涼真', romaji: 'Takeuchi Ryōma', meaning: '自然：竹+內', category: 'nature' },
  { kanji: '松嶋菜々子', romaji: 'Matsushima Nanako', meaning: '自然：松+嶋', category: 'nature' },
  { kanji: '梅宮辰夫', romaji: 'Umemiya Tatsuo', meaning: '自然：梅+宮', category: 'nature' },
  { kanji: '柳生宗矩', romaji: 'Yagyū Munenori', meaning: '自然：柳+生', category: 'nature' },
];

/**
 * 優雅女性名 - 美麗的女性名字
 */
export const ELEGANT_PUNS: PunName[] = [
  {
    kanji: '小林美咲',
    romaji: 'Kobayashi Misaki',
    meaning: '優雅：小林+美咲',
    category: 'elegant',
  },
  { kanji: '渡邊結衣', romaji: 'Watanabe Yui', meaning: '優雅：渡邊+結衣', category: 'elegant' },
  { kanji: '伊藤陽菜', romaji: 'Itō Haruna', meaning: '優雅：伊藤+陽菜', category: 'elegant' },
  { kanji: '中村七海', romaji: 'Nakamura Nanami', meaning: '優雅：中村+七海', category: 'elegant' },
  { kanji: '加藤凜', romaji: 'Katō Rin', meaning: '優雅：加藤+凜', category: 'elegant' },
  { kanji: '新垣結衣', romaji: 'Aragaki Yui', meaning: '優雅：知名女星同名', category: 'elegant' },
  {
    kanji: '石原里美',
    romaji: 'Ishihara Satomi',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  {
    kanji: '橋本環奈',
    romaji: 'Hashimoto Kanna',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  { kanji: '廣瀨鈴', romaji: 'Hirose Suzu', meaning: '優雅：知名女星同名', category: 'elegant' },
  {
    kanji: '北川景子',
    romaji: 'Kitagawa Keiko',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  { kanji: '綾瀨遙', romaji: 'Ayase Haruka', meaning: '優雅：知名女星同名', category: 'elegant' },
  {
    kanji: '長澤雅美',
    romaji: 'Nagasawa Masami',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  { kanji: '深田恭子', romaji: 'Fukada Kyōko', meaning: '優雅：知名女星同名', category: 'elegant' },
  { kanji: '上戶彩', romaji: 'Ueto Aya', meaning: '優雅：知名女星同名', category: 'elegant' },
  {
    kanji: '堀北真希',
    romaji: 'Horikita Maki',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
];

/**
 * 食物飲料 - 美食相關
 */
export const FOOD_PUNS: PunName[] = [
  { kanji: '黑堂真乃', romaji: 'Kurodō Mano', meaning: '中文諧音：黑糖珍奶', category: 'food' },
  { kanji: '黑糖珍奶', romaji: 'Kokutō Chinnai', meaning: '中文諧音：黑糖珍奶', category: 'food' },
  { kanji: '五十嵐貴', romaji: 'Igarashi Takai', meaning: '中文諧音：50嵐太貴', category: 'food' },
  {
    kanji: '五十嵐太貴',
    romaji: 'Igarashi Taiki',
    meaning: '中文諧音：50嵐太貴',
    category: 'food',
  },
  { kanji: '鮭魚太郎', romaji: 'Sake Tarō', meaning: '迷因：鮭魚之亂', category: 'food' },
  { kanji: '壽司郎', romaji: 'Sushirō', meaning: '迷因：壽司郎', category: 'food' },
  { kanji: '拉麵太郎', romaji: 'Rāmen Tarō', meaning: '食物：拉麵', category: 'food' },
  { kanji: '烏龍麵子', romaji: 'Udon Menshi', meaning: '食物：烏龍麵', category: 'food' },
  { kanji: '天婦羅子', romaji: 'Tenpura Ko', meaning: '食物：天婦羅', category: 'food' },
  { kanji: '壽喜燒子', romaji: 'Sukiyaki Ko', meaning: '食物：壽喜燒', category: 'food' },
  { kanji: '抹茶美子', romaji: 'Matcha Miko', meaning: '食物：抹茶', category: 'food' },
  { kanji: '納豆太郎', romaji: 'Nattō Tarō', meaning: '食物：納豆', category: 'food' },
  { kanji: '味噌汁子', romaji: 'Misoshiru Ko', meaning: '食物：味噌湯', category: 'food' },
  { kanji: '大福餅子', romaji: 'Daifuku Mochiko', meaning: '食物：大福', category: 'food' },
  { kanji: '紅豆餡子', romaji: 'Azuki Anko', meaning: '食物：紅豆餡', category: 'food' },
];

/**
 * 網路迷因 - 網路流行語
 */
export const INTERNET_PUNS: PunName[] = [
  { kanji: '草生太郎', romaji: 'Kusahai Tarō', meaning: '迷因：草 (笑)', category: 'internet' },
  { kanji: '乙太郎', romaji: 'Otsu Tarō', meaning: '迷因：乙 (辛苦了)', category: 'internet' },
  { kanji: '神太郎', romaji: 'Kami Tarō', meaning: '迷因：神 (厲害)', category: 'internet' },
  { kanji: '鬼太郎', romaji: 'Kitarō', meaning: '迷因/動漫：鬼太郎', category: 'internet' },
  { kanji: '炎上太郎', romaji: 'Enjō Tarō', meaning: '迷因：炎上 (爆紅)', category: 'internet' },
  { kanji: '推太郎', romaji: 'Oshi Tarō', meaning: '迷因：推し (偶像)', category: 'internet' },
  { kanji: '尊太郎', romaji: 'Tōtoi Tarō', meaning: '迷因：尊い (珍貴)', category: 'internet' },
  { kanji: '萌太郎', romaji: 'Moe Tarō', meaning: '迷因：萌え (可愛)', category: 'internet' },
  { kanji: '宅太郎', romaji: 'Otaku Tarō', meaning: '迷因：御宅族', category: 'internet' },
  { kanji: '腐女子', romaji: 'Fujoshi', meaning: '迷因：腐女子', category: 'internet' },
  { kanji: '中二病子', romaji: 'Chūnibyō Ko', meaning: '迷因：中二病', category: 'internet' },
  { kanji: '社畜太郎', romaji: 'Shachiku Tarō', meaning: '迷因：社畜', category: 'internet' },
  { kanji: '過勞死子', romaji: 'Karōshi Ko', meaning: '迷因：過勞死', category: 'internet' },
  { kanji: '引籠太郎', romaji: 'Hikikomori Tarō', meaning: '迷因：繭居族', category: 'internet' },
  { kanji: '佛系太郎', romaji: 'Bukkei Tarō', meaning: '迷因：佛系', category: 'internet' },
];

/**
 * 粉碎性骨折系列 - 經典諧音
 */
export const BONE_PUNS: PunName[] = [
  {
    kanji: '粉穂杏谷澤',
    romaji: 'Konaho Anizawa',
    meaning: '中文諧音：粉碎性骨折',
    category: 'classic',
  },
  {
    kanji: '粉穗幸谷澤',
    romaji: 'Konaho Yukizawa',
    meaning: '中文諧音：粉碎性骨折',
    category: 'classic',
  },
];

/**
 * 更多經典諧音補充
 */
export const MORE_CLASSIC_PUNS: PunName[] = [
  {
    kanji: '大又池久',
    romaji: 'Daiyu Ikehisa',
    meaning: '台語諧音：大又持久',
    category: 'classic',
  },
  {
    kanji: '三石功分',
    romaji: 'Mitsuishi Kōbun',
    meaning: '台語諧音：三十公分',
    category: 'classic',
  },
  {
    kanji: '梅前好久',
    romaji: 'Umemae Yoshihisa',
    meaning: '台語諧音：沒前好久',
    category: 'classic',
  },
  { kanji: '四幸九點', romaji: 'Shikō Kyūten', meaning: '中文諧音：四點九點', category: 'classic' },
];

/**
 * 動漫風格名字
 */
export const ANIME_PUNS: PunName[] = [
  {
    kanji: '竈門炭治郎',
    romaji: 'Kamado Tanjirō',
    meaning: '動漫：鬼滅之刃',
    category: 'internet',
  },
  {
    kanji: '我妻善逸',
    romaji: 'Agatsuma Zenitsu',
    meaning: '動漫：鬼滅之刃',
    category: 'internet',
  },
  {
    kanji: '嘴平伊之助',
    romaji: 'Hashibira Inosuke',
    meaning: '動漫：鬼滅之刃',
    category: 'internet',
  },
  { kanji: '五條悟', romaji: 'Gojō Satoru', meaning: '動漫：咒術迴戰', category: 'internet' },
  { kanji: '虎杖悠仁', romaji: 'Itadori Yūji', meaning: '動漫：咒術迴戰', category: 'internet' },
  { kanji: '孫悟空', romaji: 'Son Gokū', meaning: '動漫：七龍珠', category: 'internet' },
  { kanji: '漩渦鳴人', romaji: 'Uzumaki Naruto', meaning: '動漫：火影忍者', category: 'internet' },
  { kanji: '宇智波佐助', romaji: 'Uchiha Sasuke', meaning: '動漫：火影忍者', category: 'internet' },
  { kanji: '蒙奇·D·魯夫', romaji: 'Monkī D Rufi', meaning: '動漫：海賊王', category: 'internet' },
  { kanji: '工藤新一', romaji: 'Kudō Shinichi', meaning: '動漫：名偵探柯南', category: 'internet' },
  { kanji: '野比大雄', romaji: 'Nobi Nobita', meaning: '動漫：哆啦A夢', category: 'internet' },
  { kanji: '哆啦A夢', romaji: 'Doraemon', meaning: '動漫：哆啦A夢', category: 'internet' },
];

/**
 * 職業風格名字
 */
export const OCCUPATION_PUNS: PunName[] = [
  { kanji: '醫師太郎', romaji: 'Ishi Tarō', meaning: '職業：醫師', category: 'common' },
  { kanji: '弁護士子', romaji: 'Bengoshi Ko', meaning: '職業：律師', category: 'common' },
  { kanji: '教師花子', romaji: 'Kyōshi Hanako', meaning: '職業：教師', category: 'common' },
  { kanji: '警察官太郎', romaji: 'Keisatsukan Tarō', meaning: '職業：警察', category: 'common' },
  { kanji: '消防士郎', romaji: 'Shōbōshi Rō', meaning: '職業：消防員', category: 'common' },
  { kanji: '料理人子', romaji: 'Ryōrinin Ko', meaning: '職業：廚師', category: 'common' },
  { kanji: '美容師美子', romaji: 'Biyōshi Miko', meaning: '職業：美髮師', category: 'common' },
  { kanji: '会計士太郎', romaji: 'Kaikeishi Tarō', meaning: '職業：會計師', category: 'common' },
];

/**
 * 季節風格名字
 */
export const SEASON_PUNS: PunName[] = [
  { kanji: '春野櫻', romaji: 'Haruno Sakura', meaning: '季節：春天+櫻花', category: 'nature' },
  { kanji: '夏目涼子', romaji: 'Natsume Ryōko', meaning: '季節：夏天+涼爽', category: 'nature' },
  { kanji: '秋山紅葉', romaji: 'Akiyama Momiji', meaning: '季節：秋天+紅葉', category: 'nature' },
  { kanji: '冬木雪乃', romaji: 'Fuyuki Yukino', meaning: '季節：冬天+雪', category: 'nature' },
  { kanji: '四季彩子', romaji: 'Shiki Ayako', meaning: '季節：四季', category: 'nature' },
];

/**
 * 顏色風格名字
 */
export const COLOR_PUNS: PunName[] = [
  { kanji: '赤井秀一', romaji: 'Akai Shūichi', meaning: '顏色：紅色', category: 'nature' },
  { kanji: '青山剛昌', romaji: 'Aoyama Gōshō', meaning: '顏色：藍色', category: 'nature' },
  { kanji: '白石麻衣', romaji: 'Shiraishi Mai', meaning: '顏色：白色', category: 'nature' },
  { kanji: '黑田官兵衛', romaji: 'Kuroda Kanbee', meaning: '顏色：黑色', category: 'nature' },
  { kanji: '金城武', romaji: 'Kaneshiro Takeshi', meaning: '顏色：金色', category: 'nature' },
  { kanji: '銀河太郎', romaji: 'Ginga Tarō', meaning: '顏色：銀色', category: 'nature' },
  { kanji: '紫苑子', romaji: 'Shion Ko', meaning: '顏色：紫色', category: 'nature' },
  { kanji: '緑川光', romaji: 'Midorikawa Hikaru', meaning: '顏色：綠色', category: 'nature' },
  { kanji: '橙田花子', romaji: 'Daidai Hanako', meaning: '顏色：橘色', category: 'nature' },
  { kanji: '桃井望', romaji: 'Momoi Nozomi', meaning: '顏色：桃色', category: 'nature' },
];

/**
 * 數字風格名字
 */
export const NUMBER_PUNS: PunName[] = [
  { kanji: '一條天皇', romaji: 'Ichijō Tennō', meaning: '數字：一', category: 'history' },
  { kanji: '二宮和也', romaji: 'Ninomiya Kazunari', meaning: '數字：二', category: 'common' },
  { kanji: '三浦春馬', romaji: 'Miura Haruma', meaning: '數字：三', category: 'common' },
  { kanji: '四谷怪談', romaji: 'Yotsuya Kaidan', meaning: '數字：四', category: 'literature' },
  { kanji: '五代友厚', romaji: 'Godai Tomoatsu', meaning: '數字：五', category: 'history' },
  { kanji: '六本木', romaji: 'Roppongi', meaning: '數字：六 (地名)', category: 'place' },
  { kanji: '七瀬遙', romaji: 'Nanase Haruka', meaning: '數字：七', category: 'elegant' },
  { kanji: '八神庵', romaji: 'Yagami Iori', meaning: '數字：八', category: 'internet' },
  { kanji: '九条天', romaji: 'Kujō Ten', meaning: '數字：九', category: 'elegant' },
  { kanji: '十河太郎', romaji: 'Sōgō Tarō', meaning: '數字：十', category: 'common' },
  { kanji: '百田夏菜子', romaji: 'Momota Kanako', meaning: '數字：百', category: 'elegant' },
  { kanji: '千葉真一', romaji: 'Chiba Shinichi', meaning: '數字：千', category: 'common' },
  { kanji: '万田酵素', romaji: 'Manda Kōso', meaning: '數字：萬', category: 'food' },
];

/**
 * 偽日文台語諧音 - 台日混搭風格
 */
export const FAKE_JAPANESE_PUNS: PunName[] = [
  {
    kanji: '免給我來這套',
    romaji: 'Menkawa Raijissutao',
    meaning: '偽日文：免給我來這套',
    category: 'taiwanese',
  },
  {
    kanji: '你給我閉嘴',
    romaji: 'Rikawa Tentei',
    meaning: '偽日文：你給我閉嘴',
    category: 'taiwanese',
  },
  {
    kanji: '你是在講什麼',
    romaji: 'Rishire Kongsashō',
    meaning: '偽日文：你是在講什麼',
    category: 'taiwanese',
  },
  {
    kanji: '不要亂講話',
    romaji: 'Buyao Rankonwa',
    meaning: '偽日文：不要亂講話',
    category: 'taiwanese',
  },
  { kanji: '我聽不懂', romaji: 'Wotei Butong', meaning: '偽日文：我聽不懂', category: 'taiwanese' },
];

/**
 * 更多生活諧音
 */
export const MORE_LIFE_PUNS: PunName[] = [
  { kanji: '氣死了', romaji: 'Kishira', meaning: '中文諧音：氣死了', category: 'life' },
  { kanji: '好累喔', romaji: 'Harui O', meaning: '中文諧音：好累喔', category: 'life' },
  { kanji: '肚子餓', romaji: 'Toshi E', meaning: '中文諧音：肚子餓', category: 'life' },
  { kanji: '想睡覺', romaji: 'Sōsuika', meaning: '中文諧音：想睡覺', category: 'life' },
  { kanji: '好無聊', romaji: 'Hōmurya', meaning: '中文諧音：好無聊', category: 'life' },
  { kanji: '等一下', romaji: 'Tōikka', meaning: '中文諧音：等一下', category: 'life' },
  { kanji: '不要緊', romaji: 'Buyaokin', meaning: '中文諧音：不要緊', category: 'life' },
  { kanji: '沒關係', romaji: 'Mēkankei', meaning: '中文諧音：沒關係', category: 'life' },
];

/**
 * 更多台語諧音
 */
export const MORE_TAIWANESE_PUNS: PunName[] = [
  {
    kanji: '賀力雅路',
    romaji: 'Horikiya Michi',
    meaning: '台語諧音：好厲害',
    category: 'taiwanese',
  },
  { kanji: '足甘心', romaji: 'Ashikanshin', meaning: '台語諧音：足甘心', category: 'taiwanese' },
  { kanji: '真歹勢', romaji: 'Shintaisei', meaning: '台語諧音：真歹勢', category: 'taiwanese' },
  { kanji: '無路用', romaji: 'Murōyō', meaning: '台語諧音：無路用', category: 'taiwanese' },
  { kanji: '足爽快', romaji: 'Ashisōkai', meaning: '台語諧音：足爽快', category: 'taiwanese' },
  { kanji: '袂曉講', romaji: 'Bēhiaukong', meaning: '台語諧音：袂曉講', category: 'taiwanese' },
  { kanji: '免驚啦', romaji: 'Menkia La', meaning: '台語諧音：免驚啦', category: 'taiwanese' },
  { kanji: '攏無代誌', romaji: 'Rōmutaichi', meaning: '台語諧音：攏無代誌', category: 'taiwanese' },
];

/**
 * 更多拆字梗
 */
export const MORE_CHARACTER_PUNS: PunName[] = [
  {
    kanji: '古月胡子',
    romaji: 'Kogetsu Koko',
    meaning: '拆字梗：胡 (古+月=胡)',
    category: 'character',
  },
  {
    kanji: '言吾吾郎',
    romaji: 'Gengo Gorō',
    meaning: '拆字梗：語 (言+吾=語)',
    category: 'character',
  },
  {
    kanji: '木目相子',
    romaji: 'Mokume Sōko',
    meaning: '拆字梗：相 (木+目=相)',
    category: 'character',
  },
  {
    kanji: '口天吴子',
    romaji: 'Kōten Goko',
    meaning: '拆字梗：吴 (口+天=吴)',
    category: 'character',
  },
  {
    kanji: '人言信太郎',
    romaji: 'Jingen Shintarō',
    meaning: '拆字梗：信 (人+言=信)',
    category: 'character',
  },
  {
    kanji: '日月明子',
    romaji: 'Nichigetsu Meiko',
    meaning: '拆字梗：明 (日+月=明)',
    category: 'character',
  },
  {
    kanji: '女子好美',
    romaji: 'Joshi Kōmi',
    meaning: '拆字梗：好 (女+子=好)',
    category: 'character',
  },
  {
    kanji: '口十叶子',
    romaji: 'Kōjū Yōko',
    meaning: '拆字梗：叶 (口+十=叶)',
    category: 'character',
  },
];

/**
 * 更多網路迷因
 */
export const MORE_INTERNET_PUNS: PunName[] = [
  {
    kanji: '大丈夫太郎',
    romaji: 'Daijōbu Tarō',
    meaning: '迷因：大丈夫 (沒問題)',
    category: 'internet',
  },
  { kanji: '頑張太郎', romaji: 'Ganba Tarō', meaning: '迷因：頑張れ (加油)', category: 'internet' },
  {
    kanji: '可愛美子',
    romaji: 'Kawaii Miko',
    meaning: '迷因：可愛い (可愛)',
    category: 'internet',
  },
  { kanji: '最高太郎', romaji: 'Saikō Tarō', meaning: '迷因：最高 (最棒)', category: 'internet' },
  { kanji: '完璧子', romaji: 'Kanpeki Ko', meaning: '迷因：完璧 (完美)', category: 'internet' },
  { kanji: '天才太郎', romaji: 'Tensai Tarō', meaning: '迷因：天才', category: 'internet' },
  { kanji: '本気子', romaji: 'Honki Ko', meaning: '迷因：本気 (認真)', category: 'internet' },
  { kanji: '無理太郎', romaji: 'Muri Tarō', meaning: '迷因：無理 (不可能)', category: 'internet' },
  {
    kanji: '了解太郎',
    romaji: 'Ryōkai Tarō',
    meaning: '迷因：了解 (知道了)',
    category: 'internet',
  },
  { kanji: '失礼子', romaji: 'Shitsurei Ko', meaning: '迷因：失礼 (失禮)', category: 'internet' },
];

/**
 * 更多優雅名字
 */
export const MORE_ELEGANT_PUNS: PunName[] = [
  { kanji: '白石美帆', romaji: 'Shiraishi Miho', meaning: '優雅：白石+美帆', category: 'elegant' },
  {
    kanji: '吉高由里子',
    romaji: 'Yoshitaka Yuriko',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  {
    kanji: '有村架純',
    romaji: 'Arimura Kasumi',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  { kanji: '永野芽郁', romaji: 'Nagano Mei', meaning: '優雅：知名女星同名', category: 'elegant' },
  { kanji: '森七菜', romaji: 'Mori Nana', meaning: '優雅：知名女星同名', category: 'elegant' },
  { kanji: '今田美桜', romaji: 'Imada Mio', meaning: '優雅：知名女星同名', category: 'elegant' },
  {
    kanji: '浜辺美波',
    romaji: 'Hamabe Minami',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
  {
    kanji: '川口春奈',
    romaji: 'Kawaguchi Haruna',
    meaning: '優雅：知名女星同名',
    category: 'elegant',
  },
];

/**
 * 更多男性名字
 */
export const MALE_PUNS: PunName[] = [
  {
    kanji: '山下智久',
    romaji: 'Yamashita Tomohisa',
    meaning: '常見：知名藝人同名',
    category: 'common',
  },
  { kanji: '松本潤', romaji: 'Matsumoto Jun', meaning: '常見：嵐成員同名', category: 'common' },
  { kanji: '相葉雅紀', romaji: 'Aiba Masaki', meaning: '常見：嵐成員同名', category: 'common' },
  { kanji: '大野智', romaji: 'Ōno Satoshi', meaning: '常見：嵐成員同名', category: 'common' },
  {
    kanji: '福山雅治',
    romaji: 'Fukuyama Masaharu',
    meaning: '常見：知名藝人同名',
    category: 'common',
  },
  { kanji: '菅田将暉', romaji: 'Suda Masaki', meaning: '常見：知名演員同名', category: 'common' },
  {
    kanji: '神木隆之介',
    romaji: 'Kamiki Ryūnosuke',
    meaning: '常見：知名演員同名',
    category: 'common',
  },
  { kanji: '佐藤健', romaji: 'Satō Takeru', meaning: '常見：知名演員同名', category: 'common' },
];

/**
 * 更多食物相關
 */
export const MORE_FOOD_PUNS: PunName[] = [
  { kanji: '珍珠奶茶子', romaji: 'Shinju Naicha Ko', meaning: '食物：珍珠奶茶', category: 'food' },
  { kanji: '鳳梨酥子', romaji: 'Hōrisu Ko', meaning: '食物：鳳梨酥', category: 'food' },
  { kanji: '臭豆腐太郎', romaji: 'Shūdōfu Tarō', meaning: '食物：臭豆腐', category: 'food' },
  { kanji: '滷肉飯子', romaji: 'Rōnikuhan Ko', meaning: '食物：滷肉飯', category: 'food' },
  { kanji: '小籠包太郎', romaji: 'Shōronpō Tarō', meaning: '食物：小籠包', category: 'food' },
  { kanji: '雞排太郎', romaji: 'Jiipai Tarō', meaning: '食物：雞排', category: 'food' },
  { kanji: '蚵仔煎子', romaji: 'Ōajian Ko', meaning: '食物：蚵仔煎', category: 'food' },
  { kanji: '牛肉麵太郎', romaji: 'Gyūnikumen Tarō', meaning: '食物：牛肉麵', category: 'food' },
];

/**
 * 周若珍老師分享的諧音梗 (2025年12月)
 * 來源: ftnn.com.tw/news/504566
 */
export const TEACHER_ZHOU_PUNS: PunName[] = [
  {
    kanji: '大又池久',
    romaji: 'Ōmata Ikehisa',
    meaning: '台語諧音：大又一久 (持久)',
    category: 'taiwanese',
  },
  {
    kanji: '三石功分',
    romaji: 'Mitsuishi Kōbun',
    meaning: '台語諧音：三十公分',
    category: 'taiwanese',
  },
  {
    kanji: '水甲有春',
    romaji: 'Mizuka Yuharu',
    meaning: '台語諧音：水甲有春',
    category: 'taiwanese',
  },
  {
    kanji: '吉開美丸',
    romaji: 'Yoshikai Mimaru',
    meaning: '台語諧音：吉開美丸',
    category: 'taiwanese',
  },
  {
    kanji: '梅前好久',
    romaji: 'Umemae Yoshihisa',
    meaning: '台語諧音：沒前好久',
    category: 'taiwanese',
  },
  {
    kanji: '愛葉喜八郎',
    romaji: 'Aiba Kihachirō',
    meaning: '台語諧音：愛葉喜八郎',
    category: 'taiwanese',
  },
  {
    kanji: '五六不能王',
    romaji: 'Goroku Funōō',
    meaning: '台語諧音：五六不能王',
    category: 'taiwanese',
  },
  {
    kanji: '愛宮森秋',
    romaji: 'Aikyū Moriaki',
    meaning: '台語諧音：愛講森七',
    category: 'taiwanese',
  },
  {
    kanji: '里宮清楚',
    romaji: 'Rikyū Seiso',
    meaning: '台語諧音：你講清楚',
    category: 'taiwanese',
  },
  {
    kanji: '北七喜利',
    romaji: 'Hokushichi Kiri',
    meaning: '台語諧音：北七 (罵人)',
    category: 'taiwanese',
  },
  {
    kanji: '亀岡在那',
    romaji: 'Kameoka Zaina',
    meaning: '台語諧音：龜在哪',
    category: 'taiwanese',
  },
  { kanji: '伊飼悟零', romaji: 'Ishi Gorei', meaning: '台語諧音：伊是五零', category: 'taiwanese' },
];

/**
 * 網友創作諧音梗
 */
export const NETIZEN_PUNS: PunName[] = [
  {
    kanji: '瀧宗免吉',
    romaji: 'Takimune Menkichi',
    meaning: '網友創作：瀧宗免吉',
    category: 'internet',
  },
  { kanji: '哲利鉄', romaji: 'Tessuri Tetsu', meaning: '網友創作：哲利鉄', category: 'internet' },
  {
    kanji: '甲賀稻休波',
    romaji: 'Kōga Inayuha',
    meaning: '網友創作：甲賀稻休波',
    category: 'internet',
  },
  { kanji: '吾堂去兵', romaji: 'Godō Kyohei', meaning: '網友創作：我等去兵', category: 'internet' },
  { kanji: '辣薩咪呀', romaji: 'Rasa Miya', meaning: '網友創作：辣薩咪呀', category: 'internet' },
  { kanji: '三井奥淚', romaji: 'Mitsui Orui', meaning: '網友創作：三井奥淚', category: 'internet' },
];

/**
 * 更多真實日本姓氏組合
 */
export const REAL_JAPANESE_SURNAMES: PunName[] = [
  // 鈴木系列
  { kanji: '鈴木太郎', romaji: 'Suzuki Tarō', meaning: '常見：日本第二大姓', category: 'common' },
  { kanji: '鈴木花子', romaji: 'Suzuki Hanako', meaning: '常見：日本第二大姓', category: 'common' },
  {
    kanji: '鈴木健一',
    romaji: 'Suzuki Kenichi',
    meaning: '常見：日本第二大姓',
    category: 'common',
  },
  { kanji: '鈴木美咲', romaji: 'Suzuki Misaki', meaning: '常見：日本第二大姓', category: 'common' },
  // 高橋系列
  {
    kanji: '高橋太郎',
    romaji: 'Takahashi Tarō',
    meaning: '常見：日本第三大姓',
    category: 'common',
  },
  {
    kanji: '高橋花子',
    romaji: 'Takahashi Hanako',
    meaning: '常見：日本第三大姓',
    category: 'common',
  },
  { kanji: '高橋翔', romaji: 'Takahashi Shō', meaning: '常見：日本第三大姓', category: 'common' },
  {
    kanji: '高橋美月',
    romaji: 'Takahashi Mizuki',
    meaning: '常見：日本第三大姓',
    category: 'common',
  },
  // 田中系列
  { kanji: '田中太郎', romaji: 'Tanaka Tarō', meaning: '常見：日本第四大姓', category: 'common' },
  { kanji: '田中花子', romaji: 'Tanaka Hanako', meaning: '常見：日本第四大姓', category: 'common' },
  { kanji: '田中健', romaji: 'Tanaka Ken', meaning: '常見：日本第四大姓', category: 'common' },
  { kanji: '田中愛', romaji: 'Tanaka Ai', meaning: '常見：日本第四大姓', category: 'common' },
  // 渡邊系列
  { kanji: '渡邊太郎', romaji: 'Watanabe Tarō', meaning: '常見：日本第五大姓', category: 'common' },
  {
    kanji: '渡邊花子',
    romaji: 'Watanabe Hanako',
    meaning: '常見：日本第五大姓',
    category: 'common',
  },
  {
    kanji: '渡邊直美',
    romaji: 'Watanabe Naomi',
    meaning: '常見：知名藝人同名',
    category: 'common',
  },
  {
    kanji: '渡邊翔太',
    romaji: 'Watanabe Shōta',
    meaning: '常見：日本第五大姓',
    category: 'common',
  },
  // 伊藤系列
  { kanji: '伊藤太郎', romaji: 'Itō Tarō', meaning: '常見：日本第六大姓', category: 'common' },
  { kanji: '伊藤花子', romaji: 'Itō Hanako', meaning: '常見：日本第六大姓', category: 'common' },
  { kanji: '伊藤博文', romaji: 'Itō Hirobumi', meaning: '歷史：明治時代首相', category: 'history' },
  { kanji: '伊藤美誠', romaji: 'Itō Mima', meaning: '常見：知名桌球選手', category: 'common' },
  // 山本系列
  {
    kanji: '山本太郎',
    romaji: 'Yamamoto Tarō',
    meaning: '常見：日本第十二大姓',
    category: 'common',
  },
  {
    kanji: '山本花子',
    romaji: 'Yamamoto Hanako',
    meaning: '常見：日本第十二大姓',
    category: 'common',
  },
  {
    kanji: '山本五十六',
    romaji: 'Yamamoto Isoroku',
    meaning: '歷史：二戰海軍大將',
    category: 'history',
  },
  { kanji: '山本耕史', romaji: 'Yamamoto Kōji', meaning: '常見：知名演員同名', category: 'common' },
  // 中村系列
  { kanji: '中村太郎', romaji: 'Nakamura Tarō', meaning: '常見：日本第七大姓', category: 'common' },
  {
    kanji: '中村花子',
    romaji: 'Nakamura Hanako',
    meaning: '常見：日本第七大姓',
    category: 'common',
  },
  {
    kanji: '中村倫也',
    romaji: 'Nakamura Tomoya',
    meaning: '常見：知名演員同名',
    category: 'common',
  },
  {
    kanji: '中村獅童',
    romaji: 'Nakamura Shidō',
    meaning: '常見：知名歌舞伎演員',
    category: 'common',
  },
  // 小林系列
  {
    kanji: '小林太郎',
    romaji: 'Kobayashi Tarō',
    meaning: '常見：日本第九大姓',
    category: 'common',
  },
  {
    kanji: '小林花子',
    romaji: 'Kobayashi Hanako',
    meaning: '常見：日本第九大姓',
    category: 'common',
  },
  {
    kanji: '小林誠',
    romaji: 'Kobayashi Makoto',
    meaning: '常見：諾貝爾物理學獎得主',
    category: 'common',
  },
  { kanji: '小林由依', romaji: 'Kobayashi Yui', meaning: '常見：知名偶像同名', category: 'common' },
];

/**
 * 更多台灣地名諧音
 */
export const MORE_PLACE_PUNS: PunName[] = [
  { kanji: '嘉義美子', romaji: 'Kagi Miko', meaning: '地名：嘉義', category: 'place' },
  { kanji: '屏東太郎', romaji: 'Heidō Tarō', meaning: '地名：屏東', category: 'place' },
  { kanji: '宜蘭子', romaji: 'Gilan Ko', meaning: '地名：宜蘭', category: 'place' },
  { kanji: '桃園太郎', romaji: 'Tōen Tarō', meaning: '地名：桃園', category: 'place' },
  { kanji: '彰化美子', romaji: 'Shōka Miko', meaning: '地名：彰化', category: 'place' },
  { kanji: '雲林太郎', romaji: 'Unrin Tarō', meaning: '地名：雲林', category: 'place' },
  { kanji: '南投子', romaji: 'Nantō Ko', meaning: '地名：南投', category: 'place' },
  { kanji: '苗栗太郎', romaji: 'Byōritsu Tarō', meaning: '地名：苗栗', category: 'place' },
  { kanji: '澎湖子', romaji: 'Hōko Ko', meaning: '地名：澎湖', category: 'place' },
  { kanji: '金門太郎', romaji: 'Kinmon Tarō', meaning: '地名：金門', category: 'place' },
  { kanji: '馬祖子', romaji: 'Maso Ko', meaning: '地名：馬祖', category: 'place' },
  { kanji: '綠島太郎', romaji: 'Ryokutō Tarō', meaning: '地名：綠島', category: 'place' },
  { kanji: '蘭嶼子', romaji: 'Ranyo Ko', meaning: '地名：蘭嶼', category: 'place' },
  { kanji: '九份美子', romaji: 'Kyūfun Miko', meaning: '地名：九份', category: 'place' },
  { kanji: '十分太郎', romaji: 'Jūbun Tarō', meaning: '地名：十分', category: 'place' },
];

/**
 * 更多歷史人物
 */
export const MORE_HISTORY_PUNS: PunName[] = [
  {
    kanji: '北條政子',
    romaji: 'Hōjō Masako',
    meaning: '歷史：鎌倉幕府執權之妻',
    category: 'history',
  },
  {
    kanji: '源義經',
    romaji: 'Minamoto no Yoshitsune',
    meaning: '歷史：平安時代武將',
    category: 'history',
  },
  {
    kanji: '平清盛',
    romaji: 'Taira no Kiyomori',
    meaning: '歷史：平安時代太政大臣',
    category: 'history',
  },
  {
    kanji: '足利義滿',
    romaji: 'Ashikaga Yoshimitsu',
    meaning: '歷史：室町幕府將軍',
    category: 'history',
  },
  {
    kanji: '北條時宗',
    romaji: 'Hōjō Tokimune',
    meaning: '歷史：蒙古來襲時的執權',
    category: 'history',
  },
  { kanji: '前田利家', romaji: 'Maeda Toshiie', meaning: '歷史：戰國大名', category: 'history' },
  { kanji: '淺井長政', romaji: 'Azai Nagamasa', meaning: '歷史：戰國大名', category: 'history' },
  {
    kanji: '明智光秀',
    romaji: 'Akechi Mitsuhide',
    meaning: '歷史：本能寺之變',
    category: 'history',
  },
  {
    kanji: '石田三成',
    romaji: 'Ishida Mitsunari',
    meaning: '歷史：關原之戰西軍大將',
    category: 'history',
  },
  { kanji: '直江兼續', romaji: 'Naoe Kanetsugu', meaning: '歷史：上杉家家老', category: 'history' },
  { kanji: '服部半藏', romaji: 'Hattori Hanzō', meaning: '歷史：德川家忍者', category: 'history' },
  {
    kanji: '柳生十兵衛',
    romaji: 'Yagyū Jūbei',
    meaning: '歷史：江戶時代劍豪',
    category: 'history',
  },
];

/**
 * 更多文學家
 */
export const MORE_LITERATURE_PUNS: PunName[] = [
  {
    kanji: '與謝野晶子',
    romaji: 'Yosano Akiko',
    meaning: '文學：明治時代女詩人',
    category: 'literature',
  },
  {
    kanji: '正岡子規',
    romaji: 'Masaoka Shiki',
    meaning: '文學：明治時代俳人',
    category: 'literature',
  },
  {
    kanji: '島崎藤村',
    romaji: 'Shimazaki Tōson',
    meaning: '文學：明治時代詩人',
    category: 'literature',
  },
  {
    kanji: '二葉亭四迷',
    romaji: 'Futabatei Shimei',
    meaning: '文學：明治時代小說家',
    category: 'literature',
  },
  {
    kanji: '坪內逍遙',
    romaji: 'Tsubouchi Shōyō',
    meaning: '文學：明治時代劇作家',
    category: 'literature',
  },
  {
    kanji: '森鷗外',
    romaji: 'Mori Ōgai',
    meaning: '文學：明治時代軍醫作家',
    category: 'literature',
  },
  { kanji: '志賀直哉', romaji: 'Shiga Naoya', meaning: '文學：白樺派作家', category: 'literature' },
  {
    kanji: '武者小路實篤',
    romaji: 'Mushanokōji Saneatsu',
    meaning: '文學：白樺派作家',
    category: 'literature',
  },
  {
    kanji: '永井荷風',
    romaji: 'Nagai Kafū',
    meaning: '文學：大正時代作家',
    category: 'literature',
  },
  {
    kanji: '横光利一',
    romaji: 'Yokomitsu Riichi',
    meaning: '文學：新感覺派作家',
    category: 'literature',
  },
  {
    kanji: '井上靖',
    romaji: 'Inoue Yasushi',
    meaning: '文學：昭和時代作家',
    category: 'literature',
  },
  {
    kanji: '遠藤周作',
    romaji: 'Endō Shūsaku',
    meaning: '文學：昭和時代作家',
    category: 'literature',
  },
];

/**
 * 更多動漫角色
 */
export const MORE_ANIME_PUNS: PunName[] = [
  { kanji: '禰豆子', romaji: 'Nezuko', meaning: '動漫：鬼滅之刃', category: 'internet' },
  {
    kanji: '富岡義勇',
    romaji: 'Tomioka Giyū',
    meaning: '動漫：鬼滅之刃水柱',
    category: 'internet',
  },
  {
    kanji: '煉獄杏壽郎',
    romaji: 'Rengoku Kyōjurō',
    meaning: '動漫：鬼滅之刃炎柱',
    category: 'internet',
  },
  { kanji: '胡蝶忍', romaji: 'Kochō Shinobu', meaning: '動漫：鬼滅之刃蟲柱', category: 'internet' },
  { kanji: '伏黒惠', romaji: 'Fushiguro Megumi', meaning: '動漫：咒術迴戰', category: 'internet' },
  {
    kanji: '釘崎野薔薇',
    romaji: 'Kugisaki Nobara',
    meaning: '動漫：咒術迴戰',
    category: 'internet',
  },
  { kanji: '夜神月', romaji: 'Yagami Light', meaning: '動漫：死亡筆記本', category: 'internet' },
  {
    kanji: '江戶川柯南',
    romaji: 'Edogawa Konan',
    meaning: '動漫：名偵探柯南',
    category: 'internet',
  },
  { kanji: '毛利蘭', romaji: 'Mōri Ran', meaning: '動漫：名偵探柯南', category: 'internet' },
  {
    kanji: '野原新之助',
    romaji: 'Nohara Shinnosuke',
    meaning: '動漫：蠟筆小新',
    category: 'internet',
  },
  {
    kanji: '櫻木花道',
    romaji: 'Sakuragi Hanamichi',
    meaning: '動漫：灌籃高手',
    category: 'internet',
  },
  { kanji: '流川楓', romaji: 'Rukawa Kaede', meaning: '動漫：灌籃高手', category: 'internet' },
  { kanji: '赤木剛憲', romaji: 'Akagi Takenori', meaning: '動漫：灌籃高手', category: 'internet' },
  { kanji: '三井壽', romaji: 'Mitsui Hisashi', meaning: '動漫：灌籃高手', category: 'internet' },
  { kanji: '宮城良田', romaji: 'Miyagi Ryōta', meaning: '動漫：灌籃高手', category: 'internet' },
];

/**
 * 更多自然元素
 */
export const MORE_NATURE_PUNS: PunName[] = [
  { kanji: '雨宮天', romaji: 'Amamiya Sora', meaning: '自然：雨+宮+天', category: 'nature' },
  { kanji: '水樹奈々', romaji: 'Mizuki Nana', meaning: '自然：水+樹', category: 'nature' },
  { kanji: '花澤香菜', romaji: 'Hanazawa Kana', meaning: '自然：花+澤', category: 'nature' },
  { kanji: '早見沙織', romaji: 'Hayami Saori', meaning: '自然：早+見', category: 'nature' },
  { kanji: '茅野愛衣', romaji: 'Kayano Ai', meaning: '自然：茅+野', category: 'nature' },
  { kanji: '日笠陽子', romaji: 'Hikasa Yōko', meaning: '自然：日+笠+陽', category: 'nature' },
  { kanji: '雪野五月', romaji: 'Yukino Satsuki', meaning: '自然：雪+野+五月', category: 'nature' },
  { kanji: '林原惠', romaji: 'Hayashibara Megumi', meaning: '自然：林+原', category: 'nature' },
  { kanji: '緒方惠美', romaji: 'Ogata Megumi', meaning: '自然：緒+方', category: 'nature' },
  {
    kanji: '澤城美雪',
    romaji: 'Sawashiro Miyuki',
    meaning: '自然：澤+城+美雪',
    category: 'nature',
  },
  { kanji: '坂本真綾', romaji: 'Sakamoto Maaya', meaning: '自然：坂+本', category: 'nature' },
  { kanji: '田村由香里', romaji: 'Tamura Yukari', meaning: '自然：田+村', category: 'nature' },
];

/**
 * 更多經典諧音 (補充)
 */
export const EXTRA_CLASSIC_PUNS: PunName[] = [
  { kanji: '佐藤太郎', romaji: 'Satō Tarō', meaning: '常見：日本最大姓', category: 'common' },
  { kanji: '佐藤花子', romaji: 'Satō Hanako', meaning: '常見：日本最大姓', category: 'common' },
  { kanji: '佐藤健太', romaji: 'Satō Kenta', meaning: '常見：日本最大姓', category: 'common' },
  { kanji: '佐藤美咲', romaji: 'Satō Misaki', meaning: '常見：日本最大姓', category: 'common' },
  { kanji: '加藤太郎', romaji: 'Katō Tarō', meaning: '常見：日本第十大姓', category: 'common' },
  { kanji: '加藤花子', romaji: 'Katō Hanako', meaning: '常見：日本第十大姓', category: 'common' },
  {
    kanji: '吉田太郎',
    romaji: 'Yoshida Tarō',
    meaning: '常見：日本第十一大姓',
    category: 'common',
  },
  {
    kanji: '吉田花子',
    romaji: 'Yoshida Hanako',
    meaning: '常見：日本第十一大姓',
    category: 'common',
  },
  { kanji: '齋藤太郎', romaji: 'Saitō Tarō', meaning: '常見：日本第十三大姓', category: 'common' },
  {
    kanji: '齋藤花子',
    romaji: 'Saitō Hanako',
    meaning: '常見：日本第十三大姓',
    category: 'common',
  },
  {
    kanji: '松本太郎',
    romaji: 'Matsumoto Tarō',
    meaning: '常見：日本第十四大姓',
    category: 'common',
  },
  {
    kanji: '松本花子',
    romaji: 'Matsumoto Hanako',
    meaning: '常見：日本第十四大姓',
    category: 'common',
  },
  { kanji: '井上太郎', romaji: 'Inoue Tarō', meaning: '常見：日本第十五大姓', category: 'common' },
  {
    kanji: '井上花子',
    romaji: 'Inoue Hanako',
    meaning: '常見：日本第十五大姓',
    category: 'common',
  },
  { kanji: '木村太郎', romaji: 'Kimura Tarō', meaning: '常見：日本第十六大姓', category: 'common' },
  {
    kanji: '木村花子',
    romaji: 'Kimura Hanako',
    meaning: '常見：日本第十六大姓',
    category: 'common',
  },
  { kanji: '林太郎', romaji: 'Hayashi Tarō', meaning: '常見：日本第十七大姓', category: 'common' },
  {
    kanji: '林花子',
    romaji: 'Hayashi Hanako',
    meaning: '常見：日本第十七大姓',
    category: 'common',
  },
  {
    kanji: '清水太郎',
    romaji: 'Shimizu Tarō',
    meaning: '常見：日本第十八大姓',
    category: 'common',
  },
  {
    kanji: '清水花子',
    romaji: 'Shimizu Hanako',
    meaning: '常見：日本第十八大姓',
    category: 'common',
  },
];

/**
 * 更多諧音梗 - 日常用語
 */
export const DAILY_PUNS: PunName[] = [
  { kanji: '今日和子', romaji: 'Kyōwa Ko', meaning: '日語：今日は (你好)', category: 'life' },
  { kanji: '元気太郎', romaji: 'Genki Tarō', meaning: '日語：元気 (有精神)', category: 'life' },
  { kanji: '大丈夫子', romaji: 'Daijōbu Ko', meaning: '日語：大丈夫 (沒問題)', category: 'life' },
  { kanji: '頑張太郎', romaji: 'Ganbaru Tarō', meaning: '日語：頑張れ (加油)', category: 'life' },
  { kanji: '可愛子', romaji: 'Kawaii Ko', meaning: '日語：可愛い (可愛)', category: 'life' },
  { kanji: '最高太郎', romaji: 'Saikō Tarō', meaning: '日語：最高 (最棒)', category: 'life' },
  { kanji: '完璧子', romaji: 'Kanpeki Ko', meaning: '日語：完璧 (完美)', category: 'life' },
  { kanji: '素敵子', romaji: 'Suteki Ko', meaning: '日語：素敵 (很棒)', category: 'life' },
  { kanji: '嬉子', romaji: 'Ureshi Ko', meaning: '日語：嬉しい (高興)', category: 'life' },
  { kanji: '悲子', romaji: 'Kanashi Ko', meaning: '日語：悲しい (悲傷)', category: 'life' },
];

/**
 * 更多經典日本名字
 */
export const MORE_JAPANESE_NAMES: PunName[] = [
  // 武士名字風格
  { kanji: '坂本龍馬', romaji: 'Sakamoto Ryōma', meaning: '歷史：幕末志士', category: 'history' },
  {
    kanji: '西郷隆盛',
    romaji: 'Saigō Takamori',
    meaning: '歷史：明治維新功臣',
    category: 'history',
  },
  { kanji: '勝海舟', romaji: 'Katsu Kaishū', meaning: '歷史：幕末政治家', category: 'history' },
  {
    kanji: '高杉晋作',
    romaji: 'Takasugi Shinsaku',
    meaning: '歷史：幕末志士',
    category: 'history',
  },
  {
    kanji: '桂小五郎',
    romaji: 'Katsura Kogorō',
    meaning: '歷史：維新三傑之一',
    category: 'history',
  },
  {
    kanji: '大久保利通',
    romaji: 'Ōkubo Toshimichi',
    meaning: '歷史：維新三傑之一',
    category: 'history',
  },
  {
    kanji: '岩倉具視',
    romaji: 'Iwakura Tomomi',
    meaning: '歷史：明治時代政治家',
    category: 'history',
  },
  {
    kanji: '板垣退助',
    romaji: 'Itagaki Taisuke',
    meaning: '歷史：自由民權運動領袖',
    category: 'history',
  },
  // 現代名人
  { kanji: '新垣結衣', romaji: 'Aragaki Yui', meaning: '常見：知名女星同名', category: 'common' },
  {
    kanji: '石原聰美',
    romaji: 'Ishihara Satomi',
    meaning: '常見：知名女星同名',
    category: 'common',
  },
  { kanji: '綾瀨遙', romaji: 'Ayase Haruka', meaning: '常見：知名女星同名', category: 'common' },
  {
    kanji: '長澤雅美',
    romaji: 'Nagasawa Masami',
    meaning: '常見：知名女星同名',
    category: 'common',
  },
  {
    kanji: '北川景子',
    romaji: 'Kitagawa Keiko',
    meaning: '常見：知名女星同名',
    category: 'common',
  },
  { kanji: '深田恭子', romaji: 'Fukada Kyōko', meaning: '常見：知名女星同名', category: 'common' },
  { kanji: '上戶彩', romaji: 'Ueto Aya', meaning: '常見：知名女星同名', category: 'common' },
  {
    kanji: '仲間由紀惠',
    romaji: 'Nakama Yukie',
    meaning: '常見：知名女星同名',
    category: 'common',
  },
  // 男藝人
  { kanji: '木村拓哉', romaji: 'Kimura Takuya', meaning: '常見：知名藝人同名', category: 'common' },
  { kanji: '香取慎吾', romaji: 'Katori Shingo', meaning: '常見：知名藝人同名', category: 'common' },
  {
    kanji: '草彅剛',
    romaji: 'Kusanagi Tsuyoshi',
    meaning: '常見：知名藝人同名',
    category: 'common',
  },
  { kanji: '稲垣吾郎', romaji: 'Inagaki Gorō', meaning: '常見：知名藝人同名', category: 'common' },
  {
    kanji: '中居正広',
    romaji: 'Nakai Masahiro',
    meaning: '常見：知名藝人同名',
    category: 'common',
  },
  { kanji: '岡田准一', romaji: 'Okada Junichi', meaning: '常見：知名藝人同名', category: 'common' },
  { kanji: '堺雅人', romaji: 'Sakai Masato', meaning: '常見：知名演員同名', category: 'common' },
  {
    kanji: '西島秀俊',
    romaji: 'Nishijima Hidetoshi',
    meaning: '常見：知名演員同名',
    category: 'common',
  },
];

/**
 * 更多諧音梗 - 動物相關
 */
export const ANIMAL_PUNS: PunName[] = [
  { kanji: '猫田太郎', romaji: 'Nekoda Tarō', meaning: '動物：貓+田', category: 'nature' },
  { kanji: '犬山花子', romaji: 'Inuyama Hanako', meaning: '動物：狗+山', category: 'nature' },
  { kanji: '鳥居美咲', romaji: 'Torii Misaki', meaning: '動物：鳥+居', category: 'nature' },
  { kanji: '熊谷翔', romaji: 'Kumagai Shō', meaning: '動物：熊+谷', category: 'nature' },
  { kanji: '鶴田健一', romaji: 'Tsuruta Kenichi', meaning: '動物：鶴+田', category: 'nature' },
  { kanji: '亀井愛', romaji: 'Kamei Ai', meaning: '動物：龜+井', category: 'nature' },
  { kanji: '馬場太郎', romaji: 'Baba Tarō', meaning: '動物：馬+場', category: 'nature' },
  { kanji: '羊田花子', romaji: 'Hitsuida Hanako', meaning: '動物：羊+田', category: 'nature' },
];

/**
 * 更多諧音梗 - 職業相關
 */
export const MORE_OCCUPATION_PUNS: PunName[] = [
  { kanji: '醫者太郎', romaji: 'Isha Tarō', meaning: '職業：醫者 (醫生)', category: 'occupation' },
  {
    kanji: '教師花子',
    romaji: 'Kyōshi Hanako',
    meaning: '職業：教師 (老師)',
    category: 'occupation',
  },
  {
    kanji: '警官太郎',
    romaji: 'Keikan Tarō',
    meaning: '職業：警官 (警察)',
    category: 'occupation',
  },
  {
    kanji: '料理人花子',
    romaji: 'Ryōrinin Hanako',
    meaning: '職業：料理人 (廚師)',
    category: 'occupation',
  },
  {
    kanji: '運転手太郎',
    romaji: 'Untenshu Tarō',
    meaning: '職業：運転手 (司機)',
    category: 'occupation',
  },
  {
    kanji: '看護師花子',
    romaji: 'Kangoshi Hanako',
    meaning: '職業：看護師 (護士)',
    category: 'occupation',
  },
  {
    kanji: '弁護士太郎',
    romaji: 'Bengoshi Tarō',
    meaning: '職業：弁護士 (律師)',
    category: 'occupation',
  },
  {
    kanji: '会計士花子',
    romaji: 'Kaikeishi Hanako',
    meaning: '職業：会計士 (會計師)',
    category: 'occupation',
  },
];

/**
 * 更多諧音梗 - 感情相關
 */
export const EMOTION_PUNS: PunName[] = [
  { kanji: '愛田太郎', romaji: 'Aida Tarō', meaning: '感情：愛+田', category: 'life' },
  { kanji: '恋野花子', romaji: 'Koino Hanako', meaning: '感情：戀+野', category: 'life' },
  { kanji: '幸村翔', romaji: 'Yukimura Shō', meaning: '感情：幸+村', category: 'life' },
  { kanji: '喜多川愛', romaji: 'Kitagawa Ai', meaning: '感情：喜+多川', category: 'life' },
  { kanji: '楽田健一', romaji: 'Tanoda Kenichi', meaning: '感情：樂+田', category: 'life' },
  { kanji: '和田美咲', romaji: 'Wada Misaki', meaning: '感情：和+田', category: 'life' },
  { kanji: '希望太郎', romaji: 'Kibō Tarō', meaning: '感情：希望', category: 'life' },
  { kanji: '夢野花子', romaji: 'Yumeno Hanako', meaning: '感情：夢+野', category: 'life' },
  { kanji: '笑田翔', romaji: 'Waraida Shō', meaning: '感情：笑+田', category: 'life' },
  { kanji: '涙川美咲', romaji: 'Namidagawa Misaki', meaning: '感情：淚+川', category: 'life' },
  { kanji: '怒田健一', romaji: 'Ikarida Kenichi', meaning: '感情：怒+田', category: 'life' },
  { kanji: '驚野愛', romaji: 'Odorokino Ai', meaning: '感情：驚+野', category: 'life' },
  { kanji: '優田花子', romaji: 'Yasashida Hanako', meaning: '感情：優+田', category: 'life' },
  { kanji: '強田太郎', romaji: 'Tsuyoda Tarō', meaning: '感情：強+田', category: 'life' },
];

/**
 * 2025年網路熱門諧音梗 - 來自 Threads/Dcard/PTT
 * 來源: CSV 整合 + 網路搜集
 */
export const VIRAL_PUNS_2025: PunName[] = [
  // 經典梅川系列
  { kanji: '梅川伊芙', romaji: 'Umekawa Ifu', meaning: '中文諧音：沒穿衣服', category: 'classic' },
  { kanji: '梅川庫子', romaji: 'Umekawa Kuko', meaning: '中文諧音：沒穿褲子', category: 'classic' },
  {
    kanji: '梅川內伊庫',
    romaji: 'Umekawa Naiiku',
    meaning: '中文諧音：沒穿內衣褲',
    category: 'classic',
  },
  { kanji: '梅川酷子', romaji: 'Umekawa Kūko', meaning: '中文諧音：沒穿褲子', category: 'classic' },
  { kanji: '梅川羽依', romaji: 'Umekawa Ui', meaning: '中文諧音：沒穿雨衣', category: 'classic' },
  {
    kanji: '梅川協子',
    romaji: 'Umekawa Kyōko',
    meaning: '中文諧音：沒穿鞋子',
    category: 'classic',
  },

  // 窮到系列
  {
    kanji: '稉稻穗宮圖',
    romaji: 'Kyōdō Suikyūzu',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },
  {
    kanji: '窮稻穗宮圓',
    romaji: 'Kyūdō Suikyūen',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },
  {
    kanji: '穹道穗宮源',
    romaji: 'Kyūdō Suikyūgen',
    meaning: '中文諧音：窮到睡公園',
    category: 'wealth',
  },

  // 身上沒錢系列
  {
    kanji: '森上梅友前',
    romaji: 'Morigami Baiyūzen',
    meaning: '中文諧音：身上沒有錢',
    category: 'wealth',
  },
  {
    kanji: '森上梅戴前',
    romaji: 'Morigami Maitaisen',
    meaning: '中文諧音：身上沒帶錢',
    category: 'wealth',
  },

  // 食物飲料
  { kanji: '黑堂真乃', romaji: 'Kurodō Mano', meaning: '中文諧音：黑糖珍奶', category: 'food' },
  {
    kanji: '五十嵐太貴',
    romaji: 'Igarashi Taiki',
    meaning: '中文諧音：50嵐太貴',
    category: 'food',
  },
  { kanji: '久菜和子', romaji: 'Kunai Kazuko', meaning: '中文諧音：韭菜盒子', category: 'food' },
  { kanji: '玖菜河子', romaji: 'Kunai Kako', meaning: '中文諧音：韭菜盒子', category: 'food' },

  // 台語諧音經典
  {
    kanji: '夏夕夏井',
    romaji: 'Natsuyu Natsui',
    meaning: '台語諧音：丟人現眼',
    category: 'taiwanese',
  },
  {
    kanji: '宮美春掐',
    romaji: 'Miyami Haruka',
    meaning: '台語諧音：形容人講不聽',
    category: 'taiwanese',
  },
  {
    kanji: '高希音娜',
    romaji: 'Takaki Onna',
    meaning: '台語諧音：猴死囝仔',
    category: 'taiwanese',
  },
  {
    kanji: '高希櫻娜',
    romaji: 'Takaki Sakurana',
    meaning: '台語諧音：死小孩',
    category: 'taiwanese',
  },

  // 成人向（標註）
  {
    kanji: '櫻京塚杖',
    romaji: 'Sakurazuka Jō',
    meaning: '成人向諧音：男性部位腫脹',
    category: 'classic',
  },
  {
    kanji: '大佑池久',
    romaji: 'Daisuke Ikehisa',
    meaning: '成人向諧音：大又持久',
    category: 'classic',
  },
  {
    kanji: '大又池玖',
    romaji: 'Daiyu Ikeku',
    meaning: '成人向諧音：大又持久',
    category: 'classic',
  },
  {
    kanji: '岡門友矢',
    romaji: 'Okakado Tomoya',
    meaning: '成人向諧音：肛門有牙',
    category: 'classic',
  },

  // 生活類
  { kanji: '渦曜犬步', romaji: 'Kayō Kenpo', meaning: '中文諧音：我要全部', category: 'life' },
  { kanji: '穗道宗舞', romaji: 'Suidō Sōmai', meaning: '中文諧音：睡到中午', category: 'life' },
  {
    kanji: '粉穂杏谷澤',
    romaji: 'Konaho Anizawa',
    meaning: '中文諧音：粉碎性骨折',
    category: 'classic',
  },
  {
    kanji: '粉穗幸谷澤',
    romaji: 'Konaho Yukizawa',
    meaning: '中文諧音：粉碎性骨折',
    category: 'classic',
  },

  // 全聯系列
  {
    kanji: '泉蓮芙莉卡',
    romaji: 'Izumi Renfurika',
    meaning: '中文諧音：全聯福利卡',
    category: 'life',
  },

  // 台語罵人
  { kanji: '由宰具麻', romaji: 'Yuzai Guma', meaning: '台語諧音：有在顧嗎', category: 'taiwanese' },
  {
    kanji: '壠后莉宮',
    romaji: 'Rongo Rikyū',
    meaning: '台語諧音：攏好哩講',
    category: 'taiwanese',
  },
  {
    kanji: '鈴北舞吉',
    romaji: 'Suzukita Maikichi',
    meaning: '台語諧音：林北舞吉',
    category: 'taiwanese',
  },
  { kanji: '久武加滿', romaji: 'Hisatake Kaman', meaning: '中文諧音：酒不夠滿', category: 'life' },

  // 財富系列
  { kanji: '裁傅志由', romaji: 'Saifu Shiyu', meaning: '中文諧音：財富自由', category: 'wealth' },
  {
    kanji: '田中僑仔',
    romaji: 'Tanaka Kyōshi',
    meaning: '中文諧音：田中喬仔（有錢人）',
    category: 'wealth',
  },
  {
    kanji: '戶投野梅前',
    romaji: 'Koto Yobaimae',
    meaning: '中文諧音：戶頭有沒錢',
    category: 'wealth',
  },
  {
    kanji: '高熊梅政甫',
    romaji: 'Takakuma Baiseifu',
    meaning: '中文諧音：高雄沒政府',
    category: 'wealth',
  },

  // 衣物系列
  {
    kanji: '耀川布拉甲',
    romaji: 'Yōkawa Buraka',
    meaning: '中文諧音：要穿布拉甲',
    category: 'life',
  },

  // 經典諧音
  {
    kanji: '耿本白池',
    romaji: 'Kōmoto Hakuchi',
    meaning: '中文諧音：根本白痴',
    category: 'classic',
  },
  {
    kanji: '三石宮分',
    romaji: 'Mitsuishi Kubun',
    meaning: '中文諧音：三十公分',
    category: 'classic',
  },
  { kanji: '扁壽五郎', romaji: 'Henju Gorō', meaning: '台語諧音：騙肖五郎', category: 'taiwanese' },
  { kanji: '四幸九點', romaji: 'Shikō Kyūten', meaning: '中文諧音：四點九點', category: 'classic' },

  // 台灣地名梗
  {
    kanji: '大道韓步助',
    romaji: 'Daidō Kanposuke',
    meaning: '台語諧音：大家都幫助',
    category: 'taiwanese',
  },
  {
    kanji: '彎刀武西郎',
    romaji: 'Wantō Bushirō',
    meaning: '台語諧音：冤大頭',
    category: 'taiwanese',
  },
  {
    kanji: '一次淘汰郎',
    romaji: 'Ichiji Tōtarō',
    meaning: '台語諧音：一次淘汰郎',
    category: 'taiwanese',
  },
  { kanji: '淡水夕照子', romaji: 'Tansui Yūshōko', meaning: '地名：淡水夕照', category: 'place' },

  // 拆字梗
  {
    kanji: '竹本口木子',
    romaji: 'Takemoto Kuchikiko',
    meaning: '拆字梗：笨呆子',
    category: 'character',
  },
  { kanji: '米田共子', romaji: 'Yoneda Tomoko', meaning: '拆字梗：糞', category: 'character' },
  {
    kanji: '米田共菜菜子',
    romaji: 'Yoneda Tomonanako',
    meaning: '拆字梗：糞便菜菜子',
    category: 'character',
  },

  // 日語諧音
  {
    kanji: '八格雅魯',
    romaji: 'Hakka Yaru',
    meaning: '日文諧音：八嘎呀路（笨蛋）',
    category: 'classic',
  },

  // 網路熱門
  {
    kanji: '小林煎餅',
    romaji: 'Kobayashi Senbei',
    meaning: '品牌諧音：小林煎餅',
    category: 'food',
  },
  { kanji: '林森北', romaji: 'Rinsen Kita', meaning: '地名諧音：林森北路', category: 'place' },
  { kanji: '中山井', romaji: 'Nakayama I', meaning: '地名諧音：中山', category: 'place' },

  // 更多台語諧音
  {
    kanji: '里宮清楚',
    romaji: 'Rikyū Seiso',
    meaning: '台語諧音：你講清楚',
    category: 'taiwanese',
  },
  {
    kanji: '北七喜利',
    romaji: 'Hokushichi Kiri',
    meaning: '台語諧音：北七',
    category: 'taiwanese',
  },
  {
    kanji: '愛宮森秋',
    romaji: 'Aikyū Moriaki',
    meaning: '台語諧音：愛講森七',
    category: 'taiwanese',
  },
  {
    kanji: '亀岡在那',
    romaji: 'Kameoka Zaina',
    meaning: '台語諧音：龜在哪',
    category: 'taiwanese',
  },
  { kanji: '伊飼悟零', romaji: 'Ishi Gorei', meaning: '台語諧音：伊是五零', category: 'taiwanese' },

  // 周若珍老師分享
  {
    kanji: '大又池久',
    romaji: 'Ōmata Ikehisa',
    meaning: '台語諧音：大又一久',
    category: 'taiwanese',
  },
  {
    kanji: '三石功分',
    romaji: 'Mitsuishi Kōbun',
    meaning: '台語諧音：三十公分',
    category: 'taiwanese',
  },
  {
    kanji: '水甲有春',
    romaji: 'Mizuka Yuharu',
    meaning: '台語諧音：水甲有春',
    category: 'taiwanese',
  },
  {
    kanji: '吉開美丸',
    romaji: 'Yoshikai Mimaru',
    meaning: '台語諧音：吉開美丸',
    category: 'taiwanese',
  },
  {
    kanji: '梅前好久',
    romaji: 'Umemae Yoshihisa',
    meaning: '台語諧音：沒前好久',
    category: 'taiwanese',
  },
  {
    kanji: '愛葉喜八郎',
    romaji: 'Aiba Kihachirō',
    meaning: '台語諧音：愛葉喜八郎',
    category: 'taiwanese',
  },
  {
    kanji: '五六不能王',
    romaji: 'Goroku Funōō',
    meaning: '台語諧音：五六不能王',
    category: 'taiwanese',
  },
];

/**
 * 2025年 Threads 熱門諧音梗
 * 來源: @cvtspolo, @hajl_taiwan 等帳號
 */
export const THREADS_PUNS_2025: PunName[] = [
  {
    kanji: '賀力雅路',
    romaji: 'Horikiya Michi',
    meaning: '台語諧音：好厲害',
    category: 'taiwanese',
  },
  { kanji: '足甘心', romaji: 'Ashikanshin', meaning: '台語諧音：足甘心', category: 'taiwanese' },
  { kanji: '真歹勢', romaji: 'Shintaisei', meaning: '台語諧音：真歹勢', category: 'taiwanese' },
  { kanji: '無路用', romaji: 'Murōyō', meaning: '台語諧音：無路用', category: 'taiwanese' },
  { kanji: '足爽快', romaji: 'Ashisōkai', meaning: '台語諧音：足爽快', category: 'taiwanese' },
  { kanji: '袂曉講', romaji: 'Bēhiaukong', meaning: '台語諧音：袂曉講', category: 'taiwanese' },
  { kanji: '免驚啦', romaji: 'Menkia La', meaning: '台語諧音：免驚啦', category: 'taiwanese' },
  { kanji: '攏無代誌', romaji: 'Rōmutaichi', meaning: '台語諧音：攏無代誌', category: 'taiwanese' },

  // 偽日文台語
  {
    kanji: '免給我來這套',
    romaji: 'Menkawa Raijissutao',
    meaning: '偽日文：免給我來這套',
    category: 'taiwanese',
  },
  {
    kanji: '你給我閉嘴',
    romaji: 'Rikawa Tentei',
    meaning: '偽日文：你給我閉嘴',
    category: 'taiwanese',
  },
  {
    kanji: '你是在講什麼',
    romaji: 'Rishire Kongsashō',
    meaning: '偽日文：你是在講什麼',
    category: 'taiwanese',
  },
  {
    kanji: '不要亂講話',
    romaji: 'Buyao Rankonwa',
    meaning: '偽日文：不要亂講話',
    category: 'taiwanese',
  },
  { kanji: '我聽不懂', romaji: 'Wotei Butong', meaning: '偽日文：我聽不懂', category: 'taiwanese' },

  // 日常用語
  { kanji: '氣死了', romaji: 'Kishira', meaning: '中文諧音：氣死了', category: 'life' },
  { kanji: '好累喔', romaji: 'Harui O', meaning: '中文諧音：好累喔', category: 'life' },
  { kanji: '肚子餓', romaji: 'Toshi E', meaning: '中文諧音：肚子餓', category: 'life' },
  { kanji: '想睡覺', romaji: 'Sōsuika', meaning: '中文諧音：想睡覺', category: 'life' },
  { kanji: '好無聊', romaji: 'Hōmurya', meaning: '中文諧音：好無聊', category: 'life' },
  { kanji: '等一下', romaji: 'Tōikka', meaning: '中文諧音：等一下', category: 'life' },
  { kanji: '不要緊', romaji: 'Buyaokin', meaning: '中文諧音：不要緊', category: 'life' },
  { kanji: '沒關係', romaji: 'Mēkankei', meaning: '中文諧音：沒關係', category: 'life' },
];

/**
 * Dcard 熱門諧音梗
 */
export const DCARD_PUNS: PunName[] = [
  { kanji: '肛門強', romaji: 'Kōmon Tsuyoshi', meaning: '中文諧音：肛門強', category: 'classic' },
  {
    kanji: '根本英俊',
    romaji: 'Konpon Eishun',
    meaning: '中文諧音：根本英雄',
    category: 'classic',
  },
  { kanji: '田辰烎夏', romaji: 'Tatatsu Kōka', meaning: '諧音梗：田辰烎夏', category: 'classic' },
  { kanji: '房屋仲介', romaji: 'Fangwu Zhongjie', meaning: '中文諧音：房屋仲介', category: 'life' },
  { kanji: '房屋任件', romaji: 'Fangwu Renjian', meaning: '中文諧音：房屋認證', category: 'life' },
  { kanji: '田中高章', romaji: 'Tanaka Takashō', meaning: '諧音梗：田中高章', category: 'classic' },
  { kanji: '小農套作', romaji: 'Shōnō Tōsaku', meaning: '諧音梗：小農套作', category: 'life' },
  { kanji: '秋山曉', romaji: 'Akiyama Akira', meaning: '常見日本名', category: 'common' },
  { kanji: '新園結衣', romaji: 'Niizono Yui', meaning: '類似新垣結衣', category: 'elegant' },
  {
    kanji: '田中基八郎',
    romaji: 'Tanaka Kihachirō',
    meaning: '諧音梗：田中基八郎',
    category: 'classic',
  },
  { kanji: '台大醬料', romaji: 'Taidai Shōryō', meaning: '諧音梗：台大醬料', category: 'food' },
  {
    kanji: '市政北七路',
    romaji: 'Shisei Hokushichiro',
    meaning: '台語諧音：市政北七路',
    category: 'taiwanese',
  },
  {
    kanji: '中山下智久',
    romaji: 'Nakayamashita Tomohisa',
    meaning: '類似山下智久',
    category: 'common',
  },
  { kanji: '梅戴志傷', romaji: 'Umeda Shishō', meaning: '中文諧音：沒帶紙傷', category: 'classic' },
  {
    kanji: '犬養野郎',
    romaji: 'Inukai Yarō',
    meaning: '日文諧音：狗養的野郎',
    category: 'classic',
  },
  { kanji: '淡水阿紅', romaji: 'Tansui Ahong', meaning: '地名諧音：淡水阿紅', category: 'place' },
  { kanji: '鳥真思', romaji: 'Torimashi', meaning: '諧音梗：鳥真思', category: 'classic' },
  {
    kanji: '林北雄大',
    romaji: 'Rinpoku Yūdai',
    meaning: '台語諧音：林北雄大',
    category: 'taiwanese',
  },
  { kanji: '林春香', romaji: 'Hayashi Haruka', meaning: '常見日本名', category: 'common' },
  {
    kanji: '竹中錧子',
    romaji: 'Takenaka Kaneko',
    meaning: '諧音梗：竹中錧子',
    category: 'classic',
  },
  { kanji: '三重五十六', romaji: 'Sanjū Isoroku', meaning: '地名諧音：三重', category: 'place' },
  {
    kanji: '南港展覽館',
    romaji: 'Nankō Tenrankan',
    meaning: '地名諧音：南港展覽館',
    category: 'place',
  },
  {
    kanji: '新光三越',
    romaji: 'Shinkō Mitsukoshi',
    meaning: '品牌諧音：新光三越',
    category: 'life',
  },
  { kanji: '富岡車站', romaji: 'Tomioka Eki', meaning: '地名諧音：富岡車站', category: 'place' },
  {
    kanji: '龍山寺遊民',
    romaji: 'Ryūzanji Yūmin',
    meaning: '地名諧音：龍山寺遊民',
    category: 'place',
  },
];

/**
 * 更多經典台式諧音梗
 */
export const MORE_TAIWANESE_CLASSIC: PunName[] = [
  // 政治諷刺類
  {
    kanji: '塔綠班男',
    romaji: 'Taryūban Otoko',
    meaning: '政治諧音：塔綠班男',
    category: 'internet',
  },
  { kanji: '塔綠波班', romaji: 'Taryū Haban', meaning: '政治諧音：塔綠波班', category: 'internet' },
  {
    kanji: '柯文哲也',
    romaji: 'Kobuntetsu Ya',
    meaning: '政治諧音：柯文哲也',
    category: 'internet',
  },

  // 品牌諧音
  {
    kanji: '三芝雨傘標',
    romaji: 'Sanshi Kasahyō',
    meaning: '品牌諧音：三支雨傘標',
    category: 'life',
  },
  {
    kanji: '賣拍八窩',
    romaji: 'Baihachi Hachi Wo',
    meaning: '諧音梗：賣拍八窩',
    category: 'classic',
  },

  // 數字諧音
  { kanji: '一本十九', romaji: 'Ippon Jūkyū', meaning: '數字諧音：一本十九', category: 'classic' },
  {
    kanji: '三本五十六',
    romaji: 'Sanbon Isoroku',
    meaning: '數字諧音：三本五十六',
    category: 'classic',
  },

  // 地名諧音
  {
    kanji: '和美柑井里',
    romaji: 'Wabi Kansei Ri',
    meaning: '地名諧音：和美柑井里',
    category: 'place',
  },

  // 更多台語
  { kanji: '古月胡子', romaji: 'Kogetsu Koko', meaning: '拆字梗：胡', category: 'character' },
  { kanji: '言吾吾郎', romaji: 'Gengo Gorō', meaning: '拆字梗：語', category: 'character' },
  { kanji: '木目相子', romaji: 'Mokume Sōko', meaning: '拆字梗：相', category: 'character' },
  { kanji: '口天吴子', romaji: 'Kōten Goko', meaning: '拆字梗：吴', category: 'character' },
  { kanji: '人言信太郎', romaji: 'Jingen Shintarō', meaning: '拆字梗：信', category: 'character' },
  { kanji: '女子好美', romaji: 'Joshi Kōmi', meaning: '拆字梗：好', category: 'character' },
  { kanji: '口十叶子', romaji: 'Kōjū Yōko', meaning: '拆字梗：叶', category: 'character' },
];

/**
 * 2025年12月 CSV 整合諧音梗
 * 來源: taiwanese_japanese_name_puns_final.csv, japanese_name_puns.csv, taiwan_jp_pun_names_50.csv
 */
export const CSV_INTEGRATED_PUNS_2025: PunName[] = [
  // 台語講話系列
  { kanji: '宮衣曉', romaji: 'Miyai Akira', meaning: '台語諧音：共什小', category: 'taiwanese' },
  { kanji: '宮衫曉', romaji: 'Miyasan Akira', meaning: '台語諧音：講啥小', category: 'taiwanese' },
  {
    kanji: '里宮夏絵',
    romaji: 'Rikyū Natsue',
    meaning: '台語諧音：你講什麼',
    category: 'taiwanese',
  },
  {
    kanji: '里宮淺會',
    romaji: 'Rikyū Asae',
    meaning: '台語諧音：你講什麼',
    category: 'taiwanese',
  },

  // 政治人物諧音
  {
    kanji: '青山文哲',
    romaji: 'Aoyama Buntetsu',
    meaning: '政治諧音：台北市長柯文哲',
    category: 'internet',
  },
  {
    kanji: '木可文哲',
    romaji: 'Moka Buntetsu',
    meaning: '拆字諧音：柯文哲',
    category: 'internet',
  },
  {
    kanji: '馬英九郎',
    romaji: 'Baeikyūrō',
    meaning: '政治諧音：馬英九',
    category: 'internet',
  },
  {
    kanji: '陳時中太郎',
    romaji: 'Chinjichū Tarō',
    meaning: '政治諧音：陳時中',
    category: 'internet',
  },

  // 宗教地名諧音
  {
    kanji: '龍山寺妙禪',
    romaji: 'Ryūzanji Myōzen',
    meaning: '地名諧音：龍山寺妙禪',
    category: 'place',
  },
  {
    kanji: '善導寺星雲',
    romaji: 'Zendōji Seiun',
    meaning: '地名諧音：善導寺星雲',
    category: 'place',
  },
  {
    kanji: '龍崎文衡殿',
    romaji: 'Ryūzaki Buneiden',
    meaning: '地名諧音：龍崎文衡殿',
    category: 'place',
  },

  // 台灣美食諧音
  {
    kanji: '小瀧湯包',
    romaji: 'Kotaki Tōhō',
    meaning: '食物諧音：小籠湯包',
    category: 'food',
  },
  { kanji: '池上便當', romaji: 'Ikegami Bentō', meaning: '品牌諧音：池上便當', category: 'food' },
  { kanji: '排骨便當', romaji: 'Haikotsu Bentō', meaning: '食物諧音：排骨便當', category: 'food' },
  {
    kanji: '鳳梨苦瓜雞',
    romaji: 'Hōri Nigauri Tori',
    meaning: '食物諧音：鳳梨苦瓜雞',
    category: 'food',
  },
  { kanji: '龍膽石班', romaji: 'Ryūtan Sekihan', meaning: '食物諧音：龍膽石斑', category: 'food' },
  { kanji: '清心福全', romaji: 'Seishin Fukuzen', meaning: '品牌諧音：清心福全', category: 'food' },
  { kanji: '八寶粥', romaji: 'Happōgayu', meaning: '食物諧音：八寶粥', category: 'food' },
  { kanji: '明太子', romaji: 'Mentaiko', meaning: '食物諧音：明太子', category: 'food' },
  {
    kanji: '牛肉麵珍珠',
    romaji: 'Gyūnikumen Shinju',
    meaning: '食物諧音：牛肉麵珍珠',
    category: 'food',
  },

  // 高端疫苗系列
  {
    kanji: '田中高端',
    romaji: 'Tanaka Kōtan',
    meaning: '政治諧音：台灣疫苗高端',
    category: 'internet',
  },
  { kanji: '高端一生', romaji: 'Kōtan Isshō', meaning: '政治諧音：高端一生', category: 'internet' },
  {
    kanji: '鬼塚高端',
    romaji: 'Onizuka Kōtan',
    meaning: '政治諧音：鬼塚高端',
    category: 'internet',
  },
  {
    kanji: '高端爽約仔',
    romaji: 'Kōtan Sōyakushi',
    meaning: '政治諧音：高端爽約仔',
    category: 'internet',
  },
  {
    kanji: '高端占市',
    romaji: 'Kōtan Senshi',
    meaning: '政治諧音：高端占市',
    category: 'internet',
  },

  // 生活諧音
  {
    kanji: '大岢步壁',
    romaji: 'Ōka Fuheki',
    meaning: '中文諧音：大可不必',
    category: 'life',
  },
  {
    kanji: '大岢不壁',
    romaji: 'Ōka Fuheki',
    meaning: '中文諧音：大可不必',
    category: 'life',
  },
  {
    kanji: '穗稻忠武',
    romaji: 'Suidō Tadamu',
    meaning: '中文諧音：睡到中午',
    category: 'life',
  },
  {
    kanji: '你涼卡好',
    romaji: 'Niryō Kahō',
    meaning: '台語諧音：你涼卡好',
    category: 'taiwanese',
  },
  {
    kanji: '下汐夏井',
    romaji: 'Shitashio Natsui',
    meaning: '台語諧音：下去洗洗',
    category: 'taiwanese',
  },
  {
    kanji: '小三建仁',
    romaji: 'Kosan Kenjin',
    meaning: '中文諧音：小三兼任',
    category: 'life',
  },
  {
    kanji: '不好吃免錢',
    romaji: 'Fukōchi Mensen',
    meaning: '中文諧音：不好吃免錢',
    category: 'life',
  },
  {
    kanji: '一例一休',
    romaji: 'Ichirei Ichikyū',
    meaning: '政策諧音：一例一休',
    category: 'internet',
  },
  {
    kanji: '誠心發問',
    romaji: 'Seishin Hatsumon',
    meaning: '中文諧音：誠心發問',
    category: 'life',
  },
  { kanji: '晚了不要', romaji: 'Banryō Fuyō', meaning: '中文諧音：晚了不要', category: 'life' },
  { kanji: '齁齁齁', romaji: 'Hōhōhō', meaning: '中文諧音：呵呵呵', category: 'life' },
  { kanji: '咩羞幹哞', romaji: 'Meshū Kanbō', meaning: '台語諧音：別亂摸', category: 'taiwanese' },
  { kanji: '武柔倍剛', romaji: 'Bujū Baigō', meaning: '中文諧音：不用備綱', category: 'life' },

  // 台灣地名諧音
  {
    kanji: '田中勝詰',
    romaji: 'Tanaka Shōkitsu',
    meaning: '地名諧音：台中選舉',
    category: 'place',
  },
  {
    kanji: '田中高雄',
    romaji: 'Tanaka Takao',
    meaning: '地名諧音：台中高雄',
    category: 'place',
  },
  {
    kanji: '苗栗小五郎',
    romaji: 'Byōritsu Kogorō',
    meaning: '地名諧音：苗栗小五郎',
    category: 'place',
  },
  {
    kanji: '三重劉德華',
    romaji: 'Sanjū Ryū Tokka',
    meaning: '地名諧音：三重的劉德華',
    category: 'place',
  },

  // 演員名人諧音
  { kanji: '金城武', romaji: 'Kaneshiro Takeshi', meaning: '演員諧音：金城武', category: 'common' },
  { kanji: '楊三郎', romaji: 'Yō Saburō', meaning: '人名諧音：楊三郎', category: 'common' },
  {
    kanji: '松山介石',
    romaji: 'Matsuyama Kaiseki',
    meaning: '人名諧音：蔣介石',
    category: 'history',
  },

  // 日語諧音
  {
    kanji: '夜露死苦',
    romaji: 'Yoroshiku',
    meaning: '日文諧音：よろしく（請多指教）',
    category: 'classic',
  },
  {
    kanji: '吉幸巴時',
    romaji: 'Yoshikō Baji',
    meaning: '中文諧音：即興巴士',
    category: 'life',
  },

  // 品牌諧音
  { kanji: '小栗店長', romaji: 'Oguri Tenchō', meaning: '品牌諧音：小綠店長', category: 'life' },
  { kanji: '小農契作', romaji: 'Shōnō Keisaku', meaning: '農業諧音：小農契作', category: 'life' },
  { kanji: '房屋仲介', romaji: 'Bōoku Chūkai', meaning: '職業諧音：房屋仲介', category: 'life' },
  {
    kanji: '日式威廉',
    romaji: 'Nisshiki Uiriamu',
    meaning: '品牌諧音：日式威廉',
    category: 'life',
  },
  {
    kanji: '日式威夏',
    romaji: 'Nisshiki Uika',
    meaning: '品牌諧音：日式威夏',
    category: 'life',
  },

  // 動漫諧音
  {
    kanji: '彎刀炭佳郎',
    romaji: 'Wantō Tankajirō',
    meaning: '動漫諧音：彎刀炭治郎',
    category: 'internet',
  },
  {
    kanji: '八加九郎',
    romaji: 'Hachika Kyūrō',
    meaning: '數字諧音：八家九郎',
    category: 'classic',
  },
  {
    kanji: '木村鬥頭栽',
    romaji: 'Kimura Tōtōsai',
    meaning: '動漫諧音：木村鬥頭栽',
    category: 'internet',
  },

  // 台語罵人系列
  {
    kanji: '林北久宅',
    romaji: 'Rinpoku Kyūtaku',
    meaning: '台語諧音：林北久宅',
    category: 'taiwanese',
  },
  { kanji: '林佳豪', romaji: 'Hayashi Kahō', meaning: '人名諧音：林佳豪', category: 'common' },
  { kanji: '小佑細', romaji: 'Koyū Sai', meaning: '台語諧音：小有錢', category: 'taiwanese' },

  // 其他諧音
  { kanji: '愛顏社長', romaji: 'Aigan Shachō', meaning: '中文諧音：哀怨社長', category: 'life' },
  {
    kanji: '大道韓不助',
    romaji: 'Daidō Kanfujo',
    meaning: '中文諧音：大喊不助',
    category: 'classic',
  },
  { kanji: '中山樵', romaji: 'Nakayama Kikori', meaning: '人名諧音：忠孝', category: 'history' },
  {
    kanji: '保中馬林',
    romaji: 'Hochū Marin',
    meaning: '中文諧音：保中馬林',
    category: 'classic',
  },
  { kanji: '金玉滿堂', romaji: 'Kingyoku Mandō', meaning: '中文諧音：金玉滿堂', category: 'life' },
  { kanji: '石田雄介', romaji: 'Ishida Yūsuke', meaning: '常見日本名', category: 'common' },
  { kanji: '倭蘑菇', romaji: 'Wamogu', meaning: '中文諧音：我蘑菇', category: 'life' },
  {
    kanji: '塔綠班堵藍',
    romaji: 'Taryūban Toran',
    meaning: '政治諧音：塔綠班堵藍',
    category: 'internet',
  },
  { kanji: '龍巖武', romaji: 'Ryūgan Take', meaning: '品牌諧音：龍巖', category: 'life' },
  {
    kanji: '田中聖傑',
    romaji: 'Tanaka Seiketsu',
    meaning: '人名諧音：田中聖傑',
    category: 'common',
  },
  {
    kanji: '塔綠八年十七班',
    romaji: 'Taryū Hachinen Jūnanaban',
    meaning: '政治諧音：塔綠班十七班',
    category: 'internet',
  },
  {
    kanji: '德州家康',
    romaji: 'Tokushū Ieyasu',
    meaning: '品牌諧音：德州家康',
    category: 'food',
  },
  { kanji: '塌律阪', romaji: 'Taritsuhan', meaning: '政治諧音：塔綠班', category: 'internet' },
  {
    kanji: '粉穗幸古澤',
    romaji: 'Konaho Yukikozawa',
    meaning: '中文諧音：粉碎性骨折',
    category: 'classic',
  },
  {
    kanji: '羅北德剛',
    romaji: 'Rahoku Tokugō',
    meaning: '食物諧音：蘿蔔蛋糕',
    category: 'food',
  },
  {
    kanji: '眉川伊福',
    romaji: 'Maekawa Ifuku',
    meaning: '中文諧音：沒穿衣服',
    category: 'classic',
  },
  { kanji: '田農炳夏', romaji: 'Dennō Heika', meaning: '諧音梗：田農炳夏', category: 'classic' },

  // 小籠包系列
  {
    kanji: '小籠包好吃',
    romaji: 'Shōronpō Oishii',
    meaning: '食物諧音：小籠包好吃',
    category: 'food',
  },
];

/**
 * 合併所有諧音梗為一個陣列
 */
export const ALL_FUNNY_NAMES: PunName[] = [
  // 2025 熱門諧音梗 (優先顯示)
  ...VIRAL_PUNS_2025,
  ...THREADS_PUNS_2025,
  ...DCARD_PUNS,
  ...MORE_TAIWANESE_CLASSIC,
  ...CSV_INTEGRATED_PUNS_2025, // 2025-12-05 CSV 整合
  // 2025-12-06 新增 CSV 整合資料
  ...ALL_CSV_PUNS,
  // 原有經典諧音梗
  ...CLASSIC_PUNS,
  ...TAIWANESE_PUNS,
  ...LIFE_PUNS,
  ...WEALTH_PUNS,
  ...CHARACTER_PUNS,
  ...PLACE_PUNS,
  ...HISTORY_PUNS,
  ...LITERATURE_PUNS,
  ...COMMON_PUNS,
  ...NATURE_PUNS,
  ...ELEGANT_PUNS,
  ...FOOD_PUNS,
  ...INTERNET_PUNS,
  ...BONE_PUNS,
  ...MORE_CLASSIC_PUNS,
  ...ANIME_PUNS,
  ...OCCUPATION_PUNS,
  ...SEASON_PUNS,
  ...COLOR_PUNS,
  ...NUMBER_PUNS,
  ...FAKE_JAPANESE_PUNS,
  ...MORE_LIFE_PUNS,
  ...MORE_TAIWANESE_PUNS,
  ...MORE_CHARACTER_PUNS,
  ...MORE_INTERNET_PUNS,
  ...MORE_ELEGANT_PUNS,
  ...MALE_PUNS,
  ...MORE_FOOD_PUNS,
  ...TEACHER_ZHOU_PUNS,
  ...NETIZEN_PUNS,
  ...REAL_JAPANESE_SURNAMES,
  ...MORE_PLACE_PUNS,
  ...MORE_HISTORY_PUNS,
  ...MORE_LITERATURE_PUNS,
  ...MORE_ANIME_PUNS,
  ...MORE_NATURE_PUNS,
  ...EXTRA_CLASSIC_PUNS,
  ...DAILY_PUNS,
  ...MORE_JAPANESE_NAMES,
  ...ANIMAL_PUNS,
  ...MORE_OCCUPATION_PUNS,
  ...EMOTION_PUNS,
];

/**
 * 去重後的諧音梗陣列
 */
export const UNIQUE_FUNNY_NAMES: PunName[] = ALL_FUNNY_NAMES.filter(
  (name, index, self) => index === self.findIndex((n) => n.kanji === name.kanji),
);

/**
 * 依分類取得諧音梗
 */
export const getFunnyNamesByCategory = (category: PunName['category']): PunName[] => {
  return UNIQUE_FUNNY_NAMES.filter((name) => name.category === category);
};

/**
 * 取得隨機諧音梗
 */
export const getRandomFunnyName = (): PunName => {
  const index = Math.floor(Math.random() * UNIQUE_FUNNY_NAMES.length);
  const name = UNIQUE_FUNNY_NAMES[index];
  if (name) return name;
  // Fallback to first item (should never happen with 500+ items)
  const fallback = UNIQUE_FUNNY_NAMES[0];
  if (fallback) return fallback;
  // Ultimate fallback
  return {
    kanji: '田中太郎',
    romaji: 'Tanaka Tarō',
    meaning: '常見：日本名字',
    category: 'common',
  };
};

/**
 * 取得諧音梗總數
 */
export const getFunnyNamesCount = (): number => UNIQUE_FUNNY_NAMES.length;
