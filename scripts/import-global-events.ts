#!/usr/bin/env bun
/**
 * Imports the Physical AI global events planning workbook into typed source seeds
 * used by the Global View tab.
 *
 * Usage:
 *   bun run import:global-events -- /path/to/Global\ Events.xlsx
 */

import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, resolve } from 'path';
import XLSX from 'xlsx';
import type { GlobalSourceSeed } from '../src/data/globalSourceRegistry';
import type { Region } from '../src/types/community';

const DEFAULT_INPUT = 'data-imports/Global Events.xlsx';
const OUTPUT_FILE = 'src/data/importedGlobalEvents.ts';
const SOURCE_YEAR = '2026';

interface ImportedEventSeed extends GlobalSourceSeed {
  eventDate?: string;
  location?: string;
  focusArea?: string;
  eventTier?: string;
  activationTier?: string;
  sourceFile?: string;
  sourceSheet?: string;
  sourceRow?: number;
}

interface RawEventRow {
  sheetName: string;
  rowNumber: number;
  event: string;
  date: string;
  location: string;
  website: string;
  focusArea: string;
  eventTier: string;
  activationTier: string;
}

const inputPath = resolve(process.argv[2] ?? DEFAULT_INPUT);
const outputPath = resolve(OUTPUT_FILE);
let skippedWithoutPublicUrl = 0;
let skippedMalformedRows = 0;
let skippedDuplicateRows = 0;

function normalizeHeader(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeText(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeEventDate(value: unknown): string {
  const text = normalizeText(value);
  if (!text || /\b20\d{2}\b/.test(text)) return text;
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i.test(text)) {
    return `${text}, ${SOURCE_YEAR}`;
  }
  return text;
}

function cleanEventName(name: string): string {
  return name.replace(/\s*\|\s*POR\s*/gi, '').replace(/\s+-\s*$/g, '').trim();
}

function isPublicUrl(value: string): boolean {
  return /^https?:\/\/[^ "]+$/i.test(value.trim());
}

function cleanUrl(value: string): string {
  const url = new URL(value.trim());
  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'gclsrc',
    'gbraid',
    'gad_source',
    'gad_campaignid',
  ];
  trackingParams.forEach(param => url.searchParams.delete(param));
  url.hash = '';
  return url.toString();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}

function classifyRegion(location: string, sheetName: string): Region {
  const text = `${location} ${sheetName}`.toLowerCase();
  if (/(taipei|taiwan|macao|china|sydney|australia|japan|korea|singapore|india|apac)/.test(text)) return 'apac';
  if (/(uk|london|vienna|austria|germany|munich|nuremberg|hannover|stuttgart|spain|barcelona|portugal|lisbon|france|paris|switzerland|zurich|davos|denmark|odense|netherlands|amsterdam|sweden|malmo|norway|uae|dubai|abu dhabi|saudi|armenia|emea|milan|italy|leeds|birmingham)/.test(text)) return 'emea';
  if (/(brazil|rio|canada|mexico|atlanta|san francisco|las vegas|denver|chicago|orlando|detroit|boston|west palm|pittsburgh|anaheim|santa clara|austin|plano|cupertino|los angeles|usa|us|ca|ga|nv|co|il|fl|mi|ma|pa|tx)/.test(text)) return 'americas';
  return sheetName.toLowerCase().includes('emea') ? 'emea' : 'americas';
}

function addAll(target: Set<string>, values: string[]) {
  values.forEach(value => target.add(value));
}

function inferTags(row: RawEventRow): Pick<GlobalSourceSeed, 'products' | 'topics'> {
  const text = `${row.event} ${row.focusArea} ${row.location} ${row.eventTier} ${row.activationTier}`.toLowerCase();
  const products = new Set<string>();
  const topics = new Set<string>();

  if (/(robot|humanoid|icra|iros|corl|rss|automate|robobusiness|xponential|dexterity|physical ai|embodied)/.test(text)) {
    addAll(products, ['GR00T', 'Isaac Sim', 'Isaac Lab', 'Isaac ROS', 'NVIDIA Jetson', 'Newton']);
    addAll(topics, ['Robotics', 'Physical AI', 'embodied AI']);
  }

  if (/(edge\/cv|vision|cvpr|eccv|smart spaces|security|city|intertraffic|retail|passenger terminal|gitex|mwc)/.test(text)) {
    addAll(products, ['Metropolis', 'NVIDIA Jetson']);
    addAll(topics, ['Intelligent Vision AI', 'edge AI', 'smart spaces']);
  }

  if (/(industrial|manufacturing|factory|metaverse|hannover|logimat|sps|autodesk|siggraph|supply chain|aveva|openusd)/.test(text)) {
    addAll(products, ['NVIDIA Omniverse', 'OpenUSD', 'Isaac Sim']);
    addAll(topics, ['Industrial Digital Twins', 'simulation', 'CAE']);
  }

  if (/(automotive|mobility|transportation|traffic|bosch|iaa|vehicle|av\b)/.test(text)) {
    addAll(products, ['DriveOS', 'Alpamayo', 'Halos', 'NVIDIA Omniverse']);
    addAll(topics, ['AV', 'autonomous driving', 'software-defined vehicles']);
  }

  if (/(cloud|ai conference|humanx|neurips|iclr|ai ascent|computex|gtc|dgx|build|reinvent|hpe discover|google cloud|sap sapphire)/.test(text)) {
    addAll(products, ['Cosmos', 'DGX Spark']);
    addAll(topics, ['Physical AI', 'AI infrastructure']);
  }

  if (products.size === 0) {
    addAll(topics, ['Physical AI']);
  }

  return {
    products: [...products].sort((a, b) => a.localeCompare(b)),
    topics: [...topics].sort((a, b) => a.localeCompare(b)),
  };
}

function buildDescription(row: RawEventRow): string {
  const pieces = [
    row.date ? `${row.date}` : '',
    row.location ? row.location : '',
    row.focusArea ? `${row.focusArea} focus` : '',
    row.eventTier ? row.eventTier : '',
    row.activationTier ? `Activation: ${row.activationTier}` : '',
  ].filter(Boolean);
  return `Imported from the Global Events workbook${pieces.length ? `: ${pieces.join(' · ')}` : ''}.`;
}

function readEvents(): RawEventRow[] {
  const workbook = XLSX.readFile(inputPath, { cellDates: true });
  const rows: RawEventRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
    if (matrix.length < 3) continue;

    const headers = matrix[1].map(normalizeHeader);
    const eventIndex = headers.indexOf('Event');
    const websiteIndex = headers.indexOf('Website');
    const locationIndex = headers.indexOf('Location');
    const dateIndex = headers.findIndex(header => header === 'Date' || header === 'Dates');
    const groupIndex = headers.findIndex(header => header === 'Group' || header === 'MKTG Focus Industry');
    const eventTierIndex = headers.findIndex(header => header === 'Event Tier' || header === 'MKTG Event Tier EMEA (PhysAI)');
    const activationIndex = headers.findIndex(header => header === 'Activate PSG' || header === 'MKTG Activate PSG');

    if (eventIndex === -1 || websiteIndex === -1) continue;

    matrix.slice(2).forEach((row, offset) => {
      const event = cleanEventName(normalizeText(row[eventIndex]));
      const website = normalizeText(row[websiteIndex]);
      if (!event) return;
      if (event.startsWith('http')) {
        skippedMalformedRows += 1;
        return;
      }
      if (!isPublicUrl(website)) {
        skippedWithoutPublicUrl += 1;
        return;
      }

      rows.push({
        sheetName,
        rowNumber: offset + 3,
        event,
        date: dateIndex >= 0 ? normalizeEventDate(row[dateIndex]) : '',
        location: locationIndex >= 0 ? normalizeText(row[locationIndex]) : '',
        website: cleanUrl(website),
        focusArea: groupIndex >= 0 ? normalizeText(row[groupIndex]) : '',
        eventTier: eventTierIndex >= 0 ? normalizeText(row[eventTierIndex]) : '',
        activationTier: activationIndex >= 0 ? normalizeText(row[activationIndex]) : '',
      });
    });
  }

  return rows;
}

function toSeeds(rows: RawEventRow[]): ImportedEventSeed[] {
  const seen = new Set<string>();
  const seeds: ImportedEventSeed[] = [];

  rows.forEach(row => {
    const key = `${row.website.toLowerCase()}|${row.event.toLowerCase()}|${row.location.toLowerCase()}`;
    if (seen.has(key)) {
      skippedDuplicateRows += 1;
      return;
    }
    seen.add(key);

    const tagSet = inferTags(row);
    const locationSlug = row.location ? `-${slugify(row.location).slice(0, 28)}` : '';
    const id = `imported-event-${slugify(row.event)}${locationSlug}-${SOURCE_YEAR}`;

    seeds.push({
      id,
      name: row.event,
      type: 'event',
      region: classifyRegion(row.location, row.sheetName),
      url: row.website,
      products: tagSet.products,
      topics: tagSet.topics,
      description: buildDescription(row),
      eventDate: row.date,
      location: row.location,
      focusArea: row.focusArea,
      eventTier: row.eventTier,
      activationTier: row.activationTier,
      sourceFile: basename(inputPath),
      sourceSheet: row.sheetName,
      sourceRow: row.rowNumber,
    });
  });

  return seeds.sort((a, b) =>
    a.region.localeCompare(b.region) ||
    (a.eventDate ?? '').localeCompare(b.eventDate ?? '') ||
    a.name.localeCompare(b.name));
}

function serialize(seeds: ImportedEventSeed[]): string {
  return `import type { GlobalSourceSeed } from './globalSourceRegistry';

// Generated by scripts/import-global-events.ts from the Global Events workbook.
// Rows without public http(s) URLs are intentionally excluded until they have source pages.
export const IMPORTED_GLOBAL_EVENT_SEEDS: GlobalSourceSeed[] = ${JSON.stringify(seeds, null, 2)};
`;
}

const seeds = toSeeds(readEvents());
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialize(seeds));

console.log(`Imported ${seeds.length} Global View event sources from ${inputPath}`);
console.log(`Skipped ${skippedWithoutPublicUrl} rows without public URLs, ${skippedMalformedRows} malformed rows, and ${skippedDuplicateRows} duplicates.`);
