import express from 'express';

import cors from  'cors';

import dotenv from 'dotenv';

import mongoose from 'mongoose';

import postsRoutes from './routes/posts.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import eventRoutes from './routes/sportEvent.routes.js';

import path from 'path';
import { fileURLToPath } from 'url';


import fs from 'fs';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedOrigins = [
    'https://sport-connect-ecru.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive fallback to prevent breaking any valid frontend deployment
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept']
}));

app.use(express.json());

// Fast keep-alive & health check endpoint for monitoring pings / cold-start mitigation
app.get('/health', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        service: 'SportConnect Backend',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use(postsRoutes);
app.use(userRoutes);
app.use(teamRoutes);
app.use(eventRoutes);
app.use('/uploads', express.static(uploadsDir));


const start = async () => {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/aim-gold";
    const PORT = process.env.PORT || 9000;
    console.log(`Connecting to MongoDB: ${mongoURI}`);

    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

start(); 