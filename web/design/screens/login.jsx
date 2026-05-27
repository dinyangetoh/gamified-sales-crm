// ─── Login screen ───
function LoginScreen() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'var(--bg)',
      display:'flex', flexDirection:'column',
      fontFamily:'var(--font-sans)', color:'var(--ink)',
    }}>
      <header style={{ padding:'24px 32px' }}><Logo size={22} /></header>

      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'0 32px',
      }}>
        <div style={{ width:'100%', maxWidth:340 }}>
          <div style={{ marginBottom:24 }}>
            <h1 style={{ margin:0, fontSize:24, fontWeight:600, letterSpacing:'-0.02em' }}>
              Sign in to Rally
            </h1>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'var(--muted)', lineHeight:1.5 }}>
              CRM activity, levels and weekly rankings — all in one place.
            </p>
          </div>

          <form style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11.5, color:'var(--ink-2)', fontWeight:500 }}>Work email</span>
              <input defaultValue="alice@demo.com" style={{
                height:38, padding:'0 12px', borderRadius:8,
                border:'1px solid var(--border-strong)', background:'var(--surface)',
                fontSize:13, color:'var(--ink)', outline:'none',
                fontFamily:'var(--font-sans)',
              }}/>
            </label>
            <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontSize:11.5, color:'var(--ink-2)', fontWeight:500 }}>Password</span>
                <a style={{ fontSize:11, color:'var(--muted)', textDecoration:'none' }}>Forgot?</a>
              </div>
              <input type="password" defaultValue="••••••••" style={{
                height:38, padding:'0 12px', borderRadius:8,
                border:'1px solid var(--border-strong)', background:'var(--surface)',
                fontSize:13, color:'var(--ink)', outline:'none', letterSpacing:'0.1em',
                fontFamily:'var(--font-sans)',
              }}/>
            </label>

            <button type="button" className="btn" style={{ height:38, marginTop:4, justifyContent:'center', borderRadius:8, fontSize:13 }}>
              Sign in
            </button>
          </form>

          <div style={{
            marginTop:22, padding:'12px 14px',
            background:'var(--surface)', border:'1px dashed var(--border-strong)',
            borderRadius:10,
          }}>
            <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>
              Demo accounts
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12 }}>
              {[
                { name:'Alice Smith',   email:'alice@demo.com',   role:'Sales Rep · Legend', tone:'lv-4' },
                { name:'Morgan Vale',   email:'manager@demo.com', role:'Manager',            tone:'lv-3' },
                { name:'Hannah Lee',    email:'hannah@demo.com',  role:'Sales Rep · Rookie', tone:'lv-1' },
              ].map(a => (
                <div key={a.email} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Avatar name={a.name} initials={a.name.split(' ').map(s=>s[0]).join('')} size={22} tone={a.tone} />
                  <span style={{ flex:1, color:'var(--ink-2)' }}>
                    <span className="num">{a.email}</span>
                  </span>
                  <span style={{ fontSize:10.5, color:'var(--muted)' }}>{a.role}</span>
                </div>
              ))}
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4, fontFamily:'var(--font-mono)' }}>
                password: Demo1234!
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{
        padding:'18px 32px', borderTop:'1px solid var(--border)',
        display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)',
      }}>
        <span>Rally · Gamification for CRM activity</span>
        <span>v0.1 · POC</span>
      </footer>
    </div>
  );
}

window.LoginScreen = LoginScreen;
