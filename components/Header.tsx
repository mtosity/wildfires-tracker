import React from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center">
      <div className="map-overlay p-2 flex items-center">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-1">local_fire_department</span>
          <span className="font-bold text-primary text-lg">{title}</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
