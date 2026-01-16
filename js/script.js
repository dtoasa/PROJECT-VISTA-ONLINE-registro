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

let cart = [];
let currentUser = null;
let slideIdx = 0, slides = [], timer;

// --- CONTROL DE SESIÓN Y CARRITO ---
auth.onAuthStateChanged(user => {
    const l = document.getElementById('login-box'), r = document.getElementById('register-box'), u = document.getElementById('user-logged');
    
    if(user) {
        currentUser = user;
        // Cargar el carrito específico de este usuario
        cart = JSON.parse(localStorage.getItem('cart_' + user.uid)) || [];
        if(l) l.style.display='none'; if(r) r.style.display='none';
        if(u) { u.style.display='block'; document.getElementById('user-mail').innerText = user.email; }
    } else {
        currentUser = null;
        cart = []; // Vaciar vista del carrito si no hay nadie
        if(l) l.style.display='block'; if(r) r.style.display='block';
        if(u) u.style.display='none';
    }
    updateCartUI(); // Actualizar visualmente
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARGAR CARRUSEL
    db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
        const track = document.getElementById('index-gallery');
        if (!track) return;
        slides = snap.docs.map(doc => (doc.data().url || doc.data().img || "").trim());
        if(slides.length > 0) {
            track.innerHTML = slides.map(url => `<img src="${url}">`).join('');
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
            <div class="p-card-small" style="border:1px solid #eee; padding:10px; border-radius:8px; background:white; text-align:center;">
                <img src="${imgUrl}" style="width:100%; height:140px; object-fit:contain;">
                <h4 style="font-size:12px; margin:10px 0; height:32px; overflow:hidden;">${p.desc}</h4>
                <p style="font-weight:bold;">$${p.price}</p>
                ${esStock ? `<button onclick="addToCart('${p.desc}', '${p.price}', '${imgUrl}')" style="width:100%; background:#febd69; border:none; padding:7px; cursor:pointer; font-weight:bold; border-radius:4px;">🛒 Agregar</button>` : '<p style="color:red; font-size:11px;">AGOTADO</p>'}
            </div>`;
        }).join('');
    });
});

// --- FUNCIONES DEL CARRITO ---
window.addToCart = (desc, price, img) => {
    if (!currentUser) {
        alert("Debes iniciar sesión o registrarte para poder comprar.");
        document.getElementById('login-box').scrollIntoView({behavior: 'smooth'});
        return;
    }

    const index = cart.findIndex(item => item.desc === desc);
    if (index !== -1) { cart[index].qty += 1; } 
    else { cart.push({ desc, price: parseFloat(price), img, qty: 1 }); }
    
    saveAndUpdate();
    document.getElementById('cart-dropdown').classList.add('active');
};

window.changeQty = (index, delta) => {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) { cart.splice(index, 1); }
    saveAndUpdate();
};

function saveAndUpdate() {
    if (currentUser) {
        localStorage.setItem('cart_' + currentUser.uid, JSON.stringify(cart));
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-price');
    const countEl = document.getElementById('cart-count');
    
    const totalUnidades = cart.reduce((sum, i) => sum + i.qty, 0);
    if(countEl) countEl.innerText = totalUnidades;
    
    let totalDinero = 0;
    if(container) {
        if (cart.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:gray; font-size:13px; margin-top:20px;">
                ${currentUser ? 'Tu carrito está vacío' : 'Inicia sesión para ver tu carrito'}
            </p>`;
        } else {
            container.innerHTML = cart.map((item, index) => {
                totalDinero += (item.price * item.qty);
                return `
                <div style="display:flex; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <img src="${item.img}" width="40" height="40" style="object-fit:contain;">
                    <div style="flex-grow:1; margin-left:10px; font-size:12px;">
                        ${item.desc}<br>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                            <button onclick="changeQty(${index}, -1)">-</button>
                            <b>${item.qty}</b>
                            <button onclick="changeQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <b>$${(item.price * item.qty).toFixed(2)}</b>
                </div>`;
            }).join('');
        }
    }
    if(totalEl) totalEl.innerText = `$${totalDinero.toFixed(2)}`;
}

// --- RESTO DE FUNCIONES (RECUPERAR, CARRUSEL, LOGIN) ---
window.recuperarClave = () => {
    const email = document.getElementById('login-email').value;
    if (!email) { alert("Escribe tu correo arriba."); return; }
    auth.sendPasswordResetEmail(email).then(() => alert("Correo enviado.")).catch(e => alert(e.message));
};

window.toggleCart = () => document.getElementById('cart-dropdown').classList.toggle('active');
window.finalizarCompraLocal = () => {
    if(cart.length === 0) return alert("Carrito vacío");
    alert("¡Pedido realizado!");
    cart = [];
    saveAndUpdate();
    toggleCart();
};

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