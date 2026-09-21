import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // السطر الجديد

const firebaseConfig = {
  apiKey: "AIzaSyAX3yIvW3aa4q5L47TE0rwn0BOB0zX3bAY",
  authDomain: "viola-elprimo.firebaseapp.com",
  projectId: "viola-elprimo",
  storageBucket: "viola-elprimo.firebasestorage.app",
  messagingSenderId: "80111838803",
  appId: "1:80111838803:web:916abe97192cbaf5fc08a6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // السطر الجديد
