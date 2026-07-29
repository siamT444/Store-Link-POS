let products = [
  { name: 'Cold Milk Latte', sku: 'SKU-001', price: 4.75, actual: 45, display: 45 },
  { name: 'Avocado Toast', sku: 'SKU-002', price: 8.50, actual: 30, display: 30 },
  { name: 'Butter Croissant', sku: 'SKU-003', price: 3.50, actual: 25, display: 25 },
  { name: 'Iced Matcha Latte', sku: 'SKU-004', price: 5.25, actual: 40, display: 40 }
];

let cart = [];
let salesHistory = [];
let customers = [
  { name: 'John Doe', phone: '01700000000', orders: 1 }
];

document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const pageTitle = document.querySelector('.page-title');
  
  const productGrid = document.getElementById('productGrid');
  const productsTableBody = document.getElementById('productsTableBody');
  const inventoryTableBody = document.getElementById('inventoryTableBody');
  const salesTableBody = document.getElementById('salesTableBody');
  const customersTableBody = document.getElementById('customersTableBody');
  
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalElement = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const enableCustomerCheckbox = document.getElementById('enableCustomer');
  const customerFields = document.getElementById('customerFields');
  const custNameInput = document.getElementById('custName');
  const custPhoneInput = document.getElementById('custPhone');
  const discountRow = document.getElementById('discountRow');

  enableCustomerCheckbox.addEventListener('change', () => {
    customerFields.style.display = enableCustomerCheckbox.checked ? 'block' : 'none';
    if(!enableCustomerCheckbox.checked) {
      custPhoneInput.value = '';
      renderCart();
    }
  });

  custPhoneInput.addEventListener('input', () => {
    renderCart();
  });

  const itemNameInput = document.getElementById('itemName');
  const itemSkuInput = document.getElementById('itemSku');
  const itemPriceInput = document.getElementById('itemPrice');
  const actualStockInput = document.getElementById('actualStock');
  const displayedStockInput = document.getElementById('displayedStock');
  const addItemBtn = document.getElementById('addItemBtn');

  function renderAll() {
    productGrid.innerHTML = '';
    products.forEach((p, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-name">${p.name}</div>
        <div class="product-price">$${p.price.toFixed(2)}</div>
      `;
      card.addEventListener('click', () => addToCart(index));
      productGrid.appendChild(card);
    });

    productsTableBody.innerHTML = '';
    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${p.name}</td><td>${p.sku}</td><td>$${p.price.toFixed(2)}</td><td>${p.display}</td>`;
      productsTableBody.appendChild(row);
    });

    inventoryTableBody.innerHTML = '';
    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.sku}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.actual}</td>
        <td>${p.display}</td>
        <td><span class="badge in-stock">${p.display > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
      `;
      inventoryTableBody.appendChild(row);
    });

    salesTableBody.innerHTML = '';
    salesHistory.forEach(s => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${s.receipt}</td>
        <td>${s.date}</td>
        <td>${s.cashier}</td>
        <td>${s.customer}</td>
        <td>${s.items}</td>
        <td>${s.total}</td>
      `;
      salesTableBody.appendChild(row);
    });

    customersTableBody.innerHTML = '';
    customers.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${c.name}</td>
        <td>${c.phone}</td>
        <td>${c.orders}</td>
      `;
      customersTableBody.appendChild(row);
    });
  }

  function addToCart(index) {
    const product = products[index];
    const existing = cart.find(item => item.sku === product.sku);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    renderCart();
  }

  window.changeQty = function(sku, delta) {
    const item = cart.find(i => i.sku === sku);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => i.sku !== sku);
      }
    }
    renderCart();
  }

  window.removeFromCart = function(sku) {
    cart = cart.filter(i => i.sku !== sku);
    renderCart();
  }

  function renderCart() {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `<p class="empty-cart">Cart is currently empty</p>`;
      cartTotalElement.textContent = '$0.00';
      discountRow.style.display = 'none';
      return;
    }

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div>
          <div>${item.name}</div>
          <div style="font-size: 11px; color: #666;">$${item.price.toFixed(2)} x ${item.qty}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.sku}', -1)">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.sku}', 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart('${item.sku}')">X</button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    let finalTotal = subtotal;
    const phone = custPhoneInput.value.trim();
    let hasDiscount = false;

    if (enableCustomerCheckbox.checked && phone) {
      const foundCust = customers.find(c => c.phone === phone);
      if (foundCust) {
        finalTotal = subtotal * 0.98; // 2% discount
        hasDiscount = true;
      }
    }

    if (hasDiscount) {
      discountRow.style.display = 'block';
    } else {
      discountRow.style.display = 'none';
    }

    cartTotalElement.textContent = `$${finalTotal.toFixed(2)}`;
  }

  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    let customerInfo = 'Walk-in Customer';
    if (enableCustomerCheckbox.checked) {
      const cName = custNameInput.value.trim() || 'Guest';
      const cPhone = custPhoneInput.value.trim();

      if (cPhone) {
        customerInfo = `${cName} (${cPhone})`;
        const existingCust = customers.find(c => c.phone === cPhone);
        if (existingCust) {
          existingCust.orders += 1;
          if(cName !== 'Guest') existingCust.name = cName;
        } else {
          customers.push({ name: cName, phone: cPhone, orders: 1 });
        }
      }
    }

    const totalStr = cartTotalElement.textContent;
    const itemsSummary = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const receiptId = '#SL-' + Math.floor(10000000 + Math.random() * 90000000);

    salesHistory.unshift({
      receipt: receiptId,
      date: dateStr,
      cashier: 'Alex Rivera',
      customer: customerInfo,
      items: itemsSummary,
      total: totalStr
    });

    alert('Checkout successful! Total: ' + totalStr);
    cart = [];
    enableCustomerCheckbox.checked = false;
    customerFields.style.display = 'none';
    custNameInput.value = '';
    custPhoneInput.value = '';
    renderCart();
    renderAll();
  });

  renderAll();

  addItemBtn.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const sku = itemSkuInput.value.trim();
    const price = parseFloat(itemPriceInput.value);
    const actual = parseInt(actualStockInput.value);
    const display = parseInt(displayedStockInput.value);

    if (sku) {
      const existingProduct = products.find(p => p.sku === sku);

      if (existingProduct) {
        if (name) existingProduct.name = name;
        if (!isNaN(price)) existingProduct.price = price;
        if (!isNaN(actual)) existingProduct.actual = actual;
        if (!isNaN(display)) existingProduct.display = display;
      } else {
        if (name && !isNaN(price) && !isNaN(actual) && !isNaN(display)) {
          products.push({ name, sku, price, actual, display });
        } else {
          alert('Please fill all fields for a new product.');
          return;
        }
      }

      renderAll();
      itemNameInput.value = '';
      itemSkuInput.value = '';
      itemPriceInput.value = '';
      actualStockInput.value = '';
      displayedStockInput.value = '';
    } else {
      alert('SKU Code is required!');
    }
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      const targetPage = item.getAttribute('data-page');
      pageTitle.textContent = item.textContent;

      viewPanels.forEach(panel => {
        if (panel.id === targetPage) {
          panel.style.display = 'block';
        } else {
          panel.style.display = 'none';
        }
      });
    });
  });
});