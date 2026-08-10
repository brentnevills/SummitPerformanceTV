import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClinicSettings } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target specific database if specified in config, or default database
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const SETTINGS_DOC_REF = doc(db, 'clinic_settings', 'main');

/**
 * Subscribe to real-time clinic settings updates across devices
 */
export function subscribeToClinicSettings(
  onUpdate: (settings: ClinicSettings) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    SETTINGS_DOC_REF,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ClinicSettings;
        onUpdate(data);
      } else {
        // Document doesn't exist yet in Firestore
        onUpdate(null as any);
      }
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save updated clinic settings to Firestore (syncs immediately to all devices)
 */
export async function saveClinicSettingsToFirestore(settings: Partial<ClinicSettings>) {
  try {
    await setDoc(SETTINGS_DOC_REF, settings, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving settings to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch settings once from Firestore
 */
export async function fetchClinicSettingsFromFirestore(): Promise<ClinicSettings | null> {
  try {
    const snapshot = await getDoc(SETTINGS_DOC_REF);
    if (snapshot.exists()) {
      return snapshot.data() as ClinicSettings;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching settings from Firestore:', err);
    return null;
  }
}
