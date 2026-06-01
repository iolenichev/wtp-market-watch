/**
 * WTP Property Market Watchlist API bridge
 * Run: npm init -y && npm i express cors
 * Start: node wtp_market_api_server.js
 * Open: http://localhost:8787/api/market/areas
 *
 * Data source: Dubai Pulse / DLD open datasets.
 * You can override source URLs with env vars:
 * DLD_SALES_URL, DLD_RENTS_URL
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8787;
const SQM_TO_SQFT = 10.76391041671;
const WATCH_AREAS = [
  'Dubai Marina','Jumeirah Village Circle','Business Bay','Downtown Dubai','Palm Jumeirah','Arjan','Dubai Hills Estate','Dubai Creek Harbour','Sobha Hartland','Dubai Islands'
];

const SOURCE_CANDIDATES = {
  sales: [
    process.env.DLD_SALES_URL,
    'https://api.dubaipulse.gov.ae/open/dld/dld_transactions-open-api',
    'https://api.dubaipulse.gov.ae/open/dld/dld_transactions-open',
    'https://api.dubaipulse.gov.ae/open/dld/dld_transactions-open-api?limit=5000',
    'https://api.dubaipulse.gov.ae/open/dld/dld_transactions-open?limit=5000'
  ].filter(Boolean),
  rents: [
    process.env.DLD_RENTS_URL,
    'https://api.dubaipulse.gov.ae/open/dld/dld_rents-open-api',
    'https://api.dubaipulse.gov.ae/open/dld/dld_rents-open',
    'https://api.dubaipulse.gov.ae/open/dld/dld_rents-open-api?limit=5000'
  ].filter(Boolean)
};

const MOCK = [
{city:'Dubai',cat:'Top Growing',ticker:'DUBAI HILLS',name:'Dubai Hills Estate',type:'Apartments • Dubai',price:2480,change:5.2,yield:5.9,tx:812,avg:2450000,signal:'Strong Momentum'},
{city:'Dubai',cat:'Top Growing',ticker:'DUBAI ISLANDS',name:'Dubai Islands',type:'Waterfront • Dubai',price:1890,change:12.4,yield:6.3,tx:421,avg:2180000,signal:'Strong Momentum'},
{city:'Dubai',cat:'Top Growing',ticker:'CREEK',name:'Dubai Creek Harbour',type:'Apartments • Dubai',price:2140,change:8.6,yield:5.8,tx:598,avg:1980000,signal:'Strong Momentum'},
{city:'Dubai',cat:'Top Growing',ticker:'SOBHA',name:'Sobha Hartland',type:'Apartments • Dubai',price:2230,change:7.1,yield:5.7,tx:377,avg:2340000,signal:'Growing'},
{city:'Dubai',cat:'Top Growing',ticker:'SOBHA2',name:'Sobha Hartland II',type:'Apartments • Dubai',price:1980,change:9.4,yield:5.9,tx:214,avg:1820000,signal:'Strong Momentum'},
{city:'Dubai',cat:'Top Growing',ticker:'VALLEY',name:'The Valley',type:'Villas • Dubai',price:1320,change:8.1,yield:5.1,tx:286,avg:2900000,signal:'Growing'},
{city:'Dubai',cat:'Top Growing',ticker:'EMAAR SOUTH',name:'Emaar South',type:'Apartments • Dubai',price:1180,change:7.8,yield:6.8,tx:512,avg:1150000,signal:'Growing'},

{city:'Dubai',cat:'Yield',ticker:'JVC',name:'Jumeirah Village Circle',type:'Apartments • Dubai',price:1320,change:8.1,yield:7.8,tx:1401,avg:920000,signal:'High Yield'},
{city:'Dubai',cat:'Yield',ticker:'ARJAN',name:'Arjan',type:'Apartments • Dubai',price:1210,change:4.2,yield:7.4,tx:602,avg:860000,signal:'High Yield'},
{city:'Dubai',cat:'Yield',ticker:'DSO',name:'Dubai Silicon Oasis',type:'Apartments • Dubai',price:980,change:3.6,yield:7.2,tx:442,avg:740000,signal:'High Yield'},
{city:'Dubai',cat:'Yield',ticker:'INT CITY',name:'International City',type:'Apartments • Dubai',price:760,change:2.4,yield:8.0,tx:951,avg:510000,signal:'Cash Flow'},
{city:'Dubai',cat:'Yield',ticker:'DISCOVERY',name:'Discovery Gardens',type:'Apartments • Dubai',price:940,change:3.2,yield:7.1,tx:383,avg:690000,signal:'Cash Flow'},
{city:'Dubai',cat:'Yield',ticker:'MOTOR CITY',name:'Motor City',type:'Apartments • Dubai',price:1280,change:4.8,yield:6.9,tx:228,avg:1140000,signal:'High Yield'},
{city:'Dubai',cat:'Yield',ticker:'SPORTS CITY',name:'Dubai Sports City',type:'Apartments • Dubai',price:1030,change:3.7,yield:7.0,tx:517,avg:770000,signal:'Cash Flow'},

{city:'Dubai',cat:'Core Market',ticker:'MARINA',name:'Dubai Marina',type:'Apartments • Dubai',price:2150,change:2.3,yield:6.2,tx:1098,avg:2480000,signal:'Stable'},
{city:'Dubai',cat:'Core Market',ticker:'BUSINESS BAY',name:'Business Bay',type:'Apartments • Dubai',price:1980,change:4.7,yield:6.0,tx:1234,avg:1890000,signal:'Growing'},
{city:'Dubai',cat:'Core Market',ticker:'DOWNTOWN',name:'Downtown Dubai',type:'Premium • Dubai',price:3210,change:-1.1,yield:4.9,tx:582,avg:3900000,signal:'Cooling'},
{city:'Dubai',cat:'Core Market',ticker:'JLT',name:'Jumeirah Lake Towers',type:'Apartments • Dubai',price:1680,change:2.9,yield:6.4,tx:703,avg:1450000,signal:'Stable'},
{city:'Dubai',cat:'Core Market',ticker:'FURJAN',name:'Al Furjan',type:'Apartments • Dubai',price:1430,change:5.0,yield:6.7,tx:544,avg:1220000,signal:'Growing'},
{city:'Dubai',cat:'Core Market',ticker:'MBR',name:'Mohammed Bin Rashid City',type:'Apartments • Dubai',price:2360,change:5.4,yield:5.6,tx:341,avg:2650000,signal:'Growing'},

{city:'Dubai',cat:'Premium',ticker:'PALM',name:'Palm Jumeirah',type:'Premium • Dubai',price:4980,change:0.8,yield:4.7,tx:214,avg:12800000,signal:'Luxury'},
{city:'Dubai',cat:'Premium',ticker:'EMIRATES HILLS',name:'Emirates Hills',type:'Luxury Villas • Dubai',price:6200,change:1.4,yield:3.8,tx:41,avg:34000000,signal:'Luxury'},
{city:'Dubai',cat:'Premium',ticker:'JBI',name:'Jumeirah Bay Island',type:'Ultra Luxury • Dubai',price:8900,change:2.1,yield:3.2,tx:17,avg:52000000,signal:'Ultra Luxury'},
{city:'Dubai',cat:'Premium',ticker:'BLUEWATERS',name:'Bluewaters Island',type:'Premium • Dubai',price:4350,change:1.6,yield:4.5,tx:72,avg:6100000,signal:'Luxury'},
{city:'Dubai',cat:'Premium',ticker:'CITY WALK',name:'City Walk',type:'Premium • Dubai',price:3120,change:2.2,yield:5.1,tx:151,avg:4200000,signal:'Stable'},
{city:'Dubai',cat:'Premium',ticker:'DIFC',name:'DIFC',type:'Premium • Dubai',price:3560,change:1.8,yield:5.0,tx:122,avg:4800000,signal:'Stable'},

{city:'Abu Dhabi',cat:'Abu Dhabi',ticker:'YAS',name:'Yas Island',type:'Apartments • Abu Dhabi',price:1320,change:6.2,yield:6.5,tx:433,avg:1420000,signal:'Growing'},
{city:'Abu Dhabi',cat:'Abu Dhabi',ticker:'SAADIYAT',name:'Saadiyat Island',type:'Premium • Abu Dhabi',price:2210,change:7.3,yield:5.2,tx:204,avg:3900000,signal:'Strong Momentum'},
{city:'Abu Dhabi',cat:'Abu Dhabi',ticker:'REEM',name:'Al Reem Island',type:'Apartments • Abu Dhabi',price:1180,change:4.1,yield:7.1,tx:501,avg:1180000,signal:'High Yield'},
{city:'Abu Dhabi',cat:'Abu Dhabi',ticker:'RAHA',name:'Al Raha Beach',type:'Waterfront • Abu Dhabi',price:1410,change:3.8,yield:6.4,tx:212,avg:1650000,signal:'Stable'},
{city:'Abu Dhabi',cat:'Abu Dhabi',ticker:'MASDAR',name:'Masdar City',type:'Apartments • Abu Dhabi',price:980,change:5.6,yield:7.0,tx:287,avg:930000,signal:'Growing'},
{city:'Abu Dhabi',cat:'Abu Dhabi',ticker:'MARYAH',name:'Al Maryah Island',type:'Premium • Abu Dhabi',price:2440,change:4.9,yield:5.3,tx:83,avg:5200000,signal:'Premium'}
];

async function fetchJsonAny(urls) {
  let errors = [];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { 'accept': 'application/json' } });
      const text = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${text.slice(0,120)}`);
      try { return { url, json: JSON.parse(text) }; } catch { throw new Error(`Not JSON: ${text.slice(0,120)}`); }
    } catch (e) { errors.push(`${url}: ${e.message}`); }
  }
  throw new Error(errors.join('\n'));
}

function rowsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.result && Array.isArray(payload.result.records)) return payload.result.records;
  if (payload.records && Array.isArray(payload.records)) return payload.records;
  return [];
}
function get(row, names) {
  const keys = Object.keys(row);
  for (const n of names) {
    const k = keys.find(x => x.toLowerCase() === n.toLowerCase());
    if (k != null) return row[k];
  }
  return undefined;
}
function num(v) { if (v == null) return 0; return Number(String(v).replace(/,/g,'')) || 0; }
function monthKey(d) { const dt = new Date(d); if (isNaN(dt)) return null; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }

function normalizeSales(rows) {
  return rows.map(r => {
    const area = get(r, ['area_name_en','area_en','area','Area','master_project_en']);
    const date = get(r, ['instance_date','transaction_date','procedure_date','Transaction Date','reg_date']);
    const amount = num(get(r, ['actual_worth','amount','Amount','transaction_amount','sales_value']));
    const sqm = num(get(r, ['procedure_area','property_size_sqm','property_size','Transaction Size (sq.m)','Property Size (sq.m)']));
    const propertyType = String(get(r, ['property_type_en','property_type','Property Type']) || '').toLowerCase();
    const subType = String(get(r, ['property_sub_type_en','property_sub_type','Property Sub Type']) || '').toLowerCase();
    return { area, date, amount, sqft: sqm * SQM_TO_SQFT, propertyType, subType };
  }).filter(x => x.area && x.date && x.amount > 0 && x.sqft > 100 && (x.propertyType.includes('unit') || x.subType.includes('flat') || x.subType.includes('apartment')));
}

function aggregateAreas(sales) {
  const byArea = new Map();
  for (const area of WATCH_AREAS) byArea.set(area, []);
  for (const s of sales) {
    const match = WATCH_AREAS.find(a => String(s.area).toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(String(s.area).toLowerCase()));
    if (match) byArea.get(match).push(s);
  }
  return [...byArea.entries()].map(([name, rows]) => {
    const byMonth = new Map();
    for (const r of rows) {
      const m = monthKey(r.date); if (!m) continue;
      if (!byMonth.has(m)) byMonth.set(m, {amount:0, sqft:0, tx:0});
      const b = byMonth.get(m); b.amount += r.amount; b.sqft += r.sqft; b.tx += 1;
    }
    const months = [...byMonth.keys()].sort().slice(-8);
    const trend = months.map(m => Math.round(byMonth.get(m).amount / byMonth.get(m).sqft));
    const price = trend.at(-1) || 0;
    const prev = trend.length > 1 ? trend[0] : price;
    const change = prev ? ((price - prev) / prev) * 100 : 0;
    const totalAmount = rows.reduce((s,r)=>s+r.amount,0);
    return {
      city:'Dubai', cat: change > 4 ? 'Top Growing' : price > 3000 ? 'Premium' : 'Dubai',
      ticker:name.toUpperCase().replace('JUMEIRAH VILLAGE CIRCLE','JVC').replace('DOWNTOWN DUBAI','DOWNTOWN'),
      name, type:'Apartments · Dubai', price: Math.round(price), change: Number(change.toFixed(1)),
      yield: null, tx: rows.length, avg: rows.length ? Math.round(totalAmount / rows.length) : 0,
      signal: change > 4 ? 'Strong momentum' : change < 0 ? 'Price pressure' : 'Stable', trend
    };
  }).filter(a => a.price > 0);
}

app.get('/health', (req, res) => res.json({ ok: true, service: 'wtp-market-watchlist' }));

app.get('/api/market/areas', async (req, res) => {
  try {
    const { url, json } = await fetchJsonAny(SOURCE_CANDIDATES.sales);
    const rows = normalizeSales(rowsFromPayload(json));
    const areas = aggregateAreas(rows);
    if (!areas.length) throw new Error('No usable rows after normalization. Check endpoint fields / pagination.');
    res.json({ source:'DLD / Dubai Pulse', source_url:url, updated_at:new Date().toISOString(), areas });
  } catch (e) {
    res.json({ source:'mock-fallback', warning:e.message, updated_at:new Date().toISOString(), areas:MOCK });
  }
});

app.listen(PORT, () => console.log(`WTP market API bridge: http://localhost:${PORT}/api/market/areas`));
