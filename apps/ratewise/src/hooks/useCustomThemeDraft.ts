/**
 * useCustomThemeDraft（E7 wave-B，QA-I #5）：主題工作室 draft/取消語意。
 *
 * sheet 開啟即進 draft 模式：所有變更走 previewTheme 即時全站跟色，
 * 但不持久化（theme config 與 pre-paint 快取皆零寫入）；
 * - 關閉 sheet（X / backdrop / Esc）＝ commit：單次原子持久化主色＋背景調。
 * - 「取消」＝ 回滾開啟前快照（previewTheme 還原 DOM，persist 零寫入）。
 * - 「還原預設」＝ 外部 resetTheme commit 回 zen 後呼叫 discard 收尾。
 * - 元件 unmount（返回手勢跳離路由、SPA 導航）＝ 未 commit 的 draft 自動回滾，
 *   避免 draft inline vars 殘留全站與 persist 脫鉤。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { previewTheme, type ThemeConfig } from '../config/themes';
import {
  DEFAULT_CUSTOM_BACKGROUND_TONE,
  DEFAULT_CUSTOM_PRIMARY,
  isValidHexColor,
  type CustomBackgroundTone,
} from '../config/custom-theme';

interface CustomThemeDraft {
  primary: string;
  tone: CustomBackgroundTone;
}

export interface UseCustomThemeDraftParams {
  /** 已提交的主題配置（開啟時作為回滾快照）。 */
  config: ThemeConfig;
  /** commit 出口（useAppTheme.commitCustomTheme）。 */
  commitCustomTheme: (primary: string, tone: CustomBackgroundTone) => void;
}

export function useCustomThemeDraft({ config, commitCustomTheme }: UseCustomThemeDraftParams) {
  const [draft, setDraft] = useState<CustomThemeDraft | null>(null);
  // ref 鏡像：事件回呼讀最新 draft，previewTheme 副作用不進 state updater（StrictMode 純函式要求）。
  const draftRef = useRef<CustomThemeDraft | null>(null);
  const snapshotRef = useRef<ThemeConfig | null>(null);

  const applyDraft = useCallback((next: CustomThemeDraft) => {
    draftRef.current = next;
    setDraft(next);
    previewTheme({ style: 'custom', customPrimary: next.primary, customBackgroundTone: next.tone });
  }, []);

  const open = useCallback(() => {
    snapshotRef.current = config;
    applyDraft({
      primary: isValidHexColor(config.customPrimary)
        ? config.customPrimary
        : DEFAULT_CUSTOM_PRIMARY,
      tone: config.customBackgroundTone ?? DEFAULT_CUSTOM_BACKGROUND_TONE,
    });
  }, [config, applyDraft]);

  const selectPrimary = useCallback(
    (primary: string) => {
      const prev = draftRef.current;
      if (!prev || !isValidHexColor(primary)) return;
      applyDraft({ ...prev, primary });
    },
    [applyDraft],
  );

  const selectTone = useCallback(
    (tone: CustomBackgroundTone) => {
      const prev = draftRef.current;
      if (!prev) return;
      applyDraft({ ...prev, tone });
    },
    [applyDraft],
  );

  const close = useCallback(() => {
    draftRef.current = null;
    snapshotRef.current = null;
    setDraft(null);
  }, []);

  // 回滾至開啟前快照（「取消」與 unmount 清理共用同一入口）。
  // 快照 ref 即 guard：commit／取消／還原收尾都會清空快照，之後再呼叫為 no-op。
  const rollbackToSnapshot = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    previewTheme(snapshot);
    snapshotRef.current = null;
    draftRef.current = null;
  }, []);

  // 關閉 sheet＝commit：draft 值單次原子持久化。
  const commitClose = useCallback(() => {
    const current = draftRef.current;
    if (current) commitCustomTheme(current.primary, current.tone);
    close();
  }, [commitCustomTheme, close]);

  // 取消＝回滾開啟前快照（僅還原 DOM，persist 零寫入）。
  const cancel = useCallback(() => {
    rollbackToSnapshot();
    close();
  }, [rollbackToSnapshot, close]);

  // 收尾不 commit 不回滾（「還原預設」已由 resetTheme 提交 zen 後使用）。
  const discard = close;

  // unmount 清理（PR #671 Blocking 修正）：sheet 開啟中跳離路由時回滾未 commit 的 draft；
  // 已收尾（commit／取消／還原）者快照為空，本清理自然 no-op，不會覆蓋 commit 結果。
  useEffect(() => rollbackToSnapshot, [rollbackToSnapshot]);

  return {
    isOpen: draft !== null,
    draftPrimary: draft?.primary ?? DEFAULT_CUSTOM_PRIMARY,
    draftTone: draft?.tone ?? DEFAULT_CUSTOM_BACKGROUND_TONE,
    open,
    selectPrimary,
    selectTone,
    commitClose,
    cancel,
    discard,
  };
}

export type UseCustomThemeDraftReturn = ReturnType<typeof useCustomThemeDraft>;
