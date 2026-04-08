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
    grant_distribution: 1,
    geographic_reach: 1,
    innovation_output: 1,
  });

  const [activeTab, setActiveTab] = useState('matches');
  const [results, setResults] = useState([]);
  const [savedNonprofits, setSavedNonprofits] = useState([]);
  
  const [selectedNonprofit, setSelectedNonprofit] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Load saved nonprofits on mount
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch('/api/approved');
        const data = await res.json();
        setSavedNonprofits(data);
      } catch (err) {
        console.error('Fetch saved error:', err);
      }
    };
    fetchSaved();
  }, []);

  // Fetch matches when filters change
  useEffect(() => {
    const fetchResults = async () => {
      const params = new URLSearchParams();
      if (sector !== 'All') params.append('sector', sector);
      if (maturity !== 'All') params.append('maturity', maturity);
      params.append('efficiency', weights.efficiency);
      params.append('growth', weights.growth);
      params.append('sustainability', weights.sustainability);
      params.append('scale', weights.scale);
      params.append('grant_distribution', weights.grant_distribution);
      params.append('geographic_reach', weights.geographic_reach);
      params.append('innovation_output', weights.innovation_output);

      try {
        const res = await fetch(`/api/nonprofits?${params.toString()}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Fetch matches error:', err);
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
        body: JSON.stringify({ nonprofit, weights }),
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

  const handleApprove = async (org) => {
    try {
      const payload = { nonprofit_id: org.id, name: org.name, sector: org.sector };
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to approve');
      
      const { id } = await res.json();
      // Add to local state with all parsed org metrics
      setSavedNonprofits(prev => [...prev, { ...org, approval_id: id, nonprofit_id: org.id }]);
      
      alert(`Organization "${org.name}" added to shortlist!`);
      setSelectedNonprofit(null);
    } catch (err) {
      console.error(err);
      alert('Error approving organization.');
    }
  };

  const handleRemove = async (orgId, e) => {
    if(e) e.stopPropagation();
    try {
      const res = await fetch(`/api/approve/${orgId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      setSavedNonprofits(prev => prev.filter(s => s.nonprofit_id !== orgId));
    } catch (err) {
      console.error(err);
      alert('Error removing organization.');
    }
  };

  const handleWeightChange = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  // Filter out saved orgs from matches
  const savedIds = new Set(savedNonprofits.map(s => s.nonprofit_id));
  const filteredMatches = results.filter(org => !savedIds.has(org.id));

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
              <option value="Built Environment & Sustainable Transportation">Built Environment & Sustainable Transportation</option>
              <option value="Climate Change & Adaptation">Climate Change & Adaptation</option>
              <option value="Energy Systems">Energy Systems</option>
              <option value="Environmental Education & Communication">Environmental Education & Communication</option>
              <option value="Environmental Health">Environmental Health</option>
              <option value="Environmental Justice & Equity">Environmental Justice & Equity</option>
              <option value="Food & Agriculture">Food & Agriculture</option>
              <option value="Green Finance & ESG">Green Finance & ESG</option>
              <option value="Industrial Ecology & Circularity">Industrial Ecology & Circularity</option>
              <option value="Land Conservation, Forests & Soils">Land Conservation, Forests & Soils</option>
              <option value="Law & Public Policy">Law & Public Policy</option>
              <option value="Water Systems & Marine & Coastal Ecosystems">Water Systems & Marine & Coastal Ecosystems</option>
              <option value="Science, Research & Innovation">Science, Research & Innovation</option>
              <option value="Wildlife & Biodiversity">Wildlife & Biodiversity</option>
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

          <div className="flex flex-col gap-4 mt-4">
            <h3 className="text-sm font-semibold text-green-900 border-b border-green-100 pb-2">Impact Weights</h3>
            {Object.entries({
              efficiency: 'Efficiency',
              growth: 'Growth',
              sustainability: 'Sustainability',
              scale: 'Scale',
              grant_distribution: 'Grant Distribution',
              geographic_reach: 'Geographic Reach',
              innovation_output: 'Innovation Output'
            }).map(([w, label]) => (
              <div key={w} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-green-700">
                  <span>{label}</span>
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
            {selectedNonprofit && activeTab === 'matches' && (
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
                  {explanation && !loadingExplain && (
                    <div className="mt-6 pt-6 border-t border-green-800/50 flex flex-col gap-4">
                      <h4 className="text-sm font-bold tracking-wide text-green-300 uppercase">Human evaluation checklist</h4>
                      <div className="flex flex-col gap-2 text-sm text-green-100 font-normal">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-green-600 text-green-500 focus:ring-green-500 bg-green-900 cursor-pointer" />
                          <span className="group-hover:text-white transition">Verify program outcomes</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-green-600 text-green-500 focus:ring-green-500 bg-green-900 cursor-pointer" />
                          <span className="group-hover:text-white transition">Review field reports</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-green-600 text-green-500 focus:ring-green-500 bg-green-900 cursor-pointer" />
                          <span className="group-hover:text-white transition">Assess community engagement</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-green-600 text-green-500 focus:ring-green-500 bg-green-900 cursor-pointer" />
                          <span className="group-hover:text-white transition">Contextualize financial data</span>
                        </label>
                      </div>
                      <button 
                        onClick={() => handleApprove(selectedNonprofit)}
                        className="mt-3 font-bold w-full bg-green-500 hover:bg-green-400 text-green-950 py-3 rounded-xl transition shadow-sm hover:shadow"
                      >
                        Approve for Outreach
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-green-200">
            <button
              onClick={() => { setActiveTab('matches'); setSelectedNonprofit(null); }}
              className={`pb-3 px-6 text-lg font-bold transition-all ${
                activeTab === 'matches' 
                  ? 'text-green-900 border-b-4 border-green-700' 
                  : 'text-green-500 hover:text-green-700'
              }`}
            >
              Top Matches <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-green-100 text-green-800">{filteredMatches.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('saved'); setSelectedNonprofit(null); }}
              className={`pb-3 px-6 text-lg font-bold transition-all ${
                activeTab === 'saved' 
                  ? 'text-green-900 border-b-4 border-green-700' 
                  : 'text-green-500 hover:text-green-700'
              }`}
            >
              Saved <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-green-100 text-green-800">{savedNonprofits.length}</span>
            </button>
          </div>

          {/* Results List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 min-h-[400px]">
            {activeTab === 'matches' && (
              <div className="flex flex-col gap-3">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-16 px-6 text-green-700 bg-green-50/50 rounded-xl border border-dashed border-green-200">
                    <span className="block text-3xl mb-3">🌿</span>
                    <span className="block font-medium">No new organizations match your current filters.</span>
                    <span className="block text-sm mt-1 text-green-600">Try adjusting the sliders or the sector.</span>
                  </div>
                ) : (
                  filteredMatches.map((org) => (
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
            )}

            {activeTab === 'saved' && (
              <div className="flex flex-col gap-3">
                {savedNonprofits.length === 0 ? (
                  <div className="text-center py-16 px-6 text-green-700 bg-green-50/50 rounded-xl border border-dashed border-green-200">
                    <span className="block text-3xl mb-3">📁</span>
                    <span className="block font-medium">Your shortlist is empty.</span>
                    <span className="block text-sm mt-1 text-green-600">Explore the Top Matches and approve organizations to see them here.</span>
                  </div>
                ) : (
                  savedNonprofits.map((org) => (
                    <motion.div 
                      layout
                      key={org.nonprofit_id} 
                      className="relative border border-green-200 bg-green-50 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-2xl text-green-950">{org.name}</h4>
                          <p className="text-sm text-green-700 mt-1 uppercase tracking-wider font-semibold">{org.sector}</p>
                        </div>
                        <button 
                          onClick={(e) => handleRemove(org.nonprofit_id, e)}
                          className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 font-bold py-2 px-6 rounded-xl transition text-sm shadow-sm flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-4 border-t border-green-200/60">
                        {[
                          { label: 'Program Efficiency', value: org.program_efficiency },
                          { label: 'Revenue Growth', value: org.revenue_growth },
                          { label: 'Sustainability', value: org.sustainability },
                          { label: 'Scale', value: org.scale },
                          { label: 'Grant Distribution', value: org.grant_distribution },
                          { label: 'Geographic Reach', value: org.geographic_reach },
                          { label: 'Innovation Output', value: org.innovation_output }
                        ].map(metric => (
                          <div key={metric.label} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex flex-col gap-1">
                            <span className="text-[10px] sm:text-xs font-bold text-green-700 uppercase tracking-wider">{metric.label}</span>
                            <span className="text-xl sm:text-2xl font-black text-green-900">
                              {metric.value != null ? `${(metric.value * 50).toFixed(0)}/100` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
