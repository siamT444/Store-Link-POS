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
    localStorage.setItem('customers', JSON.stringify([]));
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
        if(navInventory) navInventory.style.display = 'none';
        settingsContent.innerHTML = '<h3 style="color: var(--danger-color); text-align: center;"><i class="fa-solid fa-lock"></i> Restricted Access (Admin Only)</h3>';
    } else if (role === 'admin') {
        if(navInventory) navInventory.style.display = 'inline-flex';
        renderAdminSettings();
    }
}

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

// --- 3. Dynamic Navigation ---
function showTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if(btnElement) btnElement.classList.add('active');
}

// --- 4. Admin Settings ---
function renderAdminSettings() {
    const settingsContent = document.getElementById('settings-content');
    settingsContent.innerHTML = `
        <h3><i class="fa-solid fa-user-plus"></i> Add New Cashier</h3>
        <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 15px;">Create accounts for cashiers with limited permissions.</p>
        <div class="input-group">
            <i class="fa-solid fa-user input-icon"></i>
            <input type="text" id="new-cashier-name" placeholder="Cashier Username">
        </div>
        <div class="input-group">
            <i class="fa-solid fa-key input-icon"></i>
            <input type="password" id="new-cashier-pass" placeholder="Password">
        </div>
        <button class="btn-primary" onclick="addCashier()"><i class="fa-solid fa-check"></i> Assign Cashier</button>
    `;
}

function addCashier() {
    const name = document.getElementById('new-cashier-name').value;
    const pass = document.getElementById('new-cashier-pass').value;
    
    if(name && pass) {
        const users = JSON.parse(localStorage.getItem('users'));
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
            products[existingIndex] = { sku, name, price, stock };
        } else {
            products.push({ sku, name, price, stock });
        }

        localStorage.setItem('products', JSON.stringify(products));
        alert("Product saved successfully!");
        renderInventory();
        renderProducts();
        
        document.getElementById('prod-sku').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-stock').value = '';
    } else {
        alert("Please fill all valid details.");
    }
}

function renderInventory() {
    const products = JSON.parse(localStorage.getItem('products'));
    const list = document.getElementById('inventory-list');
    list.innerHTML = products.map(p => `
        <div class="glass-card">
            <h4 style="color: var(--accent-color);">${p.name}</h4>
            <p style="font-size: 12px; color: var(--text-muted);">SKU: ${p.sku}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-weight: 600;">
                <span>৳${p.price}</span>
                <span style="color: ${p.stock > 0 ? 'var(--success-color)' : 'var(--danger-color)'};">Stock: ${p.stock}</span>
            </div>
        </div>
    `).join('');
}

// --- 6. POS & Shopping Cart ---
function renderProducts() {
    const products = JSON.parse(localStorage.getItem('products'));
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => `
        <div class="product-item" onclick="addToCart('${p.sku}')">
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
            <div>
                <div><strong>${item.name}</strong></div>
                <small style="color: var(--text-muted);">৳${item.price} x ${item.qty}</small>
            </div>
            <div class="cart-item-controls">
                <span>৳${item.price * item.qty}</span>
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

    if (phone && customers.includes(phone)) {
        discount = subtotal * 0.02; 
    }
    
    const total = subtotal - discount;
    document.getElementById('discount').innerText = discount.toFixed(2);
    document.getElementById('total-amount').innerText = total.toFixed(2);
}

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
    
    let customers = JSON.parse(localStorage.getItem('customers'));
    if (phone && !customers.includes(phone)) {
        customers.push(phone);
        localStorage.setItem('customers', JSON.stringify(customers));
    }

    let products = JSON.parse(localStorage.getItem('products'));
    cart.forEach(cartItem => {
        let prod = products.find(p => p.sku === cartItem.sku);
        if (prod) prod.stock -= cartItem.qty;
    });
    localStorage.setItem('products', JSON.stringify(products));

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
    
    list.innerHTML = sales.slice().reverse().map(sale => `
        <div class="glass-card history-card">
            <h4>Invoice: ${sale.id}</h4>
            <p><strong>Total:</strong> ৳${sale.totalAmount} | <strong>Customer:</strong> ${sale.customerPhone}</p>
            <p><strong>Sold By:</strong> ${sale.soldBy} (${sale.role})</p>
            <p style="font-size: 12px; color: var(--text-muted);"><strong>Time:</strong> ${sale.time}</p>
            <hr style="border: none; border-top: 1px solid var(--glass-border); margin: 8px 0;">
            <small style="color: var(--text-muted);">Items: ${sale.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</small>
        </div>
    `).join('');
}