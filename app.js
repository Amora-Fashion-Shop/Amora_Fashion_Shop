const SUPABASE_URL = 'https://kfeodyswinztdgtrisro.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jbNoQ_-yEOX9OqE-VchFJA_PFMFYbv5'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = []; // Stores the master list from database

// --- CUSTOMER PAGE DISPLAY ---
async function displayProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const { data, error } = await _supabase.from('products').select('*').order('created_at', { ascending: false });
    
    if (error) {
        grid.innerHTML = "<p>Error loading products.</p>";
        return;
    }

    allProducts = data;
    renderFiltered();
}

function renderFiltered() {
    const grid = document.getElementById('products-grid');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryTerm = document.getElementById('categoryFilter')?.value || 'all';
    const sortTerm = document.getElementById('priceSort')?.value || 'newest';

    // 1. Filter
    let filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.description && p.description.toLowerCase().includes(searchTerm));
        const matchesCategory = categoryTerm === 'all' || p.category === categoryTerm;
        return matchesSearch && matchesCategory;
    });

    // 2. Sort
    if (sortTerm === 'low') filtered.sort((a, b) => a.price - b.price);
    if (sortTerm === 'high') filtered.sort((a, b) => b.price - a.price);

    // 3. Render
    if (filtered.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; padding: 40px;'>No products found matching your search.</p>";
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="card">
            ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" onclick="window.openLightbox('${p.image_url}')">` : ''}
            <div class="card-content">
                <span class="category-tag">${p.category || 'General'}</span>
                <h3>${p.name}</h3>
                <p>${p.description || ''}</p>
                <p class="price">$${p.price}</p>
            </div>
        </div>
    `).join('');
}

// --- ADMIN PAGE LOGIC ---

async function adminListProducts() {
    const list = document.getElementById('admin-list');
    if (!list) return;

    const { data } = await _supabase.from('products').select('*').order('created_at', { ascending: false });
    list.innerHTML = data.map(p => `
        <div class="card" style="padding: 20px; margin-bottom: 10px;">
            <span class="category-tag">${p.category || 'General'}</span>
            <h3>${p.name}</h3>
            <p>$${p.price}</p>
            <div style="display: flex; gap: 10px;">
                <button onclick="editProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.description ? p.description.replace(/'/g, "\\'") : ''}', '${p.image_url}', '${p.category}')" style="background: #f39c12; flex: 1;">Edit</button>
                <button onclick="deleteProduct('${p.id}')" style="background: #e74c3c; flex: 1;">Delete</button>
            </div>
        </div>
    `).join('');
}

window.editProduct = (id, name, price, desc, img, cat) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('desc').value = desc || '';
    document.getElementById('image_url').value = img || '';
    document.getElementById('category').value = cat || 'General';

    document.getElementById('form-title').innerText = "Edit Product";
    document.getElementById('submit-btn').innerText = "Update Product";
    document.getElementById('cancel-btn').style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById('addForm').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('form-title').innerText = "Add New Product";
    document.getElementById('submit-btn').innerText = "Save Product";
    document.getElementById('cancel-btn').style.display = "none";
};

async function handleSave(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    
    const productData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        description: document.getElementById('desc').value,
        image_url: document.getElementById('image_url').value,
        category: document.getElementById('category').value
    };

    let response;
    if (id) {
        response = await _supabase.from('products').update(productData).eq('id', id);
    } else {
        response = await _supabase.from('products').insert([productData]);
    }

    if (response.error) {
        alert("Error: " + response.error.message);
    } else {
        alert(id ? "Product Updated!" : "Product Added!");
        resetForm();
        adminListProducts(); 
        displayProducts();
    }
}

async function deleteProduct(id) {
    if (confirm("Are you sure?")) {
        const { error } = await _supabase.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else adminListProducts();
    }
}

// --- LIGHTBOX LOGIC ---
window.openLightbox = (imgUrl) => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if(lightbox && lightboxImg) {
        lightboxImg.src = imgUrl;
        lightbox.style.display = 'flex';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    adminListProducts();
    
    const form = document.getElementById('addForm');
    if (form) form.addEventListener('submit', handleSave);

    // Filter Listeners
    document.getElementById('searchInput')?.addEventListener('input', renderFiltered);
    document.getElementById('categoryFilter')?.addEventListener('change', renderFiltered);
    document.getElementById('priceSort')?.addEventListener('change', renderFiltered);
});