/**
 * dnd 拖曳把手 DOM 契約（SSOT）
 *
 * @hello-pangea/dnd 會在 drag handle 元素注入 data-rfd-drag-handle-draggable-id 屬性；
 * usePullToRefresh 以此選擇器抑制 PTR，避免與拖曳排序互相干擾。
 * 屬性名屬第三方套件內部實作（rbd data-rbd-* → pangea data-rfd-* 曾改名），
 * 升級改名時由 dnd-drag-handle-contract 契約測試攔截。
 */

export const DND_DRAG_HANDLE_ATTRIBUTE = 'data-rfd-drag-handle-draggable-id';

export const DND_DRAG_HANDLE_SELECTOR = `[${DND_DRAG_HANDLE_ATTRIBUTE}]`;
