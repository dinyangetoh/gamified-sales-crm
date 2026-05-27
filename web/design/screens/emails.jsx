// ─── Email templates ───
// Each template is a self-contained, 600px-wide email composition.
// They share the same EmailFrame chrome but have distinctive bodies.

function EmailFrame({ preheader, children, footer }) {
  return (
    <div className="email" style={{
      width:'100%', height:'100%', background:'#f1eee6',
      fontFamily:'var(--font-sans)', color:'var(--ink)',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'20px 0', overflow:'hidden',
    }}>
      <div style={{
        width:560, maxWidth:'100%', display:'flex', flexDirection:'column',
      }}>
        {/* Preheader */}
        <div style={{ fontSize:11, color:'var(--muted)', padding:'0 4px 10px' }}>{preheader}</div>

        {/* Header */}
        <div style={{
          padding:'18px 28px', background:'var(--surface)', borderRadius:'12px 12px 0 0',
          borderBottom:'1px solid var(--border)',
        }}>
          <Logo size={20}/>
        </div>

        {/* Body */}
        <div style={{ background:'var(--surface)', padding:'24px 28px' }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          background:'var(--surface-2)', padding:'16px 28px',
          borderRadius:'0 0 12px 12px', borderTop:'1px solid var(--border)',
          fontSize:10.5, color:'var(--muted)', display:'flex', justifyContent:'space-between',
        }}>
          <span>{footer || 'You\'re receiving this because you\'re a Rally user at Acme Sales Org.'}</span>
          <a style={{ color:'var(--muted)', textDecoration:'underline' }}>Manage notifications</a>
        </div>
      </div>
    </div>
  );
}

function CTA({ label = 'Open Rally', secondary }) {
  return (
    <a style={{
      display:'inline-flex', alignItems:'center', gap:6,
      height:38, padding:'0 18px',
      background: secondary ? 'transparent' : 'var(--ink)',
      color: secondary ? 'var(--ink)' : 'var(--accent-fg)',
      border: secondary ? '1px solid var(--border-strong)' : '1px solid var(--ink)',
      borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:500,
    }}>{label}</a>
  );
}

// ─── 1. BADGE_UNLOCK ──────────────────────────────────────────────
function Email_BadgeUnlock() {
  const def = BADGE_DEFS.find(b => b.type === 'CONSISTENT_CLOSER');
  return (
    <EmailFrame preheader="You just earned the Consistent Closer badge.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Badge unlocked
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        Nice work, Alice.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        You closed your third deal this week — that's the <strong>Consistent Closer</strong> badge for Week 21.
      </p>

      <div style={{
        marginTop:20, padding:'20px 22px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
        display:'flex', alignItems:'center', gap:18,
      }}>
        <BadgeIcon type="CONSISTENT_CLOSER" size={56}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>{def.name}</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{def.desc}</div>
          <div style={{ marginTop:8, display:'flex', gap:14, fontSize:11, color:'var(--muted)' }}>
            <span>Earned <span className="num" style={{ color:'var(--ink)' }}>May 26</span></span>
            <span>At <LevelChip level={4} label="Legend" size="sm"/></span>
          </div>
        </div>
      </div>

      <div style={{ marginTop:18, display:'flex', gap:8 }}>
        <CTA label="See your badges"/>
        <CTA label="View leaderboard" secondary/>
      </div>
    </EmailFrame>
  );
}

// ─── 2. LEVEL_UP ──────────────────────────────────────────────
function Email_LevelUp() {
  return (
    <EmailFrame preheader="You leveled up to Legend.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Level up
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        You're a Legend now.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        You crossed <strong>500 XP</strong> — the threshold for Rally's top tier.
        Only one rep at Acme has held this level before.
      </p>

      <div style={{
        marginTop:20, padding:'20px 22px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <LevelChip level={3} label="Elite"/>
          <span style={{ color:'var(--muted)' }}>{Icon.arrow(1)}</span>
          <LevelChip level={4} label="Legend"/>
          <div style={{ flex:1 }}/>
          <div className="num" style={{ fontSize:22, fontWeight:600, color:'var(--lv4)' }}>820 XP</div>
        </div>
        <div style={{ marginTop:14 }}>
          <Progress value={820} max={1000} tone="lv-4" height={6}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginTop:6 }}>
            <span>L4 · Legend</span>
            <span><span className="num" style={{ color:'var(--ink)' }}>500</span> XP earned in tier</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop:18 }}><CTA label="Open dashboard"/></div>
    </EmailFrame>
  );
}

// ─── 3. NEAR_BADGE ──────────────────────────────────────────────
function Email_NearBadge() {
  return (
    <EmailFrame preheader="You're 80% of the way to Pipeline Builder.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Almost there
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        One more stage advance.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        Move one more deal forward this week and you'll earn <strong>Pipeline Builder</strong>.
      </p>

      <div style={{
        marginTop:20, padding:'20px 22px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
        display:'flex', gap:18, alignItems:'center',
      }}>
        <BadgeIcon type="PIPELINE_BUILDER" size={48} dimmed/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>Pipeline Builder</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>Advance 5 deals through stages in a single week.</div>
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1 }}><Progress value={4} max={5} tone="lv-2"/></div>
            <span className="num" style={{ fontSize:12, fontWeight:600 }}>4 / 5</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop:18 }}><CTA label="Open pipeline"/></div>
    </EmailFrame>
  );
}

// ─── 4. STREAK_RISK ──────────────────────────────────────────────
function Email_StreakRisk() {
  return (
    <EmailFrame preheader="Your 5-day streak is at risk.">
      <div style={{ display:'inline-flex', alignItems:'center', gap:6,
        background:'var(--warn-soft)', color:'var(--warn)', padding:'4px 10px',
        borderRadius:999, fontSize:11, fontWeight:600,
      }}>
        <span style={{ display:'inline-flex' }}>{Icon.warn}</span>
        Streak at risk
      </div>
      <h1 style={{ margin:'10px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        Don't lose your 5-day streak.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        You haven't logged a scored event today. Log one before midnight to keep your streak alive.
      </p>

      <div style={{
        marginTop:20, padding:'18px 22px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
      }}>
        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>Last 7 days</div>
        <div style={{ display:'flex', gap:6 }}>
          {['Wed','Thu','Fri','Sat','Sun','Mon','Tue'].map((d, i) => {
            const active = i < 5;
            const today = i === 6;
            return (
              <div key={d} style={{ flex:1, textAlign:'center' }}>
                <div style={{
                  height:28, borderRadius:6,
                  background: active ? 'var(--flame)' : today ? '#fff' : 'var(--bg-sub)',
                  border: today ? '1.5px dashed var(--warn)' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: active ? '#fff' : 'var(--muted)',
                }}>{active && <span style={{ fontSize:14 }}>{Icon.flame}</span>}{today && <span style={{ fontSize:11, color:'var(--warn)' }}>!</span>}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:4 }}>{d}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop:18 }}><CTA label="Log an activity"/></div>
    </EmailFrame>
  );
}

// ─── 5. STREAK_BROKEN ──────────────────────────────────────────────
function Email_StreakBroken() {
  return (
    <EmailFrame preheader="Your streak reset. Time to start a new one.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Streak reset
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        Your 3-day streak ended.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        It happens. Your <strong>longest streak of 8 days</strong> is still on the books — let's beat it.
      </p>

      <div style={{
        marginTop:20, padding:'18px 22px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:18,
      }}>
        <div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Previous streak</div>
          <div className="num" style={{ fontSize:22, fontWeight:600, marginTop:4 }}>3 days</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Personal best</div>
          <div className="num" style={{ fontSize:22, fontWeight:600, marginTop:4, color:'var(--flame)' }}>8 days</div>
        </div>
      </div>
      <div style={{ marginTop:18 }}><CTA label="Start a new streak"/></div>
    </EmailFrame>
  );
}

// ─── 6. WEEKLY_REP_DIGEST ──────────────────────────────────────────
function Email_WeeklyRepDigest() {
  return (
    <EmailFrame preheader="Your Week 21 recap: #1, 340 pts, 2 badges.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Week 21 · May 19–25
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        Your week, recapped.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        You finished <strong>#1 on the leaderboard</strong> for the second week running.
      </p>

      <div style={{
        marginTop:18, padding:'18px 0',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
        display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr',
      }}>
        {[
          { l:'Rank', v:'#1', sub:'+1 vs W20' },
          { l:'Points', v:'340', sub:'+60 vs W20' },
          { l:'Events', v:'24', sub:'8 wins' },
          { l:'Badges', v:'2', sub:'new' },
        ].map((s, i) => (
          <div key={s.l} style={{ padding:'0 18px', borderLeft: i ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize:10.5, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</div>
            <div className="num" style={{ fontSize:20, fontWeight:600, marginTop:4, letterSpacing:'-0.01em' }}>{s.v}</div>
            <div style={{ fontSize:10.5, color:'var(--success)', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:18 }}>
        <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Badges earned</div>
        <div style={{ display:'flex', gap:10 }}>
          {['CONSISTENT_CLOSER', 'HOT_STREAK'].map(t => {
            const def = BADGE_DEFS.find(b => b.type === t);
            return (
              <div key={t} style={{
                flex:1, display:'flex', gap:10, alignItems:'center',
                padding:'12px 14px', background:'var(--surface-2)',
                border:'1px solid var(--border)', borderRadius:10,
              }}>
                <BadgeIcon type={t} size={32}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{def.name}</div>
                  <div style={{ fontSize:10.5, color:'var(--muted)' }}>Week 21</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop:18 }}><CTA label="See full recap"/></div>
    </EmailFrame>
  );
}

// ─── 7. WEEKLY_MGR_DIGEST ──────────────────────────────────────────
function Email_WeeklyMgrDigest() {
  return (
    <EmailFrame preheader="Acme Sales · Week 21 manager digest" footer="You're receiving this as the manager of Acme Sales Org.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Manager digest · Week 21
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        Team finished Week 21 strong.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        7 of 8 reps were active. 1,440 points awarded across 122 events.
      </p>

      <div style={{
        marginTop:18, padding:'14px 18px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10,
      }}>
        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>Top 3</div>
        {RANKED.slice(0,3).map(r => (
          <div key={r.id} style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 0',
            borderTop: r.rank > 1 ? '1px solid var(--divider)' : 'none',
          }}>
            <span className="num" style={{ width:18, color:'var(--muted)' }}>{r.rank}</span>
            <Avatar name={r.name} initials={r.initials} size={24} tone={r.color}/>
            <span style={{ flex:1, fontSize:12.5, fontWeight:500 }}>{r.name}</span>
            <LevelChip level={r.level} label={r.levelLabel} size="sm"/>
            <span className="num" style={{ fontSize:13, fontWeight:600, width:50, textAlign:'right' }}>{r.weekPoints}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop:14, padding:'12px 16px',
        background:'var(--warn-soft)', border:'1px solid #ead7ad', borderRadius:10,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ color:'var(--warn)', display:'inline-flex' }}>{Icon.warn}</span>
        <div style={{ flex:1, fontSize:12.5, color:'var(--ink-2)' }}>
          <strong>Hannah Lee</strong> had no activity this week. Suggest a 1:1.
        </div>
      </div>

      <div style={{ marginTop:18, display:'flex', gap:8 }}>
        <CTA label="Open team overview"/>
        <CTA label="Export CSV" secondary/>
      </div>
    </EmailFrame>
  );
}

// ─── 8. END_OF_WEEK_PUSH ──────────────────────────────────────────
function Email_EndOfWeekPush() {
  return (
    <EmailFrame preheader="One push and you take #1.">
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
        Friday push · 2 days left
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        60 points behind #1.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        One closed deal puts you in first place by end of week.
      </p>

      <div style={{
        marginTop:20, padding:'20px 22px',
        background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12,
      }}>
        {RANKED.slice(0,3).map(r => {
          const mine = r.id === 'u-diana';
          return (
            <div key={r.id} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 0',
              borderTop: r.rank > 1 ? '1px solid var(--divider)' : 'none',
              background: mine ? 'transparent' : 'transparent',
            }}>
              <span className="num" style={{ width:18, color: r.rank === 1 ? 'var(--lv4)' : 'var(--muted)', fontWeight: r.rank === 1 ? 600 : 400 }}>{r.rank}</span>
              <Avatar name={r.name} initials={r.initials} size={26} tone={r.color}/>
              <span style={{ flex:1, fontSize:12.5, fontWeight: mine ? 600 : 500 }}>
                {r.name}{mine && <span style={{ marginLeft:5, fontSize:10, color:'var(--muted)', fontWeight:400 }}>you</span>}
              </span>
              <span className="num" style={{ fontSize:13, fontWeight:600 }}>{r.weekPoints}</span>
            </div>
          );
        })}
        <div style={{
          marginTop:14, padding:'10px 12px',
          background:'#fff', border:'1px dashed var(--border-strong)', borderRadius:8,
          fontSize:12, color:'var(--ink-2)',
        }}>
          One <span style={{ fontFamily:'var(--font-mono)' }}>DEAL_WON</span> = <span className="num" style={{ fontWeight:600 }}>+100</span> pts → projected rank <strong>#1</strong>.
        </div>
      </div>
      <div style={{ marginTop:18 }}><CTA label="Open pipeline"/></div>
    </EmailFrame>
  );
}

// ─── 9. TOP_OF_WEEK_AWARD ──────────────────────────────────────────
function Email_TopOfWeek() {
  return (
    <EmailFrame preheader="You finished Week 20 at #1.">
      <div style={{ fontSize:11, color:'var(--lv4)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>
        Top of the Week · Week 20
      </div>
      <h1 style={{ margin:'8px 0 6px', fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
        You won the week.
      </h1>
      <p style={{ margin:0, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        460 points, 22 events, 3 deals closed. You finished #1 on Acme Sales for Week 20.
      </p>

      <div style={{
        marginTop:22, padding:'24px 22px', textAlign:'center',
        background:'var(--lv4-soft)', border:'1px solid #ead7ad', borderRadius:12,
      }}>
        <BadgeIcon type="TOP_OF_THE_WEEK" size={64}/>
        <div style={{ fontSize:15, fontWeight:600, marginTop:10 }}>Top of the Week</div>
        <div style={{ fontSize:11.5, color:'var(--ink-2)', marginTop:3 }}>Awarded May 18 · Week 20</div>
      </div>

      <div style={{ marginTop:18, display:'flex', gap:8 }}>
        <CTA label="View your badges"/>
        <CTA label="See leaderboard" secondary/>
      </div>
    </EmailFrame>
  );
}

const EMAIL_TEMPLATES = {
  BADGE_UNLOCK:      { Comp: Email_BadgeUnlock,      role:'rep',     name:'Badge unlocked',     trigger:'Inside scoring transaction when BadgeAward is written.', status:'POC' },
  LEVEL_UP:          { Comp: Email_LevelUp,          role:'rep',     name:'Level up',           trigger:'When user crosses a level threshold.',                       status:'MVP' },
  NEAR_BADGE:        { Comp: Email_NearBadge,        role:'rep',     name:'Almost a badge',     trigger:'When BadgeProgress reaches ≥80%.',                            status:'MVP' },
  STREAK_RISK:       { Comp: Email_StreakRisk,       role:'rep',     name:'Streak at risk',     trigger:'Daily 18:00 cron, no activity today, streak ≥ 2.',            status:'POC' },
  STREAK_BROKEN:     { Comp: Email_StreakBroken,     role:'rep',     name:'Streak broken',      trigger:'Daily cron after midnight, streak reset to 0.',                status:'MVP' },
  WEEKLY_REP_DIGEST: { Comp: Email_WeeklyRepDigest,  role:'rep',     name:'Weekly rep digest',  trigger:'Monday 08:00 cron.',                                           status:'MVP' },
  END_OF_WEEK_PUSH:  { Comp: Email_EndOfWeekPush,    role:'rep',     name:'End of week push',   trigger:'Friday 16:00 cron, for reps within reach of next rank.',       status:'MVP' },
  TOP_OF_WEEK_AWARD: { Comp: Email_TopOfWeek,        role:'rep',     name:'Top of the week',    trigger:'Sunday 23:30 cron, awarded to rank #1.',                       status:'MVP' },
  WEEKLY_MGR_DIGEST: { Comp: Email_WeeklyMgrDigest,  role:'manager', name:'Weekly mgr digest',  trigger:'Monday 08:00 cron to each manager.',                           status:'MVP' },
};

Object.assign(window, {
  EmailFrame, CTA, EMAIL_TEMPLATES,
  Email_BadgeUnlock, Email_LevelUp, Email_NearBadge, Email_StreakRisk, Email_StreakBroken,
  Email_WeeklyRepDigest, Email_WeeklyMgrDigest, Email_EndOfWeekPush, Email_TopOfWeek,
});
