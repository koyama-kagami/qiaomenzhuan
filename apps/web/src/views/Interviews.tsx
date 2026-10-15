import Session from './InterviewSession';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { save, type ViewProps } from '../api';
import { Heading, Empty, Modal, Field, dateLabel } from '../components';
export default function Interviews(props: ViewProps) {
  const { data, refresh, run, busy } = props;
  const [selected, setSelected] = useState(''),
    [creating, setCreating] = useState(false),
    [draft, setDraft] = useState({
      title: '',
      jobId: '',
      resumeId: '',
      mode: 'real' as const,
    });
  const interview = data.interviews.find((i) => i.id === selected) || data.interviews[0];
  return (
    <>
      <Heading title={props.embedded ? '' : '面试记录'}>
        <button className="primary" onClick={() => setCreating(true)}>
          <Plus size={17} />
          新建面试
        </button>
      </Heading>
      <div className="interview-layout">
        <aside className="panel session-list">
          <div className="list-caption">
            面试记录<span>{data.interviews.length} 次</span>
          </div>
          {data.interviews.length ? (
            data.interviews.map((i) => (
              <button
                key={i.id}
                className={`note-item ${interview?.id === i.id ? 'selected' : ''}`}
                onClick={() => setSelected(i.id)}
              >
                <h3>{i.title}</h3>
                <p>
                  {data.jobs.find((j) => j.id === i.jobId)?.company || '未关联岗位'} ·{' '}
                  {i.mode === 'mock' ? '模拟面试' : '真实面试'}
                </p>
                <small>
                  {dateLabel(i.updatedAt)} · {i.status === 'completed' ? '已完成' : '进行中'}
                </small>
              </button>
            ))
          ) : (
            <p className="list-empty">暂无记录</p>
          )}
        </aside>
        <section className="panel conversation-panel">
          {interview ? (
            <Session key={interview.id} interview={interview} {...props} />
          ) : (
            <Empty title="暂无面试" />
          )}
        </section>
      </div>
      {creating && (
        <Modal title="新建面试" onClose={() => setCreating(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const item = await save('interviews', {
                  ...draft,
                  messages: [],
                  status: 'active',
                  review: null,
                });
                await refresh();
                setSelected(item.id);
                setCreating(false);
              });
            }}
          >
            <Field label="面试名称">
              <input
                required
                placeholder="面试名称"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label="关联岗位">
                <select
                  value={draft.jobId}
                  onChange={(e) => setDraft({ ...draft, jobId: e.target.value })}
                >
                  <option value="">未关联岗位</option>
                  {data.jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.company} · {j.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="关联简历">
              <select
                value={draft.resumeId}
                onChange={(e) => setDraft({ ...draft, resumeId: e.target.value })}
              >
                <option value="">暂不关联</option>
                {data.resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} · v{r.version}
                  </option>
                ))}
              </select>
            </Field>
            <div className="modal-actions">
              <button className="primary" disabled={busy}>
                创建面试
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
