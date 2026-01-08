import { User, Loan, Invite, UserRole, LoanStatus, Currency } from '../types';
// @ts-ignore
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  arrayUnion
} from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCnRYCCi7_P9S_3XWfn6uYlkMHJqHAYUoQ",
  authDomain: "prizzys-lms.firebaseapp.com",
  projectId: "prizzys-lms",
  storageBucket: "prizzys-lms.firebasestorage.app",
  messagingSenderId: "1068442843518",
  appId: "1:1068442843518:web:db280d1dbc95fcc7e3db2f",
  measurementId: "G-DY7848HLT3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Auth Service ---

export const AuthService = {
  // Listen for auth state changes (used in App.tsx)
  subscribe: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch full user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            callback({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Edge case: Auth exists but Firestore doc missing
            callback(null); 
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error("User profile not found.");
    }
    
    return { id: userCredential.user.uid, ...userDoc.data() } as User;
  },

  register: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'password123');
    const uid = userCredential.user.uid;
    
    const newUser: User = {
      ...userData,
      id: uid,
      createdAt: new Date().toISOString(),
      network: [],
    };
    
    // Don't store password in Firestore
    const { password, ...userToStore } = newUser;

    // Save to Firestore
    await setDoc(doc(db, "users", uid), userToStore);

    return newUser;
  },

  logout: async () => {
    await signOut(auth);
  }
};

// --- Loan Service ---

export const LoanService = {
  requestLoan: async (loan: Omit<Loan, 'id' | 'status' | 'requestDate'>): Promise<Loan> => {
    const newLoanData = {
      ...loan,
      status: LoanStatus.REQUESTED,
      requestDate: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, "loans"), newLoanData);
    
    return { ...newLoanData, id: docRef.id } as Loan;
  },

  updateLoan: async (loan: Loan) => {
    const loanRef = doc(db, "loans", loan.id);
    await updateDoc(loanRef, { ...loan });
  },

  getLoansForUser: async (userId: string, role: UserRole): Promise<Loan[]> => {
    const loansRef = collection(db, "loans");
    let q;

    if (role === UserRole.ADMIN) {
      q = query(loansRef);
    } else if (role === UserRole.LOANER) {
      q = query(loansRef, where("loanerId", "==", userId));
    } else {
      q = query(loansRef, where("loaneeId", "==", userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Loan))
      // Sort locally for now: newest first
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  },
};

// --- Network Service ---

export const NetworkService = {
  sendInvite: async (loanerId: string, loanerName: string, email: string) => {
    // Check for existing invite
    const q = query(
      collection(db, "invites"), 
      where("email", "==", email), 
      where("loanerId", "==", loanerId),
      where("status", "==", "PENDING")
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error('Invite already pending for this email.');
    }

    const newInvite = {
      loanerId,
      loanerName,
      email,
      status: 'PENDING',
    };
    
    await addDoc(collection(db, "invites"), newInvite);
  },

  getNetworkMembers: async (userId: string): Promise<User[]> => {
    // 1. Get current user to see network IDs
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return [];
    
    const userData = userDoc.data() as User;
    const networkIds = userData.network || [];

    if (networkIds.length === 0) return [];

    // 2. Fetch users. 'in' query supports up to 10 items. 
    // For robustness in this "Real" app, let's fetch in parallel if list is small, 
    // or use 'in' chunks. For now, Promise.all is robust enough for typical network sizes.
    
    const memberPromises = networkIds.map(nid => getDoc(doc(db, "users", nid)));
    const memberDocs = await Promise.all(memberPromises);
    
    return memberDocs
      .filter(d => d.exists())
      .map(d => ({ id: d.id, ...d.data() } as User));
  },
  
  getPendingInvites: async (email: string): Promise<Invite[]> => {
    const q = query(
      collection(db, "invites"), 
      where("email", "==", email), 
      where("status", "==", "PENDING")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invite));
  },
  
  acceptInvite: async (inviteId: string, loaneeId: string) => {
    // 1. Get the invite
    const inviteRef = doc(db, "invites", inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) return;
    
    const inviteData = inviteSnap.data() as Invite;
    
    // 2. Update both users' network arrays
    const loanerRef = doc(db, "users", inviteData.loanerId);
    const loaneeRef = doc(db, "users", loaneeId);

    await updateDoc(loanerRef, {
      network: arrayUnion(loaneeId)
    });
    
    await updateDoc(loaneeRef, {
      network: arrayUnion(inviteData.loanerId)
    });
    
    // 3. Update invite status
    await updateDoc(inviteRef, { status: 'ACCEPTED' });
  }
};