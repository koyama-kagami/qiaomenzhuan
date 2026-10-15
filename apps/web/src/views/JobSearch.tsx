import { useState, useRef } from 'react';
import type { ViewProps } from '../api';
import { Heading } from '../components';
import Companies from './Companies';
import Jobs from './Jobs';
import Interviews from './Interviews';
const sections = [
  { id: 'companies', label: '企业', View: Companies },
  { id: 'jobs', label: '招聘', View: Jobs },
  { id: 'interviews', label: '面试记录', View: Interviews },
] as const;
export default function JobSearch(props: ViewProps) {
  const [active, setActive] = useState<string>('jobs');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="job-search-page">
      <Heading title="求职" />
      <div className="section-tabs" role="tablist" aria-label="求职分类">
        {sections.map((section, index) => (
          <button
            key={section.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            role="tab"
            id={`tab-${section.id}`}
            aria-controls={`panel-${section.id}`}
            aria-selected={active === section.id}
            tabIndex={active === section.id ? 0 : -1}
            className={active === section.id ? 'selected' : ''}
            onClick={() => setActive(section.id)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % sections.length
                  : event.key === 'ArrowLeft'
                    ? (index + sections.length - 1) % sections.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? sections.length - 1
                        : -1;
              if (next < 0) return;
              event.preventDefault();
              setActive(sections[next].id);
              tabs.current[next]?.focus();
            }}
          >
            {section.label}
          </button>
        ))}
      </div>
      {sections.map(({ id, View }) => (
        <section
          key={id}
          id={`panel-${id}`}
          role="tabpanel"
          aria-labelledby={`tab-${id}`}
          hidden={active !== id}
        >
          <View {...props} embedded />
        </section>
      ))}
    </div>
  );
}
