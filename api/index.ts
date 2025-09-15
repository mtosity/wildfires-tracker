// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import { registerRoutes } from "../server/routes";
import express from "express";

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

// Register API routes - this will return the HTTP server
let server: any = null;

const initializeServer = async () => {
  if (!server) {
    server = await registerRoutes(app);
  }
  return app;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  await initializeServer();
  return app(req, res);
};