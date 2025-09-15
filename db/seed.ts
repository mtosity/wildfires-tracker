import { db } from "./index";
import * as schema from "../shared/schema.js";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding database...");

    // Helper function to check if data exists
    const wildfireExists = async (id: string) => {
      const existing = await db.query.wildfires.findFirst({
        where: (wildfires, { eq }) => eq(wildfires.id, id)
      });
      return !!existing;
    };

    // Helper function to generate circle coordinates around a point
    const generateCircleCoordinates = (centerLat: number, centerLng: number, radiusInKm: number, points: number = 30) => {
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
    };
    
    // Calculate radius (in km) from acres
    const acresAreaToRadius = (acres: number) => {
      // 1 acre is approximately 0.00404686 km²
      const areaInKm2 = acres * 0.00404686;
      
      // Area of a circle is πr²
      // r = sqrt(area / π)
      return Math.sqrt(areaInKm2 / Math.PI);
    };

    // Sample wildfire data
    const wildfires = [
      {
        id: "crf-001",
        name: "California Ridge Fire",
        location: "Yosemite National Park, CA",
        latitude: 37.8651,
        longitude: -119.5383,
        acres: 1243,
        containment: 15,
        startDate: "Sep 12, 2023",
        severity: "high",
        cause: "Lightning",
        perimeterCoordinates: JSON.stringify(generateCircleCoordinates(37.8651, -119.5383, acresAreaToRadius(1243))),
        newsUrl: "https://www.nps.gov/yose/learn/news/wildfire.htm",
        updated: new Date()
      },
      {
        id: "emf-002",
        name: "Eagle Mountain Fire",
        location: "Eagle County, CO",
        latitude: 39.6553,
        longitude: -106.8287,
        acres: 487,
        containment: 45,
        startDate: "Sep 14, 2023",
        severity: "medium",
        cause: "Human",
        perimeterCoordinates: JSON.stringify(generateCircleCoordinates(39.6553, -106.8287, acresAreaToRadius(487))),
        updated: new Date()
      },
      {
        id: "blf-003",
        name: "Blue Lake Fire",
        location: "Sierra National Forest, CA",
        latitude: 37.2046,
        longitude: -119.2539,
        acres: 150,
        containment: 85,
        startDate: "Sep 10, 2023",
        severity: "low",
        cause: "Unknown",
        perimeterCoordinates: JSON.stringify(generateCircleCoordinates(37.2046, -119.2539, acresAreaToRadius(150))),
        updated: new Date()
      },
      {
        id: "rrf-004",
        name: "Red Rock Fire",
        location: "Coconino County, AZ",
        latitude: 35.9728,
        longitude: -111.9876,
        acres: 3200,
        containment: 10,
        startDate: "Sep 8, 2023",
        severity: "high",
        cause: "Lightning",
        perimeterCoordinates: JSON.stringify(generateCircleCoordinates(35.9728, -111.9876, acresAreaToRadius(3200))),
        newsUrl: "https://www.fs.usda.gov/coconino/",
        updated: new Date()
      },
      {
        id: "gbf-005",
        name: "Green Basin Fire",
        location: "Wasatch County, UT",
        latitude: 40.6461,
        longitude: -111.4980,
        acres: 890,
        containment: 60,
        startDate: "Sep 13, 2023",
        severity: "medium",
        cause: "Campfire",
        perimeterCoordinates: JSON.stringify(generateCircleCoordinates(40.6461, -111.4980, acresAreaToRadius(890))),
        updated: new Date()
      }
    ];

    // Sample alerts
    const alerts = [
      {
        id: "alert-001",
        type: "evacuation",
        title: "Evacuation Order",
        message: "Eagle Mountain Fire - Zones 2 & 3",
        severity: "high",
        wildfireId: "emf-002",
        zones: ["Zone 2", "Zone 3"],
        active: true,
        createdAt: new Date()
      },
      {
        id: "alert-002",
        type: "warning",
        title: "Air Quality Warning",
        message: "Poor air quality near California Ridge Fire",
        severity: "medium",
        wildfireId: "crf-001",
        zones: ["All areas"],
        active: true,
        createdAt: new Date()
      }
    ];

    // Sample updates
    const updates = [
      {
        wildfireId: "crf-001",
        content: "Containment increased to 15%",
        timestamp: new Date("2023-09-14T10:30:00Z")
      },
      {
        wildfireId: "crf-001",
        content: "Evacuation orders expanded to Zone 3",
        timestamp: new Date("2023-09-13T18:15:00Z")
      },
      {
        wildfireId: "emf-002",
        content: "Fire growth slowed due to favorable weather",
        timestamp: new Date("2023-09-15T09:45:00Z")
      }
    ];

    // Insert wildfires if they don't already exist, otherwise update with perimeter data
    for (const wildfire of wildfires) {
      const exists = await wildfireExists(wildfire.id);
      if (!exists) {
        await db.insert(schema.wildfires).values({
          id: wildfire.id,
          name: wildfire.name,
          location: wildfire.location,
          latitude: wildfire.latitude,
          longitude: wildfire.longitude,
          acres: wildfire.acres,
          containment: wildfire.containment,
          startDate: wildfire.startDate,
          severity: wildfire.severity,
          cause: wildfire.cause,
          perimeterCoordinates: wildfire.perimeterCoordinates,
          newsUrl: (wildfire as any).newsUrl, // Type assertion for the optional property
          updated: wildfire.updated
        });
        console.log(`Inserted wildfire: ${wildfire.name}`);
      } else {
        // Update the existing wildfire with perimeter coordinates and news URL
        await db.update(schema.wildfires)
          .set({ 
            perimeterCoordinates: wildfire.perimeterCoordinates,
            newsUrl: (wildfire as any).newsUrl // Add news URL to existing records 
          })
          .where(eq(schema.wildfires.id, wildfire.id));
        console.log(`Updated wildfire: ${wildfire.name} with perimeter coordinates`);
      }
    }

    // Insert alerts
    for (const alert of alerts) {
      const exists = await db.query.alerts.findFirst({
        where: (alerts, { eq }) => eq(alerts.id, alert.id)
      });

      if (!exists) {
        await db.insert(schema.alerts).values({
          id: alert.id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          wildfireId: alert.wildfireId,
          zones: alert.zones,
          active: alert.active,
          createdAt: alert.createdAt
        });
        console.log(`Inserted alert: ${alert.title}`);
      } else {
        console.log(`Alert already exists: ${alert.title}`);
      }
    }

    // Insert updates
    for (const update of updates) {
      // Check if update exists (by content and wildfire ID)
      const exists = await db.query.updates.findFirst({
        where: (dbUpdates, { and, eq }) => and(
          eq(dbUpdates.wildfireId, update.wildfireId),
          eq(dbUpdates.content, update.content)
        )
      });

      if (!exists) {
        await db.insert(schema.updates).values({
          wildfireId: update.wildfireId,
          content: update.content,
          timestamp: update.timestamp
        });
        console.log(`Inserted update for wildfire ID ${update.wildfireId}`);
      } else {
        console.log(`Update already exists for wildfire ID ${update.wildfireId}`);
      }
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
