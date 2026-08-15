// Firebase web config — safe to commit. Unlike an API secret, these values
// identify the project publicly by design; they don't grant write access on
// their own (Firestore rules do that). See:
// https://firebase.google.com/docs/projects/api-keys
//
// Your email is deliberately NOT here, and never will be — it lives only in
// firestore.rules, pasted by hand into the Firebase Console (see
// AUTH_SETUP.md). That's the piece that actually needs to stay private.
//
// Fill in the placeholders below from:
// console.firebase.google.com → Project Settings → Your apps → SDK setup

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyClyXRXdsFVqHTPMXkN9BkvRT32UbG94Bs",
  authDomain: "scientia-ai-aaronkr.firebaseapp.com",
  projectId: "scientia-ai-aaronkr",
  storageBucket: "scientia-ai-aaronkr.firebasestorage.app",
  messagingSenderId: "1012146436476",
  appId: "1:1012146436476:web:11cdb5765206aede6d8cf9",
};
