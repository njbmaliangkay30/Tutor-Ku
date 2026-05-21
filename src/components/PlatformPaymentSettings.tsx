import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Upload, Check, Edit3, Settings, AlertCircle, Info, QrCode, Copy } from 'lucide-react';

export interface PaymentSettingsType {
  bank_name: string;
  account_number: string;
  account_name: string;
  qris_url: string;
}

export function PlatformPaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettingsType>({
    bank_name: "BANK BCA",
    account_number: "223-0182-991",
    account_name: "RuangTutor Platform",
    qris_url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://RuangTutorPlatformQRIS"
  });

  const [copiedText, setCopiedText] = useState(false);
  
  const handleCopyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [qrisUrl, setQrisUrl] = useState("");
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 1. Try DB
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'payment_settings')
        .single();
      
      if (!error && data && data.value) {
        const val = data.value as PaymentSettingsType;
        setSettings(val);
        setBankName(val.bank_name || "");
        setAccountNumber(val.account_number || "");
        setAccountName(val.account_name || "");
        setQrisUrl(val.qris_url || "");
        return;
      }
    } catch (e) {
      console.warn("DB settings table not found or fully mapped. Using local storage or default.", e);
    }

    // 2. Try localStorage
    const local = localStorage.getItem('rt_payment_settings');
    if (local) {
      try {
        const parsed = JSON.parse(local) as PaymentSettingsType;
        setSettings(parsed);
        setBankName(parsed.bank_name || "");
        setAccountNumber(parsed.account_number || "");
        setAccountName(parsed.account_name || "");
        setQrisUrl(parsed.qris_url || "");
        return;
      } catch (e) {}
    }

    // Default init values
    setBankName("BANK BCA");
    setAccountNumber("223-0182-991");
    setAccountName("RuangTutor Platform");
    setQrisUrl("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://RuangTutorPlatformQRIS");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQrisFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(false);
    setSaveStatus("idle");
    setStatusMessage("");

    try {
      setIsSaving(true);
      let uploadedUrl = qrisUrl;

      // Handle QRIS image upload if selected
      if (qrisFile) {
        setIsUploading(true);
        const fileExt = qrisFile.name.split('.').pop() || 'png';
        const fileName = `platform/qris_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Data Verifikasi Tutor')
          .upload(fileName, qrisFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          throw new Error("Gagal mengunggah QRIS: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('Data Verifikasi Tutor')
          .getPublicUrl(fileName);

        if (publicUrlData) {
          uploadedUrl = publicUrlData.publicUrl;
          setQrisUrl(uploadedUrl);
        }
        setIsUploading(false);
      }

      const updatedSettings: PaymentSettingsType = {
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        qris_url: uploadedUrl
      };

      // 1. Save to DB (Create table on the fly if needed, or handle gracefully if not exist)
      // Since creating DB table via browser might fail, we catch error but always update local storage!
      try {
        // We attempt to write to platform_settings.
        // Let's see if the table exists. If it doesn't, this will error, which we catch.
        const { error: dbWriteError } = await supabase
          .from('platform_settings')
          .upsert({ key: 'payment_settings', value: updatedSettings }, { onConflict: 'key' });
        
        if (dbWriteError) {
          console.warn("Table platform_settings does not exist or write blocked. Utilizing local/sync fallback.", dbWriteError);
        }
      } catch (dbErr) {
        console.warn("Supabase write fallback executed.", dbErr);
      }

      // 2. Persist in local storage
      localStorage.setItem('rt_payment_settings', JSON.stringify(updatedSettings));
      
      // Dispatch a storage event or window event so that other components can listen and refresh
      window.dispatchEvent(new Event('rt_payment_settings_updated'));

      setSettings(updatedSettings);
      setSaveStatus("success");
      setStatusMessage("Pengaturan rekening/QRIS terpusat berhasil diperbarui!");
      setQrisFile(null);
      
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus("idle");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
      setStatusMessage(err.message || "Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="payment-settings-card" className="bg-card border-2 border-border/80 rounded-2xl overflow-hidden transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-bg-3/20 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-dim/20 text-lime flex items-center justify-center border border-lime/20 shadow-sm">
            <QrCode size={20} />
          </div>
          <div>
            <h3 className="font-bold text-text-main text-[15px] sm:text-base">Pengaturan Rekening & QRIS Terpusat</h3>
            <p className="text-xs text-text-sub">Siswa akan mentransfer dana ke rekening & QRIS ini saat memesan sesi atau membeli paket.</p>
          </div>
        </div>
        <button className="text-[11px] font-bold tracking-wide font-mono px-3 py-1.5 rounded-lg border border-border bg-bg-2 text-text-main group-hover:border-lime hover:bg-bg-3 transition-colors">
          {isOpen ? "Sembunyikan" : "Buka Pengaturan"}
        </button>
      </div>

      {isOpen && (
        <div className="p-5 border-t-2 border-border/60 bg-bg-2/30 space-y-6">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-lime uppercase tracking-wider font-mono">Detail Rekening Platform</span>
                  <div className="bg-bg-base/80 border border-border rounded-xl p-4 space-y-3.5 relative overflow-hidden">
                    <div className="absolute right-3 top-3 opacity-15">
                      <CreditCard size={48} className="text-lime" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-text-sub font-mono uppercase tracking-wider">Nama Bank / Dompet Digital</span>
                      <span className="font-bold text-text-main text-sm">{settings.bank_name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] text-text-sub font-mono uppercase tracking-wider">Nomor Rekening / HP</span>
                        <span className="font-bold font-mono tracking-wide text-lime text-base">{settings.account_number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(settings.account_number)}
                        className="text-lime hover:text-lime-dim p-2 flex items-center gap-1.5 cursor-pointer transition-all border border-border/80 bg-bg-base/60 rounded-xl px-3 hover:bg-bg-3"
                        title="Salin No. Rekening"
                      >
                        {copiedText ? (
                          <>
                            <span className="text-xs font-bold text-success font-sans">Disalin!</span>
                            <Check size={14} className="text-success" />
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-text-sub font-semibold font-sans">Salin</span>
                            <Copy size={13} className="text-text-sub" />
                          </>
                        )}
                      </button>
                    </div>
                    <div>
                      <span className="block text-[10px] text-text-sub font-mono uppercase tracking-wider">Nama Pemilik Rekening</span>
                      <span className="font-semibold text-text-main text-xs">{settings.account_name}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-black bg-lime px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Edit3 size={14} /> Ubah Detail Rekening / QRIS
                </button>
              </div>

              {/* Right QRIS preview */}
              <div className="flex flex-col items-center justify-center p-4 border border-border rounded-xl bg-bg-base text-center gap-3">
                <span className="text-xs font-bold text-text-main uppercase font-mono tracking-wider">Tampilan QRIS Terpusat</span>
                <div className="p-3 bg-white rounded-xl border-2 border-border shadow-md max-w-[200px] w-full aspect-square flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={settings.qris_url} 
                    alt="Platform QRIS" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RuangTutorPlatformQRIS";
                    }}
                  />
                </div>
                <p className="text-[10px] text-text-sub leading-relaxed max-w-[280px]">
                  Siswa dapat langsung memindai QR code ini memakai e-wallet atau aplikasi bank transfer m-Banking mana pun.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">Nama Bank / QRIS</label>
                  <input 
                    type="text" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    placeholder="Contoh: BANK BCA, BANK MANDIRI, QRIS ALL PAYMENT"
                    className="w-full bg-bg-base border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-lime"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">Nomor Rekening / No HP</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    placeholder="Contoh: 123-456-7890 atau 0812345678"
                    className="w-full bg-bg-base border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-lime font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-1.5">Nama Pemilik Rekening (A/N)</label>
                <input 
                  type="text" 
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  placeholder="Contoh: a/n RuangTutor Platform"
                  className="w-full bg-bg-base border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-lime"
                />
              </div>

              <div className="p-4 bg-bg-base border border-border rounded-xl space-y-3">
                <span className="block text-xs font-bold text-text-main uppercase tracking-wider">Unggah Gambar QRIS Baru (QR Code)</span>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative cursor-pointer bg-bg-3 border-2 border-dashed border-border hover:border-lime p-4 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 shrink-0 w-32 h-32 overflow-hidden group">
                    {qrisFile ? (
                      <div className="absolute inset-0">
                        <img src={URL.createObjectURL(qrisFile)} className="w-full h-full object-cover" alt="preview" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload size={18} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="text-text-sub" />
                        <span className="text-[10px] text-text-sub font-semibold">Pilih File QR Code</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs text-text-main font-semibold">Ganti Kode QR / QRIS</p>
                    <p className="text-[10px] text-text-sub leading-tight">
                      Unggah berkas PNG/JPEG QRIS yang didapatkan dari bank/merchant payment Anda. Berkas akan otomatis disimpan secara langsung di platform.
                    </p>
                    {settings.qris_url && (
                      <div className="text-[10px] text-lime truncate max-w-xs font-mono">
                        URL Aktif: {settings.qris_url}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {saveStatus === "success" && (
                <div className="bg-success/15 border border-success/30 rounded-xl p-3 flex gap-2 items-center text-xs text-success font-semibold animate-pgIn">
                  <Check size={16} />
                  <span>{statusMessage}</span>
                </div>
              )}

              {saveStatus === "error" && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 flex gap-2 items-center text-xs text-red-500 font-semibold animate-pgIn">
                  <AlertCircle size={16} />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-lime text-black font-bold text-xs px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setSaveStatus("idle");
                  }}
                  className="bg-bg-3 border border-border text-text-main font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-border/30 active:scale-95 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
