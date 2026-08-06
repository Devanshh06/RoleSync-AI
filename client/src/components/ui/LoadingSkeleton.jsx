import React from 'react';
import clsx from 'clsx';

const LoadingSkeleton = ({ variant = 'text', lines = 3, className = '' }) => {
  const shimmerClass = 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer rounded';

  if (variant === 'card') {
    return (
      <div className={clsx('glass dark:glass-dark rounded-2xl p-6 space-y-4', className)}>
        <div className={clsx(shimmerClass, 'h-5 w-1/3')} />
        <div className={clsx(shimmerClass, 'h-4 w-full')} />
        <div className={clsx(shimmerClass, 'h-4 w-2/3')} />
        <div className={clsx(shimmerClass, 'h-10 w-1/4 mt-4')} />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={clsx('space-y-3', className)}>
        {/* Header */}
        <div className="flex gap-4 px-4 py-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={clsx(shimmerClass, 'h-4 flex-1')} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-t border-slate-100 dark:border-slate-800">
            {[...Array(4)].map((_, j) => (
              <div key={j} className={clsx(shimmerClass, 'h-4 flex-1', j === 0 && 'w-1/4')} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={clsx('flex items-center gap-4', className)}>
        <div className={clsx(shimmerClass, 'w-16 h-16 rounded-full shrink-0')} />
        <div className="flex-1 space-y-3">
          <div className={clsx(shimmerClass, 'h-5 w-1/3')} />
          <div className={clsx(shimmerClass, 'h-4 w-1/2')} />
        </div>
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={clsx('space-y-3', className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={clsx(shimmerClass, 'h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
