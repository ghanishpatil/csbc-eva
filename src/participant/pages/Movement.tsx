import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
// import { useAuth } from '@/hooks/useAuth'; // Unused
import { MapPin, CheckCircle2, ArrowRight, Trophy, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
// import toast from 'react-hot-toast'; // Unused

export const Movement = () => {
  // const { user } = useAuth(); // Unused
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);

  const levelNumber = location.state?.levelNumber || 0;
  const scoreAwarded = location.state?.scoreAwarded || 0;
  const nextLevel = location.state?.nextLevel || 1;
  const nextLocationClue = location.state?.nextLocationClue || null;

  useEffect(() => {
    if (!location.state) {
      // If no state, redirect to dashboard
      navigate('/participant/dashboard');
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [location.state, navigate]);

  const handleContinue = () => {
    navigate('/participant/check-in');
  };

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader
          icon={CheckCircle2}
          title="MISSION COMPLETE"
          subtitle={`Level ${levelNumber} Successfully Completed`}
          status={{
            label: "SCORE",
            value: `+${scoreAwarded}`,
            color: "green",
          }}
        />

        {/* Success Message */}
        <CyberCard>
          <div className="text-center py-8">
            <div className="h-24 w-24 rounded-full bg-cyber-neon-green/20 border-4 border-cyber-neon-green mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-cyber-neon-green" />
            </div>
            <h2 className="text-3xl font-bold text-cyber-text-primary mb-4">
              ✅ Correct Flag!
            </h2>
            <div className="text-2xl font-bold text-cyber-neon-green mb-2">
              +{scoreAwarded} Points Awarded
            </div>
            <p className="text-cyber-text-secondary">
              Level {levelNumber} has been completed successfully
            </p>
          </div>
        </CyberCard>

        {/* Next Location */}
        <CyberCard>
          <SectionTitle icon={MapPin} title="NEXT LOCATION UNLOCKED" />
          
          <div className="space-y-6">
            <div className="bg-cyber-bg-darker border border-cyber-neon-blue/50 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 rounded-lg bg-cyber-neon-blue/20 border border-cyber-neon-blue/50 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-cyber-neon-blue" />
                </div>
                <div>
                  <div className="text-cyber-text-secondary text-sm">NEXT CHECKPOINT</div>
                  <div className="text-2xl font-bold text-cyber-text-primary">
                    Level {nextLevel}
                  </div>
                </div>
              </div>
              
              {nextLocationClue ? (
                <div className="bg-cyber-bg-card border border-cyber-neon-blue/50 rounded-lg p-4 mt-4">
                  <div className="text-cyber-text-secondary text-sm mb-2">📍 NEXT LOCATION CLUE</div>
                  <div className="text-cyber-text-primary font-medium text-lg italic">
                    "{nextLocationClue}"
                  </div>
                </div>
              ) : (
                <div className="bg-cyber-bg-card border border-cyber-border rounded-lg p-4 mt-4">
                  <div className="text-cyber-text-secondary text-sm mb-2">MISSION OBJECTIVE</div>
                  <div className="text-cyber-text-primary font-medium">
                    Reach the next checkpoint and scan the QR code to continue
                  </div>
                </div>
              )}
            </div>

            {countdown > 0 && (
              <div className="bg-cyber-neon-blue/10 border border-cyber-neon-blue/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-cyber-neon-blue">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg font-bold">Continuing in {countdown} seconds...</span>
                </div>
              </div>
            )}
          </div>
        </CyberCard>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <NeonButton
            onClick={handleContinue}
            color="blue"
            icon={ArrowRight}
          >
            Continue to Next Location
          </NeonButton>
        </div>

        {/* Stats */}
        <CyberCard>
          <SectionTitle icon={Trophy} title="PROGRESS SUMMARY" />
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4 text-center">
              <div className="text-cyber-text-secondary text-sm mb-2">LEVELS COMPLETED</div>
              <div className="text-2xl font-bold text-cyber-neon-green">{levelNumber}</div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4 text-center">
              <div className="text-cyber-text-secondary text-sm mb-2">POINTS EARNED</div>
              <div className="text-2xl font-bold text-cyber-neon-yellow">+{scoreAwarded}</div>
            </div>
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4 text-center">
              <div className="text-cyber-text-secondary text-sm mb-2">NEXT LEVEL</div>
              <div className="text-2xl font-bold text-cyber-neon-blue">{nextLevel}</div>
            </div>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

