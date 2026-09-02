export interface SubmissionFileArchiveItem {
  name: string;
  path: string;
  size: string;
  type: 'code' | 'image' | 'doc' | 'data' | 'config';
  content?: string;
  description?: string;
}

export interface SubmissionDetailsData {
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  category: 'zip' | 'code' | 'pdf' | 'image' | 'document' | 'audio' | 'general';
  summary?: string;
  codeSnippet?: string;
  language?: string;
  archiveFiles?: SubmissionFileArchiveItem[];
  metrics?: {
    accuracy?: string;
    valLoss?: string;
    epochs?: string;
    modelArchitecture?: string;
    datasetSize?: string;
    f1Score?: string;
  };
  pdfPages?: {
    pageNumber: number;
    title: string;
    content: string;
    subsections?: { title: string; body: string }[];
  }[];
  imagePreviewUrl?: string;
  githubUrl?: string;
}

export const MOCK_STUDENT_FILES: Record<string, SubmissionDetailsData> = {
  'cnn_image_classification_model.zip': {
    fileName: 'cnn_image_classification_model.zip',
    fileSize: '48.6 MB',
    fileType: 'application/zip',
    uploadedAt: 'วันนี้ 09:12 น.',
    category: 'zip',
    summary: 'โครงงานจำแนกรูปภาพด้วย Deep Learning (ResNet-18 CNN) เทรนบน CIFAR-100 ได้รับ Accuracy 94.8% พร้อมระบบ Inference API',
    metrics: {
      accuracy: '94.8% (Test Set)',
      valLoss: '0.0824',
      epochs: '50 / 50',
      modelArchitecture: 'Convolutional Neural Network (ResNet-18 + BatchNorm + Dropout)',
      datasetSize: '60,000 ภาพ (100 คลาส)',
      f1Score: '0.942 (Macro Avg)',
    },
    archiveFiles: [
      {
        name: 'model.py',
        path: 'src/model.py',
        size: '4.2 KB',
        type: 'code',
        description: 'นิยามสถาปัตยกรรมโมเดล ResNet-18 Custom PyTorch',
        content: `import torch
import torch.nn as nn
import torchvision.models as models

class SmartCampusImageClassifier(nn.Module):
    """
    Custom Deep Learning Model for Image Classification
    Student: Worawut Phetrai (66041001) - M.6/1
    Subject: AI & Robotics (CS33281)
    """
    def __init__(self, num_classes=100, pretrained=True, dropout_rate=0.4):
        super(SmartCampusImageClassifier, self).__init__()
        
        # Load Pretrained Backbone ResNet-18
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if pretrained else None)
        in_features = self.backbone.fc.in_features
        
        # Custom Classification Head with Dropout & Batch Normalization
        self.backbone.fc = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Dropout(p=dropout_rate),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(256),
            nn.Dropout(p=dropout_rate * 0.5),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.backbone(x)

    def get_model_summary(self):
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return {
            "total_parameters": f"{total_params:,}",
            "trainable_parameters": f"{trainable_params:,}",
            "architecture": "ResNet-18 (Custom Head)"
        }
`,
      },
      {
        name: 'train.py',
        path: 'src/train.py',
        size: '5.8 KB',
        type: 'code',
        description: 'สคริปต์การฝึกสอนโมเดล พร้อม Early Stopping และ Cosine Annealing LR',
        content: `import torch
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from model import SmartCampusImageClassifier

def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)
        
    return running_loss / total, (correct / total) * 100

print("[INFO] Model Training Completed successfully on CUDA:0 (NVIDIA RTX 4090)")
print("[EVAL] Final Validation Accuracy: 94.82% | Validation Loss: 0.0824")
`,
      },
      {
        name: 'requirements.txt',
        path: 'requirements.txt',
        size: '280 B',
        type: 'config',
        description: 'รายการแพ็กเกจไลบรารีที่จำเป็น',
        content: `torch>=2.2.0
torchvision>=0.17.0
numpy>=1.24.0
scikit-learn>=1.4.0
matplotlib>=3.8.0
fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        size: '3.1 KB',
        type: 'doc',
        description: 'คู่มือและรายงานการทดลองโครงงานฉบับสมบูรณ์',
        content: `# โครงงาน Deep Learning จำแนกรูปภาพด้วย CNN ResNet-18

**ผู้จัดทำ:** นายวรวุฒิ เพ็ชรราย (รหัสนักเรียน 66041001) ชั้น ม.6/1  
**วิชา:** ว33281 ปัญญาประดิษฐ์และวิทยาการหุ่นยนต์ (AI & Robotics)  
**อาจารย์ผู้สอน:** อ. กิตติพงษ์ เลิศพิริยะ

---

## 1. วัตถุประสงค์
1. พัฒนาโครงข่ายประสาทเทียมแบบคอนโวลูชัน (CNN) เพื่อจำแนกประเภทภาพถ่ายวัตถุ
2. ประยุกต์ใช้เทคนิค Transfer Learning จาก Backbone ResNet-18
3. ป้องกัน Overfitting ด้วยเทคนิค Data Augmentation, Dropout และ Batch Normalization

## 2. ผลการทดลอง
- **ความแม่นยำ (Accuracy):** 94.8% บน Test Set
- **ค่าความคลาดเคลื่อน (Loss):** 0.0824
- **เวลาในการประมวลผลต่อภาพ (Inference Time):** 4.2 มิลลิวินาที (GPU)
`,
      },
    ],
  },
  'fastapi_school_service.py': {
    fileName: 'fastapi_school_service.py',
    fileSize: '6.4 KB',
    fileType: 'text/x-python',
    uploadedAt: '17 ส.ค. 18:20 น.',
    category: 'code',
    language: 'python',
    summary: 'RESTful API Service สำหรับระบบบันทึกคะแนนและเช็กชื่อนักเรียน พัฒนาด้วย FastAPI และ Pydantic v2',
    codeSnippet: `from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

app = FastAPI(
    title="School Nexus API Hub",
    description="Smart Campus REST API Service for Student Grading & Real-time Sync",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentGradeSchema(BaseModel):
    student_id: str = Field(..., example="66041001", description="รหัสนักเรียน 8 หลัก")
    student_name: str = Field(..., example="วรวุฒิ เพ็ชรราย")
    subject_code: str = Field(..., example="CS33201")
    assignment_id: str = Field(..., example="asg-deep-learning-01")
    score: float = Field(..., ge=0, le=100, description="คะแนนที่ได้ (0-100)")
    max_score: float = Field(default=20.0, description="คะแนนเต็ม")
    feedback: Optional[str] = Field(None, description="ข้อคิดเห็นจากอาจารย์ผู้สอน")
    graded_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceSchema(BaseModel):
    student_id: str
    classroom: str = Field(..., example="ม.6/1")
    status: str = Field(..., example="present", description="present | late | absent | leave")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# In-memory Database Mock
GRADES_DB: List[StudentGradeSchema] = []

@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "online",
        "service": "School Nexus Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "99.98%"
    }

@app.post("/api/grades/submit", response_model=StudentGradeSchema, status_code=status.HTTP_201_CREATED, tags=["Grading"])
async def submit_student_grade(grade_data: StudentGradeSchema):
    """บันทึกคะแนนการบ้านของนักเรียน และส่งสัญญาณแจ้งเตือนไปยัง Real-time Notification Service"""
    if grade_data.score > grade_data.max_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"คะแนนที่ได้ ({grade_data.score}) ต้องไม่เกินคะแนนเต็ม ({grade_data.max_score})"
        )
    GRADES_DB.append(grade_data)
    return grade_data

@app.get("/api/grades/{student_id}", response_model=List[StudentGradeSchema], tags=["Grading"])
async def get_student_grades(student_id: str):
    results = [g for g in GRADES_DB if g.student_id == student_id]
    return results
`,
  },
  'database_schema_ex4.pdf': {
    fileName: 'database_schema_ex4.pdf',
    fileSize: '3.8 MB',
    fileType: 'application/pdf',
    uploadedAt: 'วันนี้ 08:05 น.',
    category: 'pdf',
    summary: 'เอกสารออกแบบฐานข้อมูลเชิงสัมพันธ์ (Relational Schema & 3NF Normalization) สำหรับระบบบริหารสถานศึกษาอัจฉริยะ',
    pdfPages: [
      {
        pageNumber: 1,
        title: 'หน้า 1: Entity-Relationship Diagram (ERD) & Conceptual Data Model',
        content: 'ภาพรวมโมเดลฐานข้อมูล Entity-Relationship Diagram แสดงความสัมพันธ์ระหว่างตาราง Users, Roles, Classrooms, Courses, Assignments, Submissions และ AttendanceLog',
        subsections: [
          {
            title: '1. โครงสร้างความสัมพันธ์ (Entity Relationships)',
            body: 'ตาราง `users` มีความสัมพันธ์แบบ One-to-Many กับตาราง `attendance_logs` และ `submissions` โดยเชื่อมโยงผ่าน `user_id`',
          },
          {
            title: '2. กฎความคงสภาพข้อมูล (Integrity Constraints)',
            body: 'กำหนด Foreign Keys แบบ ON DELETE CASCADE สำหรับ Submissions และ ON UPDATE CASCADE เพื่อป้องกัน Orphan Records',
          },
        ],
      },
      {
        pageNumber: 2,
        title: 'หน้า 2: พจนานุกรมข้อมูล (Data Dictionary & Normalization Form 3NF)',
        content: 'ตารางแจกแจงโครงสร้างฟิลด์ Data Type, Primary Key, Foreign Key และดัชนี Indexing สำหรับค้นหาข้อมูลความเร็วสูง',
        subsections: [
          {
            title: 'การทำ Normalization สู่ระดับ 3NF',
            body: 'แยกตาราง `rubric_criteria` ออกจาก `rubric_master` เพื่อขจัด Transitive Dependency และป้องกันการซ้ำซ้อนของข้อมูลคะแนน',
          },
          {
            title: 'Indexing Optimization',
            body: 'สร้าง B-Tree Composite Index บน `(classroom_id, date, status)` ทำให้ Query ข้อมูลเช็กชื่อนักเรียนทั้งห้องใช้เวลาไม่เกิน 5ms',
          },
        ],
      },
      {
        pageNumber: 3,
        title: 'หน้า 3: ตัวอย่าง SQL Queries & Stored Procedures สำหรับสรุปเกรดเฉลี่ย',
        content: 'คำสั่ง SQL สำหรับตัดเกรดอิงเกณฑ์ (Criterion-referenced Evaluation) และคำนวณ GPA รายภาคเรียนแบบอัตโนมัติ',
        subsections: [
          {
            title: 'SQL Stored Procedure: CalculateSemesterGPA()',
            body: 'คำนวณผลรวมของ (หน่วยกิต x เกรดที่ได้) หารด้วยหน่วยกิตรวม พร้อมอัปเดตลงฟิลด์ `gpa` ในตาราง `student_profiles`',
          },
        ],
      },
    ],
  },
  'natthaphon_cnn.zip': {
    fileName: 'natthaphon_cnn.zip',
    fileSize: '36.4 MB',
    fileType: 'application/zip',
    uploadedAt: 'วันนี้ 07:15 น.',
    category: 'zip',
    summary: 'โครงงานโมเดลจำแนกภาพป้ายจราจรและสัญญาณเตือนอัจฉริยะ (CNN Traffic Sign Classifier) ด้วย PyTorch',
    metrics: {
      accuracy: '92.4% (Test Set)',
      valLoss: '0.114',
      epochs: '40 / 40',
      modelArchitecture: 'Custom 5-Layer CNN with LeakyReLU & MaxPool',
      datasetSize: '42,000 ภาพป้ายจราจร',
    },
    archiveFiles: [
      {
        name: 'traffic_classifier.py',
        path: 'src/traffic_classifier.py',
        size: '3.6 KB',
        type: 'code',
        description: 'โมเดล CNN สำหรับประมวลผลภาพป้ายจราจร',
        content: `import torch
import torch.nn as nn

class TrafficSignCNN(nn.Module):
    """Traffic Sign Detection by Natthaphon (66040188)"""
    def __init__(self, num_classes=43):
        super(TrafficSignCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.1),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.1),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.1),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 512),
            nn.Dropout(0.5),
            nn.LeakyReLU(0.1),
            nn.Linear(512, num_classes)
        )
        
    def forward(self, x):
        return self.classifier(self.features(x))
`,
      },
      {
        name: 'eval_results.json',
        path: 'results/eval_results.json',
        size: '1.2 KB',
        type: 'data',
        description: 'รายงานค่าความแม่นยำแต่ละคลาส',
        content: `{\n  "overall_accuracy": 0.924,\n  "speed_limit_signs": 0.961,\n  "warning_signs": 0.912,\n  "prohibition_signs": 0.938\n}`,
      },
    ],
  },
  'natthaphon_cnn_model.zip': {
    fileName: 'natthaphon_cnn_model.zip',
    fileSize: '36.4 MB',
    fileType: 'application/zip',
    uploadedAt: 'วันนี้ 07:15 น.',
    category: 'zip',
    summary: 'โครงงานโมเดลจำแนกภาพป้ายจราจรและสัญญาณเตือนอัจฉริยะ (CNN Traffic Sign Classifier) ด้วย PyTorch',
    metrics: {
      accuracy: '92.4% (Test Set)',
      valLoss: '0.114',
      epochs: '40 / 40',
      modelArchitecture: 'Custom 5-Layer CNN with LeakyReLU & MaxPool',
      datasetSize: '42,000 ภาพป้ายจราจร',
    },
    archiveFiles: [
      {
        name: 'traffic_classifier.py',
        path: 'src/traffic_classifier.py',
        size: '3.6 KB',
        type: 'code',
        description: 'โมเดล CNN สำหรับประมวลผลภาพป้ายจราจร',
        content: `import torch
import torch.nn as nn

class TrafficSignCNN(nn.Module):
    """Traffic Sign Detection by Natthaphon (66040188)"""
    def __init__(self, num_classes=43):
        super(TrafficSignCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.1),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.1),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 8 * 8, 256),
            nn.Dropout(0.5),
            nn.LeakyReLU(0.1),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.classifier(self.features(x))
`,
      },
    ],
  },
  'project_architecture_draft.pdf': {
    fileName: 'project_architecture_draft.pdf',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    uploadedAt: '15 ส.ค. 2026',
    category: 'pdf',
    summary: 'เอกสารออกแบบสถาปัตยกรรมระบบ Full-stack Web Application และผังระบบ Cloud Authentication',
    pdfPages: [
      {
        pageNumber: 1,
        title: 'หน้า 1: System Architecture Diagram & Data Flow',
        content: 'แผนผังการไหลของข้อมูลระหว่าง React Client, Express Backend, Google Firestore Database และ Gemini AI Services',
      },
      {
        pageNumber: 2,
        title: 'หน้า 2: Authentication Workflow & Token Lifecycle',
        content: 'ขั้นตอนการยืนยันตัวตนด้วย Google OAuth 2.0 พร้อมกลไก In-memory Access Token Cache และ Role-based Access Control (RBAC)',
      },
    ],
  },
  'nexus_design_system.fig': {
    fileName: 'nexus_design_system.fig',
    fileSize: '14.8 MB',
    fileType: 'application/octet-stream',
    uploadedAt: '16 ส.ค. 2026',
    category: 'document',
    summary: 'ไฟล์แบบจำลองดีไซน์ระบบ Figma (Design Tokens, Typography Hierarchy, Card Variants, Color Palettes)',
  },
  'ui_screens_preview.png': {
    fileName: 'ui_screens_preview.png',
    fileSize: '3.2 MB',
    fileType: 'image/png',
    uploadedAt: '16 ส.ค. 2026',
    category: 'image',
    imagePreviewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
    summary: 'ภาพพรีวิวหน้าจอ Mobile Application & Glassmorphism Dashboard',
  },
};

export function getSubmissionFileDetails(
  fileName: string,
  fallbackStudentName = 'นักเรียน',
  fallbackSubject = 'วิชาการเรียนรู้'
): SubmissionDetailsData {
  if (MOCK_STUDENT_FILES[fileName]) {
    return MOCK_STUDENT_FILES[fileName];
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  let category: SubmissionDetailsData['category'] = 'general';

  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) category = 'zip';
  else if (['py', 'js', 'ts', 'tsx', 'sql', 'html', 'css', 'cpp', 'java', 'json'].includes(ext)) category = 'code';
  else if (['pdf'].includes(ext)) category = 'pdf';
  else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) category = 'image';
  else if (['doc', 'docx', 'txt', 'md', 'fig', 'ppt', 'pptx'].includes(ext)) category = 'document';

  return {
    fileName,
    fileSize: '3.5 MB',
    fileType: ext ? `application/${ext}` : 'application/octet-stream',
    uploadedAt: 'ส่งตรงตามกำหนด',
    category,
    summary: `ไฟล์ส่งงานวิชา ${fallbackSubject} ของ ${fallbackStudentName} ตรวจสอบไฟล์สมบูรณ์ พร้อมเปิดอ่านและประเมินผล`,
    codeSnippet: category === 'code' ? `# ไฟล์งาน ${fileName}\n# ผู้ส่ง: ${fallbackStudentName}\n\ndef main():\n    print("School Nexus Submission Verified Successfully")\n\nif __name__ == "__main__":\n    main()` : undefined,
    archiveFiles: category === 'zip' ? [
      {
        name: 'main.py',
        path: 'src/main.py',
        size: '2.4 KB',
        type: 'code',
        description: 'โค้ดหลักของโครงงาน',
        content: `# Code from ${fileName}\nprint("Executed Project Logic")`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        size: '1.2 KB',
        type: 'doc',
        description: 'เอกสารสรุปโครงการ',
        content: `# Project: ${fileName}\nSubmitted by ${fallbackStudentName}`,
      }
    ] : undefined,
  };
}
