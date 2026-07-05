/**
 * dnd 拖曳把手選擇器契約測試
 *
 * 防護 dnd 套件升級改屬性名（生態系已發生過：react-beautiful-dnd 的
 * data-rbd-* → @hello-pangea/dnd 的 data-rfd-*）。
 * 渲染真實 DragDropContext/Droppable/Draggable，斷言套件注入的把手元素
 * matches DND_DRAG_HANDLE_SELECTOR；若屬性名漂移而常數未同步，本測試紅燈，
 * usePullToRefresh 的 PTR gate 才不會靜默失效。
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
} from '@hello-pangea/dnd';
import { DND_DRAG_HANDLE_SELECTOR } from '../usePullToRefresh';

function DndFixture() {
  return (
    <DragDropContext onDragEnd={() => undefined}>
      <Droppable droppableId="contract-list">
        {(provided: DroppableProvided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Draggable draggableId="USD" index={0}>
              {(dragProvided: DraggableProvided) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  {...dragProvided.dragHandleProps}
                  data-testid="contract-drag-handle"
                >
                  <span data-testid="contract-drag-handle-child">USD</span>
                </div>
              )}
            </Draggable>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

describe('DND_DRAG_HANDLE_SELECTOR 契約（真實 dnd 渲染）', () => {
  it('套件注入的把手元素 matches 選擇器', () => {
    render(<DndFixture />);
    const handle = screen.getByTestId('contract-drag-handle');
    expect(handle.matches(DND_DRAG_HANDLE_SELECTOR)).toBe(true);
  });

  it('把手子元素可經由 closest(選擇器) 命中把手（PTR gate 實際用法）', () => {
    render(<DndFixture />);
    const child = screen.getByTestId('contract-drag-handle-child');
    expect(child.closest(DND_DRAG_HANDLE_SELECTOR)).toBe(
      screen.getByTestId('contract-drag-handle'),
    );
  });
});
