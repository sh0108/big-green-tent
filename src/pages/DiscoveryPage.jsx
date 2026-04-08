import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiscoveryPage() {
  const [sector, setSector] = useState('All');
  const [maturity, setMaturity] = useState('All');
  const [weights, setWeights] = useState({
    efficiency: 1,
    growth: 1,
    sustainability: 1,
    scale: 1,
  });

  const [results, setResults] = useState([]);
  const [selectedNonprofit, setSelectedNonprofit] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      const params = new URLSearchParams();
      if (sector !== 'All') params.append('sector', sector);
      if (maturity !== 'All') params.append('maturity', maturity);
      params.append('efficiency', weights.efficiency);
      params.append('growth', weights.growth);
      params.append('sustainability', weights.sustainability);
      params.append('scale', weights.scale);

      try {
        const res = await fetch(`/api/nonprofits?${params.toString()}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchResults();
  }, [sector, maturity, weights]);

  const handleExplain = async (nonprofit) => {
    setSelectedNonprofit(nonprofit);
    setExplanation('');
    setLoadingExplain(true);
    
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nonprofit),
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error(err);
      setExplanation('Failed to generate explanation. Please try again.');
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleWeightChange = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div className="min-h-screen bg-green-50 text-green-950 p-6 font-body">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col gap-6 h-fit sticky top-6">
          <div>
            <h2 className="text-3xl font-bold text-green-900 tracking-tight">Big Green Tent</h2>
            <p className="text-sm text-green-600 mt-2">Discover environmental nonprofits tailored to your impact goals.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-green-900">Environmental Sector</label>
            <select 
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="p-3 bg-green-50 rounded-xl border border-green-200 outline-none focus:ring-2 focus:ring-green-400 transition cursor-pointer"
            >
              <option value="All">All Sectors</option>
              <option value="Climate Change">Climate Change</option>
              <option value="Energy Systems">Energy Systems</option>
              <option value="Water Systems">Water Systems</option>
              <option value="Waste Management">Waste Management</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-green-900">Maturity</label>
            <select 
              value={maturity}
              onChange={(e) => setMaturity(e.target.value)}
              className="p-3 bg-green-50 rounded-xl border border-green-200 outline-none focus:ring-2 focus:ring-green-400 transition cursor-pointer"
            >
              <option value="All">All Stages</option>
              <option value="Emerging">Emerging</option>
              <option value="Established">Established</option>
              <option value="Mature">Mature</option>
            </select>
          </div>

          <div className="flex flex-col gap-5 mt-4">
            <h3 className="text-sm font-semibold text-green-900 border-b border-green-100 pb-2">Impact Weights</h3>
            {['efficiency', 'growth', 'sustainability', 'scale'].map(w => (
              <div key={w} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-green-700 capitalize">
                  <span>{w}</span>
                  <span className="bg-green-100 px-2 py-0.5 rounded-full">{weights[w].toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" 
                  value={weights[w]} 
                  onChange={(e) => handleWeightChange(w, e.target.value)}
                  className="w-full accent-green-600 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Results & Explain Box */}
        <div className="w-full md:w-2/3 flex flex-col gap-6 pb-20">
          
          {/* Explain Box */}
          <AnimatePresence>
            {selectedNonprofit && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-900 text-green-50 p-6 rounded-2xl shadow-xl border border-green-800"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold tracking-tight">{selectedNonprofit.name}</h3>
                  <button 
                    onClick={() => setSelectedNonprofit(null)} 
                    className="text-green-400 hover:text-white bg-green-800 hover:bg-green-700 w-8 h-8 rounded-full flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-green-100 mb-5">
                  <span className="bg-green-800 px-3 py-1 rounded-lg border border-green-700">{selectedNonprofit.sector}</span>
                  <span className="bg-green-800 px-3 py-1 rounded-lg border border-green-700">{selectedNonprofit.maturity}</span>
                  <span className="bg-green-800 px-3 py-1 rounded-lg border border-green-700">{selectedNonprofit.location}</span>
                </div>
                <div className="bg-green-950/50 p-4 rounded-xl min-h-[4rem] text-sm leading-relaxed text-green-50 italic">
                  {loadingExplain ? (
                    <span className="animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></span>
                      AI is analyzing this organization...
                    </span>
                  ) : (
                    explanation
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-6 flex justify-between items-center">
              <span>Top Matches</span>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-4 py-1.5 rounded-full ring-1 ring-green-200">{results.length} found</span>
            </h2>
            <div className="flex flex-col gap-3">
              {results.length === 0 ? (
                <div className="text-center py-12 text-green-600 bg-green-50/50 rounded-xl border border-dashed border-green-200">
                  <span className="block text-2xl mb-2">🌿</span>
                  No organizations match your precise criteria. Try broadening your filters.
                </div>
              ) : (
                results.map((org) => (
                  <motion.div 
                    layout
                    key={org.id} 
                    onClick={() => handleExplain(org)}
                    className={`relative group cursor-pointer border ${selectedNonprofit?.id === org.id ? 'border-green-500 bg-green-50/50' : 'border-green-100'} p-5 rounded-xl hover:border-green-400 hover:bg-green-50/80 transition-all overflow-hidden`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="md:w-2/3">
                        <h4 className="font-bold text-lg text-green-950 group-hover:text-green-700 transition">{org.name}</h4>
                        <p className="text-sm text-green-700 line-clamp-1 mt-1">{org.mission}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col md:items-end justify-center gap-1">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Match Score</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 md:w-32 h-2.5 bg-green-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${org.score}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              className="h-full bg-green-500"
                            />
                          </div>
                          <span className="font-black text-green-900 w-8 text-right">{org.score}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
