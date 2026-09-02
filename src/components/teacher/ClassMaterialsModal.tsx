import React, { useState } from 'react';

export interface LessonPlanWeek {
  week: number;
  title: string;
  unit: string;
  hours: number;
  objectives: string[];
  activities: string;
  materials: string[];
  assessment: string;
  detailedPlan?: {
    kpaObjectives: {
      knowledge: string;
      process: string;
      attitude: string;
    };
    steps: {
      intro: string;
      teaching: string;
      conclusion: string;
    };
    rubricSummary: string;
  };
}

export interface MaterialItem {
  id: string;
  title: string;
  type: 'pdf' | 'slide' | 'lab' | 'video' | 'sheet';
  unit: string;
  fileSize?: string;
  updatedAt: string;
  downloadUrl?: string;
  previewPages?: string[];
  colabUrl?: string;
  videoDuration?: string;
  youtubeId?: string;
  description: string;
}

interface ClassMaterialsModalProps {
  classroom: {
    id: string;
    thaiGrade: string;
    subjectCode: string;
    subjectName: string;
    room: string;
    color: string;
  };
  onClose: () => void;
}

// Mock syllabus and lesson plans
const MOCK_LESSON_PLANS: Record<string, LessonPlanWeek[]> = {
  'cls-601-ai': [
    {
      week: 1,
      title: 'ปฐมนิเทศและการแนะนำวิวัฒนาการของปัญญาประดิษฐ์ (AI Evolution)',
      unit: 'หน่วยที่ 1: พื้นฐาน AI และสถาปัตยกรรมอัจฉริยะ',
      hours: 2,
      objectives: ['เข้าใจประวัติความเป็นมาและนิยามของ AI', 'จำแนกระหว่าง Narrow AI และ General AI ได้'],
      activities: 'บรรยายนำเข้าสู่บทเรียน อภิปรายกรณีศึกษา AI ในชีวิตประจำวัน (Tesla Autopilot, ChatGPT)',
      materials: ['สไลด์บทที่ 1: AI Overview.pptx', 'ใบความรู้ที่ 1.1 ประวัติศาสตร์ AI.pdf'],
      assessment: 'แบบทดสอบก่อนเรียน (Pre-test) และการตอบคำถามในชั้นเรียน',
      detailedPlan: {
        kpaObjectives: {
          knowledge: 'นักเรียนสามารถอธิบายความหมายและวิวัฒนาการของ AI ได้ถูกต้อง',
          process: 'นักเรียนสามารถวิเคราะห์และเปรียบเทียบการทำงานของ AI ในอุตสาหกรรมต่างๆ ได้',
          attitude: 'มีเจตคติที่ดีและเห็นความสำคัญของเทคโนโลยีปัญญาประดิษฐ์',
        },
        steps: {
          intro: 'ครูเปิดคลิปวิดีโอ Humanoid Robot และตั้งคำถามกระตุ้นความคิด 5 นาที',
          teaching: 'การบรรยายแบบ Interactive ผสมผสานการทำโพลสำรวจความคิดเห็นผ่านระบบ Nexus Live Poll',
          conclusion: 'สรุปประเด็นหลักและมอบหมายให้อ่านบทความเตรียมสำหรับสัปดาห์ถัดไป',
        },
        rubricSummary: 'ประเมินการมีส่วนร่วมและคะแนนแบบทดสอบท้ายคาบ (ผ่านเกณฑ์ 70%)',
      },
    },
    {
      week: 2,
      title: 'คณิตศาสตร์สำหรับ AI: Linear Algebra & Matrix Operations',
      unit: 'หน่วยที่ 1: พื้นฐาน AI และสถาปัตยกรรมอัจฉริยะ',
      hours: 2,
      objectives: ['คำนวณการคูณ Matrix และ Vectorization ใน NumPy ได้', 'เข้าใจมิติของข้อมูล (Tensors)'],
      activities: 'ปฏิบัติการเขียนโปรแกรม Python NumPy บน Google Colab คำนวณ Dot Product',
      materials: ['Lab 01 - Matrix Algebra.ipynb', 'เอกสารประกอบคณิตศาสตร์สำหรับ AI.pdf'],
      assessment: 'ตรวจผลรันโค้ดบน Jupyter Notebook Lab 1',
    },
    {
      week: 3,
      title: 'Machine Learning Paradigms: Supervised vs Unsupervised Learning',
      unit: 'หน่วยที่ 2: การเรียนรู้ของเครื่อง (Machine Learning)',
      hours: 2,
      objectives: ['จำแนกประเภทของการเรียนรู้ของเครื่องได้', 'เข้าใจกระบวนการ Train / Validation / Test Split'],
      activities: 'จำลองการแยกกลุ่มข้อมูลด้วย Scikit-learn (K-Means & Decision Trees)',
      materials: ['สไลด์บทที่ 3: ML Paradigms.pptx', 'ชุดข้อมูล Iris Dataset.csv'],
      assessment: 'แบบฝึกหัดวิเคราะห์ปัญหาและเลือกใช้อัลกอริทึมให้เหมาะสม',
    },
    {
      week: 4,
      title: 'การสร้างโมเดลจำแนกภาพ Convolutional Neural Networks (CNN)',
      unit: 'หน่วยที่ 3: คอมพิวเตอร์วิทัศน์ (Computer Vision & Deep Learning)',
      hours: 2,
      objectives: ['เข้าใจกลไก Conv2D, Max Pooling และ Dense Layers', 'ฝึกสอนโมเดลจำแนกภาพถ่ายวัตถุได้'],
      activities: 'โครงงานกลุ่ม: สร้าง Image Classifier จำแนกพันธุ์พืชสมุนไพรไทยด้วย TensorFlow/Keras',
      materials: ['Lab 04 - CNN Architecture.ipynb', 'Dataset พืชสมุนไพร 10 ชนิด (ZIP)'],
      assessment: 'ประเมินความแม่นยำของโมเดล (Accuracy > 90%) และรายงานสรุป',
      detailedPlan: {
        kpaObjectives: {
          knowledge: 'เข้าใจโครงสร้างเลเยอร์ของ CNN (Convolution, Pooling, Flatten, Dense)',
          process: 'สามารถเขียนโค้ดสร้างสถาปัตยกรรม CNN และทดสอบประสิทธิภาพโมเดลได้',
          attitude: 'ทำงานร่วมกันเป็นทีมด้วยความรับผิดชอบและมีความซื่อสัตย์ทางวิชาการ',
        },
        steps: {
          intro: 'ทบทวน Perceptron สู่ Multi-layer Neural Network (10 นาที)',
          teaching: 'สาธิตขั้นตอนการทำ Convolution Kernel และการสกัด Feature Map (40 นาที)',
          conclusion: 'ให้นักเรียนทดลอง Fine-tuning Hyperparameters (Learning Rate, Batch Size) และสรุปผล (30 นาที)',
        },
        rubricSummary: 'ประเมินจากความถูกต้องของสถาปัตยกรรมโค้ด ความคิดสร้างสรรค์ และความแม่นยำของโมเดล',
      },
    },
  ],
};

const MOCK_MATERIALS: Record<string, MaterialItem[]> = {
  'cls-601-ai': [
    {
      id: 'mat-1',
      title: 'แผนการจัดการเรียนรู้รายวิชา (Course Syllabus & Unit Plan)',
      type: 'pdf',
      unit: 'เอกสารหลักสูตร',
      fileSize: '2.4 MB',
      updatedAt: '15 พ.ค. 2569',
      description: 'คำอธิบายรายวิชา โครงสร้างเนื้อหา 20 สัปดาห์ และเกณฑ์การประเมินผลตามมาตรฐาน สพฐ.',
      previewPages: [
        'หน้า 1: โครงสร้างรายวิชา ว33281 ปัญญาประดิษฐ์และวิทยาการหุ่นยนต์ (1.5 หน่วยกิต)',
        'หน้า 2: ตารางวิเคราะห์มาตรฐานการเรียนรู้และตัวชี้วัด (K-P-A)',
        'หน้า 3: แผนการวัดและประเมินผล (สัดส่วน 70:30)',
      ],
    },
    {
      id: 'mat-2',
      title: 'สไลด์บรรยาย: Neural Networks & Deep Learning Architectures',
      type: 'slide',
      unit: 'หน่วยที่ 3: Deep Learning',
      fileSize: '18.5 MB',
      updatedAt: 'เมื่อวานนี้',
      description: 'สไลด์ประกอบการสอนฉบับสมบูรณ์ พร้อมภาพเคลื่อนไหวกลไก Backpropagation และ Loss Calculation',
      previewPages: [
        'Slide 1: บทนำ Deep Neural Networks และสมองกลอัจฉริยะ',
        'Slide 2: โครงสร้างทางคณิตศาสตร์ของ Artificial Neuron และ Activation Functions (ReLU, Sigmoid, Softmax)',
        'Slide 3: กระบวนการ Forward Propagation และ Backpropagation ด้วย Gradient Descent',
        'Slide 4: Convolutional Neural Network (CNN) สำหรับงาน Computer Vision',
      ],
    },
    {
      id: 'mat-3',
      title: 'แล็บปฏิบัติการ: Python TensorFlow CNN Lab Notebook',
      type: 'lab',
      unit: 'หน่วยที่ 3: Computer Vision',
      updatedAt: '2 วันที่แล้ว',
      colabUrl: 'https://colab.research.google.com/drive/example-cnn-lab',
      description: 'ไฟล์ Jupyter Notebook พร้อมชุดข้อมูลตัวอย่าง สามารถกดเปิดรันบน Google Colab ได้ทันที',
    },
    {
      id: 'mat-4',
      title: 'ใบงานที่ 4.2: การออกแบบสถาปัตยกรรมโครงข่ายประสาทเทียมและคำนวณ Parameters',
      type: 'pdf',
      unit: 'หน่วยที่ 3: Deep Learning',
      fileSize: '1.1 MB',
      updatedAt: '3 วันที่แล้ว',
      description: 'ใบงานฝึกคำนวณจำนวน Parameters ในแต่ละเลเยอร์ของโมเดล CNN ก่อนลงมือเขียนโค้ด',
    },
    {
      id: 'mat-5',
      title: 'วิดีโอบันทึกการสอนย้อนหลัง: การสร้างและ Fine-tuning โมเดล AI',
      type: 'video',
      unit: 'หน่วยที่ 3: Deep Learning',
      videoDuration: '48:20 นาที',
      youtubeId: 'aircAruvnKk',
      updatedAt: 'สัปดาห์ที่แล้ว',
      description: 'คลิปบรรยายพิเศษจากห้องเรียนอัจฉริยะ Smart Lab บันทึกแบบคมชัดระดับ 4K (สอนพื้นฐาน Neural Networks & Deep Learning)',
    },
    {
      id: 'mat-6',
      title: 'คลิปบรรยายพิเศษ: Python Data Structures & Algorithms Crash Course',
      type: 'video',
      unit: 'หน่วยที่ 2: โครงสร้างข้อมูล',
      videoDuration: '1:12:40 ชม.',
      youtubeId: '8hly31xKli0',
      updatedAt: '2 สัปดาห์ที่แล้ว',
      description: 'วิดีโอบรรยายเจาะลึก Binary Trees, Graphs, และ Sorting Algorithms สำหรับการเตรียมสอบ',
    },
  ],
};

export const ClassMaterialsModal: React.FC<ClassMaterialsModalProps> = ({
  classroom,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'slides' | 'labs' | 'videos' | 'upload'>('plans');
  const [lessonPlans] = useState<LessonPlanWeek[]>(() => MOCK_LESSON_PLANS[classroom.id] || MOCK_LESSON_PLANS['cls-601-ai']);
  const [materials, setMaterials] = useState<MaterialItem[]>(() => MOCK_MATERIALS[classroom.id] || MOCK_MATERIALS['cls-601-ai']);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<LessonPlanWeek | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [selectedVideoMaterial, setSelectedVideoMaterial] = useState<MaterialItem | null>(null);
  const [activePreviewPage, setActivePreviewPage] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Form State
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'pdf' as 'pdf' | 'slide' | 'lab' | 'video',
    unit: 'หน่วยที่ 1: พื้นฐาน',
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title.trim()) return;

    const created: MaterialItem = {
      id: `mat-${Date.now()}`,
      title: newMaterial.title,
      type: newMaterial.type,
      unit: newMaterial.unit,
      fileSize: '3.5 MB',
      updatedAt: 'เมื่อสักครู่',
      description: newMaterial.description || 'สื่อการสอนที่อัปโหลดโดยอาจารย์ผู้สอน',
      previewPages: [
        `หน้า 1: เนื้อหาตัวอย่างของ ${newMaterial.title}`,
        'หน้า 2: สรุปสาระสำคัญและแบบฝึกหัดท้ายบทเรียน',
      ],
    };

    setMaterials((prev) => [created, ...prev]);
    setActiveTab('slides');
    showToast(`อัปโหลด "${created.title}" เข้าคลังสื่อวิชา ${classroom.subjectCode} สำเร็จ!`);
    setNewMaterial({
      title: '',
      type: 'pdf',
      unit: 'หน่วยที่ 1: พื้นฐาน',
      description: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#121b2e] via-[#1a2948] to-[#1550d3] p-5 sm:p-6 text-white relative flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-sm">
              📁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-400/20 text-blue-200 border border-blue-400/30 text-[11px] font-mono font-bold">
                  {classroom.subjectCode}
                </span>
                <span className="text-xs text-blue-200">{classroom.room}</span>
                <span className="text-xs text-blue-300 font-bold">• {classroom.thaiGrade}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                สื่อการสอนและแผนการจัดการเรียนรู้ (Curriculum & Materials)
              </h2>
              <p className="text-xs text-slate-300">
                {classroom.subjectName} • คลังสื่อดิจิทัลและแผนการสอนมาตรฐาน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors self-end md:self-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Interactive Navigation Tabs */}
        <div className="px-5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plans'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>แผนการสอนรายสัปดาห์ (Lesson Plans)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[#1550d3] text-[10px]">
              {lessonPlans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'slides'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">slideshow</span>
            <span>สไลด์ & เอกสาร (Slides & PDFs)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {materials.filter((m) => m.type === 'slide' || m.type === 'pdf').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('labs')}
            className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'labs'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            <span>แล็บ & ใบงาน (Labs & Colab)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {materials.filter((m) => m.type === 'lab').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'videos'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">smart_display</span>
            <span>วิดีโอย้อนหลัง (Recordings)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-emerald-600 hover:text-emerald-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>+ อัปโหลดสื่อใหม่</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: LESSON PLANS */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-extrabold text-blue-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>โครงสร้างหลักสูตรรายวิชา (Course Outline): 1.5 หน่วยกิต (60 ชั่วโมง/ภาคเรียน)</span>
                  </div>
                  <p className="text-blue-800/80">
                    การประเมินผล: คะแนนเก็บระหว่างเรียน 50% • สอบกลางภาค 20% • โครงงาน AI ปลายภาค 30%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('ดาวน์โหลดไฟล์แผนการสอนมาตรฐานรายวิชา (DOCX) สำเร็จ!')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>ดาวน์โหลดเล่มแผน (Doc)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {lessonPlans.map((plan) => (
                  <div
                    key={plan.week}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#1550d3] font-bold font-mono text-xs border border-blue-200">
                          สัปดาห์ที่ {plan.week}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {plan.unit}
                        </span>
                        <span className="text-[11px] text-slate-400">({plan.hours} คาบ)</span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 group-hover:text-[#1550d3] transition-colors">
                        {plan.title}
                      </h4>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">วัตถุประสงค์: </span>
                          <span>{plan.objectives.join(' • ')}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">กิจกรรมการเรียนรู้: </span>
                          <span>{plan.activities}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                        <span className="font-bold text-slate-500">สื่อที่ใช้:</span>
                        {plan.materials.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium">
                        การวัดผล: <span className="font-bold text-slate-700">{plan.assessment}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanDetail(plan)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#1550d3] hover:text-white text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>ดูแผนละเอียด</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SLIDES & PDFS */}
          {activeTab === 'slides' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials
                .filter((m) => m.type === 'slide' || m.type === 'pdf')
                .map((mat) => (
                  <div
                    key={mat.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          mat.type === 'slide' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className="material-symbols-outlined text-[15px]">
                            {mat.type === 'slide' ? 'slideshow' : 'picture_as_pdf'}
                          </span>
                          <span>{mat.type === 'slide' ? 'PPTX สไลด์' : 'PDF เอกสาร'}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{mat.fileSize || '3.2 MB'}</span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 leading-snug">
                        {mat.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{mat.description}</p>
                      <div className="text-[11px] text-slate-400 mt-2 font-medium">
                        หมวด: {mat.unit} • อัปเดต: {mat.updatedAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewMaterial(mat);
                          setActivePreviewPage(0);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1550d3] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>เปิดอ่านตัวอย่าง</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast(`เริ่มดาวน์โหลด ${mat.title}`)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="ดาวน์โหลดไฟล์ลงเครื่อง"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 3: LABS & COLAB */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials
                  .filter((m) => m.type === 'lab')
                  .map((mat) => (
                    <div
                      key={mat.id}
                      className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 bg-emerald-50/20"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">terminal</span>
                            <span>Jupyter / Colab Lab</span>
                          </span>
                          <span className="text-[11px] text-emerald-700 font-mono font-bold">Python 3.10+</span>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 leading-snug">
                          {mat.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">{mat.description}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                        <a
                          href={mat.colabUrl || 'https://colab.research.google.com/'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          <span>เปิดบน Google Colab</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => showToast(`มอบหมายแล็บ ${mat.title} ให้นักเรียนเรียบร้อย!`)}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="สั่งการบ้านจากแล็บนี้เข้าคลาส"
                        >
                          <span className="material-symbols-outlined text-[16px]">assignment</span>
                          <span>สั่งงานเข้าคลาส</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials
                .filter((m) => m.type === 'video')
                .map((mat) => (
                  <div
                    key={mat.id}
                    onClick={() => setSelectedVideoMaterial(mat)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3 cursor-pointer group"
                  >
                    <div className="relative aspect-video rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-20">
                        <span className="material-symbols-outlined text-3xl">play_arrow</span>
                      </div>
                      <span className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono font-bold">
                        {mat.videoDuration || '45:00'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                          วิดีโอบรรยาย YouTube HD
                        </span>
                        <span className="text-[10px] text-slate-400">{mat.updatedAt}</span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 group-hover:text-[#1550d3] transition-colors mt-0.5">{mat.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{mat.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1550d3] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">play_circle</span>
                        <span>เปิดเล่นวิดีโอทันที</span>
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 5: UPLOAD NEW MATERIAL */}
          {activeTab === 'upload' && (
            <form
              onSubmit={handleCreateMaterial}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-2xl mx-auto space-y-4"
            >
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">upload_file</span>
                  <span>อัปโหลดสื่อการสอนใหม่ (Upload Teaching Material)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  เพิ่มไฟล์สไลด์, เอกสารประกอบ, โค้ดแล็บ หรือวิดีโอ เข้าสู่วิชา {classroom.subjectCode}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อสื่อการสอน / เอกสาร *</label>
                  <input
                    type="text"
                    required
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="เช่น สไลด์บรรยายบทที่ 5: Recurrent Neural Networks (RNN)"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ประเภทสื่อ</label>
                    <select
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                    >
                      <option value="slide">สไลด์บรรยาย (PPTX / Google Slides)</option>
                      <option value="pdf">เอกสาร / ใบความรู้ (PDF)</option>
                      <option value="lab">โค้ดแล็บปฏิบัติการ (Jupyter / Colab)</option>
                      <option value="video">วิดีโอบรรยาย (MP4 / YouTube)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">หน่วยการเรียนรู้</label>
                    <input
                      type="text"
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                      placeholder="เช่น หน่วยที่ 3: Deep Learning"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">คำอธิบายเพิ่มเติม</label>
                  <textarea
                    rows={3}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    placeholder="ระบุวัตถุประสงค์หรือคำแนะนำสำหรับนักเรียน..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-emerald-500"
                  />
                </div>

                {/* Drag and Drop Mock Area */}
                <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-400 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-4xl text-slate-400">cloud_upload</span>
                  <div className="text-xs font-bold text-slate-700 mt-1">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">รองรับไฟล์ PPTX, PDF, IPYNB, MP4 (สูงสุด 100 MB)</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>บันทึกและเผยแพร่</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            วิชา <span className="font-bold text-slate-800">{classroom.subjectName}</span> • ห้อง {classroom.room}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Detailed Lesson Plan Modal */}
      {selectedPlanDetail && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPlanDetail(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#1550d3] font-bold font-mono text-xs border border-blue-200">
                  สัปดาห์ที่ {selectedPlanDetail.week}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-1">{selectedPlanDetail.title}</h3>
                <p className="text-xs text-slate-500">{selectedPlanDetail.unit}</p>
              </div>
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* K-P-A Objectives */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">target</span>
                  <span>จุดประสงค์การเรียนรู้ (K-P-A Objectives)</span>
                </div>
                <div className="space-y-1.5 pl-2 text-slate-700">
                  <div>
                    <strong className="text-blue-900">1. ด้านความรู้ (K - Knowledge):</strong>{' '}
                    {selectedPlanDetail.detailedPlan?.kpaObjectives.knowledge || selectedPlanDetail.objectives[0]}
                  </div>
                  <div>
                    <strong className="text-blue-900">2. ด้านทักษะกระบวนการ (P - Process):</strong>{' '}
                    {selectedPlanDetail.detailedPlan?.kpaObjectives.process || selectedPlanDetail.activities}
                  </div>
                  <div>
                    <strong className="text-blue-900">3. ด้านคุณลักษณะอันพึงประสงค์ (A - Attitude):</strong>{' '}
                    {selectedPlanDetail.detailedPlan?.kpaObjectives.attitude || 'มีความมุ่งมั่นในการทำงานและมีวินัย'}
                  </div>
                </div>
              </div>

              {/* Teaching Steps */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
                  <span>ขั้นตอนการจัดกิจกรรมการเรียนรู้ (Active Learning Steps)</span>
                </div>
                <div className="space-y-2 pl-2 text-slate-700">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-[#1550d3] block mb-0.5">1. ขั้นนำเข้าสู่บทเรียน (Introduction - 10 นาที)</span>
                    <p>{selectedPlanDetail.detailedPlan?.steps.intro || 'ทบทวนความรู้เดิมและกระตุ้นความสนใจด้วยคำถามท้าทาย'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-emerald-700 block mb-0.5">2. ขั้นจัดการเรียนรู้ (Teaching & Practicum - 70 นาที)</span>
                    <p>{selectedPlanDetail.detailedPlan?.steps.teaching || selectedPlanDetail.activities}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="font-bold text-purple-700 block mb-0.5">3. ขั้นสรุปและประเมินผล (Conclusion - 20 นาที)</span>
                    <p>{selectedPlanDetail.detailedPlan?.steps.conclusion || 'สรุปเนื้อหาร่วมกันและทำแบบประเมิน'}</p>
                  </div>
                </div>
              </div>

              {/* Assessment Rubric */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[16px]">fact_check</span>
                  <span>เกณฑ์การวัดและประเมินผล</span>
                </div>
                <p className="text-amber-800">{selectedPlanDetail.detailedPlan?.rubricSummary || selectedPlanDetail.assessment}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Previewer Dialog */}
      {previewMaterial && (
        <div
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewMaterial(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 text-[#1550d3] material-symbols-outlined text-[20px]">
                  {previewMaterial.type === 'slide' ? 'slideshow' : 'description'}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{previewMaterial.title}</h3>
                  <p className="text-xs text-slate-500">{previewMaterial.unit} • {previewMaterial.fileSize}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Slide / PDF Mock Canvas */}
            <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white flex flex-col justify-between shadow-inner relative border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{classroom.subjectCode} • {classroom.subjectName}</span>
                <span className="font-bold bg-white/10 px-2.5 py-1 rounded-full text-blue-200">
                  หน้า {activePreviewPage + 1} จาก {previewMaterial.previewPages?.length || 1}
                </span>
              </div>

              <div className="my-auto text-center space-y-3">
                <div className="text-2xl font-black tracking-tight text-white max-w-xl mx-auto">
                  {previewMaterial.previewPages?.[activePreviewPage] || previewMaterial.title}
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {previewMaterial.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
                <span>School Nexus Smart Curriculum 2569</span>
                <span>อาจารย์ผู้สอน: วรวุฒิ เพ็ชรราย</span>
              </div>
            </div>

            {/* Pagination Controls */}
            {previewMaterial.previewPages && previewMaterial.previewPages.length > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={activePreviewPage === 0}
                  onClick={() => setActivePreviewPage((prev) => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>หน้าก่อนหน้า</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {previewMaterial.previewPages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePreviewPage(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activePreviewPage === i ? 'bg-[#1550d3] w-6' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={activePreviewPage === (previewMaterial.previewPages?.length || 1) - 1}
                  onClick={() => setActivePreviewPage((prev) => Math.min((previewMaterial.previewPages?.length || 1) - 1, prev + 1))}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span>หน้าถัดไป</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  showToast(`เริ่มดาวน์โหลด ${previewMaterial.title}`);
                }}
                className="px-4 py-2 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>ดาวน์โหลดไฟล์เต็ม</span>
              </button>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideoMaterial && (
        <div
          className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          onClick={() => setSelectedVideoMaterial(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                    {classroom.subjectCode} • {selectedVideoMaterial.unit}
                  </span>
                  <h3 className="text-base font-bold text-white truncate mt-0.5">
                    {selectedVideoMaterial.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedVideoMaterial(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Video Player Embed */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideoMaterial.youtubeId || 'aircAruvnKk'}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideoMaterial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Video Controls & Info */}
            <div className="p-5 bg-slate-50 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-red-600">timer</span>
                    {selectedVideoMaterial.videoDuration || '45:00'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    HD 1080p Stream
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideoMaterial.youtubeId || 'aircAruvnKk'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    <span>ชมบน YouTube</span>
                  </a>
                  <button
                    onClick={() => {
                      showToast(`ดาวน์โหลดเอกสารประกอบวิดีโอ "${selectedVideoMaterial.title}" สำเร็จ`);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>ดาวน์โหลดโน้ตย่อ</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">คำอธิบายวิดีโอ:</span>
                {selectedVideoMaterial.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
