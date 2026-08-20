import React from 'react';

type StatusType =
  | 'Draft'
  | 'Upcoming'
  | 'Live'
  | 'Completed'
  | 'Archived'
  | 'Available'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Ballots'
  | 'Verified'
  | 'Locked'
  | 'Published'
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Disqualified';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getColors = (st: string) => {
    switch (st) {
      case 'Live':
      case 'Verified':
      case 'Published':
      case 'Active':
      case 'Complete':
      case 'Completed':
        return 'bg-[#E2FF00]/10 text-[#E2FF00] border-[#E2FF00]/30';
      case 'In Progress':
      case 'Awaiting Ballots':
      case 'Pending':
      case 'Assigned':
      case 'Pairings Released':
        return 'bg-[#3F6FD9]/15 text-[#85A9FF] border-[#3F6FD9]/40';
      case 'Upcoming':
      case 'Available':
      case 'Draft':
        return 'bg-[#FFB800]/15 text-[#FFD466] border-[#FFB800]/40';
      case 'Archived':
      case 'Inactive':
      case 'Closed':
        return 'bg-white/5 text-[#A0A0A0] border-white/10';
      case 'Disqualified':
      case 'Flagged':
      case 'Failed':
        return 'bg-[#FF4D4D]/15 text-[#FF8080] border-[#FF4D4D]/40';
      default:
        return 'bg-white/5 text-[#A0A0A0] border-white/10';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-none border ${getColors(
        status
      )} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 bg-current mr-1.5" />
      {status}
    </span>
  );
};
