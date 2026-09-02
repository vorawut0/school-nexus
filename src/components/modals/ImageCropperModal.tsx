import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  initialShape?: 'circle' | 'square' | 'portrait';
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  initialShape = 'circle',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop & Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [maskShape, setMaskShape] = useState<'circle' | 'square' | 'portrait'>(initialShape);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Interaction dragging / touch state
  const isDraggingRef = useRef(false);
  const startDragPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1);

  // Reset transforms whenever modal opens with new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setIsFlipped(false);
      setIsImageLoaded(false);
      setMaskShape(initialShape);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        setImageSize({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        setIsImageLoaded(true);
      };
      img.onerror = () => {
        // Fallback
        setIsImageLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc, initialShape]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 4.0));
  };

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startDragPosRef.current = { x: e.clientX, y: e.clientY };
    initialOffsetRef.current = { ...offset };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startDragPosRef.current.x;
    const dy = e.clientY - startDragPosRef.current.y;
    setOffset({
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Touch Drag & Pinch-Zoom Events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startDragPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialOffsetRef.current = { ...offset };
      initialPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - startDragPosRef.current.x;
      const dy = e.touches[0].clientY - startDragPosRef.current.y;
      setOffset({
        x: initialOffsetRef.current.x + dx,
        y: initialOffsetRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleChange = currentDist / initialPinchDistRef.current;
      const nextZoom = Math.min(Math.max(0.5, initialPinchZoomRef.current * scaleChange), 4.0);
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  // Perform Final High-Quality Crop via HTML5 Canvas
  const handleApplyCrop = () => {
    if (!imageSrc) return;

    const img = imgRef.current || new Image();
    const executeCrop = () => {
      const targetSize = 512;
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        onCropComplete(imageSrc);
        onClose();
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill clean background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);

      // Save context for transformations
      ctx.save();

      // Move context origin to the center of the crop canvas
      ctx.translate(targetSize / 2, targetSize / 2);

      // Apply rotation (in radians)
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply horizontal flip
      if (isFlipped) {
        ctx.scale(-1, 1);
      }

      // Viewport crop box is approximately 260px in UI
      const uiCropBoxSize = 260;
      const uiScaleFactor = targetSize / uiCropBoxSize;

      // Base fitted image dimensions in 260px container
      const natW = img.naturalWidth || img.width || 500;
      const natH = img.naturalHeight || img.height || 500;

      // Scale to cover 260px box initially
      const baseScale = Math.max(uiCropBoxSize / natW, uiCropBoxSize / natH);
      const drawWidth = natW * baseScale * zoom * uiScaleFactor;
      const drawHeight = natH * baseScale * zoom * uiScaleFactor;

      // Draw transformed image
      // Note: offset.x and offset.y need to be scaled by uiScaleFactor and account for rotation
      const rad = (-rotation * Math.PI) / 180;
      const unrotatedOffsetX = offset.x * Math.cos(rad) - offset.y * Math.sin(rad);
      const unrotatedOffsetY = offset.x * Math.sin(rad) + offset.y * Math.cos(rad);

      const finalOffsetX = (isFlipped ? -unrotatedOffsetX : unrotatedOffsetX) * uiScaleFactor;
      const finalOffsetY = unrotatedOffsetY * uiScaleFactor;

      ctx.drawImage(
        img,
        -drawWidth / 2 + finalOffsetX,
        -drawHeight / 2 + finalOffsetY,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      // Export compressed base64 JPEG
      try {
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
        onCropComplete(croppedDataUrl);
        onClose();
      } catch (err) {
        console.warn('Canvas export fallback:', err);
        onCropComplete(imageSrc);
        onClose();
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      executeCrop();
    } else {
      img.crossOrigin = 'anonymous';
      img.onload = executeCrop;
      img.onerror = () => {
        onCropComplete(imageSrc);
        onClose();
      };
      img.src = imageSrc;
    }
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setIsFlipped(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-5 sm:p-6 animate-scaleIn relative my-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1550d3] flex items-center justify-center border border-blue-200 shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">crop</span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#121b2e] leading-tight">
                ครอบตัดและปรับสัดส่วนรูปภาพ (Crop & Adjust)
              </h3>
              <p className="text-xs text-[#737686]">
                ลากเลื่อน ซูม และหมุนรูปภาพให้อยู่ในตำแหน่งที่พอดีกับโปรไฟล์
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างครอบตัด"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Mask Shape Toggle */}
        <div className="flex items-center justify-center gap-2 mt-3 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setMaskShape('circle')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              maskShape === 'circle'
                ? 'bg-white text-[#1550d3] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span>
            <span>วงกลมโปรไฟล์ (1:1)</span>
          </button>

          <button
            type="button"
            onClick={() => setMaskShape('square')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              maskShape === 'square'
                ? 'bg-white text-[#1550d3] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">crop_square</span>
            <span>สี่เหลี่ยมบัตรดิจิทัล</span>
          </button>
        </div>

        {/* Cropper Viewport Container */}
        <div className="relative mt-3 w-full aspect-square max-h-[300px] bg-slate-950 rounded-2xl overflow-hidden select-none border border-slate-800 shadow-inner flex items-center justify-center">
          {/* Interactive touch/mouse area */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center"
          >
            {/* The Image being transformed */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                className="max-w-none pointer-events-none transition-transform duration-75 origin-center will-change-transform"
                style={{
                  width: imageSize.width > 0 && imageSize.height > 0
                    ? imageSize.width >= imageSize.height ? 'auto' : '100%'
                    : '100%',
                  height: imageSize.width > 0 && imageSize.height > 0
                    ? imageSize.height >= imageSize.width ? 'auto' : '100%'
                    : '100%',
                  minWidth: '260px',
                  minHeight: '260px',
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
                }}
              />
            )}

            {/* Dark Mask Overlay with transparent cutout */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`relative w-[240px] h-[240px] shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ring-2 ring-white/80 transition-all ${
                  maskShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                }`}
              >
                {/* Rule of thirds grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/50" />
                  <div className="border-r border-b border-white/50" />
                  <div className="border-b border-white/50" />
                  <div className="border-r border-b border-white/50" />
                  <div className="border-r border-b border-white/50" />
                  <div className="border-b border-white/50" />
                  <div className="border-r border-white/50" />
                  <div className="border-r border-white/50" />
                  <div />
                </div>

                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none">
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/70 -translate-x-1/2" />
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/70 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Hint overlay at bottom of viewport */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">pan_tool</span>
                ลากเพื่อเลื่อนตำแหน่ง • หมุนล้อเมาส์หรือบีบนิ้วเพื่อซูม
              </span>
            </div>
          </div>
        </div>

        {/* Zoom Slider & Quick Adjust Controls */}
        <div className="mt-3.5 space-y-2.5">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.15))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer shadow-2xs active:scale-95"
              title="ย่อขนาด"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>

            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-blue-600">zoom_in</span>
                  ระดับการซูม (Zoom)
                </span>
                <span className="font-mono text-blue-600">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#1550d3] cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.5, prev + 0.15))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer shadow-2xs active:scale-95"
              title="ขยายขนาด"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          {/* Transform Toolbar: Rotate, Flip, Center, Reset */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#1550d3] border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="หมุนตามเข็มนาฬิกา 90 องศา"
            >
              <span className="material-symbols-outlined text-[16px]">rotate_right</span>
              <span>หมุน 90°</span>
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className={`py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs ${
                isFlipped
                  ? 'bg-blue-50 border-blue-300 text-[#1550d3]'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-[#1550d3] border-slate-200 text-slate-700'
              }`}
              title="พลิกรูปในแนวนอน"
            >
              <span className="material-symbols-outlined text-[16px]">flip</span>
              <span>พลิกภาพ</span>
            </button>

            <button
              type="button"
              onClick={() => setOffset({ x: 0, y: 0 })}
              className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#1550d3] border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="จัดรูปไว้ตรงกลาง"
            >
              <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
              <span>กึ่งกลาง</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="รีเซ็ตตำแหน่งทั้งหมด"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>รีเซ็ต</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer active:scale-98 transition-all"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-6 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1242b3] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>ตัดและใช้รูปนี้ (Crop & Apply)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
