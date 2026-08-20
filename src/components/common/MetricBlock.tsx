import React from 'react';

interface MetricBlockProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export const MetricBlock: React.FC<MetricBlockProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
}) => {
  return (
    <div className="bg-[#141414] border border-white/10 p-4 flex flex-col justify-between shadow-none transition-all hover:border-white/20">
      <div className="flex items-center justify-between">
        <span className="micro-label">
          {title}
        </span>
        {icon && <div className="text-[#E2FF00]">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="display-type text-4xl text-white leading-none tracking-tight">{value}</div>
        {trend && (
          <span
            className={`text-xs font-mono font-bold ${
              trend.isPositive ? 'text-[#E2FF00]' : 'text-[#FF4D4D]'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1.5 text-[11px] text-[#888888] leading-tight">{subtitle}</div>
      )}
    </div>
  );
};
