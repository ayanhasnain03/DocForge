export function deferTask(task: () => void): void {
  queueMicrotask(task);
}

export function deferAfterPaint(task: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      queueMicrotask(task);
    });
    return;
  }
  setTimeout(task, 0);
}
