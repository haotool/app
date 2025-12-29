import type { LessonContent, QuizQuestion, IntensityLevel } from '../types';

export const LESSONS: LessonContent[] = [
  {
    id: 'l0',
    title: '成因：地球大拼圖',
    subtitle: '為什麼地會動？',
    level: 'preschool',
    paragraphs: [
      '● 板塊一直推：板塊像拼圖一直在移動，推力一直都在。',
      '● 斷層卡住了：斷層面像粗糙木板會卡住，能量像橡皮筋被拉長一樣存起來（彈性形變）。',
      '● 突然滑一下：當力道超過摩擦力，斷層突然滑動（Stick-Slip），能量就會瞬間爆發！',
    ],
    tips: ['地震是能量的「突然釋放」', '有些斷層會慢慢滑動（平滑釋放），比較安全'],
  },
  {
    id: 'lwave',
    title: '地震波：誰先敲門？',
    subtitle: 'P 波與 S 波的祕密',
    level: 'intermediate',
    paragraphs: [
      '● P 波 (縱波)：跑得最快！像推拉彈簧，你會感覺到地板「上下頂一下」。',
      '● S 波 (橫波)：跑得慢但力氣大！像甩動繩子，會造成嚴重的「左右大搖晃」。',
      '● S 波無法穿過液體，科學家就是靠這點發現地核內部是液態的喔！',
    ],
    tips: ['P 波先到 (Primary)', 'S 波破壞力強 (Secondary)'],
  },
  {
    id: 'l1',
    title: '規模 (Magnitude)',
    subtitle: '地震釋放的「能量」',
    level: 'preschool',
    paragraphs: [
      '● 規模是「鞭炮的大小」：能量越大，規模數字越高。',
      '● 全球只有一個數字：同一個地震，量到的規模都一樣。',
      '● 威力跳躍：規模每加 1，能量大 32 倍！',
    ],
    tips: ['規模 = 能量總量', '規模 7 強過 6 約 32 倍'],
  },
  {
    id: 'l4',
    title: '深度 (Depth)',
    subtitle: '震央下的祕密',
    level: 'intermediate',
    paragraphs: [
      '● 敲桌子比喻：在桌面上敲擊（淺層）感覺猛烈；在地下室敲鐘（深層）聲音傳得遠但力道散。',
      '● 淺層地震：深度 0-30km，最容易造成地表破壞。',
    ],
    tips: ['越淺越像近距離重擊', '越深影響範圍通常更廣'],
  },
  {
    id: 'l2',
    title: '震度 (Intensity)',
    subtitle: '你家的「搖晃感」',
    level: 'intermediate',
    paragraphs: [
      '● 震度是「你離多遠」：離震央越近、地質越軟，感覺越晃。',
      '● 臺灣分級：分為 0 到 7 級，其中 5、6 級有強弱之分。',
    ],
    tips: ['震度隨地點改變', '5 級以上看速度 PGV'],
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // === 地震波相關 ===
  {
    id: 10,
    question: '地震時，哪一種波會最先到達，讓你感覺「上下頂一下」？',
    options: ['S 波', 'P 波', '微波'],
    correctIndex: 1,
    explanation: 'P 波（縱波）速度最快，會先抵達地表，造成上下或前後的短促抖動。',
  },
  {
    id: 11,
    question: '為什麼 S 波通常比 P 波更容易造成房子倒塌？',
    options: ['因為它跑得最快', '因為它會造成強烈的左右晃動', '因為它會發光'],
    correctIndex: 1,
    explanation: 'S 波（橫波）會造成地表劇烈的水平搖晃，對建築結構的考驗通常比 P 波更大。',
  },
  {
    id: 12,
    question: 'S 波無法穿過什麼物質？',
    options: ['固體', '液體', '空氣'],
    correctIndex: 1,
    explanation: 'S 波是剪力波，無法在液體中傳遞。科學家就是靠這點發現地核外核是液態的！',
  },
  // === 板塊與成因 ===
  {
    id: 7,
    question: '地震發生前，能量為什麼會累積？',
    options: ['因為板塊停止移動了', '因為斷層被卡住，板塊繼續推', '因為地球變熱了'],
    correctIndex: 1,
    explanation: '板塊一直在推，但斷層面有摩擦力卡住，能量就像拉長橡皮筋一樣存起來。',
  },
  {
    id: 13,
    question: '臺灣位於哪兩個板塊的交界處？',
    options: ['太平洋板塊與北美板塊', '歐亞板塊與菲律賓海板塊', '印度板塊與歐亞板塊'],
    correctIndex: 1,
    explanation: '臺灣位於歐亞板塊與菲律賓海板塊的交界處，是全球地震最活躍的地區之一。',
  },
  {
    id: 14,
    question: '什麼是「斷層」？',
    options: ['地表的裂縫', '岩層破裂並發生相對位移的面', '火山爆發形成的坑洞'],
    correctIndex: 1,
    explanation: '斷層是岩層因應力而破裂，兩側岩塊發生相對位移的面。地震常沿斷層發生。',
  },
  // === 規模相關 ===
  {
    id: 1,
    question: '同一個地震，會有幾個『規模』數字？',
    options: ['很多個，每個地方不一樣', '只有一個', '看震央距離'],
    correctIndex: 1,
    explanation: '規模代表源頭釋放的能量總量，所以同一個地震只有一個規模值。',
  },
  {
    id: 2,
    question: '規模每增加 1.0，釋放的能量大約增加幾倍？',
    options: ['10 倍', '32 倍', '2 倍'],
    correctIndex: 1,
    explanation: '這是一個科學上的跳躍，規模差 1，能量差了約 32 倍！',
  },
  {
    id: 15,
    question: '規模 7.0 的地震釋放的能量，大約等於幾個規模 6.0 的地震？',
    options: ['10 個', '32 個', '100 個'],
    correctIndex: 1,
    explanation: '規模每增加 1.0，能量增加約 32 倍。所以 1 個 M7 ≈ 32 個 M6 的能量！',
  },
  // === 震度相關 ===
  {
    id: 3,
    question: '同一個地震，不同地方的「震度」會一樣嗎？',
    options: ['會，因為是同一個地震', '不會，離震央越遠震度越小', '只有山區會不同'],
    correctIndex: 1,
    explanation: '震度會因為距離震央遠近、地質條件、建築結構而有所不同。',
  },
  {
    id: 16,
    question: '臺灣的地震震度分級，最高是幾級？',
    options: ['5 級', '6 級', '7 級'],
    correctIndex: 2,
    explanation: '臺灣震度分級從 0 到 7 級，其中 5 級和 6 級還有「弱」與「強」的細分。',
  },
  {
    id: 17,
    question: '震度 5 弱時，人的感受大約是？',
    options: ['幾乎無感', '門窗搖動', '家具會移動，難以站穩行走'],
    correctIndex: 2,
    explanation: '震度 5 弱時，人會感到相當害怕，家具可能會移動，走路也會不穩。',
  },
  // === 深度相關 ===
  {
    id: 4,
    question: '淺層地震（深度小於 30km）為什麼通常破壞力較大？',
    options: ['因為能量更多', '因為能量更集中在地表附近', '因為持續時間更長'],
    correctIndex: 1,
    explanation: '淺層地震的能量釋放點離地表近，就像近距離敲擊一樣，衝擊力更集中。',
  },
  {
    id: 18,
    question: '深層地震（深度超過 300km）通常會有什麼特點？',
    options: ['破壞力最大', '影響範圍廣但搖晃感較弱', '只會在海裡發生'],
    correctIndex: 1,
    explanation: '深層地震的能量在傳播過程中會逐漸衰減，但因為傳得遠，可能廣大區域都有感。',
  },
  // === 防災應變 ===
  {
    id: 5,
    question: '地震發生時，最重要的第一個動作是什麼？',
    options: ['立刻跑到戶外', '趴下、掩護、穩住 (DCH)', '打電話給家人'],
    correctIndex: 1,
    explanation: '「趴下、掩護、穩住」(Drop, Cover, Hold on) 是國際認證的地震即時反應動作。',
  },
  {
    id: 6,
    question: '地震搖晃停止後，以下哪個行為是正確的？',
    options: ['立刻搭電梯離開', '檢查是否有瓦斯外洩', '躲在床上等救援'],
    correctIndex: 1,
    explanation: '地震後應檢查瓦斯、電力是否正常，並注意餘震。千萬不要搭電梯！',
  },
  {
    id: 19,
    question: '如果地震時你在室內，應該躲在哪裡？',
    options: ['靠近窗戶', '堅固的桌子下方', '樓梯間'],
    correctIndex: 1,
    explanation: '躲在堅固的桌子下方，抓住桌腳，保護頭頸部位，等待搖晃停止。',
  },
  {
    id: 20,
    question: '「地震預警」可以提前多久發出警報？',
    options: ['提前 1 小時', '數秒到數十秒', '提前 1 天'],
    correctIndex: 1,
    explanation: '地震預警利用 P 波比 S 波快的原理，可在破壞性 S 波到達前數秒到數十秒發出警報。',
  },
];

export const INTENSITY_LEVELS: IntensityLevel[] = [
  {
    level: '0',
    title: '無感',
    description: '人無感，僅儀器記錄。',
    action: '正常生活',
    color: 'bg-slate-100',
  },
  {
    level: '1',
    title: '微震',
    description: '靜坐才有感。',
    action: '保持警覺',
    color: 'bg-blue-100',
  },
  {
    level: '2',
    title: '輕震',
    description: '門窗聲響。',
    action: '注意吊掛',
    color: 'bg-cyan-100',
  },
  {
    level: '3',
    title: '弱震',
    description: '房屋搖晃。',
    action: '遠離玻璃',
    color: 'bg-emerald-100',
  },
  {
    level: '4',
    title: '中震',
    description: '物品掉落。',
    action: '趴下掩護',
    color: 'bg-yellow-100',
  },
  {
    level: '5弱',
    title: '強震',
    description: '家具位移。',
    action: '關閉火源',
    color: 'bg-orange-100',
  },
  {
    level: '5強',
    title: '強震',
    description: '家具翻倒。',
    action: '躲桌下',
    color: 'bg-orange-200',
  },
  { level: '6弱', title: '烈震', description: '牆壁裂開。', action: '保頭頸', color: 'bg-red-100' },
  {
    level: '6強',
    title: '烈震',
    description: '無法站立。',
    action: '嚴防損壞',
    color: 'bg-red-200',
  },
  {
    level: '7',
    title: '劇震',
    description: '地面甩人',
    action: '逃生避難',
    color: 'bg-purple-200',
  },
];
