// Home screen with ENTER/EXIT buttons and session overview

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, Clock, AlertTriangle, Package } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import StatCard from '@/components/ui/StatCard';
import StatusPill from '@/components/ui/StatusPill';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { useStats } from '@/hooks/useStats';
import { useSessions } from '@/hooks/useSessions';
import { formatElapsedTime, isSessionStale } from '@/lib/utils';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { getDashboardStats } = useStats();
  const { sessions, loading: sessionsLoading, fetchSessions } = useSessions();
  const [stats, setStats] = useState({
    sessionsToday: 0,
    openSessions: 0,
    itemsLost: 0,
    backOfHouseCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const statsData = await getDashboardStats();
    setStats({
      sessionsToday: statsData.sessionsToday,
      openSessions: statsData.openSessions,
      itemsLost: statsData.itemsLost,
      backOfHouseCount: statsData.backOfHouseCount,
    });
    await fetchSessions({ status: ['in_progress', 'exiting'] });
    setLoading(false);
  };

  const handleEntry = () => {
    navigate('/entry');
  };

  const handleExit = () => {
    navigate('/exit');
  };

  // Sessions are already filtered by fetchSessions call
  const activeSessions = sessions;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-primark-light-grey">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto mb-4" />
            <p className="text-primark-grey">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey pb-20">
      <NavBar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        {/* Main action buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleEntry}
            variant="primary"
            size="xl"
            className="flex flex-col items-center justify-center py-8"
          >
            <ArrowDownCircle size={48} className="mb-2" />
            <span className="text-2xl font-bold">ENTER</span>
          </Button>
          <Button
            onClick={handleExit}
            variant="secondary"
            size="xl"
            className="flex flex-col items-center justify-center py-8"
          >
            <ArrowUpCircle size={48} className="mb-2" />
            <span className="text-2xl font-bold">EXIT</span>
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            title="Sessions Today"
            value={stats.sessionsToday}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Open Now"
            value={stats.openSessions}
            icon={ArrowDownCircle}
            color="green"
          />
          <StatCard
            title="Items Lost Today"
            value={stats.itemsLost}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Back of House"
            value={stats.backOfHouseCount}
            icon={Package}
            color="amber"
          />
        </div>

        {/* Active sessions */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-primark-navy mb-4">Active Sessions</h2>

          {sessionsLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-primark-grey">Loading sessions...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Active Sessions"
              message="All changing rooms are currently empty. Tap ENTER to start a new session."
            />
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const isStale = isSessionStale(session.entry_time);

                return (
                  <div
                    key={session.id}
                    className={`p-4 border-2 rounded-lg ${
                      isStale
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-primark-grey/30 hover:border-primark-blue hover:bg-primark-light-blue'
                    } transition-all cursor-pointer`}
                    onClick={() => navigate(`/exit/${session.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primark-navy">
                            Tag: {session.tag_barcode}
                          </span>
                          <StatusPill status={session.status} />
                        </div>
                        <p className="text-sm text-primark-grey">
                          {session.team_member?.full_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primark-navy">
                          {session.total_items_in} items
                        </p>
                        <p className="text-xs text-primark-grey">
                          {formatElapsedTime(session.entry_time)}
                        </p>
                      </div>
                    </div>

                    {isStale && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                        <AlertTriangle size={16} />
                        <span>Session has been open for over 4 hours</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
