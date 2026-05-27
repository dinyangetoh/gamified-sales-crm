// ─── Rep Leaderboard v2 — podium with crown ───
function RepLeaderboard() {
  const me = ME;
  const top3 = RANKED.slice(0, 3);
  const rest = RANKED.slice(3);

  return (
    <AppShell
      role="rep" active="leaderboard"
      title="Leaderboard"
      sub="Top 1 finishes Sunday at 23:59 wins the week"
      actions={<>
        <div style={{
          display:'inline-flex', height:30, borderRadius:7, border:'1px solid var(--border-strong)',
          background:'var(--surface)', overflow:'hidden',
        }}>
          {['This week','All time'].map((t, i) => (
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
      </>}
    >
      {/* ─── Podium hero ─── */}
      <div className="card" style={{ padding:'24px 24px 28px', marginBottom:14, background:'var(--surface)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Week 21 standings</div>
            <h2 style={{ margin:'4px 0 0', fontSize:22, fontWeight:600, letterSpacing:'-0.015em' }}>The podium</h2>
          </div>
          <div style={{ display:'flex', gap:18, fontSize:11, color:'var(--muted)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-flex' }}>{Icon.clock}</span>
              <span><span className="num" style={{ color:'var(--ink)', fontWeight:600 }}>2d 9h</span> until close</span>
            </div>
            <div>Top 3 earn the <strong style={{ color:'var(--ink)' }}>Top of the Week</strong> badge</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:18, alignItems:'end' }}>
          {[top3[1], top3[0], top3[2]].map((r) => {
            const isFirst = r.rank === 1;
            const isSecond = r.rank === 2;
            const isMe = r.id === me.id;
            const lift = isFirst ? 0 : isSecond ? 18 : 30;
            return (
              <div key={r.id} style={{
                position:'relative',
                transform:`translateY(${lift}px)`,
              }}>
                {isFirst && (
                  <div style={{ position:'absolute', top:-30, left:'50%', transform:'translateX(-50%)' }}>
                    <Crown size={36} color="#b88420"/>
                  </div>
                )}
                <div style={{
                  background: isFirst ? 'var(--lv4-soft)' : 'var(--surface-2)',
                  border: isFirst ? '1px solid #ead7ad' : '1px solid var(--border)',
                  borderRadius:14,
                  padding:'20px 18px 16px',
                  outline: isMe ? '2px solid var(--ink)' : 'none',
                  outlineOffset: -1,
                  textAlign:'center',
                }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
                    <Medal rank={r.rank} size={isFirst ? 50 : 42}/>
                  </div>
                  <Avatar name={r.name} initials={r.initials} size={isFirst ? 60 : 52} tone={r.color}/>
                  <div style={{ fontSize:isFirst ? 16 : 14, fontWeight:600, marginTop:10, letterSpacing:'-0.005em' }}>
                    {r.name}{isMe && <span style={{ marginLeft:5, fontSize:10, color:'var(--muted)', fontWeight:400 }}>you</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{r.levelLabel} · {r.activity} events</div>

                  <div style={{ marginTop:14, padding:'10px 0', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:6 }}>
                      <span className="num" style={{ fontSize:isFirst ? 30 : 24, fontWeight:600, letterSpacing:'-0.02em', color: isFirst ? 'var(--lv4)' : 'var(--ink)' }}>{r.weekPoints}</span>
                      <span style={{ fontSize:11, color:'var(--muted)' }}>pts</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:8 }}>
                      <RankDelta delta={r.delta}/>
                      {r.currentStreak >= 3 && <Streak days={r.currentStreak}/>}
                    </div>
                  </div>

                  {/* Badges row */}
                  <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:4 }}>
                    {Array.from({length: Math.min(r.badges, 4)}).map((_, i) => (
                      <BadgeIcon key={i} type={MY_BADGES.earned[i]?.type || BADGE_DEFS[i].type} size={20}/>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Full ranked list (4..N) ─── */}
      <Card title="Full standings" subtitle={`Ranks 4 through ${RANKED.length}`} padded={false}>
        <div style={{
          display:'grid', gridTemplateColumns:'48px 1.6fr 110px 90px 130px 70px 80px',
          padding:'10px 18px', borderBottom:'1px solid var(--divider)',
          fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500,
        }}>
          <div>Rank</div><div>Rep</div><div>Level</div><div>Streak</div><div>Badges</div><div style={{ textAlign:'right' }}>Gap</div><div style={{ textAlign:'right' }}>Points</div>
        </div>
        {rest.map(r => {
          const mine = r.id === me.id;
          return (
            <div key={r.id} style={{
              display:'grid', gridTemplateColumns:'48px 1.6fr 110px 90px 130px 70px 80px',
              padding:'12px 18px', alignItems:'center',
              borderBottom:'1px solid var(--divider)',
              background: mine ? 'var(--bg-sub)' : 'transparent',
              borderLeft: mine ? '2px solid var(--ink)' : '2px solid transparent',
              paddingLeft: mine ? 16 : 18,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span className="num" style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)' }}>{r.rank}</span>
                {r.delta !== 0 && <RankDelta delta={r.delta}/>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar name={r.name} initials={r.initials} size={28} tone={r.color}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: mine ? 600 : 500 }}>{r.name}{mine && <span style={{ marginLeft:6, fontSize:10, color:'var(--muted)', fontWeight:400 }}>you</span>}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{r.email}</div>
                </div>
              </div>
              <div><LevelChip level={r.level} label={r.levelLabel} size="sm"/></div>
              <div><Streak days={r.currentStreak} atRisk={r.currentStreak === 0 && r.longestStreak > 0}/></div>
              <div style={{ display:'flex', gap:3 }}>
                {Array.from({length: Math.min(r.badges, 4)}).map((_,i) => (
                  <BadgeIcon key={i} type={MY_BADGES.earned[i]?.type || BADGE_DEFS[i].type} size={20}/>
                ))}
                {r.badges === 0 && <span style={{ fontSize:11, color:'var(--muted-2)' }}>—</span>}
              </div>
              <div style={{ textAlign:'right', fontSize:11, color:'var(--muted)' }}>
                <span className="num">-{r.pointsGap}</span>
              </div>
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

window.RepLeaderboard = RepLeaderboard;
