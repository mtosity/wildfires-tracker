import React, { useState } from 'react';
import { Wildfire } from '@/types/wildfire';
import FireListItem from './FireListItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  wildfires: Wildfire[];
  isOpen: boolean;
  onClose: () => void;
  onWildfireSelect: (wildfire: Wildfire) => void;
  selectedWildfire: Wildfire | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  wildfires,
  isOpen,
  onClose,
  onWildfireSelect,
  selectedWildfire
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: boolean }>({
    high: true,
    medium: true,
    low: true,
    contained: false
  });

  // Only show active wildfires (not contained and less than 100% containment)
  const activeWildfires = wildfires.filter(wildfire => 
    wildfire.severity !== 'contained' && wildfire.containment < 100
  );

  const filteredWildfires = activeWildfires.filter(wildfire => {
    const matchesSearch = wildfire.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wildfire.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filters[wildfire.severity];
    return matchesSearch && matchesFilter;
  });

  const handleFilterToggle = (severity: string) => {
    setFilters(prev => ({
      ...prev,
      [severity]: !prev[severity]
    }));
  };

  return (
    <div 
      className={`absolute top-0 right-0 bottom-0 w-80 z-10 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full bg-white shadow-lg flex flex-col">
        <div className="p-4 bg-primary text-white flex justify-between items-center">
          <h2 className="font-semibold text-lg">Active Wildfires</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-primary-dark"
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </Button>
        </div>
        
        <div className="p-3 bg-gray-50 border-b">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search wildfires..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="material-icons absolute left-2 top-2.5 text-gray-400">search</span>
          </div>
          
          <div className="flex mt-2 space-x-1">
            <button 
              className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center ${
                filters.high ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleFilterToggle('high')}
            >
              <span className="w-2 h-2 bg-[#D32F2F] rounded-full mr-1"></span>
              High
            </button>
            <button 
              className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center ${
                filters.medium ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleFilterToggle('medium')}
            >
              <span className="w-2 h-2 bg-[#FFA000] rounded-full mr-1"></span>
              Medium
            </button>
            <button 
              className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center ${
                filters.low ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleFilterToggle('low')}
            >
              <span className="w-2 h-2 bg-[#689F38] rounded-full mr-1"></span>
              Low
            </button>
            <span className="ml-auto text-xs text-primary cursor-pointer">More filters</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredWildfires.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No wildfires match your search criteria
            </div>
          ) : (
            filteredWildfires.map(wildfire => (
              <FireListItem
                key={wildfire.id}
                wildfire={wildfire}
                isSelected={selectedWildfire?.id === wildfire.id}
                onClick={() => onWildfireSelect(wildfire)}
              />
            ))
          )}
        </div>
        
        <div className="p-3 bg-gray-50 border-t text-xs text-center text-gray-500">
          Data provided by NIFC and NASA FIRMS • Updated 14 minutes ago
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
