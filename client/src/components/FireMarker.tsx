import React from 'react';
import { Wildfire } from '@/types/wildfire';

interface FireMarkerProps {
  wildfire: Wildfire;
  isSelected?: boolean;
}

const FireMarker: React.FC<FireMarkerProps> = ({ wildfire, isSelected = false }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-[#D32F2F]'; // Red
      case 'medium':
        return 'bg-[#FFA000]'; // Amber
      case 'low':
        return 'bg-[#689F38]'; // Light Green
      case 'contained':
        return 'bg-[#2E7D32]'; // Green
      default:
        return 'bg-[#D32F2F]'; // Default to red
    }
  };

  const getMarkerSize = (acres: number, isSelected: boolean) => {
    // Base size on fire size and if it's selected
    if (isSelected) {
      return 'w-7 h-7';
    }
    
    if (acres > 10000) {
      return 'w-6 h-6';
    } else if (acres > 1000) {
      return 'w-5 h-5';
    } else {
      return 'w-4 h-4';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${getSeverityColor(wildfire.severity)} ${getMarkerSize(
          wildfire.acres,
          isSelected
        )} rounded-full pulse flex items-center justify-center z-10`}
      >
        <span className="material-icons text-white text-xs">local_fire_department</span>
      </div>
      {isSelected && (
        <div className="text-xs font-medium bg-white px-1 py-0.5 rounded shadow-sm mt-1 whitespace-nowrap">
          {wildfire.name}
        </div>
      )}
    </div>
  );
};

export default FireMarker;
