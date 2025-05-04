import React from 'react';
import { Wildfire } from '@/types/wildfire';

interface FireListItemProps {
  wildfire: Wildfire;
  isSelected: boolean;
  onClick: () => void;
}

const FireListItem: React.FC<FireListItemProps> = ({ wildfire, isSelected, onClick }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-[#D32F2F]';
      case 'medium':
        return 'bg-[#FFA000]';
      case 'low':
        return 'bg-[#689F38]';
      case 'contained':
        return 'bg-[#2E7D32]';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div 
      className={`border-b border-gray-200 p-3 hover:bg-gray-50 cursor-pointer transition duration-150 ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between">
        <h3 className="font-medium text-gray-900">{wildfire.name}</h3>
        <span className={`inline-flex w-3 h-3 ${getSeverityColor(wildfire.severity)} rounded-full`}></span>
      </div>
      <div className="mt-1 flex justify-between text-sm">
        <span className="text-gray-600">{wildfire.location}</span>
        <span className="text-gray-500">{wildfire.acres.toLocaleString()} acres</span>
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span className="text-gray-500">Started: {wildfire.startDate}</span>
        <span className="text-gray-500">{wildfire.containment}% contained</span>
      </div>
    </div>
  );
};

export default FireListItem;
