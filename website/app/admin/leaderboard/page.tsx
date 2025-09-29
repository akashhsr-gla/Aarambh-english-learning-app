'use client';

import { Award, Medal, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RegionRanking {
  _id: string;
  regionName: string;
  regionCode: string;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  averageScore: number;
  totalGamesPlayed: number;
  totalPoints: number;
  rank: number;
}

interface LeaderboardData {
  rankings: RegionRanking[];
  totalRegions: number;
  lastUpdated: string;
}

export default function LeaderboardManagement() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/admin/leaderboard/all-regions/top3`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();
      setLeaderboardData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</div>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View regional rankings and performance statistics
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Trophy className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : leaderboardData ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Regions</p>
                  <p className="text-2xl font-bold text-gray-900">{leaderboardData.totalRegions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Region</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboardData.rankings.length > 0 ? leaderboardData.rankings[0].regionName : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Highest Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboardData.rankings.length > 0 ? 
                      `${leaderboardData.rankings[0].averageScore.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Medal className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatDate(leaderboardData.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Regional Rankings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Rankings based on average scores and total performance metrics
              </p>
            </div>

            {leaderboardData.rankings.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rankings available</h3>
                <p className="mt-1 text-sm text-gray-500">Check back later for updated rankings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teachers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Games Played
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboardData.rankings.map((region) => (
                      <tr 
                        key={region._id} 
                        className={`hover:bg-gray-50 ${getRankBgColor(region.rank)}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(region.rank)}
                            <span className="text-sm font-medium text-gray-900">#{region.rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{region.regionName}</div>
                            <div className="text-sm text-gray-500">{region.regionCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="text-sm text-gray-900">{region.totalUsers}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded mr-1"></div>
                            <span className="text-sm text-gray-900">{region.totalStudents}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-purple-500 rounded mr-1"></div>
                            <span className="text-sm text-gray-900">{region.totalTeachers}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-16 bg-gray-200 rounded-full h-2 mr-2`}>
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(region.averageScore, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {region.averageScore.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{region.totalGamesPlayed.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-orange-600">
                            {region.totalPoints.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top 3 Podium (if we have at least 3 regions) */}
          {leaderboardData.rankings.length >= 3 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Top 3 Regions</h2>
              <div className="flex justify-center items-end space-x-4">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 w-24 h-20 flex flex-col justify-center">
                    <Medal className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-gray-600">2nd</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-900">{leaderboardData.rankings[1].regionName}</div>
                    <div className="text-xs text-gray-500">{leaderboardData.rankings[1].averageScore.toFixed(1)}%</div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center">
                  <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 w-28 h-24 flex flex-col justify-center">
                    <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-1" />
                    <span className="text-sm font-bold text-yellow-600">1st</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-900">{leaderboardData.rankings[0].regionName}</div>
                    <div className="text-xs text-gray-500">{leaderboardData.rankings[0].averageScore.toFixed(1)}%</div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-4 w-24 h-16 flex flex-col justify-center">
                    <Award className="w-8 h-8 text-amber-600 mx-auto mb-1" />
                    <span className="text-xs font-bold text-amber-600">3rd</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-900">{leaderboardData.rankings[2].regionName}</div>
                    <div className="text-xs text-gray-500">{leaderboardData.rankings[2].averageScore.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
