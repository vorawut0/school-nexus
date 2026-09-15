import React, { useState } from 'react';
import { DigitalTwinNode } from '../../types';

interface NodeModalProps {
  node: DigitalTwinNode | null;
  onClose: () => void;
}

export const NodeModal: React.FC<NodeModalProps> = ({ node, onClose }) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  if (!node) return null;

  const handlePing = () => {
    setIsPinging(true);
    setPingResult(null);
    setTimeout(() => {
      setIsPinging(false);
      setPingResult('Ping 1.2ms • Packet Loss: 0% • Bandwidth: 1.0 Gbps Fiber');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#273044] text-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-700 flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-700/60 flex justify-between items-center bg-[#1e2538]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">{node.icon}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400">IoT SENSOR NODE</span>
              <h2 className="text-lg font-bold text-white">{node.code}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:bg-white/20 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-white/60 block">การใช้พลังงาน</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{node.power}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-white/60 block">อุณหภูมิเซนเซอร์</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{node.temp}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-white/60 block">อุปกรณ์ที่เชื่อมต่อ</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{node.devices} เครื่อง</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-white/60 block">สถานะการทำงาน</span>
              <span className="text-sm font-bold text-[#20C997] mt-0.5 block">{node.statusText}</span>
            </div>
          </div>

          {pingResult && (
            <div className="p-3 rounded-xl bg-[#20C997]/20 border border-[#20C997]/40 text-[#67fcc6] text-xs font-mono">
              {pingResult}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="flex-1 py-3 bg-[#1550d3] hover:bg-[#1a53d6] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sensors</span>
              <span>{isPinging ? 'กำลัง Ping...' : 'ทดสอบสัญญาณ (Live Ping)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
