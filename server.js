const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const session = require('express-session'); // Dodano: obsługa sesji
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Konfiguracja sesji
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_tajny_klucz_sesji', // Wartość domyślna w przypadku braku .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));

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

// Folder na frontend
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
    // Zmieniono 'username' na 'email'
    const { email, password } = req.body; 

    try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        const user = result.rows[0];
    
        // DODANA WERYFIKACJA UŻYTKOWNIKA
        if (!user) {
            return res.json({ success: false, message: "Błędne dane logowania" });
        }
    
        // Teraz możesz bezpiecznie porównać hasła
        const isMatch = await bcrypt.compare(password, user.password_hash);
    
        if (isMatch) {
            req.session.userId = user.id;
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
    // Sprawdzenie, czy użytkownik jest zalogowany
    if (!req.session.userId) {
        return res.status(403).json({ text: "Brak autoryzacji" });
    }
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
        ...req.body,
        additionalTexts: additionalTexts
    };
    res.json({ success: true });
});

// pobieranie danych z automatyzacji
app.get("/api/automation-data", (req, res) => {
    res.json(automationData);
});

// Uruchomienie serwera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));