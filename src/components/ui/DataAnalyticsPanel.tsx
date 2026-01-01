import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '../../store/store';
import { api } from "../../services/api";
import GlassPanel from './GlassPanel';
import ScrambleText from './ScrambleText';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <GlassPanel intensity="high" className="px-4 py-2 border-white/20">
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">{label}</p>
        <p className="text-emerald-400 font-bold font-mono">
          VAL: {payload[0].value}%
        </p>
      </GlassPanel>
    );
  }
  return null;
};

const DataAnalyticsPanel = () => {
  const isVisible = useStore(state => state.showDataAnalytics);
  const onClose = useStore(state => state.toggleDataAnalytics);
  const currentSanity = useStore(state => state.sanity);

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
      fetchMLPredictions();
    }
  }, [isVisible, currentSanity]);

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

  // Fetch ML predictions from backend
  const fetchMLPredictions = async () => {
    try {
      // Check if ML API is available through backend
      const mlHealth = await api.checkMLHealth();
      setMlAvailable(mlHealth.healthy || false);

      if (mlHealth.healthy) {
        // Get advanced ML predictions
        const predictions = await api.getMLPredictions(currentSanity);
        
        if (predictions.success) {
          setMlPredictions(predictions);
          console.log('ML Predictions:', predictions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ML predictions:', error);
      setMlAvailable(false);
    }
  };

  // Generate mood history for visualization
  const generateMoodHistory = (sessions) => {
    return sessions.slice(0, 20).reverse().map((session, index) => ({
      time: new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      'CRIT': 0,
      'UNST': 0,
      'STAB': 0,
      'OPTM': 0
    };

    data.userSessions.forEach(session => {
      const level = session.sanity_level;
      if (level < 25) ranges['CRIT']++;
      else if (level < 50) ranges['UNST']++;
      else if (level < 75) ranges['STAB']++;
      else ranges['OPTM']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#ff0033', '#ff6600', '#ffdd00', '#10b981'];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[10000] p-8">
      <GlassPanel intensity="high" className="w-full max-w-6xl h-[85vh] flex flex-col border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold tracking-tight">
                <ScrambleText text="COHERENCE ANALYTICS" />
              </h2>
              <p className="text-white/30 text-xs font-mono tracking-widest uppercase">Real-time consciousness telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalyticsData}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white/60 text-xs font-mono uppercase tracking-widest transition-all duration-200 flex items-center gap-2"
            >
              Sync
            </button>
            <button
              onClick={exportData}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white/60 text-xs font-mono uppercase tracking-widest transition-all duration-200 flex items-center gap-2"
            >
              Export
            </button>
            <button
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 px-6 pt-4">
          {['overview', 'trends', 'distribution', 'predictions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-300 relative ${
                activeTab === tab
                  ? 'text-emerald-400'
                  : 'text-white/20 hover:text-white/40'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/20 font-mono text-xs animate-pulse">INITIATING DATA RETRIEVAL...</div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Current Level', val: `${currentSanity}%` },
                      { label: 'Total Cycles', val: data.userSessions.length },
                      { label: 'Avg Coherence', val: `${data.userSessions.length > 0 ? Math.round(data.userSessions.reduce((sum, s) => sum + s.sanity_level, 0) / data.userSessions.length) : 0}%` },
                      { label: 'Global Mean', val: `${data.globalStats ? Math.round(data.globalStats.average_sanity) : 0}%` }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="text-white/30 text-[9px] uppercase tracking-widest font-mono mb-2">{stat.label}</div>
                        <div className="text-white text-2xl font-bold tracking-tight">{stat.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Session History Chart */}
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono mb-8">Temporal Coherence Flux</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data.moodHistory}>
                        <defs>
                          <linearGradient id="sanityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                        <Area 
                          type="monotone" 
                          dataKey="sanity" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#sanityGradient)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono mb-8">Vector Analysis</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={data.moodHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em' }} />
                        <Line 
                          type="monotone" 
                          dataKey="sanity" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#000' }}
                          activeDot={{ r: 6, shadow: '0 0 15px rgba(16,185,129,0.8)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trend Analysis */}
                  {data.predictions && (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { 
                          label: 'Trend Vector', 
                          val: data.predictions.trend.toUpperCase(),
                          color: data.predictions.trend === 'improving' ? 'text-emerald-400' : data.predictions.trend === 'declining' ? 'text-rose-400' : 'text-amber-400'
                        },
                        { label: 'Growth Coeff', val: data.predictions.slope },
                        { label: 'Reliability', val: `${data.predictions.confidence}%` }
                      ].map((p, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/5">
                          <div className="text-white/20 text-[9px] uppercase tracking-widest font-mono mb-2">{p.label}</div>
                          <div className={`text-2xl font-bold tracking-tight ${p.color || 'text-white'}`}>{p.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Distribution Tab */}
              {activeTab === 'distribution' && (
                <div className="grid grid-cols-2 gap-6 h-[500px]">
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex flex-col">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono mb-8">Segment Distribution</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getDistributionData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex flex-col">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono mb-8">Density Histogram</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getDistributionData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Predictions Tab */}
              {activeTab === 'predictions' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/20 rounded-2xl p-8 border border-white/5">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono mb-8 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Neural Projection
                    </h3>
                    <div className="space-y-6">
                      <p className="text-white/60 text-sm leading-relaxed font-light">
                        Linear regression analysis of temporal session data suggests the following consciousness trajectory:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono mb-1">Expected Next</div>
                          <div className="text-2xl font-bold text-white">{data.predictions?.nextValue}%</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono mb-1">Confidence</div>
                          <div className="text-2xl font-bold text-emerald-400">{data.predictions?.confidence}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-8 border border-white/5">
                    <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono mb-8">System Directives</h3>
                    <div className="space-y-3">
                      {data.predictions?.trend === 'declining' ? (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200/80 text-xs font-mono tracking-wide leading-relaxed">
                          [WARNING] DECLINING COHERENCE DETECTED. INITIATE SYSTEM COOLING AND REST PERIOD.
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200/80 text-xs font-mono tracking-wide leading-relaxed">
                          [OPTIMAL] POSITIVE VECTOR MAINTAINED. CONTINUE CURRENT NEURAL LOAD PATTERNS.
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-white/40 text-xs font-mono tracking-wide leading-relaxed">
                        [LOG] DATA INTEGRITY: 100% // SOURCE: USER_LOCAL // BUFFER: OK
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
};

export default DataAnalyticsPanel;

