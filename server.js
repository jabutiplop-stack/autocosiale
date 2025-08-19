const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch"); // dla webhooka
const path = require("path");
const { Pool } = require('pg'); // Dodano import dla bazy danych
const bcrypt = require('bcryptjs'); // Dodano import dla haszowania haseł
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Konfiguracja połączenia z bazą danych
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  module.exports = {
    query: (text, params) => pool.query(text, params),
  };
// folder na frontend
app.use(express.static(path.join(__dirname, "public")));



// przechowywanie danych z automatyzacji
let automationData = {};
// te trzy teksty, które mają być zawsze wyświetlane
const additionalTexts = [
    "Post AI agent:",
    "Validatro:",
    "Prompt Generator:"
];
// logowanie
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(query, [username]);
        const user = result.rows[0];

        if (!user) {
            return res.json({ success: false, message: "Błędne dane logowania" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({ success: true, message: "Zalogowano pomyślnie" });
        } else {
            res.json({ success: false, message: "Błędne dane logowania" });
        }
    } catch (err) {
        console.error("Błąd logowania:", err);
        res.status(500).json({ success: false, message: "Wystąpił błąd serwera" });
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
