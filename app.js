// --- 1. Initialization & Defaults ---
if (!localStorage.getItem('users')) {
    const defaultUsers = [{ username: 'admin', password: '123', role: 'admin' }];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}
if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify([]));
}
if (!localStorage.getItem('sales')) {
    localStorage.setItem('sales', JSON.stringify([]));
}
if (!localStorage.getItem('customers')) {
    localStorage.setItem('customers', JSON.stringify([])); // For loyalty
}

let cart = [];

// --- 2. Authentication & Role Management ---
function handleLogin() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const users = JSON.parse(localStorage.getItem('users'));

    const validUser = users.find(u => u.username === userIn && u.password === passIn);

    if (validUser) {
        localStorage.setItem('currentUser', JSON.stringify(validUser));
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        document.getElementById('current-user-display').innerText = `${validUser.username} (${validUser.role})`;
        
        applyRoleRestrictions(validUser.role);
        
        // Load initial data
        renderProducts();
        renderInventory();
        renderSalesHistory();
    } else {
        alert("Invalid Username or Password!");
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.reload();
}

function applyRoleRestrictions(role) {
    const navInventory = document.getElementById('nav-inventory');
    const settingsContent = document.getElementById('settings-content');

    if (role === 'cashier') {
        navInventory.style.display = 'none'; // Hide inventory from cashier
        settingsContent.innerHTML = '<h2 style="color: red; text-align: center;">No Access. Restricted to Admin.</h2>';
    } else if (role === 'admin') {
        navInventory.style.display = 'inline-block';
        renderAdminSettings();
    }
}

// Check auto-login on page refresh
window.onload = () => {
    const activeUser = JSON.parse(localStorage.getItem('currentUser'));
    if (activeUser) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('current-user-display').innerText = `${activeUser.username} (${activeUser.role})`;
        applyRoleRestrictions(activeUser.role);
        renderProducts();
        renderInventory();
        renderSalesHistory();
    }
};

// --- 3. Navigation ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// --- 4. Admin Settings (Add Cashier) ---
function renderAdminSettings() {
    const settingsContent = document.getElementById('settings-content');
    settingsContent.innerHTML = `
        <h3>Add New Cashier</h3>
        <input type="text" id="new-cashier-name" placeholder="Cashier Username">
        <input type="password" id="new-cashier-pass" placeholder="Password">
        <button onclick="addCashier()">Assign Cashier</button>
    `;
}

function addCashier() {
    const name = document.getElementById('new-cashier-name').value;
    const pass = document.getElementById('new-cashier-pass').value;
    
    if(name && pass) {
        const users = JSON.parse(localStorage.getItem('users'));
        // Check if exists
        if(users.find(u => u.username === name)) {
            alert("User already exists!");
            return;
        }
        users.push({ username: name, password: pass, role: 'cashier' });
        localStorage.setItem('users', JSON.stringify(users));
        alert("New Cashier added successfully!");
        document.getElementById('new-cashier-name').value = '';
        document.getElementById('new-cashier-pass').value = '';
    }
}

// --- 5. Inventory Management ---
function addProduct() {
    const sku = document.getElementById('prod-sku').value;
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);

    if (sku && name && price > 0 && stock >= 0) {
        let products = JSON.parse(localStorage.getItem('products'));
        const existingIndex = products.findIndex(p => p.sku === sku);

        if (existingIndex > -1) {
            products[existingIndex] = { sku, name, price, stock }; // Update
        } else {
            products.push({ sku, name, price, stock }); // Add new
        }

        localStorage.setItem('products', JSON.stringify(products));
        alert("Product saved!");
        renderInventory();
        renderProducts(); // Update POS grid
    } else {
        alert("Please fill all valid details.");
    }
}

function renderInventory() {
    const products = JSON.parse(localStorage.getItem('products'));
    const list = document.getElementById('inventory-list');
    list.innerHTML = products.map(p => `
        <div class="neomorphic-card">
            <strong>${p.name}</strong> (SKU: ${p.sku}) <br>
            Price: ৳${p.price} | Stock: ${p.stock}
        </div>
    `).join('');
}

// --- 6. POS & Shopping Cart ---
function renderProducts() {
    const products = JSON.parse(localStorage.getItem('products'));
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => `
        <div class="neomorphic-card product-item" onclick="addToCart('${p.sku}')">
            <h4>${p.name}</h4>
            <p>৳${p.price}</p>
            <small>Stock: ${p.stock}</small>
        </div>
    `).join('');
}

function addToCart(sku) {
    const products = JSON.parse(localStorage.getItem('products'));
    const product = products.find(p => p.sku === sku);
    
    if (product.stock <= 0) {
        alert("Out of stock!");
        return;
    }

    const cartItem = cart.find(item => item.sku === sku);
    if (cartItem) {
        if(cartItem.qty < product.stock) {
            cartItem.qty++;
        } else {
            alert("Maximum stock reached!");
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function updateQty(sku, change) {
    const item = cart.find(i => i.sku === sku);
    const products = JSON.parse(localStorage.getItem('products'));
    const product = products.find(p => p.sku === sku);

    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.sku !== sku);
        } else if (item.qty > product.stock) {
            item.qty = product.stock;
            alert("Maximum stock reached!");
        }
    }
    renderCart();
}

function renderCart() {
    const cartDiv = document.getElementById('cart-items');
    let subtotal = 0;

    cartDiv.innerHTML = cart.map(item => {
        subtotal += item.price * item.qty;
        return `
        <div class="cart-item">
            <span>${item.name} (x${item.qty})</span>
            <span>৳${item.price * item.qty}</span>
            <div>
                <button onclick="updateQty('${item.sku}', 1)">+</button>
                <button onclick="updateQty('${item.sku}', -1)">-</button>
            </div>
        </div>
    `}).join('');

    document.getElementById('subtotal').innerText = subtotal;
    calculateTotal(subtotal);
}

function calculateTotal(subtotal) {
    const phone = document.getElementById('customer-phone').value;
    const customers = JSON.parse(localStorage.getItem('customers'));
    let discount = 0;

    // Apply 2% discount for returning customers
    if (phone && customers.includes(phone)) {
        discount = subtotal * 0.02; 
    }
    
    const total = subtotal - discount;
    document.getElementById('discount').innerText = discount.toFixed(2);
    document.getElementById('total-amount').innerText = total.toFixed(2);
}

// Listen to phone input to calculate discount dynamically
document.getElementById('customer-phone').addEventListener('input', () => {
    const subtotal = parseFloat(document.getElementById('subtotal').innerText);
    calculateTotal(subtotal);
});

// --- 7. Checkout & Sales History ---
function processCheckout() {
    if (cart.length === 0) return alert("Cart is empty!");

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const phone = document.getElementById('customer-phone').value;
    const total = parseFloat(document.getElementById('total-amount').innerText);
    const now = new Date();
    
    // Save new customer for future discount
    let customers = JSON.parse(localStorage.getItem('customers'));
    if (phone && !customers.includes(phone)) {
        customers.push(phone);
        localStorage.setItem('customers', JSON.stringify(customers));
    }

    // Update Inventory Stock
    let products = JSON.parse(localStorage.getItem('products'));
    cart.forEach(cartItem => {
        let prod = products.find(p => p.sku === cartItem.sku);
        if (prod) prod.stock -= cartItem.qty;
    });
    localStorage.setItem('products', JSON.stringify(products));

    // Log Sale Data
    const newSale = {
        id: 'INV-' + Math.floor(Math.random() * 10000),
        items: cart,
        totalAmount: total,
        soldBy: currentUser.username,  
        role: currentUser.role,        
        time: now.toLocaleDateString() + " " + now.toLocaleTimeString(),
        customerPhone: phone || 'Walk-in'
    };

    let sales = JSON.parse(localStorage.getItem('sales'));
    sales.push(newSale);
    localStorage.setItem('sales', JSON.stringify(sales));

    // Reset UI
    alert(`Checkout Successful! Total: ৳${total}\nSold by: ${currentUser.username}`);
    cart = [];
    document.getElementById('customer-phone').value = '';
    renderCart();
    renderProducts();
    renderInventory();
    renderSalesHistory();
}

function renderSalesHistory() {
    const sales = JSON.parse(localStorage.getItem('sales'));
    const list = document.getElementById('sales-history-list');
    
    // Reverse to show latest first
    list.innerHTML = sales.slice().reverse().map(sale => `
        <div class="neomorphic-card history-card">
            <h4>Invoice: ${sale.id}</h4>
            <p><strong>Total:</strong> ৳${sale.totalAmount} | <strong>Customer:</strong> ${sale.customerPhone}</p>
            <p><strong>Sold By:</strong> ${sale.soldBy} (${sale.role})</p>
            <p><strong>Time:</strong> ${sale.time}</p>
            <hr>
            <small>Items: ${sale.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</small>
        </div>
    `).join('');
}