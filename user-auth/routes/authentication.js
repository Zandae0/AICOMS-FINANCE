const express = require('express');
const router = express.Router();
const { auth, DB } = require('../config');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } = require('firebase/auth');
const { collection, doc, setDoc, getDocs, query, where } = require('firebase/firestore');

// Sign up route
router.post('/signup', async (req, res) => {
    const { name, username, email, password, role, status } = req.body;

    if (!['mahasiswa', 'dosen'].includes(role) || ![0, 1].includes(status)) {
        return res.status(400).json({
            status: "Failed",
            code: "auth/invalid-role-or-status",
            message: "Role must be either 'mahasiswa' or 'dosen' and status must be either 1 for 'admin' or 0 for 'user'"
        });
    }

    try {
        const usersRef = collection(DB, "users");
        const querySnapshot = await getDocs(usersRef);
        let usernameExists = false;
        querySnapshot.forEach((document) => {
            if (document.data().username === username) {
                usernameExists = true;
            }
        });

        if (usernameExists) {
            return res.status(409).json({
                status: "Failed",
                code: "auth/username-already-in-use",
                message: "Username already in use"
            });
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const docID = userCredential.user.uid;
        const userData = {
            "uid": docID,
            "name": name,
            "username": username,
            "email": email,
            "role": role,
            "status": status // status is stored as a number
        };

        const userDocRef = doc(DB, "users", docID);
        await setDoc(userDocRef, userData);
        const token = await userCredential.user.getIdToken(true);

        res.status(200).json({
            status: "Success",
            token: `Bearer ${token}`,
            refreshToken: userCredential.user.stsTokenManager.refreshToken,
            expirationTime: userCredential.user.stsTokenManager.expirationTime
        });
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            return res.status(409).json({
                status: "Failed",
                code: "auth/email-already-in-use",
                message: "Email already in use"
            });
        } else if (error.code === "auth/weak-password") {
            return res.status(400).json({
                status: "Failed",
                code: "auth/invalid-password",
                message: "The password must be at least six characters"
            });
        } else if (error.code === "auth/invalid-email") {
            return res.status(400).json({
                status: "Failed",
                code: "auth/invalid-email",
                message: "Please provide a correct email"
            });
        }
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Sign in route
router.post('/signin', async (req, res) => {
    const { identifier, password } = req.body; // Can be either username or email
    try {
        const usersRef = collection(DB, "users");
        const querySnapshot = await getDocs(usersRef);
        let email = null;
        querySnapshot.forEach((document) => {
            const userData = document.data();
            if (userData.username === identifier || userData.email === identifier) {
                email = userData.email;
            }
        });

        if (!email) {
            return res.status(401).json({
                status: "Failed",
                code: "auth/user-not-found",
                message: "Your Username or Password is incorrect"
            });
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken(true);

        res.status(200).json({
            status: "Success",
            token: `Bearer ${token}`,
            refreshToken: userCredential.user.stsTokenManager.refreshToken,
            expirationTime: userCredential.user.stsTokenManager.expirationTime
        });
    } catch (error) {
        const errorCode = error.code;

        if (errorCode === 'auth/invalid-credential' || errorCode === "auth/wrong-password") {
            return res.status(401).json({
                status: "Failed",
                code: "auth/invalid-credential",
                message: "Your Username or Password is incorrect"
            });
        } else if (errorCode === 'auth/user-not-found' || errorCode === "auth/wrong-password") {
            return res.status(401).json({
                status: "Failed",
                code: "auth/user-not-found",
                message: "Your Username or Password is incorrect"
            });
        }

        console.error(error);
        res.status(500).send('Server error');
    }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        if (!validateEmail(email)) {
            return res.status(400).json({
                status: "Failed",
                code: "auth/invalid-email",
                message: "Invalid email format. Please check the email address you entered."
            });
        }

        const usersRef = collection(DB, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return res.status(404).json({
                status: "Failed",
                code: "auth/user-not-found",
                message: "Email not registered. Please check the email address you entered."
            });
        }

        await sendPasswordResetEmail(auth, email);
        res.status(200).json({
            status: "Success",
            message: "Password reset email sent successfully"
        });
    } catch (error) {
        console.error('Error sending password reset email:', error);

        let errorMessage = "Failed to send password reset email. Please try again later.";
        let errorCode = "unknown";

        if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format. Please check the email address you entered.";
            errorCode = "auth/invalid-email";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Too many requests. Please try again later.";
            errorCode = "auth/too-many-requests";
        }

        res.status(400).json({
            status: "Failed",
            code: errorCode,
            message: errorMessage
        });
    }
});

// Logout route
router.post('/logout', async (req, res) => {
    try {
        await signOut(auth);
        res.status(200).json({
            status: "Success",
            message: "User logged out successfully"
        });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({
            status: "Failed",
            message: "Failed to log out. Please try again."
        });
    }
});

// Helper function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

module.exports = router;
