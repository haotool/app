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
    id: 7,
    question: '地震發生前，能量為什麼會累積？',
    options: ['因為板塊停止移動了', '因為斷層被卡住，板塊繼續推', '因為地球變熱了'],
    correctIndex: 1,
    explanation: '板塊一直在推，但斷層面有摩擦力卡住，能量就像拉長橡皮筋一樣存起來。',
  },
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
