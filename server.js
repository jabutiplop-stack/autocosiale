const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch"); // dla webhooka
const path = require("path");


const app = express();
app.use(cors());
app.use(bodyParser.json());

// folder na frontend
app.use(express.static(path.join(__dirname, "public")));

// predefiniowany login
const USERNAME = "admin";
const PASSWORD = "password123";

// przechowywanie danych z automatyzacji
let automationData = {};
// te trzy teksty, które mają być zawsze wyświetlane
const additionalTexts = [
    "Post AI agent:",
    "Validatro:",
    "Prompt Generator:"
];
// logowanie
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === USERNAME && password === PASSWORD) {
        res.json({ success: true, message: "Zalogowano pomyślnie" });
    } else {
        res.json({ success: false, message: "Błędne dane logowania" });
    }
});

// wysyłanie postów (formularz)
app.post("/api/post", async (req, res) => {
    const { postTitle, hasImage } = req.body;

    try {
        await fetch("https://e6dd35b8037f.ngrok-free.app/webhook/02c049af-0e06-4e69-8377-8c24554f37d8", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postTitle, hasImage })
        });

        res.json({
            text: "Twój post został wysłany!",
        });
    } catch (err) {
        console.error("Błąd wysyłania webhooka:", err);
        res.status(500).json({ text: "Błąd wysyłania posta" });
    }
});

// odbiór danych z automatyzacji
app.post("/api/automation-webhook", (req, res) => {
    automationData = {
        ...req.body, // Zachowaj istniejące dane (text, imageUrl)
        additionalTexts: additionalTexts // Dodaj nowe teksty do obiektu
    };
    res.json({ success: true });
});

// pobieranie danych z automatyzacji
app.get("/api/automation-data", (req, res) => {
    // Zwracamy cały obiekt, który teraz zawiera również additionalTexts
    res.json(automationData);
});

// uruchomienie serwera
const PORT = 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
