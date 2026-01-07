const SUPABASE_URL = 'https://wseexqhbscjvkwtlejfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_T7CJ0sBMTZWkQDmeOemsIQ_uvV1uYLk'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = []; 

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
    if (!grid) return;

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryTerm = document.getElementById('categoryFilter')?.value || 'all';
    const sortTerm = document.getElementById('priceSort')?.value || 'newest';

    let filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.description && p.description.toLowerCase().includes(searchTerm));
        const matchesCategory = categoryTerm === 'all' || p.category === categoryTerm;
        return matchesSearch && matchesCategory;
    });

    if (sortTerm === 'low') filtered.sort((a, b) => a.price - b.price);
    if (sortTerm === 'high') filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; padding: 40px;'>ไม่พบสินค้าที่คุณค้นหา</p>";
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const images = [p.image_url, p.image_url_2, p.image_url_3, p.image_url_4, p.image_url_5].filter(url => url && url.trim() !== "");
        
        return `
        <div class="card">
            <img src="${images[0] || 'https://via.placeholder.com/300'}" 
                 id="main-img-${p.id}" 
                 class="main-img" 
                 onclick="window.openLightbox(this.src)">
            
            ${images.length > 1 ? `
                <div class="thumb-gallery">
                    ${images.map(img => `<img src="${img}" onclick="document.getElementById('main-img-${p.id}').src='${img}'">`).join('')}
                </div>
            ` : ''}

            <div class="card-content">
                <span class="category-tag">${p.category || 'Unisex'}</span>
                <h3>${p.name}</h3>
                <p>${p.description || ''}</p>
                <p class="price">฿${p.price}</p>
            </div>
        </div>
    `}).join('');
}

// --- ADMIN PAGE LOGIC ---

async function adminListProducts() {
    const list = document.getElementById('admin-list');
    if (!list) return;

    const { data } = await _supabase.from('products').select('*').order('created_at', { ascending: false });
    list.innerHTML = data.map(p => `
        <div class="card" style="padding: 10px; margin-bottom: 10px; border: 1px solid #ddd;">
            <img src="${p.image_url || 'https://via.placeholder.com/150'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:10px; cursor:pointer;" onclick="window.openLightbox(this.src)">
            <h3>${p.name}</h3>
            <p>฿${p.price} - ${p.category}</p>
            <div style="display:flex; gap:5px; margin-top:10px;">
                <button onclick="editProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.description ? p.description.replace(/'/g, "\\'") : ''}', '${p.image_url || ''}', '${p.image_url_2 || ''}', '${p.image_url_3 || ''}', '${p.image_url_4 || ''}', '${p.image_url_5 || ''}', '${p.category}')" style="background:#f39c12; flex:1;">Edit</button>
                <button onclick="deleteProduct('${p.id}')" style="background:#e74c3c; flex:1;">Delete</button>
            </div>
        </div>
    `).join('');
}

window.editProduct = (id, name, price, desc, img1, img2, img3, img4, img5, cat) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('desc').value = desc || '';
    document.getElementById('image_url').value = img1 || '';
    document.getElementById('image_url_2').value = img2 || '';
    document.getElementById('image_url_3').value = img3 || '';
    document.getElementById('image_url_4').value = img4 || '';
    document.getElementById('image_url_5').value = img5 || '';
    document.getElementById('category').value = cat || 'Unisex';

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
        category: document.getElementById('category').value,
        image_url: document.getElementById('image_url').value,
        image_url_2: document.getElementById('image_url_2').value,
        image_url_3: document.getElementById('image_url_3').value,
        image_url_4: document.getElementById('image_url_4').value,
        image_url_5: document.getElementById('image_url_5').value
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
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?")) {
        const { error } = await _supabase.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else adminListProducts();
    }
}

window.openLightbox = (imgUrl) => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if(lightbox && lightboxImg) {
        lightboxImg.src = imgUrl;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    adminListProducts();

    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function() {
            this.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    const form = document.getElementById('addForm');
    if (form) form.addEventListener('submit', handleSave);

    document.getElementById('searchInput')?.addEventListener('input', renderFiltered);
    document.getElementById('categoryFilter')?.addEventListener('change', renderFiltered);
    document.getElementById('priceSort')?.addEventListener('change', renderFiltered);
});