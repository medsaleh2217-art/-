import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const env: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> })?.env) || {};

const cfg = {
  apiKey: firebaseConfig.apiKey || env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfig.projectId || env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfig.appId || env.VITE_FIREBASE_APP_ID,
};

export const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

export const firebaseConfigured = Boolean(
  cfg.apiKey &&
  cfg.projectId &&
  cfg.appId &&
  cfg.projectId !== 'remixed-project-id'
);

export const demoMode = !firebaseConfigured;

export const app = firebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(cfg))
  : null;

export const db: Firestore | null = app
  ? initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      },
      databaseId
    )
  : null;

export const imageStorageMode: 'firestore' | 'storage' =
  env.VITE_IMAGE_STORAGE === 'storage' ? 'storage' : 'firestore';

// اختبار الاتصال بـ Firestore كما تنص المعايير
if (typeof window !== 'undefined' && db) {
  getDocFromServer(doc(db, 'settings', 'store')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase offline or checking connection:', error.message);
    }
  });
}
