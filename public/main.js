document.addEventListener('DOMContentLoaded', () => {
    const express = require('express');
    const bcrypt = require('bcrypt');
    const db = require('./db'); // Upewnij się, że importujesz skonfigurowane połączenie z bazą
    const app = express();
    // ----------------------------------------
    // Logika dla formularza logowania (login.html)
    // ----------------------------------------
    app.post('/api/login', async (req, res) => {
        // Używam 'email' zgodnie z naszą tabelą w bazie danych
        const { username: email, password } = req.body; 
    
        // Prosta walidacja
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email i hasło są wymagane.' 
            });
        }
    
        try {
            // 1. Znajdź użytkownika w bazie danych po adresie email
            const queryText = 'SELECT * FROM users WHERE email = $1';
            const { rows } = await db.query(queryText, [email]);
    
            // Jeśli zapytanie nic nie zwróciło, użytkownik nie istnieje
            if (rows.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Nieprawidłowy email lub hasło.' 
                });
            }
    
            const user = rows[0]; // Pobieramy dane użytkownika z bazy
    
            // 2. Porównaj hasło z hashem zapisanym w bazie
            const isMatch = await bcrypt.compare(password, user.password_hash);
    
            if (isMatch) {
                // 3. Jeśli hasła się zgadzają, zapisz ID użytkownika w sesji
                req.session.userId = user.id; 
                
                // Wyślij odpowiedź o sukcesie
                return res.json({ success: true, message: 'Zalogowano pomyślnie!' });
            } else {
                // Jeśli hasła się nie zgadzają
                return res.status(401).json({ 
                    success: false, 
                    message: 'Nieprawidłowy email lub hasło.' 
                });
            }
    
        } catch (err) {
            console.error('Błąd podczas logowania:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Wystąpił błąd serwera.' 
            });
        }
    });
    
    // ----------------------------------------
    // Logika dla przycisku wylogowania (index.html)
    // ----------------------------------------
    app.post('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Nie udało się wylogować.');
            }
            res.clearCookie('connect.sid'); // Wyczyść ciasteczko sesji
            res.status(200).send('Wylogowano pomyślnie.');
        });
    });
    

    // ----------------------------------------
    // Logika dla formularza postów (index.html)
    // ----------------------------------------
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postName = document.getElementById('postName').value;
            const hasGraphic = document.getElementById('hasGraphic').checked;

            const postData = { postName, hasGraphic };

            const response = await fetch('/submit-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                alert('Post wysłany!');
                postForm.reset();
            } else {
                // W przypadku błędu (np. 403 Forbidden), to oznacza brak autoryzacji
                alert('Błąd wysyłania posta. Zaloguj się ponownie.');
                window.location.href = '/';
            }
        });
    }

    // ----------------------------------------
    // Logika do pobierania i wyświetlania promptów (index.html)
    // ----------------------------------------
    const promptsContainer = document.getElementById('promptsContainer');
    if (promptsContainer) {
        async function fetchPrompts() {
            try {
                const response = await fetch('/get-prompts');
                if (!response.ok) {
                     // Jeśli nie jesteśmy zalogowani, serwer zwróci błąd 403 i przekieruje nas
                     throw new Error('Brak autoryzacji');
                }
                const prompts = await response.json();
                
                promptsContainer.innerHTML = ''; // Czyścimy kontener
                prompts.forEach(prompt => {
                    const p = document.createElement('p');
                    p.textContent = prompt;
                    promptsContainer.appendChild(p);
                });
            } catch (error) {
                console.error(error);
                // Przekierowanie w razie błędu autoryzacji
                window.location.href = '/';
            }
        }
        
        // Odświeżanie promptów co 5 sekund
        setInterval(fetchPrompts, 5000);
        fetchPrompts(); // Pierwsze pobranie po załadowaniu strony
    }
});