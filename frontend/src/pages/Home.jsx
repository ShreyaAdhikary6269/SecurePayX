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
    <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z"
        stroke="#14532D"
        strokeWidth="1.5"
      />
      <path d="M11 15.5 14.3 19 21.5 11.5" stroke="#14532D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-serif text-lg text-ink">
          <ShieldMark />
          <span>SecurePayX</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-muted">
          <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#risk-levels" className="hover:text-ink transition-colors">Risk levels</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="px-3.5 py-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm text-white bg-green hover:bg-green-strong transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-ink-muted text-center md:text-left max-w-xl">
          SecurePayX is an academic simulation. No real payments are processed and no real
          financial data is collected.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['React', 'Node.js', 'MongoDB', 'FastAPI', 'Scikit-learn'].map((tech) => (
            <span key={tech} className="px-2.5 py-1 text-xs border border-line text-ink-muted">
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
    <div className="min-h-screen bg-bg text-ink font-sans">
      <Navbar />

      <main className="space-y-24 py-12 md:py-20">
        <section>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs text-green bg-green-soft border border-line mb-6">
                Academic project (simulated transactions only)
              </span>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.15] text-ink">
                Every transaction, scored before it settles.
              </h1>

              <p className="mt-6 text-lg text-ink-muted leading-relaxed max-w-lg">
                SecurePayX runs simulated digital payments through a Random Forest model that
                weighs amount, location, device and behavior, then classifies each one as
                low, medium or high risk in real time.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="px-6 py-3 text-sm text-white bg-green hover:bg-green-strong transition-colors"
                >
                  Create an account
                </Link>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 text-sm text-ink border border-line hover:border-green transition-colors"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-12 pt-8 border-t border-line grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <b className="font-serif text-2xl text-ink">3</b>
                  <span className="text-xs text-ink-muted mt-0.5">Risk tiers</span>
                </div>
                <div className="flex flex-col">
                  <b className="font-serif text-2xl text-ink">Random Forest</b>
                  <span className="text-xs text-ink-muted mt-0.5">Primary model</span>
                </div>
                <div className="flex flex-col">
                  <b className="font-serif text-2xl text-ink">OTP</b>
                  <span className="text-xs text-ink-muted mt-0.5">Step-up on high risk</span>
                </div>
              </div>
            </div>

            <div className="relative bg-bg-subtle border border-line p-6">
              <div className="space-y-4">
                <div className="p-4 bg-bg border border-line flex items-center justify-between text-xs">
                  <div>
                    <b className="block text-sm text-ink">$1,240.00</b>
                    <span className="text-ink-muted">New device, 2:14 AM</span>
                  </div>
                  <span className="px-2.5 py-1 text-red-700 bg-red-50 border border-red-200">HIGH RISK</span>
                </div>

                <div className="p-4 bg-bg border border-line flex items-center justify-between text-xs">
                  <div>
                    <b className="block text-sm text-ink">$42.50</b>
                    <span className="text-ink-muted">Usual merchant</span>
                  </div>
                  <span className="px-2.5 py-1 text-green bg-green-soft border border-line">LOW RISK</span>
                </div>

                <div className="p-4 bg-bg border border-line flex items-center justify-between text-xs">
                  <div>
                    <b className="block text-sm text-ink">$310.00</b>
                    <span className="text-ink-muted">Unusual location</span>
                  </div>
                  <span className="px-2.5 py-1 text-amber-700 bg-amber-50 border border-amber-200">MEDIUM RISK</span>
                </div>

                <div className="mt-6 p-4 bg-bg-subtle border border-line text-center">
                  <span className="block font-serif text-3xl text-green">0.947</span>
                  <span className="text-xs text-ink-muted mt-1 block">Fraud probability</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs text-green mb-2">Transaction flow</div>
              <h2 className="font-serif text-3xl text-ink sm:text-4xl">From submission to decision</h2>
              <p className="mt-3 text-ink-muted">
                The Node.js backend never runs the model itself, it hands the transaction to an
                isolated FastAPI service and acts on whatever risk level comes back.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-0 border-t border-l border-line">
              {FLOW_STEPS.map((step) => (
                <div key={step.n} className="p-5 border-r border-b border-line flex flex-col justify-between">
                  <div>
                    <div className="font-serif text-xs text-green mb-3">{step.n}</div>
                    <h3 className="text-base text-ink mb-2">{step.title}</h3>
                    <p className="text-xs text-ink-muted leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-bg-subtle border-y border-line py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs text-green mb-2">What's inside</div>
              <h2 className="font-serif text-3xl text-ink sm:text-4xl">Built like a real fraud desk</h2>
              <p className="mt-3 text-ink-muted">
                Everything a payments security team would expect to see, scaled down to a
                self-contained academic build.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <div className="w-9 h-9 border border-line text-green flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-serif text-ink mb-2">{f.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="risk-levels" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs text-green mb-2">Risk classification</div>
              <h2 className="font-serif text-3xl text-ink sm:text-4xl">What happens at each tier</h2>
              <p className="mt-3 text-ink-muted">The same fraud score drives a different response depending on where it lands.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-line p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-green">LOW RISK</span>
                    <span className="w-2 h-2 bg-green" />
                  </div>
                  <h3 className="font-serif text-xl text-ink mb-2">Approved</h3>
                  <p className="text-sm text-ink-muted mb-6">Behavior matches the account's typical pattern.</p>
                </div>
                <ul className="space-y-2.5 border-t border-line pt-4 text-xs text-ink-muted">
                  <li>Transaction settles immediately</li>
                  <li>Logged to transaction history</li>
                  <li>No user action needed</li>
                </ul>
              </div>

              <div className="border border-line p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-amber-700">MEDIUM RISK</span>
                    <span className="w-2 h-2 bg-amber-500" />
                  </div>
                  <h3 className="font-serif text-xl text-ink mb-2">Flagged for review</h3>
                  <p className="text-sm text-ink-muted mb-6">Some signals are unusual but not conclusive.</p>
                </div>
                <ul className="space-y-2.5 border-t border-line pt-4 text-xs text-ink-muted">
                  <li>User sees an in-app warning</li>
                  <li>Extra confirmation step shown</li>
                  <li>Recorded for admin visibility</li>
                </ul>
              </div>

              <div className="border border-line p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-red-700">HIGH RISK</span>
                    <span className="w-2 h-2 bg-red-600" />
                  </div>
                  <h3 className="font-serif text-xl text-ink mb-2">Blocked pending OTP</h3>
                  <p className="text-sm text-ink-muted mb-6">Multiple strong fraud signals were detected together.</p>
                </div>
                <ul className="space-y-2.5 border-t border-line pt-4 text-xs text-ink-muted">
                  <li>OTP verification required</li>
                  <li>Fraud alert generated</li>
                  <li>Admin is notified</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 md:p-12 bg-bg-subtle border border-line flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="font-serif text-2xl sm:text-3xl text-ink">Ready to run a transaction through it?</h2>
                <p className="mt-2 text-ink-muted text-sm sm:text-base">Register a simulated account and watch a transaction move through scoring end to end.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <Link
                  to="/register"
                  className="px-6 py-3 text-sm text-white bg-green hover:bg-green-strong transition-colors"
                >
                  Create an account
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 text-sm text-ink border border-line hover:border-green transition-colors"
                >
                  I already have one
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}