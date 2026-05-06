import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, FileText, Heart, BookOpen, Github } from 'lucide-react';
import { ArxivPaper, PAPER_TOPICS } from '../lib/arxiv';
import { format } from 'date-fns';
import clsx from 'clsx';

const TAG_COLORS: Record<string, string> = {
  robotics: 'bg-orange-50 text-orange-700',
  humanoids: 'bg-red-50 text-red-700',
  'embodied-ai': 'bg-violet-50 text-violet-700',
  'digital-twins': 'bg-teal-50 text-teal-700',
  simulation: 'bg-emerald-50 text-emerald-700',
  research: 'bg-blue-50 text-blue-700',
};

interface Props {
  paper: ArxivPaper;
}

export function PaperCard({ paper }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasNvidia = paper.nvidiaTerms && paper.nvidiaTerms.length > 0;

  return (
    <div className={clsx(
      'bg-white border rounded-xl p-4 hover:shadow-sm transition-all group relative',
      hasNvidia ? 'border-[#76B900]/40 hover:border-[#76B900]/70' : 'border-gray-200 hover:border-gray-300'
    )}>
      {/* NVIDIA accent bar */}
      {hasNvidia && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-[#76B900] to-[#5a8a00]" />
      )}

      <div className="flex items-start gap-3">
        <div className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 border',
          hasNvidia
            ? 'bg-[#76B900]/10 border-[#76B900]/30'
            : 'bg-rose-50 border-rose-100'
        )}>
          <FileText size={14} className={hasNvidia ? 'text-[#76B900]' : 'text-rose-500'} />
        </div>

        <div className="flex-1 min-w-0">
          {/* NVIDIA badge row — shown prominently when matched */}
          {hasNvidia && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {paper.nvidiaTerms!.slice(0, 4).map(term => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#76B900', color: '#fff' }}
                >
                  {/* NVIDIA "eye" logo approximation */}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                    <path d="M5 2C3.34 2 1.91 3.05 1.27 4.52A4.01 4.01 0 0 0 5 7c1.66 0 3.09-1.05 3.73-2.52A4.01 4.01 0 0 0 5 2Z" fill="white" fillOpacity=".9"/>
                    <circle cx="5" cy="4.8" r="1.2" fill="#76B900"/>
                  </svg>
                  {term}
                </span>
              ))}
            </div>
          )}

          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 leading-snug inline-flex items-start gap-1 group/link"
            >
              <span>{paper.title}</span>
              <ExternalLink size={10} className="flex-shrink-0 mt-1 opacity-40 group-hover/link:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Meta */}
          <p className="text-xs text-gray-400 mb-2">
            {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}
            {' · '}
            {format(new Date(paper.published), 'MMM d, yyyy')}
            {paper.venue && <span className="ml-1 italic">· {paper.venue}</span>}
            {paper.arxivId && <span className="font-mono ml-1 text-gray-300">· {paper.arxivId}</span>}
          </p>

          {/* Physical AI topic badges */}
          {paper.paperTopics && paper.paperTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {paper.paperTopics.slice(0, 4).map(tid => {
                const topic = PAPER_TOPICS.find(t => t.id === tid);
                if (!topic) return null;
                return (
                  <span key={tid} className={clsx('text-xs px-1.5 py-0.5 rounded-full font-semibold', topic.color)}>
                    {topic.short}
                  </span>
                );
              })}
            </div>
          )}

          {/* Tags + categories */}
          <div className="flex flex-wrap gap-1 mb-2">
            {paper.tags.map(t => (
              <span key={t} className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium', TAG_COLORS[t] ?? 'bg-gray-100 text-gray-600')}>{t}</span>
            ))}
            {paper.categories.slice(0, 2).map(c => (
              <span key={c} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{c}</span>
            ))}
          </div>

          {/* Abstract toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-1"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Hide abstract' : 'Abstract'}
          </button>
          {expanded && (
            <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mt-1">
              {paper.abstract}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {paper.hfUpvotes !== undefined && (
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                  <Heart size={10} className="fill-current" />
                  {paper.hfUpvotes} on 🤗
                </span>
              )}
              {paper.pwcStars !== undefined && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  ★ {paper.pwcStars.toLocaleString()}
                </span>
              )}
              {paper.openreviewVenue && (
                <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                  <BookOpen size={9} />{paper.openreviewVenue}
                </span>
              )}
              {paper.socialSources?.includes('x') && (
                <span className="text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded font-medium">𝕏</span>
              )}
              {paper.socialSources?.includes('reddit') && (
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">Reddit</span>
              )}
              {paper.citationCount !== undefined && !paper.hfUpvotes && !paper.pwcStars && (
                <span className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{paper.citationCount}</span> citations
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {paper.pwcCodeUrl && (
                <a
                  href={paper.pwcCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors font-medium"
                >
                  <Github size={10} /> Code
                </a>
              )}
              {paper.pdfUrl && (
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors font-medium"
                >
                  PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
