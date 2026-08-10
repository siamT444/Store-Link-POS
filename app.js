const SUPABASE_URL = 'https://pxtwijumpsdaluzftglh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AW7JzZyqXe_SUw6mWwZRbA_hAkrNYN5';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


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

    const navInventory =
        document.getElementById('nav-inventory');

    const settingsContent =
        document.getElementById('settings-content');

    const settingsButton =
        document.querySelector(
            "button[onclick=\"showTab('settings-tab', this)\"]"
        );


    // ============================================
    // CASHIER
    // ============================================

    if (role === 'cashier') {

        // Hide Inventory
        if (navInventory) {
            navInventory.style.display = 'none';
        }

        // Keep Settings button visible
        if (settingsButton) {
            settingsButton.style.display = 'inline-flex';
        }

        // Restricted Settings page
        if (settingsContent) {

            settingsContent.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 50px 20px;
                ">

                    <i
                        class="fa-solid fa-lock"
                        style="
                            font-size: 45px;
                            color: var(--danger-color);
                            margin-bottom: 15px;
                        "
                    ></i>

                    <h3>Restricted Access</h3>

                    <p style="
                        color: var(--text-muted);
                        margin-top: 8px;
                    ">
                        Cashier accounts cannot access
                        admin settings.
                    </p>

                    <p style="
                        color: var(--text-muted);
                        font-size: 13px;
                        margin-top: 5px;
                    ">
                        Only administrators can manage
                        cashier accounts and inventory.
                    </p>

                </div>
            `;
        }
    }


    // ============================================
    // ADMIN
    // ============================================

    else if (role === 'admin') {

        // Show Inventory
        if (navInventory) {
            navInventory.style.display = 'inline-flex';
        }

        // Show Settings
        if (settingsButton) {
            settingsButton.style.display = 'inline-flex';
        }

        // Admin settings
        renderAdminSettings();
    }
}

// --- 3. Dynamic Navigation ---
function showTab(tabId, btnElement) {

    const currentUser =
        JSON.parse(localStorage.getItem('currentUser'));

    // Cashier cannot access Inventory
    if (
        tabId === 'inventory-tab' &&
        currentUser &&
        currentUser.role === 'cashier'
    ) {
        alert("Access denied! Inventory is Admin only.");
        return;
    }


    document
        .querySelectorAll('.tab-content')
        .forEach(tab => {
            tab.classList.remove('active');
        });


    document
        .querySelectorAll('.nav-btn')
        .forEach(btn => {
            btn.classList.remove('active');
        });


    const targetTab =
        document.getElementById(tabId);

    if (targetTab) {
        targetTab.classList.add('active');
    }

    if (btnElement) {
        btnElement.classList.add('active');
    }
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
async function addProduct() {
    const sku = document.getElementById('prod-sku').value.trim();
    const name = document.getElementById('prod-name').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);

    if (
        !sku ||
        !name ||
        isNaN(price) ||
        price <= 0 ||
        isNaN(stock) ||
        stock < 0
    ) {
        alert("Please fill all valid details.");
        return;
    }

    // Check if SKU already exists
    const { data: existingProduct, error: checkError } =
        await supabaseClient
            .from('products')
            .select('id, is_active')
            .eq('sku', sku)
            .maybeSingle();

    if (checkError) {
        console.error("Error checking product:", checkError);
        alert("Could not check product. Please try again.");
        return;
    }

    let data;
    let error;

    if (existingProduct) {

        // Existing product found
        // Update it and make sure it becomes active again
        ({ data, error } = await supabaseClient
            .from('products')
            .update({
                name: name,
                price: price,
                stock: stock,
                is_active: true
            })
            .eq('id', existingProduct.id)
            .select());

    } else {

        // Completely new SKU
        ({ data, error } = await supabaseClient
            .from('products')
            .insert([{
                sku: sku,
                name: name,
                price: price,
                stock: stock,
                is_active: true
            }])
            .select());
    }

    if (error) {
        console.error("Product save error:", error);
        alert("Product could not be saved. Check the browser console.");
        return;
    }

    alert(
        existingProduct
            ? "Product updated successfully!"
            : "Product added successfully!"
    );

    // Clear form
    document.getElementById('prod-sku').value = '';
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-stock').value = '';

    // Refresh UI
    await renderInventory();
    await renderProducts();
}

async function renderInventory() {
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading products:", error);
        alert("Could not load products.");
        return;
    }

    const list = document.getElementById('inventory-list');

    if (!products || products.length === 0) {
        list.innerHTML = `
            <div class="glass-card">
                <p style="color: var(--text-muted); text-align: center;">
                    No products available.
                </p>
            </div>
        `;
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="glass-card">

            <h4 style="color: var(--accent-color);">
                ${p.name}
            </h4>

            <p style="font-size: 12px; color: var(--text-muted);">
                SKU: ${p.sku}
            </p>

            <div style="
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
                font-weight: 600;
            ">
                <span>৳${Number(p.price).toFixed(2)}</span>

                <span style="
                    color: ${p.stock > 0
                        ? 'var(--success-color)'
                        : 'var(--danger-color)'};
                ">
                    Stock: ${p.stock}
                </span>
            </div>

            <button
                onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')"
                style="
                    width: 100%;
                    margin-top: 12px;
                    padding: 8px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    background: var(--danger-color);
                    color: white;
                    font-weight: 600;
                "
            >
                <i class="fa-solid fa-trash"></i>
                Delete Product
            </button>

        </div>
    `).join('');
}


async function deleteProduct(productId, productName) {

    const confirmed = confirm(
        `Are you sure you want to remove "${productName}"?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const { error } = await supabaseClient
            .from('products')
            .update({ is_active: false })
            .eq('id', productId);

        if (error) {
            console.error("Product remove error:", error);

            alert(
                "Could not remove product.\n" +
                error.message
            );

            return;
        }

        alert("Product removed successfully!");

        await renderInventory();
        await renderProducts();

    } catch (error) {

        console.error("Remove product error:", error);

        alert("Something went wrong while removing the product.");
    }
}

// --- 6. POS & Shopping Cart ---
async function renderProducts() {
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading products:", error);
        alert("Could not load products.");
        return;
    }

    const list = document.getElementById('product-list');

    if (!products || products.length === 0) {
        list.innerHTML = `
            <div class="glass-card">
                <p style="color: var(--text-muted); text-align: center;">
                    No products available.
                </p>
            </div>
        `;
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="product-item" onclick="addToCart('${p.sku}')">
            <h4>${p.name}</h4>
            <p>৳${p.price}</p>
            <small>Stock: ${p.stock}</small>
        </div>
    `).join('');
}

async function addToCart(sku) {
    const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

    if (error) {
        console.error("Error loading product:", error);
        alert("Could not load product.");
        return;
    }

    if (!product) {
        alert("Product not found!");
        return;
    }

    if (product.stock <= 0) {
        alert("Out of stock!");
        return;
    }

    const cartItem = cart.find(item => item.sku === sku);

    if (cartItem) {
        if (cartItem.qty < product.stock) {
            cartItem.qty++;
        } else {
            alert("Maximum stock reached!");
        }
    } else {
        cart.push({
            ...product,
            qty: 1
        });
    }

    renderCart();
}

async function updateQty(sku, change) {
    const item = cart.find(i => i.sku === sku);

    if (!item) return;

    const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

    if (error) {
        console.error("Error loading product:", error);
        return;
    }

    item.qty += change;

    if (item.qty <= 0) {
        cart = cart.filter(i => i.sku !== sku);
    } else if (item.qty > product.stock) {
        item.qty = product.stock;
        alert("Maximum stock reached!");
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
async function processCheckout() {

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    try {

        // ================================================
        // 1. VERIFY CURRENT STOCK FROM SUPABASE
        // ================================================

        for (const item of cart) {

            const { data: product, error: stockCheckError } =
                await supabaseClient
                    .from('products')
                    .select('id, name, stock, is_active')
                    .eq('id', item.id)
                    .single();

            if (stockCheckError) {
                console.error(
                    "Stock check error:",
                    stockCheckError
                );
                throw stockCheckError;
            }

            // Product no longer active
            if (!product.is_active) {
                alert(
                    `${product.name} is no longer available.`
                );
                await renderProducts();
                await renderInventory();
                return;
            }

            // Not enough stock
            if (Number(product.stock) < Number(item.qty)) {

                alert(
                    `Not enough stock for "${product.name}".\n\n` +
                    `Available stock: ${product.stock}\n` +
                    `Requested quantity: ${item.qty}`
                );

                await renderProducts();
                await renderInventory();

                return;
            }
        }


        // ================================================
        // 2. CALCULATE SUBTOTAL
        // ================================================

        let subtotal = 0;

        cart.forEach(item => {
            subtotal +=
                Number(item.price) *
                Number(item.qty);
        });


        // ================================================
        // 3. GET CUSTOMER PHONE
        // ================================================

        const phone = document
            .getElementById('customer-phone')
            .value
            .trim();

        let customerId = null;
        let discount = 0;
        let previousPurchases = 0;


        // ================================================
        // 4. CUSTOMER + DISCOUNT LOGIC
        // ================================================

        if (phone) {

            // Find customer by phone
            const {
                data: existingCustomer,
                error: customerFindError
            } = await supabaseClient
                .from('customers')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();

            if (customerFindError) {

                console.error(
                    "Customer search error:",
                    customerFindError
                );

                throw customerFindError;
            }


            // --------------------------------
            // Existing customer
            // --------------------------------

            if (existingCustomer) {

                customerId = existingCustomer.id;


                // Count previous purchases
                const {
                    count,
                    error: purchaseCountError
                } = await supabaseClient
                    .from('sales')
                    .select('id', {
                        count: 'exact',
                        head: true
                    })
                    .eq(
                        'customer_id',
                        customerId
                    );

                if (purchaseCountError) {

                    console.error(
                        "Purchase count error:",
                        purchaseCountError
                    );

                    throw purchaseCountError;
                }

                previousPurchases = count || 0;


                // First 5 purchases get 2% discount
                if (previousPurchases < 5) {
                    discount = subtotal * 0.02;
                } else {
                    discount = 0;
                }

            }


            // --------------------------------
            // New customer
            // --------------------------------

            else {

                const {
                    data: newCustomer,
                    error: customerInsertError
                } = await supabaseClient
                    .from('customers')
                    .insert({
                        name: 'Customer',
                        phone: phone
                    })
                    .select('id')
                    .single();

                if (customerInsertError) {

                    console.error(
                        "Customer insert error:",
                        customerInsertError
                    );

                    throw customerInsertError;
                }

                customerId = newCustomer.id;

                // First purchase gets 2% discount
                previousPurchases = 0;
                discount = subtotal * 0.02;
            }

        }


        // ================================================
        // 5. WALK-IN CUSTOMER
        // ================================================

        else {

            const {
                data: walkInCustomer,
                error: walkInFindError
            } = await supabaseClient
                .from('customers')
                .select('id')
                .eq('phone', 'WALK-IN')
                .maybeSingle();

            if (walkInFindError) {

                console.error(
                    "Walk-in customer search error:",
                    walkInFindError
                );

                throw walkInFindError;
            }


            if (walkInCustomer) {

                customerId = walkInCustomer.id;

            } else {

                const {
                    data: newWalkInCustomer,
                    error: walkInInsertError
                } = await supabaseClient
                    .from('customers')
                    .insert({
                        name: 'Walk-in Customer',
                        phone: 'WALK-IN'
                    })
                    .select('id')
                    .single();

                if (walkInInsertError) {

                    console.error(
                        "Walk-in customer insert error:",
                        walkInInsertError
                    );

                    throw walkInInsertError;
                }

                customerId = newWalkInCustomer.id;
            }

            // Walk-in gets no discount
            discount = 0;
        }


        // ================================================
        // 6. CALCULATE FINAL AMOUNT
        // ================================================

        const finalAmount =
            subtotal - discount;


        // ================================================
        // 7. CREATE SALE
        // ================================================

        const {
            data: sale,
            error: saleError
        } = await supabaseClient
            .from('sales')
            .insert({
                customer_id: customerId,
                total_amount: subtotal,
                discount: discount,
                final_amount: finalAmount
            })
            .select('id')
            .single();

        if (saleError) {

            console.error(
                "Sale save error:",
                saleError
            );

            throw saleError;
        }


        // ================================================
        // 8. CREATE SALE ITEMS
        // ================================================

        const saleItems = cart.map(item => ({
            sale_id: sale.id,
            product_id: item.id,
            quantity: item.qty,
            unit_price: Number(item.price),
            subtotal:
                Number(item.price) *
                Number(item.qty)
        }));


        const {
            error: saleItemsError
        } = await supabaseClient
            .from('sales_item')
            .insert(saleItems);

        if (saleItemsError) {

            console.error(
                "Sale items save error:",
                saleItemsError
            );

            throw saleItemsError;
        }


        // ================================================
        // 9. UPDATE PRODUCT STOCK
        // ================================================

        for (const item of cart) {

            const {
                data: currentProduct,
                error: currentStockError
            } = await supabaseClient
                .from('products')
                .select('stock')
                .eq('id', item.id)
                .single();

            if (currentStockError) {

                console.error(
                    "Current stock error:",
                    currentStockError
                );

                throw currentStockError;
            }


            const newStock =
                Number(currentProduct.stock) -
                Number(item.qty);


            const {
                error: stockError
            } = await supabaseClient
                .from('products')
                .update({
                    stock: newStock
                })
                .eq('id', item.id);


            if (stockError) {

                console.error(
                    "Stock update error:",
                    stockError
                );

                throw stockError;
            }
        }


        // ================================================
        // 10. SUCCESS MESSAGE
        // ================================================

        let discountMessage = '';


        if (discount > 0 && phone) {

            const usedNumber =
                previousPurchases + 1;

            const remaining =
                Math.max(0, 5 - usedNumber);


            discountMessage =
                `\nDiscount: ৳${discount.toFixed(2)}` +
                `\nDiscount used: ${usedNumber}/5` +
                `\nRemaining discount: ${remaining}`;

        } else if (phone && previousPurchases >= 5) {

            discountMessage =
                `\nDiscount: ৳0.00` +
                `\nDiscount limit reached (5/5)`;

        } else {

            discountMessage =
                `\nDiscount: ৳0.00`;
        }


        alert(
            `Checkout Successful!\n\n` +
            `Subtotal: ৳${subtotal.toFixed(2)}` +
            discountMessage +
            `\nTotal: ৳${finalAmount.toFixed(2)}`
        );


        // ================================================
        // 11. CLEAR CART
        // ================================================

        cart = [];

        document
            .getElementById('customer-phone')
            .value = '';


        // ================================================
        // 12. REFRESH UI
        // ================================================

        renderCart();

        await renderProducts();

        await renderInventory();

        await renderSalesHistory();


    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );

        alert(
            "Checkout failed!\n\n" +
            "Please check the browser console."
        );
    }
}

async function renderSalesHistory() {
    const list = document.getElementById('sales-history-list');

    try {
        const { data: sales, error: salesError } =
            await supabaseClient
                .from('sales')
                .select(`
                    id,
                    customer_id,
                    total_amount,
                    discount,
                    final_amount,
                    created_at,
                    customers (
                        phone,
                        name
                    ),
                    sales_item (
                        quantity,
                        unit_price,
                        subtotal,
                        products (
                            name,
                            sku
                        )
                    )
                `)
                .order('created_at', { ascending: true });

        if (salesError) {
            console.error("Sales history error:", salesError);

            list.innerHTML = `
                <div class="glass-card history-card">
                    <p>Could not load sales history.</p>
                </div>
            `;

            return;
        }

        if (!sales || sales.length === 0) {
            list.innerHTML = `
                <div class="glass-card history-card">
                    <p style="color: var(--text-muted);">
                        No sales found.
                    </p>
                </div>
            `;

            return;
        }


        // ================================================
        // GENERATE SEQUENTIAL INVOICE NUMBERS
        // ================================================

        const invoiceMap = {};

        sales.forEach((sale, index) => {

            invoiceMap[sale.id] =
                `INV-${String(index + 1).padStart(6, '0')}`;

        });


        // Newest first
        const reversedSales = [...sales].reverse();


        // ================================================
        // RENDER SALES
        // ================================================

        list.innerHTML = reversedSales.map(sale => {

            const invoiceNumber =
                invoiceMap[sale.id];


            const customerPhone =
                sale.customers?.phone || 'WALK-IN';

            const customerName =
                sale.customers?.name ||
                'Walk-in Customer';


            const saleDate =
                sale.created_at
                    ? new Date(
                        sale.created_at
                    ).toLocaleString()
                    : 'N/A';


            const items =
                sale.sales_item || [];


            // ============================================
            // PRODUCT ITEMS
            // ============================================

            const itemsHTML = items.map(item => {

                const productName =
                    item.products?.name ||
                    'Unknown Product';

                const sku =
                    item.products?.sku ||
                    '-';

                const quantity =
                    Number(item.quantity || 0);

                const unitPrice =
                    Number(item.unit_price || 0);

                const itemSubtotal =
                    Number(item.subtotal || 0);


                return `
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 50px 90px 100px;
                        gap: 8px;
                        padding: 8px 0;
                        border-bottom: 1px solid var(--glass-border);
                        font-size: 13px;
                        align-items: center;
                    ">

                        <div>
                            <strong>${productName}</strong>

                            <div style="
                                font-size: 11px;
                                color: var(--text-muted);
                            ">
                                SKU: ${sku}
                            </div>
                        </div>

                        <div style="text-align: center;">
                            ${quantity}
                        </div>

                        <div style="text-align: right;">
                            ৳${unitPrice.toFixed(2)}
                        </div>

                        <div style="
                            text-align: right;
                            font-weight: 600;
                        ">
                            ৳${itemSubtotal.toFixed(2)}
                        </div>

                    </div>
                `;

            }).join('');


            // ============================================
            // TOTALS
            // ============================================

            const subtotal =
                Number(sale.total_amount || 0);

            const discount =
                Number(sale.discount || 0);

            const finalAmount =
                Number(sale.final_amount || 0);


            // ============================================
            // CUSTOMER DISPLAY
            // ============================================

            const customerDisplay =
                customerPhone === 'WALK-IN'
                    ? 'Walk-in Customer'
                    : `${customerName} (${customerPhone})`;


            // ============================================
            // FINAL INVOICE CARD
            // ============================================

            return `
                <div class="glass-card history-card"
                    style="
                        padding: 20px;
                        margin-bottom: 18px;
                    ">

                    <!-- Invoice Header -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 15px;
                    ">

                        <div>
                            <h3 style="
                                margin: 0;
                                color: var(--accent-color);
                            ">
                                ${invoiceNumber}
                            </h3>

                            <p style="
                                margin: 5px 0 0;
                                font-size: 12px;
                                color: var(--text-muted);
                            ">
                                ${saleDate}
                            </p>
                        </div>

                        <div style="
                            text-align: right;
                            font-size: 12px;
                            color: var(--text-muted);
                        ">
                            <div>
                                <strong>Customer</strong>
                            </div>

                            <div>
                                ${customerDisplay}
                            </div>
                        </div>

                    </div>


                    <!-- Product Table Header -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 50px 90px 100px;
                        gap: 8px;
                        padding: 8px 0;
                        border-top: 1px solid var(--glass-border);
                        border-bottom: 1px solid var(--glass-border);
                        font-size: 12px;
                        font-weight: 700;
                    ">

                        <div>Product</div>
                        <div style="text-align: center;">Qty</div>
                        <div style="text-align: right;">Price</div>
                        <div style="text-align: right;">Subtotal</div>

                    </div>


                    <!-- Product Items -->
                    <div style="margin-bottom: 12px;">
                        ${
                            itemsHTML ||
                            `
                            <p style="
                                color: var(--text-muted);
                                text-align: center;
                                padding: 10px;
                            ">
                                No items found
                            </p>
                            `
                        }
                    </div>


                    <!-- Invoice Summary -->
                    <div style="
                        margin-left: auto;
                        max-width: 280px;
                    ">

                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding: 5px 0;
                        ">
                            <span>Subtotal</span>
                            <strong>
                                ৳${subtotal.toFixed(2)}
                            </strong>
                        </div>


                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding: 5px 0;
                        ">
                            <span>Discount</span>

                            <strong style="
                                color: var(--success-color);
                            ">
                                - ৳${discount.toFixed(2)}
                            </strong>
                        </div>


                        <div style="
                            border-top: 1px solid var(--glass-border);
                            margin-top: 5px;
                            padding-top: 8px;
                            display: flex;
                            justify-content: space-between;
                            font-size: 17px;
                            font-weight: 700;
                        ">

                            <span>Total</span>

                            <span>
                                ৳${finalAmount.toFixed(2)}
                            </span>

                        </div>

                    </div>

                </div>
            `;

        }).join('');


    } catch (error) {

        console.error(
            "Render sales history error:",
            error
        );

        list.innerHTML = `
            <div class="glass-card history-card">
                <p>
                    Failed to load sales history.
                </p>
            </div>
        `;
    }
}

