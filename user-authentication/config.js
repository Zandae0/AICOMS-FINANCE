const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDIYmlLiFxfskeG3CB9KPDEWQ6n186tt8Q",
  authDomain: "aicoms-finance.firebaseapp.com",
  projectId: "aicoms-finance",
  storageBucket: "aicoms-finance.appspot.com",
  messagingSenderId: "1028009454928",
  appId: "1:1028009454928:web:446c8d7afa4e9b906f1055"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
const DB = getFirestore(app);

module.exports = { auth, DB };