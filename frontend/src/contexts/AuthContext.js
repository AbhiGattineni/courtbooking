import React, { useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../services/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";
import { db } from "../services/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, fullName, phone) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile
        await updateProfile(user, {
            displayName: fullName
        });

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            userId: user.uid,
            email: user.email,
            displayName: fullName,
            phone: phone,
            role: 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return userCredential;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // Create user document for new Google sign-ins
            await setDoc(userDocRef, {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: 'user',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
