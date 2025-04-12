import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB83xddXBrCSbZfR1BG2J571mGFme7QYvQ",
    authDomain: "pfaa-138f0.firebaseapp.com",
    projectId: "pfaa-138f0",
    storageBucket: "pfaa-138f0.firebasestorage.app",
    messagingSenderId: "747818517047",
    appId: "1:747818517047:web:8b448bca4bb0e4903075b2"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function checkLoginAndSave(callback) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    callback(user);
  } else {
    alert("You must be logged in to save!");
  }
}

export function checkUserLoginStatus(callback) {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
