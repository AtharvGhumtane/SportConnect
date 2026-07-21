import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wipeData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/aim-gold";
    console.log(`Connecting to MongoDB to wipe demo data: ${mongoURI}`);
    await mongoose.connect(mongoURI);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (let col of collections) {
      console.log(`Dropping collection: ${col.name}`);
      await db.dropCollection(col.name);
    }
    console.log("✅ All MongoDB collections wiped successfully!");

    // Clean uploads directory (keep default.jpg)
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.toLowerCase() !== 'default.jpg') {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch (e) {
            console.error(`Could not delete file ${file}:`, e.message);
          }
        }
      }
      console.log("✅ Uploads directory cleaned (preserved default.jpg)!");
    }

    console.log("✨ Database and upload storage are now completely fresh!");
    process.exit(0);
  } catch (err) {
    console.error("Wipe data error:", err);
    process.exit(1);
  }
};

wipeData();
