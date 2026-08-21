import React, { useState, useEffect } from 'react';

interface MobileAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onTriggerInstall?: () => void;
}

export const MobileAppInstallModal: React.FC<MobileAppInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'github' | 'native' | 'offline'>('android');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isAndroidDevice = /android/.test(userAgent);
      setIsIOS(isIosDevice);
      setIsAndroid(isAndroidDevice);

      if (isIosDevice) {
        setActiveTab('ios');
      } else if (isAndroidDevice) {
        setActiveTab('android');
      }

      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      if ('Notification' in window) {
        setNotificationStatus(Notification.permission);
      } else {
        setNotificationStatus('unsupported');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationStatus(perm);
        if (perm === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('School Nexus Mobile', {
              body: 'เปิดการแจ้งเตือนบนมือถือเรียบร้อยแล้ว พร้อมรับข่าวสารและตารางเรียน!',
              icon: '/icons/icon.svg',
            });
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-install-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-[#0c1527] via-[#102554] to-[#1550d3] p-5 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-2xl text-amber-300">phone_iphone</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="mobile-install-title" className="text-lg font-black tracking-tight">ติดตั้งแอป School Nexus</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  {isStandalone ? 'ติดตั้งแล้ว (Installed)' : 'Android & iOS'}
                </span>
              </div>
              <p className="text-xs text-blue-100/80">รองรับการใช้งานเต็มจอ ทำงานแบบออฟไลน์ และแจ้งเตือนบนมือถือ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1.5 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-base text-emerald-600">android</span>
            <span>ระบบ Android</span>
            {isAndroid && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-base text-slate-800">phone_iphone</span>
            <span>iPhone / iOS</span>
            {isIOS && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'github'
                ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-base text-purple-600">deployed_code</span>
            <span>โหลดผ่าน GitHub</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('native')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'native'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-base text-indigo-600">code_blocks</span>
            <span>สร้างไฟล์ APK / IPA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('offline')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'offline'
                ? 'bg-white text-amber-700 shadow-sm border border-amber-100'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-base text-amber-600">cloud_done</span>
            <span>ออฟไลน์ & แจ้งเตือน</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 text-sm space-y-4">
          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <span className="material-symbols-outlined text-xl">install_mobile</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-emerald-950 text-sm">ติดตั้งแอปทันทีบนมือถือ Android</h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    ระบบรองรับ <strong>PWA WebAPK</strong> สามารถติดตั้งเป็นแอปจริงบนหน้าจอมือถือได้โดยตรง เปิดได้แบบเต็มหน้าจอ (Standalone Fullscreen) และมีปุ่มลัดสแกน QR / บัตรนักเรียน
                  </p>
                </div>
              </div>

              {/* Direct Install Button if supported */}
              {deferredPrompt && onTriggerInstall && (
                <div className="text-center p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl text-white shadow-lg shadow-emerald-600/25 space-y-2">
                  <div className="text-xs font-medium text-emerald-100">พร้อมติดตั้งบนอุปกรณ์ของคุณแล้ว</div>
                  <button
                    type="button"
                    onClick={onTriggerInstall}
                    className="w-full py-3 px-6 rounded-xl bg-white text-emerald-900 font-extrabold text-sm shadow-md hover:bg-emerald-50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-emerald-700">download</span>
                    <span>กดที่นี่เพื่อติดตั้งแอป School Nexus (Android)</span>
                  </button>
                </div>
              )}

              {/* Step-by-Step for Android Chrome / Samsung Browser */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">checklist</span>
                  <span>วิธีติดตั้งผ่านเบราว์เซอร์ Chrome / Samsung Internet:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center mb-2">1</div>
                    <span className="material-symbols-outlined text-2xl text-slate-700 mb-1">more_vert</span>
                    <div className="font-bold text-slate-800 text-xs">แตะจุดสามจุด (⋮)</div>
                    <div className="text-[11px] text-slate-500 mt-1">ที่มุมขวาบนของ Google Chrome หรือเมนูด้านล่าง</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center mb-2">2</div>
                    <span className="material-symbols-outlined text-2xl text-emerald-600 mb-1">add_to_home_screen</span>
                    <div className="font-bold text-slate-800 text-xs">เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"</div>
                    <div className="text-[11px] text-slate-500 mt-1">Install app / Add to Home screen</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center mb-2">3</div>
                    <span className="material-symbols-outlined text-2xl text-blue-600 mb-1">touch_app</span>
                    <div className="font-bold text-slate-800 text-xs">กด "ติดตั้ง (Install)"</div>
                    <div className="text-[11px] text-slate-500 mt-1">ไอคอนจะปรากฏบน App Drawer และหน้าจอหลักทันที</div>
                  </div>
                </div>
              </div>

              {/* App Features on Android */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>ฟีเจอร์เด่นบนมือถือ Android:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">✓ เปิดใช้งานแบบไร้ขอบ (Fullscreen)</div>
                  <div className="flex items-center gap-1.5">✓ สแกน QR โค้ดผ่านกล้องทันที</div>
                  <div className="flex items-center gap-1.5">✓ กดค้างไอคอนมี App Shortcuts</div>
                  <div className="flex items-center gap-1.5">✓ ทำงานแบบ Offline แคชข้อมูลในเครื่อง</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IOS (IPHONE & IPAD) */}
          {activeTab === 'ios' && (
            <div className="space-y-4 animate-fade-in">
              {/* App Icon Home Screen Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c172e] to-[#12234e] text-white border border-slate-800 flex items-center gap-4 shadow-md">
                <div className="relative shrink-0">
                  <img
                    src="/icons/apple-touch-icon.png"
                    alt="School Nexus App Icon"
                    className="w-16 h-16 rounded-[18px] shadow-xl border border-white/20 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-slate-950 font-bold">check</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-sm text-white">School Nexus</h5>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[10px] font-bold">PWA App</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">ไอคอนโลโก้หลักอย่างเป็นทางการบนหน้าจอ Home Screen ของคุณ</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                  <span className="material-symbols-outlined text-xl">ios_share</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-950 text-sm">วิธีติดตั้งบน iPhone และ iPad (iOS)</h4>
                  <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                    Apple iOS รองรับการติดตั้ง Web App โดยตรงผ่าน <strong>Safari</strong> ไม่ต้องโหลดผ่าน App Store ให้ยุ่งยาก ใช้งานได้ลื่นไหลเหมือนแอปทางการ
                  </p>
                </div>
              </div>

              {/* Visual 3-Step Guide for iOS */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">touch_app</span>
                  <span>3 ขั้นตอนง่ายๆ ในการเพิ่มลงหน้าจอ iPhone:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center mb-2">1</div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
                      <span className="material-symbols-outlined text-2xl">ios_share</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">แตะปุ่ม "แชร์ (Share)"</div>
                    <div className="text-[11px] text-slate-500 mt-1">ที่แถบด้านล่างของหน้าจอ Safari (สัญลักษณ์กล่องพร้อมลูกศรชี้ขึ้น)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center mb-2">2</div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2">
                      <span className="material-symbols-outlined text-2xl">add_box</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">เลือก "เพิ่มไปยังหน้าจอโฮม"</div>
                    <div className="text-[11px] text-slate-500 mt-1">เลื่อนเมนูลงมาแล้วแตะ <strong>"Add to Home Screen"</strong></div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center mb-2">3</div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
                      <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">กด "เพิ่ม (Add)" ที่มุมขวาบน</div>
                    <div className="text-[11px] text-slate-500 mt-1">แอป School Nexus จะไปอยู่บนหน้าจอโฮมพร้อมใช้งานทันที!</div>
                  </div>
                </div>
              </div>

              {/* iOS Tips */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-700">lightbulb</span>
                  <span>ข้อแนะนำสำหรับผู้ใช้ iPhone:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  หากเปิดจากแอปอื่น (เช่น LINE หรือ Facebook) แนะนำให้กดปุ่ม "เปิดด้วย Safari (Open in Safari)" ก่อนดำเนินการ เพื่อให้สามารถเพิ่มลงหน้าจอโฮมได้สมบูรณ์
                </p>
              </div>
            </div>
          )}

          {/* TAB: GITHUB & GITHUB PAGES PWA */}
          {activeTab === 'github' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
                  <span className="material-symbols-outlined text-xl">deployed_code</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-purple-950 text-sm">ดาวน์โหลด / เพิ่มไว้ในหน้าจอโฮมจาก GitHub Pages</h4>
                  <p className="text-xs text-purple-800 mt-0.5 leading-relaxed">
                    เมื่อคุณโคลนโปรเจกต์นี้ไปยัง <strong>GitHub</strong> หรือเปิดผ่านลิงก์ <strong>GitHub Pages</strong> คุณสามารถติดตั้งเป็นเว็บแอปบนหน้าจอหลักได้ทันทีโดยไม่ต้องโหลดไฟล์ APK
                  </p>
                </div>
              </div>

              {/* Direct Link Share & Open */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">URL หน้าเว็บปัจจุบันที่พร้อมเพิ่มลงหน้าจอโฮม:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.href : '', 'gh_url')}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedCmd === 'gh_url' ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCmd === 'gh_url' ? 'คัดลอก URL แล้ว' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800 font-mono text-xs text-purple-300 break-all border border-slate-700">
                  {typeof window !== 'undefined' ? window.location.href : 'https://github.com/...'}
                </div>
              </div>

              {/* Steps to Install from GitHub */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">add_to_home_screen</span>
                  <span>วิธีเพิ่มเว็บแอปจาก GitHub เข้าหน้าจอโฮมมือถือ:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600">android</span>
                      <span className="font-bold text-xs text-slate-800">บนมือถือ Android (Chrome / Brave)</span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                      <li>เปิดลิงก์ GitHub Pages บนเบราว์เซอร์ <strong>Chrome</strong></li>
                      <li>กดเมนู <strong>จุดสามจุด (⋮)</strong> ที่มุมขวาบน</li>
                      <li>เลือก <strong>"ติดตั้งแอป (Install app)"</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก"</strong></li>
                      <li>แอปจะติดตั้งเป็นไอคอน School Nexus บนหน้าจอมือถือทันที</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600">phone_iphone</span>
                      <span className="font-bold text-xs text-slate-800">บน iPhone / iPad (Safari)</span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                      <li>เปิดลิงก์ GitHub Pages บนเบราว์เซอร์ <strong>Safari</strong></li>
                      <li>กดปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเมนูด้านล่าง</li>
                      <li>เลื่อนลงแล้วแตะ <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong></li>
                      <li>กด <strong>"เพิ่ม (Add)"</strong> เพื่อวางไอคอนบนหน้าจอโฮม</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* GitHub Pages Deploy Instructions */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">คำสั่ง Deploy ขึ้น GitHub Pages ฟรี (1 นาที):</div>
                <div className="bg-slate-900 rounded-xl p-3 text-slate-200 text-xs font-mono relative overflow-x-auto">
                  <div className="text-slate-400 mb-1"># คอมไพล์โปรเจกต์และนำโฟลเดอร์ dist ไปขึ้น GitHub Pages</div>
                  <div>npm run build</div>
                  <div>npx gh-pages -d dist</div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run build && npx gh-pages -d dist', 'gh_deploy')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedCmd === 'gh_deploy' ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCmd === 'gh_deploy' ? 'คัดลอกแล้ว' : 'คัดลอกคำสั่ง'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NATIVE APK / IPA BUILD (CAPACITOR) */}
          {activeTab === 'native' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <span className="material-symbols-outlined text-xl">terminal</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-indigo-950 text-sm">การคอมไพล์เป็น Native App (.APK / .AAB / .IPA)</h4>
                  <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                    โปรเจกต์นี้ตั้งค่า <code>capacitor.config.json</code> ไว้พร้อมแล้ว สามารถนำไปคอมไพล์ผ่าน Android Studio หรือ Xcode เพื่อเผยแพร่ลง Play Store และ App Store ได้ทันที
                  </p>
                </div>
              </div>

              {/* Commands Guide */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">ขั้นตอนการ Build ฝั่ง Android (สร้างไฟล์ .APK):</div>
                <div className="bg-slate-900 rounded-xl p-3 text-slate-200 text-xs font-mono relative overflow-x-auto">
                  <div className="text-slate-400 mb-1"># 1. ติดตั้ง Capacitor & Build Web App</div>
                  <div>npm install @capacitor/core @capacitor/cli @capacitor/android</div>
                  <div>npm run build</div>
                  <div className="text-slate-400 my-1"># 2. สร้างโฟลเดอร์ Android และเปิดใน Android Studio</div>
                  <div>npx cap add android</div>
                  <div>npx cap sync</div>
                  <div>npx cap open android</div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run build && npx cap sync && npx cap open android', 'android_cmd')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedCmd === 'android_cmd' ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCmd === 'android_cmd' ? 'คัดลอกแล้ว' : 'คัดลอกคำสั่ง'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">ขั้นตอนการ Build ฝั่ง iOS (สร้างไฟล์ .IPA / Xcode):</div>
                <div className="bg-slate-900 rounded-xl p-3 text-slate-200 text-xs font-mono relative overflow-x-auto">
                  <div className="text-slate-400 mb-1"># 1. ติดตั้ง iOS Platform</div>
                  <div>npm install @capacitor/ios</div>
                  <div>npx cap add ios</div>
                  <div>npx cap sync</div>
                  <div className="text-slate-400 my-1"># 2. เปิดโปรเจกต์ใน Xcode (บนเครื่อง macOS)</div>
                  <div>npx cap open ios</div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run build && npx cap sync && npx cap open ios', 'ios_cmd')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedCmd === 'ios_cmd' ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCmd === 'ios_cmd' ? 'คัดลอกแล้ว' : 'คัดลอกคำสั่ง'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Package ID: </span>
                  <code className="bg-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-mono">com.schoolnexus.app</code>
                </div>
                <div className="text-[11px] text-slate-500">พร้อมสำหรับ Google Play & App Store</div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFLINE & PUSH NOTIFICATIONS */}
          {activeTab === 'offline' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-600/20">
                  <span className="material-symbols-outlined text-xl">wifi_off</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-950 text-sm">การทำงานแบบออฟไลน์ (Offline Mode)</h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    มี <strong>Service Worker</strong> ฝังอยู่ในตัว ทำให้เมื่อไม่มีสัญญาณอินเทอร์เน็ต สามารถเปิดดูบัตรนักเรียน Digital ID, ตารางเรียน และข้อมูลที่แคชไว้ได้ตลอดเวลา
                  </p>
                </div>
              </div>

              {/* Push Notification Setup */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-2xl text-blue-600">notifications_active</span>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">การแจ้งเตือนบนมือถือ (Push Notifications)</div>
                      <div className="text-[11px] text-slate-500">แจ้งเตือนคาบเรียน, การเช็คชื่อ, และประกาศด่วน</div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      notificationStatus === 'granted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : notificationStatus === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {notificationStatus === 'granted'
                      ? 'เปิดแล้ว (Active)'
                      : notificationStatus === 'denied'
                      ? 'ถูกปฏิเสธ'
                      : 'ยังไม่ได้เปิด'}
                  </span>
                </div>

                {notificationStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestNotifications}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">notifications</span>
                    <span>อนุญาตการแจ้งเตือนบนอุปกรณ์นี้</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1">cached</span>
                  <div className="font-bold text-xs text-slate-800">Cache Storage</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">แคชไอคอนและหน้าเว็บอัตโนมัติ</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="material-symbols-outlined text-blue-600 text-2xl mb-1">qr_code</span>
                  <div className="font-bold text-xs text-slate-800">Offline Digital ID</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">เปิดแสดงบัตร QR ได้แม้ออฟไลน์</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
            <span>ปลอดภัย มาตรฐาน PWA & Progressive Web App</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
