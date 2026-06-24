import { useState } from 'react'

const ORGS = ['sebatmal', 'kakaotech-bootcamp', 'woorifisa']

const ORG_MEMBERS: Record<string, { id: string; name: string; initials: string; color: string }[]> = {
  'sebatmal': [
    { id: 'km', name: '김민준', initials: 'KM', color: '#7048E8' },
    { id: 'ls', name: '이서연', initials: 'LS', color: '#22C55E' },
    { id: 'pj', name: '박지훈', initials: 'PJ', color: '#FFB020' },
    { id: 'cy', name: '최유나', initials: 'CY', color: '#D6336C' },
  ],
  'kakaotech-bootcamp': [
    { id: 'jd', name: '정도현', initials: 'JD', color: '#F59E0B' },
    { id: 'hs', name: '한소희', initials: 'HS', color: '#3B82F6' },
    { id: 'oj', name: '오준서', initials: 'OJ', color: '#8B5CF6' },
    { id: 'yj', name: '윤재원', initials: 'YJ', color: '#10B981' },
    { id: 'sm', name: '서민지', initials: 'SM', color: '#EC4899' },
  ],
  'woorifisa': [
    { id: 'kms', name: '강민서', initials: 'KM', color: '#6366F1' },
    { id: 'sy', name: '신예진', initials: 'SY', color: '#14B8A6' },
    { id: 'it', name: '임태양', initials: 'IT', color: '#F97316' },
  ],
}

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<'login' | 'connect'>('login')
  const [org, setOrg] = useState(ORGS[0])

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 380, textAlign: 'center', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <img src="/logo.png" alt="DevFlow" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <b style={{ fontSize: 24, color: 'var(--gray-900)' }}>DevFlow</b>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 15, margin: '6px 0 24px', lineHeight: 1.5 }}>
          팀 프로젝트의 기능·이슈·의존·진행을 한 곳에서.<br />GitHub 오가니제이션만 연결하면 시작돼요.
        </p>

        <div className="card">
          {step === 'login' ? (
            <>
              <button onClick={() => setStep('connect')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 52, border: 'none', borderRadius: 12, background: 'var(--gray-900)', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .3.3.7 1 .7 2v3c0 .3.2.6.7.5 3.9-1.3 6.8-5.1 6.8-9.6C22 6.6 17.5 2 12 2z" /></svg>
                GitHub으로 시작
              </button>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>오가니제이션 읽기·이슈 쓰기 권한을 한 번에 받습니다</div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'left', marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>연결할 오가니제이션</label>
                <select value={org} onChange={(e) => setOrg(e.target.value)} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid var(--gray-200)', background: '#fff', fontFamily: 'inherit', fontSize: 14, color: 'var(--gray-900)', cursor: 'pointer' }}>
                  {ORGS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div style={{ textAlign: 'left', marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8 }}>
                  불러온 팀원 <span style={{ color: 'var(--primary)' }}>{ORG_MEMBERS[org].length}명</span>
                  <span style={{ fontWeight: 400, color: 'var(--gray-400)', marginLeft: 6 }}>· 자동</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ORG_MEMBERS[org].map((m) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="avatar" style={{ width: 26, height: 26, background: m.color }}>{m.initials}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-900)' }}>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={onLogin} style={{ width: '100%', height: 48, border: 'none', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                프로젝트 시작 →
              </button>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>세팅은 이게 전부예요</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
