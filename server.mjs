// Import necessary modules
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import { loadEnv } from './loadEnv.mjs';
loadEnv();

const port = 3000;
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define schemas and models for MongoDB
const ContactSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    city: { type: String, required: true },
    telephone: { type: String, required: true },
    address: { type: String, required: true },
    message: { type: String, required: true },
    file: { data: Buffer, contentType: String },
    SchDate: { type: Date },
    date: { type: Date, default: Date.now }
});

const VisitSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', ContactSchema);
const Visit = mongoose.model('Visit', VisitSchema);

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffer
const upload = multer({ storage: storage });



// Route to handle Contact form submissions
app.post("/Contact", upload.single('file'), async (req, res) => {
    const formData = req.body;
    const file = req.file;

    // Validate form data
    if (!formData.fullName || !formData.city || !formData.telephone || !formData.address || !formData.message) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Save data to MongoDB
    const newContact = new Contact({
        fullName: formData.fullName,
        city: formData.city,
        telephone: formData.telephone,
        address: formData.address,
        message: formData.message,
        file: {
            data: file.buffer,
            contentType: file.mimetype
        },
        SchDate: formData.date,
        date: new Date()
    });

    try {
        const savedContact = await newContact.save();
        res.json({ message: "Form submitted successfully", formData: savedContact });
    } catch (err) {
        console.error("Error saving contact:", err);
        res.status(500).json({ error: "Failed to save contact" });
    }
});

// Route to handle Visit records
app.post("/Visited", async (req, res) => {
    const visitData = req.body;

    // Validate visit data
    if (!visitData.email || !visitData.phoneNumber) {
        return res.status(400).json({ error: "Email and phone number are required" });
    }

    // Save data to MongoDB
    const newVisit = new Visit({
        email: visitData.email,
        phoneNumber: visitData.phoneNumber,
        date: new Date()
    });

    try {
        const savedVisit = await newVisit.save();
        res.json({ message: "Visit recorded successfully", visitData: savedVisit });
    } catch (err) {
        console.error("Error saving visit:", err);
        res.status(500).json({ error: "Failed to save visit" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
