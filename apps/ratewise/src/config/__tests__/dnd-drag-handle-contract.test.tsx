/**
 * dnd 拖曳把手 DOM 契約測試
 *
 * 渲染真實 DragDropContext/Droppable/Draggable，斷言套件實際注入的
 * drag handle 屬性與 DND_DRAG_HANDLE_SELECTOR（SSOT）一致。
 * @hello-pangea/dnd 升級若改屬性名（如 rbd data-rbd-* → pangea data-rfd-*），
 * 本測試即紅燈，防止 usePullToRefresh 的 PTR gate 靜默失效。
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DND_DRAG_HANDLE_ATTRIBUTE, DND_DRAG_HANDLE_SELECTOR } from '../dnd';

function ContractFixture() {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="contract-droppable">
        {(droppableProvided) => (
          <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            <Draggable draggableId="USD" index={0}>
              {(draggableProvided) => (
                <div
                  ref={draggableProvided.innerRef}
                  {...draggableProvided.draggableProps}
                  {...draggableProvided.dragHandleProps}
                  data-testid="contract-drag-handle"
                >
                  USD
                </div>
              )}
            </Draggable>
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

describe('dnd 拖曳把手 DOM 契約', () => {
  it('真實 Draggable handle 元素 matches DND_DRAG_HANDLE_SELECTOR', () => {
    render(<ContractFixture />);
    const handle = screen.getByTestId('contract-drag-handle');
    expect(handle.matches(DND_DRAG_HANDLE_SELECTOR)).toBe(true);
  });

  it('真實 Draggable handle 元素帶有 DND_DRAG_HANDLE_ATTRIBUTE 屬性', () => {
    render(<ContractFixture />);
    const handle = screen.getByTestId('contract-drag-handle');
    expect(handle.getAttribute(DND_DRAG_HANDLE_ATTRIBUTE)).toBe('USD');
  });
});
