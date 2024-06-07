import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import twilio from "twilio";
import { loadEnv } from './loadEnv.mjs';
import fs from 'fs/promises';
loadEnv();

const accountSid = process.env.ACC_SID
const authToken = process.env.ACC_TOKEN
const port = process.env.PORT;
const twilio_whatspp_from = process.env.TWILIO_WHATSAPP_FROM;
const twilio_whatspp_to = process.env.TWILIO_WHATSAPP_TO;
const ORIGIN = process.env.ORIGIN

const app = express();
// Twilio configuration
const client = new twilio(accountSid, authToken);

// Multer configuration
const upload = multer();

app.use(cors({ origin: ORIGIN }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const sendWhatsAppMessage = (message) => {
    client.messages
        .create({
            body: message,
            from: twilio_whatspp_from,
            to: twilio_whatspp_to 
        })
        .then(message => console.log(`Message sent: ${message.sid}`))
        .catch(error => {
            console.error('Error sending message:', error);
            if (error.status === 400 && error.code === 63007) {
                console.error('Twilio could not find a Channel with the specified From address. Please check your Twilio WhatsApp number.');
            }
        });
};

function formatDate() {
    const date = new Date();
    return `${date.toISOString()} -`;
}


async function logToFile(data, filename) {
    try {
        await fs.appendFile(filename, `${formatDate()} ${data}\n`);
    } catch (err) {
        console.error("Error writing to log file:", err);
    }
}


app.post("/Contact", upload.single('file'), (req, res) => {
    const formData = req.body;
    const file = req.file;
    logToFile(JSON.stringify(formData, null, 2), 'contact.log');
    
    const message = `New contact submission: \n\n Details: \n ${JSON.stringify(formData, null, 2)}`;
    sendWhatsAppMessage(message);
    
    console.log(file);
    console.log(formData);
    res.json({ message: "Form submitted successfully", formData });
});

app.post("/Visited", (req, res) => {
    const visitData = req.body;

    logToFile(JSON.stringify(visitData, null, 2), 'visited.log');
    const message = `New visit recorded: \n\n Details: \n ${JSON.stringify(visitData, null, 2)}`;
    sendWhatsAppMessage(message);
    
    console.log(visitData);
    res.json({ message: "Visited Person", visitData });
});


app.get('/welcome', (req, res) => {
    res.send('Welcome to my server!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
