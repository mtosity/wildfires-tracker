import React from 'react';
import { Alert } from '@/types/wildfire';
import { Button } from '@/components/ui/button';

interface AlertBannerProps {
  alert: Alert;
  onClose: () => void;
  onAlertClick?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onClose, onAlertClick }) => {
  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-[#D32F2F]';
      case 'medium':
        return 'bg-orange-50 border-[#FFA000]';
      case 'low':
        return 'bg-green-50 border-[#689F38]';
      default:
        return 'bg-gray-50 border-gray-400';
    }
  };

  const getTextColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-[#D32F2F]';
      case 'medium':
        return 'text-[#FFA000]';
      case 'low':
        return 'text-[#689F38]';
      default:
        return 'text-gray-600';
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    // Prevent the click event from bubbling up to parent elements
    e.stopPropagation();
    if (onAlertClick) {
      onAlertClick();
    }
  };

  return (
    <div className={`absolute top-20 left-4 right-4 z-20 map-overlay p-3 border-l-4 ${getBgColor(alert.severity)} flex items-center justify-between`}>
      <div 
        className="flex items-center flex-grow cursor-pointer" 
        onClick={handleContentClick}
        title="Click to view on map"
      >
        <span className={`material-icons ${getTextColor(alert.severity)} mr-2`}>warning</span>
        <div>
          <p className={`font-medium ${getTextColor(alert.severity)}`}>{alert.title}</p>
          <p className="text-sm text-gray-700">{alert.message}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:text-gray-700 h-6 w-6 ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <span className="material-icons">close</span>
      </Button>
    </div>
  );
};

export default AlertBanner;
