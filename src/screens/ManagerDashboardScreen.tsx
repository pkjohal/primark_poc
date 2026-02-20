// Manager dashboard with metrics and analytics (Simplified MVP)

import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertTriangle, ShoppingCart, CreditCard, Ban } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useStats } from '@/hooks/useStats';
import { DashboardStats } from '@/lib/types';

export default function ManagerDashboardScreen() {
  const { getDashboardStats, getBasketStats, loading } = useStats();
  const [stats, setStats] = useState<DashboardStats>({
    sessionsToday: 0,
    openSessions: 0,
    itemsLost: 0,
    backOfHouseCount: 0,
    totalSessions: 0,
    avgItemsPerSession: 0,
    conversionRate: 0,
  });
  const [basketStats, setBasketStats] = useState({ transferred: 0, abandoned: 0, transferredToday: 0, abandonedToday: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [dashData, basketData] = await Promise.all([getDashboardStats(), getBasketStats()]);
    setStats(dashData);
    setBasketStats(basketData);
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
            tooltip="% of items brought into changing rooms that were purchased. Calculated as: items purchased ÷ total items scanned in."
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

        {/* Basket Outcomes */}
        <div className="card mt-4">
          <h3 className="text-lg font-bold text-primark-navy mb-4">Basket Outcomes</h3>
          {basketStats.transferred === 0 && basketStats.abandoned === 0 ? (
            <p className="text-sm text-primark-grey text-center py-6">No basket outcomes recorded yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Donut chart */}
              <div className="w-full sm:w-1/2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Transferred', value: basketStats.transferred },
                        { name: 'Abandoned', value: basketStats.abandoned },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#0DAADB" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'baskets']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stat breakdown */}
              <div className="w-full sm:w-1/2 space-y-3">
                <div className="flex items-center justify-between p-3 bg-primark-light-blue rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-primark-blue" />
                    <span className="font-semibold text-primark-navy">Transferred</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primark-blue">{basketStats.transferred}</p>
                    <p className="text-xs text-primark-grey">{basketStats.transferredToday} today</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ban size={18} className="text-primark-amber" />
                    <span className="font-semibold text-primark-navy">Abandoned</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primark-amber">{basketStats.abandoned}</p>
                    <p className="text-xs text-primark-grey">{basketStats.abandonedToday} today</p>
                  </div>
                </div>
                {(basketStats.transferred + basketStats.abandoned) > 0 && (
                  <p className="text-xs text-primark-grey text-center pt-1">
                    {Math.round((basketStats.transferred / (basketStats.transferred + basketStats.abandoned)) * 100)}% checkout conversion
                  </p>
                )}
              </div>
            </div>
          )}
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
