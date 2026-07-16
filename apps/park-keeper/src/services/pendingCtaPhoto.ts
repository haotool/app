// 首屏 SSG 殼與 Home 的拍照交接通道（issue #725）：
// 使用者可能在 hydration 完成前由殼 CTA 開啟相機，返回時殼已卸載——
// 檔案經此模組暫存/轉交，Home 掛載後訂閱接手，照片不落失。
let pendingFile: File | null = null;
let subscriber: ((file: File) => void) | null = null;

export const pendingCtaPhoto = {
  push(file: File): void {
    if (subscriber) {
      subscriber(file);
    } else {
      pendingFile = file;
    }
  },
  subscribe(callback: (file: File) => void): () => void {
    subscriber = callback;
    if (pendingFile) {
      callback(pendingFile);
      pendingFile = null;
    }
    return () => {
      if (subscriber === callback) subscriber = null;
    };
  },
};
