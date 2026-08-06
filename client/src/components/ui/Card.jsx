import React from 'react';
import clsx from 'clsx';

const Card = ({
  children,
  className = '',
  gradient = false,
  hover = true,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={clsx(
        'glass dark:glass-dark rounded-2xl shadow-sm',
        hover && 'card-hover',
        gradient && 'bg-gradient-to-br from-indigo-500/5 to-purple-500/5',
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
