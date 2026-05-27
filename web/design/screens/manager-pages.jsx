// ─── Manager Reps & Rules screens ───

function ManagerReps() {
  return (
    <AppShell
      role="manager" active="reps"
      title="Sales reps"
      sub={`${REPS.length} active across the team`}
      actions={<>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6, height:30, padding:'0 10px',
          background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:7,
          width:240, color:'var(--muted)',
        }}>
          {Icon.search}
          <input placeholder="Search reps..." style={{ border:'none', outline:'none', flex:1, background:'transparent', fontSize:12.5, fontFamily:'var(--font-sans)' }}/>
        </div>
        <button className="btn ghost sm">{Icon.filter}<span>Level: All</span></button>
      </>}
    >
      <Card padded={false}>
        <div style={{
          display:'grid', gridTemplateColumns:'1.6fr 110px 90px 90px 90px 100px 80px 40px',
          padding:'10px 18px', borderBottom:'1px solid var(--divider)',
          fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500,
        }}>
          <div>Rep</div><div>Level</div><div style={{ textAlign:'right' }}>Week pts</div><div style={{ textAlign:'right' }}>Total XP</div><div style={{ textAlign:'center' }}>Streak</div><div style={{ textAlign:'center' }}>Badges</div><div style={{ textAlign:'right' }}>Events</div><div></div>
        </div>
        {RANKED.map(r => (
          <div key={r.id} style={{
            display:'grid', gridTemplateColumns:'1.6fr 110px 90px 90px 90px 100px 80px 40px',
            padding:'12px 18px', alignItems:'center',
            borderBottom:'1px solid var(--divider)',
            cursor:'pointer',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={r.name} initials={r.initials} size={28} tone={r.color}/>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{r.email}</div>
              </div>
            </div>
            <div><LevelChip level={r.level} label={r.levelLabel} size="sm"/></div>
            <div style={{ textAlign:'right' }} className="num">
              <span style={{ fontSize:13, fontWeight:600 }}>{r.weekPoints}</span>
            </div>
            <div style={{ textAlign:'right' }} className="num">
              <span style={{ fontSize:13, color:'var(--ink-2)' }}>{r.totalXP}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <Streak days={r.currentStreak} atRisk={r.currentStreak === 0 && r.longestStreak > 0}/>
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:3 }}>
              {Array.from({length: Math.min(r.badges, 4)}).map((_,i) => (
                <BadgeIcon key={i} type={MY_BADGES.earned[i]?.type || BADGE_DEFS[i].type} size={18}/>
              ))}
              {r.badges === 0 && <span style={{ fontSize:11, color:'var(--muted-2)' }}>—</span>}
            </div>
            <div style={{ textAlign:'right', fontSize:12, color:'var(--ink-2)' }} className="num">{r.activity}</div>
            <div style={{ textAlign:'right', color:'var(--muted)' }}>{Icon.chev}</div>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}

function ManagerRules() {
  return (
    <AppShell
      role="manager" active="rules"
      title="Scoring rules"
      sub="Read-only view of the active gamification configuration"
      actions={
        <button className="btn sm" disabled style={{
          opacity:0.5, cursor:'not-allowed', background:'var(--surface)',
          color:'var(--muted)', border:'1px solid var(--border-strong)',
        }}>
          {Icon.lock}<span>Edit rules — coming in MVP</span>
        </button>
      }
    >
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {/* Scoring rules */}
        <Card title="Point values" subtitle="Awarded per scored event" action={
          <span style={{ fontSize:10.5, color:'var(--muted)' }}>Last updated <span className="num">May 12</span></span>
        } padded={false}>
          <div style={{
            display:'grid', gridTemplateColumns:'1.4fr 80px 80px 60px',
            padding:'9px 18px', borderTop:'1px solid var(--divider)', borderBottom:'1px solid var(--divider)',
            fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em',
          }}>
            <div>Event type</div><div style={{ textAlign:'right' }}>Points</div><div style={{ textAlign:'right' }}>Daily cap</div><div style={{ textAlign:'right' }}>Status</div>
          </div>
          {SCORING_RULES.map(r => (
            <div key={r.eventType} style={{
              display:'grid', gridTemplateColumns:'1.4fr 80px 80px 60px',
              padding:'12px 18px', alignItems:'center',
              borderBottom:'1px solid var(--divider)',
            }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-2)' }}>{r.eventType}</div>
              <div style={{ textAlign:'right' }} className="num">
                <span style={{ fontSize:14, fontWeight:600, color: r.points < 0 ? 'var(--danger)' : 'var(--ink)' }}>
                  {r.points > 0 ? '+' : ''}{r.points}
                </span>
              </div>
              <div style={{ textAlign:'right', fontSize:12 }} className="num">
                {r.cap ? <span style={{ color:'var(--ink-2)' }}>{r.cap}/day</span> : <span style={{ color:'var(--muted-2)' }}>—</span>}
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:4, fontSize:11,
                  color:'var(--success)', fontWeight:500,
                }}>
                  <span style={{ width:6, height:6, borderRadius:3, background:'var(--success)' }}/>
                  Active
                </span>
              </div>
            </div>
          ))}
        </Card>

        {/* Level config */}
        <Card title="Level thresholds" subtitle="XP required per level" padded={false}>
          <div style={{
            display:'grid', gridTemplateColumns:'60px 1fr 90px 90px',
            padding:'9px 18px', borderTop:'1px solid var(--divider)', borderBottom:'1px solid var(--divider)',
            fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em',
          }}>
            <div>Level</div><div>Label</div><div style={{ textAlign:'right' }}>Min XP</div><div style={{ textAlign:'right' }}>Reps</div>
          </div>
          {LEVEL_CONFIG.map(l => {
            const count = REPS.filter(r => r.level === l.level).length;
            return (
              <div key={l.level} style={{
                display:'grid', gridTemplateColumns:'60px 1fr 90px 90px',
                padding:'12px 18px', alignItems:'center',
                borderBottom:'1px solid var(--divider)',
              }}>
                <div className="num" style={{ fontSize:13, fontWeight:600 }}>L{l.level}</div>
                <div><LevelChip level={l.level} label={l.label} size="sm"/></div>
                <div style={{ textAlign:'right' }} className="num">{l.minXP}</div>
                <div style={{ textAlign:'right', fontSize:12, color:'var(--ink-2)' }} className="num">{count}</div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Badges */}
      <Card title="Badge catalog" subtitle="All badges, earned and unearned" padded={false}>
        <div style={{ padding:'14px 18px 18px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {BADGE_DEFS.map(def => (
            <div key={def.type} style={{
              display:'flex', gap:12, padding:'14px',
              background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10,
            }}>
              <BadgeIcon type={def.type} size={42}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.005em' }}>{def.name}</span>
                  <span className="chip" style={{ background:'var(--surface)', color:'var(--muted)', height:18, fontSize:10 }}>
                    {def.window === 'lifetime' ? 'lifetime' : 'weekly'}
                  </span>
                </div>
                <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:3, lineHeight:1.45 }}>{def.desc}</div>
                <div style={{ marginTop:7, fontSize:10.5, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>
                  target = {def.target}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

// Per-rep event mix (approximated from totals)
const REP_EVENT_MIX = {
  'u-alice':   [{ v:14, c:'#6c7280' }, { v:8, c:'#4a63b8' }, { v:5, c:'#7a4fbe' }, { v:3, c:'#3a8f63' }, { v:1, c:'#b94a3b' }],
  'u-diana':   [{ v:12, c:'#6c7280' }, { v:9, c:'#4a63b8' }, { v:3, c:'#7a4fbe' }, { v:2, c:'#3a8f63' }, { v:1, c:'#b94a3b' }],
  'u-bob':     [{ v:8,  c:'#6c7280' }, { v:6, c:'#4a63b8' }, { v:7, c:'#7a4fbe' }, { v:1, c:'#3a8f63' }, { v:0, c:'#b94a3b' }],
  'u-charlie': [{ v:10, c:'#6c7280' }, { v:3, c:'#4a63b8' }, { v:2, c:'#7a4fbe' }, { v:1, c:'#3a8f63' }, { v:0, c:'#b94a3b' }],
  'u-evan':    [{ v:8,  c:'#6c7280' }, { v:2, c:'#4a63b8' }, { v:2, c:'#7a4fbe' }, { v:1, c:'#3a8f63' }, { v:1, c:'#b94a3b' }],
  'u-fiona':   [{ v:7,  c:'#6c7280' }, { v:2, c:'#4a63b8' }, { v:4, c:'#7a4fbe' }, { v:1, c:'#3a8f63' }, { v:0, c:'#b94a3b' }],
  'u-george':  [{ v:18, c:'#6c7280' }, { v:1, c:'#4a63b8' }, { v:1, c:'#7a4fbe' }, { v:0, c:'#3a8f63' }, { v:2, c:'#b94a3b' }],
  'u-hannah':  [{ v:0,  c:'#6c7280' }, { v:0, c:'#4a63b8' }, { v:0, c:'#7a4fbe' }, { v:0, c:'#3a8f63' }, { v:0, c:'#b94a3b' }],
};

function StackedBar({ segments, max, width = 100, height = 8 }) {
  const total = segments.reduce((s,seg)=>s+seg.v, 0);
  const m = max || total || 1;
  const fillW = (total / m) * width;
  let x = 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} rx="2" fill="var(--bg-sub)"/>
      <g>
        {segments.map((seg, i) => {
          const w = (seg.v / m) * width;
          const el = <rect key={i} x={x} y={0} width={w} height={height} fill={seg.c}/>;
          x += w;
          return el;
        })}
      </g>
    </svg>
  );
}

function ManagerLeaderboard() {
  const top3 = RANKED.slice(0, 3);
  const rest = RANKED.slice(3);
  const maxEvents = Math.max(...RANKED.map(r => r.activity));
  const totalPts = RANKED.reduce((s,r)=>s+r.weekPoints, 0);
  const median = RANKED[Math.floor(RANKED.length/2)].weekPoints;

  return (
    <AppShell
      role="manager" active="leaderboard"
      title="Leaderboard"
      sub="Team rankings across the week · Acme Sales"
      actions={<>
        <div style={{
          display:'inline-flex', height:30, borderRadius:7, border:'1px solid var(--border-strong)',
          background:'var(--surface)', overflow:'hidden',
        }}>
          {['Weekly','All-time'].map((t, i) => (
            <button key={t} style={{
              padding:'0 14px',
              background: i === 0 ? 'var(--ink)' : 'transparent',
              color: i === 0 ? 'var(--accent-fg)' : 'var(--ink-2)',
              border:'none', fontSize:12, fontWeight:500,
            }}>{t}</button>
          ))}
        </div>
        <button className="btn ghost sm">
          <span style={{ color:'var(--muted)' }}>{Icon.clock}</span>
          <span className="num">2025-W21</span>
          <span style={{ color:'var(--muted)' }}>{Icon.chev}</span>
        </button>
        <button className="btn ghost sm">{Icon.filter}<span>All levels</span></button>
        <button className="btn sm">{Icon.ext}<span>Export</span></button>
      </>}
    >
      {/* ─── Podium hero ─── */}
      <div className="card" style={{ padding:'24px 24px 28px', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Week 21 standings</div>
            <h2 style={{ margin:'4px 0 0', fontSize:22, fontWeight:600, letterSpacing:'-0.015em' }}>Top performers</h2>
          </div>
          <div style={{ display:'flex', gap:18, fontSize:11, color:'var(--muted)' }}>
            <span><span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>2d 9h</span> until close</span>
            <span>Total <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{totalPts}</span> pts</span>
            <span>Median <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{median}</span> pts</span>
            <span>Leader gap <span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{top3[0].weekPoints - top3[1].weekPoints}</span> pts</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.15fr 1fr', gap:18, alignItems:'end' }}>
          {[top3[1], top3[0], top3[2]].map((r) => {
            const isFirst = r.rank === 1;
            const isSecond = r.rank === 2;
            const lift = isFirst ? 0 : isSecond ? 18 : 30;
            const mix = REP_EVENT_MIX[r.id];
            return (
              <div key={r.id} style={{ position:'relative', transform:`translateY(${lift}px)` }}>
                {isFirst && (
                  <div style={{ position:'absolute', top:-30, left:'50%', transform:'translateX(-50%)' }}>
                    <Crown size={36} color="#b88420"/>
                  </div>
                )}
                <div style={{
                  background: isFirst ? 'var(--lv4-soft)' : 'var(--surface-2)',
                  border: isFirst ? '1px solid #ead7ad' : '1px solid var(--border)',
                  borderRadius:14,
                  padding:'18px 18px 16px',
                }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <Medal rank={r.rank} size={isFirst ? 50 : 42}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar name={r.name} initials={r.initials} size={36} tone={r.color}/>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.005em' }}>{r.name}</div>
                          <div style={{ fontSize:11, color:'var(--muted)' }}>{r.levelLabel} · {r.activity} events</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop:14, display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Week pts</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:2 }}>
                        <span className="num" style={{ fontSize:isFirst ? 28 : 22, fontWeight:600, letterSpacing:'-0.02em', color: isFirst ? 'var(--lv4)' : 'var(--ink)' }}>{r.weekPoints}</span>
                        <RankDelta delta={r.delta}/>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Streak</div>
                      <div style={{ marginTop:4 }}><Streak days={r.currentStreak}/></div>
                    </div>
                    <div>
                      <div style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Badges</div>
                      <div style={{ display:'flex', gap:2, marginTop:4 }}>
                        {Array.from({length: Math.min(r.badges, 4)}).map((_, i) => (
                          <BadgeIcon key={i} type={MY_BADGES.earned[i]?.type || BADGE_DEFS[i].type} size={18}/>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>Event mix</div>
                    <StackedBar segments={mix} max={mix.reduce((s,m)=>s+m.v,0)} width={isFirst ? 280 : 240} height={8}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Full standings ─── */}
      <Card title="Full standings" subtitle={`All ${RANKED.length} reps · sorted by week points`} padded={false}>
        <div style={{
          display:'grid', gridTemplateColumns:'44px 1.5fr 110px 65px 65px 65px 65px 150px 80px 80px',
          padding:'10px 18px', borderBottom:'1px solid var(--divider)',
          fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500, gap:8,
        }}>
          <div>#</div><div>Rep</div><div>Level</div>
          <div style={{ textAlign:'right' }}>Calls</div>
          <div style={{ textAlign:'right' }}>Mtgs</div>
          <div style={{ textAlign:'right' }}>Stages</div>
          <div style={{ textAlign:'right' }}>Wins</div>
          <div>Event mix</div>
          <div style={{ textAlign:'center' }}>Δ rank</div>
          <div style={{ textAlign:'right' }}>Points</div>
        </div>
        {RANKED.map(r => {
          const mix = REP_EVENT_MIX[r.id];
          return (
            <div key={r.id} style={{
              display:'grid', gridTemplateColumns:'44px 1.5fr 110px 65px 65px 65px 65px 150px 80px 80px',
              padding:'12px 18px', alignItems:'center',
              borderBottom:'1px solid var(--divider)', gap:8,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {r.rank <= 3
                  ? <Medal rank={r.rank} size={24}/>
                  : <span className="num" style={{ fontSize:13, color:'var(--ink-2)' }}>{r.rank}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar name={r.name} initials={r.initials} size={28} tone={r.color}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{r.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{r.email}</div>
                </div>
              </div>
              <div><LevelChip level={r.level} label={r.levelLabel} size="sm"/></div>
              <div style={{ textAlign:'right', fontSize:12, color:'var(--ink-2)' }} className="num">{mix[0].v || '—'}</div>
              <div style={{ textAlign:'right', fontSize:12, color:'var(--ink-2)' }} className="num">{mix[1].v || '—'}</div>
              <div style={{ textAlign:'right', fontSize:12, color:'var(--ink-2)' }} className="num">{mix[2].v || '—'}</div>
              <div style={{ textAlign:'right', fontSize:12, fontWeight:600, color: mix[3].v > 0 ? 'var(--success)' : 'var(--muted-2)' }} className="num">{mix[3].v || '—'}</div>
              <div><StackedBar segments={mix} max={maxEvents} width={140} height={7}/></div>
              <div style={{ display:'flex', justifyContent:'center' }}><RankDelta delta={r.delta}/></div>
              <div style={{ textAlign:'right' }} className="num">
                <span style={{ fontSize:14, fontWeight:600 }}>{r.weekPoints}</span>
              </div>
            </div>
          );
        })}
      </Card>
    </AppShell>
  );
}

Object.assign(window, { ManagerReps, ManagerRules, ManagerLeaderboard });
