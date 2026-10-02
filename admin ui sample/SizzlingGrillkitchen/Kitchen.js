document.addEventListener('DOMContentLoaded', () => {
    const pendingColumn = document.querySelector('.column:nth-child(1)');
    const preparingColumn = document.querySelector('.column:nth-child(2)');
    const completeColumn = document.querySelector('.column:nth-child(3)');

    // Fetch and display orders
    async function fetchOrders() {
        try {
            const response = await fetch('get_orders.php');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const orders = await response.json();
            renderOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Clear previous order cards while keeping the column-header
    function clearColumnCards(column) {
        const header = column.querySelector('.column-header');
        column.innerHTML = '';
        if (header) {
            column.appendChild(header);
        }
    }

    // Determine the Font Awesome icon based on item name
    function getItemIcon(name) {
        const lowercaseName = name.toLowerCase();
        if (lowercaseName.includes('blender')) return 'fas fa-blender';
        if (lowercaseName.includes('beer') || lowercaseName.includes('carlsberg') || lowercaseName.includes('kingfisher')) return 'fas fa-beer';
        if (lowercaseName.includes('margarita') || lowercaseName.includes('cosmopolitan') || lowercaseName.includes('mimosa') || lowercaseName.includes('screw driver')) return 'fas fa-wine-glass-alt';
        if (lowercaseName.includes('espresso') || lowercaseName.includes('coffee') || lowercaseName.includes('tea')) return 'fas fa-mug-hot';
        if (lowercaseName.includes('santra') || lowercaseName.includes('lemon') || lowercaseName.includes('orange')) return 'fas fa-lemon';
        if (lowercaseName.includes('choco') || lowercaseName.includes('candy')) return 'fas fa-candy-cane';
        if (lowercaseName.includes('veg') || lowercaseName.includes('leaf')) return 'fas fa-leaf';
        return 'fas fa-utensils';
    }

    // Create order card element
    function createOrderCard(order) {
        const card = document.createElement('div');
        const statusClass = order.status.toLowerCase();
        card.className = `order-card status-${statusClass}`;
        card.dataset.orderNo = order.order_no;
        card.dataset.status = order.status;

        // Order meta (Header)
        const meta = document.createElement('div');
        meta.className = 'order-meta';

        const orderSpan = document.createElement('span');
        orderSpan.textContent = `Order #${order.order_no}`;

        const tableSpan = document.createElement('span');
        tableSpan.className = 'table-number';
        tableSpan.innerHTML = `<i class="fas fa-hashtag"></i> Table ${order.table_number}`;

        meta.appendChild(orderSpan);
        meta.appendChild(tableSpan);
        card.appendChild(meta);

        // Items List
        const itemList = document.createElement('div');
        itemList.className = 'item-list';

        order.items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.className = 'item-row';

            const itemName = document.createElement('span');
            itemName.className = 'item-name';
            
            const iconClass = getItemIcon(item.name);
            itemName.innerHTML = `<i class="${iconClass}"></i> ${item.name}`;

            // Add VEG badge if name indicates vegetarian
            const isVeg = item.name.toLowerCase().includes('veg') || 
                          item.name.toLowerCase().includes('paneer') || 
                          item.name.toLowerCase().includes('chana');
            if (isVeg) {
                itemName.innerHTML += ` <span class="veg-badge">VEG</span>`;
            }

            const itemQty = document.createElement('span');
            itemQty.className = 'item-qty';
            itemQty.textContent = item.qty;

            itemRow.appendChild(itemName);
            itemRow.appendChild(itemQty);
            itemList.appendChild(itemRow);
        });

        card.appendChild(itemList);

        // Click to cycle status
        card.addEventListener('click', (e) => {
            if (e.target.closest('.order-meta')) return;
            cycleOrderStatus(order.order_no, order.status);
        });

        return card;
    }

    // Show custom confirmation modal and return a Promise (resolves to true/false)
    function showConfirmModal(orderNo, nextStatus) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const message = document.getElementById('modal-message');
            const cancelBtn = document.getElementById('modal-cancel-btn');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const headerTitle = modal.querySelector('.modal-header h2');

            if (nextStatus === 'Archive') {
                if (headerTitle) headerTitle.textContent = 'Save & Archive';
                message.textContent = `Are you sure you want to save Order #${orderNo} to Complitorder? This will remove it from the screen.`;
                confirmBtn.textContent = 'Yes, Save';
            } else if (nextStatus === 'Complete') {
                if (headerTitle) headerTitle.textContent = 'Mark as Complete';
                message.textContent = `Are you sure you want to change the status of Order #${orderNo} to "Complete"?`;
                confirmBtn.textContent = 'Yes, Complete';
            } else if (nextStatus === 'Preparing') {
                if (headerTitle) headerTitle.textContent = 'Start Preparing';
                message.textContent = `Are you sure you want to change the status of Order #${orderNo} to "Preparing"?`;
                confirmBtn.textContent = 'Yes, Start';
            } else {
                if (headerTitle) headerTitle.textContent = 'Confirm Status Change';
                message.textContent = `Are you sure you want to change the status of Order #${orderNo} to "${nextStatus}"?`;
                confirmBtn.textContent = 'Yes, Change';
            }
            modal.style.display = 'flex';

            const handleCancel = () => {
                modal.style.display = 'none';
                cleanup();
                resolve(false);
            };

            const handleConfirm = () => {
                modal.style.display = 'none';
                cleanup();
                resolve(true);
            };

            const cleanup = () => {
                cancelBtn.removeEventListener('click', handleCancel);
                confirmBtn.removeEventListener('click', handleConfirm);
            };

            cancelBtn.addEventListener('click', handleCancel, { once: true });
            confirmBtn.addEventListener('click', handleConfirm, { once: true });
        });
    }

    // Cycle status: Pending -> Preparing -> Complete -> Archive (Saves & Deletes)
    async function cycleOrderStatus(orderNo, currentStatus) {
        let nextStatus = 'Pending';
        if (currentStatus === 'Pending') {
            nextStatus = 'Preparing';
        } else if (currentStatus === 'Preparing') {
            nextStatus = 'Complete';
        } else if (currentStatus === 'Complete') {
            nextStatus = 'Archive';
        }

        const confirmed = await showConfirmModal(orderNo, nextStatus);
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch('update_order_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_no: orderNo,
                    status: nextStatus
                })
            });

            const result = await response.json();
            if (result.success) {
                // Instantly fetch and update view
                fetchOrders();
            } else {
                console.error('Failed to update status:', result.message);
            }
        } catch (error) {
            console.error('Error cycling order status:', error);
        }
    }

    // Render all orders in columns
    function renderOrders(orders) {
        clearColumnCards(pendingColumn);
        clearColumnCards(preparingColumn);
        clearColumnCards(completeColumn);

        orders.forEach(order => {
            const card = createOrderCard(order);
            const status = order.status.toLowerCase();

            if (status === 'preparing') {
                preparingColumn.appendChild(card);
            } else if (status === 'complete') {
                completeColumn.appendChild(card);
            } else {
                pendingColumn.appendChild(card);
            }
        });

        updateColumnCounts();
    }

    // Update the badge count inside each column header
    function updateColumnCounts() {
        const columns = [pendingColumn, preparingColumn, completeColumn];
        columns.forEach(col => {
            const badge = col.querySelector('.column-header .badge');
            if (!badge) return;
            const cards = col.querySelectorAll('.order-card');
            const count = cards.length;
            badge.textContent = count + ' order' + (count !== 1 ? 's' : '');
        });
    }

    // Initial load
    fetchOrders();

    // Auto-poll every 5 seconds for live kitchen updates
    setInterval(fetchOrders, 5000);

    console.log('🍽️ Kitchen Display System initialized. Polling database...');
});
