import React from 'react';
import { WildfireStats } from '@/types/wildfire';

interface InfoBoxProps {
  stats: WildfireStats;
}

const InfoBox: React.FC<InfoBoxProps> = ({ stats }) => {
  return (
    <div className="absolute bottom-12 left-4 z-10 map-overlay p-3 max-w-[95%] md:max-w-md">
      <div className="flex flex-wrap gap-3">
        <div>
          <div className="text-xs text-gray-500">Active Fires</div>
          <div className="text-lg font-semibold flex items-center text-[#D32F2F]">
            <span>{stats.activeFiresCount}</span>
            <span className="material-icons text-sm ml-1">local_fire_department</span>
          </div>
        </div>
        <div className="border-l border-gray-200 pl-3">
          <div className="text-xs text-gray-500">Acres Burning</div>
          <div className="text-lg font-semibold">{stats.totalAcresBurning.toLocaleString()}</div>
        </div>
        <div className="border-l border-gray-200 pl-3">
          <div className="text-xs text-gray-500">Nearby</div>
          <div className="text-lg font-semibold flex items-center">
            <span>{stats.nearbyFiresCount}</span>
            <span className="text-xs ml-1 font-normal text-gray-500">in 100mi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoBox;
