// ─── Chart primitives + medal/crown glyphs ───

// Crown SVG — minimal stylized, no garish gradient
function Crown({ size = 18, color = '#b88420' }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 28 20" fill="none">
      <path d="M2 6 L7 14 L14 3 L21 14 L26 6 L24 18 L4 18 Z"
            fill={color} stroke={color} strokeLinejoin="round" strokeWidth="1.2"/>
      <circle cx="2" cy="5" r="1.8" fill={color}/>
      <circle cx="14" cy="2" r="1.8" fill={color}/>
      <circle cx="26" cy="5" r="1.8" fill={color}/>
    </svg>
  );
}

// Medal — hexagonal frame with rank number
function Medal({ rank, size = 44 }) {
  const palette = {
    1: { bg:'#f4e7c8', border:'#b88420', ink:'#7a5a14' },
    2: { bg:'#e2e1dc', border:'#9c9890', ink:'#54514a' },
    3: { bg:'#ebd6c3', border:'#a86b3e', ink:'#6d3f1d' },
  }[rank] || { bg:'var(--bg-sub)', border:'var(--border-strong)', ink:'var(--ink-2)' };
  return (
    <span style={{ position:'relative', display:'inline-flex', width:size, height:size*1.1 }}>
      <svg width={size} height={size*1.1} viewBox="0 0 44 48" style={{ position:'absolute', inset:0 }}>
        <path d="M22 2 L40 11 L40 33 L22 46 L4 33 L4 11 Z"
              fill={palette.bg} stroke={palette.border} strokeWidth="1.5"/>
        <path d="M22 6 L36 13 L36 31 L22 42 L8 31 L8 13 Z"
              fill="none" stroke={palette.border} strokeOpacity="0.35" strokeWidth="1"/>
      </svg>
      <span style={{
        position:'relative', margin:'auto',
        fontFamily:'var(--font-mono)', fontWeight:700,
        color: palette.ink, fontSize: size * 0.42, letterSpacing:'-0.04em',
      }}>{rank}</span>
    </span>
  );
}

// ─── Sparkline (line) ───
function Sparkline({ data, width = 100, height = 28, color = 'currentColor', fill }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      {fill && <path d={area} fill={fill} opacity="0.5"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── Area chart with axis ───
function AreaChart({ data, width = 600, height = 160, color = 'var(--ink)', fillColor = 'var(--bg-sub)', labels, yTicks = 3 }) {
  const max = Math.max(...data, 1);
  const pad = { l:30, r:8, t:10, b:22 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const stepX = data.length > 1 ? W / (data.length - 1) : W;
  const pts = data.map((v, i) => [pad.l + i * stepX, pad.t + H - (v / max) * H]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const area = `${d} L${pad.l + W},${pad.t + H} L${pad.l},${pad.t + H} Z`;
  const ticks = Array.from({length: yTicks + 1}, (_, i) => Math.round((max * i) / yTicks));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block' }}>
      {ticks.map((t, i) => {
        const y = pad.t + H - (t / max) * H;
        return <g key={i}>
          <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)" strokeDasharray={i === 0 ? '0' : '2,3'}/>
          <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9.5" fill="var(--muted-2)" fontFamily="var(--font-mono)">{t}</text>
        </g>;
      })}
      <path d={area} fill={fillColor}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--surface)" stroke={color} strokeWidth="1.5"/>)}
      {labels && labels.map((l, i) => (
        <text key={i} x={pad.l + i * stepX} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">{l}</text>
      ))}
    </svg>
  );
}

// ─── Bar chart (horizontal categories) ───
function BarChart({ data, width = 600, height = 160, max, color = 'var(--ink)', labels }) {
  const m = max || Math.max(...data, 1);
  const pad = { l:30, r:8, t:10, b:22 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const barW = W / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block' }}>
      <line x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} stroke="var(--divider)"/>
      {[m, m/2, 0].map((t, i) => {
        const y = pad.t + H - (t / m) * H;
        return <text key={i} x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9.5" fill="var(--muted-2)" fontFamily="var(--font-mono)">{Math.round(t)}</text>;
      })}
      {data.map((v, i) => {
        const h = (v / m) * H;
        const x = pad.l + i * barW + barW * 0.18;
        const w = barW * 0.64;
        const y = pad.t + H - h;
        return <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={color} rx="2"/>
          {labels && <text x={x + w/2} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">{labels[i]}</text>}
        </g>;
      })}
    </svg>
  );
}

// ─── Donut chart with center label ───
function Donut({ data, size = 140, thickness = 18, centerLabel, centerSub, gap = 2 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-sub)" strokeWidth={thickness}/>
      {data.map((d, i) => {
        const len = (d.value / total) * circ - gap;
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                  stroke={d.color} strokeWidth={thickness}
                  strokeDasharray={`${Math.max(0, len)} ${circ - len}`}
                  strokeDashoffset={-off} strokeLinecap="butt"
                  transform={`rotate(-90 ${cx} ${cy})`}/>
        );
        off += len + gap;
        return seg;
      })}
      {centerLabel && (
        <g>
          <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * 0.18} fontWeight="600"
                fill="var(--ink)" fontFamily="var(--font-mono)" letterSpacing="-0.03em">{centerLabel}</text>
          {centerSub && <text x={cx} y={cy + size * 0.16} textAnchor="middle" fontSize="10" fill="var(--muted)">{centerSub}</text>}
        </g>
      )}
    </svg>
  );
}

// ─── Donut legend (renders below donut) ───
function DonutLegend({ data, total }) {
  const sum = total || data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {data.map(d => (
        <div key={d.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }}/>
          <span style={{ flex:1, fontSize:11.5, color:'var(--ink-2)' }}>{d.label}</span>
          <span className="num" style={{ fontSize:11.5, fontWeight:600 }}>{d.value}</span>
          <span style={{ fontSize:10.5, color:'var(--muted)', width:36, textAlign:'right' }} className="num">{Math.round((d.value / sum) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Activity heatmap (day-of-week × hour-bucket) ───
function Heatmap({ data, width = 540, height = 130, days = ['M','T','W','T','F','S','S'], hours }) {
  // data: array of rows (one per day), each row is array of cell values
  const cols = data[0].length;
  const rows = data.length;
  const pad = { l:20, t:8, r:0, b:18 };
  const cellW = (width - pad.l - pad.r) / cols;
  const cellH = (height - pad.t - pad.b) / rows;
  const max = Math.max(...data.flat(), 1);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((row, y) => row.map((v, x) => {
        const opacity = v === 0 ? 0.08 : 0.18 + (v / max) * 0.82;
        return <rect key={`${y}-${x}`}
          x={pad.l + x * cellW + 1} y={pad.t + y * cellH + 1}
          width={cellW - 2} height={cellH - 2}
          rx="2" fill="var(--ink)" fillOpacity={opacity}/>;
      }))}
      {days.map((d, i) => (
        <text key={i} x={pad.l - 6} y={pad.t + i * cellH + cellH/2 + 3} textAnchor="end"
              fontSize="9.5" fill="var(--muted)">{d}</text>
      ))}
      {hours && hours.map((h, i) => (
        <text key={i} x={pad.l + i * cellW + cellW/2} y={height - 5}
              textAnchor="middle" fontSize="9" fill="var(--muted-2)" fontFamily="var(--font-mono)">{h}</text>
      ))}
    </svg>
  );
}

// ─── Mini segmented bar (a row of N segments, k filled) ───
function SegmentBar({ filled, total, color = 'var(--ink)', height = 6, gap = 2 }) {
  return (
    <div style={{ display:'flex', gap, alignItems:'center' }}>
      {Array.from({length: total}).map((_, i) => (
        <div key={i} style={{
          flex:1, height, borderRadius:1,
          background: i < filled ? color : 'var(--bg-sub)',
        }}/>
      ))}
    </div>
  );
}

// ─── Tiny stat with sparkline ───
function StatWithTrend({ label, value, unit, delta, trend, color = 'var(--ink)' }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
      <div>
        <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>{label}</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:5, marginTop:6 }}>
          <span className="num" style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>{value}</span>
          {unit && <span style={{ fontSize:11, color:'var(--muted)' }}>{unit}</span>}
          {delta !== undefined && (
            <span style={{
              fontSize:11, fontWeight:600,
              color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)',
            }} className="num">{delta > 0 ? '+' : ''}{delta}%</span>
          )}
        </div>
      </div>
      {trend && (
        <div style={{ color, opacity:0.75 }}>
          <Sparkline data={trend} width={70} height={24} color={color} fill={color}/>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Crown, Medal, Sparkline, AreaChart, BarChart, Donut, DonutLegend, Heatmap, SegmentBar, StatWithTrend });
