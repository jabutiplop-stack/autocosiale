document.addEventListener('DOMContentLoaded', () => {

    // Logika dla formularza logowania (login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Użycie 'email' tak jak w bazie danych
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/api/login', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }), // Wysłanie danych
            });

            const data = await response.json();

            if (data.success) {
                // Po udanym zalogowaniu przekieruj użytkownika
                window.location.href = '/dashboard.html';
            } else {
                // Wyświetl komunikat o błędzie z serwera
                alert(data.message);
            }
        });
    }


    // Logika dla formularza postów (dashboard.html)
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postName = document.getElementById('postName').value;
            const hasGraphic = document.getElementById('hasGraphic').checked;

            const postData = { postName, hasGraphic };

            const response = await fetch('/api/post', {
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


    // Logika do pobierania i wyświetlania promptów (dashboard.html)
    const promptsContainer = document.getElementById('promptsContainer');
    if (promptsContainer) {
        async function fetchPrompts() {
            try {
                const response = await fetch('/api/automation-data');
                if (!response.ok) {
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
                window.location.href = '/';
            }
        }
        
        setInterval(fetchPrompts, 5000);
        fetchPrompts();
    }
});