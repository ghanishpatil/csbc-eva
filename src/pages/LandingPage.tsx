import { useNavigate } from 'react-router-dom';
import { Shield, Target, Trophy, Terminal, Users, Activity, Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CyberCard } from '@/components/ui/CyberCard';
import { StatCard } from '@/components/ui/StatCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { SectionTitle } from '@/components/ui/SectionTitle';
import csbcLogo from '../../csbc-logo.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#020617] to-black">
      {/* Subtle animated grid / scanlines */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] mix-blend-screen">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.5)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(34,211,238,0.15),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.2),transparent_55%)]" />
      </div>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* HERO */}
        <motion.div
          className="relative"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <CyberCard className="relative overflow-hidden border border-cyber-border/80 bg-cyber-bg/90 shadow-[0_0_40px_rgba(15,23,42,0.8)]">
            {/* Horizontal scanner line */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent z-0"
              style={{
                boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)',
              }}
              initial={{ top: '-2px', opacity: 0 }}
              animate={{ 
                top: ['-2px', '100%'],
                opacity: [0, 0.8, 0.8, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
                delay: 0.5,
              }}
            />

            <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-start gap-8 sm:gap-10 lg:gap-8 lg:max-w-6xl lg:mx-auto p-4 sm:p-6">
              {/* Left: copy + actions */}
              <div className="flex flex-col gap-4 sm:gap-6">
                <motion.div
                  className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-cyber-neon-green/40 bg-cyber-neon-green/5 w-fit"
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-cyber-neon-green animate-pulse flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-mono text-cyber-neon-green/90 tracking-wide">
                    <span className="hidden sm:inline">SYSTEM ONLINE · REAL-TIME EVENT ENGINE</span>
                    <span className="sm:hidden">SYSTEM ONLINE</span>
                  </span>
                </motion.div>

                <motion.h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-cyber font-bold text-cyber-text-primary leading-tight tracking-wide"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Mission Exploit
                  <span className="block text-lg sm:text-xl text-cyber-neon-blue/90 mt-2">
                    Physical Cyber Hunt · Deployment Console
                  </span>
                </motion.h1>

                <motion.p
                  className="text-cyber-text-secondary text-sm lg:text-base max-w-2xl leading-relaxed"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Navigate real-world locations, scan QR checkpoints, and execute tightly timed cyber
                  missions. Movement, hints, scoring and progression are enforced from a locked backend
                  control center—no shortcuts, no manual overrides.
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <NeonButton 
                    color="blue" 
                    icon={Terminal} 
                    onClick={() => navigate('/login')} 
                    className="w-full sm:w-auto sm:min-w-[200px] md:min-w-[240px]" 
                    size="md"
                  >
                    <span className="hidden lg:inline">Access Mission Terminal</span>
                    <span className="hidden sm:inline lg:hidden">Mission Terminal</span>
                    <span className="sm:hidden">Terminal</span>
                  </NeonButton>
                  <NeonButton 
                    color="green" 
                    icon={Trophy} 
                    onClick={() => navigate('/leaderboard')} 
                    className="w-full sm:w-auto sm:min-w-[200px] md:min-w-[240px]" 
                    size="md"
                  >
                    <span className="hidden lg:inline">Monitor Leaderboard</span>
                    <span className="hidden sm:inline lg:hidden">Leaderboard</span>
                    <span className="sm:hidden">Rankings</span>
                  </NeonButton>
                </motion.div>
              </div>

              {/* Right: logo with floating animation */}
              <motion.div
                className="relative flex items-center justify-center lg:mt-4 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -12, 0]
                }}
                transition={{ 
                  opacity: { duration: 0.8, ease: 'easeOut' },
                  scale: { duration: 0.8, ease: 'easeOut' },
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.8
                  }
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-cyan-500/22 blur-3xl rounded-full"
                  animate={{ opacity: [0.18, 0.35, 0.18] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative w-48 h-48 xs:w-56 xs:h-56 sm:w-60 sm:h-64 flex items-center justify-center mx-auto lg:mx-0">
                  <motion.img
                    src={csbcLogo}
                    alt="CSBC Cybersecurity Club"
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      filter: ['brightness(0.95)', 'brightness(1.08)', 'brightness(0.95)'],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            </div>
          </CyberCard>
        </motion.div>

        {/* LIVE SYSTEM TELEMETRY */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <CyberCard>
            <SectionTitle
              icon={Activity}
              title="LIVE SYSTEM TELEMETRY"
              subtitle="High-level view of the event engine while a hunt is running"
            />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={Target} label="Active Missions" value="12" color="purple" />
              <StatCard icon={Users} label="Deployed Teams" value="40+" color="blue" />
              <StatCard icon={Activity} label="Live Submissions" value="1K+" color="green" />
              <StatCard icon={Star} label="Max Score" value="10,000" color="yellow" />
            </div>
            <p className="mt-4 text-[11px] font-mono text-cyber-text-secondary/70">
              Metrics are fed directly from Firestore snapshots and backend evaluation—no manual refresh,
              no client-side tampering.
            </p>
          </CyberCard>
        </motion.div>

        {/* PLATFORM CONCEPT - PHYSICAL CYBER HUNT ENGINE */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <CyberCard className="relative overflow-hidden">
            <SectionTitle
              icon={Shield}
              title="PHYSICAL CYBER HUNT ENGINE"
              subtitle="How Mission Exploit runs your on-ground cybersecurity event"
            />
            {/* Three core pillars */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5">
                <div className="text-xs font-mono text-cyber-neon-blue mb-2">01 // FIELD MOVEMENT</div>
                <h3 className="text-cyber-text-primary font-semibold mb-2">Location-based missions</h3>
                <p className="text-sm text-cyber-text-secondary">
                  Teams move across campus to physical checkpoints, guided by story-driven clues and
                  mission briefings. The map is part of the challenge.
                </p>
              </div>
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5">
                <div className="text-xs font-mono text-cyber-neon-green mb-2">02 // QR CHECKPOINTS</div>
                <h3 className="text-cyber-text-primary font-semibold mb-2">QR-locked access</h3>
                <p className="text-sm text-cyber-text-secondary">
                  Every location is sealed behind a QR identifier. No scan, no mission access, no hints.
                  Physical presence is mandatory at every stage.
                </p>
              </div>
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5">
                <div className="text-xs font-mono text-cyber-neon-red mb-2">03 // CONTROLLED PROGRESSION</div>
                <h3 className="text-cyber-text-primary font-semibold mb-2">Backend-enforced flow</h3>
                <p className="text-sm text-cyber-text-secondary">
                  Admins control event state, timers, hints, and scores from a locked console while
                  captains monitor group performance in real time.
                </p>
              </div>
            </div>

            {/* Operational pipeline line */}
            <div className="mt-8 border-t border-cyber-border/60 pt-6">
              <div className="text-xs font-mono text-cyber-text-secondary mb-3 tracking-[0.22em] uppercase">
                Mission pipeline
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
                <div className="flex-1 flex flex-wrap gap-2 sm:gap-3">
                  {[
                    'Briefing',
                    'Deployment',
                    'Check-in',
                    'Exploit',
                    'Flag submit',
                    'Review',
                  ].map((stage, index) => (
                    <div
                      key={stage}
                      className="flex items-center gap-2 text-xs font-mono text-cyber-text-secondary"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyber-neon-blue" />
                      <span className="uppercase">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1} // {stage}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-cyber-text-secondary/70 font-mono max-w-sm">
                  Each stage is timestamped and stored, enabling post-event analysis and fair scoring.
                </p>
              </div>
            </div>
          </CyberCard>
        </motion.div>

        {/* CHEAT-RESISTANT BY DESIGN */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <CyberCard>
            <SectionTitle
              icon={Shield}
              title="CHEAT-RESISTANT BY DESIGN"
              subtitle="Why teams cannot bypass locations, flags, or scoring rules"
            />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5 space-y-2">
                <div className="text-xs font-mono text-cyber-neon-red tracking-[0.22em] uppercase">
                  Backend-locked evaluation
                </div>
                <p className="text-sm text-cyber-text-secondary">
                  Flags are validated and scored exclusively on the backend using hashed comparison and
                  event state. The UI never decides correctness, and local tampering cannot award points.
                </p>
              </div>
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5 space-y-2">
                <div className="text-xs font-mono text-cyber-neon-green tracking-[0.22em] uppercase">
                  Location-bound access
                </div>
                <p className="text-sm text-cyber-text-secondary">
                  Each mission is tied to a specific QR identifier. Teams must physically reach the
                  checkpoint and scan the correct code before the backend will reveal the mission or hints.
                </p>
              </div>
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5 space-y-2">
                <div className="text-xs font-mono text-cyber-neon-blue tracking-[0.22em] uppercase">
                  Rate limiting & anomaly flags
                </div>
                <p className="text-sm text-cyber-text-secondary">
                  Submissions are rate-limited and logged. Suspicious patterns—like rapid multi-level
                  solves or repeated incorrect flags—surface in the captain and admin views.
                </p>
              </div>
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-5 space-y-2">
                <div className="text-xs font-mono text-cyber-text-secondary tracking-[0.22em] uppercase">
                  Immutable event history
                </div>
                <p className="text-sm text-cyber-text-secondary">
                  Every check-in, hint request, and flag submission is timestamped in Firestore, giving the
                  organizers a full audit trail after the event.
                </p>
              </div>
            </div>
          </CyberCard>
        </motion.div>

        {/* MISSION EXPLOIT 1.0 ARCHIVE */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <CyberCard className="relative overflow-hidden">
            <SectionTitle
              icon={Trophy}
              title="MISSION EXPLOIT 1.0"
              subtitle="University-level cybersecurity event archive"
            />
            
            {/* Placeholder for photos gallery */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Placeholder image slots */}
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div
                  key={index}
                  className="aspect-video bg-cyber-bg-darker border border-cyber-border/50 rounded-xl flex items-center justify-center group hover:border-cyber-neon-blue/50 transition-all duration-300"
                >
                  <div className="text-center space-y-2 opacity-50 group-hover:opacity-70 transition-opacity">
                    <div className="w-12 h-12 mx-auto border-2 border-dashed border-cyber-text-secondary/30 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-cyber-text-secondary/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-mono text-cyber-text-secondary/60">Photo {index}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Placeholder for snippets/content */}
            <div className="mt-8 space-y-4">
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
                <div className="text-xs font-mono text-cyber-neon-blue mb-3 tracking-[0.22em] uppercase">
                  Event Highlights
                </div>
                <div className="space-y-3 text-sm text-cyber-text-secondary">
                  <p className="italic opacity-70">
                    Content and highlights from Mission Exploit 1.0 will be displayed here...
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-[11px] font-mono text-cyber-text-secondary/70 text-center">
              Photos and event details will be added soon
            </p>
          </CyberCard>
        </motion.div>

        {/* EVENT READINESS / COUNTDOWN (UI ONLY) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <CyberCard className="border border-cyber-neon-blue/40 bg-cyber-bg-darker/90">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-neon-blue flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-mono text-cyber-neon-blue/80 tracking-[0.2em] uppercase">
                    Event Ready
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-cyber font-bold text-cyber-text-primary mb-1">
                  Awaiting Mission Start
                </h2>
                <p className="text-xs sm:text-sm text-cyber-text-secondary max-w-xl">
                  When the admin flips the switch, timers will arm, QR checkpoints will unlock, and all
                  roles will sync into live operation. Until then, teams can register, explore rules, and
                  prepare their strategy.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 w-full md:w-auto md:min-w-[220px]">
                <div className="text-xs font-mono text-cyber-text-secondary uppercase tracking-[0.28em]">
                  T-00:00:00
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'HRS', value: '00' },
                    { label: 'MIN', value: '00' },
                    { label: 'SEC', value: '00' },
                  ].map((slot) => (
                    <div
                      key={slot.label}
                      className="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-center"
                    >
                      <div className="text-xl font-mono text-cyber-text-primary">{slot.value}</div>
                      <div className="text-[10px] text-cyber-text-secondary">{slot.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] font-mono text-cyber-text-secondary/70 text-center">
                  Countdown is illustrative. Actual start is controlled from the admin Event Control panel.
                </div>
              </div>
            </div>
          </CyberCard>
        </motion.div>
      </section>
    </div>
  );
};
