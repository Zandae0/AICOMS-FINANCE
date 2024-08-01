const express = require('express');
const router = express.Router();
const { auth, DB } = require('../config');
const { collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');
const { authMiddleware } = require('../middlewares/auth');

// Get all users (only admin can access)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const usersRef = collection(DB, "users");
        const querySnapshot = await getDocs(usersRef);
        const users = [];

        querySnapshot.forEach((document) => {
            users.push(document.data());
        });

        res.status(200).json({
            status: "Success",
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Failed",
            message: "Server error"
        });
    }
});

// Update user status (admin only)
router.patch('/update-status', async (req, res) => {
    const { uid, uidganti, status } = req.body;

    if (typeof status !== 'number' || ![0, 1].includes(status)) {
        return res.status(400).json({
            status: "Failed",
            code: "auth/invalid-status",
            message: "Status must be a number, either 0 or 1"
        });
    }

    try {
        // Check if the requesting user is an admin
        const usersRef = collection(DB, "users");
        const q = query(usersRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return res.status(404).json({
                status: "Failed",
                message: "User not found"
            });
        }

        let isAdmin = false;
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.status === 1) {
                isAdmin = true;
            }
        });

        if (!isAdmin) {
            return res.status(403).json({
                status: "Failed",
                message: "Access denied"
            });
        }

        // Update the status of the user specified by uidganti
        const userRef = doc(DB, "users", uidganti);
        await updateDoc(userRef, { status });

        res.status(200).json({
            status: "Success",
            message: `User status updated to ${status}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Failed",
            message: "Server error"
        });
    }
});

module.exports = router;