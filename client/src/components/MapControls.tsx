import React from "react";
import { Button } from "@/components/ui/button";

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
  isLocating = false,
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 map-overlay p-1 flex flex-col">
      <Button
        variant="ghost"
        size="sm"
        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-md"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <span className="material-icons text-sm">add</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-md"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <span className="material-icons text-sm">remove</span>
      </Button>

      <div className="mx-auto border-b border-gray-200 w-8 self-center"></div>

      <Button
        variant="ghost"
        size="sm"
        className={`p-2 hover:bg-red-50 hover:text-red-600 rounded-md ${
          isLocating ? "text-accent animate-pulse" : "text-accent"
        }`}
        onClick={onLocateMe}
        disabled={isLocating}
        title="Find My Location"
      >
        <span className="material-icons text-sm">my_location</span>
      </Button>
    </div>
  );
};

export default MapControls;
