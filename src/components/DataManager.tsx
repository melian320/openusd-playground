import { useState, useRef } from 'react';
import { X, Upload, Link2, RotateCcw, FileJson, FileSpreadsheet, Check, AlertCircle, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { useDataSourceConfig, DataKey } from '../hooks/useDataSource';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
}

const DATA_KEYS: { key: DataKey; label: string; description: string; expectedFields: string[] }[] = [
  { key: 'communities',     label: 'Communities',     description: 'Discord servers, Reddit, LinkedIn groups, Slack workspaces',         expectedFields: ['id','name','platform','url','members','description','topics','buzzLevel','weeklyActivity','lastActive','region'] },
  { key: 'conferences',     label: 'Events',          description: 'Conferences, summits — formal Physical AI events',                   expectedFields: ['id','name','type','format','startDate','endDate','location','url','description','topics','buzzLevel','region'] },
  { key: 'meetups',         label: 'Meetups & Hackathons', description: 'Local gatherings, hackathons, workshops',                       expectedFields: ['id','name','type','format','startDate','location','url','lumaUrl','topics','buzzLevel','region','nvidiaTech','sponsorRecommendation'] },
  { key: 'speakers',        label: 'Speakers',        description: 'Researchers, practitioners, founders with speaking experience',      expectedFields: ['id','name','title','company','bio','topics','kloutScore','linkedinFollowers','twitterFollowers','domains'] },
  { key: 'shows',           label: 'Podcasts',        description: 'Podcasts, YouTube shows covering Physical AI',                       expectedFields: ['id','name','host','platform','url','description','topics','buzzLevel','subscribers','episodesPerMonth'] },
  { key: 'discordChannels', label: 'Discord channels',description: 'Specific Discord channels with weekly activity tracking',            expectedFields: ['id','server','serverUrl','channel','topic','members','weeklyMessages','buzzLevel','recentTopics','domains'] },
  { key: 'hotTopics',       label: 'Hot Topics',      description: 'Trending Physical AI topics with buzz score and trend',              expectedFields: ['id','topic','description','buzzScore','sources','trend'] },
  { key: 'influencers',     label: 'Influencers',     description: 'Social-media voices with engagement scoring',                        expectedFields: ['id','name','handle','platform','followers','title','company','bio','topics','kloutScore','shouldEngage','engageReason'] },
  { key: 'githubRepos',     label: 'GitHub repos',    description: 'Tracked official + community repos with stars/forks/PRs',            expectedFields: ['id','name','ownerRepo','url','description','category','language','stars','forks','openPRs','openIssues','contributors','lastCommit','health'] },
];

export function DataManager({ open, onClose }: Props) {
  const { config, updateKey, clearKey } = useDataSourceConfig();
  const [activeKey, setActiveKey] = useState<DataKey>('communities');
  const [pasteText, setPasteText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const activeMeta = DATA_KEYS.find(d => d.key === activeKey)!;
  const activeCfg = config[activeKey];

  const handleImportJson = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of objects.');
      updateKey(activeKey, { jsonOverride: parsed, lastRefreshed: new Date().toISOString() });
      setStatusMsg({ type: 'ok', text: `Imported ${parsed.length} ${activeMeta.label.toLowerCase()} entries.` });
      setPasteText('');
    } catch (e) {
      setStatusMsg({ type: 'err', text: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    handleImportJson(text);
  };

  const handleSheetSave = (id: string, sheetName: string) => {
    updateKey(activeKey, { sheetId: id.trim() || undefined, sheetName: sheetName.trim() || undefined });
    setStatusMsg({ type: 'ok', text: 'Sheet linked. Will fetch on next refresh.' });
  };

  const handleClear = () => {
    clearKey(activeKey);
    setStatusMsg({ type: 'ok', text: 'Reset to bundled defaults.' });
  };

  const sourceLabel = activeCfg?.jsonOverride && Array.isArray(activeCfg.jsonOverride) && activeCfg.jsonOverride.length > 0
    ? `📋 Custom JSON (${activeCfg.jsonOverride.length} entries)`
    : activeCfg?.sheetId
      ? `📊 Google Sheet`
      : '📦 Bundled (default)';

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-5 py-3 flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            <FileJson size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">Data Sources</h2>
            <p className="text-[11px] text-white/80">Override bundled data with your own — pasted JSON, uploaded file, or live Google Sheet.</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: data type picker */}
          <div className="w-44 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
            {DATA_KEYS.map(d => {
              const cfg = config[d.key];
              const isOverride = cfg?.jsonOverride && Array.isArray(cfg.jsonOverride) && cfg.jsonOverride.length > 0;
              const isSheet = !!cfg?.sheetId;
              return (
                <button
                  key={d.key}
                  onClick={() => { setActiveKey(d.key); setStatusMsg(null); setPasteText(''); }}
                  className={clsx(
                    'w-full text-left px-3 py-2 border-b border-gray-100 transition-colors',
                    activeKey === d.key ? 'bg-white border-l-4 border-l-emerald-500' : 'hover:bg-white'
                  )}
                >
                  <div className="text-xs font-semibold text-gray-800">{d.label}</div>
                  <div className="text-[10px] mt-0.5">
                    {isOverride && <span className="text-emerald-600 font-semibold">📋 Custom</span>}
                    {!isOverride && isSheet && <span className="text-blue-600 font-semibold">📊 Sheet</span>}
                    {!isOverride && !isSheet && <span className="text-gray-400">Default</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: controls for selected key */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">{activeMeta.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{activeMeta.description}</p>
              <div className="text-[11px] text-gray-400 mt-1">Current source: <span className="font-semibold text-gray-700">{sourceLabel}</span>
                {activeCfg?.lastRefreshed && (
                  <span> · Updated {formatDistanceToNow(new Date(activeCfg.lastRefreshed), { addSuffix: true })}</span>
                )}
              </div>
            </div>

            {statusMsg && (
              <div className={clsx(
                'rounded-lg px-3 py-2 text-xs flex items-start gap-2 border',
                statusMsg.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
              )}>
                {statusMsg.type === 'ok' ? <Check size={12} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Option A: Google Sheet */}
            <section className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-blue-600" />
                <h4 className="text-sm font-bold text-gray-800">Option A — Live Google Sheet</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Publish a sheet to the web (<span className="font-mono">File → Share → Publish to web</span>), paste its ID below.
                Dashboard will fetch your sheet on every Refresh. Free, multi-user, no backend.
              </p>
              <SheetForm
                initialId={activeCfg?.sheetId ?? ''}
                initialSheet={activeCfg?.sheetName ?? ''}
                onSave={handleSheetSave}
              />
              <p className="text-[10px] text-gray-400 italic">
                <Link2 size={9} className="inline mr-1" />
                Your Sheet's tab name should match a recognizable name. Column headers must include: <span className="font-mono">{activeMeta.expectedFields.slice(0, 6).join(', ')}…</span>
              </p>
            </section>

            {/* Option B: JSON paste */}
            <section className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileJson size={14} className="text-emerald-600" />
                <h4 className="text-sm font-bold text-gray-800">Option B — Paste JSON</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Paste an array of objects matching this shape. Saves to your browser and overrides the bundled data instantly.
              </p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={6}
                placeholder={`[\n  { "id": "c1", "name": "...", "platform": "discord", ... },\n  ...\n]`}
                className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
              <div className="flex items-center gap-2">
                <button
                  disabled={!pasteText.trim()}
                  onClick={() => handleImportJson(pasteText)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                    pasteText.trim() ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Import pasted JSON
                </button>
                <span className="text-gray-300">or</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Upload size={11} /> Upload .json file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </section>

            {/* Reset */}
            <section className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><RotateCcw size={12} /> Reset</h4>
                <p className="text-xs text-gray-500 mt-0.5">Discard custom data and revert to the bundled defaults.</p>
              </div>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-200"
              >
                Reset to defaults
              </button>
            </section>

            {/* Help */}
            <details className="border border-gray-100 rounded-xl">
              <summary className="px-4 py-2 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 rounded-xl">
                💡 How to set up a live Google Sheet (step-by-step)
              </summary>
              <div className="px-4 pb-4 pt-1 space-y-2 text-xs text-gray-600 leading-relaxed">
                <ol className="list-decimal list-inside space-y-1.5 ml-1">
                  <li>Create a new Google Sheet. Add a tab/sheet for each data type you want to manage.</li>
                  <li>In the first row, add column headers matching the field names listed above.</li>
                  <li>For comma-separated arrays (like <span className="font-mono">topics</span>), use <span className="font-mono">topic1, topic2, topic3</span> in a single cell.</li>
                  <li>Click <span className="font-mono">File → Share → Publish to web</span> → Publish.</li>
                  <li>Open <span className="font-mono">File → Share → Share with others</span> → "Anyone with the link, Viewer".</li>
                  <li>Copy the Sheet ID from the URL: <span className="font-mono break-all">docs.google.com/spreadsheets/d/<strong>SHEET_ID_HERE</strong>/edit</span></li>
                  <li>Paste it above with the tab name. Done. Edit your sheet anytime, click Refresh in the dashboard.</li>
                </ol>
                <p className="text-gray-500 italic mt-2">
                  <ExternalLink size={9} className="inline mr-1" />
                  No auth, no API keys, no backend — Google's gviz JSON endpoint serves your published data directly to the dashboard.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetForm({ initialId, initialSheet, onSave }: { initialId: string; initialSheet: string; onSave: (id: string, sheet: string) => void }) {
  const [id, setId] = useState(initialId);
  const [sheet, setSheet] = useState(initialSheet);

  // Auto-extract ID from a pasted full URL
  const handleIdChange = (val: string) => {
    const match = val.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    setId(match ? match[1] : val);
  };

  return (
    <div className="space-y-2">
      <input
        value={id}
        onChange={e => handleIdChange(e.target.value)}
        placeholder="Paste full Sheet URL or ID"
        className="w-full px-3 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        value={sheet}
        onChange={e => setSheet(e.target.value)}
        placeholder="Tab/sheet name (e.g. 'Communities')"
        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => onSave(id, sheet)}
        disabled={!id.trim()}
        className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
          id.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        <Link2 size={11} /> Save & connect Sheet
      </button>
    </div>
  );
}
