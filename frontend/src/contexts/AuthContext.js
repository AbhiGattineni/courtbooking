import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase"; // REMOVED googleProvider
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider, // ADD THIS
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, fullName, phone) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: fullName,
    });

    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      email: user.email,
      displayName: fullName,
      phone: phone,
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    // Create provider locally - THIS IS THE FIX
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return result;
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function refreshUser() {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      const tokenResult = await auth.currentUser.getIdTokenResult();

      let finalRole = tokenResult.claims.role || "user";

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role) {
          finalRole = userDoc.data().role;
        }
      } catch (error) {
        console.error("Error fetching user role from DB:", error);
      }

      setUserRole(finalRole);
    }
  }

  useEffect(() => {
    let unsubscribeAuth = null;
    let unsubscribeFirestore = null;

    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        const tokenResult = await user.getIdTokenResult();
        let initialRole = tokenResult.claims.role || "user";

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role) {
            initialRole = userDoc.data().role;
          }
        } catch (err) {
          console.log("Error checking DB role", err);
        }

        setUserRole(initialRole);
        setLoading(false);

        unsubscribeFirestore = onSnapshot(
          doc(db, "users", user.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.role) {
                setUserRole(userData.role);
              }
            }
          },
          (error) => {
            console.error("Error listening to user document:", error);
          }
        );
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);

        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    isSuperAdmin: userRole === "superadmin",
    isManager: userRole === "manager" || userRole === "superadmin",
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
