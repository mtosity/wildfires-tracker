import React from 'react';
import { Wildfire } from '@/types/wildfire';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface FirePopupProps {
  wildfire: Wildfire;
  onClose: () => void;
  onViewDetails?: () => void;
  onGetDirections?: () => void;
  onSubscribeToAlerts?: () => void;
}

const FirePopup: React.FC<FirePopupProps> = ({
  wildfire,
  onClose,
  onViewDetails,
  onGetDirections,
  onSubscribeToAlerts
}) => {
  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'High Severity';
      case 'medium':
        return 'Medium Severity';
      case 'low':
        return 'Low Severity';
      case 'contained':
        return 'Contained';
      default:
        return 'Unknown Severity';
    }
  };

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

  const getUpdatedTime = (updatedString: string) => {
    try {
      const updated = new Date(updatedString);
      return formatDistanceToNow(updated, { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div className="map-overlay p-4 w-72 pointer-events-auto">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 pr-2">{wildfire.name}</h3>
        <button onClick={onClose} className="text-gray-500">
          <span className="material-icons text-lg">close</span>
        </button>
      </div>
      <div className="flex items-center mb-2">
        <span className={`inline-block w-3 h-3 ${getSeverityColor(wildfire.severity)} rounded-full mr-2`}></span>
        <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-800 rounded">
          {getSeverityLabel(wildfire.severity)}
        </span>
        <span className="ml-auto text-xs text-gray-500">
          Updated: {getUpdatedTime(wildfire.updated)}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-start">
          <span className="material-icons text-gray-500 text-sm mr-1">place</span>
          <p>{wildfire.location}</p>
        </div>
        <div className="flex items-start">
          <span className="material-icons text-gray-500 text-sm mr-1">local_fire_department</span>
          <p>Size: {wildfire.acres.toLocaleString()} acres</p>
        </div>
        <div className="flex items-start">
          <span className="material-icons text-gray-500 text-sm mr-1">event</span>
          <p>Started: {wildfire.startDate}</p>
        </div>
        <div className="flex items-start">
          <span className="material-icons text-gray-500 text-sm mr-1">public</span>
          <p>Containment: {wildfire.containment}%</p>
        </div>
      </div>
      <div className="mt-3 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-accent-dark p-0 h-auto"
          onClick={onViewDetails}
        >
          <span className="material-icons text-sm mr-1">info</span>
          Details
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-accent-dark p-0 h-auto"
          onClick={onGetDirections}
        >
          <span className="material-icons text-sm mr-1">near_me</span>
          Directions
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-accent-dark p-0 h-auto"
          onClick={onSubscribeToAlerts}
        >
          <span className="material-icons text-sm mr-1">notifications</span>
          Alert
        </Button>
      </div>
    </div>
  );
};

export default FirePopup;
