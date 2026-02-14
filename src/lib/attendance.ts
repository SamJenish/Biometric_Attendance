import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

export const CLASSROOM_LAT = 8.7260;
export const CLASSROOM_LNG = 77.7081;
export const ALLOWED_RADIUS = 100; // meters

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  subject: string;
  timestamp: any;
  latitude: number;
  longitude: number;
}

export interface ActiveSession {
  id: string; // subject name
  startTime: any;
  teacherId: string;
}

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function checkDuplicateAttendance(studentId: string, subject: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendanceRef = collection(db, 'attendance');
  const q = query(
    attendanceRef, 
    where('studentId', '==', studentId),
    where('subject', '==', subject),
    where('timestamp', '>=', today)
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export async function recordAttendance(studentId: string, subject: string, lat: number, lng: number) {
  const distance = calculateDistance(lat, lng, CLASSROOM_LAT, CLASSROOM_LNG);
  
  if (distance > ALLOWED_RADIUS) {
    throw new Error(`Outside classroom boundary. Distance: ${Math.round(distance)}m`);
  }

  // Double check session is still active
  const sessionSnap = await getDocs(query(collection(db, 'sessions'), where('id', '==', subject)));
  if (sessionSnap.empty) {
    throw new Error('This session is no longer active.');
  }

  const isDuplicate = await checkDuplicateAttendance(studentId, subject);
  if (isDuplicate) {
    throw new Error('Attendance already marked for this subject today.');
  }

  const docRef = await addDoc(collection(db, 'attendance'), {
    studentId,
    subject,
    timestamp: serverTimestamp(),
    latitude: lat,
    longitude: lng
  });

  return docRef.id;
}

export function subscribeToAttendance(callback: (records: AttendanceRecord[]) => void) {
  const attendanceRef = collection(db, 'attendance');
  const q = query(attendanceRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));
    callback(records);
  });
}

// Session Management
export async function startSession(subject: string, teacherId: string) {
  const sessionRef = doc(db, 'sessions', subject);
  await setDoc(sessionRef, {
    id: subject,
    startTime: serverTimestamp(),
    teacherId
  });
}

export async function endSession(subject: string) {
  const sessionRef = doc(db, 'sessions', subject);
  await deleteDoc(sessionRef);
}

export function subscribeToActiveSessions(callback: (sessions: ActiveSession[]) => void) {
  const sessionsRef = collection(db, 'sessions');
  return onSnapshot(sessionsRef, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      ...doc.data()
    } as ActiveSession));
    callback(sessions);
  });
}
