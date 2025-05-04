import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Wildfire, MapPosition } from '@/types/wildfire';

// USA Bounding Box
const usaBounds = {
  north: 49.5,  // Northern border with Canada
  south: 24.5,  // Southern border with Mexico
  west: -125.0, // Western coast
  east: -66.0   // Eastern coast
};

interface MapProps {
  wildfires: Wildfire[];
  onMapMove?: (bounds: mapboxgl.LngLatBounds) => void;
  onWildfireSelect?: (wildfire: Wildfire | null) => void;
  selectedWildfire?: Wildfire | null;
  initialPosition?: MapPosition;
  userLocation?: { latitude: number; longitude: number } | null;
}

const SimpleMap: React.FC<MapProps> = ({
  wildfires,
  onMapMove,
  onWildfireSelect,
  selectedWildfire,
  initialPosition,
  userLocation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // USA-focused position and bounds
  const defaultPosition = {
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 3.5
  };

  // Initialize map
  useEffect(() => {
    if (!mapboxgl.supported()) {
      console.error('Your browser does not support Mapbox GL');
      return;
    }

    // Use a public token if not provided via environment variables
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [initialPosition?.longitude || defaultPosition.longitude, initialPosition?.latitude || defaultPosition.latitude],
        zoom: initialPosition?.zoom || defaultPosition.zoom
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        
        // Add basic event listeners
        if (map.current && onMapMove) {
          map.current.on('moveend', () => {
            const bounds = map.current?.getBounds();
            if (bounds) {
              onMapMove(bounds);
            }
          });
        }
      });
    }

    return () => {
      // Clean up map on unmount
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialPosition]);
  
  // Expose map instance to parent component if needed
  useEffect(() => {
    if (map.current && mapLoaded) {
      const instance = map.current;
      
      // Add methods that can be called from outside
      const mapInterface = {
        zoomIn: () => instance.zoomIn(),
        zoomOut: () => instance.zoomOut(),
        flyTo: (options: { center: [number, number]; zoom?: number; duration?: number }) => instance.flyTo(options)
      };
      
      // Pass map instance up to parent component
      if (typeof window !== 'undefined') {
        (window as any).mapInstance = mapInterface;
      }
    }
  }, [mapLoaded]);

  // Add wildfire markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    wildfires.forEach(wildfire => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-red-600 rounded-full border border-white';
      
      // Add hover effect
      el.style.cursor = 'pointer';
      
      // Create the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([wildfire.longitude, wildfire.latitude])
        .addTo(map.current!);
      
      // Add click handler
      marker.getElement().addEventListener('click', () => {
        if (onWildfireSelect) {
          onWildfireSelect(wildfire);
        }
      });
      
      // Store marker reference
      markersRef.current[wildfire.id] = marker;
    });
  }, [wildfires, mapLoaded, onWildfireSelect]);

  // Handle user location updates
  useEffect(() => {
    if (!map.current || !userLocation || !mapLoaded) return;
    
    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    
    // Create user marker container
    const el = document.createElement('div');
    el.className = 'w-6 h-6 relative flex items-center justify-center';
    
    // Add a pulsing effect
    const pulseRing = document.createElement('div');
    pulseRing.className = 'absolute w-full h-full bg-blue-500 opacity-70 rounded-full animate-ping';
    el.appendChild(pulseRing);
    
    // Add the center marker dot
    const centerDot = document.createElement('div');
    centerDot.className = 'absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white z-10';
    el.appendChild(centerDot);
    
    // Create and add the user location marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);
    
    // Store the marker reference
    userMarkerRef.current = marker;
    
    // Fly to user location with lower zoom to show more context
    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 5, // Lower zoom level to show more of the US
      duration: 2000
    });
    
  }, [userLocation, mapLoaded]);

  // Handle selected wildfire
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    if (selectedWildfire) {
      // Zoom to selected wildfire with moderate zoom
      map.current.flyTo({
        center: [selectedWildfire.longitude, selectedWildfire.latitude],
        zoom: 7, // Moderate zoom level to maintain context of surrounding area
        duration: 2000
      });
      
      // Highlight the selected marker (optional)
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        if (id === selectedWildfire.id) {
          const el = marker.getElement();
          el.className = 'w-6 h-6 bg-yellow-500 rounded-full border-2 border-white z-20';
        }
      });
    } else {
      // Reset all markers to default style
      Object.values(markersRef.current).forEach(marker => {
        const el = marker.getElement();
        el.className = 'w-4 h-4 bg-red-600 rounded-full border border-white';
      });
    }
  }, [selectedWildfire, mapLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
};

export default SimpleMap;