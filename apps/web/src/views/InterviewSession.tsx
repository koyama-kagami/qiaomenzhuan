import { useState } from 'react';
import { Pencil, Trash2, Check, Undo2, Save } from 'lucide-react';
import type { RecordMap, Message } from '@nextoffer/core';
import { save, remove, type ViewProps } from '../api';
export default function Session({
  interview,
  refresh,
  run,
  busy,
}: { interview: RecordMap['interviews'] } & ViewProps) {
  const [content, setContent] = useState('');
  const [role, setRole] = useState<Message['role']>('candidate');
  const [editingId, setEditingId] = useState('');
  const completed = interview.status === 'completed';
  return (
    <>
      <div className="session-header">
        <h2>{interview.title}</h2>
        <span>{completed ? '已完成' : '记录中'}</span>
      </div>
      <div className="messages">
        {interview.messages.length ? (
          interview.messages.map((m, i) => (
            <article key={m.id} className={`message ${m.role}`}>
              <div className="message-label">
                <span>{m.role === 'candidate' ? '我的回答' : '面试官问题'}</span>
                {!completed && (
                  <button
                    className="icon-button"
                    aria-label={`编辑第 ${i + 1} 条记录`}
                    disabled={busy}
                    onClick={() => {
                      setEditingId(m.id);
                      setContent(m.content);
                      setRole(m.role);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
              <div className="prose">{m.content}</div>
            </article>
          ))
        ) : (
          <div className="conversation-start">暂无记录</div>
        )}
      </div>
      {!completed && (
        <form
          className="message-composer"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            void run(async () => {
              await save('interviews', {
                ...interview,
                review: null,
                messages: editingId
                  ? interview.messages.map((m) =>
                      m.id === editingId ? { ...m, role, content } : m,
                    )
                  : [...interview.messages, { id: crypto.randomUUID(), role, content }],
              });
              await refresh();
              setContent('');
              setEditingId('');
            });
          }}
        >
          <textarea
            required
            rows={5}
            aria-label="面试记录内容"
            placeholder="输入记录"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
            <select
              aria-label="发言角色"
              value={role}
              onChange={(e) => setRole(e.target.value as Message['role'])}
            >
              <option value="candidate">我的回答</option>
              <option value="interviewer">面试官问题</option>
            </select>
            <button className="primary" disabled={busy || !content.trim()}>
              <Save size={16} />
              {editingId ? '保存修改' : '保存记录'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId('');
                  setContent('');
                }}
              >
                取消修改
              </button>
            )}
          </div>
        </form>
      )}
      <div className="session-actions">
        <button
          disabled={busy || (!completed && !interview.messages.length)}
          onClick={() => {
            if (content.trim() && !window.confirm('有未保存的记录，确定放弃？')) return;
            void run(async () => {
              await save('interviews', {
                ...interview,
                status: completed ? 'active' : 'completed',
              });
              await refresh();
              setContent('');
              setEditingId('');
            });
          }}
        >
          {completed ? <Undo2 size={16} /> : <Check size={16} />}
          {completed ? '重新打开' : '完成记录'}
        </button>
        <button
          disabled={busy}
          onClick={() => {
            if (window.confirm(`删除「${interview.title}」？`))
              void run(async () => {
                await remove('interviews', interview.id, interview.revision);
                await refresh();
              });
          }}
        >
          <Trash2 size={16} />
          删除记录
        </button>
      </div>
    </>
  );
}
