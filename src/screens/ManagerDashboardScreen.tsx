// Manager dashboard with metrics and analytics (Simplified MVP)

import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertTriangle, ShoppingCart } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useStats } from '@/hooks/useStats';
import { DashboardStats } from '@/lib/types';

export default function ManagerDashboardScreen() {
  const { getDashboardStats, loading } = useStats();
  const [stats, setStats] = useState<DashboardStats>({
    sessionsToday: 0,
    openSessions: 0,
    itemsLost: 0,
    backOfHouseCount: 0,
    totalSessions: 0,
    avgItemsPerSession: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getDashboardStats();
    setStats(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-primark-light-grey">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey pb-20">
      <NavBar />
      <PageHeader title="Manager Dashboard" subtitle="Store performance and analytics" />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Avg Items/Session"
            value={stats.avgItemsPerSession.toFixed(1)}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Shrinkage"
            value={stats.itemsLost}
            icon={AlertTriangle}
            color="red"
            subtitle="items lost"
          />
        </div>

        {/* Quick stats */}
        <div className="card">
          <h3 className="text-lg font-bold text-primark-navy mb-4">Today's Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primark-light-blue rounded-lg">
              <p className="text-sm text-primark-grey mb-1">Sessions</p>
              <p className="text-2xl font-bold text-primark-navy">{stats.sessionsToday}</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-primark-grey mb-1">Currently Open</p>
              <p className="text-2xl font-bold text-primark-navy">{stats.openSessions}</p>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-primark-grey mb-1">Items Lost</p>
              <p className="text-2xl font-bold text-primark-navy">{stats.itemsLost}</p>
            </div>
            <div className="p-4 bg-amber-100 rounded-lg">
              <p className="text-sm text-primark-grey mb-1">Back of House</p>
              <p className="text-2xl font-bold text-primark-navy">{stats.backOfHouseCount}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="card bg-primark-light-blue border border-primark-blue/20 mt-4">
          <p className="text-sm text-primark-navy">
            <strong>Note:</strong> Full analytics with charts, team performance tables, and date range filtering can be added in future iterations.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
