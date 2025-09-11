'use client';

import {
    Activity,
    AlertCircle,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Gamepad2,
    TrendingUp,
    UserCheck,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalGames: number;
  activeSessions: number;
  totalTransactions: number;
  pendingTransactions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalGames: 0,
    activeSessions: 0,
    totalTransactions: 0,
    pendingTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalUsers: 1247,
          activeUsers: 892,
          totalRevenue: 45680,
          monthlyRevenue: 12340,
          totalGames: 15,
          activeSessions: 23,
          totalTransactions: 456,
          pendingTransactions: 12
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '+8%',
      changeType: 'positive' as const,
      icon: UserCheck,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      change: '+22%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Total Games',
      value: stats.totalGames.toString(),
      change: '+2',
      changeType: 'positive' as const,
      icon: Gamepad2,
      color: 'orange'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions.toString(),
      change: '+5',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'indigo'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      change: '+18%',
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'pink'
    },
    {
      title: 'Pending Transactions',
      value: stats.pendingTransactions.toString(),
      change: '-3',
      changeType: 'negative' as const,
      icon: Clock,
      color: 'yellow'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user',
      message: 'New user registered: John Doe',
      time: '2 minutes ago',
      icon: Users
    },
    {
      id: 2,
      type: 'payment',
      message: 'Payment received: ₹299 for Premium Plan',
      time: '5 minutes ago',
      icon: CreditCard
    },
    {
      id: 3,
      type: 'game',
      message: 'New game session started: Word Game',
      time: '8 minutes ago',
      icon: Gamepad2
    },
    {
      id: 4,
      type: 'session',
      message: 'Group call session ended',
      time: '12 minutes ago',
      icon: Calendar
    },
    {
      id: 5,
      type: 'alert',
      message: 'High server load detected',
      time: '15 minutes ago',
      icon: AlertCircle
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the admin panel. Here's what's happening with your app.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-100',
            green: 'text-green-600 bg-green-100',
            emerald: 'text-emerald-600 bg-emerald-100',
            purple: 'text-purple-600 bg-purple-100',
            orange: 'text-orange-600 bg-orange-100',
            indigo: 'text-indigo-600 bg-indigo-100',
            pink: 'text-pink-600 bg-pink-100',
            yellow: 'text-yellow-600 bg-yellow-100'
          };

          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be implemented here</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              const iconColors = {
                user: 'text-blue-600 bg-blue-100',
                payment: 'text-green-600 bg-green-100',
                game: 'text-purple-600 bg-purple-100',
                session: 'text-orange-600 bg-orange-100',
                alert: 'text-red-600 bg-red-100'
              };

              return (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${iconColors[activity.type as keyof typeof iconColors]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Add New User</p>
                <p className="text-sm text-gray-500">Create a new user account</p>
              </div>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Add New Game</p>
                <p className="text-sm text-gray-500">Create a new game</p>
              </div>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">View Transactions</p>
                <p className="text-sm text-gray-500">Check payment history</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
