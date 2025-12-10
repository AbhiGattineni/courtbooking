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
    const [userRole, setUserRole] = useState(null);
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

    // Force refresh of token to get latest claims
    async function refreshUser() {
        if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
            const tokenResult = await auth.currentUser.getIdTokenResult();

            // Check Firestore for role override (easier for testing)
            let finalRole = tokenResult.claims.role || 'user';

            try {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userDoc.exists() && userDoc.data().role) {
                    // Use Firestore role if it grants higher privileges or is different
                    // This allows manual DB edits to work for Admin access
                    const dbRole = userDoc.data().role;
                    if (dbRole === 'superadmin' || dbRole === 'manager') {
                        finalRole = dbRole;
                    }
                }
            } catch (error) {
                console.error("Error fetching user role from DB:", error);
            }

            setUserRole(finalRole);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get custom claims
                const tokenResult = await user.getIdTokenResult();
                let finalRole = tokenResult.claims.role || 'user';

                // Fallback/Override from Firestore (Development convenience)
                // In production, you might relying solely on Claims for performance/security
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.role) {
                            finalRole = userData.role;
                        }
                    }
                } catch (err) {
                    console.log("Error checking DB role", err);
                }

                setUserRole(finalRole);
            } else {
                setUserRole(null);
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        isSuperAdmin: userRole === 'superadmin',
        isManager: userRole === 'manager' || userRole === 'superadmin',
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
