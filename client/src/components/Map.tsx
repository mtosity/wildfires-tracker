import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Wildfire, MapPosition } from '@/types/wildfire';
import FireMarker from './FireMarker';
import { createPortal } from 'react-dom';

interface MapProps {
  wildfires: Wildfire[];
  onMapMove?: (bounds: mapboxgl.LngLatBounds) => void;
  onWildfireSelect?: (wildfire: Wildfire | null) => void;
  selectedWildfire?: Wildfire | null;
  initialPosition?: MapPosition;
  userLocation?: { latitude: number; longitude: number } | null;
}

const Map: React.FC<MapProps> = ({
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
  const [mapLoaded, setMapLoaded] = useState(false);

  const defaultPosition = {
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4
  };

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
      });

      map.current.on('moveend', () => {
        if (map.current && onMapMove) {
          const bounds = map.current.getBounds();
          onMapMove(bounds);
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle user location updates
  useEffect(() => {
    if (map.current && userLocation && mapLoaded) {
      // Add or update user location marker
      const el = document.createElement('div');
      el.className = 'w-5 h-5 bg-accent rounded-full border-2 border-white flex items-center justify-center';
      
      new mapboxgl.Marker(el)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    }
  }, [userLocation, mapLoaded]);

  // Handle wildfire data updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove markers that no longer exist in the data
    Object.keys(markersRef.current).forEach(id => {
      if (!wildfires.find(w => w.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    wildfires.forEach(wildfire => {
      if (!markersRef.current[wildfire.id]) {
        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.id = `marker-${wildfire.id}`;
        markerEl.className = 'marker-container';
        document.body.appendChild(markerEl);

        // Create the marker
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([wildfire.longitude, wildfire.latitude])
          .addTo(map.current!);

        // Add click handler
        markerEl.addEventListener('click', () => {
          if (onWildfireSelect) {
            onWildfireSelect(wildfire);
          }
        });

        markersRef.current[wildfire.id] = marker;
      } else {
        // Update marker position if needed
        markersRef.current[wildfire.id].setLngLat([wildfire.longitude, wildfire.latitude]);
      }

      // Render React component into marker element
      const markerEl = document.getElementById(`marker-${wildfire.id}`);
      if (markerEl) {
        const isSelected = selectedWildfire?.id === wildfire.id;
        createPortal(
          <FireMarker 
            wildfire={wildfire} 
            isSelected={isSelected}
          />,
          markerEl
        );
      }
    });
  }, [wildfires, selectedWildfire, mapLoaded, onWildfireSelect]);

  // Fly to the selected wildfire
  useEffect(() => {
    if (map.current && selectedWildfire && mapLoaded) {
      map.current.flyTo({
        center: [selectedWildfire.longitude, selectedWildfire.latitude],
        zoom: 10,
        essential: true
      });
    }
  }, [selectedWildfire, mapLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full absolute top-0 left-0">
      {/* Map renders here */}
    </div>
  );
};

export default Map;
