import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors';
// import cookieParser from 'cookie-parser'
import {createServer} from "node:http";
import { connectToSocket } from "./controller/socketManager.js";
import userRoutes from "./routes/user.routes.js"


// const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';



dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3001;

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.use(express.json({limit: "40kb"}));
// app.use(cookieParser());
app.use(express.urlencoded({limit: "40kb", extended: true}))
app.use(userRoutes);

app.get("/", (req, res) => {
    return res.json({"hello" : "World"})
})



const start = async() => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Listening on port ${PORT}`)
        })
    } catch (err) {
        console.error("❌ Error connecting to MongoDB:", err.message);
        process.exit(1);
    }
}

start();