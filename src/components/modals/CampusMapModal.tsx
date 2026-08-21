import React, { useState } from 'react';
import { MOCK_FACILITIES } from '../../data/mockData';
import { Facility } from '../../types';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFacility: (facility: Facility) => void;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  onSelectFacility,
}) => {
  const [selectedPin, setSelectedPin] = useState<Facility | null>(MOCK_FACILITIES[2]);
  const [activeFloor, setActiveFloor] = useState<number>(4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#f9f9ff] border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1550d3] text-2xl">map</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#121b2e]">
                แผนผังแคมปัสดิจิทัล (Campus Interactive Map)
              </h2>
              <p className="text-xs text-[#434654]">
                ระบบนำทางอาคารและตรวจสอบสถานะห้องแบบ Real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Blueprint Map Canvas */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Floor Switcher */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1.5 bg-[#e1e8ff] p-1 rounded-xl text-xs font-semibold">
              {[1, 2, 3, 4, 5].map((fl) => (
                <button
                  key={fl}
                  onClick={() => setActiveFloor(fl)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeFloor === fl
                      ? 'bg-[#1550d3] text-white shadow-xs'
                      : 'text-[#434654] hover:bg-white/50'
                  }`}
                >
                  ชั้น {fl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#00694d] font-semibold bg-[#20C997]/15 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
              <span>GPS Indoor Sync: Active</span>
            </div>
          </div>

          {/* Interactive SVG / Blueprint Map */}
          <div className="relative w-full aspect-video bg-[#121b2e] rounded-2xl p-4 overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
            {/* Grid Lines */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #3c6bed 1px, transparent 1px), linear-gradient(to bottom, #3c6bed 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Simulated Building Blueprint Blocks */}
            <div className="relative w-full h-full max-w-lg border border-cyan-500/40 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex justify-between text-[11px] text-cyan-400 font-mono">
                <span>SECTOR 4-NORTH [ACADEMIC WING]</span>
                <span>LEVEL {activeFloor} BLUEPRINT</span>
              </div>

              {/* Rooms Layout */}
              <div className="grid grid-cols-3 gap-2 my-auto">
                <button
                  onClick={() => setSelectedPin(MOCK_FACILITIES[2])}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPin?.id === MOCK_FACILITIES[2].id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 font-mono">ROOM 402</div>
                  <div className="text-xs font-bold">CS Lab (Lab 402)</div>
                  <div className="text-[10px] text-[#20C997] mt-1">● Active Class</div>
                </button>

                <button
                  onClick={() => setSelectedPin(MOCK_FACILITIES[1])}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPin?.id === MOCK_FACILITIES[1].id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 font-mono">ROOM 404</div>
                  <div className="text-xs font-bold">Science Lab</div>
                  <div className="text-[10px] text-[#20C997] mt-1">● Available</div>
                </button>

                <button
                  onClick={() => setSelectedPin(MOCK_FACILITIES[4])}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPin?.id === MOCK_FACILITIES[4].id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 font-mono">STUDIO A</div>
                  <div className="text-xs font-bold">Creative Design</div>
                  <div className="text-[10px] text-[#20C997] mt-1">● Open</div>
                </button>
              </div>

              {/* Corridor & Path */}
              <div className="h-6 bg-cyan-950/60 border-y border-dashed border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-400/80 font-mono tracking-widest">
                ◄ CENTRAL CONNECTING CORRIDOR ►
              </div>
            </div>
          </div>

          {/* Selected Pin Details Box */}
          {selectedPin && (
            <div className="p-4 bg-[#f1f3ff] rounded-2xl border border-blue-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-[#121b2e]">{selectedPin.name}</h4>
                <p className="text-xs text-[#434654]">{selectedPin.category}</p>
                <div className="text-xs text-[#00694d] font-semibold mt-0.5">
                  สถานะ: {selectedPin.statusLabel} • อุณหภูมิ: {selectedPin.temperature || '22°C'}
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onSelectFacility(selectedPin);
                }}
                className="px-4 py-2 bg-[#1550d3] text-white text-xs font-bold rounded-xl hover:bg-[#1a53d6] transition-colors cursor-pointer"
              >
                ดูรายละเอียดห้อง
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
