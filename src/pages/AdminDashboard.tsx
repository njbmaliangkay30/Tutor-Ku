import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { CheckCircle, XCircle, Clock, Search, ChevronRight, MessageCircle } from 'lucide-react';

export interface VerificationStatus {
  id: string;
  tutor_id: string;
  status: 'pending' | 'interview' | 'approved' | 'rejected';
  nama: string;
  ktp_url: string;
  ijazah_url: string;
  supporting_docs_url?: string[];
  achievements?: string;
  pengalaman_mengajar: string;
  created_at: string;
  user_profiles?: {
    phone: string;
  };
}

const DocumentPreview = ({ url, title }: { url: string; title: string }) => {
  if (!url) return <span className="text-text-muted text-xs">{title} -</span>;
  
  const isPdf = url.toLowerCase().includes('.pdf');

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-text-sub font-bold uppercase tracking-wider">{title}</span>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block w-28 h-20 rounded-md border border-border overflow-hidden bg-bg-3/50 hover:border-lime transition-colors group relative shadow-sm"
      >
        {isPdf ? (
          <div className="w-full h-full overflow-hidden relative">
            <iframe 
              src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
              className="absolute top-0 left-0 w-[125%] h-[125%] pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300 bg-white" 
              title={title}
              tabIndex={-1}
            />
          </div>
        ) : (
          <img 
            src={url} 
            alt={title} 
            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                 e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-text-sub bg-bg-base/50">FILE</div>';
              }
            }}
          />
        )}
      </a>
    </div>
  );
};

export function AdminDashboard() {
  const [verifications, setVerifications] = useState<VerificationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutor_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      let mergedData = data || [];
      if (mergedData.length > 0) {
        const tutorIds = mergedData.map(item => item.tutor_id);
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, phone')
          .in('id', tutorIds);

        if (usersData) {
          mergedData = mergedData.map(item => {
            const profile = usersData.find(u => u.id === item.tutor_id);
            return {
              ...item,
              user_profiles: {
                phone: profile?.phone || ''
              }
            };
          });
        }
      }

      setVerifications(mergedData as any);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data verifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'interview' | 'approved' | 'rejected', tutorId: string) => {
    try {
      // 1. Update verification table
      const { error: updateVerifError } = await supabase
        .from('tutor_verifications')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateVerifError) throw updateVerifError;

      // 2. If approved, update tutor_profiles is_verified = true
      if (newStatus === 'approved') {
        const { error: updateTutorError } = await supabase
          .from('tutor_profiles')
          .update({ is_verified: true })
          .eq('id', tutorId);
          
        if (updateTutorError) throw updateTutorError;
      }

      // If rejected, maybe update is_verified = false just in case
      if (newStatus === 'rejected') {
        await supabase
          .from('tutor_profiles')
          .update({ is_verified: false })
          .eq('id', tutorId);
      }

      fetchVerifications(); // refresh data
    } catch (err: any) {
      console.error('Update status error:', err);
      setError('Gagal mengupdate status, formating DB tidak valid atau terjadi karena error network: ' + err.message);
    }
  };

  const getWhatsAppUrl = (noWa?: string) => {
    if (!noWa) return '#';
    let formatted = noWa.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
    }
    return `https://wa.me/${formatted}?text=Halo, kami dari tim TutorKu ingin menjadwalkan interview verifikasi tutor Anda.`;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-4 border-lime border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 w-full animate-pgIn space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold text-[32px] tracking-tight">Data Verifikasi</h1>
        <p className="text-text-sub font-mono text-sm">Kelola pendaftaran dan verifikasi tutor.</p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-500">
          {error}
        </div>
      ) : (
        <div className="bg-bg-2 border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-3/50 text-xs text-text-sub font-bold uppercase tracking-wider">
                  <th className="p-4 font-mono">Tutor</th>
                  <th className="p-4 font-mono">Pengalaman & Prestasi</th>
                  <th className="p-4 font-mono">Status</th>
                  <th className="p-4 font-mono">Dokumen</th>
                  <th className="p-4 font-mono">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {verifications.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-3/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-text-main">{item.nama || 'Tanpa Nama'}</div>
                        <div className="text-xs text-text-muted mt-1 font-mono break-all">{item.tutor_id}</div>
                        {item.user_profiles?.phone && (
                           <div className="text-xs text-text-muted mt-1 font-mono break-all">WA: {item.user_profiles.phone}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-text-sub">
                        {item.pengalaman_mengajar && <p className="text-xs line-clamp-2" title={item.pengalaman_mengajar}>{item.pengalaman_mengajar}</p>}
                        {item.achievements && <p className="text-xs text-lime mt-1 line-clamp-1" title={item.achievements}>🏆 {item.achievements}</p>}
                      </td>
                      <td className="p-4">
                        {item.status === 'pending' && <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded-md"><Clock size={14}/> Menunggu Review</span>}
                        {item.status === 'interview' && <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded-md"><MessageCircle size={14}/> Tahap Interview</span>}
                        {item.status === 'approved' && <span className="inline-flex items-center gap-1.5 bg-lime/10 text-lime text-xs font-bold px-2 py-1 rounded-md"><CheckCircle size={14}/> Disetujui</span>}
                        {item.status === 'rejected' && <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded-md"><XCircle size={14}/> Ditolak</span>}
                      </td>
                      <td className="p-4 text-sm font-mono flex flex-wrap gap-3">
                        <DocumentPreview url={item.ktp_url} title="KTP" />
                        <DocumentPreview url={item.ijazah_url} title="Ijazah" />
                        {item.supporting_docs_url?.[0] && <DocumentPreview url={item.supporting_docs_url[0]} title="Pendukung" />}
                      </td>
                      <td className="p-4">
                        {item.status === 'pending' && (
                          <div className="flex flex-col gap-2 w-max">
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'interview', item.tutor_id)}
                              className="bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors"
                            >
                              Jadwalkan Interview
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'rejected', item.tutor_id)}
                              className="bg-transparent border border-red-500/50 text-red-500 font-bold text-xs px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                            >
                              Tolak Langsung
                            </button>
                          </div>
                        )}

                        {item.status === 'interview' && (
                          <div className="flex flex-col gap-2 w-max">
                            {item.user_profiles?.phone ? (
                              <a 
                                href={getWhatsAppUrl(item.user_profiles.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors flex items-center gap-1 justify-center"
                              >
                                 <MessageCircle size={12}/> Hubungi WA
                              </a>
                            ) : (
                              <span className="text-xs text-red-500">No WA tidak ada</span>
                            )}
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'approved', item.tutor_id)}
                              className="bg-lime text-black font-bold text-xs px-3 py-1.5 rounded-md hover:bg-lime-mid transition-colors mt-2"
                            >
                              Lulus & Setujui
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(item.id, 'rejected', item.tutor_id)}
                              className="bg-transparent border border-red-500/50 text-red-500 font-bold text-xs px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                            >
                              Tolak
                            </button>
                          </div>
                        )}

                      {(item.status === 'approved' || item.status === 'rejected') && (
                        <span className="text-text-muted text-xs font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {verifications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-sub font-mono">
                      Belum ada pendaftaran tutor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
