import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { DEMO_PRESET_USERS, INITIAL_USER, ASSETS } from '../../data/mockData';
import { UserProfile } from '../../types';
import { getStoredAccounts, pushRealtimeNotification } from '../../services/firebaseService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShareId?: () => void;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export interface ScanSessionItem {
  id: string;
  title: string;
  type: 'student_id' | 'faculty_id' | 'room_booking' | 'attendance' | 'library' | 'custom_qr';
  timestamp: string;
  dateString: string;
  rawPayload: string;
  pointsEarned: number;
}

const getInitialTodayScans = (todayStr: string): ScanSessionItem[] => [
  {
    id: 'scan-init-1',
    title: 'เช็กชื่อเข้าโรงเรียน (Main Gate Pass)',
    type: 'attendance',
    timestamp: '07:42 น.',
    dateString: todayStr,
    rawPayload: 'GATE-01-ENTRANCE-PASS',
    pointsEarned: 15,
  },
  {
    id: 'scan-init-2',
    title: 'ยืมหนังสือห้องสมุด (Library RFID/QR)',
    type: 'library',
    timestamp: '10:15 น.',
    dateString: todayStr,
    rawPayload: 'LIB-BOOK-AI-ROBOTICS-9921',
    pointsEarned: 15,
  },
  {
    id: 'scan-init-3',
    title: 'ชำระศูนย์อาหาร (Nexus Cafeteria)',
    type: 'custom_qr',
    timestamp: '12:20 น.',
    dateString: todayStr,
    rawPayload: 'CAFE-PAY-ORDER-8821',
    pointsEarned: 15,
  },
];

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenShareId,
}) => {
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'prompting' | 'starting' | 'active' | 'denied' | 'unsupported'
  >('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPlatformGuide, setShowPlatformGuide] = useState<boolean>(false);
  const [platformType, setPlatformType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [rawScannedText, setRawScannedText] = useState<string | null>(null);
  const [scannedProfile, setScannedProfile] = useState<UserProfile | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [friendAdded, setFriendAdded] = useState<boolean>(false);
  const [customIdInput, setCustomIdInput] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState<boolean>(false);

  // Today's Scans Counter & History State
  const [scanHistory, setScanHistory] = useState<ScanSessionItem[]>([]);
  const [showHistoryList, setShowHistoryList] = useState<boolean>(false);
  const [justScannedAnim, setJustScannedAnim] = useState<boolean>(false);
  const [autoClosingCountdown, setAutoClosingCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<any>(null);
  const autoCloseIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const nativeDetectorRef = useRef<any>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Detect OS / Platform on mount
  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setPlatformType('ios');
    } else if (/Android/.test(ua)) {
      setPlatformType('android');
    } else {
      setPlatformType('desktop');
    }

    // Check BarcodeDetector native API support
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const formats = ['qr_code'];
        (window as any).BarcodeDetector.getSupportedFormats?.().then((supportedFormats: string[]) => {
          if (supportedFormats && supportedFormats.includes('qr_code')) {
            nativeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            setBarcodeDetectorSupported(true);
          }
        }).catch(() => {
          // Fallback to jsQR
        });
      } catch {
        // Fallback to jsQR
      }
    }
  }, []);

  // Enumerate video devices (Front/Back cameras, USB cams)
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `กล้องตัวที่ ${index + 1} (${d.deviceId.slice(0, 5)}...)`,
        }));
      setAvailableDevices(videoInputs);
    } catch {
      // Ignore device enumeration failure
    }
  }, []);

  // Sound and Haptic feedback
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio might be restricted until user touch
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate([50, 40, 90]);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Stop camera cleanly across all platforms
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    isProcessingFrameRef.current = false;
  }, []);

  // Load / Initialize Today's Scans on mount
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const rawStored = localStorage.getItem('school_nexus_scans_today');
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (parsed && parsed.date === todayStr && Array.isArray(parsed.history)) {
          setScanHistory(parsed.history);
          return;
        }
      }
      // Initialize with realistic mock scans for today
      const initialScans = getInitialTodayScans(todayStr);
      setScanHistory(initialScans);
      localStorage.setItem(
        'school_nexus_scans_today',
        JSON.stringify({ date: todayStr, history: initialScans })
      );
    } catch {
      const todayStr = new Date().toISOString().slice(0, 10);
      setScanHistory(getInitialTodayScans(todayStr));
    }
  }, []);

  // Record a new scan into today's counter & session history
  const recordScanSession = useCallback(
    (title: string, type: ScanSessionItem['type'], rawPayload: string) => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const timeStr =
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

      const newItem: ScanSessionItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        type,
        timestamp: timeStr,
        dateString: todayStr,
        rawPayload,
        pointsEarned: 15,
      };

      setScanHistory((prev) => {
        const updated = [newItem, ...prev];
        try {
          localStorage.setItem(
            'school_nexus_scans_today',
            JSON.stringify({ date: todayStr, history: updated })
          );
        } catch {
          // Ignore
        }
        return updated;
      });

      // Dispatch event to sync admin live gate traffic & scan counter
      try {
        window.dispatchEvent(
          new CustomEvent('sn_gate_scanned', {
            detail: {
              userName: title.replace('สแกนโปรไฟล์: ', '').replace('สแกนรหัส: ', ''),
              userRole: type === 'faculty_id' ? 'อาจารย์/บุคลากร' : type === 'student_id' ? 'นักเรียน' : 'ผู้ใช้งาน',
              gate: 'Smart Gate 01 (NFC/QR)',
              success: true,
            },
          })
        );
      } catch {
        // Ignore
      }

      setJustScannedAnim(true);
      setTimeout(() => setJustScannedAnim(false), 3000);
    },
    []
  );

  // Clear today's history
  const handleClearHistory = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setScanHistory([]);
    try {
      localStorage.setItem(
        'school_nexus_scans_today',
        JSON.stringify({ date: todayStr, history: [] })
      );
    } catch {
      // Ignore
    }
  };

  // Parse ID or matched student profile
  const matchAndSetProfile = useCallback((id: string, fallbackName?: string, originalText?: string) => {
    const trimmedId = id.trim();
    const lowerId = trimmedId.toLowerCase();
    const payloadText = originalText || id;
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    // 1. Check all registered accounts first
    const storedAccounts = getStoredAccounts();
    const matchedAccount = storedAccounts.find(
      (a) =>
        a.id.toLowerCase() === lowerId ||
        (a.studentId && a.studentId.toLowerCase() === lowerId) ||
        (a.email && a.email.toLowerCase() === lowerId) ||
        (a.thaiName && a.thaiName.includes(trimmedId)) ||
        (a.name && a.name.toLowerCase().includes(lowerId)) ||
        (a.user?.rfidCard && a.user.rfidCard.toLowerCase() === lowerId)
    );

    if (matchedAccount && matchedAccount.user) {
      const u = matchedAccount.user;
      setScannedProfile(u);
      setScanResult(`🔍 สแกนพบโปรไฟล์: ${u.thaiName} (${u.studentId || u.role})`);
      recordScanSession(`สแกนโปรไฟล์: ${u.thaiName}`, u.role === 'teacher' || u.role === 'admin' ? 'faculty_id' : 'student_id', payloadText);

      // If student scanned at gate or campus, notify parent and teacher
      if (u.role === 'student') {
        pushRealtimeNotification({
          title: `🚌 แจ้งเตือนการแตะบัตร: ${u.thaiName}`,
          message: `นักเรียนได้แตะบัตร Smart Digital ID / QR เข้าโรงเรียนเรียบร้อย (เวลา ${timeNow}) สถานะ: เข้าโรงเรียนปกติ`,
          type: 'attendance',
          priority: 'normal',
          role: 'parent',
          icon: 'how_to_reg',
        });
      }
      return;
    }

    if (
      trimmedId.includes('55104') ||
      trimmedId.toLowerCase().includes('tch') ||
      trimmedId.toLowerCase().includes('teach')
    ) {
      setScannedProfile(DEMO_PRESET_USERS.teacher);
      setScanResult('🔍 สแกนพบโปรไฟล์อาจารย์: อ.กิตติพงษ์ เลิศพิริยะ');
      recordScanSession('สแกนโปรไฟล์อาจารย์: อ.กิตติพงษ์ เลิศพิริยะ', 'faculty_id', payloadText);
    } else if (trimmedId.includes('188') || trimmedId.toLowerCase().includes('nat')) {
      const classmateProfile: UserProfile = {
        id: 'sn-std-02',
        name: 'NATTHAPHON SIRIPHAN',
        thaiName: 'ณัฐพล ศิริพันธ์ (กันต์)',
        studentId: '66040188',
        email: 'natthaphon.s@schoolnexus.ac.th',
        role: 'student',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        streakDays: 14,
        grade: 'มัธยมศึกษาปีที่ 6/1',
        room: 'ห้อง 601 (Sci-Tech AI)',
        major: 'วิทยาการคอมพิวเตอร์และหุ่นยนต์',
        gpa: 3.88,
        advisor: 'ดร. สมนึก เจริญศิลป์',
        rfidCard: 'NFC-SN-7731-2026',
      };
      setScannedProfile(classmateProfile);
      setScanResult('🔍 สแกนพบโปรไฟล์เพื่อนร่วมชั้น: ณัฐพล ศิริพันธ์ (ม.6/1)');
      recordScanSession('สแกนโปรไฟล์เพื่อน: ณัฐพล ศิริพันธ์ (ม.6/1)', 'student_id', payloadText);
    } else if (trimmedId.includes('ADM') || trimmedId.toLowerCase().includes('admin')) {
      setScannedProfile(DEMO_PRESET_USERS.admin);
      setScanResult('🔍 สแกนพบโปรไฟล์ผู้ดูแลระบบ: IT Administrator');
      recordScanSession('สแกนโปรไฟล์ผู้ดูแล: IT Administrator', 'faculty_id', payloadText);
    } else {
      setScannedProfile(INITIAL_USER);
      const studentName = fallbackName || INITIAL_USER.thaiName;
      setScanResult(`🔍 สแกนพบโปรไฟล์นักเรียน: ${studentName}`);
      recordScanSession(`สแกนโปรไฟล์นักเรียน: ${studentName}`, 'student_id', payloadText);
    }
  }, [recordScanSession]);

  // Process decoded QR payload
  const handleDecodedData = useCallback(
    (text: string) => {
      if (!text || text.trim().length === 0) return;
      playBeep();
      setIsScanning(false);
      setRawScannedText(text);
      setFriendAdded(false);
      setCopiedText(false);

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      const trimmed = text.trim();

      // Check if JSON
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.studentId || parsed.id) {
            const id = parsed.studentId || parsed.id;
            matchAndSetProfile(id, parsed.name, text);
            return;
          }
        } catch {
          // Ignore JSON parse fail
        }
      }

      // Check URL search params
      try {
        if (trimmed.includes('http://') || trimmed.includes('https://')) {
          const url = new URL(trimmed);
          const idParam =
            url.searchParams.get('id') ||
            url.searchParams.get('studentId') ||
            url.searchParams.get('user');
          if (idParam) {
            matchAndSetProfile(idParam, undefined, text);
            return;
          }
        }
      } catch {
        // Ignore URL parse fail
      }

      // Check Student ID format (66XXXXXX or numbers)
      if (/^\d{8}$/.test(trimmed) || trimmed.startsWith('sn-') || trimmed.startsWith('SN-')) {
        matchAndSetProfile(trimmed, undefined, text);
        return;
      }

      // Check Room Booking code (SN-BOOK or NX-XXXX)
      if (trimmed.includes('BOOK') || trimmed.startsWith('NX-') || trimmed.includes('CS402')) {
        setScanResult(`🎫 สแกนพบรหัสการจองห้อง: ${trimmed}`);
        recordScanSession(`สแกนรหัสการจองห้อง: ${trimmed}`, 'room_booking', text);
        return;
      }

      setScanResult(`สแกน QR Code สำเร็จ: ${trimmed}`);
      recordScanSession(`สแกน QR Code: ${trimmed.length > 25 ? trimmed.slice(0, 25) + '...' : trimmed}`, 'custom_qr', text);

      // Trigger automatic close with countdown & subtle success animation
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current);

      setAutoClosingCountdown(3);
      autoCloseIntervalRef.current = setInterval(() => {
        setAutoClosingCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 750);

      autoCloseTimerRef.current = setTimeout(() => {
        if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current);
        stopCamera();
        onClose();
      }, 2350);
    },
    [matchAndSetProfile, playBeep, recordScanSession, stopCamera, onClose]
  );

  // Fast Dual-Engine QR Loop (Hardware BarcodeDetector + jsQR Fallback)
  const tick = useCallback(async () => {
    if (!isMountedRef.current || !isScanning) return;

    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      if (isScanning) {
        animationFrameId.current = requestAnimationFrame(tick);
      }
      return;
    }

    // Strategy 1: Native BarcodeDetector (Hardware Accelerated)
    if (nativeDetectorRef.current && !isProcessingFrameRef.current) {
      isProcessingFrameRef.current = true;
      try {
        const barcodes = await nativeDetectorRef.current.detect(video);
        if (barcodes && barcodes.length > 0) {
          const rawVal = barcodes[0].rawValue;
          if (rawVal && rawVal.trim().length > 0) {
            isProcessingFrameRef.current = false;
            handleDecodedData(rawVal);
            return;
          }
        }
      } catch {
        // Fall through to jsQR if detector fails on frame
      }
      isProcessingFrameRef.current = false;
    }

    // Strategy 2: High-Performance jsQR Canvas Analysis
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Optimize canvas resolution for speed while keeping crisp QR legibility
        const maxDimension = 640;
        let width = video.videoWidth;
        let height = video.videoHeight;
        if (width > maxDimension || height > maxDimension) {
          const ratio = width / height;
          if (ratio > 1) {
            width = maxDimension;
            height = Math.round(maxDimension / ratio);
          } else {
            height = maxDimension;
            width = Math.round(maxDimension * ratio);
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);

        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim().length > 0) {
            handleDecodedData(code.data);
            return;
          }
        } catch {
          // Ignore minor frame read glitch
        }
      }
    }

    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(tick);
    }
  }, [handleDecodedData, isScanning]);

  // Comprehensive Cross-Platform Camera Request Strategy
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraStatus('prompting');
    setErrorMessage(null);

    // Verify mediaDevices support
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const legacyGetUserMedia =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (!hasMediaDevices && !legacyGetUserMedia) {
      setCameraStatus('unsupported');
      setErrorMessage(
        'เบราว์เซอร์นี้ไม่รองรับ API กล้องถ่ายรูป กรุณาใช้วิธีอัปโหลดรูปภาพ QR หรือพิมพ์รหัสเพื่อค้นหา'
      );
      return;
    }

    let stream: MediaStream | null = null;
    let lastError: any = null;

    // Constraint Pipeline Tier 1: Target selected device ID if user manually chose one
    if (selectedDeviceId) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e1) {
        lastError = e1;
      }
    }

    // Constraint Pipeline Tier 2: Ideal mobile facingMode (environment / back camera)
    if (!stream && hasMediaDevices) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });
      } catch (e2) {
        lastError = e2;
      }
    }

    // Constraint Pipeline Tier 3: Simple string facingMode (for Safari iOS & WebKit)
    if (!stream && hasMediaDevices) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
          },
          audio: false,
        });
      } catch (e3) {
        lastError = e3;
      }
    }

    // Constraint Pipeline Tier 4: Basic { video: true } (most permissive fallback)
    if (!stream && hasMediaDevices) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (e4) {
        lastError = e4;
      }
    }

    // Constraint Pipeline Tier 5: Legacy getUserMedia (older WebViews / Android stock)
    if (!stream && legacyGetUserMedia) {
      try {
        stream = await new Promise<MediaStream>((resolve, reject) => {
          legacyGetUserMedia.call(navigator, { video: true, audio: false }, resolve, reject);
        });
      } catch (e5) {
        lastError = e5;
      }
    }

    // If all stream attempts failed, show tailored error
    if (!stream) {
      setCameraStatus('denied');
      if (lastError) {
        if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
          setErrorMessage(
            'เบราว์เซอร์หรืออุปกรณ์ไม่อนุญาตให้เข้าถึงกล้อง กรุณากด "อนุญาต (Allow)" ในแถบแจ้งเตือน หรือปลดล็อกในการตั้งค่า'
          );
        } else if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
          setErrorMessage('ไม่พบอุปกรณ์กล้องเชื่อมต่ออยู่ในเครื่องของคุณ');
        } else if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
          setErrorMessage('กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดโปรแกรมอื่นแล้วลองใหม่');
        } else if (lastError.name === 'OverconstrainedError') {
          setErrorMessage('ความละเอียดกล้องที่ร้องขอไม่ตรงกับอุปกรณ์ กำลังปรับแต่งอัตโนมัติ...');
        } else {
          setErrorMessage(`ไม่สามารถเปิดกล้องได้: ${lastError.message || 'โปรดตรวจสอบการอนุญาตสิทธิ์'}`);
        }
      }
      return;
    }

    // Camera successfully acquired
    if (stream && isMountedRef.current) {
      streamRef.current = stream;
      setCameraStatus('starting');

      // Detect hardware features (Torch, Zoom)
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorch(Boolean(capabilities.torch));
          if (capabilities.zoom) {
            setMaxZoom(capabilities.zoom.max || 3);
          }
        } catch {
          // Ignore capability check
        }
      }

      // Enumerate devices now that permission is granted (to get real camera labels)
      refreshDevices();

      // Bind to video element with iOS / WebKit compatibility
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;
        video.controls = false;

        const onReadyToPlay = async () => {
          try {
            await video.play();
            setCameraStatus('active');
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
            animationFrameId.current = requestAnimationFrame(tick);
          } catch (playErr) {
            console.warn('Video play promise caught:', playErr);
            setCameraStatus('active');
            // Re-attempt play on user click if autoplay was blocked
          }
        };

        video.onloadedmetadata = onReadyToPlay;
        video.oncanplay = onReadyToPlay;

        // Immediate play attempt
        try {
          await video.play();
          setCameraStatus('active');
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
          animationFrameId.current = requestAnimationFrame(tick);
        } catch {
          // Waiting for onloadedmetadata
        }
      }
    }
  }, [facingMode, selectedDeviceId, stopCamera, tick, refreshDevices]);

  // Live Permission Watcher
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions
          .query({ name: 'camera' as any })
          .then((status) => {
            status.onchange = () => {
              if (status.state === 'granted' && isOpen && cameraStatus !== 'active') {
                startCamera();
              }
            };
          })
          .catch(() => {
            // Permission query not supported on this browser (Safari)
          });
      } catch {
        // Ignore
      }
    }
  }, [isOpen, cameraStatus, startCamera]);

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track: any = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Could not toggle torch', e);
      }
    }
  };

  // Flip Camera (Front / Back)
  const handleFlipCamera = () => {
    setSelectedDeviceId('');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch specific camera lens / device
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  // Adjust Zoom (if hardware supported)
  const handleZoomChange = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (!streamRef.current) return;
    const track: any = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom }],
        });
      } catch {
        // Ignore zoom error
      }
    }
  };

  // Upload QR image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleDecodedData(code.data);
          } else {
            setScanResult('⚠️ ไม่พบข้อมูล QR Code ในรูปภาพที่เลือก กรุณาลองใช้รูปภาพอื่น');
            setIsScanning(false);
          }
        } catch {
          setScanResult('⚠️ เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
          setIsScanning(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reset Scanner
  const handleResetScan = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current);
    setAutoClosingCountdown(null);
    setIsScanning(true);
    setScanResult(null);
    setRawScannedText(null);
    setScannedProfile(null);
    setFriendAdded(false);
    setCopiedText(false);

    if (cameraStatus === 'active') {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(tick);
    } else {
      startCamera();
    }
  };

  // Manual code form submit
  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdInput.trim()) return;
    handleDecodedData(customIdInput);
    setCustomIdInput('');
  };

  // Copy Scanned payload
  const handleCopyScannedText = () => {
    if (rawScannedText) {
      navigator.clipboard?.writeText(rawScannedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Demo QR presets
  const handleTestDemoQR = (type: 'student' | 'classmate' | 'teacher' | 'booking') => {
    if (type === 'student') {
      handleDecodedData(INITIAL_USER.studentId);
    } else if (type === 'classmate') {
      handleDecodedData('66040188');
    } else if (type === 'teacher') {
      handleDecodedData('TCH-55104');
    } else {
      handleDecodedData('SN-BOOK-CS402-NX4028-20260818');
    }
  };

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setIsScanning(true);
      setScanResult(null);
      setScannedProfile(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, facingMode, selectedDeviceId, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121b2e] text-white rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden border border-slate-700 flex flex-col animate-scaleIn my-auto relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/60 flex justify-between items-center bg-[#18233a]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">กล้องสแกน Smart QR & ID</h3>
                {barcodeDetectorSupported && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono border border-emerald-500/40">
                    AI/GPU ACCELERATED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                สแกน QR บัตรประจำตัวและจุดเช็กชื่อ
              </p>
            </div>
          </div>

          {/* Close Cross Button */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="ปิดกล้องสแกน"
            className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300 transition-all cursor-pointer border border-white/10 active:scale-95 shadow-xs"
            title="กดกากบาทเพื่อปิด (Esc)"
          >
            <span className="text-xs font-bold hidden sm:inline">ปิด</span>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Browser Permission Callout Banner */}
        {cameraStatus === 'prompting' && (
          <div className="bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2.5 animate-pulse">
            <span className="material-symbols-outlined text-amber-300 text-[20px] shrink-0">
              photo_camera
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-200">
                กำลังเปิดใช้งานกล้องในเครื่องของคุณ...
              </p>
              <p className="text-[11px] text-slate-300">
                {platformType === 'ios'
                  ? 'หากมีหน้าต่างจาก Safari ให้กด "อนุญาต (Allow)"'
                  : 'หากมีหน้าต่างจากเบราว์เซอร์ กรุณากด "อนุญาต (Allow)"'}
              </p>
            </div>
          </div>
        )}

        {/* Today's Scans Counter Banner */}
        <div className="w-full bg-gradient-to-r from-slate-900/90 via-[#162238] to-slate-900/90 border-b border-cyan-500/20 px-4 py-3 flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold transition-all ${
                    justScannedAnim ? 'scale-110 ring-4 ring-cyan-400/50 bg-cyan-500/30' : ''
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-cyan-300">
                    {scanHistory.length}
                  </span>
                </div>
                {justScannedAnim && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce shadow-md">
                    +1
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">สแกนวันนี้ (Scans Today)</span>
                  <span className="text-[10px] bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.2 rounded-md font-semibold">
                    +{scanHistory.length * 15} XP
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {scanHistory.length === 0
                    ? 'ยังไม่มีการสแกนในวันนี้'
                    : `สแกนล่าสุด: ${scanHistory[0].title} (${scanHistory[0].timestamp})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHistoryList(!showHistoryList)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                  showHistoryList
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {showHistoryList ? 'expand_less' : 'history'}
                </span>
                <span>ประวัติวันนี้ ({scanHistory.length})</span>
              </button>
            </div>
          </div>

          {/* Collapsible Today's Scans Timeline Drawer */}
          {showHistoryList && (
            <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  รายการสแกนทั้งหมดของวันนี้ ({new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})
                </span>
                {scanHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-0.5"
                    title="ล้างตัวนับสแกนวันนี้"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                    <span>รีเซ็ตตัวนับ</span>
                  </button>
                )}
              </div>

              {scanHistory.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                  ยังไม่มีบันทึกการสแกนในวันนี้
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {scanHistory.map((item, idx) => {
                    const getIcon = () => {
                      if (item.type === 'attendance') return { icon: 'door_sliding', color: 'text-amber-300' };
                      if (item.type === 'library') return { icon: 'menu_book', color: 'text-blue-300' };
                      if (item.type === 'student_id') return { icon: 'badge', color: 'text-cyan-300' };
                      if (item.type === 'faculty_id') return { icon: 'school', color: 'text-purple-300' };
                      if (item.type === 'room_booking') return { icon: 'meeting_room', color: 'text-emerald-300' };
                      return { icon: 'qr_code_scanner', color: 'text-slate-300' };
                    };
                    const iconCfg = getIcon();
                    return (
                      <div
                        key={item.id || idx}
                        className="bg-slate-950/60 hover:bg-slate-950/90 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`material-symbols-outlined text-[16px] ${iconCfg.color} shrink-0`}>
                            {iconCfg.icon}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-white font-medium truncate">{item.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono truncate">
                              {item.rawPayload}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-emerald-400 font-bold font-mono">
                            +{item.pointsEarned} XP
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden Canvas & Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Main Content Area */}
        <div className="p-4 sm:p-5 flex flex-col items-center gap-3.5">
          {/* Active Live Video Stream or Viewfinder */}
          {isScanning && (
            <div className="relative w-full max-w-[340px] aspect-square bg-slate-950 rounded-3xl border-2 border-cyan-400/60 overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.25)] flex items-center justify-center">
              {/* Real Video Element with universal WebKit / Android compliance */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
                playsInline
                webkit-playsinline="true"
                autoPlay
                muted
                controls={false}
              />

              {/* Viewfinder Target Box Overlay */}
              {cameraStatus === 'active' && (
                <div className="absolute inset-6 sm:inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                  {/* 4 Corner Markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                  {/* Laser Scanning Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_2.2s_infinite_ease-in-out] shadow-[0_0_12px_rgba(6,182,212,0.95)]" />
                </div>
              )}

              {/* Top Controls Overlay */}
              <div className="absolute top-3 inset-x-3 flex justify-between items-center pointer-events-auto z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold border border-white/10">
                  {cameraStatus === 'active' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-300">
                        {facingMode === 'environment' ? 'กล้องหลัง' : 'กล้องหน้า'}
                      </span>
                    </>
                  ) : cameraStatus === 'starting' || cameraStatus === 'prompting' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-amber-300">กำลังเชื่อมต่อกล้อง...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-rose-300">กล้องยังไม่เปิด</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Torch Toggle */}
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        torchOn
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title="เปิด/ปิดไฟแฟลช"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {torchOn ? 'flash_on' : 'flash_off'}
                      </span>
                    </button>
                  )}

                  {/* Flip Front/Back Camera */}
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all"
                    title="สลับกล้องหน้า/หลัง"
                  >
                    <span className="material-symbols-outlined text-[16px]">flip_camera_ios</span>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Zoom Buttons (Mobile) */}
              {maxZoom > 1 && cameraStatus === 'active' && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => handleZoomChange(1)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      zoomLevel === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-black/60 text-white'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomChange(2)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      zoomLevel === 2 ? 'bg-cyan-500 text-slate-950' : 'bg-black/60 text-white'
                    }`}
                  >
                    2x
                  </button>
                </div>
              )}

              {/* Camera Starting / Prompting Loader */}
              {(cameraStatus === 'starting' || cameraStatus === 'prompting') && (
                <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-5 text-center gap-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-pulse border border-cyan-400/30">
                    <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
                  </div>
                  <p className="text-sm text-cyan-300 font-bold">กำลังเปิดกล้อง...</p>
                  <p className="text-xs text-slate-300 max-w-[240px]">
                    ระบบกำลังเชื่อมต่อไปยังกล้องในเครื่องของคุณ
                  </p>
                </div>
              )}

              {/* Camera Denied / Error Screen */}
              {cameraStatus === 'denied' && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center gap-2.5 z-20 overflow-y-auto">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <span className="material-symbols-outlined text-2xl">videocam_off</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">ต้องการการอนุญาตเข้าถึงกล้อง</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-[260px]">
                    {errorMessage || 'กดปุ่มด้านล่างเพื่ออนุญาตให้เบราว์เซอร์เข้าถึงกล้อง'}
                  </p>

                  <div className="flex flex-col gap-2 w-full max-w-[240px] mt-1">
                    <button
                      onClick={startCamera}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs hover:from-cyan-300 hover:to-blue-400 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                      <span>กดอนุญาตและเปิดกล้อง</span>
                    </button>

                    <button
                      onClick={() => setShowPlatformGuide(!showPlatformGuide)}
                      className="text-[11px] text-cyan-300 hover:underline flex items-center justify-center gap-1 py-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">help</span>
                      <span>{showPlatformGuide ? 'ซ่อนวิธีตั้งค่า' : `วิธีตั้งค่าสำหรับ ${platformType === 'ios' ? 'iPhone/iPad' : platformType === 'android' ? 'Android' : 'คอมพิวเตอร์'}`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Multiple Cameras Selector (if 2+ cameras detected) */}
          {availableDevices.length > 1 && (
            <div className="w-full max-w-[340px] flex items-center gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700 text-xs">
              <span className="material-symbols-outlined text-cyan-400 text-[16px]">videocam</span>
              <span className="text-slate-400 text-[11px] shrink-0">เลือกเลนส์:</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => handleSelectDevice(e.target.value)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none flex-1 truncate cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">
                  กล้องเริ่มต้นอัตโนมัติ ({facingMode === 'environment' ? 'กล้องหลัง' : 'กล้องหน้า'})
                </option>
                {availableDevices.map((dev) => (
                  <option key={dev.deviceId} value={dev.deviceId} className="bg-slate-900 text-white">
                    {dev.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cross-Platform Step-by-Step Permission Help */}
          {cameraStatus === 'denied' && showPlatformGuide && (
            <div className="w-full bg-[#18233a] rounded-2xl p-4 border border-cyan-500/30 text-xs text-slate-200 flex flex-col gap-2.5 animate-fadeIn shadow-md">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <span>
                  วิธีเปิดสิทธิ์กล้อง ({platformType === 'ios' ? 'iOS Safari' : platformType === 'android' ? 'Android Chrome' : 'Google Chrome / Edge'}):
                </span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-300 pl-1">
                {platformType === 'ios' ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>แตะที่ไอคอน <b>"aA"</b> หรือ <b>"การตั้งค่าเว็บไซต์"</b> ทางซ้ายของช่องใส่ที่อยู่เว็บ</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>เลือกหัวข้อ <b>"กล้อง (Camera)"</b> และเปลี่ยนเป็น <b>"อนุญาต (Allow)"</b></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>(หรือไปที่ <i>การตั้งค่าเครื่อง iOS &gt; Safari &gt; กล้อง &gt; อนุญาต</i>) แล้วกดเปิดกล้องใหม่</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>คลิกไอคอน <b>🔒 แม่กุญแจ</b> หรือ <b>📷 กล้อง</b> ที่แถบพิมพ์ URL ด้านบน</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>เปลี่ยนสิทธิ์ของหัวข้อ <b>"กล้อง (Camera)"</b> เป็น <b>"อนุญาต (Allow)"</b></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>กดปุ่ม <b>"กดอนุญาตและเปิดกล้อง"</b> ด้านบนเพื่อเริ่มสแกน</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Auto-closing subtle success animation banner */}
          {autoClosingCountdown !== null && (
            <div className="w-full bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-emerald-500/20 border border-emerald-400/50 rounded-2xl p-3 flex items-center justify-between animate-scaleIn shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-bounce">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-200">
                    สแกน QR Code สำเร็จเรียบร้อย!
                  </div>
                  <div className="text-[10px] text-emerald-300/80">
                    ระบบจะปิดหน้าต่างอัตโนมัติใน <span className="font-mono font-bold text-white text-xs">{autoClosingCountdown}</span> วินาที
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
                  if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current);
                  setAutoClosingCountdown(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 hover:text-white text-[11px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
              >
                คงหน้านี้ไว้
              </button>
            </div>
          )}

          {/* Scanned Student Profile Result Card */}
          {scannedProfile ? (
            <div className="w-full bg-slate-800/90 rounded-2xl p-5 border border-cyan-400/40 shadow-xl flex flex-col items-center animate-scaleIn">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>สแกนพบโปรไฟล์ถูกต้อง (Verified ID)</span>
                </div>
                <button
                  onClick={handleResetScan}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>สแกนใหม่</span>
                </button>
              </div>

              {/* Student Header */}
              <div className="flex items-center gap-3.5 w-full mt-4">
                <img
                  src={scannedProfile.avatar || ASSETS.cardAvatar}
                  alt={scannedProfile.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-400/60 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-white truncate">
                    {scannedProfile.name}
                  </h4>
                  <p className="text-xs text-cyan-300 font-medium">{scannedProfile.thaiName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[11px] bg-slate-700/80 px-2 py-0.5 rounded-md text-slate-300">
                      ID: {scannedProfile.studentId}
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold uppercase">
                      {scannedProfile.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2.5 w-full mt-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 text-xs">
                {scannedProfile.role === 'student' ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ระดับชั้น / ห้อง</span>
                      <span className="font-semibold text-slate-200">{scannedProfile.grade || 'มัธยมศึกษาปีที่ 6/1'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">แผนการเรียน</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.studyTrack || 'วิทยาศาสตร์-คณิตศาสตร์'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">สถานะนักเรียน</span>
                      <span className="font-bold text-emerald-400">
                        {scannedProfile.dutyStatus || 'กำลังศึกษา (Active)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">สถานะบัตรดิจิทัล</span>
                      <span className="text-emerald-400 font-bold">● เปิดใช้งานปกติ</span>
                    </div>
                  </>
                ) : scannedProfile.role === 'teacher' ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ตำแหน่ง</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.position || 'อาจารย์ชำนาญการพิเศษ'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">กลุ่มสาระฯ</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.department || 'วิทยาศาสตร์และเทคโนโลยี'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">สถานะปฏิบัติงาน</span>
                      <span className="font-bold text-emerald-400">
                        {scannedProfile.dutyStatus || 'ปฏิบัติการสอน (Active)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ห้องพักอาจารย์</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.officeRoom || 'ห้อง 401 อาคาร 4'}
                      </span>
                    </div>
                  </>
                ) : scannedProfile.role === 'admin' ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ตำแหน่งหน้าที่</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.position || 'ผู้ดูแลระบบไอที'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">หน่วยงาน</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.department || 'ศูนย์เทคโนโลยีสารสนเทศ'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">สถานะระบบ</span>
                      <span className="font-bold text-emerald-400">
                        {scannedProfile.dutyStatus || 'ปฏิบัติหน้าที่ (Active)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ห้องควบคุม</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.officeRoom || 'Server Room อาคาร 1'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block">นักเรียนในความดูแล</span>
                      <span className="font-semibold text-slate-200">
                        {scannedProfile.childName || 'วรวุฒิ เพ็ชรระยา (ม.6/1)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">สังกัด</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {scannedProfile.department || 'สมาคมผู้ปกครองและครู'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">สถานะการยืนยัน</span>
                      <span className="font-bold text-emerald-400">
                        {scannedProfile.dutyStatus || 'ยืนยันตัวตนแล้ว (Verified)'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Today's Scan Order Badge */}
              <div className="w-full mt-2.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-[11px]">
                <span className="text-cyan-300 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-cyan-400">task_alt</span>
                  <span>บันทึกเป็นรายการสแกนที่ <b>#{scanHistory.length}</b> ของวันนี้</span>
                </span>
                <span className="text-emerald-400 font-bold text-[10px]">ตรวจสอบสมบูรณ์</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full mt-4">
                <button
                  type="button"
                  onClick={() => setFriendAdded(true)}
                  disabled={friendAdded}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    friendAdded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {friendAdded ? 'check' : 'person_add'}
                  </span>
                  <span>{friendAdded ? 'เชื่อมต่อเพื่อนแล้ว ✓' : 'เพิ่มเป็นเพื่อนใน Nexus'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  สแกนต่อ
                </button>
              </div>
            </div>
          ) : scanResult && !isScanning ? (
            /* General Scanned Text Result */
            <div className="w-full bg-slate-800/90 rounded-2xl p-4 border border-cyan-400/30 flex flex-col gap-3 animate-scaleIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs font-bold text-cyan-300">ข้อมูลที่สแกนได้ (Scanned Result):</span>
                <button
                  onClick={handleResetScan}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>สแกนใหม่</span>
                </button>
              </div>

              <p className="text-xs text-white bg-slate-900/90 p-3 rounded-xl border border-slate-700 font-mono break-all leading-relaxed">
                {rawScannedText || scanResult}
              </p>

              {/* Today's Scan Order Badge */}
              <div className="w-full px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-[11px]">
                <span className="text-cyan-300 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-cyan-400">task_alt</span>
                  <span>บันทึกเป็นรายการสแกนที่ <b>#{scanHistory.length}</b> ของวันนี้</span>
                </span>
                <span className="text-emerald-400 font-bold font-mono">+15 XP</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyScannedText}
                  className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedText ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedText ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  สแกนโค้ดถัดไป
                </button>
              </div>
            </div>
          ) : null}

          {/* Quick Action Tools Bar */}
          <div className="w-full grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-cyan-400">image</span>
              <span>เลือกภาพ QR จากคลัง</span>
            </button>

            {onOpenShareId && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                  onOpenShareId();
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-400">qr_code</span>
                <span>แสดง QR ของฉัน</span>
              </button>
            )}
          </div>

          {/* Demo Simulation Presets for Testing */}
          <div className="w-full flex flex-col gap-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ทดลองสแกนข้อมูลตัวอย่าง (Demo Simulation):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleTestDemoQR('classmate')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 cursor-pointer"
              >
                👥 บัตรเพื่อน (ม.6/1)
              </button>
              <button
                type="button"
                onClick={() => handleTestDemoQR('teacher')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 cursor-pointer"
              >
                👨‍🏫 บัตรอาจารย์
              </button>
              <button
                type="button"
                onClick={() => handleTestDemoQR('booking')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 cursor-pointer"
              >
                🚪 บัตรจองห้อง (Lab 402)
              </button>
            </div>
          </div>

          {/* Manual ID Input Fallback */}
          <form onSubmit={handleManualScan} className="w-full flex gap-2">
            <input
              type="text"
              value={customIdInput}
              onChange={(e) => setCustomIdInput(e.target.value)}
              placeholder="หรือพิมพ์รหัสนักเรียน / ข้อความ QR ที่นี่..."
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
            >
              ค้นหา
            </button>
          </form>

          {/* Close Button at Bottom */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>ปิดกล้องสแกน (Exit Scanner)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
