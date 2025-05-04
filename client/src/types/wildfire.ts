export interface Wildfire {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  acres: number;
  containment: number;
  startDate: string;
  severity: 'high' | 'medium' | 'low' | 'contained';
  cause?: string;
  perimeterCoordinates?: string; // JSON string of coordinates defining fire perimeter
  updated: string;
}

export interface PerimeterCoordinate {
  lng: number;
  lat: number;
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  wildfireId?: string;
  zones?: string[];
  createdAt: string;
}

export interface WildfireStats {
  activeFiresCount: number;
  totalAcresBurning: number;
  nearbyFiresCount: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapPosition {
  latitude: number;
  longitude: number;
  zoom: number;
}
