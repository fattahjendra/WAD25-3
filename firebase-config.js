// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYooiKRqReDLVRj2rmueO_GR6S2Zn7YT8",
    authDomain: "simplechatapp-c14a4.firebaseapp.com",
    databaseURL: "https://simplechatapp-c14a4-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "simplechatapp-c14a4",
    storageBucket: "simplechatapp-c14a4.firebasestorage.app",
    messagingSenderId: "46620975116",
    appId: "1:46620975116:web:081268b12410af9f2d0e29"
};

console.log("🍕 Initializing Food Chat App...");

// Initialize Firebase
function initializeFirebase() {
    try {
        console.log("1. Checking Firebase...");
        
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase SDK not loaded!");
            setTimeout(initializeFirebase, 1000);
            return;
        }
        
        console.log("✅ Firebase SDK found!");
        
        // Initialize app
        let app;
        if (!firebase.apps.length) {
            console.log("2. Initializing Firebase app...");
            app = firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase app initialized:", app.name);
        } else {
            app = firebase.app();
            console.log("2. Using existing Firebase app:", app.name);
        }
        
        // Get database
        console.log("3. Getting database...");
        const database = firebase.database();
        
        // Make globally available
        window.database = database;
        console.log("✅ Database ready!");
        
        // Test connection
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            const isConnected = snap.val();
            console.log(isConnected ? "🌐 Connected to Firebase!" : "📡 Disconnected from Firebase");
            
            // Update UI status
            updateConnectionStatus(isConnected);
        });
        
        console.log("🎉 Firebase setup complete!");
        
    } catch (error) {
        console.error("❌ Firebase error:", error);
        setTimeout(initializeFirebase, 2000);
    }
}

function updateConnectionStatus(isConnected) {
    const statusElements = document.querySelectorAll('#sellerStatus, #customerStatus');
    statusElements.forEach(el => {
        if (el) {
            el.textContent = isConnected ? 'Online' : 'Offline';
            el.style.color = isConnected ? '#10b981' : '#ef4444';
        }
    });
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}