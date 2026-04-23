import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBbJhYf0RZfptRjkyBoGDXp_uOw_CF2HUg",
  authDomain: "oscar-journey.firebaseapp.com",
  projectId: "oscar-journey",
  storageBucket: "oscar-journey.firebasestorage.app",
  messagingSenderId: "1085019870379",
  appId: "1:1085019870379:web:1c28a1050da8c1545ed3ee"
};

const app = initializeApp(firebaseConfig);

// experimentalAutoDetectLongPolling mitigates Firestore WebChannel state
// corruption after long tab dormancy (assertion IDs b815 / ca9).
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
