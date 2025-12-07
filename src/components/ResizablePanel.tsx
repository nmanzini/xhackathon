/**
 * Resizable Panel Component
 * Collapsible panel with draggable resize handle
 */

import { useState, useRef, useCallback, useEffect } from "react";

type Direction = "horizontal" | "vertical";
type Position = "left" | "right" | "top" | "bottom";

interface ResizablePanelProps {
  children: React.ReactNode;
  title?: string;
  direction: Direction;
  position: Position;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  defaultCollapsed?: boolean;
  className?: string;
}

export function ResizablePanel({
  children,
  title,
  direction,
  position,
  defaultSize,
  minSize,
  maxSize,
  defaultCollapsed = false,
  className = "",
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
      startSizeRef.current = size;
    },
    [direction, size]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      
      // Adjust delta based on position
      const adjustedDelta = 
        position === "left" || position === "top" ? delta : -delta;
      
      const newSize = Math.min(
        maxSize,
        Math.max(minSize, startSizeRef.current + adjustedDelta)
      );
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, position, minSize, maxSize]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isHorizontal = direction === "horizontal";
  const collapsedSize = 40; // Height/width when collapsed

  const sizeStyle = isHorizontal
    ? { width: isCollapsed ? collapsedSize : size }
    : { height: isCollapsed ? collapsedSize : size };

  const handlePosition = (() => {
    if (isCollapsed) return null;
    switch (position) {
      case "left":
        return "right-0 top-0 bottom-0 w-1 cursor-col-resize";
      case "right":
        return "left-0 top-0 bottom-0 w-1 cursor-col-resize";
      case "top":
        return "bottom-0 left-0 right-0 h-1 cursor-row-resize";
      case "bottom":
        return "top-0 left-0 right-0 h-1 cursor-row-resize";
    }
  })();

  return (
    <div
      ref={panelRef}
      className={`relative flex ${isHorizontal ? "flex-col" : "flex-col"} ${
        isCollapsed ? "overflow-hidden" : ""
      } ${className}`}
      style={{
        ...sizeStyle,
        flexShrink: 0,
        transition: isDragging ? "none" : "all 0.2s ease",
      }}
    >
      {/* Header with collapse toggle */}
      {title && (
        <div
          className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] cursor-pointer select-none"
          onClick={toggleCollapse}
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] text-xs">
              {isCollapsed ? "▶" : "▼"}
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {title}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      )}

      {/* Resize handle */}
      {handlePosition && (
        <div
          className={`absolute ${handlePosition} z-10 hover:bg-blue-500/50 transition-colors ${
            isDragging ? "bg-blue-500/50" : ""
          }`}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}

