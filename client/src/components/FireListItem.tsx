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

  // Check if the fire is currently active (not fully contained)
  const isActive = wildfire.containment < 100 && wildfire.severity !== 'contained';

  // Background color based on selection and active status
  const getBgClass = () => {
    if (isSelected) {
      return 'bg-gray-100';
    } else if (isActive) {
      if (wildfire.severity === 'high') {
        return 'bg-red-50';
      } else if (wildfire.severity === 'medium') {
        return 'bg-amber-50';
      } else {
        return 'bg-green-50';
      }
    }
    return '';
  };

  return (
    <div 
      className={`border-b border-gray-200 p-3 hover:bg-gray-50 cursor-pointer transition duration-150 ${getBgClass()}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="font-medium text-gray-900">{wildfire.name}</h3>
          {isActive && (
            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center">
          {isActive && (
            <span className={`${getSeverityColor(wildfire.severity)} w-3 h-3 rounded-full animate-pulse mr-1.5`}></span>
          )}
          <span className={`inline-flex w-3 h-3 ${getSeverityColor(wildfire.severity)} rounded-full`}></span>
        </div>
      </div>
      <div className="mt-1 flex justify-between text-sm">
        <span className="text-gray-600">{wildfire.location}</span>
        <span className="text-gray-500">{wildfire.acres.toLocaleString()} acres</span>
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span className="text-gray-500">Started: {wildfire.startDate}</span>
        <span className={`${isActive ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>
          {wildfire.containment}% contained
        </span>
      </div>
    </div>
  );
};

export default FireListItem;
