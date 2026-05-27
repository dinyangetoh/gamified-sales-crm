// ─── Manager Dashboard v2 — behavior insights & charts ───
function ManagerDashboard() {
  const top3 = RANKED.slice(0, 3);
  const atRisk = RANKED.filter(r => r.weekPoints < 150);
  const totalEvents = REPS.reduce((s, r) => s + r.activity, 0);
  const totalPoints = REPS.reduce((s, r) => s + r.weekPoints, 0);
  const findRep = id => RANKED.find(r => r.id === id);

  return (
    <AppShell
      role="manager" active="dashboard"
      title="Team overview"
      sub="Acme Sales · Week 21 · May 19 – 25"
      actions={<>
        <button className="btn ghost sm">{Icon.filter}<span>All reps</span></button>
        <button className="btn ghost sm">{Icon.clock}<span className="num">W21</span><span style={{ color:'var(--muted)' }}>{Icon.chev}</span></button>
        <button className="btn sm">{Icon.ext}<span>Export</span></button>
      </>}
    >
      {/* ─── KPI strip ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14, marginBottom:14 }}>
        {[
          { label:'Active reps',    value:'7', unit:`/ ${REPS.length}`, delta:0,   trend:[5,6,7,6,7,7,7,7],     color:'var(--ink)' },
          { label:'Events',         value:totalEvents,                  delta:0,   trend:TEAM_EVENTS_TS,         color:'var(--lv2)' },
          { label:'Points awarded', value:totalPoints.toLocaleString(), delta:13,  trend:TEAM_POINTS_TS,         color:'var(--lv4)' },
          { label:'Win rate',       value:'68%',                        delta:5,   trend:[55,58,60,62,65,66,68,68], color:'var(--success)' },
          { label:'Badges earned',  value:'3', unit:'· 14 lifetime',    delta:50,  trend:[0,1,1,0,2,1,2,3],      color:'var(--lv3)' },
        ].map(s => (
          <Card key={s.label} padded={false}>
            <div style={{ padding:'14px 16px' }}>
              <StatWithTrend {...s}/>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── Team activity trend ─── */}
      <Card title="Team activity · 8 week trend" subtitle="Points awarded per week"
        action={<div style={{ display:'flex', gap:12, fontSize:11 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><i style={{ width:8, height:8, borderRadius:2, background:'var(--lv4)' }}/>Points</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><i style={{ width:8, height:2, background:'var(--lv2)' }}/>Events</span>
        </div>}
        style={{ marginBottom:14 }}
      >
        <DualMetricChart
          primary={TEAM_POINTS_TS}
          secondary={TEAM_EVENTS_TS}
          labels={TEAM_WEEKS}
          width={1380} height={180}
        />
      </Card>

      {/* ─── Row: Event mix · Level dist · Top reps ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:14, marginBottom:14 }}>
        <Card title="Event mix" subtitle="Week 21 · 122 events">
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <Donut data={TEAM_EVENT_MIX} size={140} thickness={18} centerLabel="122" centerSub="events"/>
            <div style={{ flex:1, minWidth:0 }}><DonutLegend data={TEAM_EVENT_MIX}/></div>
          </div>
        </Card>

        <Card title="Level distribution" subtitle={`${REPS.length} reps · 1 Legend`}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <Donut data={LEVEL_DIST} size={140} thickness={18} centerLabel={REPS.length} centerSub="reps"/>
            <div style={{ flex:1, minWidth:0 }}><DonutLegend data={LEVEL_DIST}/></div>
          </div>
        </Card>

        <Card title="Top performers" subtitle="Week 21" action={
          <a style={{ fontSize:11, color:'var(--muted)', textDecoration:'none' }}>Leaderboard →</a>
        } padded={false}>
          <div style={{ padding:'0 18px 14px' }}>
            {top3.map((r, i) => (
              <div key={r.id} style={{
                display:'grid', gridTemplateColumns:'36px 1fr 80px 60px',
                gap:10, alignItems:'center', padding:'10px 0',
                borderTop: i ? '1px solid var(--divider)' : 'none',
              }}>
                <Medal rank={r.rank} size={32}/>
                <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                  <Avatar name={r.name} initials={r.initials} size={26} tone={r.color}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:600 }}>{r.name}</div>
                    <div style={{ fontSize:10.5, color:'var(--muted)' }}>{r.levelLabel} · {r.activity} events</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }} className="num">
                  <span style={{ fontSize:14, fontWeight:600 }}>{r.weekPoints}</span>
                  <span style={{ fontSize:10, color:'var(--muted)', marginLeft:3 }}>pts</span>
                </div>
                <div style={{ textAlign:'right' }}><RankDelta delta={r.delta}/></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Row: Heatmap + Day-of-week ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14, marginBottom:14 }}>
        <Card title="Activity heatmap" subtitle="When the team is most active · day × time of day">
          <Heatmap data={ACTIVITY_HEATMAP} width={820} height={150}
            days={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
            hours={['8a–10a','10a–12p','12p–2p','2p–4p','4p–6p']}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, fontSize:11, color:'var(--muted)' }}>
            <span>Peak: <span style={{ color:'var(--ink)', fontWeight:600 }}>Tuesday 10a–12p</span></span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span>Less</span>
              <div style={{ display:'flex', gap:2 }}>
                {[0.1, 0.3, 0.5, 0.7, 1].map(o => <span key={o} style={{ width:14, height:10, background:'var(--ink)', opacity:o, borderRadius:2 }}/>)}
              </div>
              <span>More</span>
            </div>
          </div>
        </Card>

        <Card title="Day of week" subtitle="Events logged · Week 21">
          <BarChart data={DOW_ACTIVITY} width={520} height={150} color="var(--lv2)"
            labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'var(--muted)' }}>
            <span>Mon–Fri <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{DOW_ACTIVITY.slice(0,5).reduce((a,b)=>a+b,0)}</span></span>
            <span>Weekend <span className="num">{DOW_ACTIVITY.slice(5).reduce((a,b)=>a+b,0)}</span></span>
            <span>Avg/day <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{Math.round(DOW_ACTIVITY.reduce((a,b)=>a+b,0)/7)}</span></span>
          </div>
        </Card>
      </div>

      {/* ─── Row: Top by category + At-risk ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
        <Card title="Top performers by category" subtitle="Who's strongest at what" padded={false}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', borderTop:'1px solid var(--divider)' }}>
            {[
              { key:'calls',    label:'Calls',         unit:'leads',     icon:Icon.send },
              { key:'meetings', label:'Meetings',      unit:'completed', icon:Icon.people },
              { key:'pipeline', label:'Pipeline',      unit:'advances',  icon:Icon.list },
              { key:'wins',     label:'Deals won',     unit:'closed',    icon:Icon.trophy },
            ].map((cat, idx) => {
              const list = TOP_BY[cat.key];
              return (
                <div key={cat.key} style={{
                  padding:'14px 16px',
                  borderRight: idx < 3 ? '1px solid var(--divider)' : 'none',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)' }}>
                    {cat.icon}
                    <span style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>{cat.label}</span>
                  </div>
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                    {list.map((entry, i) => {
                      const rep = findRep(entry.id);
                      return (
                        <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span className="num" style={{ width:12, fontSize:10.5, color:'var(--muted)', fontWeight: i === 0 ? 600 : 400 }}>{i+1}</span>
                          <Avatar name={rep.name} initials={rep.initials} size={22} tone={rep.color}/>
                          <span style={{ flex:1, fontSize:11.5, fontWeight: i === 0 ? 600 : 500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {rep.name.split(' ')[0]}
                          </span>
                          <span className="num" style={{ fontSize:12, fontWeight:600, color: i === 0 ? 'var(--ink)' : 'var(--ink-2)' }}>{entry.v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Needs attention" subtitle="Reps to follow up with" padded={false}>
          <div style={{ padding:'4px 18px 14px' }}>
            {atRisk.map(r => {
              const reason = r.weekPoints === 0 ? 'No activity this week' :
                             r.currentStreak === 0 && r.longestStreak > 0 ? 'Streak just broke' :
                             'Below team average';
              const tone = r.weekPoints === 0 ? 'danger' : 'warn';
              return (
                <div key={r.id} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 0',
                  borderBottom:'1px solid var(--divider)',
                }}>
                  <Avatar name={r.name} initials={r.initials} size={30} tone={r.color}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:500 }}>{r.name}</div>
                    <div style={{ fontSize:10.5, color: tone === 'danger' ? 'var(--danger)' : 'var(--warn)' }}>{reason}</div>
                  </div>
                  <span className="num" style={{ fontSize:11.5, color:'var(--muted)' }}>{r.weekPoints} pts</span>
                </div>
              );
            })}
            <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--divider)' }}>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>Streak at risk tonight</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Avatar name="Fiona Walsh" initials="FW" size={24} tone="lv-3"/>
                <span style={{ fontSize:12, flex:1 }}>Fiona Walsh</span>
                <Streak days={5} atRisk/>
                <button className="btn ghost sm" style={{ height:22, padding:'0 8px', fontSize:10.5 }}>Nudge</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Dual metric chart (line + bar overlay) ───
function DualMetricChart({ primary, secondary, labels, width, height }) {
  const max1 = Math.max(...primary, 1);
  const max2 = Math.max(...secondary, 1);
  const pad = { l:40, r:40, t:14, b:24 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const stepX = primary.length > 1 ? W / (primary.length - 1) : W;
  const pts = primary.map((v, i) => [pad.l + i * stepX, pad.t + H - (v / max1) * H]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const area = `${d} L${pad.l + W},${pad.t + H} L${pad.l},${pad.t + H} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {[max1, max1*0.66, max1*0.33, 0].map((t, i) => {
        const y = pad.t + H - (t / max1) * H;
        return <g key={i}>
          {i > 0 && i < 3 && <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)" strokeDasharray="2,3"/>}
          {i === 3 && <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)"/>}
          <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--muted-2)" fontFamily="var(--font-mono)">{Math.round(t)}</text>
        </g>;
      })}
      {/* secondary bars */}
      {secondary.map((v, i) => {
        const h = (v / max2) * H;
        const barW = stepX * 0.22;
        const x = pad.l + i * stepX - barW/2;
        return <rect key={i} x={x} y={pad.t + H - h} width={barW} height={h} fill="var(--lv2)" opacity="0.3" rx="2"/>;
      })}
      {/* secondary axis labels (right) */}
      {[max2, max2*0.66, max2*0.33].map((t, i) => {
        const y = pad.t + H - (t / max2) * H;
        return <text key={i} x={pad.l + W + 6} y={y + 3} textAnchor="start" fontSize="10" fill="var(--lv2)" fontFamily="var(--font-mono)" opacity="0.75">{Math.round(t)}</text>;
      })}
      {/* primary area + line */}
      <path d={area} fill="var(--lv4-soft)" opacity="0.65"/>
      <path d={d} fill="none" stroke="var(--lv4)" strokeWidth="2" strokeLinejoin="round"/>
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--surface)" stroke="var(--lv4)" strokeWidth="2"/>)}
      {labels.map((l, i) => (
        <text key={i} x={pad.l + i * stepX} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">{l}</text>
      ))}
    </svg>
  );
}

Object.assign(window, { ManagerDashboard, DualMetricChart });
