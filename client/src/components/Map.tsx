import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Wildfire, MapPosition } from '@/types/wildfire';
import Supercluster from 'supercluster';
import FireMarker from './FireMarker';

interface MapProps {
  wildfires: Wildfire[];
  onMapMove?: (bounds: mapboxgl.LngLatBounds) => void;
  onWildfireSelect?: (wildfire: Wildfire | null) => void;
  selectedWildfire?: Wildfire | null;
  initialPosition?: MapPosition;
  userLocation?: { latitude: number; longitude: number } | null;
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, { 
  id: string;
  wildfire: Wildfire;
}>;

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
  const clusterMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const perimeterLayersRef = useRef<{ [key: string]: boolean }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(4);
  const [viewportBounds, setViewportBounds] = useState<mapboxgl.LngLatBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialPosition?.longitude || -98.5795,
    initialPosition?.latitude || 39.8283
  ]);
  
  const defaultPosition = {
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4
  };
  
  // Convert wildfires to GeoJSON features for clustering
  const points = useMemo((): PointFeature[] => {
    return wildfires.map(wildfire => ({
      type: 'Feature',
      properties: {
        id: wildfire.id,
        wildfire
      },
      geometry: {
        type: 'Point',
        coordinates: [wildfire.longitude, wildfire.latitude]
      }
    }));
  }, [wildfires]);

  // Create supercluster instance
  const supercluster = useMemo(() => {
    const instance = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 3
    });
    
    if (points.length > 0) {
      instance.load(points);
    }
    
    return instance;
  }, [points]);
  
  // Get clusters based on current map view
  const clusters = useMemo(() => {
    if (!viewportBounds || !mapLoaded) return [];
    
    const bbox: [number, number, number, number] = [
      viewportBounds.getWest(),
      viewportBounds.getSouth(),
      viewportBounds.getEast(),
      viewportBounds.getNorth()
    ];
    
    return supercluster.getClusters(bbox, Math.floor(currentZoom));
  }, [supercluster, viewportBounds, currentZoom, mapLoaded]);
  
  // Throttle function for performance
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean = false;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

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
        if (map.current) {
          setViewportBounds(map.current.getBounds());
        }
      });

      // Use throttled events for better performance
      const handleMapMove = throttle(() => {
        if (map.current) {
          setCurrentZoom(map.current.getZoom());
          setMapCenter([map.current.getCenter().lng, map.current.getCenter().lat]);
          setViewportBounds(map.current.getBounds());
          
          if (onMapMove) {
            onMapMove(map.current.getBounds());
          }
        }
      }, 100);
      
      map.current.on('moveend', handleMapMove);
      map.current.on('zoomend', handleMapMove);
      map.current.on('zoom', () => {
        if (map.current) {
          setCurrentZoom(map.current.getZoom());
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialPosition, throttle]);

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

  // Clear all markers
  const clearAllMarkers = useCallback(() => {
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    Object.values(clusterMarkersRef.current).forEach(marker => {
      marker.remove();
    });
    clusterMarkersRef.current = {};
  }, []);

  // Handle clusters and markers
  useEffect(() => {
    if (!map.current || !mapLoaded || !viewportBounds) return;

    console.log("Rendering map with clusters:", clusters.length);
    
    // Clear old markers for better performance
    clearAllMarkers();
    
    // Add new clusters and markers
    clusters.forEach(cluster => {
      // Get cluster coordinates
      const [longitude, latitude] = cluster.geometry.coordinates;
      
      // Check if it's a cluster or a single point
      if (cluster.properties.cluster) {
        // It's a cluster
        const clusterId = `cluster-${cluster.properties.cluster_id}`;
        const pointCount = cluster.properties.point_count;
        
        // Create cluster marker element
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center';
        
        // Adjust size based on point count
        const size = Math.min(55, Math.max(35, 35 + Math.log10(pointCount) * 10));
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        
        // Create inner circle
        const innerCircle = document.createElement('div');
        innerCircle.className = 'bg-primary/90 text-white rounded-full flex items-center justify-center font-bold shadow-md w-full h-full';
        innerCircle.style.fontSize = `${Math.max(12, Math.min(18, 12 + Math.log10(pointCount) * 3))}px`;
        innerCircle.innerText = pointCount.toString();
        el.appendChild(innerCircle);
        
        // Add click handler to expand cluster
        el.addEventListener('click', () => {
          const expansionZoom = Math.min(
            supercluster.getClusterExpansionZoom(cluster.properties.cluster_id),
            16
          );
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: expansionZoom,
            essential: true
          });
        });
        
        // Create and store marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
        
        clusterMarkersRef.current[clusterId] = marker;
      } else {
        // It's a single point
        const wildfire = cluster.properties.wildfire;
        
        // Only render if wildfire is in current viewport (virtualization)
        if (
          wildfire.longitude >= viewportBounds.getWest() &&
          wildfire.longitude <= viewportBounds.getEast() &&
          wildfire.latitude >= viewportBounds.getSouth() &&
          wildfire.latitude <= viewportBounds.getNorth()
        ) {
          // Create marker element
          const markerEl = document.createElement('div');
          markerEl.id = `marker-${wildfire.id}`;
          markerEl.className = 'marker-container';
          
          // Style based on severity
          const dotEl = document.createElement('div');
          dotEl.className = 'rounded-full';
          dotEl.style.width = '16px';
          dotEl.style.height = '16px';
          dotEl.style.backgroundColor = wildfire.severity === 'high' ? '#D32F2F' : 
                                        wildfire.severity === 'medium' ? '#FFA000' : 
                                        wildfire.severity === 'low' ? '#689F38' : '#2E7D32';
          
          // Add selection styling
          const isSelected = selectedWildfire?.id === wildfire.id;
          if (isSelected) {
            dotEl.style.transform = 'scale(1.5)';
            dotEl.style.boxShadow = '0 0 0 2px white, 0 0 0 4px #0288D1';
            
            const labelEl = document.createElement('div');
            labelEl.className = 'text-xs font-medium bg-white px-1 py-0.5 rounded shadow-sm mt-1 whitespace-nowrap';
            labelEl.innerText = wildfire.name;
            markerEl.appendChild(labelEl);
          }
          
          markerEl.appendChild(dotEl);
          
          // Create and store marker
          const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'center'
          })
            .setLngLat([wildfire.longitude, wildfire.latitude])
            .addTo(map.current!);
          
          // Add click handler
          markerEl.addEventListener('click', () => {
            if (onWildfireSelect) {
              onWildfireSelect(wildfire);
            }
          });
          
          markersRef.current[wildfire.id] = marker;
        }
      }
    });
  }, [clusters, selectedWildfire, mapLoaded, onWildfireSelect, viewportBounds, supercluster, clearAllMarkers]);

  // Handle fire perimeter rendering based on zoom level
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Only show perimeters when zoomed in enough
    const shouldShowPerimeters = currentZoom >= 9;
    console.log("Current zoom:", currentZoom, "Show perimeters:", shouldShowPerimeters);
    
    wildfires.forEach(wildfire => {
      const sourceId = `perimeter-source-${wildfire.id}`;
      const layerId = `perimeter-layer-${wildfire.id}`;
      const hasLayer = perimeterLayersRef.current[layerId];
      
      // If we have perimeter data for this wildfire
      if (wildfire.perimeterCoordinates) {
        try {
          // Parse perimeter coordinates
          const perimeterCoords = JSON.parse(wildfire.perimeterCoordinates);
          
          // Check if we need to add the source
          if (map.current && !map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [perimeterCoords.map((coord: {lng: number, lat: number}) => [coord.lng, coord.lat])]
                }
              }
            });
          }
          
          // If the layer exists but we shouldn't show it
          if (map.current && hasLayer && !shouldShowPerimeters) {
            map.current.setLayoutProperty(layerId, 'visibility', 'none');
          } 
          // If the layer doesn't exist but we should show it
          else if (map.current && !hasLayer && shouldShowPerimeters) {
            // Get color based on severity
            const color = wildfire.severity === 'high' ? '#D32F2F' : 
                          wildfire.severity === 'medium' ? '#FFA000' : 
                          wildfire.severity === 'low' ? '#689F38' : '#2E7D32';
                          
            // Add layer if it doesn't exist
            map.current.addLayer({
              id: layerId,
              source: sourceId,
              type: 'fill',
              paint: {
                'fill-color': color,
                'fill-opacity': 0.3,
                'fill-outline-color': color
              }
            });
            
            // Add outline layer
            map.current.addLayer({
              id: `${layerId}-outline`,
              source: sourceId,
              type: 'line',
              paint: {
                'line-color': color,
                'line-width': 2,
                'line-opacity': 0.8
              }
            });
            
            // Track that we've added this layer
            perimeterLayersRef.current[layerId] = true;
          } 
          // If the layer exists and we should show it
          else if (map.current && hasLayer && shouldShowPerimeters) {
            map.current.setLayoutProperty(layerId, 'visibility', 'visible');
            map.current.setLayoutProperty(`${layerId}-outline`, 'visibility', 'visible');
          }
        } catch (error) {
          console.error("Error rendering perimeter for wildfire:", wildfire.id, error);
        }
      }
    });
  }, [wildfires, mapLoaded, currentZoom]);

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
