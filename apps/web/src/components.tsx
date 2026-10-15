import { useEffect, useRef, cloneElement, isValidElement, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>('input,button,textarea,select')?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Empty({ title }: { title: string }) {
  return (
    <div className="empty">
      <p>{title}</p>
    </div>
  );
}
export function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-heading">
      {title && <h1>{title}</h1>}
      <div className="heading-actions">{children}</div>
    </header>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const control =
    isValidElement<{ 'aria-label'?: string }>(children) &&
    typeof children.type === 'string' &&
    ['input', 'select', 'textarea'].includes(children.type)
      ? cloneElement(children, { 'aria-label': children.props['aria-label'] || label })
      : children;
  return (
    <label className="field">
      <span>{label}</span>
      {control}
    </label>
  );
}
export const dateLabel = (value: string) =>
  value
    ? new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : '未设置';
