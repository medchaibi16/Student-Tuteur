import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
    apiKey: "your_key_here",
    authDomain: "pfaa-138f0.firebaseapp.com",
    projectId: "pfaa-138f0",
    storageBucket: "pfaa-138f0.firebasestorage.app",
    messagingSenderId: "747818517047",
    appId: "1:747818517047:web:8b448bca4bb0e4903075b2"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
