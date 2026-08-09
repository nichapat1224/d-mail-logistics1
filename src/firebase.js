import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD5KVYu3jqwSbnI1oAvkP7RySDp_WZtNP8",
  authDomain: "d-mail-logistics.firebaseapp.com",
  projectId: "d-mail-logistics",
  storageBucket: "d-mail-logistics.firebasestorage.app",
  messagingSenderId: "1005959962733",
  appId: "1:1005959962733:web:6675d641bbffcca19a41f64",
  measurementId: "G-YPL9E3SFXM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
