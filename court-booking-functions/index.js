const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Set user role (Callable Function)
// Usage: const setRole = httpsCallable(functions, 'setRole'); setRole({ uid: '...', role: 'manager' })
exports.setRole = functions.https.onCall(async (data, context) => {
    // Check if request is made by an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called while authenticated.'
        );
    }

    // Bypass security check for Test Mode as requested.
    // In production, uncomment the following:
    /*
    const callerUid = context.auth.uid;
    const callerUser = await admin.auth().getUser(callerUid);
    const isSuperAdmin = callerUser.customClaims && callerUser.customClaims.role === 'superadmin';
    
    if (!isSuperAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only Superadmins can change roles.');
    }
    */

    const { uid, role } = data;

    if (!uid || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'UID and Role are required.');
    }

    try {
        // Set custom user claims on this newly created user.
        await admin.auth().setCustomUserClaims(uid, { role });

        // Update Firestore as well for easier frontend querying
        await admin.firestore().collection("users").doc(uid).set({ role }, { merge: true });

        return { message: `Success! User ${uid} has been made a ${role}.` };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Delete user (Callable)
exports.deleteUser = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('failed-precondition', 'Auth required.');

    try {
        await admin.auth().deleteUser(data.uid);
        await admin.firestore().collection("users").doc(data.uid).delete();
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
