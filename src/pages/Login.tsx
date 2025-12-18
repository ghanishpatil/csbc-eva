import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { firestoreAPI } from '@/utils/firestore';
import { Shield, Terminal, Lock, User, Mail, Key, Zap, Building, GraduationCap, Phone, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserRole } from '@/types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [institute, setInstitute] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terminalText, setTerminalText] = useState('');
  const navigate = useNavigate();

  const welcomeText = `
> INITIALIZING SECURE CONNECTION...
> CONNECTION ESTABLISHED
> WELCOME TO MISSION EXPLOIT 2.0
> CSBC CYBERSECURITY PLATFORM
> ENTER CREDENTIALS TO PROCEED_
  `;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < welcomeText.length) {
        setTerminalText(welcomeText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate required fields
        if (!displayName.trim() || !phone.trim() || !institute.trim() || !branch.trim() || !year) {
          toast.error('[ PLEASE FILL ALL REQUIRED FIELDS ]');
          setLoading(false);
          return;
        }

        toast.loading('[ CREATING ACCOUNT... ]');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await firestoreAPI.createUser(user.uid, {
          email: user.email || email,
          displayName: displayName.trim(),
          phone: phone.trim(),
          institute: institute.trim(),
          branch: branch.trim(),
          year: year,
          role: 'player',
          createdAt: Date.now(),
        });

        toast.dismiss();
        toast.success('[ ACCESS GRANTED ]');
        
        // Check if there's a saved redirect URL
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          navigate('/home');
        }
      } else {
        toast.loading('[ AUTHENTICATING... ]');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Wait a moment for auth state to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get user data to check role
        const userData = await firestoreAPI.getUser(userCredential.user.uid);
        
        toast.dismiss();
        
        console.log('User data loaded:', userData); // Debug log
        
        if (!userData) {
          toast.error('[ USER DATA NOT FOUND ]');
          setLoading(false);
          return;
        }
        
        toast.success(`[ ACCESS GRANTED - ${userData.role.toUpperCase()} ]`);
        
        // Check if there's a saved redirect URL
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          console.log('Redirecting to saved URL:', redirectUrl);
          navigate(redirectUrl);
        } else {
          // Redirect based on role
          console.log('Redirecting based on role:', userData.role);
          if (userData.role === 'admin') {
            navigate('/admin');
          } else if (userData.role === 'captain') {
            navigate('/captain/dashboard');
          } else {
            navigate('/home');
          }
        }
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Authentication error:', error);
      toast.error(`[ ACCESS DENIED ] ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Terminal Welcome */}
        <div className="hidden md:block">
          <div className="terminal-window p-6 scan-line">
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-neon-blue/30">
              <Terminal className="h-5 w-5 text-neon-green" />
              <span className="font-cyber text-neon-green">SYSTEM TERMINAL</span>
              <div className="flex-1"></div>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-neon-green"></div>
              </div>
            </div>
            
            <pre className="font-mono text-sm text-neon-green whitespace-pre-wrap">
              {terminalText}
            </pre>

            <div className="mt-8 space-y-3 text-sm font-mono text-cyan-400">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-neon-blue mt-0.5" />
                <span>SECURE AUTHENTICATION REQUIRED</span>
              </div>
              <div className="flex items-start space-x-2">
                <Zap className="h-4 w-4 text-neon-green mt-0.5" />
                <span>REAL-TIME CTF COMPETITION PLATFORM</span>
              </div>
              <div className="flex items-start space-x-2">
                <Lock className="h-4 w-4 text-neon-purple mt-0.5" />
                <span>END-TO-END ENCRYPTED CONNECTION</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neon-blue/5 border border-neon-blue/30">
              <div className="text-xs font-mono text-cyan-400">
                <div className="text-neon-blue mb-2">// SYSTEM STATUS</div>
                <div className="flex justify-between py-1">
                  <span>FIREWALL:</span>
                  <span className="text-neon-green">ACTIVE</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>ENCRYPTION:</span>
                  <span className="text-neon-green">256-BIT</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>CONNECTION:</span>
                  <span className="text-neon-green">SECURED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="terminal-window p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Shield className="h-20 w-20 text-neon-blue" />
              <Zap className="h-8 w-8 text-neon-green absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h1 className="text-3xl font-cyber font-bold text-neon-blue neon-text mb-2">
              MISSION EXPLOIT 2.0
            </h1>
            <p className="text-cyan-400 font-mono text-sm">
              {isSignUp ? '// CREATE NEW ACCESS CREDENTIALS' : '// AUTHENTICATE TO CONTINUE'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-4 ${isSignUp ? 'max-h-[60vh] overflow-y-auto pr-2' : ''}`}>
            {isSignUp && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>FULL NAME *</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all placeholder:text-cyber-text-secondary"
                    placeholder="Full Name"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>PHONE NUMBER *</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all placeholder:text-cyber-text-secondary"
                    placeholder="Phone Number"
                  />
                </div>

                {/* Institute Name */}
                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>INSTITUTE / COLLEGE *</span>
                  </label>
                  <input
                    type="text"
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all placeholder:text-cyber-text-secondary"
                    placeholder="Institute / College"
                  />
                </div>

                {/* Branch / Department */}
                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>BRANCH *</span>
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all placeholder:text-cyber-text-secondary"
                    placeholder="Branch"
                  />
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>YEAR OF STUDY *</span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all"
                  >
                    <option value="">Select Year of Study</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>EMAIL ADDRESS *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all placeholder:text-cyber-text-secondary"
                placeholder="Email Address"
              />
            </div>

            <div>
              <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>PASSWORD *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary font-mono focus:border-cyber-neon-blue focus:ring-2 focus:ring-cyber-neon-blue/50 focus:outline-none transition-all placeholder:text-cyber-text-secondary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-lg bg-gradient-to-r from-neon-blue to-neon-green text-dark-900 font-cyber font-bold text-lg hover:shadow-lg hover:shadow-neon-blue/50 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? '[ PROCESSING... ]' : isSignUp ? '[ CREATE ACCOUNT ]' : '[ AUTHENTICATE ]'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-neon-green to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-cyan-400 hover:text-neon-blue font-mono text-sm transition-colors"
            >
              {isSignUp
                ? '> ALREADY HAVE ACCESS? [ SIGN IN ]'
                : '> NEED ACCESS? [ CREATE ACCOUNT ]'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-neon-blue/20">
            <p className="text-xs text-cyan-500 text-center font-mono">
              © CSBC CYBERSECURITY CLUB - MISSION EXPLOIT 2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
