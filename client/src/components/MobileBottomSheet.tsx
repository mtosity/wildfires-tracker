import React, { useState } from 'react';
import { Wildfire } from '@/types/wildfire';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface MobileBottomSheetProps {
  wildfire: Wildfire | null;
  isOpen: boolean;
  onClose: () => void;
  onGetDirections: () => void;
  onShare: () => void;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  wildfire,
  isOpen,
  onClose,
  onGetDirections,
  onShare
}) => {
  const [updates] = useState([
    { id: 1, text: 'Containment increased to 15%', timestamp: '2023-09-14T10:30:00Z' },
    { id: 2, text: 'Evacuation orders expanded to Zone 3', timestamp: '2023-09-13T18:15:00Z' }
  ]);

  const getSeverityLabel = (severity: string | undefined) => {
    if (!severity) return 'Unknown Severity';
    
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

  const getSeverityColors = (severity: string | undefined) => {
    if (!severity) return { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    switch (severity) {
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-800' };
      case 'medium':
        return { bg: 'bg-orange-100', text: 'text-orange-800' };
      case 'low':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      case 'contained':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  const getDotColor = (severity: string | undefined) => {
    if (!severity) return 'bg-gray-500';
    
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, p');
    } catch {
      return dateString;
    }
  };

  if (!wildfire) return null;

  const { bg, text } = getSeverityColors(wildfire.severity);

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg transform transition-transform duration-300 z-20 lg:hidden ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-2"></div>
      <div className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{wildfire.name}</h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
            <span className={`w-2 h-2 ${getDotColor(wildfire.severity)} rounded-full mr-1`}></span>
            {getSeverityLabel(wildfire.severity)}
          </span>
        </div>
        <p className="text-gray-600 text-sm">{wildfire.location}</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Size</p>
          <p className="font-medium">{wildfire.acres.toLocaleString()} acres</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Containment</p>
          <p className="font-medium">{wildfire.containment}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Started</p>
          <p className="font-medium">{wildfire.startDate}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Cause</p>
          <p className="font-medium">{wildfire.cause || 'Unknown'}</p>
        </div>
      </div>
      <div className="px-4 pb-4 flex space-x-2">
        <Button
          className="flex-1 bg-primary text-white py-2 rounded-lg flex items-center justify-center"
          onClick={onGetDirections}
        >
          <span className="material-icons text-sm mr-1">directions</span>
          Directions
        </Button>
        <Button
          variant="outline"
          className="flex-1 border border-primary text-primary py-2 rounded-lg flex items-center justify-center"
          onClick={onShare}
        >
          <span className="material-icons text-sm mr-1">share</span>
          Share
        </Button>
      </div>
      <div className="p-4 border-t">
        <h4 className="font-medium mb-2">Recent Updates</h4>
        <div className="text-sm space-y-2">
          {updates.map(update => (
            <div key={update.id} className="flex space-x-2">
              <div className="w-1 bg-gray-300 rounded-full"></div>
              <div>
                <p className="text-gray-900">{update.text}</p>
                <p className="text-gray-500 text-xs">{formatDate(update.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomSheet;
