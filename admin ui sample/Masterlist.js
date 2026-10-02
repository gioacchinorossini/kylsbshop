document.addEventListener('DOMContentLoaded', function() {
    const productModal = document.getElementById('productModal');
    const imageModal = document.getElementById('imageModal');
    const openModalBtn = document.getElementById('openModal');
    const closeModalBtn = document.getElementById('closeModal');
    const closeImageModalBtn = document.getElementById('closeImageModal');
    const masterlistForm = document.getElementById('masterlist-form');
    const tableBody = document.querySelector('#masterlist-table tbody');

    // Modal Controls
    openModalBtn.onclick = () => productModal.style.display = 'block';
    closeModalBtn.onclick = () => productModal.style.display = 'none';
    closeImageModalBtn.onclick = () => imageModal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target == productModal) productModal.style.display = 'none';
        if (event.target == imageModal) imageModal.style.display = 'none';
    };

    // Fetch and Display Data
    const loadProducts = () => {
        
        fetch('fetch_products.php')
            .then(res => res.json())
            .then(data => {
                tableBody.innerHTML = '';
                data.forEach(p => {
                    const row = `
                        <tr>
                            <td>${p.Product_code}</td>
                            <td>
                                ${p.P_image ? `<button class="view-btn" onclick="viewImage('${p.P_image}', '${p.P_name}')">View</button>` : 'No Image'}
                            </td>
                            <td>${p.P_name}</td>
                            <td>${p.P_Category}</td>
                            <td>₱${parseInt(p.P_S_P).toLocaleString()}</td>
                            <td>₱${parseInt(p.P_P_P).toLocaleString()}</td>
                            <td>${p.Date_time}</td>
                            <td>
                                <button class="action-btn delete" onclick="alert('Delete logic here for ID: ${p.P_code}')">Delete</button>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            });
    };

    // Form Submission
    masterlistForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('pCode', document.getElementById('pCode').value);
        formData.append('pName', document.getElementById('pName').value);
        formData.append('pCategory', document.getElementById('pCategory').value);
        formData.append('sellingPrice', document.getElementById('sellingPrice').value);
        formData.append('purchasePrice', document.getElementById('purchasePrice').value);
        formData.append('pImage', document.getElementById('pImage').files[0]);

        const response = await fetch('save_product.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert('Product added successfully!');
            productModal.style.display = 'none';
            masterlistForm.reset();
            loadProducts();
        } else {
            if (result.message === 'Product code already exists.') {
                alert('Error: ' + result.message);
            } else {
                alert('Error: ' + result.message);
            }
        }
    };

    // Global function for image preview
    window.viewImage = (imgSrc, name) => {
        const cardContent = document.getElementById('cardContent');
        cardContent.innerHTML = `
            <h3>${name}</h3>
            <img src="uploads/${imgSrc}" alt="${name}" style="max-width:100%; margin-top:15px; border-radius:8px;">
        `;
        imageModal.style.display = 'block';
    };

    loadProducts();
});