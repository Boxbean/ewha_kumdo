'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  editable: boolean;
  onSave: (value: string) => Promise<void>;
  multiline?: boolean;
  type?: 'text' | 'date' | 'number';
  placeholder?: string;
  emptyText?: string;
  renderValue?: (value: string) => React.ReactNode;
}

// 노션처럼 값을 클릭하면 바로 입력창으로 바뀌고, 포커스를 벗어나면 저장되는 인라인 편집 필드
export default function EditableField({
  value, editable, onSave, multiline, type = 'text', placeholder, emptyText = '등록된 정보 없음', renderValue,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing) (multiline ? textareaRef.current : inputRef.current)?.focus();
  }, [editing, multiline]);

  async function commit() {
    setEditing(false);
    if (draft === value) return;
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      setDraft(value); // 저장 실패 시 원래 값으로 되돌림
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editable) {
    if (!value) return <span style={{ color: '#B9B9B9', fontStyle: 'italic' }}>{emptyText}</span>;
    return renderValue ? <>{renderValue(value)}</> : <span className="whitespace-pre-wrap">{value}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-left rounded transition-opacity hover:opacity-70"
      >
        {value ? (
          renderValue ? renderValue(value) : <span className="whitespace-pre-wrap">{value}</span>
        ) : (
          <span style={{ color: '#B9B9B9', fontStyle: 'italic' }}>{emptyText} · 클릭해서 입력</span>
        )}
        {saving && <span className="text-xs ml-1.5" style={{ color: '#00462A' }}>저장 중…</span>}
      </button>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        rows={2}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
        className="w-full text-sm px-2 py-1.5 rounded border focus:outline-none resize-y"
        style={{ borderColor: '#00462A' }}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter') commit();
      }}
      className="w-full text-sm px-2 py-1 rounded border focus:outline-none"
      style={{ borderColor: '#00462A' }}
    />
  );
}
