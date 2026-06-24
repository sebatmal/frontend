// 가벼운 인라인 SVG 아이콘 (외부 의존성 없이)
const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const IconGraph = () => (<svg {...s}><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="9" r="2.5"/><circle cx="9" cy="18" r="2.5"/><path d="M8 7l8 1.5M7.5 8L9 15.5"/></svg>)
export const IconUser = () => (<svg {...s}><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>)
export const IconTeam = () => (<svg {...s}><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6.4M21 20a6 6 0 0 0-4-5.6"/></svg>)
export const IconCal = () => (<svg {...s}><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>)
export const IconBranch = () => (<svg {...s}><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M8.3 7.2C13 8 13 12 13 15.5"/></svg>)
