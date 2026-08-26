import { bindButtonActivation } from '../core/domButton';
import { positionLearningCoachmark } from './learningCoachmark';

let overlay: HTMLElement | null = null;
let escapeHandler: ((event: KeyboardEvent) => void) | null = null;

export function isTutorialChoiceOpen(): boolean {
  return overlay !== null;
}

export function closeTutorialChoice(): void {
  if (escapeHandler) document.removeEventListener('keydown', escapeHandler);
  escapeHandler = null;
  overlay?.remove();
  overlay = null;
}

export function showTutorialChoice(onTutorial: () => void, onDirectStart: () => void): void {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.className = 'learning-coachmark-layer learning-entry-layer tutorial-choice-overlay';
  overlay.dataset['learningMode'] = 'entry';

  const card = document.createElement('div');
  card.className = 'learning-coachmark-card learning-entry-popover tutorial-choice-card';
  card.dataset['learningCard'] = 'true';
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', '選擇新手教學');
  const title = document.createElement('h2');
  title.className = 'tutorial-choice-title';
  title.textContent = '第一次玩星噗噗？';
  card.appendChild(title);
  const desc = document.createElement('p');
  desc.className = 'tutorial-choice-desc';
  desc.textContent = '用實際操作學會移動、跳躍、吸入、吐星彈，還有對 Shelly 下砸與變身。';
  card.appendChild(desc);

  const actions = document.createElement('div');
  actions.className = 'tutorial-choice-actions';
  const guided = document.createElement('button');
  guided.type = 'button';
  guided.className = 'install-btn install-btn-primary';
  guided.textContent = '進入練習區';
  guided.dataset['tutorialChoice'] = 'guided';
  bindButtonActivation(guided, () => {
    closeTutorialChoice();
    onTutorial();
  });
  actions.appendChild(guided);

  const direct = document.createElement('button');
  direct.type = 'button';
  direct.className = 'install-btn';
  direct.textContent = '直接開始';
  direct.dataset['tutorialChoice'] = 'direct';
  bindButtonActivation(direct, () => {
    closeTutorialChoice();
    onDirectStart();
  });
  actions.appendChild(direct);
  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  escapeHandler = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') closeTutorialChoice();
  };
  document.addEventListener('keydown', escapeHandler);
  positionLearningCoachmark(overlay, '[data-menu="start"]');
}
