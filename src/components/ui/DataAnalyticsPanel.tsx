import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, mlAPI } from "../../services/api";

const DataAnalyticsPanel = ({ isVisible, onClose, currentSanity }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    userSessions: [],
    globalStats: null,
    moodHistory: [],
    predictions: null
  });
  const [mlPredictions, setMlPredictions] = useState(null);
  const [mlAvailable, setMlAvailable] = useState(false);

  // Fetch all analytics data
  useEffect(() => {
    if (isVisible) {
      fetchAnalyticsData();
    }
  }, [isVisible]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [sessions, stats] = await Promise.all([
        api.getUserSessions(100),
        api.getGlobalStats()
      ]);

      // Generate trend predictions using simple linear regression
      const predictions = generatePredictions(sessions.sessions || []);
      
      setData({
        userSessions: sessions.sessions || [],
        globalStats: stats.stats || null,
        moodHistory: generateMoodHistory(sessions.sessions || []),
        predictions
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mood history for visualization
  const generateMoodHistory = (sessions) => {
    return sessions.slice(0, 20).reverse().map((session, index) => ({
      time: new Date(session.created_at).toLocaleTimeString(),
      sanity: session.sanity_level,
      index: index + 1
    }));
  };

  // Simple linear regression for trend prediction
  const generatePredictions = (sessions) => {
    if (sessions.length < 3) return null;

    const recentSessions = sessions.slice(0, 10);
    const n = recentSessions.length;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    recentSessions.forEach((session, i) => {
      sumX += i;
      sumY += session.sanity_level;
      sumXY += i * session.sanity_level;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trend = slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable';
    const nextPrediction = Math.max(0, Math.min(100, slope * n + intercept));

    return {
      trend,
      slope: slope.toFixed(2),
      nextValue: nextPrediction.toFixed(1),
      confidence: Math.min(95, 60 + n * 3)
    };
  };

  // Export data as JSON
  const exportData = () => {
    const exportObj = {
      timestamp: new Date().toISOString(),
      currentSanity,
      userSessions: data.userSessions,
      globalStats: data.globalStats,
      predictions: data.predictions
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanity-orb-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Distribution analysis
  const getDistributionData = () => {
    if (!data.userSessions.length) return [];
    
    const ranges = {
      'Critical (0-25)': 0,
      'Unstable (25-50)': 0,
      'Stable (50-75)': 0,
      'Optimal (75-100)': 0
    };

    data.userSessions.forEach(session => {
      const level = session.sanity_level;
      if (level < 25) ranges['Critical (0-25)']++;
      else if (level < 50) ranges['Unstable (25-50)']++;
      else if (level < 75) ranges['Stable (50-75)']++;
      else ranges['Optimal (75-100)']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#ff0033', '#ff6600', '#ffdd00', '#00ff88'];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-8">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-2xl font-light">Data Analytics Dashboard</h2>
              <p className="text-white/50 text-sm">Real-time digital consciousness insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalyticsData}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white/80 text-sm transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={exportData}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white/80 text-sm transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 pt-4 border-b border-white/10">
          {['overview', 'trends', 'distribution', 'predictions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white/20 text-white border-t border-l border-r border-white/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/60">Loading analytics data...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Current Level</div>
                      <div className="text-white text-3xl font-light">{currentSanity}%</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Total Sessions</div>
                      <div className="text-white text-3xl font-light">{data.userSessions.length}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Average Level</div>
                      <div className="text-white text-3xl font-light">
                        {data.userSessions.length > 0
                          ? Math.round(data.userSessions.reduce((sum, s) => sum + s.sanity_level, 0) / data.userSessions.length)
                          : 0}%
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Global Average</div>
                      <div className="text-white text-3xl font-light">
                        {data.globalStats ? Math.round(data.globalStats.average_sanity) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Session History Chart */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-light mb-4">Recent Session History</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data.moodHistory}>
                        <defs>
                          <linearGradient id="sanityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="sanity" stroke="#00ff88" fillOpacity={1} fill="url(#sanityGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-light mb-4">Sanity Level Trends</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={data.moodHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="sanity" stroke="#00ff88" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trend Analysis */}
                  {data.predictions && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                      <h3 className="text-white text-lg font-light mb-4">Trend Analysis</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Trend Direction</div>
                          <div className={`text-2xl font-light ${
                            data.predictions.trend === 'improving' ? 'text-green-400' :
                            data.predictions.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {data.predictions.trend.charAt(0).toUpperCase() + data.predictions.trend.slice(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Slope</div>
                          <div className="text-white text-2xl font-light">{data.predictions.slope}</div>
                        </div>
                        <div>
                          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Confidence</div>
                          <div className="text-white text-2xl font-light">{data.predictions.confidence}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Distribution Tab */}
              {activeTab === 'distribution' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                      <h3 className="text-white text-lg font-light mb-4">Level Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getDistributionData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                      <h3 className="text-white text-lg font-light mb-4">Session Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getDistributionData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-15} textAnchor="end" height={80} />
                          <YAxis stroke="rgba(255,255,255,0.5)" />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                          />
                          <Bar dataKey="value" fill="#00ff88" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Predictions Tab */}
              {activeTab === 'predictions' && (
                <div className="space-y-6">
                  {data.predictions ? (
                    <>
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                        <h3 className="text-white text-lg font-light mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Trend Predictions
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-white/60 mb-4">
                              Based on linear regression analysis of your last 10 sessions, the AI predicts:
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/60">Next Expected Value:</span>
                                <span className="text-white text-xl font-light">{data.predictions.nextValue}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/60">Trend Slope:</span>
                                <span className="text-white text-xl font-light">{data.predictions.slope}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/60">Confidence Level:</span>
                                <span className="text-white text-xl font-light">{data.predictions.confidence}%</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-white/60 mb-4">Recommendations:</div>
                            <div className="space-y-2 text-sm">
                              {data.predictions.trend === 'declining' && (
                                <>
                                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-white/80">
                                    ⚠️ Declining trend detected - Consider taking a break
                                  </div>
                                  <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-white/80">
                                    💡 Try resetting to optimal levels more frequently
                                  </div>
                                </>
                              )}
                              {data.predictions.trend === 'improving' && (
                                <>
                                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-white/80">
                                    ✅ Great! Your sanity levels are improving
                                  </div>
                                  <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-white/80">
                                    🎯 Keep maintaining current patterns
                                  </div>
                                </>
                              )}
                              {data.predictions.trend === 'stable' && (
                                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-white/80">
                                  📊 Stable levels - Consider occasional optimization
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Stats */}
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                        <h3 className="text-white text-lg font-light mb-4">Statistical Analysis</h3>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Min Level</div>
                            <div className="text-white text-2xl font-light">
                              {data.userSessions.length > 0 ? Math.min(...data.userSessions.map(s => s.sanity_level)) : 0}%
                            </div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Max Level</div>
                            <div className="text-white text-2xl font-light">
                              {data.userSessions.length > 0 ? Math.max(...data.userSessions.map(s => s.sanity_level)) : 0}%
                            </div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Std Deviation</div>
                            <div className="text-white text-2xl font-light">
                              {data.userSessions.length > 0 ? (() => {
                                const values = data.userSessions.map(s => s.sanity_level);
                                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                                const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                                return Math.sqrt(variance).toFixed(1);
                              })() : 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Data Points</div>
                            <div className="text-white text-2xl font-light">{data.userSessions.length}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-12 border border-white/10 text-center">
                      <div className="text-white/40 text-lg mb-4">Not enough data for predictions</div>
                      <div className="text-white/60 text-sm">
                        Use the orb more to generate predictive insights (minimum 3 sessions required)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsPanel;
