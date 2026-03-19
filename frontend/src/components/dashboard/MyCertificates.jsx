import React, { useState, useEffect } from 'react';
import { Award, Download, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import { format } from 'date-fns';

const MyCertificates = () => {
  const { fetchMyCertificates, loading } = useEnrollmentStore();
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const data = await fetchMyCertificates();
        setCertificates(data);
      } catch (error) {
        console.error('Failed to load certificates:', error);
      }
    };

    loadCertificates();
  }, [fetchMyCertificates]);

  if (loading && certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p>Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">My Certificates</h2>
          <p className="text-slate-400">Your verified achievements and participation records.</p>
        </div>
        <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-2xl border border-indigo-500/20 flex items-center gap-2">
          <Award size={20} />
          <span className="font-bold">{certificates.length} Earned</span>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto text-slate-600">
            <Award size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">No certificates yet</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              Participate in events and mark your attendance to earn verified certificates.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div 
              key={cert._id}
              className="group glass-card overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              {/* Event Image / Placeholder */}
              <div className="h-32 bg-linear-to-br from-indigo-900/40 to-slate-900 relative overflow-hidden">
                {cert.event.thumbnail ? (
                  <img src={cert.event.thumbnail} alt={cert.event.title} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Award className="w-12 h-12 text-indigo-500/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 to-transparent" />
                <div className="absolute bottom-3 left-4">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md border border-white/5">
                     Verified
                   </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {cert.event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Calendar size={14} />
                    <span>{format(new Date(cert.event.date), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>

                <a 
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all group/btn"
                >
                  <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform" />
                  Download PDF
                  <ExternalLink size={14} className="opacity-50" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
