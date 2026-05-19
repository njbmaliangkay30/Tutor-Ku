import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

export function AdminRateRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rate_requests')
        .select(`
          *,
          tutor:tutor_profiles(
             id,
             profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected', tutorId: string, newRate: number) => {
    try {
      if (newStatus === 'approved') {
        await supabase
          .from('tutor_profiles')
          .update({ hourly_rate: newRate })
          .eq('id', tutorId);
      }

      await supabase
        .from('rate_requests')
        .update({ status: newStatus })
        .eq('id', id);

      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Gagal mengupdate status');
    }
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
        <h1 className="font-display font-bold text-[32px] tracking-tight">Pengajuan Harga</h1>
        <p className="text-text-sub font-mono text-sm">Persetujuan perubahan harga per jam tutor</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-bg-2 border-b border-border">
                <th className="p-4 text-xs font-mono font-bold text-text-sub uppercase tracking-wider">Tutor</th>
                <th className="p-4 text-xs font-mono font-bold text-text-sub uppercase tracking-wider">Harga Lama</th>
                <th className="p-4 text-xs font-mono font-bold text-text-sub uppercase tracking-wider">Pengajuan</th>
                <th className="p-4 text-xs font-mono font-bold text-text-sub uppercase tracking-wider">Alasan</th>
                <th className="p-4 text-xs font-mono font-bold text-text-sub uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-mono font-bold text-text-sub uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted font-mono text-sm">
                    Tidak ada pengajuan yang ditemukan.
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-bg-2/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-text-main">{item.tutor?.profiles?.full_name || 'Tanpa Nama'}</div>
                      <div className="text-xs text-text-muted mt-1 font-mono break-all">{item.tutor_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-mono text-text-sub">Rp {item.current_rate?.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-mono font-bold text-lime">Rp {item.requested_rate?.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <div className="text-xs text-text-sub italic line-clamp-3" title={item.reason || '-'}>
                        {item.reason || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {item.status === 'pending' && <Clock size={14} className="text-warning" />}
                        {item.status === 'approved' && <CheckCircle size={14} className="text-green-500" />}
                        {item.status === 'rejected' && <XCircle size={14} className="text-red-500" />}
                        <span className={`text-[11px] font-bold font-mono tracking-wider uppercase
                          ${item.status === 'pending' ? 'text-warning' : 
                            item.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {item.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => handleUpdateStatus(item.id, 'rejected', item.tutor_id, item.requested_rate)}
                             className="bg-bg-2 text-red-500 border border-border text-xs px-3 py-1.5 rounded-md hover:bg-bg-3 transition-colors font-mono font-bold"
                           >
                             Tolak
                           </button>
                           <button 
                             onClick={() => handleUpdateStatus(item.id, 'approved', item.tutor_id, item.requested_rate)}
                             className="bg-lime text-black font-bold text-xs px-3 py-1.5 rounded-md hover:bg-lime-mid transition-colors font-mono"
                           >
                             Setujui
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
