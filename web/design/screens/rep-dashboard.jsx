// ─── Sales Rep Dashboard v2 — motivational + enriched ───
function RepDashboard() {
  const me = ME;
  const nextLevel = LEVEL_CONFIG.find(l => l.level === me.level + 1);
  const xpFloor = LEVEL_CONFIG.find(l => l.level === me.level).minXP;
  const xpInLevel = me.totalXP - xpFloor;
  const xpToNext = nextLevel ? nextLevel.minXP - me.totalXP : 0;
  const xpSpan = nextLevel ? nextLevel.minXP - xpFloor : me.totalXP - xpFloor;
  const aheadOfMe = RANKED.find(r => r.rank === me.rank - 1);
  const behindMe  = RANKED.find(r => r.rank === me.rank + 1);
  const nextBadge = MY_BADGES.inProgress.sort((a,b)=> (b.current/b.target) - (a.current/a.target))[0];
  const nextBadgeDef = BADGE_DEFS.find(b => b.type === nextBadge.type);

  return (
    <AppShell
      role="rep" active="dashboard"
      title="Good afternoon, Alice"
      sub={`Week 21 · ${new Date('2025-05-26').toLocaleDateString('en-US',{ month:'long', day:'numeric'})} · Acme Sales`}
      actions={<>
        <button className="btn ghost sm">{Icon.list}<span>Activity</span></button>
        <button className="btn sm">{Icon.bolt}<span>Log event</span></button>
      </>}
    >
      {/* ─── Hero row ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:14, marginBottom:14 }}>

        {/* XP + Level — featured */}
        <Card padded={false} style={{ overflow:'hidden' }}>
          <div style={{ padding:'18px 20px 8px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>Experience · all time</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:4 }}>
                <span className="num" style={{ fontSize:46, fontWeight:600, letterSpacing:'-0.03em', lineHeight:1 }}>{me.totalXP}</span>
                <span style={{ fontSize:14, color:'var(--muted)' }}>XP</span>
              </div>
            </div>
            <LevelChip level={me.level} label={me.levelLabel}/>
          </div>

          <div style={{ padding:'8px 20px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:6 }}>
              <span><span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>{xpInLevel}</span> / {xpSpan} XP in tier</span>
              {nextLevel
                ? <span><span className="num" style={{ color:'var(--lv4)', fontWeight:600 }}>{xpToNext}</span> XP to {nextLevel.label}</span>
                : <span style={{ color:'var(--lv4)', fontWeight:600 }}>Top tier reached</span>}
            </div>
            <div style={{ height:10, background:'var(--bg-sub)', borderRadius:999, overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, right:`${100 - (xpInLevel/xpSpan)*100}%`, background:'var(--lv4)', borderRadius:999 }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
              {LEVEL_CONFIG.map(l => {
                const reached = l.level <= me.level;
                return (
                  <div key={l.level} style={{ display:'flex', flexDirection:'column', alignItems:'center', opacity: reached ? 1 : 0.45, gap:3 }}>
                    <span style={{
                      width:18, height:18, borderRadius:9,
                      background: reached ? `var(--lv${l.level})` : 'var(--bg-sub)',
                      color: reached ? '#fff' : 'var(--muted)',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700,
                    }}>{reached ? '✓' : l.level}</span>
                    <span style={{ fontSize:10, color:'var(--ink-2)', fontWeight:500 }}>{l.label}</span>
                    <span className="num" style={{ fontSize:9.5, color:'var(--muted)' }}>{l.minXP}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Rank */}
        <Card padded={false}>
          <div style={{ padding:'18px 20px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>Rank · Week 21</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:4 }}>
                  <Crown size={20}/>
                  <span className="num" style={{ fontSize:46, fontWeight:600, letterSpacing:'-0.03em', lineHeight:1 }}>#{me.rank}</span>
                  <span style={{ fontSize:13, color:'var(--muted)' }}>of {RANKED.length}</span>
                </div>
              </div>
              <RankDelta delta={me.lastWeekRank - me.rank}/>
            </div>
            <div style={{ marginTop:14, padding:'12px 14px', background:'var(--lv4-soft)', borderRadius:8, border:'1px solid #ead7ad' }}>
              <div style={{ fontSize:11.5, color:'var(--ink-2)' }}>
                {me.rank === 1 ? <>You're leading.</> : <>{me.pointsGap} pts behind {aheadOfMe?.name}.</>}
              </div>
              <div style={{ fontSize:12, color:'var(--ink)', fontWeight:600, marginTop:3 }}>
                {behindMe ? <>{behindMe.name} is <span className="num">{RANKED.find(r=>r.id===me.id).weekPoints - behindMe.weekPoints}</span> pts behind you</> : '—'}
              </div>
            </div>
          </div>
          <div style={{ padding:'10px 20px 16px', borderTop:'1px solid var(--divider)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
              <span style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Points · last 7 days</span>
              <span className="num" style={{ fontSize:12, fontWeight:600 }}>+{me.weekPoints}</span>
            </div>
            <Sparkline data={MY_WEEK_PTS} width={260} height={36} color="var(--lv4)" fill="var(--lv4-soft)"/>
          </div>
        </Card>

        {/* Streak */}
        <Card padded={false}>
          <div style={{ padding:'18px 20px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>Current streak</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:4 }}>
                  <span style={{ color:'var(--flame)', display:'inline-flex' }}>
                    <svg viewBox="0 0 16 16" width="32" height="32" fill="currentColor"><path d="M8 1.5s-1 2.4-3 4-2.5 3.2-2.5 5A5.5 5.5 0 0 0 8 16a5.5 5.5 0 0 0 5.5-5.5c0-2.5-1.5-3.6-2.5-5-.7-1-1-3-3-4z"/></svg>
                  </span>
                  <span className="num" style={{ fontSize:46, fontWeight:600, letterSpacing:'-0.03em', lineHeight:1 }}>{me.currentStreak}</span>
                  <span style={{ fontSize:13, color:'var(--muted)' }}>days</span>
                </div>
              </div>
              <span className="chip" style={{ background:'var(--flame-soft)', color:'var(--flame)' }}>
                Personal best <span className="num">{me.longestStreak}</span>
              </span>
            </div>

            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:10.5, color:'var(--muted)', marginBottom:6, display:'flex', justifyContent:'space-between' }}>
                <span>Last 14 days</span>
                <span style={{ color:'var(--flame)', fontWeight:600 }}>3 days to 10-day milestone</span>
              </div>
              <div style={{ display:'flex', gap:3 }}>
                {MY_STREAK_DAYS.map((d, i) => (
                  <div key={i} style={{
                    flex:1, height:22, borderRadius:4,
                    background: d.active ? 'var(--flame)' : 'var(--bg-sub)',
                    border: d.today ? '1.5px solid var(--ink)' : 'none',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {d.active && <span style={{ color:'#fff', display:'inline-flex' }}><svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M8 1.5s-1 2.4-3 4-2.5 3.2-2.5 5A5.5 5.5 0 0 0 8 16a5.5 5.5 0 0 0 5.5-5.5c0-2.5-1.5-3.6-2.5-5-.7-1-1-3-3-4z"/></svg></span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Row 2: Chase next + Your week chart ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:14, marginBottom:14 }}>

        {/* Chase next */}
        <Card title="Up next" subtitle="The closest badge in reach" padded={false}>
          <div style={{ padding:'4px 18px 18px' }}>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <BadgeIcon type={nextBadge.type} size={56} dimmed/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.005em' }}>{nextBadgeDef.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:2, lineHeight:1.4 }}>{nextBadgeDef.desc}</div>
              </div>
            </div>

            <div style={{ marginTop:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'var(--muted)' }}>
                  Progress this week
                </span>
                <span className="num" style={{ fontSize:12, fontWeight:600 }}>{nextBadge.current} / {nextBadge.target}</span>
              </div>
              <SegmentBar filled={nextBadge.current} total={nextBadge.target} color="var(--lv2)" height={10}/>
            </div>

            <div style={{
              marginTop:14, padding:'12px 14px', background:'var(--bg-sub)', borderRadius:8,
              fontSize:12, color:'var(--ink-2)', lineHeight:1.45,
            }}>
              Advance <strong className="num">{nextBadge.target - nextBadge.current}</strong> more deals through stages before Sunday 23:59 to unlock.
            </div>

            <button className="btn" style={{ width:'100%', marginTop:12, justifyContent:'center', height:34 }}>
              {Icon.bolt}<span>Log a stage advance</span>
            </button>
          </div>
        </Card>

        {/* Your week chart */}
        <Card title="Your week" subtitle="Points scored per day · this week vs last" action={
          <div style={{ display:'flex', gap:10, fontSize:11 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><i style={{ width:8, height:8, borderRadius:2, background:'var(--lv4)' }}/>This week</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><i style={{ width:8, height:8, borderRadius:2, background:'var(--muted-2)' }}/>Last week</span>
          </div>
        }>
          <div style={{ padding:'0 4px 4px' }}>
            <DualBarChart
              thisWeek={MY_WEEK_PTS}
              lastWeek={MY_PREV_WEEK}
              labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
              width={520} height={160}
              colorA="var(--lv4)" colorB="var(--muted-2)"
            />
          </div>
          <div style={{
            display:'flex', justifyContent:'space-between', marginTop:8,
            padding:'10px 12px', background:'var(--bg-sub)', borderRadius:8,
          }}>
            <div>
              <div style={{ fontSize:10.5, color:'var(--muted)' }}>This week</div>
              <div className="num" style={{ fontSize:16, fontWeight:600 }}>+{me.weekPoints}</div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--muted)' }}>Last week</div>
              <div className="num" style={{ fontSize:16, fontWeight:600, color:'var(--muted)' }}>+{MY_PREV_WEEK.reduce((a,b)=>a+b,0)}</div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--muted)' }}>Delta</div>
              <div className="num" style={{ fontSize:16, fontWeight:600, color:'var(--success)' }}>+{me.weekPoints - MY_PREV_WEEK.reduce((a,b)=>a+b,0)}</div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--muted)' }}>Pace</div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:2, color:'var(--success)' }}>+22% MoM</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Row 3: Personal records ─── */}
      <Card title="Personal records" subtitle="The bar to clear" style={{ marginBottom:14 }} padded={false}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', borderTop:'1px solid var(--divider)' }}>
          {[
            { label:'Best week',     ...MY_RECORDS.bestWeek,   unit:'pts',     tone:'lv-4' },
            { label:'Best day',      ...MY_RECORDS.bestDay,    unit:'pts',     tone:'lv-4' },
            { label:'Longest streak',...MY_RECORDS.longestStreak, unit:'days', tone:'flame' },
            { label:'Deals won',     ...MY_RECORDS.totalDeals, unit:'lifetime',tone:'success' },
            { label:'Events logged', ...MY_RECORDS.totalEvents,unit:'lifetime',tone:'' },
            { label:'Win rate',      ...MY_RECORDS.winRate,    unit:'%',       tone:'success' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding:'14px 18px',
              borderRight: i < 5 ? '1px solid var(--divider)' : 'none',
            }}>
              <div style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:500 }}>{s.label}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:4 }}>
                <span className="num" style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.02em',
                  color: s.tone === 'flame' ? 'var(--flame)' : s.tone === 'success' ? 'var(--success)' : s.tone === 'lv-4' ? 'var(--lv4)' : 'var(--ink)',
                }}>{s.value}{s.unit === '%' ? '%' : ''}</span>
                {s.unit !== '%' && <span style={{ fontSize:10.5, color:'var(--muted)' }}>{s.unit}</span>}
              </div>
              <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:2 }}>{s.when}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Row 4: Badges full width ─── */}
      <Card title="Badge collection" subtitle="4 earned · 2 in progress · 0 locked" style={{ marginBottom:14 }} action={
        <a style={{ fontSize:11, color:'var(--muted)', textDecoration:'none' }}>View catalog →</a>
      }>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
          {/* Earned */}
          {MY_BADGES.earned.map(b => {
            const def = BADGE_DEFS.find(d => d.type === b.type);
            return (
              <div key={b.type} style={{
                padding:'14px 12px', textAlign:'center',
                background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10,
              }}>
                <BadgeIcon type={b.type} size={42}/>
                <div style={{ fontSize:12, fontWeight:600, marginTop:8, letterSpacing:'-0.005em' }}>{def.name}</div>
                <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:2 }}>
                  Earned {new Date(b.awardedAt).toLocaleDateString('en-US',{month:'short', day:'numeric'})}
                </div>
              </div>
            );
          })}
          {/* In-progress */}
          {MY_BADGES.inProgress.map(p => {
            const def = BADGE_DEFS.find(d => d.type === p.type);
            return (
              <div key={p.type} style={{
                padding:'14px 12px', textAlign:'center',
                background:'var(--surface)', border:'1px dashed var(--border-strong)', borderRadius:10,
              }}>
                <BadgeIcon type={p.type} size={42} dimmed/>
                <div style={{ fontSize:12, fontWeight:600, marginTop:8 }}>{def.name}</div>
                <div style={{ marginTop:6 }}>
                  <SegmentBar filled={p.current} total={p.target} color="var(--lv2)" height={5}/>
                </div>
                <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:5 }} className="num">{p.current} / {p.target}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── Row 5: Achievements + Event simulator ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14 }}>
        <Card title="Recent achievements" subtitle="Your story so far" padded={false}>
          <div style={{ padding:'0 18px 12px' }}>
            {MY_TIMELINE.slice(0, 6).map((t, i) => {
              const isBadge = t.type === 'BADGE_EARNED';
              const isLevel = t.type === 'LEVEL_UP';
              const isStreak = t.type === 'STREAK_MILESTONE';
              const isTop = t.type === 'WEEKLY_TOP_3';
              return (
                <div key={i} style={{
                  display:'flex', gap:12, padding:'10px 0',
                  borderTop: i ? '1px solid var(--divider)' : 'none', alignItems:'center',
                }}>
                  <div style={{ width:32, flexShrink:0, display:'flex', justifyContent:'center' }}>
                    {isBadge && <BadgeIcon type={t.badgeType} size={28}/>}
                    {isLevel && <span className="shield lv-4" style={{ width:28, height:30, fontSize:10 }}>L{t.to}</span>}
                    {isStreak && <span style={{ color:'var(--flame)', display:'inline-flex' }}><svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M8 1.5s-1 2.4-3 4-2.5 3.2-2.5 5A5.5 5.5 0 0 0 8 16a5.5 5.5 0 0 0 5.5-5.5c0-2.5-1.5-3.6-2.5-5-.7-1-1-3-3-4z"/></svg></span>}
                    {isTop && <Crown size={22}/>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, color:'var(--ink)', fontWeight:500 }}>{t.note}</div>
                    <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:1, display:'flex', gap:6 }}>
                      <span>{t.when}</span><span>·</span>
                      <span className="num">{t.xp} XP</span><span>·</span>
                      <span>{t.week}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Event simulator" subtitle="Trial-fire a CRM event" padded={false}>
          <div style={{ padding:'4px 18px 14px', display:'flex', flexDirection:'column', gap:10 }}>
            <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Event type</span>
              <div style={{
                height:32, padding:'0 10px', borderRadius:7, border:'1px solid var(--border-strong)',
                background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12.5,
              }}>
                <span style={{ fontFamily:'var(--font-mono)' }}>DEAL_WON</span>
                <span className="num" style={{ color:'var(--success)', fontWeight:600 }}>+100</span>
              </div>
            </label>
            <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Entity ID</span>
              <input defaultValue="deal-999" style={{
                height:32, padding:'0 10px', borderRadius:7, border:'1px solid var(--border-strong)',
                background:'var(--surface)', fontFamily:'var(--font-mono)', fontSize:12, outline:'none',
              }}/>
            </label>
            <button className="btn" style={{ height:34, justifyContent:'center', borderRadius:7 }}>
              {Icon.bolt}<span>Submit event</span>
            </button>
            <div style={{
              padding:'10px 12px', background:'var(--success-soft)', borderRadius:8,
              border:'1px solid #cfe6d6',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>Last response · 200 OK</span>
                <span className="chip" style={{ background:'#fff', color:'var(--success)', height:18 }}>+100 pts</span>
              </div>
              <div style={{ fontSize:10.5, color:'var(--ink-2)', fontFamily:'var(--font-mono)', lineHeight:1.45 }}>
                {'{ "accepted": true, "duplicate": false,'}<br/>
                {'  "pointsAwarded": 100, "level": 4,'}<br/>
                {'  "badgesUnlocked": ["CONSISTENT_CLOSER"] }'}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Dual bar chart (this week vs last) ───
function DualBarChart({ thisWeek, lastWeek, labels, width, height, colorA, colorB }) {
  const max = Math.max(...thisWeek, ...lastWeek, 1);
  const pad = { l:30, r:8, t:10, b:22 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const groupW = W / thisWeek.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} stroke="var(--divider)"/>
      {[max, max*0.66, max*0.33, 0].map((t, i) => {
        const y = pad.t + H - (t / max) * H;
        return <g key={i}>
          {i > 0 && i < 3 && <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)" strokeDasharray="2,3"/>}
          <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9.5" fill="var(--muted-2)" fontFamily="var(--font-mono)">{Math.round(t)}</text>
        </g>;
      })}
      {thisWeek.map((v, i) => {
        const cx = pad.l + i * groupW + groupW / 2;
        const barW = (groupW - 6) / 2;
        const h1 = (v / max) * H;
        const h2 = (lastWeek[i] / max) * H;
        return <g key={i}>
          <rect x={cx - barW - 1} y={pad.t + H - h2} width={barW} height={h2} fill={colorB} opacity="0.55" rx="2"/>
          <rect x={cx + 1}         y={pad.t + H - h1} width={barW} height={h1} fill={colorA} rx="2"/>
          <text x={cx} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">{labels[i]}</text>
        </g>;
      })}
    </svg>
  );
}

Object.assign(window, { RepDashboard, DualBarChart });
