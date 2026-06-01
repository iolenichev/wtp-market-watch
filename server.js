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
 {city:'Dubai',cat:'Top Growing',ticker:'DUBAI HILLS',name:'Dubai Hills Estate',type:'Apartments · Dubai',price:2480,change:5.2,yield:5.9,tx:812,avg:2450000,signal:'Strong momentum',trend:[2210,2240,2260,2310,2350,2380,2415,2480]},
 {city:'Dubai',cat:'Top Growing',ticker:'JVC',name:'Jumeirah Village Circle',type:'Apartments · Dubai',price:1320,change:8.1,yield:7.8,tx:1430,avg:1040000,signal:'Yield leader',trend:[1120,1150,1180,1190,1235,1270,1290,1320]},
 {city:'Dubai',cat:'Top Growing',ticker:'BUSINESS BAY',name:'Business Bay',type:'Apartments · Dubai',price:1980,change:4.7,yield:6.5,tx:980,avg:1850000,signal:'Liquid central market',trend:[1840,1870,1885,1900,1925,1950,1970,1980]},
 {city:'Dubai',cat:'Premium',ticker:'DOWNTOWN',name:'Downtown Dubai',type:'Premium · Dubai',price:3210,change:-1.1,yield:4.8,tx:410,avg:4100000,signal:'Premium, slower growth',trend:[3300,3280,3270,3250,3240,3225,3215,3210]},
 {city:'Dubai',cat:'Premium',ticker:'PALM',name:'Palm Jumeirah',type:'Premium · Dubai',price:4980,change:.8,yield:4.5,tx:225,avg:7500000,signal:'Trophy asset',trend:[4890,4910,4940,4930,4950,4970,4960,4980]},
 {city:'Dubai',cat:'Yield',ticker:'ARJAN',name:'Arjan',type:'Apartments · Dubai',price:1210,change:4.2,yield:7.4,tx:640,avg:930000,signal:'Value + yield',trend:[1120,1140,1160,1170,1185,1195,1200,1210]}
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
