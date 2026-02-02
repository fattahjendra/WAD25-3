// Food Chat Application
class FoodChatApp {
    constructor() {
        console.log("🍽️ Starting Food Chat App...");
        
        this.userType = this.detectUserType();
        console.log("👤 User type:", this.userType);
        
        this.messagesRef = null;
        this.setupUI();
        this.waitForDatabase();
        this.setupKeyboardShortcuts();
    }
    
    detectUserType() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('seller.html')) return 'seller';
        if (path.includes('buyer.html')) return 'buyer';
        return 'buyer';
    }
    
    setupUI() {
        console.log("🎨 Setting up UI...");
        
        // Enable inputs
        this.enableInputs();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup quick actions
        this.setupQuickActions();
    }
    
    enableInputs() {
        const buyerInput = document.getElementById('messageInput');
        const sellerInput = document.getElementById('sellerInput');
        
        if (buyerInput) {
            buyerInput.disabled = false;
            setTimeout(() => buyerInput.focus(), 500);
        }
        
        if (sellerInput) {
            sellerInput.disabled = false;
            setTimeout(() => sellerInput.focus(), 500);
        }
    }
    
    waitForDatabase() {
        console.log("⏳ Waiting for database...");
        
        const checkInterval = setInterval(() => {
            if (window.database) {
                clearInterval(checkInterval);
                console.log("✅ Database found!");
                this.initializeChat();
            }
        }, 500);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.database) {
                console.error("❌ Database not found!");
                this.showErrorMessage("Cannot connect to chat server. Please refresh.");
            }
        }, 10000);
    }
    
    initializeChat() {
        console.log("🚀 Initializing chat features...");
        
        // Setup Firebase references
        this.messagesRef = window.database.ref('messages');
        
        // Load existing messages
        this.loadMessages();
        
        // Setup real-time listener
        this.setupMessageListener();
        
        // Send welcome message
        this.sendWelcomeMessage();
        
        console.log("✅ Chat initialized!");
    }
    
    setupMessageListener() {
        this.messagesRef.limitToLast(100).on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.displayMessage(message);
        });
    }
    
    loadMessages() {
        // Load last 50 messages
        this.messagesRef.limitToLast(50).once('value').then((snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                this.displayMessage(message);
            });
        });
    }
    
    displayMessage(message) {
        if (!message || !message.text) return;
        
        const buyerContainer = document.getElementById('messagesContainer');
        const sellerContainer = document.getElementById('sellerMessages');
        
        const messageDiv = document.createElement('div');
        const isOwnMessage = message.sender === this.userType;
        messageDiv.className = `message ${isOwnMessage ? 'sent' : 'received'}`;
        
        // Format time
        const time = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format text with line breaks
        const formattedText = message.text.replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${formattedText}
                <span class="message-time">${time}</span>
            </div>
        `;
        
        // Add to appropriate container
        if (buyerContainer && this.userType === 'buyer') {
            buyerContainer.appendChild(messageDiv);
            buyerContainer.scrollTop = buyerContainer.scrollHeight;
        }
        
        if (sellerContainer && this.userType === 'seller') {
            sellerContainer.appendChild(messageDiv);
            sellerContainer.scrollTop = sellerContainer.scrollHeight;
        }
    }
    
    setupEventListeners() {
        // Buyer send button
        const sendBtn = document.getElementById('sendBtn');
        const buyerInput = document.getElementById('messageInput');
        
        if (sendBtn && buyerInput) {
            sendBtn.addEventListener('click', () => this.sendMessageFromInput('buyer', buyerInput));
            buyerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessageFromInput('buyer', buyerInput);
            });
        }
        
        // Seller send button
        const sellerSendBtn = document.getElementById('sellerSendBtn');
        const sellerInput = document.getElementById('sellerInput');
        
        if (sellerSendBtn && sellerInput) {
            sellerSendBtn.addEventListener('click', () => this.sendMessageFromInput('seller', sellerInput));
            sellerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessageFromInput('seller', sellerInput);
            });
        }
        
        // Quick actions for buyer
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }
    
    setupQuickActions() {
        // Seller quick replies
        document.querySelectorAll('.quick-reply-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.sendQuickReply(type);
            });
        });
        
        // Seller food buttons
        document.querySelectorAll('.food-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const foodType = e.currentTarget.dataset.food;
                this.sendFoodRecommendation(foodType);
            });
        });
        
        // NEW: Clickable menu items
        document.querySelectorAll('.menu-item.clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemName = e.currentTarget.dataset.item;
                const itemPrice = e.currentTarget.dataset.price;
                const priceFormatted = parseInt(itemPrice).toLocaleString('id-ID');
                
                const message = `🍽️ **${itemName}** - Rp ${priceFormatted}\n\nReady to order! Would you like to add this to your cart?`;
                this.sendMessage(message, 'seller');
                
                // Visual feedback
                e.currentTarget.style.background = 'var(--success)';
                e.currentTarget.style.color = 'white';
                setTimeout(() => {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.color = '';
                }, 500);
            });
        });
        
        // Admin controls
        const resetBtn = document.getElementById('resetChatBtn');
        const clearBtn = document.getElementById('clearMessagesBtn');
        const testBtn = document.getElementById('testMessageBtn');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.showConfirmationDialog(
                    'Reset All Chat',
                    '⚠️ WARNING: This will delete ALL chat messages from the database!<br><br>This action cannot be undone.',
                    () => this.resetChat()
                );
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.showConfirmationDialog(
                    'Clear Messages',
                    'Clear all messages from the screen?<br><br>Messages will remain in the database.',
                    () => this.clearLocalMessages()
                );
            });
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.sendTestMessage();
            });
        }
    }
    
    sendMessageFromInput(sender, inputElement) {
        const text = inputElement.value.trim();
        if (text && this.messagesRef) {
            this.sendMessage(text, sender);
            inputElement.value = '';
            inputElement.focus();
        }
    }
    
    sendMessage(text, sender) {
        console.log(`📤 Sending message from ${sender}:`, text);
        
        const message = {
            text: text,
            sender: sender,
            timestamp: Date.now(),
            type: 'text'
        };
        
        this.messagesRef.push(message)
            .then(() => console.log("✅ Message sent!"))
            .catch(error => {
                console.error("❌ Send error:", error);
                this.showErrorMessage("Failed to send message: " + error.message);
            });
    }
    
    handleQuickAction(action) {
        let message = '';
        
        switch(action) {
            case 'recommendation':
                message = "Can you recommend something good to eat today?";
                break;
            case 'menu':
                message = "Can you show me the menu?";
                break;
            case 'offer':
                message = "What's today's special offer?";
                break;
        }
        
        if (message) {
            this.sendMessage(message, 'buyer');
        }
    }
    
    sendQuickReply(type) {
        let message = '';
        
        switch(type) {
            case 'greeting':
                message = "Hello! Welcome to our food store! 🍽️\nHow can I help you today?";
                break;
            case 'menu':
                message = "📋 **OUR MENU** 📋\n\n🍚 Nasi Padang:\n• Nasi Rendang - Rp 17,000\n• Nasi Ayam Bakar - Rp 16,000\n• Nasi Ayam Goreng - Rp 15,000\n\n🍰 Desserts:\n• Chocolate Cake - Rp 25,000\n• Pudding - Rp 18,000\n\n💰 Budget Meals:\n• Nasi Telur - Rp 12,000\n• Mie Goreng - Rp 13,000";
                break;
            case 'busy':
                message = "⏰ **NOTICE** ⏰\n\nWe're currently in our busy hours. Delivery might take 30-45 minutes. Thank you for your patience! 🙏";
                break;
            case 'thanks':
                message = "🙏 **THANK YOU!** 🙏\n\nThank you for your order! We appreciate your business! 💖";
                break;
        }
        
        if (message) {
            this.sendMessage(message, 'seller');
        }
    }
    
    sendFoodRecommendation(foodType) {
        const recommendations = {
            'nasi padang': `🍚 **NASI PADANG RECOMMENDATIONS** 🍚\n\n1. **Padang A - Nasi Rendang** - Rp 17,000\n   • Tender beef rendang with spices\n   • Served with rice and vegetables\n\n2. **Padang X - Nasi Ayam Bakar** - Rp 16,000\n   • Grilled chicken with special sauce\n   • Comes with rice and sambal\n\n3. **Warteg - Nasi Ayam Goreng** - Rp 15,000\n   • Crispy fried chicken\n   • Rice, tempe, tofu, and vegetables\n\n⭐ **Most Popular**: Nasi Rendang!\n⏰ **Preparation**: 10-15 minutes`,
            
            'something sweet': `🍰 **SWEET TREATS & DESSERTS** 🍰\n\n• **Chocolate Cake** - Rp 25,000\n  Rich chocolate layers with frosting\n\n• **Pudding Special** - Rp 18,000\n  Caramel pudding with cream\n\n• **Pancake with Honey** - Rp 22,000\n  Fluffy pancakes with honey drizzle\n\n• **Ice Cream Sundae** - Rp 15,000\n  3 scoops with chocolate sauce\n\n🎯 **Best Seller**: Chocolate Cake!`,
            
            'simple and cheap': `💰 **SIMPLE & BUDGET-FRIENDLY** 💰\n\n• **Nasi Telur** - Rp 12,000\n  Rice with fried egg and vegetables\n\n• **Nasi Putih + Sayur** - Rp 10,000\n  Rice with mixed vegetables\n\n• **Sandwich** - Rp 15,000\n  Chicken/egg sandwich with mayo\n\n• **Mie Goreng** - Rp 13,000\n  Fried noodles with vegetables\n\n💡 **Great Value**: Nasi Telur combo!`,
            
            'last longer': `⏳ **FOOD THAT LASTS LONGER** ⏳\n\nPerfect for travel, work, or saving for later!\n\n• **Cookies Pack (10pcs)** - Rp 20,000\n  Assorted cookies, stays fresh for days\n\n• **French Bread** - Rp 18,000\n  Freshly baked, good for 2-3 days\n\n• **Energy Bars (3pcs)** - Rp 25,000\n  Nutritious and filling\n\n• **Nuts Mix** - Rp 15,000\n  Healthy snack, lasts weeks\n\n🚗 **Travel Ready**: Energy Bars!`,
            
            'a lot': `🍽️ **BIG PORTIONS - GREAT FOR SHARING** 🍽️\n\n• **Nasi Campur Special** - Rp 25,000\n  Rice with 3 meat choices + vegetables\n\n• **Ayam Penyet Komplit** - Rp 30,000\n  Smashed chicken with all sides\n\n• **BBQ Plate** - Rp 35,000\n  Mixed grill for 2-3 people\n\n• **Family Package (4 persons)** - Rp 75,000\n  4 main dishes + rice + drinks\n\n👨‍👩‍👧‍👦 **Family Favorite**: Family Package!`,
            
            'best offer': `🔥 **🔥 TODAY'S BEST OFFER! 🔥** 🔥\n\n🎉 **NASI PADANG SPECIAL + FREE DRINK** 🎉\n\n💰 **Only Rp 25,000** (Originally Rp 30,000)\n✅ Save Rp 5,000!\n\n📦 **INCLUDES:**\n1. Nasi Padang with your choice:\n   • Rendang OR Ayam Bakar OR Ayam Goreng\n2. 2 side dishes\n3. FREE Soft Drink\n4. Special sambal\n\n⏰ **LIMITED TIME OFFER!**\n📅 Today only until 10 PM\n\n🚀 **ORDER NOW TO GET THIS DEAL!**`
        };
        
        const message = recommendations[foodType] || `I recommend trying our ${foodType}!`;
        this.sendMessage(message, 'seller');
    }
    
    sendWelcomeMessage() {
        // Only send if no messages yet
        setTimeout(() => {
            const buyerContainer = document.getElementById('messagesContainer');
            const sellerContainer = document.getElementById('sellerMessages');
            
            const hasMessages = (buyerContainer && buyerContainer.children.length > 1) ||
                               (sellerContainer && sellerContainer.children.length > 1);
            
            if (!hasMessages) {
                if (this.userType === 'buyer') {
                    this.sendMessage("👋 Hello! I'd like to order some food. What do you recommend today?", 'buyer');
                } else {
                    this.sendMessage("👋 Welcome to Food Store Chat! I'm ready to help you with your order.", 'seller');
                }
            }
        }, 2000);
    }
    
    resetChat() {
        if (this.messagesRef) {
            this.showConfirmationDialog(
                'Final Confirmation',
                '🚨 <strong>LAST WARNING!</strong> 🚨<br><br>This will PERMANENTLY delete ALL chat messages from the database.<br><br><strong>This action cannot be undone!</strong>',
                () => {
                    this.messagesRef.remove()
                        .then(() => {
                            console.log('✅ Chat reset successfully!');
                            this.showSuccessMessage('Chat has been reset!');
                            
                            // Clear local messages
                            this.clearLocalMessages();
                            
                            // Send welcome message
                            setTimeout(() => {
                                if (this.userType === 'seller') {
                                    this.sendMessage('Chat has been reset. Welcome! 👋', 'seller');
                                }
                            }, 1000);
                        })
                        .catch(error => {
                            console.error('❌ Reset error:', error);
                            this.showErrorMessage('Error resetting chat: ' + error.message);
                        });
                },
                true
            );
        }
    }
    
    clearLocalMessages() {
        const buyerContainer = document.getElementById('messagesContainer');
        const sellerContainer = document.getElementById('sellerMessages');
        
        if (buyerContainer) {
            buyerContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-bubble">
                        <i class="fas fa-broom welcome-icon"></i>
                        <h3>Chat Cleared</h3>
                        <p>Messages have been cleared. Start a new conversation!</p>
                    </div>
                </div>
            `;
        }
        
        if (sellerContainer) {
            sellerContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-bubble">
                        <i class="fas fa-broom welcome-icon"></i>
                        <h3>Chat Cleared</h3>
                        <p>Messages have been cleared. Ready for new customers!</p>
                    </div>
                </div>
            `;
        }
        
        console.log('✅ Local messages cleared!');
        this.showSuccessMessage('Messages cleared from screen!');
    }
    
    sendTestMessage() {
        const testMessages = [
            "✅ This is a test message! System is working.",
            "🎯 Test: Food ordering chat is operational!",
            "📱 Test message from seller interface",
            "🍔 Test: Ready to take your order!"
        ];
        
        const randomMsg = testMessages[Math.floor(Math.random() * testMessages.length)];
        this.sendMessage(randomMsg, this.userType);
        this.showSuccessMessage('Test message sent!');
    }
    
    showConfirmationDialog(title, message, onConfirm, showCancel = true) {
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.innerHTML = `
            <div class="confirmation-box">
                <h3><i class="fas fa-exclamation-triangle"></i> ${title}</h3>
                <p>${message}</p>
                <div class="confirmation-actions">
                    ${showCancel ? '<button class="confirm-btn cancel">Cancel</button>' : ''}
                    <button class="confirm-btn danger">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const confirmBtn = dialog.querySelector('.confirm-btn.danger');
        const cancelBtn = dialog.querySelector('.confirm-btn.cancel');
        
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            if (onConfirm) onConfirm();
        });
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(dialog);
            });
        }
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        });
    }
    
    showSuccessMessage(text) {
        this.showMessage(text, 'success');
    }
    
    showErrorMessage(text) {
        this.showMessage(text, 'error');
    }
    
    showMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            ${text}
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'r' && this.userType === 'seller') {
                e.preventDefault();
                this.showConfirmationDialog(
                    'Keyboard Shortcut',
                    'Reset all chat messages?',
                    () => this.resetChat()
                );
            }
            
            if (e.ctrlKey && e.altKey && e.key === 'c' && this.userType === 'seller') {
                e.preventDefault();
                this.clearLocalMessages();
            }
            
            if (e.ctrlKey && e.altKey && e.key === 't' && this.userType === 'seller') {
                e.preventDefault();
                this.sendTestMessage();
            }
        });
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Page loaded, starting Food Chat App...");
    window.foodChatApp = new FoodChatApp();
});