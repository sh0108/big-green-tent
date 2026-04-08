import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [approvedOrgs, setApprovedOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await fetch('/api/approved');
        const data = await res.json();
        setApprovedOrgs(data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApproved();
  }, []);

  return (
    <div className="min-h-screen bg-green-50 text-green-950 p-6 font-body">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-green-900 tracking-tight">Ready to reach out</h1>
          <p className="text-lg text-green-700">
            {loading ? 'Loading...' : `${approvedOrgs.length} organizations vetted and approved`}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!loading && approvedOrgs.length === 0 && (
            <div className="text-center py-16 text-green-600 bg-white rounded-2xl border border-dashed border-green-200">
              <span className="block text-3xl mb-3">✉️</span>
              No organizations have been approved for outreach yet.
            </div>
          )}

          {!loading && approvedOrgs.map((org, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={org.id} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-10 h-10 flex-shrink-0 bg-green-100 text-green-800 font-black rounded-full flex items-center justify-center text-lg">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-950">{org.name}</h3>
                  <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mt-1">{org.sector}</p>
                </div>
              </div>
              <button className="bg-green-800 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-sm hover:shadow">
                Contact
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
