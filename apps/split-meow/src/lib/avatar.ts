import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

/**
 * 以 seed 產生 DiceBear funEmoji 頭像，回傳 data URI（離線可用）。
 * 相同 seed 永遠回傳相同頭像（deterministic）。
 */
export function generateAvatarDataUrl(seed: string): string {
  return createAvatar(funEmoji, {
    seed,
    size: 80,
    radius: 50,
    // 只使用開心/可愛的嘴巴表情
    mouth: ['lilSmile', 'cute', 'wideSmile', 'smileTeeth', 'smileLol', 'tongueOut', 'kissHeart'],
  }).toDataUri();
}

/** 產生隨機不重複的 seed */
export function randomAvatarSeed(): string {
  return crypto.randomUUID();
}
