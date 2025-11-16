'use client';

import { useState, useRef, useEffect } from 'react';
import type { Event } from '@/app/types';

interface PriorityMatrixProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export function PriorityMatrix({ events, onEventClick }: PriorityMatrixProps) {
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter out completed events
  const activeEvents = events.filter((e) => !e.completed);

  // Calculate dynamic bounds based on event data
  const calculateBounds = () => {
    const defaultMin = 0;
    const defaultMax = 10;

    if (activeEvents.length === 0) {
      return {
        xMin: defaultMin,
        xMax: defaultMax,
        yMin: defaultMin,
        yMax: defaultMax,
      };
    }

    const urgencies = activeEvents.map((e) => e.urgency);
    const importances = activeEvents.map((e) => e.importance);

    const xMin = Math.min(defaultMin, ...urgencies);
    const xMax = Math.max(defaultMax, ...urgencies);
    const yMin = Math.min(defaultMin, ...importances);
    const yMax = Math.max(defaultMax, ...importances);

    return { xMin, xMax, yMin, yMax };
  };

  const bounds = calculateBounds();

  // Apply zoom to bounds
  const centerX = (bounds.xMax + bounds.xMin) / 2;
  const centerY = (bounds.yMax + bounds.yMin) / 2;
  const rangeX = (bounds.xMax - bounds.xMin) / zoom;
  const rangeY = (bounds.yMax - bounds.yMin) / zoom;

  const viewBounds = {
    xMin: centerX - rangeX / 2,
    xMax: centerX + rangeX / 2,
    yMin: centerY - rangeY / 2,
    yMax: centerY + rangeY / 2,
  };

  // SVG viewport dimensions
  const width = 800;
  const height = 600;
  const padding = 60;

  // Convert data coordinates to SVG coordinates
  const toSVGX = (x: number) => {
    return padding + ((x - viewBounds.xMin) / (viewBounds.xMax - viewBounds.xMin)) * (width - 2 * padding);
  };

  const toSVGY = (y: number) => {
    // Invert Y axis (SVG origin is top-left)
    return height - padding - ((y - viewBounds.yMin) / (viewBounds.yMax - viewBounds.yMin)) * (height - 2 * padding);
  };

  // Handle mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (svgRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prevZoom) => Math.max(0.1, Math.min(10, prevZoom * zoomDelta)));
      }
    };

    const svgElement = svgRef.current;
    if (svgElement) {
      svgElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => svgElement.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const stepX = Math.pow(10, Math.floor(Math.log10((viewBounds.xMax - viewBounds.xMin) / 10)));
    const stepY = Math.pow(10, Math.floor(Math.log10((viewBounds.yMax - viewBounds.yMin) / 10)));

    // Vertical grid lines (X axis)
    for (let x = Math.floor(viewBounds.xMin / stepX) * stepX; x <= viewBounds.xMax; x += stepX) {
      if (x >= viewBounds.xMin && x <= viewBounds.xMax) {
        lines.push(
          <line
            key={`v-${x}`}
            x1={toSVGX(x)}
            y1={padding}
            x2={toSVGX(x)}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-300 dark:text-gray-600"
            opacity="0.3"
          />
        );
        lines.push(
          <text
            key={`vt-${x}`}
            x={toSVGX(x)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600 dark:fill-gray-400"
          >
            {x.toFixed(1)}
          </text>
        );
      }
    }

    // Horizontal grid lines (Y axis)
    for (let y = Math.floor(viewBounds.yMin / stepY) * stepY; y <= viewBounds.yMax; y += stepY) {
      if (y >= viewBounds.yMin && y <= viewBounds.yMax) {
        lines.push(
          <line
            key={`h-${y}`}
            x1={padding}
            y1={toSVGY(y)}
            x2={width - padding}
            y2={toSVGY(y)}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-300 dark:text-gray-600"
            opacity="0.3"
          />
        );
        lines.push(
          <text
            key={`ht-${y}`}
            x={padding - 10}
            y={toSVGY(y)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs fill-gray-600 dark:fill-gray-400"
          >
            {y.toFixed(1)}
          </text>
        );
      }
    }

    return lines;
  };

  // Get event color based on position
  const getEventColor = (urgency: number, importance: number) => {
    const midX = (viewBounds.xMax + viewBounds.xMin) / 2;
    const midY = (viewBounds.yMax + viewBounds.yMin) / 2;

    // High urgency + High importance = Red (Do First)
    if (urgency >= midX && importance >= midY) {
      return '#ef4444'; // red-500
    }
    // Low urgency + High importance = Blue (Schedule)
    if (urgency < midX && importance >= midY) {
      return '#3b82f6'; // blue-500
    }
    // High urgency + Low importance = Yellow (Delegate)
    if (urgency >= midX && importance < midY) {
      return '#eab308'; // yellow-500
    }
    // Low urgency + Low importance = Gray (Eliminate)
    return '#6b7280'; // gray-500
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Priority Matrix
        </h2>
        <div className="flex gap-4 text-xs items-center">
          <span className="text-gray-600 dark:text-gray-400">Scroll to zoom</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Do First</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Schedule</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Delegate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Eliminate</span>
          </div>
        </div>
      </div>

      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="mx-auto cursor-grab active:cursor-grabbing"
        >
          {/* Grid lines */}
          {generateGridLines()}

          {/* Axes */}
          <line
            x1={padding}
            y1={toSVGY(0)}
            x2={width - padding}
            y2={toSVGY(0)}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-700 dark:text-gray-300"
          />
          <line
            x1={toSVGX(0)}
            y1={padding}
            x2={toSVGX(0)}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-700 dark:text-gray-300"
          />

          {/* Quadrant labels */}
          <text
            x={toSVGX((viewBounds.xMax + viewBounds.xMin) / 2)}
            y={toSVGY((viewBounds.yMax * 3 + viewBounds.yMin) / 4)}
            textAnchor="middle"
            className="text-sm font-semibold fill-red-500 opacity-30"
          >
            Do First
          </text>
          <text
            x={toSVGX((viewBounds.xMin * 3 + viewBounds.xMax) / 4)}
            y={toSVGY((viewBounds.yMax * 3 + viewBounds.yMin) / 4)}
            textAnchor="middle"
            className="text-sm font-semibold fill-blue-500 opacity-30"
          >
            Schedule
          </text>
          <text
            x={toSVGX((viewBounds.xMax * 3 + viewBounds.xMin) / 4)}
            y={toSVGY((viewBounds.yMin * 3 + viewBounds.yMax) / 4)}
            textAnchor="middle"
            className="text-sm font-semibold fill-yellow-500 opacity-30"
          >
            Delegate
          </text>
          <text
            x={toSVGX((viewBounds.xMin * 3 + viewBounds.xMax) / 4)}
            y={toSVGY((viewBounds.yMin * 3 + viewBounds.yMax) / 4)}
            textAnchor="middle"
            className="text-sm font-semibold fill-gray-500 opacity-30"
          >
            Eliminate
          </text>

          {/* Plot events */}
          {activeEvents.map((event) => {
            const x = toSVGX(event.urgency);
            const y = toSVGY(event.importance);
            const color = getEventColor(event.urgency, event.importance);

            return (
              <g key={event.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill={color}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onEventClick?.(event)}
                />
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="text-xs fill-gray-900 dark:fill-gray-100 pointer-events-none font-medium"
                  style={{ textShadow: '0 0 3px white' }}
                >
                  {event.title}
                </text>
                <title>{`${event.title}\nUrgency: ${event.urgency.toFixed(1)}, Importance: ${event.importance.toFixed(1)}`}</title>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
          >
            Urgency →
          </text>
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 20 ${height / 2})`}
            className="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
          >
            Importance →
          </text>
        </svg>

        <div className="text-center mt-2 text-xs text-gray-600 dark:text-gray-400">
          Zoom: {zoom.toFixed(2)}x | Bounds: X({viewBounds.xMin.toFixed(1)}, {viewBounds.xMax.toFixed(1)}) Y({viewBounds.yMin.toFixed(1)}, {viewBounds.yMax.toFixed(1)})
        </div>
      </div>
    </div>
  );
}
