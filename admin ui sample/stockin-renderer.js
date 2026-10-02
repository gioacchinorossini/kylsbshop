document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('productModal');
    const openBtn = document.getElementById('openModal');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('stockin-form');
    const categorySelect = document.getElementById('sCategory');
    const productSelect = document.getElementById('sProductName');
    const salesPriceInput = document.getElementById('sSalesPrice');
    const productIDInput = document.getElementById('sProductID'); // Hidden input for Product_code
    const tableBody = document.querySelector('#stockin-table tbody');

    // Modal Toggle
    openBtn.onclick = () => modal.style.display = 'block';
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        form.reset();
    };
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

    // 1. Populate Categories from Masterlist
    fetch('fetch_stock_logic.php?action=get_categories')
        .then(res => res.json())
        .then(categories => {
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                categorySelect.appendChild(opt);
            });
        });

    // 2. Load Products based on selected Category
    categorySelect.onchange = function() {
        productSelect.innerHTML = '<option value="">Select Product</option>';
        salesPriceInput.value = '';
        productIDInput.value = '';
        
        if (this.value) {
            fetch(`fetch_stock_logic.php?action=get_products&category=${encodeURIComponent(this.value)}`)
                .then(res => res.json())
                .then(products => {
                    products.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.P_name;
                        opt.textContent = p.P_name;
                        opt.dataset.price = p.P_S_P;
                        opt.dataset.code = p.Product_code;
                        productSelect.appendChild(opt);
                    });
                });
        }
    };

    // 3. Auto-fill Sales Price and Product Code
    productSelect.onchange = function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            salesPriceInput.value = selectedOption.dataset.price;
            productIDInput.value = selectedOption.dataset.code;
        }
    };

    // 4. Form Submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('pCode', productIDInput.value);
        formData.append('pName', productSelect.value);
        formData.append('pCategory', categorySelect.value);
        formData.append('pSP', salesPriceInput.value);
        formData.append('quantity', document.getElementById('sQuantity').value);

        const response = await fetch('Stockin.php', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            alert('Stock entry saved successfully!');
            modal.style.display = 'none';
            form.reset();
            loadStockHistory();
        } else {
            alert('Error: ' + result.message);
        }
    };

    // 5. Load History Table
    window.loadStockHistory = function() {
        fetch('fetch_stock_logic.php?action=get_history')
            .then(res => res.json())
            .then(data => {
                tableBody.innerHTML = data.map(row => `
                    <tr>
                        <td>${row.Sin_ID}</td>
                        <td>${row.Date_time}</td>
                        <td>${row.Product_code}</td>
                        <td>${row.P_name}</td>
                        <td>${row.Quantity}</td>
                        <td><button class="action-btn delete" onclick="alert('Delete ID: ${row.Sin_ID}')">Delete</button></td>
                    </tr>
                `).join('');
            });
    };

    loadStockHistory();
});