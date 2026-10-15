import type { CSSProperties } from 'react';
import type { Resume } from '@nextoffer/core';
import { Plus } from 'lucide-react';
export default function ResumeStack({
  resumes,
  onOpen,
  onCreate,
}: {
  resumes: Resume[];
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const visible = resumes.slice(0, 5);
  return (
    <div className="resume-library">
      <div className={`resume-stack ${resumes.length ? 'has-documents' : 'empty-stack'}`}>
        {!resumes.length ? (
          <>
            <div className="blank-sheet sheet-back" aria-hidden="true" />
            <div className="blank-sheet sheet-middle" aria-hidden="true" />
            <button
              className="document-sheet sheet-front"
              aria-label="创建第一份简历"
              onClick={onCreate}
            >
              <span className="paper-title">简历</span>
              <span className="paper-rule" />
              <span className="paper-lines" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="paper-create">
                <Plus size={20} />
                新建简历
              </span>
            </button>
          </>
        ) : (
          visible.map((resume, index) => (
            <button
              key={resume.id}
              className="document-sheet resume-document"
              style={
                {
                  '--offset': index - (visible.length - 1) / 2,
                  '--layer': visible.length - index,
                } as CSSProperties
              }
              aria-label={`打开简历：${resume.title}`}
              onClick={() => onOpen(resume.id)}
            >
              <span className="paper-title">{resume.title}</span>
              <span className="paper-rule" />
              <span className="paper-excerpt">
                {resume.source
                  .split('\\begin{document}')[1]
                  ?.split('\\end{document}')[0]
                  ?.replace(/\\(?:begin|end)\{[^}]*\}/g, '')
                  .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?/g, '')
                  .replace(/[{}\\]/g, '')
                  .trim()
                  .slice(0, 350) || ''}
              </span>
              <span className="paper-version">v{resume.version}</span>
            </button>
          ))
        )}
      </div>
      {resumes.length > 0 && (
        <div className="resume-index">
          {resumes.map((resume) => (
            <button key={resume.id} onClick={() => onOpen(resume.id)}>
              {resume.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
