
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  writeBatch,
  getDocs,
  FirestoreError
} from "firebase/firestore";
import { AttendanceRecord, MeetingGroup } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyDjqPfs_kq39c_fHzHJU72598CiBEehttY",
  authDomain: "meetasistand.firebaseapp.com",
  databaseURL: "https://meetasistand-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meetasistand",
  storageBucket: "meetasistand.firebasestorage.app",
  messagingSenderId: "1087970061294",
  appId: "1:1087970061294:web:80e8b3fa6186377d30bcff"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection References
const groupsCol = collection(db, "groups");
const recordsCol = collection(db, "attendance_records");

// --- Groups Functions ---
export const createGroup = async (group: Omit<MeetingGroup, "id">) => {
  return await addDoc(groupsCol, group);
};

export const deleteGroup = async (groupId: string) => {
  // Delete the group doc
  await deleteDoc(doc(db, "groups", groupId));
  
  // Also delete all records associated with this group
  const q = query(recordsCol, where("groupId", "==", groupId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  return await batch.commit();
};

export const subscribeToGroups = (onNext: (groups: MeetingGroup[]) => void) => {
  const q = query(groupsCol, orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MeetingGroup[];
    onNext(groups);
  });
};

// --- Records Functions ---
export const saveRecordToFirebase = async (record: Omit<AttendanceRecord, "id">) => {
  return await addDoc(recordsCol, record);
};

export const deleteRecordFromFirebase = async (id: string) => {
  const docRef = doc(db, "attendance_records", id);
  return await deleteDoc(docRef);
};

export const clearAllRecordsForGroup = async (groupId: string) => {
  const q = query(recordsCol, where("groupId", "==", groupId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  return await batch.commit();
};

export const subscribeToRecords = (
  groupId: string,
  onNext: (records: AttendanceRecord[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  // Removed orderBy to avoid requiring a composite index
  const q = query(
    recordsCol, 
    where("groupId", "==", groupId)
  );
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      
      // Sort client-side by timestamp ascending
      records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      onNext(records);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      if (onError) onError(error);
    }
  );
};
