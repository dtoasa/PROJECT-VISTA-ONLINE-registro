const firebaseConfig = {
    apiKey: "AIzaSyCiaF2kbtS7hTs2E1tK6hDbBX4ASG3Zm8Q",
    authDomain: "tienda-as-3b772.firebaseapp.com",
    projectId: "tienda-as-3b772",
    storageBucket: "tienda-as-3b772.firebasestorage.app",
    messagingSenderId: "214806360310",
    appId: "1:214806360310:web:833918e79d20722f913cd7"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Cargar carrito desde local o iniciar vacío
let cart = JSON.parse(localStorage.getItem('amazonas_cart')) || [];
let slideIdx = 0, slides = [], timer;

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // 1. CARGAR CARRUSEL
    db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
        const track = document.getElementById('index-gallery');
        if (!track) return;
        slides = snap.docs.map(doc => (doc.data().url || doc.data().img || "").trim());
        if(slides.length > 0) {
            track.innerHTML = slides.map(url => `<img src="${url}" onerror="this.src='https://via.placeholder.com/600x350?text=Error+de+Carga'">`).join('');
            iniciarAuto();
        }
    });

    // 2. CARGAR PRODUCTOS
    db.collection("productos").orderBy("fecha", "desc").onSnapshot(snap => {
        const grid = document.getElementById('product-list');
        if(!grid) return;
        grid.innerHTML = snap.docs.map(doc => {
            const p = doc.data();
            const imgUrl = (p.img || p.url || "").trim();
            const esStock = p.stock === 'En Stock';
            return `
            <div class="p-card-small">
                <div style="position:relative; width:100%; height:140px;">
                    <img src="${imgUrl}" onerror="this.src='https://via.placeholder.com/150?text=Sin+Imagen'" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <h4 style="font-size:12px; margin:10px 0; height:32px; overflow:hidden;">${p.desc}</h4>
                <p style="color:#B12704; font-weight:bold;">$${p.price}</p>
                ${esStock ? `<button onclick="addToCart('${p.desc}', '${p.price}', '${imgUrl}')" style="width:100%; background:#febd69; border:none; padding:7px; cursor:pointer; font-weight:bold; border-radius:4px; margin-top:5px;">🛒 Agregar</button>` : '<p style="color:red; font-size:11px; font-weight:bold; margin-top:10px;">AGOTADO</p>'}
            </div>`;
        }).join('');
    });
});

// --- LÓGICA DE CARRITO MEJORADA ---

window.toggleCart = () => document.getElementById('cart-dropdown').classList.toggle('active');

window.addToCart = (desc, price, img) => {
    // Buscar si el producto ya está en el carrito
    const index = cart.findIndex(item => item.desc === desc);
    
    if (index !== -1) {
        cart[index].qty += 1; // Si existe, suma 1 a la cantidad
    } else {
        cart.push({ desc, price: parseFloat(price), img, qty: 1 }); // Si no, lo agrega
    }
    
    updateCartUI();
    document.getElementById('cart-dropdown').classList.add('active');
};

window.changeQty = (index, delta) => {
    cart[index].qty += delta;
    
    // Si la cantidad llega a 0, eliminar producto
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    
    updateCartUI();
};

function updateCartUI() {
    localStorage.setItem('amazonas_cart', JSON.stringify(cart));
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-price');
    const countEl = document.getElementById('cart-count');
    
    // Contar total de unidades (no solo de productos distintos)
    const totalUnidades = cart.reduce((sum, item) => sum + item.qty, 0);
    if(countEl) countEl.innerText = totalUnidades;
    
    let totalPrecio = 0;

    if(container) {
        container.innerHTML = cart.map((item, index) => {
            totalPrecio += (item.price * item.qty);
            return `
            <div class="cart-item">
                <img src="${item.img}" onerror="this.src='https://via.placeholder.com/50'">
                <div class="item-info">
                    <p>${item.desc}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
                <div style="font-weight:bold; font-size:13px;">$${(item.price * item.qty).toFixed(2)}</div>
            </div>`;
        }).join('');
    }
    if(totalEl) totalEl.innerText = `$${totalPrecio.toFixed(2)}`;
}

window.finalizarCompraLocal = () => {
    if(cart.length === 0) return alert("Carrito vacío");
    alert("¡Pedido realizado con éxito!");
    cart = [];
    updateCartUI();
    toggleCart();
};

// --- CARRUSEL Y AUTH (SE MANTIENEN IGUAL) ---

window.mover = (n) => {
    const track = document.getElementById('index-gallery');
    if(!track || slides.length === 0) return;
    slideIdx = (slideIdx + n + slides.length) % slides.length;
    track.style.transform = `translateX(-${slideIdx * 100}%)`;
};
function iniciarAuto() { clearInterval(timer); timer = setInterval(() => mover(1), 4000); }

window.handleLogin = () => auth.signInWithEmailAndPassword(document.getElementById('login-email').value, document.getElementById('login-pass').value).catch(e => alert(e.message));
window.handleRegister = () => auth.createUserWithEmailAndPassword(document.getElementById('reg-email').value, document.getElementById('reg-pass').value).catch(e => alert(e.message));
window.handleLogout = () => auth.signOut();
auth.onAuthStateChanged(user => {
    const l = document.getElementById('login-box'), r = document.getElementById('register-box'), u = document.getElementById('user-logged');
    if(user) {
        if(l) l.style.display='none'; if(r) r.style.display='none';
        if(u) { u.style.display='block'; document.getElementById('user-mail').innerText = user.email; }
    } else {
        if(l) l.style.display='block'; if(r) r.style.display='block';
        if(u) u.style.display='none';
    }
});