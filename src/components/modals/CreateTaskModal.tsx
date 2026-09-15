import React, { useState } from 'react';
import { Assignment } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Assignment) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('วิทยาการคำนวณ');
  const [dueDate, setDueDate] = useState('ส่งภายใน: 3 วันข้างหน้า');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const subjectColors: Record<string, string> = {
    'วิทยาการคำนวณ': '#5f3add',
    'การออกแบบ': '#00694d',
    'คณิตศาสตร์': '#ba1a1a',
    'Multimedia': '#1550d3',
    'วิทยาศาสตร์': '#008562',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Assignment = {
      id: `task-${Date.now()}`,
      title,
      subject,
      subjectCode: 'CUSTOM-01',
      categoryColor: subjectColors[subject] || '#1550d3',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      dueRelative: dueDate,
      status: 'to_submit',
      progress: 0,
      maxScore: 100,
      currentScore: '- / 100',
      description: description || 'งานที่บันทึกไว้ในระบบ School Nexus',
      attachmentsCount: 0,
    };

    onCreateTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-scaleIn">
        <div className="p-5 sm:p-6 bg-[#f9f9ff] border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#121b2e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1550d3]">add_task</span>
            เพิ่มภาระงานใหม่
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-[#737686] uppercase tracking-wider block mb-1">
              ชื่องาน / ภารกิจ
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ทำรายงานสรุปโครงงานวิจัย AI"
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-[#1550d3] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#737686] uppercase tracking-wider block mb-1">
                รายวิชา
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-[#1550d3] focus:outline-none bg-white"
              >
                <option value="วิทยาการคำนวณ">วิทยาการคำนวณ</option>
                <option value="การออกแบบ">การออกแบบ</option>
                <option value="Multimedia">Multimedia</option>
                <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                <option value="วิทยาศาสตร์">วิทยาศาสตร์</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#737686] uppercase tracking-wider block mb-1">
                กำหนดส่ง
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="เช่น พรุ่งนี้ 18:00 น., วันศุกร์นี้"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-[#1550d3] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#737686] uppercase tracking-wider block mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุข้อกำหนด หรือเป้าหมายในการทำงาน..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-[#1550d3] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#1550d3] text-white font-semibold text-sm hover:bg-[#1a53d6]"
            >
              บันทึกงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
