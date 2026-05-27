// ─── Rep Activities page ───
function RepActivities() {
  const totals = MY_EVENT_MIX.reduce((s, m) => s + m.value, 0);
  const winRate = Math.round((MY_EVENT_MIX.find(m=>m.label==='DEAL_WON').value / (MY_EVENT_MIX.find(m=>m.label==='DEAL_WON').value + MY_EVENT_MIX.find(m=>m.label==='DEAL_LOST').value)) * 100);
  const weekPts = MY_ACTIVITY_FULL.filter(e => e.date >= '2025-05-19').reduce((s,e)=>s+e.pts, 0);

  // group by date
  const byDate = MY_ACTIVITY_FULL.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <AppShell
      role="rep" active="activity"
      title="Activity"
      sub="Every event scored to your profile, with reasons"
      actions={<>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6, height:30, padding:'0 10px',
          background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:7,
          width:220, color:'var(--muted)',
        }}>
          {Icon.search}
          <input placeholder="Filter by entity..." style={{ border:'none', outline:'none', flex:1, background:'transparent', fontSize:12.5, fontFamily:'var(--font-sans)' }}/>
        </div>
        <button className="btn ghost sm">{Icon.filter}<span>All types</span></button>
        <button className="btn ghost sm">{Icon.clock}<span className="num">Week 21</span></button>
        <button className="btn sm">{Icon.ext}<span>Export</span></button>
      </>}
    >
      {/* Stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:14, marginBottom:14 }}>
        {/* Event mix donut */}
        <Card title="Event mix" subtitle="Week 21 · 19 events">
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <Donut data={MY_EVENT_MIX} size={130} thickness={16} centerLabel={totals} centerSub="events"/>
            <div style={{ flex:1, minWidth:0 }}>
              <DonutLegend data={MY_EVENT_MIX} total={totals}/>
            </div>
          </div>
        </Card>

        <Card padded={false}><div style={{ padding:'16px 18px' }}>
          <StatWithTrend label="Points · week" value={`+${weekPts}`} delta={22} trend={MY_WEEK_PTS} color="var(--lv4)"/>
          <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--divider)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)' }}>
              <span>This week</span><span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>+{weekPts}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginTop:3 }}>
              <span>Last week</span><span className="num">+{MY_PREV_WEEK.reduce((a,b)=>a+b,0)}</span>
            </div>
          </div>
        </div></Card>

        <Card padded={false}><div style={{ padding:'16px 18px' }}>
          <StatWithTrend label="Win rate · 30d" value={`${winRate}%`} delta={5} trend={[40,55,50,60,65,68,70,68]} color="var(--success)"/>
          <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--divider)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)' }}>
              <span>Deals won</span><span className="num" style={{ color:'var(--success)', fontWeight:600 }}>3</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginTop:3 }}>
              <span>Deals lost</span><span className="num" style={{ color:'var(--danger)' }}>1</span>
            </div>
          </div>
        </div></Card>

        <Card padded={false}><div style={{ padding:'16px 18px' }}>
          <StatWithTrend label="Avg / day" value="2.7" unit="events" trend={[2,1,3,2,4,5,3,2,4,3]} color="var(--lv2)"/>
          <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--divider)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)' }}>
              <span>Active days</span><span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>7 / 7</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginTop:3 }}>
              <span>Duplicate / capped</span><span className="num">2</span>
            </div>
          </div>
        </div></Card>
      </div>

      {/* Activity calendar — last 30 days */}
      <Card title="Last 30 days" subtitle="Points scored per day · darker = more" style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:'var(--muted)', width:30 }}>Apr 26</span>
          <div style={{ flex:1, display:'flex', gap:3 }}>
            {MY_LAST_30.map((v, i) => {
              const op = v === 0 ? 0.08 : 0.2 + (v / 100) * 0.8;
              return <div key={i} style={{
                flex:1, height:30, borderRadius:3,
                background:`rgba(184,132,32,${op})`,
                border: i === MY_LAST_30.length - 1 ? '1.5px solid var(--ink)' : 'none',
              }} title={`Day ${i+1}: ${v} pts`}/>;
            })}
          </div>
          <span style={{ fontSize:10, color:'var(--muted)', width:30, textAlign:'right' }}>today</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginTop:10 }}>
          <span><span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{MY_LAST_30.filter(v=>v>0).length}</span> / 30 active days</span>
          <span>Streak <span style={{ color:'var(--flame)', fontWeight:600 }} className="num">{ME.currentStreak}</span></span>
          <span>Best day <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{Math.max(...MY_LAST_30)} pts</span></span>
          <span>Total <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{MY_LAST_30.reduce((a,b)=>a+b,0)} pts</span></span>
        </div>
      </Card>

      {/* Activity log grouped by date */}
      <Card title="Event log" subtitle="Newest first" padded={false}>
        {dates.map(date => {
          const day = byDate[date];
          const dayPts = day.reduce((s,e)=>s+e.pts, 0);
          const d = new Date(date);
          const label = d.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
          return (
            <div key={date}>
              <div style={{
                display:'flex', justifyContent:'space-between', padding:'10px 18px',
                background:'var(--surface-2)', borderTop:'1px solid var(--divider)', borderBottom:'1px solid var(--divider)',
                fontSize:11.5, color:'var(--ink-2)',
              }}>
                <span style={{ fontWeight:600 }}>{label}</span>
                <span style={{ display:'flex', gap:14, alignItems:'center' }}>
                  <span style={{ color:'var(--muted)' }}>{day.length} events</span>
                  <span className="num" style={{ color:dayPts > 0 ? 'var(--success)' : 'var(--muted)', fontWeight:600 }}>+{dayPts} pts</span>
                </span>
              </div>
              {day.map((e, i) => (
                <div key={e.id} style={{
                  display:'grid', gridTemplateColumns:'80px 1fr auto auto 60px',
                  gap:14, alignItems:'center',
                  padding:'10px 18px', borderBottom: i < day.length - 1 ? '1px solid var(--divider)' : 'none',
                  opacity: (e.dup || e.capped) ? 0.85 : 1,
                }}>
                  <span className="num" style={{ fontSize:10.5, color:'var(--muted-2)' }}>{e.id}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)' }}>{e.type}</span>
                      {e.capped && <span className="chip" style={{ background:'var(--warn-soft)', color:'var(--warn)' }}>Cap reached</span>}
                      {e.dup && <span className="chip" style={{ background:'var(--bg-sub)', color:'var(--muted)' }}>Duplicate</span>}
                    </div>
                    <div style={{ fontSize:12.5, color:'var(--ink-2)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.entity}</div>
                  </div>
                  <div className="num" style={{
                    fontSize:13, fontWeight:600,
                    color: e.pts > 0 ? 'var(--success)' : e.pts < 0 ? 'var(--danger)' : 'var(--muted)',
                    minWidth:50, textAlign:'right',
                  }}>
                    {e.pts > 0 ? '+' : ''}{e.pts}
                  </div>
                  <div style={{ fontSize:10.5, color:'var(--muted)', width:80, textAlign:'right', fontFamily:'var(--font-mono)' }}>{e.when}</div>
                  <div style={{ textAlign:'right', color:'var(--muted)' }}>{Icon.chev}</div>
                </div>
              ))}
            </div>
          );
        })}
      </Card>
    </AppShell>
  );
}

window.RepActivities = RepActivities;
