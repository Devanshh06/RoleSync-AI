import React, { useMemo, useRef } from 'react';

const STATUS_COLORS = {
  'Done': '#10b981',
  'In Progress': '#3b82f6',
  'Not Started': '#94a3b8',
  'Overdue': '#ef4444',
  'Blocked': '#f59e0b',
};

const PRIORITY_OPACITY = { Low: 0.6, Medium: 0.8, High: 1, Urgent: 1 };

/**
 * Simple CSS-based Gantt chart — no external library.
 * ponytail: no drag/resize, read-only visualization. If interaction needed, consider frappe-gantt.
 */
const GanttChart = ({ tasks }) => {
  const containerRef = useRef(null);

  const { days, startDate, taskBars } = useMemo(() => {
    if (!tasks.length) return { days: [], startDate: null, taskBars: [] };

    // Find date range
    const dates = tasks.flatMap(t => [new Date(t.date_assigned), new Date(t.deadline)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Add some padding
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1;
    const dayArr = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      dayArr.push(d);
    }

    const bars = tasks.map(t => {
      const start = new Date(t.date_assigned);
      const end = new Date(t.deadline);
      const startOffset = Math.max(0, Math.ceil((start - minDate) / 86400000));
      const duration = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
      const color = t.category?.color || STATUS_COLORS[t.status] || '#64748b';
      return { ...t, startOffset, duration, color };
    });

    return { days: dayArr, startDate: minDate, taskBars: bars };
  }, [tasks]);

  if (!tasks.length) return null;

  const dayWidth = 40; // px per day
  const totalWidth = days.length * dayWidth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = startDate ? Math.ceil((today - startDate) / 86400000) : -1;

  return (
    <div className="overflow-x-auto" ref={containerRef}>
      <div style={{ minWidth: totalWidth + 220 }} className="flex">
        {/* Task names column */}
        <div className="w-[220px] shrink-0 border-r border-slate-200 dark:border-slate-700">
          <div className="h-10 px-4 flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            Task
          </div>
          {taskBars.map((t) => (
            <div key={t.id} className="h-10 px-4 flex items-center text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 truncate">
              <span className="truncate" title={t.title}>{t.title}</span>
            </div>
          ))}
        </div>

        {/* Timeline grid */}
        <div className="flex-1 relative overflow-x-auto">
          {/* Header — day labels */}
          <div className="flex h-10 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 sticky top-0">
            {days.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div
                  key={i}
                  style={{ width: dayWidth, minWidth: dayWidth }}
                  className={`flex flex-col items-center justify-center text-[10px] leading-tight border-r border-slate-100 dark:border-slate-800 ${
                    isToday ? 'bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-600' : isWeekend ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <span>{d.toLocaleDateString('en-IN', { day: 'numeric' })}</span>
                  <span className="uppercase">{d.toLocaleDateString('en-IN', { month: 'short' }).slice(0, 3)}</span>
                </div>
              );
            })}
          </div>

          {/* Task rows */}
          {taskBars.map((t) => (
            <div key={t.id} className="flex h-10 border-b border-slate-100 dark:border-slate-800 relative">
              {/* Weekend backgrounds */}
              {days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return isWeekend ? (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 bg-slate-50/50 dark:bg-slate-800/20"
                    style={{ left: i * dayWidth, width: dayWidth }}
                  />
                ) : null;
              })}
              {/* Bar */}
              <div
                className="absolute top-1.5 h-7 rounded-md flex items-center px-2 text-[10px] font-semibold text-white shadow-sm transition-all hover:brightness-110 cursor-default"
                style={{
                  left: t.startOffset * dayWidth + 2,
                  width: Math.max(t.duration * dayWidth - 4, 20),
                  backgroundColor: t.color,
                  opacity: PRIORITY_OPACITY[t.priority] || 0.8,
                }}
                title={`${t.title} — ${t.status}`}
              >
                <span className="truncate">{t.duration > 2 ? t.title : ''}</span>
              </div>
            </div>
          ))}

          {/* Today marker */}
          {todayOffset >= 0 && todayOffset < days.length && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: todayOffset * dayWidth + dayWidth / 2 }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
