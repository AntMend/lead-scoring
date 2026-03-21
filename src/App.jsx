import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, RadialBarChart, RadialBar, Area, AreaChart,
  Legend,
} from "recharts";

const T = {
  bg: "#06080e", surface: "#0a0f18", card: "#0f1520",
  cardAlt: "#141c2b", border: "#1a2335", borderLight: "#253048",
  text: "#9ca8c0", muted: "#4e5a72", bright: "#e8ecf4",
  white: "#fff", accent: "#6366f1", accentDim: "rgba(99,102,241,0.12)",
  accentMid: "rgba(99,102,241,0.3)", green: "#22c55e",
  greenDim: "rgba(34,197,94,0.10)", blue: "#3b82f6",
  blueDim: "rgba(59,130,246,0.10)", amber: "#eab308",
  amberDim: "rgba(234,179,8,0.10)", red: "#ef4444",
  redDim: "rgba(239,68,68,0.10)", purple: "#a855f7",
  cyan: "#06b6d4", orange: "#f97316", pink: "#ec4899",
  r: 12, rSm: 8, rXs: 6,
};

const FONTS = "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');";
const fmt = (n) => n >= 1e6 ? "$"+(n/1e6).toFixed(1)+"M" : n >= 1e3 ? "$"+(n/1e3).toFixed(0)+"K" : "$"+n;
const pct = (n) => Math.round(n)+"%";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const uid = () => Math.random().toString(36).slice(2, 8);
const seedRand = (s) => { let h = s; return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };

const INDUSTRIES = ["Technology","Healthcare","Financial Services","Manufacturing","Retail","Education","Media","Real Estate"];
const REGIONS = ["North America","EMEA","LATAM","APAC"];
const SIZES = ["1-50","51-200","201-500","501-1000","1001-5000","5000+"];
const SOURCES = ["Organic Search","Paid Ads","Referral","Webinar","Content Download","Demo Request","Cold Outbound","Partner"];
const TITLES = ["CEO","CTO","VP Sales","VP Marketing","Director Ops","Manager","Analyst","Founder","Head of Growth","CFO"];
const COMPANIES = ["Nexus AI","CloudPeak","DataForge","Meridian Health","FinEdge","RetailWave","EduPath","MediaPulse","GreenBuild","SwiftLogistics","TechNova","HealthFirst","BankCore","ManuPro","ShopStream","LearnHub","ContentLab","PropTech Co","InnoVentures","ScaleUp Inc","ByteBridge","MedSync","WealthPath","FactoryOS","MarketEdge","CampusLink","StreamForge","HomeBase AI","Quantum Ops","PulseMetrics"];
const FIRST_NAMES = ["Sarah","James","Maria","David","Emma","Carlos","Priya","Michael","Aisha","Thomas","Yuki","Robert","Fatima","Alex","Nina","Jorge","Wei","Rachel","Omar","Lisa","Kenji","Andrea","Daniel","Ingrid","Marcus"];
const LAST_NAMES = ["Chen","Williams","Rodriguez","Kim","Singh","Mueller","Okafor","Johnson","Al-Hassan","Tanaka","Smith","Garcia","Lee","Brown","Patel","Anderson","Nguyen","Lopez","Wright","Nakamura"];

const DEFAULT_REPS = [
  { id:"r1", name:"Sarah Chen", team:"Enterprise", spec:"Technology", region:"North America", capacity:30, avatar:"SC" },
  { id:"r2", name:"James Wright", team:"Enterprise", spec:"Financial Services", region:"North America", capacity:30, avatar:"JW" },
  { id:"r3", name:"Maria Lopez", team:"Mid-Market", spec:"Healthcare", region:"LATAM", capacity:40, avatar:"ML" },
  { id:"r4", name:"Marcus Johnson", team:"Mid-Market", spec:"General", region:"North America", capacity:40, avatar:"MJ" },
  { id:"r5", name:"Priya Patel", team:"SMB", spec:"General", region:"APAC", capacity:50, avatar:"PP" },
  { id:"r6", name:"David Mueller", team:"Enterprise", spec:"Manufacturing", region:"EMEA", capacity:30, avatar:"DM" },
];

function generateLeads(rng) {
  const leads = [];
  for (let i = 0; i < 400; i++) {
    const industry = INDUSTRIES[Math.floor(rng() * INDUSTRIES.length)];
    const region = REGIONS[Math.floor(rng() * REGIONS.length)];
    const size = SIZES[Math.floor(rng() * SIZES.length)];
    const sizeIdx = SIZES.indexOf(size);
    const source = SOURCES[Math.floor(rng() * SOURCES.length)];
    const title = TITLES[Math.floor(rng() * TITLES.length)];
    const company = COMPANIES[Math.floor(rng() * COMPANIES.length)];
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const pricingViews = Math.floor(rng() * 8);
    const contentDownloads = Math.floor(rng() * 6);
    const webSessions = Math.floor(rng() * 20) + 1;
    const demoRequested = rng() > 0.75;
    const emailOpens = Math.floor(rng() * 15);
    const daysSinceActive = Math.floor(rng() * 60);
    let convProb = 0.08;
    if (demoRequested) convProb += 0.25;
    if (pricingViews >= 3) convProb += 0.15;
    if (sizeIdx >= 3) convProb += 0.10;
    if (["CEO","CTO","VP Sales","VP Marketing","Founder"].includes(title)) convProb += 0.08;
    if (source === "Demo Request" || source === "Referral") convProb += 0.12;
    if (daysSinceActive > 30) convProb -= 0.15;
    if (industry === "Healthcare") convProb -= 0.12;
    if (region === "LATAM" && industry !== "Healthcare") convProb += 0.05;
    convProb = clamp(convProb, 0.02, 0.85);
    const converted = rng() < convProb;
    const status = converted ? "converted" : (daysSinceActive > 30 ? "lost" : "pending");
    const hoursSinceAssigned = Math.floor(rng() * 96);
    const contacted = hoursSinceAssigned < 24 ? rng() > 0.2 : rng() > 0.5;
    leads.push({ id:"lead-"+i.toString().padStart(3,"0"), name:first+" "+last, company, industry, region, size, sizeIdx, source, title, pricingViews, contentDownloads, webSessions, demoRequested, emailOpens, daysSinceActive, converted, status, hoursSinceAssigned, contacted, dealValue: Math.floor((sizeIdx+1)*(8000+rng()*40000)), email:first.toLowerCase()+"."+last.toLowerCase()+"@"+company.toLowerCase().replace(/\s+/g,"")+".com", createdDaysAgo: Math.floor(rng()*90)+1 });
  }
  for (let i = 0; i < 3; i++) { const idx = 370+i; if (idx < leads.length) { leads[idx].demoRequested = true; leads[idx].pricingViews = 5; leads[idx].webSessions = 15; leads[idx].hoursSinceAssigned = 52+i*8; leads[idx].contacted = false; leads[idx].daysSinceActive = 1; leads[idx].title = ["CTO","VP Sales","CEO"][i]; leads[idx].sizeIdx = 4; leads[idx].size = "1001-5000"; leads[idx]._hotUncontacted = true; } }
  return leads;
}

const mkModel = () => ({
  firmographic: { weight: 35, criteria: [
    { id:uid(), label:"Company 500+ employees", field:"sizeIdx", op:"gte", value:3, points:18, active:true },
    { id:uid(), label:"Company 1000+ employees", field:"sizeIdx", op:"gte", value:4, points:10, active:true },
    { id:uid(), label:"Industry: Technology", field:"industry", op:"eq", value:"Technology", points:12, active:true },
    { id:uid(), label:"Industry: Financial Services", field:"industry", op:"eq", value:"Financial Services", points:10, active:true },
    { id:uid(), label:"Industry: Healthcare", field:"industry", op:"eq", value:"Healthcare", points:14, active:true },
    { id:uid(), label:"C-Level / VP title", field:"title", op:"in", value:["CEO","CTO","CFO","VP Sales","VP Marketing","Founder"], points:15, active:true },
    { id:uid(), label:"Region: North America", field:"region", op:"eq", value:"North America", points:5, active:true },
  ]},
  behavioral: { weight: 40, criteria: [
    { id:uid(), label:"Demo requested", field:"demoRequested", op:"eq", value:true, points:25, active:true },
    { id:uid(), label:"3+ pricing page views", field:"pricingViews", op:"gte", value:3, points:18, active:true },
    { id:uid(), label:"5+ content downloads", field:"contentDownloads", op:"gte", value:5, points:12, active:true },
    { id:uid(), label:"Source: Referral", field:"source", op:"eq", value:"Referral", points:15, active:true },
    { id:uid(), label:"Source: Demo Request", field:"source", op:"eq", value:"Demo Request", points:12, active:true },
  ]},
  engagement: { weight: 25, criteria: [
    { id:uid(), label:"10+ web sessions", field:"webSessions", op:"gte", value:10, points:15, active:true },
    { id:uid(), label:"Active in last 7 days", field:"daysSinceActive", op:"lte", value:7, points:20, active:true },
    { id:uid(), label:"5+ email opens", field:"emailOpens", op:"gte", value:5, points:12, active:true },
    { id:uid(), label:"Inactive >30 days", field:"daysSinceActive", op:"gte", value:30, points:-15, active:true },
  ]},
});

const mkRules = () => [
  { id:uid(), name:"Hot Tech → Sarah Chen", conditions:[{field:"score",op:"gte",value:70},{field:"industry",op:"eq",value:"Technology"}], assignTo:"r1", priority:1, active:true },
  { id:uid(), name:"Hot Finance → James Wright", conditions:[{field:"score",op:"gte",value:70},{field:"industry",op:"eq",value:"Financial Services"}], assignTo:"r2", priority:2, active:true },
  { id:uid(), name:"All Healthcare → Maria Lopez", conditions:[{field:"industry",op:"eq",value:"Healthcare"}], assignTo:"r3", priority:3, active:true },
  { id:uid(), name:"EMEA → David Mueller", conditions:[{field:"region",op:"eq",value:"EMEA"}], assignTo:"r6", priority:4, active:true },
  { id:uid(), name:"APAC → Priya Patel", conditions:[{field:"region",op:"eq",value:"APAC"}], assignTo:"r5", priority:5, active:true },
  { id:uid(), name:"Hot leads → Sarah Chen", conditions:[{field:"score",op:"gte",value:75}], assignTo:"r1", priority:6, active:true },
  { id:uid(), name:"Warm leads → Round Robin Enterprise", conditions:[{field:"score",op:"gte",value:50}], assignTo:"round-robin:Enterprise", priority:7, active:true },
  { id:uid(), name:"Default → Marcus Johnson", conditions:[], assignTo:"r4", priority:99, active:true },
];

function scoreLead(lead, model) {
  const breakdown = { firmographic:[], behavioral:[], engagement:[] };
  const catScores = {};
  for (const cat of ["firmographic","behavioral","engagement"]) {
    const cfg = model[cat]; let earned = 0;
    const posPts = [];
    for (const c of cfg.criteria) { if (!c.active) continue; if (c.points > 0) posPts.push(c.points);
      let match = false; const val = lead[c.field];
      if (c.op === "eq") match = val === c.value;
      else if (c.op === "gte") match = val >= c.value;
      else if (c.op === "lte") match = val <= c.value;
      else if (c.op === "in") match = Array.isArray(c.value) && c.value.includes(val);
      if (match) { earned += c.points; breakdown[cat].push({label:c.label, points:c.points}); }
    }
    const cap = posPts.sort((a,b)=>b-a).slice(0,3).reduce((s,v)=>s+v,0);
    catScores[cat] = { raw:earned, cap, normalized: cap > 0 ? clamp((earned/cap)*100,0,100) : 0, weight:cfg.weight };
  }
  const tw = catScores.firmographic.weight + catScores.behavioral.weight + catScores.engagement.weight;
  let fs = 0; for (const c of Object.keys(catScores)) fs += (catScores[c].normalized * catScores[c].weight) / Math.max(tw, 1);
  return { score: clamp(Math.round(fs), 0, 100), catScores, breakdown };
}

function routeLead(lead, score, rules, repLoads, reps) {
  const sorted = [...rules].filter(r => r.active).sort((a,b) => a.priority - b.priority);
  for (const rule of sorted) {
    let match = true;
    for (const cond of rule.conditions) { const val = cond.field === "score" ? score : lead[cond.field];
      if (cond.op === "eq" && val !== cond.value) match = false;
      if (cond.op === "gte" && val < cond.value) match = false;
      if (cond.op === "lte" && val > cond.value) match = false;
    }
    if (match) { let repId = rule.assignTo;
      if (repId.startsWith("round-robin:")) { const team = repId.split(":")[1]; const tr = reps.filter(r => r.team === team); let ml = Infinity, pk = tr[0]?.id; for (const r of tr) { const ld = repLoads[r.id]||0; if (ld < ml) { ml = ld; pk = r.id; } } repId = pk; }
      const rep = reps.find(r => r.id === repId);
      if (rep) return { repId, ruleName: rule.name, ruleId: rule.id };
    }
  }
  let mi = reps[0]?.id, ml = Infinity; for (const r of reps) { if ((repLoads[r.id]||0) < ml) { ml = repLoads[r.id]||0; mi = r.id; } }
  return { repId: mi, ruleName: "Overflow", ruleId: null };
}

function processLeads(leads, model, rules, reps) {
  const rl = {}; reps.forEach(r => { rl[r.id] = 0; });
  return leads.map(lead => { const { score, catScores, breakdown } = scoreLead(lead, model); const routing = routeLead(lead, score, rules, rl, reps); rl[routing.repId] = (rl[routing.repId]||0) + 1; return { ...lead, score, catScores, breakdown, routing }; });
}

const getTier = (s) => s >= 80 ? {label:"Hot",color:T.red,bg:T.redDim} : s >= 60 ? {label:"Warm",color:T.amber,bg:T.amberDim} : s >= 40 ? {label:"Cool",color:T.blue,bg:T.blueDim} : {label:"Cold",color:T.muted,bg:"rgba(78,90,114,0.15)"};

const S = {
  card: { background:T.card, border:"1px solid "+T.border, borderRadius:T.r, padding:20, marginBottom:14 },
  stat: { background:T.card, border:"1px solid "+T.border, borderRadius:T.r, padding:"16px 18px" },
  statVal: (c) => ({ fontSize:28, fontWeight:800, color:c||T.bright, letterSpacing:"-0.03em", fontFamily:"'JetBrains Mono',monospace" }),
  statLabel: { fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:4 },
  badge: (c, bg) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, color:c, background:bg, gap:4 }),
  btn: (p) => ({ padding:"8px 16px", borderRadius:T.rXs, border:p?"none":"1px solid "+T.border, background:p?T.accent:"transparent", color:p?T.white:T.text, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.2s", fontFamily:"'Plus Jakarta Sans',sans-serif" }),
  btnSm: (p) => ({ padding:"4px 10px", borderRadius:T.rXs, border:p?"none":"1px solid "+T.border, background:p?T.accent:"transparent", color:p?T.white:T.text, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }),
  table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th: { textAlign:"left", padding:"10px 12px", borderBottom:"1px solid "+T.border, color:T.muted, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" },
  td: { padding:"10px 12px", borderBottom:"1px solid "+T.border, color:T.text },
  tab: (a) => ({ padding:"9px 18px", borderRadius:T.rXs, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", background:a?T.accent:"transparent", color:a?T.white:T.muted, transition:"all 0.2s", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif" }),
};

const ScoreBar = ({ score, size="md" }) => { const tier = getTier(score); const h = size==="sm"?6:8; return (
  <div style={{display:"flex",alignItems:"center",gap:8,minWidth:size==="sm"?80:120}}>
    <div style={{flex:1,height:h,borderRadius:h,background:T.surface,overflow:"hidden"}}><div style={{width:score+"%",height:"100%",borderRadius:h,background:"linear-gradient(90deg,"+tier.color+","+tier.color+"cc)",transition:"width 0.5s ease"}} /></div>
    <span style={{fontSize:size==="sm"?11:13,fontWeight:700,color:tier.color,fontFamily:"'JetBrains Mono',monospace",minWidth:28}}>{score}</span>
  </div>); };
const RepAvatar = ({rep, size=28}) => (<div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,"+T.accent+","+T.purple+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:700,color:T.white,flexShrink:0}}>{rep.avatar}</div>);
const Pill = ({children, color=T.accent, bg=T.accentDim}) => (<span style={S.badge(color,bg)}>{children}</span>);
const CatBreakdown = ({catScores}) => (<div style={{display:"flex",gap:6}}>{["firmographic","behavioral","engagement"].map((k,i) => { const c = catScores[k]; const cols = [T.blue,T.green,T.amber]; return (<div key={k} style={{flex:c.weight,height:6,borderRadius:3,background:cols[i]+"30",overflow:"hidden"}} title={k+": "+Math.round(c.normalized)+"/100"}><div style={{width:c.normalized+"%",height:"100%",background:cols[i],borderRadius:3,transition:"width 0.4s"}} /></div>); })}</div>);

const Onboarding = ({onClose}) => { const [step,setStep] = useState(0);
  const steps = [
    {title:"Welcome to LeadScore Engine",icon:"\uD83C\uDFAF",body:"Every day, your sales team gets hundreds of leads. Some are ready to buy, most are not. This tool does two things: it scores each lead from 0 to 100 based on rules you set, then automatically assigns it to the right sales rep. The result? Your best reps work the best leads, nobody gets overloaded, and nothing falls through the cracks."},
    {title:"Step 1: Build Your Scoring Model",icon:"\u25C6",body:"Go to the Scoring Builder tab. You will see three categories of criteria. Firmographic scores WHO the lead is (big company? C-level title? tech industry?). Behavioral scores WHAT they did (requested a demo? viewed pricing?). Engagement scores HOW active they are (visited recently? opened emails?). Each criterion adds or subtracts points. Adjust the category weights to control which type of signal matters most. They always add up to 100%."},
    {title:"Step 2: Set Your Routing Rules",icon:"\u2192",body:"Go to the Routing Rules tab. Rules work like a checklist, top to bottom. The system checks each lead against rule #1 first. If it matches, the lead goes to that rep. If not, it tries rule #2, and so on. You can route by score (hot leads to senior reps), by industry (healthcare to specialists), by region, or round-robin across a team. Edit any rule's conditions and assignment, add new ones, remove old ones, reorder priorities."},
    {title:"Step 3: Watch It Work",icon:"\u25B6",body:"Go to the Simulation tab. Hit Play to watch 400 demo leads get scored and routed one by one in real time. You will see exactly why each lead got its score and which rule assigned it. Switch to Table View to see all leads at once, filter by tier (Hot/Warm/Cool/Cold), sort by any column, and click any row for the full breakdown."},
    {title:"Step 4: Measure and Optimize",icon:"\u26A1",body:"Analytics shows if your model actually works: do high-score leads convert more? Are any reps overloaded? Is any industry getting scores it does not deserve? The system flags problems automatically. Use A/B Testing to compare two different scoring setups side by side. Present mode gives you a clean view for meetings. Export any config as JSON."},
  ];
  const s = steps[step];
  return (<div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)"}}>
    <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:16,padding:32,maxWidth:520,width:"90%"}}>
      <div style={{fontSize:40,marginBottom:12}}>{s.icon}</div>
      <div style={{fontSize:20,fontWeight:800,color:T.bright,marginBottom:8}}>{s.title}</div>
      <div style={{fontSize:14,color:T.text,lineHeight:1.7,marginBottom:24}}>{s.body}</div>
      <div style={{display:"flex",gap:6,marginBottom:20,justifyContent:"center"}}>{steps.map((_,i) => (<div key={i} style={{width:i===step?24:8,height:8,borderRadius:4,background:i===step?T.accent:T.border,transition:"all 0.3s",cursor:"pointer"}} onClick={() => setStep(i)} />))}</div>
      <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
        <button style={{...S.btn(false),opacity:step===0?0.3:1}} onClick={() => step>0 && setStep(step-1)}>{"\u2190"} Back</button>
        {step < steps.length-1 ? <button style={S.btn(true)} onClick={() => setStep(step+1)}>Next {"\u2192"}</button> : <button style={{...S.btn(true),background:T.green}} onClick={onClose}>Get Started {"\u2713"}</button>}
      </div>
      <div style={{textAlign:"center",marginTop:12}}><button style={{border:"none",background:"none",color:T.muted,fontSize:12,cursor:"pointer"}} onClick={onClose}>Skip tutorial</button></div>
    </div>
  </div>);
};

const ScoringBuilder = ({model, setModel}) => {
  const CATS = [{key:"firmographic",label:"Firmographic",desc:"Who they are",color:T.blue,icon:"\u25C6"},{key:"behavioral",label:"Behavioral",desc:"What they've done",color:T.green,icon:"\u25CF"},{key:"engagement",label:"Engagement",desc:"How active they are",color:T.amber,icon:"\u25B2"}];
  const updateWeight = (changed, nw) => {
    const next = {...model}; const others = CATS.filter(c => c.key !== changed);
    const othersTotal = others.reduce((s,c) => s + next[c.key].weight, 0);
    next[changed] = {...next[changed], weight: nw};
    if (othersTotal > 0) { let rem = 100 - nw; others.forEach((c,i) => { if (i===others.length-1) { next[c.key] = {...next[c.key], weight: Math.max(0,rem)}; } else { const adj = Math.max(0, Math.round(rem * (next[c.key].weight / othersTotal))); next[c.key] = {...next[c.key], weight: adj}; rem -= adj; } }); }
    else { others.forEach((c,i) => { next[c.key] = {...next[c.key], weight: i===0 ? 100-nw : 0}; }); }
    setModel(next);
  };
  const toggle = (cat,idx) => { const n={...model}; const a=[...n[cat].criteria]; a[idx]={...a[idx],active:!a[idx].active}; n[cat]={...n[cat],criteria:a}; setModel(n); };
  const updPts = (cat,idx,pts) => { const n={...model}; const a=[...n[cat].criteria]; a[idx]={...a[idx],points:clamp(pts,-30,30)}; n[cat]={...n[cat],criteria:a}; setModel(n); };
  const move = (cat,idx,dir) => { const n={...model}; const a=[...n[cat].criteria]; const sw=dir==="up"?idx-1:idx+1; if(sw<0||sw>=a.length) return; [a[idx],a[sw]]=[a[sw],a[idx]]; n[cat]={...n[cat],criteria:a}; setModel(n); };
  const remove = (cat,idx) => { const n={...model}; const a=[...n[cat].criteria]; a.splice(idx,1); n[cat]={...n[cat],criteria:a}; setModel(n); };
  const [adding,setAdding] = useState(null);
  const [newLabel,setNewLabel] = useState("");
  const [newPts,setNewPts] = useState(10);
  const addC = (cat) => { if(!newLabel.trim()) return; const n={...model}; const a=[...n[cat].criteria]; a.push({id:uid(),label:newLabel.trim(),field:"custom",op:"eq",value:true,points:newPts,active:true}); n[cat]={...n[cat],criteria:a}; setModel(n); setAdding(null); setNewLabel(""); setNewPts(10); };
  const tw = CATS.reduce((s,c) => s+model[c.key].weight, 0);

  return (<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:16,fontWeight:700,color:T.bright}}>Scoring Model Builder</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Configure criteria, adjust weights, and set point values. Weights auto-balance to 100%.</div></div>
      <button style={S.btn(false)} onClick={() => { const j=JSON.stringify(model,null,2); const b=new Blob([j],{type:"application/json"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="scoring-model.json"; a.click(); }}>{"\u2B07"} Export JSON</button>
    </div>
    <div style={{...S.card,padding:"14px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
        <span style={{fontSize:12,fontWeight:600,color:T.muted,minWidth:60}}>Weights</span>
        <div style={{flex:1,display:"flex",gap:3,height:10,borderRadius:5,overflow:"hidden"}}>{CATS.map(c => (<div key={c.key} style={{width:model[c.key].weight+"%",background:c.color,borderRadius:5,transition:"width 0.3s"}} />))}</div>
        <span style={{fontSize:12,fontWeight:700,color:tw===100?T.green:T.red,fontFamily:"'JetBrains Mono',monospace"}}>{tw}%</span>
      </div>
      <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>{CATS.map(c => (
        <div key={c.key} style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11,color:c.color,fontWeight:600,minWidth:36}}>{c.label.slice(0,5)}</span>
          <button onClick={() => updateWeight(c.key,clamp(model[c.key].weight-1,0,100))} style={{width:24,height:24,borderRadius:4,border:"1px solid "+T.border,background:T.surface,color:T.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,padding:0}}>{"\u2212"}</button>
          <span style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:c.color,minWidth:36,textAlign:"center"}}>{model[c.key].weight}%</span>
          <button onClick={() => updateWeight(c.key,clamp(model[c.key].weight+1,0,100))} style={{width:24,height:24,borderRadius:4,border:"1px solid "+T.border,background:T.surface,color:T.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,padding:0}}>+</button>
        </div>
      ))}</div>
    </div>
    {CATS.map(cat => { const cfg=model[cat.key]; return (
      <div key={cat.key} style={{...S.card,borderLeft:"3px solid "+cat.color,padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+T.border,background:cat.color+"08"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{color:cat.color,fontSize:16}}>{cat.icon}</span>
            <div><div style={{fontSize:14,fontWeight:700,color:T.bright}}>{cat.label}</div><div style={{fontSize:11,color:T.muted}}>{cat.desc} {"\u00B7"} {cfg.criteria.filter(c=>c.active).length}/{cfg.criteria.length} active</div></div>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:cat.color,fontFamily:"'JetBrains Mono',monospace"}}>{cfg.weight}%</span>
        </div>
        <div style={{padding:"4px 0"}}>{cfg.criteria.map((c,idx) => (
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 18px",opacity:c.active?1:0.35,transition:"all 0.25s",background:idx%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
            <button onClick={() => toggle(cat.key,idx)} style={{width:18,height:18,borderRadius:4,border:"2px solid "+(c.active?cat.color:T.border),background:c.active?cat.color:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.white,padding:0}}>{c.active && "\u2713"}</button>
            <div style={{flex:1,fontSize:13,color:T.bright,fontWeight:500}}>{c.label}</div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button style={{...S.btnSm(false),padding:"2px 8px",fontSize:14}} onClick={() => updPts(cat.key,idx,c.points-1)}>{"\u2212"}</button>
              <span style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:c.points>0?T.green:c.points<0?T.red:T.muted,minWidth:36,textAlign:"center"}}>{c.points>0?"+"+c.points:c.points}</span>
              <button style={{...S.btnSm(false),padding:"2px 8px",fontSize:14}} onClick={() => updPts(cat.key,idx,c.points+1)}>+</button>
            </div>
            <div style={{display:"flex",gap:2}}>
              <button style={{border:"none",background:"transparent",color:idx===0?T.border:T.muted,cursor:idx===0?"default":"pointer",fontSize:10,padding:"2px 4px"}} onClick={() => move(cat.key,idx,"up")}>{"\u25B2"}</button>
              <button style={{border:"none",background:"transparent",color:idx===cfg.criteria.length-1?T.border:T.muted,cursor:idx===cfg.criteria.length-1?"default":"pointer",fontSize:10,padding:"2px 4px"}} onClick={() => move(cat.key,idx,"down")}>{"\u25BC"}</button>
            </div>
            <button onClick={() => remove(cat.key,idx)} style={{border:"none",background:"transparent",color:T.muted,cursor:"pointer",fontSize:13,padding:"2px 6px",opacity:0.6}} title="Remove">{"\u2715"}</button>
          </div>
        ))}</div>
        <div style={{padding:"8px 18px",borderTop:"1px solid "+T.border}}>
          {adding===cat.key ? (
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Criterion label..." style={{flex:1,padding:"6px 10px",borderRadius:T.rXs,border:"1px solid "+T.border,background:T.surface,color:T.bright,fontSize:12,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"}} onKeyDown={e => e.key==="Enter" && addC(cat.key)} />
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <button style={{...S.btnSm(false),padding:"2px 6px"}} onClick={() => setNewPts(Math.max(-30,newPts-1))}>{"\u2212"}</button>
                <span style={{fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:newPts>0?T.green:T.red,minWidth:28,textAlign:"center"}}>{newPts>0?"+"+newPts:newPts}</span>
                <button style={{...S.btnSm(false),padding:"2px 6px"}} onClick={() => setNewPts(Math.min(30,newPts+1))}>+</button>
              </div>
              <button style={S.btnSm(true)} onClick={() => addC(cat.key)}>Add</button>
              <button style={S.btnSm(false)} onClick={() => {setAdding(null);setNewLabel("");}}>Cancel</button>
            </div>
          ) : (<button onClick={() => setAdding(cat.key)} style={{border:"none",background:"transparent",color:cat.color,fontSize:12,fontWeight:600,cursor:"pointer",padding:"4px 0",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Add criterion</button>)}
        </div>
      </div>
    ); })}
  </div>);
};

const RoutingRules = ({rules, setRules, reps, setReps}) => {
  const [addingRep,setAddingRep]=useState(false);
  const [nrn,setNrn]=useState(""); const [nrt,setNrt]=useState("Mid-Market"); const [nrc,setNrc]=useState(40);
  const [editing,setEditing]=useState(null);
  const moveR = (i,d) => { const a=[...rules]; const sw=d==="up"?i-1:i+1; if(sw<0||sw>=a.length) return; [a[i],a[sw]]=[a[sw],a[i]]; a.forEach((r,j)=>r.priority=j+1); setRules(a); };
  const addRep = () => { if(!nrn.trim()) return; const ini=nrn.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2); setReps([...reps,{id:uid(),name:nrn.trim(),team:nrt,spec:"General",region:"North America",capacity:nrc,avatar:ini}]); setAddingRep(false); setNrn(""); };
  const updRule = (idx, patch) => { const n=[...rules]; n[idx]={...n[idx],...patch}; setRules(n); };
  const updCond = (rIdx, cIdx, patch) => { const n=[...rules]; const conds=[...n[rIdx].conditions]; conds[cIdx]={...conds[cIdx],...patch}; n[rIdx]={...n[rIdx],conditions:conds}; setRules(n); };
  const rmCond = (rIdx, cIdx) => { const n=[...rules]; const conds=[...n[rIdx].conditions]; conds.splice(cIdx,1); n[rIdx]={...n[rIdx],conditions:conds}; setRules(n); };
  const addCond = (rIdx) => { const n=[...rules]; n[rIdx]={...n[rIdx],conditions:[...n[rIdx].conditions,{field:"score",op:"gte",value:50}]}; setRules(n); };
  const addRule = () => { setRules([...rules,{id:uid(),name:"New Rule",conditions:[{field:"score",op:"gte",value:50}],assignTo:reps[0]?.id||"r1",priority:rules.length+1,active:true}]); setEditing(rules.length); };
  const FIELDS = [{v:"score",l:"Score"},{v:"industry",l:"Industry"},{v:"region",l:"Region"},{v:"sizeIdx",l:"Company Size"}];
  const OPS = [{v:"gte",l:"\u2265"},{v:"lte",l:"\u2264"},{v:"eq",l:"="}];
  const fieldValues = {industry:INDUSTRIES,region:REGIONS,sizeIdx:["0","1","2","3","4","5"]};
  const assignOptions = [...reps.map(r=>({v:r.id,l:r.name})),{v:"round-robin:Enterprise",l:"Round Robin: Enterprise"},{v:"round-robin:Mid-Market",l:"Round Robin: Mid-Market"},{v:"round-robin:SMB",l:"Round Robin: SMB"}];
  const iStyle = {padding:"5px 8px",borderRadius:T.rXs,border:"1px solid "+T.border,background:T.surface,color:T.bright,fontSize:12,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"};
  
  return (<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:16,fontWeight:700,color:T.bright}}>Routing Rules Engine</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Click any rule to edit. Rules evaluate top to bottom, first match wins.</div></div>
      <div style={{display:"flex",gap:8}}>
        <button style={S.btn(true)} onClick={addRule}>+ Add Rule</button>
        <button style={S.btn(false)} onClick={() => { const j=JSON.stringify(rules,null,2); const b=new Blob([j],{type:"application/json"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="routing-rules.json"; a.click(); }}>{"\u2B07"} Export JSON</button>
      </div>
    </div>
    <div style={{...S.card,padding:"16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:T.bright}}>Sales Team ({reps.length} reps)</div>
        <button style={S.btnSm(false)} onClick={() => setAddingRep(!addingRep)}>{addingRep?"Cancel":"+ Add Rep"}</button>
      </div>
      {addingRep && (<div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",padding:"10px 12px",background:T.surface,borderRadius:T.rSm,border:"1px solid "+T.border}}>
        <input value={nrn} onChange={e=>setNrn(e.target.value)} placeholder="Name..." style={{...iStyle,flex:1}} onKeyDown={e=>e.key==="Enter"&&addRep()} />
        <select value={nrt} onChange={e=>setNrt(e.target.value)} style={iStyle}><option value="Enterprise">Enterprise</option><option value="Mid-Market">Mid-Market</option><option value="SMB">SMB</option></select>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:T.muted}}>Cap:<input type="number" value={nrc} onChange={e=>setNrc(parseInt(e.target.value)||30)} min={10} max={100} style={{...iStyle,width:48,textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}} /></div>
        <button style={S.btnSm(true)} onClick={addRep}>Add</button>
      </div>)}
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{reps.map(r => (
        <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:T.surface,borderRadius:T.rSm,border:"1px solid "+T.border}}>
          <RepAvatar rep={r} size={26} />
          <div><div style={{fontSize:12,fontWeight:600,color:T.bright}}>{r.name}</div><div style={{fontSize:10,color:T.muted}}>{r.team} {"\u00B7"} Cap {r.capacity}</div></div>
          <button onClick={() => setReps(reps.filter(x=>x.id!==r.id))} style={{border:"none",background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,padding:"2px 4px",opacity:0.5}}>{"\u2715"}</button>
        </div>
      ))}</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>{rules.map((rule,idx) => {
      const isDef=rule.conditions.length===0; const rep=reps.find(r=>r.id===rule.assignTo); const isRR=rule.assignTo.startsWith("round-robin:"); const isEdit=editing===idx;
      return (<div key={rule.id} style={{background:T.card,border:"1px solid "+(isEdit?T.accent:T.border),borderRadius:T.r,padding:0,opacity:rule.active?1:0.35,borderLeft:"3px solid "+(isDef?T.muted:rule.active?T.accent:T.border),transition:"all 0.2s",overflow:"hidden"}}>
        {/* Header row - always visible */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",cursor:"pointer"}} onClick={()=>setEditing(isEdit?null:idx)}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:32}}>
            <button style={{border:"none",background:"transparent",color:idx===0?T.border:T.muted,cursor:idx===0?"default":"pointer",fontSize:11,padding:"2px 6px"}} onClick={(e)=>{e.stopPropagation();moveR(idx,"up");}}>{"\u25B2"}</button>
            <div style={{width:28,height:28,borderRadius:6,background:isDef?T.surface:T.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:isDef?T.muted:T.accent,fontFamily:"'JetBrains Mono',monospace"}}>{idx+1}</div>
            <button style={{border:"none",background:"transparent",color:idx===rules.length-1?T.border:T.muted,cursor:idx===rules.length-1?"default":"pointer",fontSize:11,padding:"2px 6px"}} onClick={(e)=>{e.stopPropagation();moveR(idx,"down");}}>{"\u25BC"}</button>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:T.bright,marginBottom:6}}>{rule.name}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {isDef ? (<div style={{fontSize:11,color:T.muted,fontStyle:"italic",padding:"4px 10px",borderRadius:6,background:"rgba(78,90,114,0.1)",border:"1px solid "+T.border}}>Catches all unmatched leads</div>) : (<>
                <span style={{fontSize:10,fontWeight:700,color:T.muted}}>IF</span>
                {rule.conditions.map((c,ci) => (<div key={ci} style={{display:"flex",alignItems:"center",gap:4}}>
                  {ci>0 && <span style={{fontSize:10,fontWeight:700,color:T.muted}}>AND</span>}
                  <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)",fontSize:11,fontWeight:600,color:T.cyan}}>
                    <span style={{color:T.text}}>{FIELDS.find(f=>f.v===c.field)?.l||c.field}</span><span>{c.op==="gte"?"\u2265":c.op==="lte"?"\u2264":"="}</span><span style={{color:T.bright}}>{String(c.value)}</span>
                  </div>
                </div>))}
              </>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:14,color:T.border}}>{"\u25B6"}</div>
            {isRR ? (<div style={{padding:"6px 12px",background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:T.rSm}}><div style={{fontSize:10,fontWeight:700,color:T.purple}}>ROUND ROBIN</div><div style={{fontSize:12,fontWeight:600,color:T.bright}}>{rule.assignTo.split(":")[1]}</div></div>) :
            rep ? (<div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.accentDim,border:"1px solid "+T.accentMid,borderRadius:T.rSm}}><RepAvatar rep={rep} size={22}/><div><div style={{fontSize:12,fontWeight:600,color:T.bright}}>{rep.name}</div></div></div>) :
            <span style={{fontSize:12,color:T.red}}>???</span>}
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button onClick={(e) => {e.stopPropagation();const n=[...rules]; n[idx]={...n[idx],active:!n[idx].active}; setRules(n);}} style={{...S.btnSm(false),color:rule.active?T.green:T.muted,borderColor:rule.active?T.green+"40":T.border}}>{rule.active?"ON":"OFF"}</button>
            <button onClick={(e) => {e.stopPropagation();setEditing(isEdit?null:idx);}} style={{...S.btnSm(false),color:isEdit?T.accent:T.muted}}>{isEdit?"\u2713":"Edit"}</button>
            <button onClick={(e) => {e.stopPropagation();const n=[...rules]; n.splice(idx,1); setRules(n); if(editing===idx)setEditing(null);}} style={{...S.btnSm(false),color:T.red,borderColor:T.red+"30",opacity:0.7}}>{"\u2715"}</button>
          </div>
        </div>
        {/* Edit panel - collapsible */}
        {isEdit && (<div style={{padding:"0 20px 16px",borderTop:"1px solid "+T.border,marginTop:0,paddingTop:16}}>
          {/* Rule name */}
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:600,color:T.muted,minWidth:70}}>Rule Name</span>
            <input value={rule.name} onChange={e=>updRule(idx,{name:e.target.value})} style={{...iStyle,flex:1}} />
          </div>
          {/* Conditions */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:T.muted,marginBottom:8}}>Conditions {rule.conditions.length===0 && "(none = catches everything)"}</div>
            {rule.conditions.map((c,ci) => (<div key={ci} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              {ci>0 && <span style={{fontSize:10,fontWeight:700,color:T.muted,minWidth:30}}>AND</span>}
              {ci===0 && <span style={{fontSize:10,fontWeight:700,color:T.muted,minWidth:30}}>IF</span>}
              <select value={c.field} onChange={e=>{const nf=e.target.value; const patch={field:nf}; if(nf==="score") patch.value=50; else if(fieldValues[nf]) patch.value=fieldValues[nf][0]; updCond(idx,ci,patch);}} style={{...iStyle,minWidth:100}}>{FIELDS.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}</select>
              <select value={c.op} onChange={e=>updCond(idx,ci,{op:e.target.value})} style={{...iStyle,width:50}}>{OPS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
              {c.field==="score"||c.field==="sizeIdx" ? (
                <input type="number" value={c.value} onChange={e=>updCond(idx,ci,{value:parseInt(e.target.value)||0})} style={{...iStyle,width:70,fontFamily:"'JetBrains Mono',monospace"}} />
              ) : fieldValues[c.field] ? (
                <select value={c.value} onChange={e=>updCond(idx,ci,{value:e.target.value})} style={{...iStyle,minWidth:130}}>{fieldValues[c.field].map(v=><option key={v} value={v}>{v}</option>)}</select>
              ) : (
                <input value={String(c.value)} onChange={e=>updCond(idx,ci,{value:e.target.value})} style={{...iStyle,flex:1}} />
              )}
              <button onClick={()=>rmCond(idx,ci)} style={{border:"none",background:"transparent",color:T.red,cursor:"pointer",fontSize:13,padding:"2px 6px"}}>{"\u2715"}</button>
            </div>))}
            <button onClick={()=>addCond(idx)} style={{border:"none",background:"transparent",color:T.cyan,fontSize:12,fontWeight:600,cursor:"pointer",padding:"4px 0",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Add condition</button>
          </div>
          {/* Assignment */}
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:600,color:T.muted,minWidth:70}}>Assign to</span>
            <select value={rule.assignTo} onChange={e=>updRule(idx,{assignTo:e.target.value})} style={{...iStyle,minWidth:200}}>{assignOptions.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
          </div>
        </div>)}
      </div>);
    })}</div>
  </div>);
};

const SimulationTab = ({processed, reps}) => {
  const [mode,setMode]=useState("live"); const [simIdx,setSimIdx]=useState(0); const [running,setRunning]=useState(false); const [speed,setSpeed]=useState(1);
  const [filter,setFilter]=useState("all"); const [sort,setSort]=useState("score"); const [sortDir,setSortDir]=useState("desc"); const [selected,setSelected]=useState(null);
  const iRef=useRef(null);
  useEffect(() => { if(running&&mode==="live") { iRef.current=setInterval(() => { setSimIdx(p => { if(p>=processed.length-1){setRunning(false);return p;} return p+1; }); },2000/speed); } return () => clearInterval(iRef.current); },[running,speed,mode,processed.length]);
  const cl=processed[simIdx]; const rep=cl?reps.find(r=>r.id===cl.routing.repId):null; const tier=cl?getTier(cl.score):null;
  const filtered=useMemo(() => { let a=[...processed]; if(filter==="hot") a=a.filter(l=>l.score>=80); if(filter==="warm") a=a.filter(l=>l.score>=60&&l.score<80); if(filter==="cool") a=a.filter(l=>l.score>=40&&l.score<60); if(filter==="cold") a=a.filter(l=>l.score<40);
    a.sort((a,b) => { let av=a[sort],bv=b[sort]; if(sort==="rep"){av=a.routing.repId;bv=b.routing.repId;} if(typeof av==="string") return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av); return sortDir==="asc"?av-bv:bv-av; }); return a; },[processed,filter,sort,sortDir]);
  const [page,setPage]=useState(0); const pp=20; const pages=Math.ceil(filtered.length/pp); const pd=filtered.slice(page*pp,(page+1)*pp);
  const SH = ({field,children}) => (<th style={S.th} onClick={() => {if(sort===field) setSortDir(d=>d==="asc"?"desc":"asc"); else {setSort(field);setSortDir("desc");}}}><span style={{cursor:"pointer"}}>{children} {sort===field?(sortDir==="asc"?"\u2191":"\u2193"):""}</span></th>);

  return (<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:16,fontWeight:700,color:T.bright}}>Lead Processing Simulation</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Watch leads get scored and routed in real time</div></div>
      <div style={{display:"flex",gap:4,background:T.surface,borderRadius:T.rXs,padding:3}}><button style={S.tab(mode==="live")} onClick={()=>setMode("live")}>Live Feed</button><button style={S.tab(mode==="table")} onClick={()=>setMode("table")}>Table View</button></div>
    </div>
    {mode==="live" ? (<div>
      <div style={{...S.card,display:"flex",alignItems:"center",gap:16,padding:"12px 18px",flexWrap:"wrap"}}>
        <button style={S.btn(true)} onClick={()=>{if(simIdx>=processed.length-1)setSimIdx(0);setRunning(!running);}}>{running?"\u23F8 Pause":"\u25B6 Play"}</button>
        <button style={S.btn(false)} onClick={()=>{setRunning(false);setSimIdx(0);}}>Reset</button>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11,color:T.muted}}>Speed</span>{[1,3,10].map(s=>(<button key={s} style={{...S.btnSm(speed===s),padding:"4px 10px"}} onClick={()=>setSpeed(s)}>{s}x</button>))}</div>
        <div style={{marginLeft:"auto",fontSize:12,color:T.muted}}><span style={{fontFamily:"'JetBrains Mono',monospace",color:T.bright}}>{simIdx+1}</span> / {processed.length}</div>
      </div>
      <div style={{height:3,background:T.surface,borderRadius:2,margin:"8px 0 16px",overflow:"hidden"}}><div style={{width:((simIdx+1)/processed.length)*100+"%",height:"100%",background:T.accent,transition:"width 0.3s"}} /></div>
      {cl && (<div style={{...S.card,borderLeft:"3px solid "+tier.color}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Lead</div>
            <div style={{fontSize:16,fontWeight:700,color:T.bright}}>{cl.name}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>{cl.title} at {cl.company}</div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Pill>{cl.industry}</Pill><Pill color={T.cyan} bg="rgba(6,182,212,0.1)">{cl.region}</Pill><Pill color={T.purple} bg="rgba(168,85,247,0.1)">{cl.size}</Pill></div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Score</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:36,fontWeight:800,color:tier.color,fontFamily:"'JetBrains Mono',monospace"}}>{cl.score}</span><Pill color={tier.color} bg={tier.bg}>{tier.label}</Pill></div>
            <div style={{marginTop:8}}><CatBreakdown catScores={cl.catScores} /></div>
            <div style={{marginTop:8}}>{Object.entries(cl.breakdown).map(([cat,items]) => items.map((item,i) => (<div key={cat+"-"+i} style={{fontSize:11,color:T.text,display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span>{item.label}</span><span style={{color:item.points>0?T.green:T.red,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{item.points>0?"+"+item.points:item.points}</span></div>)))}</div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Routing</div>
            <div style={{padding:"12px 14px",background:T.surface,borderRadius:T.rSm,border:"1px solid "+T.border}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Rule matched:</div>
              <div style={{fontSize:13,fontWeight:600,color:T.accent,marginBottom:10}}>{cl.routing.ruleName}</div>
              <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Assigned to:</div>
              {rep && (<div style={{display:"flex",alignItems:"center",gap:8}}><RepAvatar rep={rep} /><div><div style={{fontSize:13,fontWeight:600,color:T.bright}}>{rep.name}</div><div style={{fontSize:11,color:T.muted}}>{rep.team}</div></div></div>)}
            </div>
          </div>
        </div>
      </div>)}
      <div style={{...S.card,maxHeight:240,overflow:"auto"}}><div style={{fontSize:12,fontWeight:700,color:T.bright,marginBottom:8}}>Recent</div>
        {processed.slice(Math.max(0,simIdx-8),simIdx+1).reverse().map((l,i) => { const t=getTier(l.score); const r=reps.find(rr=>rr.id===l.routing.repId); return (
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"6px 0",borderBottom:"1px solid "+T.border,opacity:1-i*0.08}}>
            <span style={{fontSize:11,fontWeight:700,color:t.color,fontFamily:"'JetBrains Mono',monospace",minWidth:28}}>{l.score}</span>
            <span style={{fontSize:12,color:T.bright,flex:1}}>{l.name}</span><span style={{fontSize:11,color:T.muted}}>{l.company}</span>
            <span style={{fontSize:11,color:T.border}}>{"\u2192"}</span>{r && <span style={{fontSize:11,color:T.accent}}>{r.name}</span>}
          </div>); })}
      </div>
    </div>) : (<div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{["all","hot","warm","cool","cold"].map(f => {
        const cols={all:T.accent,hot:T.red,warm:T.amber,cool:T.blue,cold:T.muted};
        const cts={hot:processed.filter(l=>l.score>=80).length,warm:processed.filter(l=>l.score>=60&&l.score<80).length,cool:processed.filter(l=>l.score>=40&&l.score<60).length,cold:processed.filter(l=>l.score<40).length};
        return <button key={f} style={{...S.btnSm(filter===f),borderColor:filter===f?cols[f]:T.border,color:filter===f?T.white:cols[f],background:filter===f?cols[f]:"transparent",textTransform:"capitalize"}} onClick={()=>{setFilter(f);setPage(0);}}>{f}{f!=="all"?" ("+cts[f]+")":""}</button>;
      })}</div>
      <div style={{...S.card,padding:0,overflow:"auto"}}><table style={S.table}><thead><tr><SH field="score">Score</SH><SH field="name">Lead</SH><SH field="company">Company</SH><SH field="industry">Industry</SH><SH field="region">Region</SH><SH field="rep">Assigned To</SH><SH field="status">Status</SH><SH field="dealValue">Value</SH></tr></thead><tbody>
        {pd.map(l => { const t=getTier(l.score); const r=reps.find(rr=>rr.id===l.routing.repId); return (
          <tr key={l.id} style={{cursor:"pointer",transition:"background 0.15s"}} onClick={()=>setSelected(selected===l.id?null:l.id)} onMouseEnter={e=>e.currentTarget.style.background=T.cardAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={S.td}><ScoreBar score={l.score} size="sm" /></td>
            <td style={{...S.td,color:T.bright,fontWeight:600}}>{l.name}</td><td style={S.td}>{l.company}</td><td style={S.td}>{l.industry}</td><td style={S.td}>{l.region}</td>
            <td style={S.td}>{r && <span style={{display:"flex",alignItems:"center",gap:6}}><RepAvatar rep={r} size={20} /><span style={{fontSize:12}}>{r.name}</span></span>}</td>
            <td style={S.td}><Pill color={l.status==="converted"?T.green:l.status==="lost"?T.red:T.amber} bg={l.status==="converted"?T.greenDim:l.status==="lost"?T.redDim:T.amberDim}>{l.status}</Pill></td>
            <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{fmt(l.dealValue)}</td>
          </tr>); })}
      </tbody></table></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <span style={{fontSize:12,color:T.muted}}>{filtered.length} leads</span>
        <div style={{display:"flex",gap:4}}><button style={S.btnSm(false)} disabled={page===0} onClick={()=>setPage(page-1)}>{"\u2190"} Prev</button><span style={{fontSize:12,color:T.muted,padding:"4px 12px"}}>{page+1}/{pages}</span><button style={S.btnSm(false)} disabled={page>=pages-1} onClick={()=>setPage(page+1)}>Next {"\u2192"}</button></div>
      </div>
      {selected && (()=>{ const l=processed.find(x=>x.id===selected); if(!l) return null; const t=getTier(l.score); const r=reps.find(rr=>rr.id===l.routing.repId); return (
        <div style={{...S.card,marginTop:12,borderLeft:"3px solid "+t.color}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:18,fontWeight:700,color:T.bright}}>{l.name}</div><div style={{fontSize:13,color:T.muted}}>{l.title} at {l.company}</div></div><button style={{...S.btnSm(false),fontSize:16}} onClick={()=>setSelected(null)}>{"\u00D7"}</button></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginTop:16}}>
            <div><div style={{fontSize:11,fontWeight:600,color:T.muted,marginBottom:6}}>SCORE</div><div style={{fontSize:32,fontWeight:800,color:t.color,fontFamily:"'JetBrains Mono',monospace"}}>{l.score}</div><CatBreakdown catScores={l.catScores} /><div style={{marginTop:8}}>{Object.entries(l.breakdown).map(([cat,items])=>items.map((item,i)=>(<div key={cat+i} style={{fontSize:11,display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span style={{color:T.text}}>{item.label}</span><span style={{color:item.points>0?T.green:T.red,fontFamily:"'JetBrains Mono',monospace"}}>{item.points>0?"+"+item.points:item.points}</span></div>)))}</div></div>
            <div><div style={{fontSize:11,fontWeight:600,color:T.muted,marginBottom:6}}>ATTRIBUTES</div>{[["Industry",l.industry],["Region",l.region],["Size",l.size],["Source",l.source],["Pricing views",l.pricingViews],["Sessions",l.webSessions],["Demo",l.demoRequested?"Yes":"No"],["Email opens",l.emailOpens],["Days inactive",l.daysSinceActive],["Deal value",fmt(l.dealValue)]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:12,borderBottom:"1px solid "+T.border}}><span style={{color:T.muted}}>{k}</span><span style={{color:T.bright,fontWeight:500}}>{v}</span></div>))}</div>
            <div><div style={{fontSize:11,fontWeight:600,color:T.muted,marginBottom:6}}>ROUTING</div><div style={{fontSize:13,color:T.accent,fontWeight:600,marginBottom:8}}>{l.routing.ruleName}</div>{r&&(<div style={{display:"flex",alignItems:"center",gap:8}}><RepAvatar rep={r} size={32}/><div><div style={{fontSize:14,fontWeight:600,color:T.bright}}>{r.name}</div><div style={{fontSize:11,color:T.muted}}>{r.team}</div></div></div>)}<div style={{marginTop:12,display:"flex",gap:6}}><Pill color={l.status==="converted"?T.green:l.status==="lost"?T.red:T.amber} bg={l.status==="converted"?T.greenDim:l.status==="lost"?T.redDim:T.amberDim}>{l.status}</Pill>{l._hotUncontacted&&<Pill color={T.red} bg={T.redDim}>{"\u26A0"} Hot Uncontacted</Pill>}</div></div>
          </div>
        </div>); })()}
    </div>)}
  </div>);
};

const AnalyticsTab = ({processed, reps}) => {
  const dist = useMemo(() => { const b=[{range:"0-19",min:0,max:19,count:0,converted:0},{range:"20-39",min:20,max:39,count:0,converted:0},{range:"40-59",min:40,max:59,count:0,converted:0},{range:"60-79",min:60,max:79,count:0,converted:0},{range:"80-100",min:80,max:100,count:0,converted:0}]; processed.forEach(l=>{const bk=b.find(x=>l.score>=x.min&&l.score<=x.max);if(bk){bk.count++;if(l.converted)bk.converted++;}}); b.forEach(x=>{x.convRate=x.count>0?(x.converted/x.count)*100:0;}); return b; },[processed]);
  const repStats = useMemo(() => { const s={}; reps.forEach(r=>{s[r.id]={...r,leads:0,converted:0,totalScore:0,hotUn:0};}); processed.forEach(l=>{const x=s[l.routing.repId];if(x){x.leads++;x.totalScore+=l.score;if(l.converted)x.converted++;if(l._hotUncontacted)x.hotUn++;}}); Object.values(s).forEach(x=>{x.avgScore=x.leads>0?Math.round(x.totalScore/x.leads):0;x.convRate=x.leads>0?(x.converted/x.leads)*100:0;x.util=(x.leads/x.capacity)*100;}); return Object.values(s); },[processed,reps]);
  const calib = useMemo(() => { const d=Array.from({length:10},(_,i)=>({decile:i*10+"-"+(i+1)*10,predicted:i*10+5,actual:0,count:0,conv:0})); processed.forEach(l=>{const i=Math.min(Math.floor(l.score/10),9);d[i].count++;if(l.converted)d[i].conv++;}); d.forEach(x=>{x.actual=x.count>0?(x.conv/x.count)*100:0;}); return d; },[processed]);
  const alerts = useMemo(() => { const a=[];
    const hot=processed.filter(l=>l.score>=80&&!l.contacted&&l.hoursSinceAssigned>24);
    if(hot.length>0) a.push({type:"critical",msg:hot.length+" hot leads uncontacted >24h",color:T.red});
    const over=repStats.filter(r=>r.util>100);
    if(over.length>0) a.push({type:"warning",msg:over.length+" rep(s) over capacity: "+over.map(r=>r.name).join(", "),color:T.amber});
    const hc=processed.filter(l=>l.industry==="Healthcare"); const hcConv=hc.filter(l=>l.converted).length/Math.max(hc.length,1); const hcAvg=hc.reduce((s,l)=>s+l.score,0)/Math.max(hc.length,1);
    if(hcAvg>40&&hcConv<0.12) a.push({type:"warning",msg:"Healthcare: avg score "+Math.round(hcAvg)+" but only "+pct(hcConv*100)+" convert \u2014 model miscalibrated",color:T.amber});
    const mj=repStats.find(r=>r.name==="Marcus Johnson");
    if(mj&&mj.avgScore<45&&mj.convRate>12) a.push({type:"info",msg:mj.name+" converts "+pct(mj.convRate)+" with avg score "+mj.avgScore+" \u2014 consider routing better leads",color:T.blue});
    return a; },[processed,repStats]);
  const barC=[T.muted,T.blue,T.amber,T.orange,T.red];
  const tt={background:T.card,border:"1px solid "+T.border,borderRadius:T.rXs,color:T.bright,fontSize:12};

  return (<div>
    <div style={{fontSize:16,fontWeight:700,color:T.bright,marginBottom:4}}>Performance Analytics</div>
    <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Model calibration, rep workload, and system alerts</div>
    {alerts.length>0 && (<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>{alerts.map((a,i)=>(<div key={i} style={{...S.card,borderLeft:"3px solid "+a.color,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:0}}><span style={{fontSize:16}}>{a.type==="critical"?"\uD83D\uDD34":a.type==="warning"?"\uD83D\uDFE1":"\uD83D\uDD35"}</span><span style={{fontSize:13,color:T.text}}>{a.msg}</span></div>))}</div>)}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:T.bright,marginBottom:12}}>Score Distribution</div><ResponsiveContainer width="100%" height={200}><BarChart data={dist}><CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="range" tick={{fill:T.muted,fontSize:11}}/><YAxis tick={{fill:T.muted,fontSize:11}}/><Tooltip contentStyle={tt}/><Bar dataKey="count" name="Leads" radius={[4,4,0,0]}>{dist.map((d,i)=><Cell key={i} fill={barC[i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:T.bright,marginBottom:12}}>Conversion Rate by Score Band</div><ResponsiveContainer width="100%" height={200}><BarChart data={dist}><CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="range" tick={{fill:T.muted,fontSize:11}}/><YAxis tick={{fill:T.muted,fontSize:11}} tickFormatter={v=>v+"%"}/><Tooltip contentStyle={tt} formatter={v=>v.toFixed(1)+"%"}/><Bar dataKey="convRate" name="Conv %" radius={[4,4,0,0]}>{dist.map((d,i)=><Cell key={i} fill={d.convRate>25?T.green:d.convRate>10?T.amber:T.muted}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:T.bright,marginBottom:12}}>Model Calibration</div><ResponsiveContainer width="100%" height={200}><LineChart data={calib}><CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="decile" tick={{fill:T.muted,fontSize:10}}/><YAxis tick={{fill:T.muted,fontSize:11}} tickFormatter={v=>v+"%"}/><Tooltip contentStyle={tt}/><Line type="monotone" dataKey="predicted" stroke={T.muted} strokeDasharray="5 5" name="Perfect" dot={false}/><Line type="monotone" dataKey="actual" stroke={T.accent} strokeWidth={2} name="Actual" dot={{fill:T.accent,r:3}}/></LineChart></ResponsiveContainer></div>
    </div>
    <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:T.bright,marginBottom:12}}>Rep Workload & Performance</div><div style={{overflow:"auto"}}><table style={S.table}><thead><tr><th style={S.th}>Rep</th><th style={S.th}>Leads</th><th style={S.th}>Load</th><th style={S.th}>Avg Score</th><th style={S.th}>Conv %</th></tr></thead><tbody>
        {repStats.sort((a,b)=>b.util-a.util).map(r=>(<tr key={r.id}>
          <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:6}}><RepAvatar rep={r} size={22}/><span style={{fontSize:12,fontWeight:600,color:T.bright}}>{r.name}</span></div></td>
          <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",color:r.util>100?T.red:T.text}}>{r.leads}</td>
          <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:60,height:6,borderRadius:3,background:T.surface,overflow:"hidden"}}><div style={{width:Math.min(r.util,100)+"%",height:"100%",borderRadius:3,background:r.util>100?T.red:r.util>80?T.amber:T.green}}/></div><span style={{fontSize:11,color:T.text,fontFamily:"'JetBrains Mono',monospace"}}>{pct(r.util)}</span></div></td>
          <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.text}}>{r.avgScore}</td>
          <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:r.convRate>20?T.green:T.text}}>{pct(r.convRate)}</td>
        </tr>))}
      </tbody></table></div></div>
  </div>);
};

const ABTestingTab = ({leads, model}) => {
  const [preset,setPreset]=useState("behavioral");
  const PRESETS = {
    behavioral: { name:"Shift \u2192 Behavioral", desc:"Rotates weight toward behavioral signals. Actions matter more than profile.", color:T.green },
    firmographic: { name:"Shift \u2192 Firmographic", desc:"Rotates weight toward firmographic signals. Who they are matters more than what they do.", color:T.blue },
    engagement: { name:"Shift \u2192 Engagement", desc:"Rotates weight toward engagement. Recency and activity beat everything.", color:T.amber },
    quality: { name:"Quality Gate", desc:"Same weights, but disables your weakest criteria per category. Fewer hot leads, higher precision.", color:T.red },
    wide: { name:"Wide Net", desc:"Same weights, but boosts all point values by 40%. More leads qualify as hot. Volume over precision.", color:T.purple },
  };

  const buildModelB = useMemo(() => {
    const b = JSON.parse(JSON.stringify(model));
    const fw = model.firmographic.weight, bw = model.behavioral.weight, ew = model.engagement.weight;
    if (preset === "behavioral") {
      const shift = Math.round((fw + ew) * 0.2);
      b.firmographic.weight = Math.max(5, fw - Math.round(shift * fw / (fw + ew)));
      b.engagement.weight = Math.max(5, ew - Math.round(shift * ew / (fw + ew)));
      b.behavioral.weight = 100 - b.firmographic.weight - b.engagement.weight;
      b.behavioral.criteria.forEach(c => { if (c.points > 0) c.points = Math.round(c.points * 1.3); });
      b.firmographic.criteria.forEach(c => { if (c.points > 0) c.points = Math.round(c.points * 0.8); });
    } else if (preset === "firmographic") {
      const shift = Math.round((bw + ew) * 0.2);
      b.behavioral.weight = Math.max(5, bw - Math.round(shift * bw / (bw + ew)));
      b.engagement.weight = Math.max(5, ew - Math.round(shift * ew / (bw + ew)));
      b.firmographic.weight = 100 - b.behavioral.weight - b.engagement.weight;
      b.firmographic.criteria.forEach(c => { if (c.points > 0) c.points = Math.round(c.points * 1.3); });
      b.behavioral.criteria.forEach(c => { if (c.points > 0) c.points = Math.round(c.points * 0.8); });
    } else if (preset === "engagement") {
      const shift = Math.round((fw + bw) * 0.2);
      b.firmographic.weight = Math.max(5, fw - Math.round(shift * fw / (fw + bw)));
      b.behavioral.weight = Math.max(5, bw - Math.round(shift * bw / (fw + bw)));
      b.engagement.weight = 100 - b.firmographic.weight - b.behavioral.weight;
      b.engagement.criteria.forEach(c => { if (c.points > 0) c.points = Math.round(c.points * 1.4); });
    } else if (preset === "quality") {
      ["firmographic","behavioral","engagement"].forEach(cat => {
        const sorted = [...b[cat].criteria].filter(c => c.active && c.points > 0).sort((a,x) => x.points - a.points);
        const keep = sorted.slice(0, 3).map(c => c.id);
        b[cat].criteria.forEach(c => { if (c.points > 0 && !keep.includes(c.id)) c.active = false; });
      });
    } else if (preset === "wide") {
      ["firmographic","behavioral","engagement"].forEach(cat => {
        b[cat].criteria.forEach(c => { if (c.points > 0) c.points = Math.round(c.points * 1.4); });
      });
    }
    return b;
  }, [model, preset]);

  const rA=useMemo(()=>leads.map(l=>({...l,...scoreLead(l,model)})),[leads,model]);
  const rB=useMemo(()=>leads.map(l=>({...l,...scoreLead(l,buildModelB)})),[leads,buildModelB]);
  const sf = (r) => { const avg=r.reduce((s,l)=>s+l.score,0)/r.length; const hot=r.filter(l=>l.score>=80).length; const hConv=r.filter(l=>l.score>=80&&l.converted).length; return {avg:Math.round(avg),hot,convRate:hot>0?(hConv/hot)*100:0,dist:[0,0,0,0,0].map((_,i)=>r.filter(l=>l.score>=i*20&&l.score<(i+1)*20+(i===4?1:0)).length)}; };
  const sA=sf(rA), sB=sf(rB);
  const cd=["0-19","20-39","40-59","60-79","80-100"].map((r,i)=>({range:r,"Model A":sA.dist[i],"Model B":sB.dist[i]}));
  const winner=sB.convRate>sA.convRate+2?"B":sA.convRate>sB.convRate+2?"A":"Tie";
  const tt={background:T.card,border:"1px solid "+T.border,borderRadius:T.rXs,color:T.bright,fontSize:12};
  const p = PRESETS[preset];

  const getChanges = () => {
    const ch = [];
    const bm = buildModelB;
    if (bm.firmographic.weight !== model.firmographic.weight) ch.push("Firmographic weight: "+model.firmographic.weight+"% \u2192 "+bm.firmographic.weight+"%");
    if (bm.behavioral.weight !== model.behavioral.weight) ch.push("Behavioral weight: "+model.behavioral.weight+"% \u2192 "+bm.behavioral.weight+"%");
    if (bm.engagement.weight !== model.engagement.weight) ch.push("Engagement weight: "+model.engagement.weight+"% \u2192 "+bm.engagement.weight+"%");
    if (preset === "quality") { const disabled = ["firmographic","behavioral","engagement"].reduce((s,cat) => s + model[cat].criteria.filter(c=>c.active&&c.points>0).length - bm[cat].criteria.filter(c=>c.active&&c.points>0).length, 0); if(disabled>0) ch.push(disabled+" weak criteria disabled (keep top 3 per category)"); }
    if (preset === "wide" || preset === "behavioral" || preset === "firmographic" || preset === "engagement") ch.push("Point values adjusted in shifted categories");
    return ch;
  };

  const MC = ({label,color,stats,changes,isW,mRef}) => (<div style={{...S.card,borderTop:"3px solid "+color,marginBottom:0}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:15,fontWeight:700,color}}>{label}</div>{isW&&<Pill color={T.green} bg={T.greenDim}>{"\u2605"} Winner</Pill>}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:changes?14:0}}>
      <div style={S.stat}><div style={S.statVal(color)}>{stats.avg}</div><div style={S.statLabel}>Avg Score</div></div>
      <div style={S.stat}><div style={S.statVal(T.red)}>{stats.hot}</div><div style={S.statLabel}>Hot Leads (80+)</div></div>
      <div style={S.stat}><div style={S.statVal(T.green)}>{stats.hot>0?pct(stats.convRate):"N/A"}</div><div style={S.statLabel}>Hot Conv Rate</div></div>
      <div style={S.stat}><div style={{...S.statVal(T.text),fontSize:18}}>F{mRef.firmographic.weight} B{mRef.behavioral.weight} E{mRef.engagement.weight}</div><div style={S.statLabel}>Weights</div></div>
    </div>
    {changes && changes.length>0 && (<div style={{padding:"10px 12px",background:T.surface,borderRadius:T.rSm,border:"1px solid "+T.border}}><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:6}}>CHANGES FROM YOUR MODEL</div>{changes.map((c,i)=>(<div key={i} style={{fontSize:12,color:T.text,padding:"2px 0",display:"flex",gap:6}}><span style={{color:T.cyan}}>{"\u2022"}</span>{c}</div>))}</div>)}
  </div>);

  return (<div>
    <div style={{fontSize:16,fontWeight:700,color:T.bright,marginBottom:4}}>A/B Model Comparison</div>
    <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Compare your current model against variations built from YOUR configuration</div>
    {/* Preset selector */}
    <div style={{...S.card,padding:"14px 18px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,fontWeight:600,color:T.muted}}>Model B variant:</span>
      {Object.entries(PRESETS).map(([k,v])=>(<button key={k} style={{...S.btnSm(preset===k),background:preset===k?v.color:"transparent",color:preset===k?T.white:v.color,borderColor:preset===k?v.color:T.border}} onClick={()=>setPreset(k)}>{v.name}</button>))}
    </div>
    <div style={{...S.card,padding:"10px 18px",marginTop:-8,borderTop:"none",borderTopLeftRadius:0,borderTopRightRadius:0}}><div style={{fontSize:12,color:T.text}}>{p.desc}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <MC label="Model A \u2014 Your Current" color={T.accent} stats={sA} isW={winner==="A"} mRef={model} />
      <MC label={"Model B \u2014 "+p.name} color={p.color} stats={sB} isW={winner==="B"} changes={getChanges()} mRef={buildModelB} />
    </div>
    <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:T.bright,marginBottom:12}}>Score Distribution Comparison</div><ResponsiveContainer width="100%" height={220}><BarChart data={cd} barGap={2}><CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="range" tick={{fill:T.muted,fontSize:11}}/><YAxis tick={{fill:T.muted,fontSize:11}}/><Tooltip contentStyle={tt}/><Bar dataKey="Model A" fill={T.accent} radius={[4,4,0,0]}/><Bar dataKey="Model B" fill={p.color} radius={[4,4,0,0]}/><Legend wrapperStyle={{color:T.muted,fontSize:12}}/></BarChart></ResponsiveContainer></div>
    <div style={{...S.card,borderLeft:"3px solid "+(winner==="B"?p.color:winner==="A"?T.accent:T.muted)}}>
      <div style={{fontSize:14,fontWeight:700,color:T.bright,marginBottom:6}}>{winner==="Tie"?"Both models perform similarly on hot lead conversion":"Model "+winner+" shows better hot lead conversion"}</div>
      <div style={{fontSize:13,color:T.text,lineHeight:1.7}}>{winner==="B"?"The "+p.name+" variant produces a hot lead bucket with higher conversion rate than your current model. Consider adopting these adjustments.":winner==="A"?"Your current configuration outperforms this variant. The adjustments would dilute your model's predictive power.":"The conversion rates are too close to call. Try a different variant or make larger adjustments in the Scoring Builder first."}</div>
    </div>
  </div>);
};

const PresentTab = ({processed}) => {
  const st = useMemo(() => { const total=processed.length; const avg=Math.round(processed.reduce((s,l)=>s+l.score,0)/total); const conv=processed.filter(l=>l.converted).length; const cr=(conv/total)*100; const hot=processed.filter(l=>l.score>=80).length; const hConv=processed.filter(l=>l.score>=80&&l.converted).length; const hr=hot>0?(hConv/hot)*100:0; const rev=processed.filter(l=>l.converted).reduce((s,l)=>s+l.dealValue,0);
    const tiers=[{label:"Hot (80-100)",count:processed.filter(l=>l.score>=80).length,conv:processed.filter(l=>l.score>=80&&l.converted).length,color:T.red},{label:"Warm (60-79)",count:processed.filter(l=>l.score>=60&&l.score<80).length,conv:processed.filter(l=>l.score>=60&&l.score<80&&l.converted).length,color:T.amber},{label:"Cool (40-59)",count:processed.filter(l=>l.score>=40&&l.score<60).length,conv:processed.filter(l=>l.score>=40&&l.score<60&&l.converted).length,color:T.blue},{label:"Cold (0-39)",count:processed.filter(l=>l.score<40).length,conv:processed.filter(l=>l.score<40&&l.converted).length,color:T.muted}];
    return {total,avg,conv,cr,hot,hr,rev,tiers}; },[processed]);

  return (<div style={{maxWidth:900,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{fontSize:12,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Lead Scoring & Routing Engine</div>
      <div style={{fontSize:32,fontWeight:800,color:T.bright,letterSpacing:"-0.03em"}}>Performance Overview</div>
      <div style={{fontSize:14,color:T.muted,marginTop:4}}>{st.total} leads processed</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:14}}>
      {[{l:"Leads Scored",v:st.total,c:T.accent},{l:"Avg Score",v:st.avg,c:T.blue},{l:"Conversion Rate",v:pct(st.cr),c:T.green},{l:"Revenue Won",v:fmt(st.rev),c:T.purple}].map((s,i)=>(<div key={i} style={S.stat}><div style={S.statVal(s.c)}>{s.v}</div><div style={S.statLabel}>{s.l}</div></div>))}
    </div>
    <div style={{...S.card,marginTop:14}}><div style={{fontSize:14,fontWeight:700,color:T.bright,textAlign:"center",marginBottom:16}}>Score Tier Breakdown</div>
      <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:600,margin:"0 auto"}}>{st.tiers.map((t,i)=>(<div key={i}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:t.color}}>{t.label}</span><span style={{fontSize:12,color:T.text}}>{t.count} leads {"\u00B7"} {t.count>0?pct((t.conv/t.count)*100):"0%"} conv</span></div><div style={{height:12,borderRadius:6,background:T.surface,overflow:"hidden"}}><div style={{width:(t.count/st.total)*100+"%",height:"100%",borderRadius:6,background:"linear-gradient(90deg,"+t.color+","+t.color+"aa)"}}/></div></div>))}</div>
    </div>
    <div style={{...S.card,borderLeft:"3px solid "+T.red}}><div style={{fontSize:14,fontWeight:700,color:T.bright,marginBottom:4}}>Hot Lead Insight</div><div style={{fontSize:13,color:T.text,lineHeight:1.7}}>{st.hot} leads scored 80+ ({pct((st.hot/st.total)*100)} of pipeline). This tier converts at <span style={{color:T.green,fontWeight:700}}>{pct(st.hr)}</span> {"\u2014"} {st.cr>0?(st.hr/st.cr).toFixed(1):"\u221E"}x the overall average.</div></div>
    <div style={{textAlign:"center",padding:"32px 28px 24px",color:T.muted,fontSize:12,borderTop:"1px solid "+T.border}}>Built by <span style={{color:T.accent,fontWeight:600}}>Antonio Mendoza</span> {"\u00B7"} RevOps Portfolio {"\u00B7"} <a href="https://github.com/AntMend" target="_blank" rel="noopener" style={{color:T.accent,textDecoration:"none"}}>github.com/AntMend</a></div>
  </div>);
};

const TABS = ["Scoring Builder","Routing Rules","Simulation","Analytics","A/B Testing","Present"];

export default function App() {
  const [tab,setTab]=useState(0);
  const [model,setModel]=useState(mkModel);
  const [rules,setRules]=useState(mkRules);
  const [reps,setReps]=useState(DEFAULT_REPS);
  const [showOB,setShowOB]=useState(true);
  const rng=useMemo(()=>seedRand(42),[]);
  const leads=useMemo(()=>generateLeads(rng),[rng]);
  const processed=useMemo(()=>processLeads(leads,model,rules,reps),[leads,model,rules,reps]);

  return (<div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:T.bg,color:T.text,minHeight:"100vh"}}>
    <style>{FONTS}{"\n@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:"+T.surface+"}::-webkit-scrollbar-thumb{background:"+T.border+";border-radius:3px}"}</style>
    {showOB && <Onboarding onClose={()=>setShowOB(false)} />}
    <div style={{padding:"20px 28px 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:T.rSm,background:"linear-gradient(135deg,"+T.accent+","+T.purple+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:T.white}}>LS</div>
        <div><div style={{fontSize:18,fontWeight:700,color:T.bright,letterSpacing:"-0.02em"}}>LeadScore Engine</div><div style={{fontSize:11,color:T.muted,fontWeight:500}}>Lead Scoring & Routing {"\u00B7"} RevOps Portfolio</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Pill color={T.green} bg={T.greenDim}>{"\u25CF"} {processed.length} leads</Pill>
        <button onClick={()=>setShowOB(true)} style={{...S.btnSm(false),fontSize:11}}>? Guide</button>
      </div>
    </div>
    <div style={{display:"flex",gap:2,background:T.surface,borderRadius:T.rSm,padding:3,margin:"16px 28px 0",overflowX:"auto"}}>{TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    <div style={{padding:"20px 28px 32px"}}>
      {tab===0 && <ScoringBuilder model={model} setModel={setModel} />}
      {tab===1 && <RoutingRules rules={rules} setRules={setRules} reps={reps} setReps={setReps} />}
      {tab===2 && <SimulationTab processed={processed} reps={reps} />}
      {tab===3 && <AnalyticsTab processed={processed} reps={reps} />}
      {tab===4 && <ABTestingTab leads={leads} model={model} />}
      {tab===5 && <PresentTab processed={processed} />}
    </div>
  </div>);
}
