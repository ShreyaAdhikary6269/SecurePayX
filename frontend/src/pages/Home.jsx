import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SecurityBackground from '../components/Securitybackground'

const FLOW_STEPS = [
  { n: '01', title: 'Register & log in', text: 'Create an account secured with hashed passwords and JWT sessions.' },
  { n: '02', title: 'Make a transaction', text: 'Submit a simulated payment with amount, location, device and timing.' },
  { n: '03', title: 'Model scores it', text: 'A Random Forest model returns a fraud probability in real time.' },
  { n: '04', title: 'Risk is classified', text: 'The score is mapped to LOW, MEDIUM or HIGH risk.' },
  { n: '05', title: 'Action is taken', text: 'Approve, warn, or trigger OTP verification and a fraud alert.' },
]

const FEATURES = [
  {
    title: 'Real-time risk scoring',
    text: 'Every simulated transaction is sent to an isolated FastAPI service and scored before it settles.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M3 12h4l2-7 4 14 2-7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Step-up OTP verification',
    text: 'High-risk transactions pause for a one-time code before they can go any further.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Role-based dashboards',
    text: 'Users track their own activity; admins see fraud patterns across every account.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.5 20c1.4-3.6 4.3-5.4 7.5-5.4s6.1 1.8 7.5 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Fraud alert logging',
    text: 'Every flagged transaction is written to a fraud log admins can search and review.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M12 2.5 21 7v6c0 5-3.7 8.4-9 9.5-5.3-1.1-9-4.5-9-9.5V7l9-4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Explainable flags',
    text: 'Each score ships with plain-language reasons, like an unfamiliar device or unusual amount.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Account controls',
    text: 'Admins can suspend accounts that keep producing high-risk activity.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect x="3.5" y="6" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 6V5a5 5 0 0 1 10 0v1" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
]

const JOURNEY_STAGES = [
  { label: 'PAYMENT', sub: 'Transaction submitted' },
  { label: 'DATA ANALYSIS', sub: 'Signals extracted' },
  { label: 'AI MODEL', sub: 'Pattern scored' },
  { label: 'RISK SCORE', sub: 'Probability assigned' },
  { label: 'PROTECTION', sub: 'Action taken' },
]

function ShieldMark({ className = 'w-7 h-7', stroke = '#059669' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path d="M11 15.5 14.3 19 21.5 11.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="1" fill="currentColor" />
    </svg>
  )
}

function useIsLoggedIn() {
  return typeof window !== 'undefined' && !!localStorage.getItem('token')
}

function useCountUp(target, duration = 1400, start = false, decimals = 1) {
  const [value, setValue] = useState(0)
  const frame = useRef()

  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    function tick(now) {
      const progress = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [start, target, duration])

  return value.toFixed(decimals)
}

/* ---------- Hero visualization ---------- */
function FraudVisualization({ active }) {
  const wrapRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const score = useCountUp(94.7, 1600, active, 1)
  const CIRC = 2 * Math.PI * 54

  const handleMouseMove = (e) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -6, y: px * 8 })
  }
  const resetTilt = () => setTilt({ x: 0, y: 0 })

  return (
    <div ref={wrapRef} onMouseMove={handleMouseMove} onMouseLeave={resetTilt} className="relative" style={{ perspective: '1200px' }}>
      <div
        className="relative bg-white border border-line p-6 sm:p-8 shadow-[0_30px_80px_-30px_rgba(5,150,105,0.3)] transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs tracking-wide text-ink-muted uppercase font-medium">Live fraud analysis</span>
          <span className="flex items-center gap-1.5 text-sm text-green font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
            </span>
            Active
          </span>
        </div>

        <svg viewBox="0 0 480 300" className="w-full h-auto overflow-visible">
          <path id="p1" pathLength="1" d="M 90 40 C 160 40, 170 110, 235 140" fill="none" stroke="#059669" strokeWidth="1.5" strokeOpacity="0.35" className={active ? 'animate-draw-path' : 'opacity-0'} />
          <path id="p2" pathLength="1" d="M 90 150 C 150 150, 170 145, 235 150" fill="none" stroke="#059669" strokeWidth="1.5" strokeOpacity="0.35" className={active ? 'animate-draw-path' : 'opacity-0'} style={{ animationDelay: '0.2s' }} />
          <path id="p3" pathLength="1" d="M 90 250 C 160 250, 170 180, 235 160" fill="none" stroke="#059669" strokeWidth="1.5" strokeOpacity="0.35" className={active ? 'animate-draw-path' : 'opacity-0'} style={{ animationDelay: '0.4s' }} />
          <path id="p4" pathLength="1" d="M 275 150 C 330 150, 340 150, 380 150" fill="none" stroke="#059669" strokeWidth="1.8" strokeOpacity="0.5" className={active ? 'animate-draw-path' : 'opacity-0'} style={{ animationDelay: '0.7s' }} />

          {active && (
            <>
              <circle r="2.5" fill="#10B981"><animateMotion dur="2.8s" repeatCount="indefinite" begin="1s"><mpath href="#p1" /></animateMotion></circle>
              <circle r="2.5" fill="#10B981"><animateMotion dur="2.4s" repeatCount="indefinite" begin="1.3s"><mpath href="#p2" /></animateMotion></circle>
              <circle r="2.5" fill="#10B981"><animateMotion dur="3s" repeatCount="indefinite" begin="1.6s"><mpath href="#p3" /></animateMotion></circle>
              <circle r="3" fill="#059669"><animateMotion dur="1.8s" repeatCount="indefinite" begin="2s"><mpath href="#p4" /></animateMotion></circle>
            </>
          )}

          <g className={active ? 'animate-fade-in-left' : 'opacity-0'} style={{ animationDelay: '0.1s' }}>
            <rect x="0" y="22" width="92" height="36" fill="#F4FAF7" stroke="#DCEAE3" />
            <text x="10" y="37" fontSize="12" fill="#0F1E17" fontWeight="700">Rs 12,450</text>
            <text x="10" y="50" fontSize="9.5" fill="#5B6F64">Amount</text>
          </g>
          <g className={active ? 'animate-fade-in-left' : 'opacity-0'} style={{ animationDelay: '0.3s' }}>
            <rect x="0" y="132" width="92" height="36" fill="#F4FAF7" stroke="#DCEAE3" />
            <text x="10" y="147" fontSize="12" fill="#0F1E17" fontWeight="700">New device</text>
            <text x="10" y="160" fontSize="9.5" fill="#5B6F64">02:14 AM</text>
          </g>
          <g className={active ? 'animate-fade-in-left' : 'opacity-0'} style={{ animationDelay: '0.5s' }}>
            <rect x="0" y="232" width="92" height="36" fill="#F4FAF7" stroke="#DCEAE3" />
            <text x="10" y="247" fontSize="12" fill="#0F1E17" fontWeight="700">Unusual</text>
            <text x="10" y="260" fontSize="9.5" fill="#5B6F64">Location</text>
          </g>

          <g className={active ? 'animate-fade-in-up' : 'opacity-0'} style={{ animationDelay: '0.6s' }}>
            <circle cx="255" cy="150" r="40" fill="#052E22" className="animate-pulse-glow" />
            <circle cx="255" cy="150" r="40" fill="none" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
            <text x="255" y="142" fontSize="10" fill="#D1FAE5" textAnchor="middle" fontWeight="700">AI</text>
            <text x="255" y="153" fontSize="8.5" fill="#A7F3D0" textAnchor="middle">FRAUD</text>
            <text x="255" y="164" fontSize="8.5" fill="#A7F3D0" textAnchor="middle">ENGINE</text>
          </g>
        </svg>

        <div className={`flex items-center gap-6 mt-2 pt-6 border-t border-line ${active ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '1s' }}>
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#F1E4E4" strokeWidth="9" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="#DC2626" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={active ? CIRC * (1 - Number(score) / 100) : CIRC}
                style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-xl font-semibold text-ink">{score}%</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-ink-muted mb-1.5 font-medium">Fraud probability</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              HIGH RISK
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WaveDivider() {
  return (
    <svg viewBox="0 0 1200 60" className="w-full h-[40px] sm:h-[60px]" preserveAspectRatio="none">
      <path d="M0,30 C 200,60 300,0 500,25 C 700,50 800,5 1000,30 C 1100,42 1150,20 1200,28" fill="none" stroke="#059669" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  )
}

function JourneyBand() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative bg-[#07231A] py-24 overflow-hidden">
      <SecurityBackground className="opacity-30" density={40} color="16, 185, 129" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="text-sm text-green-bright mb-2 tracking-wide font-medium">The intelligence pipeline</div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white">From payment to protection, in milliseconds</h2>
        </div>

        <div className="relative">
          <svg viewBox="0 0 1000 80" className="w-full h-16 hidden sm:block" preserveAspectRatio="none">
            <path id="journey-path" pathLength="1" d="M 60 40 C 250 -10, 350 90, 500 40 C 650 -10, 750 90, 940 40" fill="none" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" className={visible ? 'animate-draw-path' : 'opacity-0'} />
            {visible && (
              <circle r="4" fill="#34D399"><animateMotion dur="4s" repeatCount="indefinite" begin="1.5s"><mpath href="#journey-path" /></animateMotion></circle>
            )}
          </svg>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-4 sm:-mt-6">
            {JOURNEY_STAGES.map((stage, i) => (
              <div key={stage.label} className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-green-bright/40 bg-white/5 flex items-center justify-center text-green-bright text-sm font-serif font-semibold">
                  {i + 1}
                </div>
                <div className="text-sm tracking-wide text-white font-semibold">{stage.label}</div>
                <div className="text-xs text-emerald-200/70 mt-1">{stage.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Navbar() {
  const isLoggedIn = useIsLoggedIn()
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-serif text-xl font-semibold text-ink group">
          <ShieldMark className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
          <span>SecurePayX</span>
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-base text-ink-muted font-medium">
          {[['#how-it-works', 'How it works'], ['#features', 'Features'], ['#risk-levels', 'Risk levels']].map(([href, label]) => (
            <a key={href} href={href} className="relative py-1 hover:text-ink transition-colors group">
              {label}
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-green transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link to="/dashboard" className="px-5 py-2.5 text-base font-medium text-white bg-green hover:bg-green-strong hover:shadow-md hover:shadow-green/20 hover:-translate-y-0.5 transition-all duration-200">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-base font-medium text-ink-muted hover:text-ink transition-colors">Log in</Link>
              <Link to="/register" className="px-5 py-2.5 text-base font-medium text-white bg-green hover:bg-green-strong hover:shadow-md hover:shadow-green/20 hover:-translate-y-0.5 transition-all duration-200">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-bg py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-ink-muted text-center md:text-left max-w-xl">
          SecurePayX is an academic simulation. No real payments are processed and no real financial data is collected.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['React', 'Node.js', 'MongoDB', 'FastAPI', 'Scikit-learn'].map((tech) => (
            <span key={tech} className="px-3 py-1.5 text-sm font-medium border border-line text-ink-muted hover:border-green hover:text-green transition-colors">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

const RISK_TIERS = [
  {
    key: 'low', label: 'LOW RISK', title: 'Approved',
    desc: 'Behavior matches the account\'s typical pattern.',
    points: ['Transaction settles immediately', 'Logged to transaction history', 'No user action needed'],
    icon: <CheckIcon />,
    classes: {
      card: 'border-green/30 bg-gradient-to-br from-green-soft/60 to-white hover:shadow-green/20',
      bar: 'bg-green',
      badge: 'text-green',
      iconWrap: 'bg-green text-white',
      dot: 'bg-green',
    },
  },
  {
    key: 'medium', label: 'MEDIUM RISK', title: 'Flagged for review',
    desc: 'Some signals are unusual but not conclusive.',
    points: ['User sees an in-app warning', 'Extra confirmation step shown', 'Recorded for admin visibility'],
    icon: <WarnIcon />,
    classes: {
      card: 'border-amber-300 bg-gradient-to-br from-amber-50 to-white hover:shadow-amber-500/20',
      bar: 'bg-amber-500',
      badge: 'text-amber-700',
      iconWrap: 'bg-amber-500 text-white',
      dot: 'bg-amber-500',
    },
  },
  {
    key: 'high', label: 'HIGH RISK', title: 'Blocked pending OTP',
    desc: 'Multiple strong fraud signals were detected together.',
    points: ['OTP verification required', 'Fraud alert generated', 'Admin is notified'],
    icon: <AlertIcon />,
    classes: {
      card: 'border-red-300 bg-gradient-to-br from-red-50 to-white hover:shadow-red-500/20',
      bar: 'bg-red-600',
      badge: 'text-red-700',
      iconWrap: 'bg-red-600 text-white',
      dot: 'bg-red-600',
    },
  },
]

export default function Home() {
  const isLoggedIn = useIsLoggedIn()
  const [heroActive, setHeroActive] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroActive(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-ink font-sans relative">
      <style>{`
        @keyframes fade-in-up { from { opacity:0; transform:translateY(14px);} to {opacity:1; transform:translateY(0);} }
        @keyframes fade-in-left { from { opacity:0; transform:translateX(-10px);} to {opacity:1; transform:translateX(0);} }
        @keyframes draw-path { from { stroke-dashoffset:1; opacity:0.15;} to {stroke-dashoffset:0; opacity:1;} }
        @keyframes pulse-glow { 0%,100% { filter:drop-shadow(0 0 0px rgba(16,185,129,0.5)); } 50% { filter:drop-shadow(0 0 12px rgba(16,185,129,0.65)); } }
        @keyframes drift-slow { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(40px,-30px) scale(1.08);} }
        @keyframes drift-slower { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-50px,40px) scale(1.1);} }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease-out forwards; }
        .animate-fade-in-left { animation: fade-in-left 0.6s ease-out forwards; }
        .animate-draw-path { stroke-dasharray: 1; animation: draw-path 1.1s ease-out forwards; }
        .animate-pulse-glow { animation: pulse-glow 2.4s ease-in-out infinite; }
        .animate-drift-slow { animation: drift-slow 16s ease-in-out infinite; }
        .animate-drift-slower { animation: drift-slower 20s ease-in-out infinite; }
        .bg-security-grid {
          background-image: linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}</style>

      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative pt-16 pb-6 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-security-grid opacity-[0.03]" />
            <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-green/10 blur-3xl animate-drift-slow" />
            <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-green-bright/10 blur-3xl animate-drift-slower" />
            <SecurityBackground className="opacity-70" density={55} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
            <div className={heroActive ? 'animate-fade-in-up' : 'opacity-0'}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium tracking-wide text-green bg-green-soft border border-green/20 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
                </span>
                AI-POWERED DIGITAL PAYMENT SECURITY
              </span>

              <h1 className="font-serif font-semibold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-ink tracking-tight">
                Every Payment.
                <br />
                <span className="bg-gradient-to-r from-green via-green-bright to-green bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(16,185,129,0.25)]">
                  Scored
                </span>{' '}
                Before It Settles.
              </h1>

              <p className="mt-8 text-xl text-ink-muted leading-relaxed max-w-md">
                SecurePayX uses machine learning to analyze digital payment behavior, detect
                suspicious transactions and calculate fraud risk in real time.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link
                  to={isLoggedIn ? '/dashboard' : '/register'}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 text-base font-medium text-white bg-green hover:bg-green-strong hover:shadow-lg hover:shadow-green/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {isLoggedIn ? 'Explore Dashboard' : 'Get Started'}
                  <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                </Link>
                <a href="#how-it-works" className="text-base font-medium text-ink border-b-2 border-line hover:border-green hover:text-green transition-colors pb-0.5">
                  How It Works
                </a>
              </div>

              <div className="mt-16 pt-8 border-t border-line grid grid-cols-3 gap-4 max-w-md">
                <div className="flex flex-col group cursor-default">
                  <b className="font-serif text-3xl font-semibold text-ink transition-colors group-hover:text-green">3</b>
                  <span className="text-sm text-ink-muted mt-1">Risk tiers</span>
                </div>
                <div className="flex flex-col group cursor-default">
                  <b className="font-serif text-2xl font-semibold text-ink transition-colors group-hover:text-green">Random Forest</b>
                  <span className="text-sm text-ink-muted mt-1">Primary model</span>
                </div>
                <div className="flex flex-col group cursor-default">
                  <b className="font-serif text-3xl font-semibold text-ink transition-colors group-hover:text-green">OTP</b>
                  <span className="text-sm text-ink-muted mt-1">Step-up on high risk</span>
                </div>
              </div>
            </div>

            <FraudVisualization active={heroActive} />
          </div>

          <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <WaveDivider />
          </div>
        </section>

        <JourneyBand />

        {/* Transaction Flow */}
        <section id="how-it-works" className="scroll-mt-20 py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <div className="text-sm text-green mb-2 font-semibold tracking-wide">TRANSACTION FLOW</div>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-ink">From submission to decision</h2>
              <p className="mt-4 text-lg text-ink-muted">
                The Node.js backend never runs the model itself, it hands the transaction to an
                isolated FastAPI service and acts on whatever risk level comes back.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {FLOW_STEPS.map((step) => (
                <div
                  key={step.n}
                  className="relative p-6 bg-white border border-line hover:border-green/40 hover:shadow-xl hover:shadow-green/10 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-green scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                  <div className="w-11 h-11 rounded-full bg-green-soft text-green flex items-center justify-center font-serif font-semibold text-base mb-4 group-hover:bg-green group-hover:text-white transition-colors duration-300">
                    {step.n}
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 bg-bg-subtle border-y border-line py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-security-grid opacity-[0.02] -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <div className="text-sm text-green mb-2 font-semibold tracking-wide">WHAT'S INSIDE</div>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-ink">Built like a real fraud desk</h2>
              <p className="mt-4 text-lg text-ink-muted">
                Everything a payments security team would expect to see, scaled down to a self-contained academic build.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="relative p-7 bg-white border border-line shadow-sm hover:border-green hover:shadow-xl hover:shadow-green/15 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-green-soft opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
                  <div className="w-14 h-14 rounded-xl bg-green-soft text-green flex items-center justify-center mb-5 group-hover:bg-green group-hover:text-white group-hover:scale-105 transition-all duration-300 relative">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-ink mb-2.5">{f.title}</h3>
                  <p className="text-base text-ink-muted leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Risk Classification - color coded by tier */}
        <section id="risk-levels" className="scroll-mt-20 py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <div className="text-sm text-green mb-2 font-semibold tracking-wide">RISK CLASSIFICATION</div>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-ink">What happens at each tier</h2>
              <p className="mt-4 text-lg text-ink-muted">The same fraud score drives a different response depending on where it lands.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-7">
              {RISK_TIERS.map((tier) => (
                <div
                  key={tier.key}
                  className={`relative border p-7 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden ${tier.classes.card}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${tier.classes.bar}`} />
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className={`text-sm font-bold tracking-wide ${tier.classes.badge}`}>{tier.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${tier.classes.dot}`} />
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tier.classes.iconWrap}`}>
                      {tier.icon}
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-ink mb-2">{tier.title}</h3>
                    <p className="text-base text-ink-muted mb-6">{tier.desc}</p>
                  </div>
                  <ul className="space-y-2.5 border-t border-black/10 pt-4 text-sm text-ink-muted">
                    {tier.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${tier.classes.dot}`} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative p-10 md:p-14 bg-gradient-to-br from-green-soft via-bg-subtle to-bg border border-green/20 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-green/10 blur-3xl animate-drift-slow" />
              <div className="max-w-xl relative">
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">Ready to run a transaction through it?</h2>
                <p className="mt-3 text-ink-muted text-base sm:text-lg">Register a simulated account and watch a transaction move through scoring end to end.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0 relative">
                {isLoggedIn ? (
                  <Link to="/dashboard" className="px-7 py-3.5 text-base font-medium text-white bg-green hover:bg-green-strong hover:shadow-lg hover:shadow-green/25 hover:-translate-y-0.5 transition-all duration-200">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="px-7 py-3.5 text-base font-medium text-white bg-green hover:bg-green-strong hover:shadow-lg hover:shadow-green/25 hover:-translate-y-0.5 transition-all duration-200">
                      Create an account
                    </Link>
                    <Link to="/login" className="px-7 py-3.5 text-base font-medium text-ink border border-line hover:border-green hover:text-green hover:-translate-y-0.5 transition-all duration-200">
                      I already have one
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}