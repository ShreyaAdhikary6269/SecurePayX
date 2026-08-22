import { Link } from 'react-router-dom'

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
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
        <path d="M3 12h4l2-7 4 14 2-7h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Step-up OTP verification',
    text: 'High-risk transactions pause for a one-time code before they can go any further.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
        <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Role-based dashboards',
    text: 'Users track their own activity; admins see fraud patterns across every account.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4.5 20c1.4-3.6 4.3-5.4 7.5-5.4s6.1 1.8 7.5 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Fraud alert logging',
    text: 'Every flagged transaction is written to a fraud log admins can search and review.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
        <path d="M12 2.5 21 7v6c0 5-3.7 8.4-9 9.5-5.3-1.1-9-4.5-9-9.5V7l9-4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Explainable flags',
    text: 'Each score ships with plain-language reasons, like an unfamiliar device or unusual amount.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Account controls',
    text: 'Admins can suspend accounts that keep producing high-risk activity.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
        <rect x="3.5" y="6" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 6V5a5 5 0 0 1 10 0v1" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
]

function ShieldMark() {
  return (
    <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z"
        stroke="#3E7BFA"
        strokeWidth="1.6"
      />
      <path d="M11 15.5 14.3 19 21.5 11.5" stroke="#3E7BFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold text-white tracking-tight">
          <ShieldMark />
          <span>Secure<span className="text-blue-500">Pay</span>X</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#risk-levels" className="hover:text-white transition-colors">Risk levels</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">Log in</Link>
          <Link to="/register" className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-500/20 transition-colors">Get started</Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 text-center md:text-left max-w-xl">
          SecurePayX is an academic simulation. No real payments are processed and no real
          financial data is collected.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['React', 'Node.js', 'MongoDB', 'FastAPI', 'Scikit-learn'].map((tech) => (
            <span key={tech} className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Navbar />

      <main className="space-y-24 py-12 md:py-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Academic project · simulated transactions only
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                Every transaction, <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">scored</em> before it settles.
              </h1>

              <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                SecurePayX runs simulated digital payments through a Random Forest model that
                weighs amount, location, device and behavior — then classifies each one as
                low, medium or high risk in real time.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register" className="px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all">Create an account</Link>
                <a href="#how-it-works" className="px-5 py-3 text-sm font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all">See how it works</a>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <b className="text-2xl font-bold text-white">3</b>
                  <span className="text-xs text-slate-400 mt-0.5">Risk tiers</span>
                </div>
                <div className="flex flex-col">
                  <b className="text-2xl font-bold text-white">Random Forest</b>
                  <span className="text-xs text-slate-400 mt-0.5">Primary model</span>
                </div>
                <div className="flex flex-col">
                  <b className="text-2xl font-bold text-white">OTP</b>
                  <span className="text-xs text-slate-400 mt-0.5">Step-up on high risk</span>
                </div>
              </div>
            </div>

            {/* Visual Scanner Mockup */}
            <div className="relative flex items-center justify-center min-h-[420px] bg-slate-900/50 border border-slate-800 rounded-3xl p-6 overflow-hidden backdrop-blur-sm" aria-hidden="true">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 rounded-full border border-blue-500/10 animate-ping opacity-25" />
                <div className="absolute w-60 h-60 rounded-full border border-blue-500/20" />
                <div className="absolute w-96 h-96 rounded-full border border-blue-500/5" />
              </div>

              {/* Dynamic Overlay Cards */}
              <div className="relative w-full max-w-md space-y-4 z-10">
                <div className="p-4 bg-slate-900/90 border border-rose-500/30 rounded-xl shadow-lg flex items-center justify-between text-xs">
                  <div>
                    <b className="block text-sm text-white">$1,240.00</b>
                    <span className="text-slate-400">New device · 2:14 AM</span>
                  </div>
                  <span className="px-2.5 py-1 font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md">HIGH RISK</span>
                </div>

                <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-xl shadow-lg flex items-center justify-between text-xs translate-x-3">
                  <div>
                    <b className="block text-sm text-white">$42.50</b>
                    <span className="text-slate-400">Usual merchant</span>
                  </div>
                  <span className="px-2.5 py-1 font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">LOW RISK</span>
                </div>

                <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-xl shadow-lg flex items-center justify-between text-xs -translate-x-3">
                  <div>
                    <b className="block text-sm text-white">$310.00</b>
                    <span className="text-slate-400">Unusual location</span>
                  </div>
                  <span className="px-2.5 py-1 font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md">MEDIUM RISK</span>
                </div>

                <div className="mt-6 p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-center">
                  <span className="block text-3xl font-black text-blue-400 tracking-tight">0.947</span>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mt-1 block">Fraud probability</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transaction Flow */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Transaction flow</div>
              <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">From submission to decision</h2>
              <p className="mt-3 text-slate-400">
                The Node.js backend never runs the model itself — it hands the transaction to an
                isolated FastAPI service and acts on whatever risk level comes back.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {FLOW_STEPS.map((step) => (
                <div key={step.n} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 mb-3">{step.n}</div>
                    <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">What's inside</div>
              <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Built like a real fraud desk</h2>
              <p className="mt-3 text-slate-400">
                Everything a payments security team would expect to see, scaled down to a
                self-contained academic build.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Risk Classification */}
        <section id="risk-levels" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Risk classification</div>
              <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">What happens at each tier</h2>
              <p className="mt-3 text-slate-400">The same fraud score drives a different response depending on where it lands.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Low Risk */}
              <div className="p-6 bg-slate-900/60 border border-emerald-500/20 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold tracking-wider text-emerald-400">LOW RISK</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Approved</h3>
                  <p className="text-sm text-slate-400 mb-6">Behavior matches the account's typical pattern.</p>
                </div>
                <ul className="space-y-2.5 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ Transaction settles immediately</li>
                  <li className="flex items-center gap-2">✓ Logged to transaction history</li>
                  <li className="flex items-center gap-2">✓ No user action needed</li>
                </ul>
              </div>

              {/* Medium Risk */}
              <div className="p-6 bg-slate-900/60 border border-amber-500/20 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold tracking-wider text-amber-400">MEDIUM RISK</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Flagged for review</h3>
                  <p className="text-sm text-slate-400 mb-6">Some signals are unusual but not conclusive.</p>
                </div>
                <ul className="space-y-2.5 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ User sees an in-app warning</li>
                  <li className="flex items-center gap-2">✓ Extra confirmation step shown</li>
                  <li className="flex items-center gap-2">✓ Recorded for admin visibility</li>
                </ul>
              </div>

              {/* High Risk */}
              <div className="p-6 bg-slate-900/60 border border-rose-500/20 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold tracking-wider text-rose-400">HIGH RISK</span>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Blocked pending OTP</h3>
                  <p className="text-sm text-slate-400 mb-6">Multiple strong fraud signals were detected together.</p>
                </div>
                <ul className="space-y-2.5 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ OTP verification required</li>
                  <li className="flex items-center gap-2">✓ Fraud alert generated</li>
                  <li className="flex items-center gap-2">✓ Admin is notified</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 md:p-12 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Ready to run a transaction through it?</h2>
                <p className="mt-2 text-slate-400 text-sm sm:text-base">Register a simulated account and watch a transaction move through scoring end to end.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <Link to="/register" className="px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all">Create an account</Link>
                <Link to="/login" className="px-5 py-3 text-sm font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all">I already have one</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}