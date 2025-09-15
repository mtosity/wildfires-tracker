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

  const getButtonColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20 text-[#D32F2F]';
      case 'medium':
        return 'bg-[#FFA000]/10 hover:bg-[#FFA000]/20 text-[#FFA000]';
      case 'low':
        return 'bg-[#689F38]/10 hover:bg-[#689F38]/20 text-[#689F38]';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-600';
    }
  };

  return (
    <div className={`absolute top-20 left-4 right-4 z-20 map-overlay p-3 border-l-4 ${getBgColor(alert.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <span className={`material-icons ${getTextColor(alert.severity)} mr-2 mt-0.5`}>warning</span>
          <div>
            <p className={`font-medium ${getTextColor(alert.severity)}`}>{alert.title}</p>
            <p className="text-sm text-gray-700">{alert.message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 h-6 w-6 ml-2"
          onClick={onClose}
        >
          <span className="material-icons">close</span>
        </Button>
      </div>

      {onAlertClick && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center ${getButtonColor(alert.severity)} px-3 py-1 rounded-md text-xs`}
            onClick={onAlertClick}
          >
            <span className="material-icons text-sm mr-1">my_location</span>
            View on map
          </Button>
        </div>
      )}
    </div>
  );
};

export default AlertBanner;
