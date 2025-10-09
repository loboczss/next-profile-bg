"use client";

import { motion } from "framer-motion";

interface ChartPoint {
  label: string;
  value: number;
}

interface OverviewChartProps {
  title: string;
  description: string;
  points: ChartPoint[];
}

// Gráfico leve em SVG para exibir a evolução de métricas sem dependências externas.
export function OverviewChart({ title, description, points }: OverviewChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const stepX = 100 / Math.max(points.length - 1, 1);

  const coordinates = points.map((point, index) => {
    const x = stepX * index;
    const y = 100 - (point.value / maxValue) * 100;
    return `${x},${y}`;
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
        </div>
        <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
          Últimos {points.length} períodos
        </div>
      </div>

      <div className="mt-6">
        <svg viewBox="0 0 100 100" className="h-48 w-full">
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="#e2e8f0" strokeWidth={0.4} className="dark:stroke-slate-800">
            {[0, 25, 50, 75, 100].map((value) => (
              <line key={value} x1="0" x2="100" y1={value} y2={value} />
            ))}
          </g>
          <motion.polyline
            points={coordinates.join(" ")}
            fill="none"
            stroke="#4338ca"
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.polygon
            points={[...coordinates, `100,100`, `0,100`].join(" ")}
            fill="url(#chartGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
          {points.map((point, index) => {
            const x = stepX * index;
            const y = 100 - (point.value / maxValue) * 100;
            return (
              <g key={point.label}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r={1.8}
                  fill="#312e81"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05, type: "spring", stiffness: 200, damping: 12 }}
                />
                <text
                  x={x}
                  y={y - 3}
                  textAnchor="middle"
                  className="fill-slate-500 text-[2.5px] font-semibold dark:fill-slate-400"
                >
                  {point.value}
                </text>
              </g>
            );
          })}
          {points.map((point, index) => (
            <text
              key={point.label}
              x={stepX * index}
              y={102}
              textAnchor="middle"
              className="fill-slate-400 text-[2.6px] dark:fill-slate-500"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
