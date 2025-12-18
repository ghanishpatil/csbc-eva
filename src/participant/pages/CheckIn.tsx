import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { verifyCheckIn } from '@/api/participantApi';
import { QrCode, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const CheckIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const handleCheckIn = async () => {
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    if (!user?.teamId) {
      toast.error('No team assigned');
      return;
    }

    setCheckingIn(true);
    setLoading(true);

    try {
      const qrCodeValue = qrCode.trim();
      let levelId: string | null = null;
      
      // First, get the team's groupId to search for group-specific levels
      const teamSnapshot = await getDocs(
        query(collection(db, 'teams'), where('__name__', '==', user.teamId))
      );
      
      let teamGroupId: string | null = null;
      if (!teamSnapshot.empty) {
        teamGroupId = teamSnapshot.docs[0].data().groupId;
      }

      // PRIORITY 1: Search by qrCodeId (the actual QR code identifier)
      let levelsSnapshot = await getDocs(
        query(
          collection(db, 'levels'),
          where('qrCodeId', '==', qrCodeValue)
        )
      );

      if (!levelsSnapshot.empty) {
        // If team has a groupId, prefer the level matching their group
        if (teamGroupId) {
          const groupLevel = levelsSnapshot.docs.find(doc => doc.data().groupId === teamGroupId);
          levelId = groupLevel ? groupLevel.id : levelsSnapshot.docs[0].id;
        } else {
          levelId = levelsSnapshot.docs[0].id;
        }
      }
      
      // PRIORITY 2: If QR code is just a number, find by level number
      if (!levelId && /^\d+$/.test(qrCodeValue)) {
        const levelNumber = parseInt(qrCodeValue);
        
        // Try to find level for team's group first
        if (teamGroupId) {
          levelsSnapshot = await getDocs(
            query(
              collection(db, 'levels'),
              where('groupId', '==', teamGroupId),
              where('number', '==', levelNumber)
            )
          );
        }
        
        // Fallback to any level with that number
        if (levelsSnapshot.empty) {
          levelsSnapshot = await getDocs(
            query(
              collection(db, 'levels'),
              where('number', '==', levelNumber),
              limit(1)
            )
          );
        }
        
        if (!levelsSnapshot.empty) {
          levelId = levelsSnapshot.docs[0].id;
        }
      }
      
      // PRIORITY 3: Check if it's a level_X format
      if (!levelId && qrCodeValue.startsWith('level_')) {
        const levelNumber = parseInt(qrCodeValue.replace('level_', ''));
        if (!isNaN(levelNumber)) {
          if (teamGroupId) {
            levelsSnapshot = await getDocs(
              query(
                collection(db, 'levels'),
                where('groupId', '==', teamGroupId),
                where('number', '==', levelNumber)
              )
            );
          }
          
          if (levelsSnapshot.empty) {
            levelsSnapshot = await getDocs(
              query(
                collection(db, 'levels'),
                where('number', '==', levelNumber),
                limit(1)
              )
            );
          }
          
          if (!levelsSnapshot.empty) {
            levelId = levelsSnapshot.docs[0].id;
          }
        }
      }
      
      // PRIORITY 4: Use QR code as direct levelId (document ID)
      if (!levelId) {
        levelId = qrCodeValue;
      }

      if (!levelId) {
        toast.error('Level not found. Please check the QR code.');
        setLoading(false);
        setCheckingIn(false);
        return;
      }

      const response = await verifyCheckIn({
        teamId: user.teamId,
        levelId: levelId,
        qrCode: qrCodeValue,
      });

      if (response.success) {
        toast.success(`✅ ${response.message}`);
        setTimeout(() => {
          navigate('/participant/mission');
        }, 2000);
      } else {
        toast.error(response.error || 'Check-in failed');
        setLoading(false);
        setCheckingIn(false);
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Check-in failed';
      toast.error(`❌ ${errorMessage}`);
      setLoading(false);
      setCheckingIn(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader
          icon={QrCode}
          title="MISSION CHECK-IN"
          subtitle="Scan QR code at location"
        />

        <CyberCard>
          <SectionTitle icon={QrCode} title="LOCATION VERIFICATION" />

          <div className="space-y-6">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-16 w-16 rounded-lg bg-cyber-neon-blue/20 border border-cyber-neon-blue/50 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-cyber-neon-blue" />
                </div>
                <div>
                  <div className="text-cyber-text-secondary text-sm">INSTRUCTIONS</div>
                  <div className="text-cyber-text-primary font-medium">
                    Scan or enter the QR code at your current location
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-cyber-text-secondary text-sm mb-2">
                QR CODE / LOCATION ID
              </label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleCheckIn();
                  }
                }}
                placeholder="Enter QR code ID (e.g., QR_G1_L1)"
                className="w-full px-4 py-3 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-cyber-text-secondary font-mono"
                disabled={loading}
                autoFocus
              />
            </div>

            {checkingIn && (
              <div className="bg-cyber-neon-blue/10 border border-cyber-neon-blue/50 rounded-xl p-4 flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyber-neon-blue"></div>
                <span className="text-cyber-neon-blue">Verifying location...</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <NeonButton
                onClick={handleCheckIn}
                disabled={loading || !qrCode.trim()}
                className="flex-1"
                color="blue"
                icon={loading ? undefined : CheckCircle2}
              >
                {loading ? 'Verifying...' : 'Verify Check-In'}
              </NeonButton>

              <NeonButton
                onClick={() => navigate('/participant/dashboard')}
                color="gray"
                disabled={loading}
                icon={ArrowLeft}
              >
                Back
              </NeonButton>
            </div>
          </div>
        </CyberCard>

        <CyberCard>
          <SectionTitle icon={AlertCircle} title="IMPORTANT NOTES" />
          <div className="space-y-3 text-cyber-text-secondary">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-cyber-neon-yellow mt-0.5 flex-shrink-0" />
              <p>You must be physically present at the location to check in.</p>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-cyber-neon-yellow mt-0.5 flex-shrink-0" />
              <p>You can only check in at locations you have unlocked.</p>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-cyber-neon-yellow mt-0.5 flex-shrink-0" />
              <p>After check-in, the challenge content will become accessible.</p>
            </div>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

