// ─── Shared UI primitives + AppShell ────────────────────────────

// Inline SVG icons — pure shapes per system guidance, no complex art
const Icon = {
  dashboard: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="2" width="5.5" height="5.5" rx="1"/><rect x="2" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/></svg>,
  trophy: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3h8v3a4 4 0 0 1-8 0V3z"/><path d="M4 4H2.5a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2H4M12 4h1.5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H12"/><path d="M6 13h4M8 10v3"/></svg>,
  list: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/></svg>,
  people: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5.5" r="2.5"/><path d="M2 13.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5"/><circle cx="11.5" cy="6" r="1.8"/><path d="M10.5 9.7c1.2.2 3.5 1 3.5 3.3"/></svg>,
  rules: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2v12M3 5h7l1.5 2L10 9H3"/></svg>,
  mail: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2.5 4l5.5 4.5L13.5 4"/></svg>,
  bolt: <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 1.5L3.5 9h4l-1 5.5L13 7H9l0-5.5z" strokeLinejoin="round"/></svg>,
  flame: <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5s-1 2.4-3 4-2.5 3.2-2.5 5A5.5 5.5 0 0 0 8 16a5.5 5.5 0 0 0 5.5-5.5c0-2.5-1.5-3.6-2.5-5-.7-1-1-3-3-4z"/></svg>,
  arrow: dir => dir > 0
    ? <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12V4M4 7l4-3 4 3"/></svg>
    : dir < 0
    ? <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 4v8M4 9l4 3 4-3"/></svg>
    : <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8h8"/></svg>,
  chev: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4"/></svg>,
  search: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>,
  plus: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>,
  check: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3 3 7-7"/></svg>,
  x: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  lock: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>,
  warn: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l6.5 11h-13L8 2z"/><path d="M8 7v3M8 11.5v.5" strokeLinecap="round"/></svg>,
  clock: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2"/></svg>,
  dot: <svg viewBox="0 0 8 8" width="6" height="6" fill="currentColor"><circle cx="4" cy="4" r="3"/></svg>,
  send: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2L2 7l5 2 2 5 5-12z" strokeLinejoin="round"/></svg>,
  filter: <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4"/></svg>,
  ext: <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3H3v10h10V10M9 3h4v4M13 3L7 9"/></svg>,
};

// ─── Logo ───
function Logo({ size = 22 }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      <span style={{
        width:size, height:size, borderRadius:6, background:'var(--ink)',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        color:'var(--accent-fg)', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:size*0.55,
        letterSpacing:'-0.04em',
      }}>R</span>
      <span style={{ fontWeight:600, fontSize:14, letterSpacing:'-0.01em' }}>Rally</span>
    </span>
  );
}

// ─── Avatar with initials ───
function Avatar({ name, initials, size = 28, tone }) {
  const palette = {
    'lv-1':['#dcdad3','#3a3730'], 'lv-2':['#dde2f1','#3b4c8c'],
    'lv-3':['#e9defa','#5d3d96'], 'lv-4':['#f1e2bc','#7a5a14'],
    default:['#e9e5d8','#3a3730'],
  };
  const [bg, fg] = palette[tone] || palette.default;
  return (
    <span title={name} style={{
      width:size, height:size, borderRadius:'50%', background:bg, color:fg,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.4, fontWeight:600, letterSpacing:'-0.02em', flexShrink:0,
    }}>{initials}</span>
  );
}

// ─── Level chip ───
function LevelChip({ level, label, size = 'md' }) {
  const s = size === 'sm' ? { padding:'0 7px', height:18, fontSize:10 } : { padding:'0 9px', height:22, fontSize:11 };
  return (
    <span className={`chip lv-${level}`} style={{ ...s, fontWeight:600, letterSpacing:'-0.005em' }}>
      <span style={{ fontFamily:'var(--font-mono)', opacity:0.6 }}>L{level}</span>
      <span>{label}</span>
    </span>
  );
}

// ─── Streak flame ───
function Streak({ days, atRisk }) {
  if (!days) return <span style={{ color:'var(--muted-2)', fontSize:12 }}>—</span>;
  const color = atRisk ? 'var(--warn)' : days >= 7 ? 'var(--flame)' : 'var(--ink-2)';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, color, fontSize:12, fontWeight:500 }}>
      <span style={{ display:'inline-flex' }}>{Icon.flame}</span>
      <span className="num">{days}</span>
    </span>
  );
}

// ─── Badge shield (icon glyph) ───
function BadgeIcon({ type, size = 36, locked, dimmed }) {
  const def = BADGE_DEFS.find(b => b.type === type);
  if (!def) return null;
  const tones = {
    success: ['#3a8f63','#e1f0e6'],
    flame:   ['#d96a37','#fbe7d8'],
    'lv-2':  ['#4a63b8','#e0e4f3'],
    'lv-3':  ['#7a4fbe','#ece1f3'],
    'lv-4':  ['#b88420','#f4e7c8'],
  };
  const [fg, bg] = tones[def.tone] || tones['lv-2'];
  const dimStyle = locked
    ? { filter:'grayscale(1)', opacity:0.45 }
    : dimmed ? { opacity:0.6 } : {};
  return (
    <span title={def.name} style={{
      width:size, height:size*1.1, position:'relative', display:'inline-flex',
      ...dimStyle,
    }}>
      <svg width={size} height={size*1.1} viewBox="0 0 36 40" style={{ position:'absolute', inset:0 }}>
        <path d="M18 1 L34 8 L34 24 Q34 30 18 39 Q2 30 2 24 L2 8 Z"
              fill={bg} stroke={fg} strokeOpacity="0.45" strokeWidth="1" />
      </svg>
      <span style={{
        position:'relative', zIndex:1, margin:'auto',
        fontFamily:'var(--font-mono)', fontWeight:600,
        color:fg, fontSize:size*0.34, paddingBottom:size*0.05,
        letterSpacing:'-0.05em',
      }}>{def.glyph}</span>
    </span>
  );
}

// ─── Card ───
function Card({ title, subtitle, action, padded = true, children, style }) {
  return (
    <section className="card" style={style}>
      {(title || action) && (
        <header style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px 12px',
        }}>
          <div>
            {title && <h3 style={{ margin:0, fontSize:13, fontWeight:600, letterSpacing:'-0.005em' }}>{title}</h3>}
            {subtitle && <p style={{ margin:'2px 0 0', fontSize:11.5, color:'var(--muted)' }}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: padded ? '0 18px 16px' : 0 }}>{children}</div>
    </section>
  );
}

// ─── Stat tile ───
function Stat({ label, value, unit, hint, tone }) {
  return (
    <div>
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:6 }}>
        <span className="num" style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.02em', color: tone === 'flame' ? 'var(--flame)' : 'var(--ink)' }}>{value}</span>
        {unit && <span style={{ fontSize:12, color:'var(--muted)' }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{hint}</div>}
    </div>
  );
}

// ─── Progress bar with optional label ───
function Progress({ value, max = 100, tone = 'ink', height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const fill = { ink:'var(--ink)', flame:'var(--flame)', success:'var(--success)', 'lv-3':'var(--lv3)', 'lv-4':'var(--lv4)' }[tone] || 'var(--ink)';
  return (
    <div className="bar" style={{ height }}>
      <i style={{ right:`${100-pct}%`, background:fill }} />
    </div>
  );
}

// ─── Rank delta chip ───
function RankDelta({ delta }) {
  if (delta === 0) {
    return <span style={{ display:'inline-flex', alignItems:'center', gap:3, color:'var(--muted)', fontSize:11 }}>{Icon.arrow(0)} —</span>;
  }
  const up = delta > 0;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      color: up ? 'var(--success)' : 'var(--danger)',
      fontSize:11, fontWeight:600,
    }}>
      {Icon.arrow(up ? 1 : -1)}
      <span className="num">{Math.abs(delta)}</span>
    </span>
  );
}

// ─── Sidebar nav item ───
function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, width:'100%',
      padding:'7px 10px', borderRadius:7,
      background: active ? 'var(--bg-sub)' : 'transparent',
      color: active ? 'var(--ink)' : 'var(--ink-2)',
      border:'none', cursor:'pointer', textAlign:'left',
      fontSize:13, fontWeight: active ? 500 : 450,
      transition:'background .12s',
    }}>
      <span style={{ color: active ? 'var(--ink)' : 'var(--muted)', display:'inline-flex' }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {badge && <span className="chip" style={{ height:18, padding:'0 6px', fontSize:10, background:'var(--bg)', color:'var(--muted)' }}>{badge}</span>}
    </button>
  );
}

// ─── AppShell — sidebar + topbar layout ───
function AppShell({ role = 'rep', active, title, sub, actions, children, navOverride }) {
  const repNav = [
    { id:'dashboard',   icon:Icon.dashboard, label:'Dashboard' },
    { id:'leaderboard', icon:Icon.trophy,    label:'Leaderboard' },
    { id:'activity',    icon:Icon.list,      label:'Activity' },
  ];
  const mgrNav = [
    { id:'dashboard',   icon:Icon.dashboard, label:'Overview' },
    { id:'leaderboard', icon:Icon.trophy,    label:'Leaderboard' },
    { id:'reps',        icon:Icon.people,    label:'Reps', badge:'8' },
    { id:'rules',       icon:Icon.rules,     label:'Rules' },
    { id:'emails',      icon:Icon.mail,      label:'Email Templates' },
  ];
  const nav = navOverride || (role === 'manager' ? mgrNav : repNav);
  const user = role === 'manager'
    ? { name:'Morgan Vale', initials:'MV', sub:'Manager', tone:'lv-3' }
    : { name:ME.name, initials:ME.initials, sub:`L${ME.level} ${ME.levelLabel}`, tone:'lv-4' };

  return (
    <div className="app" style={{ display:'flex', height:'100%', width:'100%' }}>
      {/* Sidebar */}
      <aside style={{
        width:220, flexShrink:0,
        background:'var(--bg)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        padding:'16px 12px',
      }}>
        <div style={{ padding:'4px 8px 18px' }}><Logo /></div>

        {role === 'manager' && (
          <div style={{ padding:'0 8px 10px' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'6px 8px', background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:7, fontSize:12, color:'var(--ink-2)',
            }}>
              <span style={{ width:6, height:6, borderRadius:3, background:'var(--success)' }} />
              <span style={{ flex:1 }}>Acme Sales Org</span>
              <span style={{ color:'var(--muted-2)' }}>{Icon.chev}</span>
            </div>
          </div>
        )}

        <nav style={{ display:'flex', flexDirection:'column', gap:2, marginTop:4 }}>
          {nav.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={active === n.id} badge={n.badge} />)}
        </nav>

        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 8px',
            borderRadius:8, background:'var(--surface)', border:'1px solid var(--border)',
          }}>
            <Avatar name={user.name} initials={user.initials} size={30} tone={user.tone} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{user.sub}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', background:'var(--surface-2)' }}>
        <header style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 28px 14px', borderBottom:'1px solid var(--border)',
          background:'var(--surface-2)',
        }}>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.02em', marginBottom:2 }}>{role === 'manager' ? 'Manager' : 'Sales Rep'}</div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:600, letterSpacing:'-0.015em' }}>{title}</h1>
            {sub && <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{sub}</div>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>{actions}</div>
        </header>
        <div className="scroll" style={{ flex:1, overflow:'auto', padding:'22px 28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, {
  Icon, Logo, Avatar, LevelChip, Streak, BadgeIcon, Card, Stat, Progress, RankDelta, NavItem, AppShell,
});
