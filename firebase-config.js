const firebaseConfig = {
  apiKey: "AIzaSyDypiWLuwUXmD_Nv5U0agRV27Uxa8jSq-o",
  authDomain: "robot-soft.firebaseapp.com",
  projectId: "robot-soft",
  storageBucket: "robot-soft.firebasestorage.app",
  messagingSenderId: "357021325567",
  appId: "1:357021325567:web:404579da0a0a4fa31354ca"
};

// Initialize Firebase using compat globals
window.db = null;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.db = firebase.firestore();
} catch(e) {
    console.error("Firebase init error: ", e);
}
