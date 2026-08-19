import React, { useState, useEffect, useRef } from 'react';
import {
  Rocket,
  Play,
  Pause,
  Upload,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Settings2,
  RefreshCw,
} from 'lucide-react';

interface SendOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const SendOnlyModal: React.FC<SendOnlyModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  // 1. Local & Server Persisted State
  const [messageText, setMessageText] = useState<string>(() => {
    return localStorage.getItem('tg_auto_send_message') || '';
  });
  const [groupsInput, setGroupsInput] = useState<string>(() => {
    return localStorage.getItem('tg_auto_send_groups') || '';
  });
  const [allGroupsSelected, setAllGroupsSelected] = useState<boolean>(() => {
    return localStorage.getItem('tg_auto_send_all_groups') === 'true';
  });
  const [sendType, setSendType] = useState<'manual' | 'scheduled'>(() => {
    return (localStorage.getItem('tg_auto_send_type') as any) || 'manual';
  });
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('tg_auto_send_interval');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [scheduleDuration, setScheduleDuration] = useState<number>(() => {
    const saved = localStorage.getItem('tg_auto_send_duration');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [sanitizeMode, setSanitizeMode] = useState<'salam' | 'skip' | 'smart' | 'always' | 'off'>(() => {
    return (localStorage.getItem('tg_auto_send_sanitize') as any) || 'salam';
  });
  const [uploadedImages, setUploadedImages] = useState<Array<{ name: string; data: string; type: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [logs, setLogs] = useState<Array<{ id: string; time: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    {
      id: 'init',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: isAr ? '● واجهة الإرسال المستقلة جاهزة' : '● Independent Send Suite Ready',
      type: 'info',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev.slice(-49),
      { id: `${Date.now()}_${Math.random()}`, time, message: msg, type },
    ]);
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Load configuration from server & sync
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.settings) {
          if (data.settings.message && !localStorage.getItem('tg_auto_send_message')) {
            setMessageText(data.settings.message);
          }
          if (data.settings.groups && data.settings.groups.length > 0 && !localStorage.getItem('tg_auto_send_groups')) {
            setGroupsInput(data.settings.groups.join('\n'));
          }
          if (data.settings.interval_seconds && !localStorage.getItem('tg_auto_send_interval')) {
            setIntervalMinutes(Math.floor(data.settings.interval_seconds / 60) || 25);
          }
          if (data.settings.sanitize_mode && !localStorage.getItem('tg_auto_send_sanitize')) {
            setSanitizeMode(data.settings.sanitize_mode);
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Save changes locally whenever they change
  useEffect(() => {
    localStorage.setItem('tg_auto_send_message', messageText);
  }, [messageText]);

  useEffect(() => {
    localStorage.setItem('tg_auto_send_groups', groupsInput);
  }, [groupsInput]);

  useEffect(() => {
    localStorage.setItem('tg_auto_send_all_groups', String(allGroupsSelected));
  }, [allGroupsSelected]);

  useEffect(() => {
    localStorage.setItem('tg_auto_send_type', sendType);
  }, [sendType]);

  useEffect(() => {
    localStorage.setItem('tg_auto_send_interval', String(intervalMinutes));
  }, [intervalMinutes]);

  useEffect(() => {
    localStorage.setItem('tg_auto_send_duration', String(scheduleDuration));
  }, [scheduleDuration]);

  useEffect(() => {
    localStorage.setItem('tg_auto_send_sanitize', sanitizeMode);
  }, [sanitizeMode]);

  if (!isOpen) return null;

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        addLog(isAr ? `⚠️ ${file.name} أكبر من 10MB تم تجاهلها` : `⚠️ ${file.name} > 10MB skipped`, 'warn');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedImages((prev) => [
            ...prev,
            { name: file.name, data: e.target!.result as string, type: file.type },
          ]);
          addLog(isAr ? `📷 تم إرفاق الصورة: ${file.name}` : `📷 Attached: ${file.name}`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveConfig = async () => {
    const payload = {
      message: messageText,
      groups: groupsInput,
      send_type: sendType,
      interval_seconds: (intervalMinutes || 25) * 60,
      schedule_duration_hours: scheduleDuration || 0,
      sanitize_mode: sanitizeMode,
    };

    try {
      const res = await fetch('/api/save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus(isAr ? 'تم الحفظ وتثبيت الإعدادات بنجاح!' : 'Settings Saved!');
        addLog(isAr ? '💾 تم حفظ وتثبيت إعدادات الإرسال في الخادم والمحلي' : '💾 Send settings saved successfully', 'success');
      } else {
        setSaveStatus(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving');
      }
      setTimeout(() => setSaveStatus(''), 3500);
    } catch (e: any) {
      setSaveStatus(isAr ? 'خطأ في الاتصال' : 'Connection error');
      setTimeout(() => setSaveStatus(''), 3500);
    }
  };

  const handleSendNow = async () => {
    const msg = messageText.trim();
    const grps = groupsInput.trim();
    const sendToAll = allGroupsSelected;

    if (!msg && uploadedImages.length === 0) {
      addLog(isAr ? '⚠️ يرجى كتابة نص الرسالة أو رفع صورة على الأقل' : '⚠️ Enter text or attach image', 'warn');
      return;
    }
    if (!sendToAll && !grps) {
      addLog(isAr ? '⚠️ يرجى إدخال معرفات المجموعات أو اختيار "كل المجموعات"' : '⚠️ Provide groups or select All Groups', 'warn');
      return;
    }

    setIsSending(true);
    addLog(isAr ? '⏳ جاري تنفيذ الإرسال السريع لجميع الوجهات...' : '⏳ Executing send operation...', 'info');

    try {
      const res = await fetch('/api/send_now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          groups: grps,
          send_to_all: sendToAll,
          images: uploadedImages,
          action: sanitizeMode,
        }),
      });
      const result = await res.json();
      if (result.success) {
        addLog(isAr ? `✅ تم الإرسال بنجاح! (${result.sent_count || 1} مجموعة)` : `✅ Sent successfully! (${result.sent_count || 1} groups)`, 'success');
      } else {
        addLog(isAr ? `❌ فشل الإرسال: ${result.error || result.message || 'خطأ غير معروف'}` : `❌ Failed: ${result.error || 'Error'}`, 'error');
      }
    } catch (err: any) {
      addLog(isAr ? `❌ خطأ في الاتصال: ${err.message}` : `❌ Network error: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-['Cairo',sans-serif]">
      <div
        className="bg-zinc-950 border border-amber-500/30 text-zinc-100 flex flex-col rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[750px] overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header - ONLY dedicated to Send function */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-inner">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-zinc-100">
                  {isAr ? 'واجهة الإرسال السريع والمجدول (Send Module)' : 'Quick & Scheduled Send Suite'}
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded-md font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  مستقل 🚀
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isAr ? 'نافذة منفصلة مخصصة بالكامل لصياغة وإرسال وجدولة الرسائل والوسائط للمجموعات مع حفظ دائم للإعدادات' : 'Dedicated interface for broadcasting and scheduling messages to groups'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfig}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              title="حفظ الإعدادات"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ دائم' : 'Save'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {saveStatus && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Main Send Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: Text & Groups (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Message Input Box */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'نص الرسالة المراد نشرها:' : 'Message Content:'}</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {messageText.length} {isAr ? 'حرف' : 'chars'}
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isAr ? 'اكتب هنا نص الإعلان، العرض، أو الرسالة المراد نشرها في المجموعات والقنوات...' : 'Write message text here...'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
                />

                {/* Media Attachment */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleImages(e.target.files)}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'إرفاق صور أو وسائط' : 'Attach Media'}</span>
                    </button>
                    {uploadedImages.length > 0 && (
                      <span className="text-[11px] text-amber-400 font-bold">
                        {isAr ? `${uploadedImages.length} صور مرفقة` : `${uploadedImages.length} images`}
                      </span>
                    )}
                  </div>

                  {/* Previews */}
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-700">
                          <img src={img.data} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Groups Input */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span>👥 {isAr ? 'المجموعات والقنوات المستهدفة:' : 'Target Groups & Channels:'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allGroupsSelected}
                      onChange={(e) => setAllGroupsSelected(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <span>{isAr ? 'إرسال لجميع المجموعات المشترك بها' : 'Send to all joined groups'}</span>
                  </label>
                </div>

                {!allGroupsSelected && (
                  <textarea
                    rows={4}
                    value={groupsInput}
                    onChange={(e) => setGroupsInput(e.target.value)}
                    placeholder={isAr ? '@channel1\nhttps://t.me/group2\n-1001234567890\n(ضع كل رابط أو معرف في سطر مستقل)' : 'Enter one group/channel per line...'}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none dir-ltr text-right"
                  />
                )}
              </div>

            </div>

            {/* Right Column: Mode, Timing & Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Dispatch Timing Mode */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>{isAr ? 'نوع التكرار والجدولة:' : 'Timing & Scheduling:'}</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendType('manual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      sendType === 'manual'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    🚀 {isAr ? 'إرسال فوري يدوي' : 'Manual Send'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendType('scheduled')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      sendType === 'scheduled'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    ⏰ {isAr ? 'إرسال دوري مجدول' : 'Scheduled Cycle'}
                  </button>
                </div>

                {sendType === 'scheduled' && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{isAr ? 'الفاصل الزمني (بالدقائق):' : 'Interval (minutes):'}</span>
                      <input
                        type="number"
                        min={1}
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center text-xs font-bold text-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sanitize and Group Protection Mode */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? '🛡️ وضع الحماية من الحظر (Anti-Ban):' : 'Anti-Ban Protection:'}</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSanitizeMode('salam')}
                    className={`p-2 rounded-xl cursor-pointer border text-right transition-all ${
                      sanitizeMode === 'salam'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-amber-300">🤖 ذكي (salam)</div>
                    <div className="text-[9px] text-zinc-400">إرسال السلام ثم التعديل</div>
                  </div>

                  <div
                    onClick={() => setSanitizeMode('skip')}
                    className={`p-2 rounded-xl cursor-pointer border text-right transition-all ${
                      sanitizeMode === 'skip'
                        ? 'bg-sky-500/15 border-sky-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-sky-300">⏭️ تخطي</div>
                    <div className="text-[9px] text-zinc-400">عدم الإرسال للمحمية</div>
                  </div>

                  <div
                    onClick={() => setSanitizeMode('smart')}
                    className={`p-2 rounded-xl cursor-pointer border text-right transition-all ${
                      sanitizeMode === 'smart'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-emerald-300">🧠 تنقية ذكية</div>
                    <div className="text-[9px] text-zinc-400">فلترة الروابط الحساسة</div>
                  </div>

                  <div
                    onClick={() => setSanitizeMode('off')}
                    className={`p-2 rounded-xl cursor-pointer border text-right transition-all ${
                      sanitizeMode === 'off'
                        ? 'bg-rose-500/15 border-rose-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-rose-300">🚫 مباشر</div>
                    <div className="text-[9px] text-zinc-400">بدون فلترة</div>
                  </div>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSendNow}
                  disabled={isSending}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Rocket className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                  <span>{isSending ? (isAr ? 'جاري الإرسال الفعلي...' : 'Sending...') : (isAr ? 'بدء الإرسال الفوري الآن 🚀' : 'Send Broadcast Now 🚀')}</span>
                </button>
              </div>

              {/* Real-time Activity Log */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 block">📋 {isAr ? 'سجل عمليات الإرسال المباشر:' : 'Activity Log:'}</span>
                <div
                  ref={logBoxRef}
                  className="bg-zinc-950 rounded-xl p-2.5 h-24 overflow-y-auto font-mono text-[10px] space-y-1 border border-zinc-800/80"
                >
                  {logs.map((item) => (
                    <div key={item.id} className="flex items-start gap-1.5">
                      <span className="text-zinc-500 shrink-0">[{item.time}]</span>
                      <span
                        className={
                          item.type === 'success'
                            ? 'text-emerald-400'
                            : item.type === 'warn'
                            ? 'text-amber-400'
                            : item.type === 'error'
                            ? 'text-rose-400'
                            : 'text-zinc-300'
                        }
                      >
                        {item.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
