import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function devProjectConfigPlugin(): Plugin {
  return {
    name: 'dev-project-config-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/dev/project-repo' && (req.method === 'GET' || req.method === 'POST')) {
          try {
            let detectedUrl = '';
            let detectedSource = '';
            let detectedOwner = '';
            let detectedRepo = '';

            // 1. Try parsing local .git/config
            const gitConfigPath = path.resolve(process.cwd(), '.git/config');
            if (fs.existsSync(gitConfigPath)) {
              try {
                const gitConfigContent = fs.readFileSync(gitConfigPath, 'utf-8');
                const match = gitConfigContent.match(/url\s*=\s*(?:https?:\/\/[^@\s]+@)?(?:git@)?github\.com[:/]([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:\s|$)/i);
                if (match) {
                  detectedOwner = match[1];
                  detectedRepo = match[2].replace(/\.git$/, '');
                  detectedUrl = `https://github.com/${detectedOwner}/${detectedRepo}`;
                  detectedSource = 'Local .git/config (remote origin)';
                }
              } catch (e) {
                console.warn('Could not read .git/config:', e);
              }
            }

            // 2. Try environment variables
            if (!detectedUrl) {
              const envRepo = process.env.GITHUB_REPOSITORY || process.env.VITE_GITHUB_REPO || process.env.PROJECT_REPO_URL;
              if (envRepo) {
                const match = envRepo.match(/(?:github\.com[:/])?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/i);
                if (match) {
                  detectedOwner = match[1];
                  detectedRepo = match[2].replace(/\.git$/, '');
                  detectedUrl = `https://github.com/${detectedOwner}/${detectedRepo}`;
                  detectedSource = 'Environment Variables (GITHUB_REPOSITORY / VITE_GITHUB_REPO)';
                }
              }
            }

            // 3. Try package.json repository field
            if (!detectedUrl) {
              const pkgPath = path.resolve(process.cwd(), 'package.json');
              if (fs.existsSync(pkgPath)) {
                try {
                  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                  const repoField = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
                  if (repoField) {
                    const match = repoField.match(/(?:github\.com[:/])?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/i);
                    if (match) {
                      detectedOwner = match[1];
                      detectedRepo = match[2].replace(/\.git$/, '');
                      detectedUrl = `https://github.com/${detectedOwner}/${detectedRepo}`;
                      detectedSource = 'package.json (repository field)';
                    }
                  }
                } catch (e) {
                  console.warn('Could not read package.json:', e);
                }
              }
            }

            // 4. Try scripts/auto_push.sh or push_to_github.sh
            if (!detectedUrl) {
              const autoPushPath = path.resolve(process.cwd(), 'scripts/auto_push.sh');
              if (fs.existsSync(autoPushPath)) {
                try {
                  const scriptContent = fs.readFileSync(autoPushPath, 'utf-8');
                  const match = scriptContent.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
                  if (match) {
                    detectedOwner = match[1];
                    detectedRepo = match[2].replace(/[")\s]/g, '');
                    detectedUrl = `https://github.com/${detectedOwner}/${detectedRepo}`;
                    detectedSource = 'scripts/auto_push.sh config';
                  }
                } catch (e) {
                  console.warn('Could not read auto_push.sh:', e);
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            if (detectedUrl) {
              return res.end(JSON.stringify({
                success: true,
                repoUrl: detectedUrl,
                source: detectedSource,
                owner: detectedOwner,
                repo: detectedRepo,
                isDev: true
              }));
            } else {
              return res.end(JSON.stringify({
                success: false,
                message: 'ไม่พบการตั้งค่า GitHub Repository ในไฟล์โครงสร้างโปรเจกต์นี้',
                isDev: true
              }));
            }
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              message: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบโปรเจกต์',
              isDev: true
            }));
          }
        }
        next();
      });
    }
  };
}

function aiTutorPlugin(): Plugin {
  return {
    name: 'ai-tutor-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/tutor' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            let promptText = '';
            let mode = 'study_tips';
            let courseContext: any = null;
            let messages: any[] = [];

            try {
              const parsed = JSON.parse(body || '{}');
              promptText = parsed.prompt || '';
              mode = parsed.mode || 'study_tips';
              courseContext = parsed.courseContext || null;
              messages = parsed.messages || [];

              const apiKey = process.env.GEMINI_API_KEY;

              const systemInstruction = `You are "Nexus AI Tutor", an intelligent, encouraging, and highly capable academic AI mentor at School Nexus for student Worawut Petchraya (Grade 12 / M.6 Sci-Tech & AI).

Active Courses Context:
- CS30201: วิทยาการคำนวณ (Computer Science) - Progress: 75%, 2 assignments due, Topics: OOP, Tree/Graph Data Structures, ML Fundamentals, Full-stack REST API.
- DS20104: การออกแบบ (Design & UI/UX) - Progress: 40%, 1 assignment due, Topics: Visual Hierarchy, Gestalt Principles, Color Palette Tokens, Figma Auto Layout, Prototyping.
- MM30102: Multimedia Production - Progress: 90%, Up to date, Topics: Storyboard, 4K Color Grading, Spatial Audio Foley Mixing.
- MA30101: คณิตศาสตร์ขั้นสูง (Advanced Mathematics) - Progress: 0%, 1 overdue/due assignment, Topics: Limits, Derivatives, Integrals, Matrices & Determinants.

Guidelines:
1. Speak in friendly, polite, and educational Thai (or English when requested or discussing technical terms/code).
2. Mode handling:
   - "study_tips": Provide actionable, personalized study routines, time management, exam strategies, and prioritization based on due dates and course progress.
   - "simplify": Break down complex concepts using simple everyday analogies, step-by-step logic, real-world examples, and concise bullet points.
   - "qa": Act as a patient Socratic tutor. Explain concepts, give hints, explain code/math step-by-step, and provide clear structured answers.
   - "quiz": Generate 2-3 quick interactive practice questions with multiple choices and brief explanations.
3. Use formatted markdown: bold for key terms, code blocks (\`\`\`) with language tags when showing code, bullet points for readability.
4. Keep explanations clear, engaging, and motivating.

Current Focus Course: ${courseContext?.title || 'All Active Courses'} (${courseContext?.code || 'General'})`;

              if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
                const simulatedResponse = getSimulatedTutorResponse(promptText, mode, courseContext);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ text: simulatedResponse }));
              }

              const ai = new GoogleGenAI({
                apiKey: apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              let contents = promptText;
              if (messages && Array.isArray(messages) && messages.length > 0) {
                contents = messages.map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n\n') + `\n\nStudent: ${promptText}`;
              }

              const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: contents,
                config: {
                  systemInstruction: systemInstruction,
                  temperature: 0.7,
                },
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text: response.text || 'ไม่มีข้อมูลตอบกลับ' }));
            } catch (error: any) {
              console.error('Tutor API Error:', error);
              const simulated = getSimulatedTutorResponse(promptText, mode, courseContext);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                text: simulated,
                warning: error.message
              }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

function getSimulatedTutorResponse(prompt: string, mode?: string, courseContext?: any): string {
  const p = (prompt || '').toLowerCase();
  const cTitle = courseContext?.thaiTitle || courseContext?.title || 'รายวิชาที่คุณเลือก';

  if (mode === 'study_tips' || p.includes('tip') || p.includes('เทคนิค') || p.includes('วางแผน')) {
    return `### 💡 แผนการเรียนและ Study Tips เฉพาะบุคคลสำหรับ ${cTitle}

1. **การจัดลำดับความสำคัญ (Urgent Priority)**:
   - **Coding Project (CS30201)**: กำหนดส่งวันพรุ่งนี้ 23:59 น. (ทำไปแล้ว 45%) — ควรมุ่งเน้นส่วน Authentication Middleware และ REST Endpoints ให้เสร็จก่อน
   - **คณิตศาสตร์ (MA30101)**: ค้าง 1 งาน แนะนำให้แบ่งเวลา 30 นาทีทบทวนนิยามของ "อนุพันธ์และลิมิต"

2. **ตารางเวลาแบบ Time-Blocking**:
   - **17:00 - 18:30 น.**: ทบทวน Code Logic และทดสอบ API Endpoints
   - **19:30 - 20:30 น.**: ฝึกทำโจทย์คำนวณ 5 ข้อใน MA30101
   - **20:30 - 21:00 น.**: ทบทวน UI Design Token ใน Figma

3. **เทคนิคการจำ Active Recall**:
   - ลองสรุป Logic ของเรื่องที่เพิ่งเรียนด้วยปากเปล่า 2 นาที`;
  }

  if (mode === 'simplify' || p.includes('อธิบาย') || p.includes('เข้าใจง่าย') || p.includes('คืออะไร')) {
    return `### 🧠 สรุปแบบเข้าใจง่าย: ${prompt}

**🎯 อุปมาอุปไมยในชีวิตประจำวัน:**
ลองเปรียบเทียบเรื่องนี้กับ "ระบบค้นหาหนังสือในห้องสมุด" ที่มีดัชนีหมวดหมู่ชัดเจน แทนที่เราจะต้องเดินดูหนังสือทีละเล่ม (Linear Search) เราสามารถเดินตรงไปยังหมวดและชั้นวางที่ต้องการได้ทันที

**📌 สาระสำคัญ 3 ประเด็นหลัก:**
1. **แก่นของแนวคิด:** ลดความซับซ้อนของขั้นตอนการทำงาน (Time & Space Optimization)
2. **การนำไปใช้จริง:** ระบบ Database Indexing, กราฟเครือข่ายโซเชียลมีเดีย, และการออกแบบ State Management ในแอพพลิเคชัน
3. **ข้อผิดพลาดที่พบบ่อย:** การลืมจัดการ Base Case หรือ Edge Case เมื่อข้อมูลว่างเปล่า

💬 *ต้องการให้ยกตัวอย่างสถานการณ์จริง หรือลองทำข้อสอบทดสอบความเข้าใจเรื่องนี้ไหมครับ?*`;
  }

  return `### 🎓 Nexus AI Tutor พร้อมตอบคำถามครับ!

เกี่ยวกับหัวข้อ **"${prompt}"** (${cTitle}):

- **หลักการสำคัญ:** เริ่มต้นจากการแยกแยะองค์ประกอบหลัก แล้วทำความเข้าใจความสัมพันธ์ของแต่ละส่วน
- **จุดที่ควรรู้:** ในบทเรียนนี้ มีการประยุกต์ใช้ทั้งเชิงทฤษฎีและปฏิบัติการ (Lab) แนะนำให้ทบทวนสไลด์และทำ Quiz ท้ายบท
- **คำแนะนำ:** หากติดขัดตรงจุดไหน สามารถระบุท่อนโค้ดหรือสมการมาให้ผมช่วยวิเคราะห์ทีละบรรทัดได้เลยครับ! 🚀`;
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), devProjectConfigPlugin(), aiTutorPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
