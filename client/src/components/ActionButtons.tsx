import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  activeView: 'fires' | 'map' | 'airQuality';
  onViewChange: (view: 'fires' | 'map' | 'airQuality') => void;
  onFilterToggle: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  activeView,
  onViewChange,
  onFilterToggle
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 map-overlay">
      <div className="flex justify-center space-x-1.5 p-1">
        <Button
          variant="ghost"
          size="sm"
          className={`px-3 py-1.5 flex items-center text-sm font-medium rounded-md ${
            activeView === 'map' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'
          }`}
          onClick={() => onViewChange('map')}
        >
          <span className="material-icons text-sm mr-1">layers</span>
          Map
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`px-3 py-1.5 flex items-center text-sm font-medium rounded-md ${
            activeView === 'fires' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'
          }`}
          onClick={() => onViewChange('fires')}
        >
          <span className="material-icons text-sm mr-1">local_fire_department</span>
          Fires
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`px-3 py-1.5 flex items-center text-sm font-medium rounded-md ${
            activeView === 'airQuality' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'
          }`}
          onClick={() => onViewChange('airQuality')}
        >
          <span className="material-icons text-sm mr-1">air</span>
          Air Quality
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-3 py-1.5 flex items-center text-sm font-medium hover:bg-gray-100 rounded-md"
          onClick={onFilterToggle}
        >
          <span className="material-icons text-sm mr-1">filter_alt</span>
          Filter
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
