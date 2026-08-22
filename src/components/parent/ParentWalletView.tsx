import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { pushRealtimeNotification } from '../../services/firebaseService';

interface ParentWalletViewProps {
  user: UserProfile;
}

interface Transaction {
  id: string;
  title: string;
  location: string;
  amount: number;
  type: 'expense' | 'topup';
  time: string;
  date: string;
  category: 'food' | 'drink' | 'stationary' | 'topup';
  refId?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    title: 'ข้าวราดแกง 2 อย่าง',
    location: 'โรงอาหารกลาง (ร้านป้าพร)',
    amount: 45,
    type: 'expense',
    time: '12:15 น.',
    date: 'วันนี้ 17 ส.ค.',
    category: 'food',
  },
  {
    id: 'tx-2',
    title: 'นมสดเย็น & ขนมปังเนยสด',
    location: 'สหกรณ์โรงเรียน',
    amount: 30,
    type: 'expense',
    time: '07:50 น.',
    date: 'วันนี้ 17 ส.ค.',
    category: 'drink',
  },
  {
    id: 'tx-3',
    title: 'ก๋วยเตี๋ยวต้มยำพิเศษ',
    location: 'โรงอาหารกลาง (ร้านเตี๋ยวโบราณ)',
    amount: 50,
    type: 'expense',
    time: '12:20 น.',
    date: '14 ส.ค. 2026',
    category: 'food',
  },
  {
    id: 'tx-4',
    title: 'เติมเงินผ่าน PromptPay QR',
    location: 'Mobile Banking (นายสมบัติ เพ็ชรราย)',
    amount: 300,
    type: 'topup',
    time: '08:00 น.',
    date: '14 ส.ค. 2026',
    category: 'topup',
    refId: 'PP-20260814-9921',
  },
  {
    id: 'tx-5',
    title: 'สมุดกราฟ & ปากกาลบได้',
    location: 'ร้านค้าเครื่องเขียนสหกรณ์',
    amount: 55,
    type: 'expense',
    time: '15:40 น.',
    date: '13 ส.ค. 2026',
    category: 'stationary',
  },
];

export const ParentWalletView: React.FC<ParentWalletViewProps> = ({ user }) => {
  const [balance, setBalance] = useState<number>(420);
  const [dailyLimit, setDailyLimit] = useState<number>(150);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  
  // Topup Modal States
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupStep, setTopupStep] = useState<'amount' | 'qr' | 'success'>('amount');
  const [topupAmount, setTopupAmount] = useState<number>(200);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [downloadedQr, setDownloadedQr] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes in seconds
  const [latestRefId, setLatestRefId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Countdown timer for active QR code
  useEffect(() => {
    let timer: any;
    if (showTopupModal && topupStep === 'qr' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showTopupModal, topupStep, countdown]);

  useEffect(() => {
    const handleReset = () => {
      setBalance(420);
      setDailyLimit(150);
      setTransactions(INITIAL_TRANSACTIONS);
    };
    window.addEventListener('sn_system_full_reset', handleReset);
    return () => {
      window.removeEventListener('sn_system_full_reset', handleReset);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenTopup = () => {
    setTopupStep('amount');
    setTopupAmount(200);
    setIsCustom(false);
    setCustomAmount('');
    setCountdown(300);
    setShowTopupModal(true);
  };

  const handleSelectPreset = (amt: number) => {
    setIsCustom(false);
    setTopupAmount(amt);
  };

  const handleCustomAmountChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    setCustomAmount(numeric);
    setIsCustom(true);
    if (numeric) {
      setTopupAmount(Number(numeric));
    }
  };

  const handleProceedToQr = () => {
    const finalAmt = isCustom ? Number(customAmount) || 0 : topupAmount;
    if (finalAmt <= 0) {
      showToast('กรุณาระบุจำนวนเงินที่ต้องการเติม');
      return;
    }
    if (finalAmt < 20) {
      showToast('ยอดเติมเงินขั้นต่ำ 20 บาท');
      return;
    }
    if (finalAmt > 5000) {
      showToast('ยอดเติมเงินสูงสุดไม่เกิน 5,000 บาทต่อครั้ง');
      return;
    }
    setTopupAmount(finalAmt);
    const newRef = `PP-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLatestRefId(newRef);
    setCountdown(300);
    setTopupStep('qr');
  };

  // Simulate payment confirmation
  const handleConfirmPaid = () => {
    setIsCheckingPayment(true);
    setTimeout(async () => {
      setIsCheckingPayment(false);
      setBalance((prev) => prev + topupAmount);
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        title: 'เติมเงินเข้าบัตรผ่าน PromptPay QR',
        location: 'Mobile Banking (ผู้ปกครอง)',
        amount: topupAmount,
        type: 'topup',
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        date: 'วันนี้',
        category: 'topup',
        refId: latestRefId,
      };
      setTransactions([newTx, ...transactions]);
      setTopupStep('success');
      showToast(`เติมเงิน ฿${topupAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} เข้าบัตรเรียบร้อยแล้ว!`);

      // Push real-time notification to STUDENT
      await pushRealtimeNotification({
        title: '💳 ได้รับเงินเติมเข้ากระเป๋าบัตรนักเรียน',
        message: `ผู้ปกครองเติมเงินเข้าบัตร Smart Digital ID จำนวน ฿${topupAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} สำเร็จ ยอดเงินพร้อมใช้ในโรงอาหารทันที`,
        type: 'payment',
        priority: 'high',
        role: 'student',
        icon: 'account_balance_wallet',
      });
    }, 1200);
  };

  const handleCopyRef = () => {
    const refText = `Biller ID: 0105566040217 | Ref1: 66040217 | Ref2: ${latestRefId} | จำนวนเงิน: ฿${topupAmount}`;
    navigator.clipboard?.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    showToast('คัดลอกข้อมูลชำระเงินเรียบร้อยแล้ว');
  };

  const handleDownloadQr = () => {
    setDownloadedQr(true);
    setTimeout(() => setDownloadedQr(false), 2500);
    showToast('บันทึกรูปภาพ QR Code ลงเครื่องแล้ว');
  };

  // Generate deterministic QR Code pattern based on amount and ref ID
  const generatePromptPayQr = () => {
    const size = 25;
    const matrix: boolean[][] = Array(size)
      .fill(false)
      .map(() => Array(size).fill(false));

    let seed = topupAmount * 17;
    for (let i = 0; i < latestRefId.length; i++) {
      seed = (seed * 31 + latestRefId.charCodeAt(i)) % 100000;
    }

    // Corner Finder Patterns
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[startY + r][startX + c] = true;
          } else {
            matrix[startY + r][startX + c] = false;
          }
        }
      }
    };

    drawFinder(0, 0); // Top-left
    drawFinder(size - 7, 0); // Top-right
    drawFinder(0, size - 7); // Bottom-left

    // Timing lines
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Fill data
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8) ||
          (r === 6 || c === 6)
        ) {
          continue;
        }

        // Leave center 5x5 for PromptPay Logo
        const center = Math.floor(size / 2);
        if (Math.abs(r - center) <= 2 && Math.abs(c - center) <= 2) {
          matrix[r][c] = false;
          continue;
        }

        const pseudo = Math.sin(seed + r * 19 + c * 43) * 10000;
        matrix[r][c] = pseudo - Math.floor(pseudo) > 0.47;
      }
    }

    return { size, matrix };
  };

  const { size: qrMatrixSize, matrix: qrMatrix } = generatePromptPayQr();

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideDown">
          <span className="material-symbols-outlined text-[#20C997] text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1550d3]/10 text-[#1550d3] text-xs font-bold">
                Smart Canteen & Wallet
              </span>
              <span className="text-xs text-[#737686]">บัตรสมาร์ทการ์ด: วรวุฒิ เพ็ชรราย (ม.6/1)</span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              กระเป๋าเงินดิจิทัล & ค่าอาหารโรงเรียน
            </h1>
            <p className="text-[#434654] text-[15px]">
              ตรวจสอบยอดเงินคงเหลือในบัตรนักเรียน ประวัติการซื้ออาหาร และเติมเงินออนไลน์ผ่าน PromptPay QR
            </p>
          </div>

          <button
            onClick={handleOpenTopup}
            className="px-4 py-2.5 rounded-xl bg-[#00694d] hover:bg-[#00523b] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            <span>เติมเงินผ่าน QR Code</span>
          </button>
        </div>

        {/* Digital Card & Spending Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Mockup */}
          <div className="md:col-span-2 bg-gradient-to-r from-[#121b2e] via-[#1a233a] to-[#27324c] rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-xs text-white/70 block tracking-wide uppercase">SCHOOL NEXUS SMART PASS</span>
                <h3 className="font-bold text-lg text-white mt-0.5">วรวุฒิ เพ็ชรราย (ม.6/1)</h3>
                <span className="text-xs text-blue-300 font-mono">ID: 66040217 • NFC-SN-8849</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-bold tracking-wider uppercase border border-white/20">
                  CANTEEN PAY
                </span>
              </div>
            </div>

            <div className="my-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs text-white/70 block">ยอดเงินคงเหลือในบัตร (Card Balance)</span>
                <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[#67fcc6] mt-1">
                  ฿{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleOpenTopup}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#121b2e] text-xs font-bold shadow-md hover:bg-slate-100 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">qr_code_scanner</span>
                  <span>สแกน QR เติมเงิน</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-white/80 border-t border-white/10 pt-3">
              <span>ใช้จ่ายวันนี้: <strong>฿75.00</strong> (เหลือโควตาวันนี้: ฿{Math.max(0, dailyLimit - 75)})</span>
              <span className="text-[#67fcc6] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
                พร้อมใช้งานแตะจ่าย
              </span>
            </div>
          </div>

          {/* Daily Limit Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#737686] uppercase tracking-wider">การควบคุมความปลอดภัย</span>
              <h4 className="font-bold text-[#121b2e] text-base">จำกัดวงเงินใช้จ่ายต่อวัน</h4>
              <p className="text-xs text-slate-500">
                ตั้งค่าเพื่อช่วยให้นักเรียนบริหารค่าใช้จ่ายในแต่ละวันอย่างเหมาะสม
              </p>

              <div className="mt-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-semibold text-[#121b2e] mb-2">
                  <span>วงเงินสูงสุดต่อวัน</span>
                  <span className="font-mono text-[#1550d3] text-sm">฿{dailyLimit}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full accent-[#1550d3] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>฿50</span>
                  <span>฿150</span>
                  <span>฿300</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast(`บันทึกวงเงินจำกัดต่อวัน ฿${dailyLimit} เรียบร้อยแล้ว`)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              บันทึกการตั้งค่าวงเงิน
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#121b2e]">ประวัติการใช้จ่าย & เติมเงิน</h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                {transactions.length} รายการ
              </span>
            </div>
            <span className="text-xs text-slate-500">บันทึกอัตโนมัติจากระบบ NFC Smart Canteen</span>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'topup' ? 'bg-emerald-50 text-[#00694d]' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {tx.type === 'topup'
                        ? 'qr_code_2'
                        : tx.category === 'food'
                        ? 'restaurant'
                        : tx.category === 'drink'
                        ? 'local_cafe'
                        : 'edit_note'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-[13px] text-[#121b2e] flex items-center gap-1.5">
                      <span>{tx.title}</span>
                      {tx.refId && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-[#1550d3] font-mono">
                          {tx.refId}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tx.location} • <span className="font-mono">{tx.time} ({tx.date})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold font-mono text-[14px] ${
                      tx.type === 'topup' ? 'text-[#00694d]' : 'text-[#121b2e]'
                    }`}
                  >
                    {tx.type === 'topup' ? `+฿${tx.amount.toFixed(2)}` : `-฿${tx.amount.toFixed(2)}`}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">สำเร็จ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topup Modal with Full PromptPay QR Code Flow */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-scaleUp my-auto">
            
            {/* Modal Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00694d] text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <span className="material-symbols-outlined text-[20px]">
                    {topupStep === 'success' ? 'check_circle' : 'account_balance_wallet'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#121b2e]">
                    {topupStep === 'amount' && 'เลือกจำนวนเงินเติมเข้าบัตร'}
                    {topupStep === 'qr' && 'สแกน QR Code ชำระเงิน'}
                    {topupStep === 'success' && 'เติมเงินสำเร็จเรียบร้อย'}
                  </h3>
                  <p className="text-[11px] text-[#737686]">
                    {topupStep === 'amount' && 'Smart Canteen Card Top-up'}
                    {topupStep === 'qr' && 'Thai QR Payment / PromptPay'}
                    {topupStep === 'success' && 'Transaction Completed'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTopupModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Select Amount */}
            {topupStep === 'amount' && (
              <div className="p-5 sm:p-6 flex flex-col gap-4">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1550d3]/10 text-[#1550d3] flex items-center justify-center font-bold text-base shrink-0">
                    <span className="material-symbols-outlined text-[22px]">credit_card</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-slate-500 block">เติมเงินเข้าบัตรนักเรียน</span>
                    <span className="font-bold text-xs sm:text-sm text-[#121b2e] block truncate">
                      วรวุฒิ เพ็ชรราย (ม.6/1)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ยอดเงินปัจจุบัน: ฿{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    เลือกจำนวนเงิน (บาท):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 150, 200, 300, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`py-3 rounded-2xl border font-mono font-bold text-sm transition-all cursor-pointer flex flex-col items-center justify-center ${
                          !isCustom && topupAmount === amt
                            ? 'border-[#00694d] bg-[#00694d]/10 text-[#00694d] ring-2 ring-[#00694d]/30 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>฿{amt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    หรือระบุจำนวนเงินเอง:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ฿
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="เช่น 250 (ขั้นต่ำ 20 บาท)"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-mono font-semibold transition-all focus:outline-none ${
                        isCustom
                          ? 'border-[#00694d] bg-white ring-2 ring-[#00694d]/20 text-[#00694d]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:border-[#00694d]'
                      }`}
                    />
                  </div>
                </div>

                {/* Payment Channel Indicator */}
                <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#113566] text-white flex items-center justify-center font-bold text-[10px] tracking-tighter">
                      PROMPT<br/>PAY
                    </div>
                    <div>
                      <span className="font-bold text-[#121b2e] block">พร้อมเพย์ QR Code</span>
                      <span className="text-[10px] text-slate-500">สแกนจ่ายได้ทุกแอปธนาคาร ฟรีค่าธรรมเนียม</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    อัตโนมัติ
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTopupModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToQr}
                    className="flex-1 py-2.5 rounded-xl bg-[#00694d] hover:bg-[#00523b] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <span>สร้าง QR Code ฿{isCustom ? Number(customAmount || 0) : topupAmount}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PromptPay QR Code Display */}
            {topupStep === 'qr' && (
              <div className="p-5 sm:p-6 flex flex-col items-center gap-4">
                
                {/* Official-looking Thai QR Payment Card */}
                <div
                  id="promptpay-qr-card"
                  className="w-full bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#113566]/20 shadow-xl flex flex-col items-center relative overflow-hidden"
                >
                  {/* Thai QR Top Banner */}
                  <div className="w-full bg-[#113566] -mt-5 -mx-5 px-5 py-2.5 mb-3 rounded-t-2xl flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-white p-0.5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#113566] text-[16px]">qr_code_2</span>
                      </div>
                      <span className="font-bold text-xs tracking-wider">Thai QR Payment</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded tracking-widest uppercase">
                      PROMPTPAY
                    </span>
                  </div>

                  {/* Biller Info */}
                  <div className="text-center mb-2">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wide">
                      โรงเรียน สคูลเน็กซัส (School Nexus Canteen)
                    </span>
                    <span className="text-xs text-slate-700 font-semibold">
                      เพื่อ: บัตรนักเรียน วรวุฒิ เพ็ชรราย (ม.6/1)
                    </span>
                  </div>

                  {/* Dynamic SVG QR Code with PromptPay Branding */}
                  <div className="relative p-3 bg-white rounded-2xl shadow-inner border border-slate-200/80 flex items-center justify-center my-1">
                    <svg
                      viewBox={`0 0 ${qrMatrixSize} ${qrMatrixSize}`}
                      className="w-48 h-48 sm:w-52 sm:h-52"
                      shapeRendering="crispEdges"
                    >
                      {/* Background */}
                      <rect width={qrMatrixSize} height={qrMatrixSize} fill="#ffffff" />

                      {/* QR Grid Modules */}
                      {qrMatrix.map((row, r) =>
                        row.map((filled, c) => {
                          if (!filled) return null;
                          return (
                            <rect
                              key={`${r}-${c}`}
                              x={c}
                              y={r}
                              width={1.0}
                              height={1.0}
                              fill="#113566"
                              rx={0.2}
                            />
                          );
                        })
                      )}

                      {/* Center PromptPay Shield / Logo */}
                      <g transform={`translate(${Math.floor(qrMatrixSize / 2) - 2}, ${Math.floor(qrMatrixSize / 2) - 2})`}>
                        <rect
                          x="0"
                          y="0"
                          width="4"
                          height="4"
                          rx="0.8"
                          fill="#113566"
                          stroke="#ffffff"
                          strokeWidth="0.4"
                        />
                        <circle cx="2" cy="2" r="1.1" fill="#ffffff" />
                        <circle cx="2" cy="2" r="0.6" fill="#00694d" />
                      </g>
                    </svg>

                    {/* Corner accents */}
                    <div className="absolute inset-2 border border-blue-600/20 pointer-events-none rounded-xl" />
                  </div>

                  {/* Amount Display */}
                  <div className="mt-3 text-center">
                    <span className="text-[11px] text-slate-500 block">ยอดเงินชำระ</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#00694d]">
                      ฿{topupAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Ref Details */}
                  <div className="w-full mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex flex-col gap-0.5 text-center font-mono">
                    <div>Biller ID: 0105566040217 • Ref 1: 66040217</div>
                    <div>Ref 2: {latestRefId}</div>
                  </div>
                </div>

                {/* Countdown & Helper Banner */}
                <div className="w-full flex items-center justify-between px-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">timer</span>
                    <span>QR หมดอายุใน: <strong className="font-mono text-red-600">{formatCountdown(countdown)}</strong></span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    รอการชำระเงิน
                  </span>
                </div>

                {/* QR Utilities (Save QR / Copy Ref) */}
                <div className="w-full grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {downloadedQr ? 'done' : 'save_alt'}
                    </span>
                    <span>{downloadedQr ? 'บันทึกแล้ว!' : 'บันทึกรูป QR'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedRef ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedRef ? 'คัดลอกแล้ว!' : 'คัดลอกเลขบัญชี'}</span>
                  </button>
                </div>

                <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-center">
                  💡 เปิดแอปธนาคาร (K PLUS, SCB EASY, Krungthai NEXT ฯลฯ) แล้วเลือก <strong>"สแกนจ่าย"</strong> หรือดึงรูป QR จากคลังภาพ
                </div>

                {/* Confirm Pay Button (Simulate Payment Gateway Confirmation) */}
                <div className="w-full flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isCheckingPayment}
                    onClick={handleConfirmPaid}
                    className="w-full py-3 rounded-2xl bg-[#00694d] hover:bg-[#00523b] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-75"
                  >
                    {isCheckingPayment ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังตรวจสอบสถานะการชำระเงินกับธนาคาร...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>ยืนยันว่าชำระเงินแล้ว / ตรวจสถานะ</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTopupStep('amount')}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer text-center"
                  >
                    ← เปลี่ยนจำนวนเงิน หรือยกเลิก
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Success / Receipt */}
            {topupStep === 'success' && (
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00694d] flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-[#121b2e]">เติมเงินเข้าบัตรสำเร็จ!</h4>
                  <p className="text-xs text-slate-500 mt-0.5">ระบบได้ปรับยอดเงินในบัตรสมาร์ทการ์ดเรียบร้อยแล้ว</p>
                </div>

                {/* Slip Details Card */}
                <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex flex-col gap-2 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">ยอดเงินที่เติม:</span>
                    <span className="font-bold font-mono text-base text-[#00694d]">
                      +฿{topupAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>ยอดเงินคงเหลือใหม่:</span>
                    <span className="font-bold font-mono text-[#121b2e]">
                      ฿{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>ผู้รับ:</span>
                    <span className="font-semibold text-slate-800">วรวุฒิ เพ็ชรราย (ม.6/1)</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>ช่องทางชำระเงิน:</span>
                    <span className="text-slate-800">PromptPay QR Payment</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>รหัสอ้างอิง (Ref ID):</span>
                    <span className="font-mono text-slate-700">{latestRefId}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>เวลาทำรายการ:</span>
                    <span className="font-mono text-slate-700">
                      {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="w-full mt-2 py-3 rounded-2xl bg-[#121b2e] hover:bg-[#1a253d] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all"
                >
                  เสร็จสิ้น
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

