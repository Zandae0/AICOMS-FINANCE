// auth.js
const { DB } = require('../config');
const { collection, query, where, getDocs } = require('firebase/firestore');

// Middleware to check if the user is admin
const authMiddleware = async (req, res, next) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({
            status: "Failed",
            message: "UID is required"
        });
    }

    try {
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

        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({
            status: "Failed",
            message: "Server error"
        });
    }
};

module.exports = { authMiddleware };
