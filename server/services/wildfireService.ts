import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '@shared/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { calculateDistance } from '../storage';

// FIRMS (Fire Information for Resource Management System) NASA API
// Documentation: https://firms.modaps.eosdis.nasa.gov/api/area/

interface FirmsFireData {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: number;
  version: string;
  bright_t31: number;
  frp: number;
  daynight: 'D' | 'N';
}

// Convert FIRMS data to our Wildfire schema
function convertFirmsToWildfire(
  firmsData: FirmsFireData[], 
  existingWildfires: schema.Wildfire[]
): schema.WildfireInsert[] {
  // Group fires by location (within a certain radius)
  const fireGroups: { [key: string]: FirmsFireData[] } = {};
  
  firmsData.forEach(fire => {
    // Use a grid-based approach to cluster nearby fires
    // Round coordinates to 2 decimal places for clustering (roughly 1km precision)
    const gridKey = `${Math.round(fire.latitude * 100) / 100},${Math.round(fire.longitude * 100) / 100}`;
    
    if (!fireGroups[gridKey]) {
      fireGroups[gridKey] = [];
    }
    
    fireGroups[gridKey].push(fire);
  });
  
  // Convert grouped fires to our Wildfire schema
  const wildfires: schema.WildfireInsert[] = [];
  
  Object.entries(fireGroups).forEach(([gridKey, fires]) => {
    // Calculate centroid for the fire group
    const totalLat = fires.reduce((sum, fire) => sum + fire.latitude, 0);
    const totalLon = fires.reduce((sum, fire) => sum + fire.longitude, 0);
    const avgLat = totalLat / fires.length;
    const avgLon = totalLon / fires.length;
    
    // Check if this fire group is close to an existing wildfire
    const existingFire = existingWildfires.find(existing => {
      const distance = calculateDistance(avgLat, avgLon, existing.latitude, existing.longitude);
      // If within 5km, consider it the same fire
      return distance < 5;
    });
    
    // Calculate average frp (Fire Radiative Power) as a proxy for fire size/intensity
    const totalFrp = fires.reduce((sum, fire) => sum + (fire.frp || 0), 0);
    const avgFrp = totalFrp / fires.length;
    
    // Estimate acres based on FRP (this is a very rough estimation)
    // FRP is in megawatts, and the relationship to acres is complex
    // This is a simplified approach for demonstration
    const estimatedAcres = Math.round(avgFrp * 2.5);
    
    // Determine severity based on FRP and confidence
    const avgConfidence = fires.reduce((sum, fire) => sum + fire.confidence, 0) / fires.length;
    let severity: 'high' | 'medium' | 'low' | 'contained' = 'low';
    
    if (avgFrp > 100 && avgConfidence > 80) {
      severity = 'high';
    } else if (avgFrp > 50 || avgConfidence > 70) {
      severity = 'medium';
    } else if (avgFrp < 10 && avgConfidence < 30) {
      severity = 'contained';
    }
    
    // Get the most recent acquisition date
    const dates = fires.map(fire => new Date(`${fire.acq_date} ${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}`));
    const mostRecentDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Create a name for the fire based on location and date
    // In a real implementation, you'd use reverse geocoding to get actual location names
    const locationName = `Lat ${avgLat.toFixed(2)}, Lon ${avgLon.toFixed(2)}`;
    const fireName = existingFire ? 
      existingFire.name : 
      `Wildfire at ${locationName}`;
    
    // Generate perimeter coordinates (simplified circle around center point for demo)
    const radiusInKm = Math.sqrt(estimatedAcres * 0.00404686 / Math.PI); // Convert acres to km²
    const perimeterCoords = generateCircleCoordinates(avgLat, avgLon, radiusInKm);
    
    const fireId = existingFire ? existingFire.id : `fire-${uuidv4().substring(0, 8)}`;
    
    wildfires.push({
      id: fireId,
      name: fireName,
      location: locationName,
      latitude: avgLat,
      longitude: avgLon,
      acres: estimatedAcres,
      // If existing fire, keep containment or default to 0
      containment: existingFire ? existingFire.containment : 0,
      // Format date as readable string
      startDate: existingFire ? existingFire.startDate : mostRecentDate.toLocaleDateString(),
      severity,
      cause: 'Unknown', // FIRMS data doesn't include cause information
      perimeterCoordinates: JSON.stringify(perimeterCoords),
      updated: new Date()
    });
  });
  
  return wildfires;
}

// Generate circle coordinates around a point (similar to seed.ts)
function generateCircleCoordinates(centerLat: number, centerLng: number, radiusInKm: number, points: number = 30) {
  const coordinates = [];
  const angularDistance = 2 * Math.PI / points;
  
  for (let i = 0; i < points; i++) {
    const angle = i * angularDistance;
    
    // Calculate coordinates
    const latOffset = (radiusInKm / 111.32) * Math.cos(angle); // 1 degree of latitude is approximately 111.32 km
    const lngFactor = Math.cos(centerLat * Math.PI / 180);
    const lngOffset = (radiusInKm / (111.32 * lngFactor)) * Math.sin(angle);
    
    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    
    coordinates.push({ lng, lat });
  }
  
  // Close the loop
  coordinates.push(coordinates[0]);
  
  return coordinates;
}

export async function fetchAndUpdateWildfires() {
  try {
    console.log('Fetching wildfire data from NASA FIRMS API...');
    
    // Use the NASA FIRMS API to get active fire data
    // North America region for demo (modify as needed)
    const northBound = 50;
    const southBound = 25;
    const eastBound = -60;
    const westBound = -130;
    
    // Use the NASA FIRMS API with the provided API key
    const apiKey = process.env.NASA_FIRMS_API_KEY;
    
    if (!apiKey) {
      throw new Error('NASA_FIRMS_API_KEY environment variable is not set');
    }
    
    // Documentation: https://firms.modaps.eosdis.nasa.gov/api/area/
    // Set up various sources and time ranges as options
    // MODIS_NRT: MODIS Near Real-Time, VIIRS_NOAA20_NRT: VIIRS NOAA-20 Near Real-Time
    const source = 'MODIS_NRT'; 
    const area = 'world';
    const dayRange = 1; // 1 day of data
    
    const apiUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${source}/${area}/${dayRange}`;
    
    console.log("Fetching data from NASA FIRMS API...");
    const response = await axios.get(apiUrl);
    
    console.log("NASA FIRMS API response status:", response.status);
    
    const firmsData: FirmsFireData[] = [];
    
    // Check if we got a valid response
    if (!response.data || typeof response.data !== 'string') {
      console.error("Invalid response from NASA FIRMS API");
      return { success: false, error: "Invalid response from NASA FIRMS API" };
    }
    
    // Get a small sample of the response for debugging
    console.log("NASA FIRMS API response data preview:", 
               response.data.substring(0, 200) + "...");
    
    // Parse CSV response (simplified handling for demo)
    const lines = response.data.split('\n');
    
    if (lines.length === 0) {
      console.error("No data returned from NASA FIRMS API");
      return { success: false, error: "No data returned from NASA FIRMS API" };
    }
    
    const headers = lines[0].split(',');
    console.log("Found headers:", headers);
    
    // Process each line of the CSV data
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      
      const values = lines[i].split(',');
      const fireData: any = {};
      
      headers.forEach((header: string, index: number) => {
        if (index >= values.length) return;
        const value = values[index];
        
        // Convert numeric values to numbers
        if (header === 'latitude' || header === 'longitude' || header === 'brightness' || 
            header === 'scan' || header === 'track' || header === 'confidence' || 
            header === 'bright_t31' || header === 'frp') {
          fireData[header] = parseFloat(value);
        } else {
          fireData[header] = value;
        }
      });
      
      // Filter fires by geographic bounds
      if (fireData.latitude >= southBound && fireData.latitude <= northBound &&
          fireData.longitude >= westBound && fireData.longitude <= eastBound) {
        firmsData.push(fireData as FirmsFireData);
      }
    }
    
    console.log(`Parsed ${firmsData.length} fires from NASA FIRMS data`);
    
    // Get existing wildfires from our database
    const existingWildfires = await db.query.wildfires.findMany();
    
    // Convert FIRMS data to our schema
    const wildfires = convertFirmsToWildfire(firmsData, existingWildfires);
    
    // Update database with new/updated wildfires
    for (const wildfire of wildfires) {
      const exists = await db.query.wildfires.findFirst({
        where: eq(schema.wildfires.id, wildfire.id)
      });
      
      if (!exists) {
        await db.insert(schema.wildfires).values(wildfire);
        console.log(`Inserted new wildfire: ${wildfire.name}`);
      } else {
        await db.update(schema.wildfires)
          .set({
            acres: wildfire.acres,
            severity: wildfire.severity,
            perimeterCoordinates: wildfire.perimeterCoordinates,
            updated: wildfire.updated
          })
          .where(eq(schema.wildfires.id, wildfire.id));
        console.log(`Updated wildfire: ${wildfire.name}`);
      }
    }
    
    return { success: true, count: wildfires.length };
  } catch (error) {
    console.error('Error fetching wildfire data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}