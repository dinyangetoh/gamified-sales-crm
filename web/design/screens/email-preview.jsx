// ─── Email template preview tab (manager-side "misc") ───
function EmailPreviewPage({ selected = 'BADGE_UNLOCK' }) {
  const sel = EMAIL_TEMPLATES[selected];
  const Comp = sel?.Comp;
  const order = ['BADGE_UNLOCK', 'LEVEL_UP', 'NEAR_BADGE', 'STREAK_RISK', 'STREAK_BROKEN',
                 'WEEKLY_REP_DIGEST', 'END_OF_WEEK_PUSH', 'TOP_OF_WEEK_AWARD', 'WEEKLY_MGR_DIGEST'];
  return (
    <AppShell
      role="manager" active="emails"
      title="Email templates"
      sub="Preview every transactional email Rally sends, per role and trigger."
      actions={<>
        <button className="btn ghost sm">{Icon.send}<span>Send test email</span></button>
        <button className="btn sm">{Icon.ext}<span>Open in Resend</span></button>
      </>}
    >
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:14, height:'100%' }}>
        {/* Picker */}
        <div className="card" style={{ padding:'10px', alignSelf:'start', position:'sticky', top:0 }}>
          <div style={{ padding:'6px 8px 10px', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
            Sales Rep
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {order.filter(k => EMAIL_TEMPLATES[k].role === 'rep').map(k => {
              const t = EMAIL_TEMPLATES[k];
              const active = k === selected;
              return (
                <button key={k} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', borderRadius:7,
                  background: active ? 'var(--bg-sub)' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left',
                  fontFamily:'inherit',
                }}>
                  <span style={{
                    width:6, height:6, borderRadius:3,
                    background: t.status === 'POC' ? 'var(--success)' : 'var(--muted-2)',
                    flexShrink:0,
                  }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight: active ? 600 : 500, color:'var(--ink)' }}>{t.name}</div>
                    <div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ padding:'14px 8px 8px', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
            Manager
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {order.filter(k => EMAIL_TEMPLATES[k].role === 'manager').map(k => {
              const t = EMAIL_TEMPLATES[k];
              const active = k === selected;
              return (
                <button key={k} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', borderRadius:7,
                  background: active ? 'var(--bg-sub)' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left',
                  fontFamily:'inherit',
                }}>
                  <span style={{
                    width:6, height:6, borderRadius:3,
                    background: t.status === 'POC' ? 'var(--success)' : 'var(--muted-2)',
                    flexShrink:0,
                  }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight: active ? 600 : 500, color:'var(--ink)' }}>{t.name}</div>
                    <div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop:12, padding:'10px 10px 4px', borderTop:'1px solid var(--divider)' }}>
            <div style={{ fontSize:10.5, color:'var(--muted)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:3, background:'var(--success)' }}/>
              <span>POC implemented</span>
            </div>
            <div style={{ fontSize:10.5, color:'var(--muted)', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:3, background:'var(--muted-2)' }}/>
              <span>MVP scaffolded</span>
            </div>
          </div>
        </div>

        {/* Preview pane */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, minWidth:0 }}>
          {/* Meta strip */}
          <div className="card" style={{ padding:'14px 18px', display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr 80px', gap:14, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Template</div>
              <div style={{ fontSize:14, fontWeight:600, marginTop:3 }}>{sel.name}</div>
              <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)', marginTop:1 }}>{selected}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Audience</div>
              <div style={{ fontSize:12.5, marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                <span className={`chip ${sel.role === 'manager' ? 'lv-3' : 'lv-4'}`}>{sel.role === 'manager' ? 'MANAGER' : 'SALES_REP'}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Trigger</div>
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:4, lineHeight:1.4 }}>{sel.trigger}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Channel</div>
              <div style={{ fontSize:12, marginTop:6, color:'var(--ink-2)' }}>
                Email <span style={{ color:'var(--muted)' }}>· Resend</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Status</div>
              <span className="chip" style={{
                marginTop:5,
                background: sel.status === 'POC' ? 'var(--success-soft)' : 'var(--bg-sub)',
                color: sel.status === 'POC' ? 'var(--success)' : 'var(--muted)',
                fontWeight:600,
              }}>{sel.status}</span>
            </div>
          </div>

          {/* Preview frame */}
          <div className="card" style={{ padding:0, overflow:'hidden', flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
            <div style={{
              padding:'10px 18px', borderBottom:'1px solid var(--divider)',
              display:'flex', alignItems:'center', gap:14, fontSize:11.5,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)' }}>
                <span style={{ fontWeight:600, color:'var(--ink-2)' }}>From</span>
                <span className="num">rally@acme-sales.com</span>
              </div>
              <span style={{ color:'var(--border-strong)' }}>·</span>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)' }}>
                <span style={{ fontWeight:600, color:'var(--ink-2)' }}>To</span>
                <span className="num">{sel.role === 'manager' ? 'manager@demo.com' : 'alice@demo.com'}</span>
              </div>
              <span style={{ color:'var(--border-strong)' }}>·</span>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)', flex:1 }}>
                <span style={{ fontWeight:600, color:'var(--ink-2)' }}>Subject</span>
                <span>{subjectFor(selected)}</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button className="btn ghost sm" style={{ height:24, padding:'0 8px', fontSize:11 }}>Desktop</button>
                <button className="btn ghost sm" style={{ height:24, padding:'0 8px', fontSize:11, background:'var(--bg-sub)' }}>Mobile</button>
              </div>
            </div>
            <div className="scroll" style={{
              flex:1, minHeight:0, background:'#e9e5da',
              padding:'0', overflow:'auto', position:'relative',
            }}>
              <Comp/>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function subjectFor(key) {
  return {
    BADGE_UNLOCK:      'You earned Consistent Closer 🏅',
    LEVEL_UP:          "You're now a Legend",
    NEAR_BADGE:        "One stage advance from Pipeline Builder",
    STREAK_RISK:       'Your 5-day streak is at risk',
    STREAK_BROKEN:     'Your streak reset to 0',
    WEEKLY_REP_DIGEST: 'Week 21 recap: #1 on the board',
    END_OF_WEEK_PUSH:  '60 pts behind #1 — push to win the week',
    TOP_OF_WEEK_AWARD: 'You won Week 20',
    WEEKLY_MGR_DIGEST: 'Acme Sales · Week 21 digest',
  }[key];
}

window.EmailPreviewPage = EmailPreviewPage;
