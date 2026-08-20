import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded ${className}`}
    />
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 6 }) => {
  return (
    <tr className="animate-pulse border-b border-white/10">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3.5 bg-white/10 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <tbody className="divide-y divide-white/5">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </tbody>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse bg-[#141414] border border-white/10 p-5 rounded space-y-3">
      <div className="h-3 bg-white/10 rounded w-1/3" />
      <div className="h-6 bg-white/10 rounded w-1/2" />
      <div className="h-3 bg-white/10 rounded w-2/3" />
    </div>
  );
};

export const SurveyQuestionSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse bg-[#1A1A1A] border border-white/10 p-4 rounded space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-white/10 rounded w-1/2" />
        <div className="h-3 bg-white/10 rounded w-16" />
      </div>
      <div className="h-3 bg-white/10 rounded w-3/4" />
      <div className="h-8 bg-white/10 rounded w-full mt-2" />
    </div>
  );
};
