const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID

const handleGitHubLogin = () => {
  const scope = 'read:org repo'
  window.location.href =
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scope)}`
}

export default function Login() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 380, textAlign: 'center', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <img src="/frontend/logo.png" alt="DevFlow" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <b style={{ fontSize: 24, color: 'var(--gray-900)' }}>DevFlow</b>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 15, margin: '6px 0 24px', lineHeight: 1.5 }}>
          팀 프로젝트의 기능·이슈·의존·진행을 한 곳에서.<br />GitHub 오가니제이션만 연결하면 시작돼요.
        </p>

        <div className="card">
          <button onClick={handleGitHubLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 52, border: 'none', borderRadius: 12, background: 'var(--gray-900)', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .3.3.7 1 .7 2v3c0 .3.2.6.7.5 3.9-1.3 6.8-5.1 6.8-9.6C22 6.6 17.5 2 12 2z" /></svg>
            GitHub으로 시작
          </button>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>오가니제이션 읽기·이슈 쓰기 권한을 한 번에 받습니다</div>
        </div>
      </div>
    </div>
  )
}
