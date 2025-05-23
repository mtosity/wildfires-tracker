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
  onMapInit?: (mapInstance: mapboxgl.Map) => void;
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
  userLocation,
  onMapInit
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const clusterMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const perimeterLayersRef = useRef<{ [key: string]: boolean }>({});
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(4);
  const [viewportBounds, setViewportBounds] = useState<mapboxgl.LngLatBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialPosition?.longitude || -98.5795,
    initialPosition?.latitude || 39.8283
  ]);
  
  // World view position
  const defaultPosition = {
    latitude: 20,
    longitude: 0,
    zoom: 2
  };
  
  // Check if a wildfire is active (not contained or 100% contained)
  const isActiveWildfire = useCallback((wildfire: Wildfire): boolean => {
    return wildfire.severity !== 'contained' && wildfire.containment < 100;
  }, []);
  
  // Convert only active wildfires to GeoJSON features for clustering
  const points = useMemo((): PointFeature[] => {
    return wildfires
      .filter(isActiveWildfire)
      .map(wildfire => ({
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
  }, [wildfires, isActiveWildfire]);

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
    if (!viewportBounds || !mapLoaded || !supercluster || points.length === 0) return [];
    
    const bbox: [number, number, number, number] = [
      viewportBounds.getWest(),
      viewportBounds.getSouth(),
      viewportBounds.getEast(),
      viewportBounds.getNorth()
    ];
    
    try {
      return supercluster.getClusters(bbox, Math.floor(currentZoom));
    } catch (error) {
      console.error("Error getting clusters:", error);
      return [];
    }
  }, [supercluster, viewportBounds, currentZoom, mapLoaded, points.length]);
  
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

  // Get the current theme from both document class and localStorage
  const getThemeMode = () => {
    // Check the document class first
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    
    // If not in class, check localStorage as a fallback
    const storedTheme = localStorage.getItem('ui-theme');
    if (storedTheme === 'dark') {
      return 'dark';
    } else if (storedTheme === 'system') {
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return 'light';
  };

  useEffect(() => {
    if (!mapboxgl.supported()) {
      console.error('Your browser does not support Mapbox GL');
      return;
    }

    // Use a public token if not provided via environment variables
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

    if (mapContainer.current && !map.current) {
      // Determine if dark mode is active - check both classes and localStorage
      const isDarkMode = getThemeMode() === 'dark';
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        // Use dark style for dark mode, light style for light mode
        style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: [initialPosition?.longitude || defaultPosition.longitude, initialPosition?.latitude || defaultPosition.latitude],
        zoom: initialPosition?.zoom || defaultPosition.zoom
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        if (map.current) {
          // Notify parent component about map initialization
          if (onMapInit) {
            onMapInit(map.current);
          }
          
          // Set the initial viewport bounds
          setViewportBounds(map.current.getBounds());
        }
      });

      // Use throttled events for better performance
      const handleMapMove = throttle(() => {
        if (map.current) {
          setCurrentZoom(map.current.getZoom());
          setMapCenter([map.current.getCenter().lng, map.current.getCenter().lat]);
          
          const bounds = map.current.getBounds();
          setViewportBounds(bounds);
          
          if (onMapMove && bounds) {
            onMapMove(bounds);
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
      // Remove user location marker if it exists
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      
      // Remove the map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialPosition, throttle]);

  // Create or update the user location marker
  const createUserLocationMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    
    // If we already have a marker, just update its position
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLngLat([lng, lat]);
      return;
    }
    
    // Create a new marker element
    const el = document.createElement('div');
    el.className = 'w-5 h-5 relative flex items-center justify-center';
    
    // Add a pulsing effect
    const pulseRing = document.createElement('div');
    pulseRing.className = 'absolute w-full h-full bg-blue-500 opacity-70 rounded-full animate-ping';
    el.appendChild(pulseRing);
    
    // Add the center marker dot
    const centerDot = document.createElement('div');
    centerDot.className = 'absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white z-10';
    el.appendChild(centerDot);
    
    // Create and store the marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);
    
    userLocationMarkerRef.current = marker;
  }, []);
  
  // Handle user location updates
  useEffect(() => {
    if (map.current && userLocation && mapLoaded) {
      // Create or update user location marker
      createUserLocationMarker(userLocation.longitude, userLocation.latitude);
      
      // Fly to user location
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 6, // Zoom level that shows the user location and surrounding region
        essential: true,
        duration: 2000
      });
    }
  }, [userLocation, mapLoaded, createUserLocationMarker]);

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
    
    // Skip rendering markers when there's a selected wildfire (we want to hide them all)
    if (selectedWildfire) {
      console.log("Skipping marker rendering because a wildfire is selected");
      return;
    }

    console.log("Rendering map with clusters:", clusters.length);
    
    // Clear old markers for better performance
    clearAllMarkers();
    
    // Add new clusters and markers
    clusters.forEach(cluster => {
      if (!cluster || !cluster.geometry || !cluster.properties) return;
      
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
          if (!supercluster) return;
          try {
            const expansionZoom = Math.min(
              supercluster.getClusterExpansionZoom(cluster.properties.cluster_id),
              16
            );
            map.current?.flyTo({
              center: [longitude, latitude],
              zoom: expansionZoom,
              essential: true
            });
          } catch (error) {
            console.error("Error expanding cluster:", error);
          }
        });
        
        // Create and store marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
        
        clusterMarkersRef.current[clusterId] = marker;
      } else {
        // It's a single point
        const wildfire = cluster.properties.wildfire;
        if (!wildfire) return;
        
        // Only render if wildfire is in current viewport (virtualization)
        if (viewportBounds && 
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
          // Softer, easier-on-the-eyes colors
          dotEl.style.backgroundColor = wildfire.severity === 'high' ? '#FF8A80' : 
                                        wildfire.severity === 'medium' ? '#FFD180' : 
                                        wildfire.severity === 'low' ? '#CCFF90' : '#B9F6CA';
          
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

  // Add perimeter for a specific wildfire
  const addPerimeterForWildfire = useCallback((wildfire: Wildfire) => {
    if (!map.current || !mapLoaded || !wildfire.perimeterCoordinates) return;
    
    const sourceId = `perimeter-source-${wildfire.id}`;
    const layerId = `perimeter-layer-${wildfire.id}`;
    const hasLayer = perimeterLayersRef.current[layerId];
    
    // If we already have this layer, just make sure it's visible
    if (hasLayer) {
      try {
        map.current.setLayoutProperty(layerId, 'visibility', 'visible');
        map.current.setLayoutProperty(`${layerId}-outline`, 'visibility', 'visible');
        return;
      } catch (error) {
        console.error("Error showing existing perimeter layer:", error);
      }
    }
    
    try {
      // Parse perimeter coordinates
      let perimeterCoords;
      try {
        perimeterCoords = JSON.parse(wildfire.perimeterCoordinates);
        if (!Array.isArray(perimeterCoords) || perimeterCoords.length === 0) {
          return; // Skip if perimeter data isn't valid
        }
      } catch (parseError) {
        console.error("Error parsing perimeter coordinates:", parseError);
        return;
      }
      
      // Add source if it doesn't exist
      if (!map.current.getSource(sourceId)) {
        try {
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
        } catch (sourceError) {
          console.error("Error adding source for wildfire:", wildfire.id, sourceError);
          return;
        }
      }
      
      // Get color based on severity - using softer colors to match markers
      const color = wildfire.severity === 'high' ? '#FF8A80' : 
                    wildfire.severity === 'medium' ? '#FFD180' : 
                    wildfire.severity === 'low' ? '#CCFF90' : '#B9F6CA';
      
      // Add the fill layer
      try {
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
      } catch (layerError) {
        console.error("Error adding layer for wildfire:", wildfire.id, layerError);
      }
    } catch (error) {
      console.error("Error rendering perimeter for wildfire:", wildfire.id, error);
    }
  }, [mapLoaded]);
  
  // Hide all perimeters
  const hideAllPerimeters = useCallback(() => {
    if (!map.current) return;
    
    Object.keys(perimeterLayersRef.current).forEach(layerId => {
      try {
        const outlineLayerId = layerId + '-outline';
        map.current?.setLayoutProperty(layerId, 'visibility', 'none');
        map.current?.setLayoutProperty(outlineLayerId, 'visibility', 'none');
      } catch (error) {
        console.error("Error hiding perimeter layer:", layerId, error);
      }
    });
  }, []);
  
  // Hide all markers
  const hideAllMarkers = useCallback(() => {
    if (!map.current) return;
    
    Object.values(markersRef.current).forEach(marker => {
      marker.getElement().style.display = 'none';
    });
  }, []);
  
  // Show all markers
  const showAllMarkers = useCallback(() => {
    if (!map.current) return;
    
    Object.values(markersRef.current).forEach(marker => {
      marker.getElement().style.display = 'block';
    });
  }, []);
  
  // Show perimeter for selected wildfire and hide markers
  // Monitor theme changes and update map style
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          map.current
        ) {
          const isDarkMode = getThemeMode() === 'dark';
          
          // Update map style
          map.current.setStyle(
            isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
          );
          
          // After style change, restore any needed layers
          map.current.once('style.load', () => {
            if (map.current) {
              try {
                // Style loaded successfully
                
                // If we have a user location, restore the marker
                if (userLocation) {
                  createUserLocationMarker(userLocation.longitude, userLocation.latitude);
                }
              } catch (error) {
                console.error("Error restoring map style after change:", error);
              }
            }
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, [mapLoaded, createUserLocationMarker, userLocation]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // First hide all perimeters
    hideAllPerimeters();
    
    if (selectedWildfire) {
      // Hide all markers when a wildfire is selected to focus on perimeter
      hideAllMarkers();
      
      // If we have perimeter data, show it
      if (selectedWildfire.perimeterCoordinates) {
        addPerimeterForWildfire(selectedWildfire);
      }
    } else {
      // Show all markers when no wildfire is selected
      showAllMarkers();
    }
  }, [selectedWildfire, mapLoaded, addPerimeterForWildfire, hideAllPerimeters, hideAllMarkers, showAllMarkers]);

  // Fly to the selected wildfire
  useEffect(() => {
    if (map.current && selectedWildfire && mapLoaded) {
      // Use a higher zoom level if the wildfire has perimeter data
      const zoomLevel = selectedWildfire.perimeterCoordinates ? 12 : 10;
      
      map.current.flyTo({
        center: [selectedWildfire.longitude, selectedWildfire.latitude],
        zoom: zoomLevel,
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
