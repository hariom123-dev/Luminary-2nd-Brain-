import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy, 
  onSnapshot,
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, Note, Insight } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

// Error Handling according to Instructions
interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  if (error instanceof Error && error.message.includes('insufficient permissions')) {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || '',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || false,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

// Auth functions
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const newUser: User = {
        id: user.uid,
        name: user.displayName || 'Architect',
        email: user.email || '',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        synapses: 0,
        efficiency: 0,
        role: 'Pro Researcher'
      };
      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        createdAt: serverTimestamp()
      });
    }
    return user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Firestore functions
export const getNotes = async (userId: string): Promise<Note[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notes'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
  } catch (err) {
    return handleFirestoreError(err, 'list', `users/${userId}/notes`);
  }
};

export const saveNote = async (userId: string, noteData: Partial<Note>): Promise<string> => {
  try {
    const noteRef = await addDoc(collection(db, 'users', userId, 'notes'), {
      ...noteData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return noteRef.id;
  } catch (err) {
    return handleFirestoreError(err, 'create', `users/${userId}/notes`);
  }
};

export const updateNote = async (userId: string, noteId: string, noteData: Partial<Note>) => {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, {
      ...noteData,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    return handleFirestoreError(err, 'update', `users/${userId}/notes/${noteId}`);
  }
};

export const saveInsight = async (userId: string, insightData: Partial<Insight>) => {
  try {
    await addDoc(collection(db, 'users', userId, 'insights'), {
      ...insightData,
      userId,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, 'create', `users/${userId}/insights`);
  }
};

export const clearOldInsights = async (userId: string) => {
  try {
    const q = query(collection(db, 'users', userId, 'insights'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error("Failed to clear insights:", err);
  }
};

export const searchNotes = async (userId: string, searchTerm: string): Promise<Note[]> => {
  try {
    const allNotes = await getNotes(userId);
    const lowerTerm = searchTerm.toLowerCase();
    // Simple client-side "semantic" search for MVP
    return allNotes.filter(n => 
      n.title.toLowerCase().includes(lowerTerm) || 
      n.content.toLowerCase().includes(lowerTerm) ||
      n.summary.toLowerCase().includes(lowerTerm) ||
      n.tags.some(t => t.toLowerCase().includes(lowerTerm))
    );
  } catch (err) {
    return handleFirestoreError(err, 'list', `users/${userId}/notes`);
  }
};

export const deleteNote = async (userId: string, noteId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  } catch (err) {
    return handleFirestoreError(err, 'delete', `users/${userId}/notes/${noteId}`);
  }
};

export const subscribeToUserStats = (userId: string, callback: (user: User) => void) => {
  return onSnapshot(doc(db, 'users', userId), 
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as User);
      }
    },
    (err) => handleFirestoreError(err, 'get', `users/${userId}`)
  );
};

export const subscribeToInsights = (userId: string, callback: (insights: Insight[]) => void) => {
  const q = query(collection(db, 'users', userId, 'insights'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, 
    (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insight)));
    },
    (err) => handleFirestoreError(err, 'list', `users/${userId}/insights`)
  );
};
