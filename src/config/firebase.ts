import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBAsIgsIv9SYlf81dCuXW92d9VdJdjswQM",
  authDomain: "freshguard-bfc09.firebaseapp.com",
  projectId: "freshguard-bfc09",
  storageBucket: "freshguard-bfc09.firebasestorage.app",
  messagingSenderId: "989143310343",
  appId: "1:989143310343:web:967654f2bcfe5699024aa2",
};

const app = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
export const auth = getAuth(app);

const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);