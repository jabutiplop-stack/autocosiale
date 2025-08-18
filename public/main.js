document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------
    // Logika dla formularza logowania (login.html)
    // ----------------------------------------
    const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/api/login', { // Poprawiono na /api/login
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json(); // Dodano odczytanie JSON z odpowiedzi

        if (data.success) {
            // Po pomyślnym zalogowaniu przekierowujemy na stronę główną
            window.location.href = '/'; 
        } else {
            alert(data.message); // Wyświetlanie komunikatu z serwera
        }
    });
}
    // ----------------------------------------
    // Logika dla przycisku wylogowania (index.html)
    // ----------------------------------------
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const response = await fetch('/logout', { method: 'POST' });
            if (response.ok) {
                // Po wylogowaniu przekierowujemy na stronę główną, która przekieruje do logowania
                window.location.href = '/'; 
            }
        });
    }

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