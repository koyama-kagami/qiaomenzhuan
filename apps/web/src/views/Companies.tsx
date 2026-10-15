import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Company } from '@nextoffer/core';
import { save, remove, type ViewProps } from '../api';
import { Heading, Empty, Field, Modal } from '../components';
const blank = { name: '', industry: '', location: '', website: '', notes: '' };
export default function Companies({ data, refresh, run, busy, embedded }: ViewProps) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const [selected, setSelected] = useState('');
  const companies = data.companies.filter((c) =>
    `${c.name} ${c.industry} ${c.location}`.toLowerCase().includes(query.toLowerCase()),
  );
  const company = data.companies.find((c) => c.id === selected);
  return (
    <>
      <Heading title={embedded ? '' : '企业信息'}>
        <button className="primary" onClick={() => setEditing({ ...blank })}>
          <Plus size={18} />
          添加企业
        </button>
      </Heading>
      <section className="panel company-panel">
        <div className="company-search">
          <input
            aria-label="搜索企业"
            placeholder="搜索企业"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {companies.length ? (
          <div className="company-table">
            <div className="company-row company-table-head">
              <span>企业</span>
              <span>行业</span>
              <span>地点</span>
            </div>
            {companies.map((c) => (
              <button className="company-row" key={c.id} onClick={() => setSelected(c.id)}>
                <strong>{c.name}</strong>
                <span>{c.industry || '—'}</span>
                <span>{c.location || '—'}</span>
              </button>
            ))}
          </div>
        ) : (
          <Empty title={query ? '无匹配结果' : '暂无企业'} />
        )}
      </section>
      {company && !editing && (
        <Modal title={company.name} onClose={() => setSelected('')}>
          <dl className="company-details">
            <dt>行业</dt>
            <dd>{company.industry || '—'}</dd>
            <dt>地点</dt>
            <dd>{company.location || '—'}</dd>
            <dt>官网</dt>
            <dd>
              {company.website ? (
                <a href={company.website} target="_blank" rel="noreferrer">
                  {company.website}
                </a>
              ) : (
                '—'
              )}
            </dd>
            <dt>备注</dt>
            <dd className="prose">{company.notes || '—'}</dd>
          </dl>
          <div className="modal-actions">
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm(`删除「${company.name}」？`))
                  void run(async () => {
                    await remove('companies', company.id, company.revision);
                    await refresh();
                    setSelected('');
                  });
              }}
            >
              <Trash2 size={16} />
              删除企业
            </button>
            <button className="primary" onClick={() => setEditing(company)}>
              <Pencil size={16} />
              编辑企业
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal title={editing.id ? '编辑企业' : '添加企业'} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const c = await save('companies', editing);
                await refresh();
                setSelected(c.id);
                setEditing(null);
              });
            }}
          >
            <div className="form-grid">
              {(
                [
                  ['name', '企业名称'],
                  ['industry', '行业'],
                  ['location', '地点'],
                  ['website', '官网'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    required={key === 'name'}
                    type={key === 'website' ? 'url' : 'text'}
                    value={editing[key] || ''}
                    onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <Field label="备注">
              <textarea
                rows={5}
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </Field>
            <div className="modal-actions">
              <button disabled={busy} className="primary">
                保存企业
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
