// 首屏 SSG 殼與 Home 的拍照交接通道（issue #725）：
// 使用者可能在 hydration 完成前由殼 CTA 開啟相機，返回時殼已卸載——
// 檔案經此模組暫存/轉交，Home 掛載後訂閱接手，照片不落失。
let pendingFile: File | null = null;
let subscriber: ((file: File) => void) | null = null;

// [issue #738] app module 延至 load 後注入，殼 CTA 的 React ref 監聽更晚才掛上。
// postbuild 於首頁 HTML 內聯零依賴監聽：照片暫存 window.__pkCtaPhoto 並發出
// pk:cta-photo 事件；此處於模組載入時領養，涵蓋「事件先於/晚於本模組初始化」兩種順序。
declare global {
  interface Window {
    __pkCtaPhoto?: File;
  }
}

function adoptPrehydrationPhoto(): void {
  const file = window.__pkCtaPhoto;
  if (!file) return;
  delete window.__pkCtaPhoto;
  pendingCtaPhoto.push(file);
}

// retain-until-consumed：callback 正常返回視為 ack 才清除暫存；
// callback 拋錯時檔案保留（異常向呼叫端傳播），之後重新訂閱仍可取回。
function deliver(): void {
  if (!subscriber || !pendingFile) return;
  const file = pendingFile;
  subscriber(file);
  // ack：交付期間未被新 push 覆蓋才清除。
  if (pendingFile === file) pendingFile = null;
}

export const pendingCtaPhoto = {
  push(file: File): void {
    pendingFile = file;
    deliver();
  },
  subscribe(callback: (file: File) => void): () => void {
    subscriber = callback;
    deliver();
    return () => {
      if (subscriber === callback) subscriber = null;
    };
  },
};

if (typeof window !== 'undefined') {
  adoptPrehydrationPhoto();
  window.addEventListener('pk:cta-photo', adoptPrehydrationPhoto);
}
