import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-white border border-[#E5E4E8] rounded-md p-8 text-center flex flex-col items-center justify-center my-4">
      {icon && <div className="text-[#74727C] mb-3">{icon}</div>}
      <h3 className="text-base font-semibold text-[#33323A] mb-1">{title}</h3>
      <p className="text-sm text-[#74727C] max-w-md mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#E51B4B] hover:bg-[#CC1641] text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
