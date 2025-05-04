import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import NodeCache from "node-cache";

// Cache to prevent too many API calls
const apiCache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
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

  // Get nearby wildfires
  app.get(`${apiPrefix}/wildfires/nearby`, async (req, res) => {
    try {
      const { latitude, longitude, radius = 100 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const nearbyWildfires = await storage.getNearbyWildfires(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string)
      );
      
      res.json({ wildfires: nearbyWildfires });
    } catch (error) {
      console.error("Error fetching nearby wildfires:", error);
      res.status(500).json({ message: "Failed to fetch nearby wildfire data" });
    }
  });

  // Get wildfire statistics
  app.get(`${apiPrefix}/wildfires/stats`, async (req, res) => {
    try {
      const stats = await storage.getWildfireStats();
      
      // If user location is provided, get nearby fires count
      if (req.query.latitude && req.query.longitude) {
        const nearbyWildfires = await storage.getNearbyWildfires(
          parseFloat(req.query.latitude as string),
          parseFloat(req.query.longitude as string),
          100 // Default radius of 100 miles
        );
        
        stats.nearbyFiresCount = nearbyWildfires.length;
      } else {
        stats.nearbyFiresCount = 0;
      }
      
      res.json({ stats });
    } catch (error) {
      console.error("Error fetching wildfire stats:", error);
      res.status(500).json({ message: "Failed to fetch wildfire statistics" });
    }
  });

  // Get active alerts
  app.get(`${apiPrefix}/alerts/active`, async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json({ alerts });
    } catch (error) {
      console.error("Error fetching active alerts:", error);
      res.status(500).json({ message: "Failed to fetch active alerts" });
    }
  });

  // Get alerts for a specific wildfire
  app.get(`${apiPrefix}/alerts/wildfire/:id`, async (req, res) => {
    try {
      const alerts = await storage.getAlertsByWildfireId(req.params.id);
      res.json({ alerts });
    } catch (error) {
      console.error("Error fetching wildfire alerts:", error);
      res.status(500).json({ message: "Failed to fetch wildfire alerts" });
    }
  });

  // Subscribe to alerts for a wildfire
  app.post(`${apiPrefix}/alerts/subscribe`, async (req, res) => {
    try {
      const { wildfireId, email, phone } = req.body;
      
      if (!wildfireId) {
        return res.status(400).json({ message: "Wildfire ID is required" });
      }
      
      // At least one contact method is required
      if (!email && !phone) {
        return res.status(400).json({ message: "Email or phone number is required" });
      }
      
      const result = await storage.subscribeToAlerts(wildfireId, email, phone);
      res.json(result);
    } catch (error) {
      console.error("Error subscribing to alerts:", error);
      res.status(500).json({ message: "Failed to subscribe to alerts" });
    }
  });

  // Get recent updates for a wildfire
  app.get(`${apiPrefix}/updates/wildfire/:id`, async (req, res) => {
    try {
      const updates = await storage.getRecentUpdates(req.params.id);
      res.json({ updates });
    } catch (error) {
      console.error("Error fetching wildfire updates:", error);
      res.status(500).json({ message: "Failed to fetch wildfire updates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
