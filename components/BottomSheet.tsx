"use client";

import { useRef, type ReactNode } from "react";
import { haptics } from "@/lib/haptics";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}

export function BottomSheet({ open, onClose, title, children, maxHeight = "70vh" }: BottomSheetProps) {
  const startY = useRef(0);
  const currentY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      if (panelRef.current) {
        panelRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentY.current > 100) {
      haptics.soft();
      onClose();
    } else if (panelRef.current) {
      panelRef.current.style.transform = "translateY(0)";
    }
    currentY.current = 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative w-full max-w-lg bg-[var(--background)] border-t border-[var(--border-strong)] rounded-t-2xl flex flex-col animate-slide-up"
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-orange-200/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-orange-900/20">
            <h3 className="text-sm font-semibold text-orange-200 font-[family-name:var(--font-display)]">
              {title}
            </h3>
            <button
              onClick={() => {
                haptics.soft();
                onClose();
              }}
              aria-label="Close"
              className="w-11 h-11 flex items-center justify-center rounded-full text-orange-200/60 hover:text-orange-200 hover:bg-orange-900/20 transition-colors -mr-2"
            >
              {"\u2715"}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
