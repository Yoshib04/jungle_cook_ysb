// **CORRECTED:** Import from the full Firebase CDN URL
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration (this is correct)
const firebaseConfig = {
  apiKey: "AIzaSyCgoSA7HkK3Lpjm645geG4G1F0mZj4wPAU",
  authDomain: "jungle-cook-5d69d.firebaseapp.com",
  projectId: "jungle-cook-5d69d",
  storageBucket: "jungle-cook-5d69d.firebasestorage.app",
  messagingSenderId: "836434215499",
  appId: "1:836434215499:web:98932a9b719fe80fac43ce",
  measurementId: "G-BT2KJZLFHF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth service so app.js can use it
export const auth = getAuth(app);