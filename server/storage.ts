import { db } from "@db";
import * as schema from "@shared/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { type Wildfire, type Alert, type MapBounds } from "@/types/wildfire";
import { calculateDistance } from "@/lib/utils";

export const storage = {
  // Wildfires
  getAllWildfires: async (): Promise<schema.Wildfire[]> => {
    return db.query.wildfires.findMany({
      orderBy: (wildfires, { desc }) => [desc(wildfires.acres)],
    });
  },

  getWildfireById: async (id: string): Promise<schema.Wildfire | undefined> => {
    return db.query.wildfires.findFirst({
      where: eq(schema.wildfires.id, id),
    });
  },

  getWildfiresInBounds: async (bounds: MapBounds): Promise<schema.Wildfire[]> => {
    return db.query.wildfires.findMany({
      where: and(
        gte(schema.wildfires.latitude, bounds.south),
        lte(schema.wildfires.latitude, bounds.north),
        gte(schema.wildfires.longitude, bounds.west),
        lte(schema.wildfires.longitude, bounds.east)
      ),
      orderBy: (wildfires, { desc }) => [desc(wildfires.acres)],
    });
  },

  getNearbyWildfires: async (
    latitude: number,
    longitude: number,
    radiusMiles: number
  ): Promise<schema.Wildfire[]> => {
    // First, get all wildfires (we'll filter them post-query)
    const allWildfires = await db.query.wildfires.findMany();
    
    // Filter for those within the radius
    return allWildfires.filter(wildfire => {
      const distance = calculateDistance(
        latitude,
        longitude,
        wildfire.latitude,
        wildfire.longitude
      );
      return distance <= radiusMiles;
    });
  },

  getWildfireStats: async (): Promise<{
    activeFiresCount: number;
    totalAcresBurning: number;
    nearbyFiresCount?: number;
  }> => {
    const [result] = await db
      .select({
        activeFiresCount: sql<number>`count(*)`,
        totalAcresBurning: sql<number>`sum(${schema.wildfires.acres})`,
      })
      .from(schema.wildfires)
      .where(
        sql`${schema.wildfires.containment} < 100`
      );

    return {
      activeFiresCount: result?.activeFiresCount || 0,
      totalAcresBurning: result?.totalAcresBurning || 0,
    };
  },

  // Alerts
  getActiveAlerts: async (): Promise<schema.Alert[]> => {
    return db.query.alerts.findMany({
      where: eq(schema.alerts.active, true),
      orderBy: (alerts, { desc }) => [desc(alerts.createdAt)],
    });
  },

  getAlertsByWildfireId: async (wildfireId: string): Promise<schema.Alert[]> => {
    return db.query.alerts.findMany({
      where: eq(schema.alerts.wildfireId, wildfireId),
      orderBy: (alerts, { desc }) => [desc(alerts.createdAt)],
    });
  },

  subscribeToAlerts: async (
    wildfireId: string,
    email?: string,
    phone?: string
  ): Promise<{ success: boolean }> => {
    // In a real app, we'd save the subscription to the database
    // Here we'll just return success
    return { success: true };
  },

  // Updates
  getRecentUpdates: async (wildfireId: string): Promise<schema.Update[]> => {
    return db.query.updates.findMany({
      where: eq(schema.updates.wildfireId, wildfireId),
      orderBy: (updates, { desc }) => [desc(updates.timestamp)],
      limit: 5,
    });
  },
};

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
