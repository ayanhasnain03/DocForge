import { deferTask } from '@/lib/admin/defer';

export function handleTextareaTabKey(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  onValueChange: (value: string) => void,
): void {
  if (event.key !== 'Tab') return;

  event.preventDefault();
  const field = event.currentTarget;
  const start = field.selectionStart;
  const end = field.selectionEnd;
  const insert = '  ';
  const next = `${field.value.slice(0, start)}${insert}${field.value.slice(end)}`;
  onValueChange(next);

  deferTask(() => {
    field.selectionStart = start + insert.length;
    field.selectionEnd = start + insert.length;
  });
}
