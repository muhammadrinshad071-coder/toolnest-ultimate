/**
 * Accessible toast notifications. The container is an aria-live region
 * rendered in every page, so screen readers announce each message.
 */
import { iconSvg } from '../core/icons.js';

const MAX_TOASTS = 3;

export function toast(message, { type = 'info', action = null, duration = 4500 } = {}) {
  const region = document.getElementById('toasts');
  if (!region) return () => {};

  while (region.children.length >= MAX_TOASTS) region.firstElementChild.remove();

  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  const iconName = type === 'error' ? 'alert' : type === 'success' ? 'check' : 'info';
  el.insertAdjacentHTML('afterbegin', iconSvg(iconName, { size: 18 }));
  const msg = document.createElement('span');
  msg.className = 'toast__msg';
  msg.textContent = message;
  el.append(msg);

  let timer = null;
  const dismiss = () => {
    clearTimeout(timer);
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 200);
  };

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--sm';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      dismiss();
    });
    el.append(btn);
  }

  const start = () => { timer = setTimeout(dismiss, action ? Math.max(duration, 7000) : duration); };
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', start);
  el.addEventListener('focusin', () => clearTimeout(timer));
  el.addEventListener('focusout', start);

  region.append(el);
  start();
  return dismiss;
}
