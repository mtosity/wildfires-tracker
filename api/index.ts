// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import { db } from "../db/index.js";
import * as schema from "../shared/schema.js";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import axios from "axios";
import NodeCache from "node-cache";

// Cache to prevent too many API calls
const apiCache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Utility function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Storage functions
const storage = {
  getAllWildfires: async () => {
    return db.query.wildfires.findMany({
      orderBy: (wildfires, { desc }) => [desc(wildfires.acres)],
    });
  },

  getWildfireById: async (id: string) => {
    return db.query.wildfires.findFirst({
      where: eq(schema.wildfires.id, id),
    });
  },

  getWildfiresInBounds: async (bounds: any) => {
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

  getNearbyWildfires: async (lat: number, lng: number, radius: number) => {
    const allWildfires = await db.query.wildfires.findMany();
    return allWildfires.filter(fire => {
      const distance = calculateDistance(lat, lng, fire.latitude, fire.longitude);
      return distance <= radius;
    });
  },

  getWildfireStats: async () => {
    const result = await db.select({
      activeFiresCount: sql<number>`count(*)`,
      totalAcresBurning: sql<number>`sum(${schema.wildfires.acres})`,
    }).from(schema.wildfires);
    
    return {
      activeFiresCount: result[0].activeFiresCount || 0,
      totalAcresBurning: result[0].totalAcresBurning || 0,
      nearbyFiresCount: 0
    };
  },

  getActiveAlerts: async () => {
    return db.query.alerts.findMany({
      where: eq(schema.alerts.active, true),
    });
  },

  getAlertsByWildfireId: async (wildfireId: string) => {
    return db.query.alerts.findMany({
      where: eq(schema.alerts.wildfireId, wildfireId),
    });
  },

  subscribeToAlerts: async (wildfireId: string, email?: string, phone?: string) => {
    // This is a simplified version - in production you'd want proper subscription logic
    return { success: true, message: "Subscription functionality not implemented yet" };
  },

  getRecentUpdates: async (wildfireId: string) => {
    // This is a simplified version - in production you'd have an updates table
    return [];
  }
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes
const apiPrefix = "/api";

// Get all wildfires or within bounds
app.get(`${apiPrefix}/wildfires`, async (req, res) => {
  try {
    const bounds = req.query.bounds ? JSON.parse(req.query.bounds as string) : null;
    let wildfires;

    if (bounds && 
        typeof bounds.north === 'number' && 
        typeof bounds.south === 'number' && 
        typeof bounds.east === 'number' && 
        typeof bounds.west === 'number') {
      wildfires = await storage.getWildfiresInBounds(bounds);
    } else {
      wildfires = await storage.getAllWildfires();
    }

    res.json({ wildfires });
  } catch (error) {
    console.error("Error fetching wildfires:", error);
    res.status(500).json({ message: "Failed to fetch wildfire data" });
  }
});

// Get wildfire statistics
app.get(`${apiPrefix}/wildfires/stats`, async (req, res) => {
  try {
    const stats = await storage.getWildfireStats();
    
    if (req.query.latitude && req.query.longitude) {
      const nearbyWildfires = await storage.getNearbyWildfires(
        parseFloat(req.query.latitude as string),
        parseFloat(req.query.longitude as string),
        100
      );
      stats.nearbyFiresCount = nearbyWildfires.length;
    }
    
    res.json({ stats });
  } catch (error) {
    console.error("Error fetching wildfire stats:", error);
    res.json({ 
      stats: {
        activeFiresCount: 0,
        totalAcresBurning: 0,
        nearbyFiresCount: 0
      }
    });
  }
});

// Get nearby wildfires
app.get(`${apiPrefix}/wildfires/nearby`, async (req, res) => {
  try {
    const { latitude, longitude, radius = 100 } = req.query;
    
    if (!latitude || !longitude) {
      return res.json({ wildfires: [] });
    }
    
    const nearbyWildfires = await storage.getNearbyWildfires(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      parseFloat(radius as string)
    );
    
    res.json({ wildfires: nearbyWildfires });
  } catch (error) {
    console.error("Error fetching nearby wildfires:", error);
    res.json({ wildfires: [] });
  }
});

// Get a specific wildfire by ID
app.get(`${apiPrefix}/wildfires/:id`, async (req, res) => {
  try {
    const wildfire = await storage.getWildfireById(req.params.id);
    
    if (!wildfire) {
      return res.status(404).json({ message: "Wildfire not found" });
    }
    
    res.json({ wildfire });
  } catch (error) {
    console.error("Error fetching wildfire:", error);
    res.status(500).json({ message: "Failed to fetch wildfire data" });
  }
});

// Get active alerts
app.get(`${apiPrefix}/alerts/active`, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const allAlerts = await storage.getActiveAlerts();
    
    if (latitude && longitude) {
      const nearbyWildfires = await storage.getNearbyWildfires(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        100
      );
      
      const nearbyWildfireIds = nearbyWildfires.map(fire => fire.id);
      const nearbyAlerts = allAlerts.filter(alert => 
        alert.wildfireId && nearbyWildfireIds.includes(alert.wildfireId)
      );
      
      res.json({ alerts: nearbyAlerts });
    } else {
      res.json({ alerts: allAlerts });
    }
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    res.status(500).json({ message: "Failed to fetch active alerts" });
  }
});

export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};