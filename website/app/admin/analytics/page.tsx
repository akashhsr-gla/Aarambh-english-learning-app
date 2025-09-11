'use client';

import {
    Activity,
    BarChart3,
    Calendar,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalSessions: number;
  activeSessions: number;
  totalGames: number;
  popularGames: Array<{
    name: string;
    plays: number;
    revenue: number;
  }>;
  userGrowth: Array<{
    month: string;
    users: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  sessionData: Array<{
    day: string;
    sessions: number;
  }>;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    // Simulate API call to fetch analytics data
    const fetchAnalytics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAnalytics({
          totalUsers: 1247,
          activeUsers: 892,
          newUsers: 156,
          totalRevenue: 45680,
          monthlyRevenue: 12340,
          revenueGrowth: 15.2,
          totalSessions: 2341,
          activeSessions: 23,
          totalGames: 15,
          popularGames: [
            { name: 'Word Builder', plays: 1247, revenue: 12470 },
            { name: 'Grammar Master', plays: 892, revenue: 8920 },
            { name: 'Vocabulary Challenge', plays: 678, revenue: 6780 },
            { name: 'Speaking Practice', plays: 456, revenue: 4560 },
            { name: 'Listening Test', plays: 345, revenue: 3450 }
          ],
          userGrowth: [
            { month: 'Jan', users: 100 },
            { month: 'Feb', users: 150 },
            { month: 'Mar', users: 200 },
            { month: 'Apr', users: 280 },
            { month: 'May', users: 350 },
            { month: 'Jun', users: 420 },
            { month: 'Jul', users: 520 },
            { month: 'Aug', users: 650 },
            { month: 'Sep', users: 780 },
            { month: 'Oct', users: 920 },
            { month: 'Nov', users: 1080 },
            { month: 'Dec', users: 1247 }
          ],
          revenueData: [
            { month: 'Jan', revenue: 2000 },
            { month: 'Feb', revenue: 2500 },
            { month: 'Mar', revenue: 3200 },
            { month: 'Apr', revenue: 4100 },
            { month: 'May', revenue: 5200 },
            { month: 'Jun', revenue: 6300 },
            { month: 'Jul', revenue: 7800 },
            { month: 'Aug', revenue: 9200 },
            { month: 'Sep', revenue: 10800 },
            { month: 'Oct', revenue: 12340 },
            { month: 'Nov', revenue: 14200 },
            { month: 'Dec', revenue: 16300 }
          ],
          sessionData: [
            { day: 'Mon', sessions: 45 },
            { day: 'Tue', sessions: 52 },
            { day: 'Wed', sessions: 48 },
            { day: 'Thu', sessions: 61 },
            { day: 'Fri', sessions: 58 },
            { day: 'Sat', sessions: 42 },
            { day: 'Sun', sessions: 38 }
          ]
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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

  if (!analytics) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your app's performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{analytics.newUsers} this month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{analytics.revenueGrowth}% growth
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Current month</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">User growth chart will be implemented here</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Revenue chart will be implemented here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Games */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Games</h3>
        <div className="space-y-4">
          {analytics.popularGames.map((game, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{game.name}</h4>
                  <p className="text-sm text-gray-500">{game.plays.toLocaleString()} plays</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">₹{game.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sessions</span>
              <span className="font-semibold text-gray-900">{analytics.totalSessions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Sessions</span>
              <span className="font-semibold text-green-600">{analytics.activeSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Games</span>
              <span className="font-semibold text-gray-900">{analytics.totalGames}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Sessions</h3>
          <div className="space-y-2">
            {analytics.sessionData.map((day, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{day.day}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${(day.sessions / 70) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{day.sessions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>View Detailed Reports</span>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Analytics</span>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Schedule Reports</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Tables Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h4>
          <p className="text-gray-500">
            Detailed charts, tables, and advanced analytics will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
