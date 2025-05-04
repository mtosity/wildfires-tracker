import React from 'react';
import { Button } from '@/components/ui/button';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe: () => void;
  isLocating?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onLocateMe,
  isLocating = false
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 map-overlay p-1 flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="p-1.5 hover:bg-gray-100 rounded-md"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <span className="material-icons">add</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="p-1.5 hover:bg-gray-100 rounded-md"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <span className="material-icons">remove</span>
      </Button>
      
      <div className="my-1 border-t border-gray-200"></div>
      
      <Button
        variant="ghost"
        size="icon"
        className={`p-1.5 hover:bg-gray-100 rounded-md ${
          isLocating ? 'text-accent animate-pulse' : 'text-accent'
        }`}
        onClick={onLocateMe}
        disabled={isLocating}
        title="Find My Location"
      >
        <span className="material-icons">my_location</span>
      </Button>
    </div>
  );
};

export default MapControls;
