import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import overviewDocument from '../PROJECT_OVERVIEW.md?raw';
import technicalDocument from '../PROJECT_TECHNICAL.md?raw';
import architectureDiagramUrl from '../payflow-c4-architecture.svg';
import './AboutProjectPage.css';

const sections = {
  overview: {
    label: 'Общий обзор',
    code: 'CLIENT / 01',
    description: 'Возможности PayFlow для пользователя',
    source: overviewDocument,
  },
  technical: {
    label: 'Техническая часть',
    code: 'SYSTEM / 02',
    description: 'Архитектура, сервисы, стек и события',
    source: technicalDocument,
  },
};

export default function AboutProjectPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('section');
  const activeSection = requestedSection === 'technical' ? 'technical' : 'overview';
  const document = sections[activeSection];
  const documentNodes = useMemo(() => renderMarkdown(document.source), [document.source]);

  const selectSection = section => {
    setSearchParams(section === 'overview' ? {} : { section });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-hero__eyebrow">PF / PROJECT DOSSIER</span>
          <h1>О проекте</h1>
          <p>
            PayFlow — микросервисная финансовая платформа, в которой пользовательский опыт,
            банковские операции и наблюдаемая инфраструктура собраны в один цельный продукт.
          </p>
          <div className="about-hero__tags" aria-label="Ключевые свойства проекта">
            <span>REST + WS</span>
            <span>EVENT DRIVEN</span>
            <span>OAUTH2 / OIDC</span>
          </div>
        </div>
        <div className="about-hero__status" aria-label="Статус системы">
          <span className="about-hero__status-label">SYSTEM PROFILE</span>
          <strong>PAYFLOW</strong>
          <div><i /> MICROSERVICE READY</div>
          <small>CLIENT · BFF · DOMAINS · EVENTS</small>
        </div>
      </section>

      <div className="about-tabs" role="tablist" aria-label="Разделы описания проекта">
        {Object.entries(sections).map(([key, section]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeSection === key}
            className={`about-tab${activeSection === key ? ' is-active' : ''}`}
            onClick={() => selectSection(key)}
          >
            <span>{section.code}</span>
            <strong>{section.label}</strong>
            <small>{section.description}</small>
          </button>
        ))}
      </div>

      <article className={`project-document project-document--${activeSection}`}>
        <div className="project-document__rail" aria-hidden="true">
          <span>{document.code}</span>
          <i />
          <small>PAYFLOW DOCUMENTATION</small>
        </div>
        <div className="project-document__content">{documentNodes}</div>
      </article>
    </div>
  );
}

function renderMarkdown(source) {
  const lines = source.replace(/\r/g, '').trim().split('\n');
  const nodes = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim() === '[[PAYFLOW_C4_DIAGRAM]]') {
      nodes.push(
        <figure key={`architecture-${index}`} className="project-architecture">
          <a href={architectureDiagramUrl} target="_blank" rel="noreferrer" aria-label="Открыть C4-диаграмму PayFlow в полном размере">
            <img
              src={architectureDiagramUrl}
              alt="C4-диаграмма PayFlow: клиент, frontend, BFF, Keycloak, бизнес-сервисы, Kafka-топики, базы данных и observability"
            />
          </a>
          <figcaption>Нажмите на диаграмму, чтобы открыть её в полном размере.</figcaption>
        </figure>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      nodes.push(
        <pre key={`code-${index}`} className="project-document__code" data-language={language || 'text'}>
          <code>{code.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = `h${level}`;
      nodes.push(<Tag key={`heading-${index}`}>{renderInline(heading[2], `heading-${index}`)}</Tag>);
      index += 1;
      continue;
    }

    if (isTableHeader(lines, index)) {
      const headers = parseTableRow(lines[index]);
      const rows = [];
      index += 2;

      while (index < lines.length && /^\|.*\|$/.test(lines[index].trim())) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      nodes.push(
        <div key={`table-${index}`} className="project-document__table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((header, cellIndex) => (
                  <th key={`table-${index}-header-${cellIndex}`}>
                    {renderInline(header, `table-${index}-header-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`table-${index}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`table-${index}-cell-${rowIndex}-${cellIndex}`}>
                      {renderInline(cell, `table-${index}-cell-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      const quote = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      nodes.push(
        <blockquote key={`quote-${index}`}>{renderInline(quote.join(' '), `quote-${index}`)}</blockquote>
      );
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^-\s+/, ''));
        index += 1;
      }
      nodes.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInline(item, `list-${index}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      nodes.push(
        <ol key={`ordered-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInline(item, `ordered-${index}-${itemIndex}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    nodes.push(
      <p key={`paragraph-${index}`}>{renderInline(paragraph.join(' '), `paragraph-${index}`)}</p>
    );
  }

  return nodes;
}

function isBlockStart(line) {
  return /^(#{1,3})\s+/.test(line)
    || line.startsWith('```')
    || line.startsWith('> ')
    || line.trim().startsWith('|')
    || /^-\s+/.test(line)
    || /^\d+\.\s+/.test(line);
}

function isTableHeader(lines, index) {
  return /^\|.*\|$/.test(lines[index]?.trim() ?? '')
    && /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(lines[index + 1]?.trim() ?? '');
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => cell.trim());
}

function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
