import { useEffect, useRef } from 'react';

function comboOf(event) {
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push('mod');
  if (event.shiftKey) parts.push('shift');
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

export default function useKeyboardShortcuts(bindings) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    const handler = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const action = ref.current[comboOf(event)];
      if (action) {
        event.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
