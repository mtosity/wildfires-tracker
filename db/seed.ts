import { db } from "./index";
import * as schema from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

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

    // Insert wildfires if they don't already exist
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
          updated: wildfire.updated
        });
        console.log(`Inserted wildfire: ${wildfire.name}`);
      } else {
        console.log(`Wildfire already exists: ${wildfire.name}`);
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
