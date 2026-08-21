import React, { useState } from 'react';
import { MOCK_COURSES, MOCK_FACILITIES, MOCK_ASSIGNMENTS } from '../../data/mockData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, item?: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredCourses = MOCK_COURSES.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.thaiTitle.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFacilities = MOCK_FACILITIES.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAssignments = MOCK_ASSIGNMENTS.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subject.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-16 sm:pt-20 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh] animate-scaleIn">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#1550d3] text-2xl">search</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารายวิชา, ห้องเรียน, การบ้าน, หรืออาจารย์..."
            className="flex-1 text-base text-[#121b2e] placeholder:text-[#737686] outline-none"
          />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-xs"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* Courses */}
          {filteredCourses.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block mb-2">
                รายวิชา ({filteredCourses.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onNavigate('learning', c);
                    }}
                    className="p-3 rounded-xl hover:bg-[#f1f3ff] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1550d3]">{c.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-[#121b2e]">{c.thaiTitle}</div>
                        <div className="text-xs text-[#737686]">{c.code} • {c.instructor}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#1550d3]">{c.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          {filteredAssignments.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block mb-2">
                ภาระงาน & การบ้าน ({filteredAssignments.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {filteredAssignments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onClose();
                      onNavigate('assignments', a);
                    }}
                    className="p-3 rounded-xl hover:bg-[#f1f3ff] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-purple-600">assignment</span>
                      <div>
                        <div className="font-bold text-sm text-[#121b2e]">{a.title}</div>
                        <div className="text-xs text-[#737686]">{a.subject} • {a.dueRelative}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-600">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facilities */}
          {filteredFacilities.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block mb-2">
                สถานที่ & อาคาร ({filteredFacilities.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {filteredFacilities.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onClose();
                      onNavigate('campus', f);
                    }}
                    className="p-3 rounded-xl hover:bg-[#f1f3ff] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#00694d]">{f.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-[#121b2e]">{f.name}</div>
                        <div className="text-xs text-[#737686]">{f.category}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#00694d]">{f.statusLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
