    import { checkLoginAndSave, checkUserLoginStatus } from './authCheck.js';
    import { auth } from './firebaseInit.js'; 
    import { signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";


    const saveBtn = document.getElementById('save-button');
    const loginStatus = document.getElementById('login-status');
    const loginBtn = document.getElementById('login-button');
    const logoutBtn = document.getElementById('logout-button');

    checkUserLoginStatus((user) => {
    if (user) {
        loginStatus.textContent = `✅ Logged in as: ${user.email}`;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
    } else {
        loginStatus.textContent = "❌ Not logged in";
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
    }
    });

    loginBtn.addEventListener('click', () => {
    window.location.href = '/html/login.html';
    });

    logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert("Logged out successfully 🌟");
        window.location.reload(); 
    } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to log out.");
    }
    });

    saveBtn.addEventListener('click', () => {
    checkLoginAndSave((user) => {
    const output = document.getElementById("aiOutput").innerText;

    fetch('/save-output', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    email: user.email,
    aiOutput: output
    }),
    })
    .then(response => response.json())
    .then(data => {
    alert(data.message || "Saved successfully!");
    })
    .catch(error => {
    console.error("Error saving:", error);
    alert("Error saving data.");
    });
    });
    });
    document.getElementById('showSavedBtn').addEventListener('click', () => {
    checkLoginAndSave((user) => {
    fetch('/get-saved-prompts', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email }),
    })
    .then(response => response.json())
    .then(data => {
    const outputDiv = document.getElementById('savedPromptsOutput');
    outputDiv.innerHTML = ''; 

    if (data.prompts && data.prompts.length > 0) {
    data.prompts.forEach((prompt, index) => {
    const promptElement = document.createElement('div');
    promptElement.classList.add('prompt-item');
    promptElement.innerHTML = `<strong>Prompt ${index + 1}:</strong><br>${prompt}<br><br>`;
    outputDiv.appendChild(promptElement);
    });
    } else {
    outputDiv.innerHTML = 'No saved prompts found.';
    }
    })
    .catch(error => {
    console.error('Error fetching prompts:', error);
    alert('Could not fetch saved prompts.');
    });
    });
    });
