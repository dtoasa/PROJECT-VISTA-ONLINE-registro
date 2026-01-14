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

let carrito = [];
let userLogueado = null;
let curSlide = 0, totalFotos = 0;

// --- USUARIOS ---
auth.onAuthStateChanged(user => {
    userLogueado = user;
    const status = document.getElementById('user-status');
    if (user) {
        status.innerText = "Cerrar Sesión (" + user.email.split('@')[0] + ")";
        cargarCarrito();
    } else {
        status.innerText = "Iniciar Sesión";
        carrito = [];
        actualizarUI();
    }
});

window.handleAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    const isLogin = document.getElementById('auth-title').innerText === "Iniciar Sesión";
    try {
        isLogin ? await auth.signInWithEmailAndPassword(email, pass) : await auth.createUserWithEmailAndPassword(email, pass);
        window.toggleAuthModal();
    } catch (e) { alert(e.message); }
};

// --- CARRITO ---
window.agregarAlCarrito = (desc, price) => {
    if (!userLogueado) return alert("Inicia sesión para comprar");
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    carrito.push({ desc, price: numPrice, id: Date.now() });
    guardarCarrito();
    actualizarUI();
};

const guardarCarrito = () => userLogueado && db.collection("carritos").doc(userLogueado.uid).set({ items: carrito });
const cargarCarrito = () => db.collection("carritos").doc(userLogueado.uid).get().then(doc => { if(doc.exists){ carrito = doc.data().items; actualizarUI(); }});

function actualizarUI() {
    const list = document.getElementById('cart-items');
    document.getElementById('cart-count').innerText = carrito.length;
    let total = 0;
    list.innerHTML = carrito.map((item, i) => {
        total += item.price;
        return `<div style="display:flex; justify-content:space-between; font-size:12px; margin:5px 0;">
            <span>${item.desc}</span><span>$${item.price.toFixed(2)}</span>
            <button onclick="window.quitar(${i})" style="color:red; border:none; background:none;">x</button>
        </div>`;
    }).join('');
    document.getElementById('cart-total').innerText = total.toFixed(2);
}

window.quitar = (i) => { carrito.splice(i, 1); guardarCarrito(); actualizarUI(); };

// --- INTERFAZ ---
window.toggleMenu = () => { document.getElementById('nav-menu').classList.toggle('active'); document.getElementById('menu-btn').classList.toggle('open'); };
window.toggleAuthModal = () => { if(userLogueado) return auth.signOut(); const m = document.getElementById('auth-modal'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; };
window.toggleCart = () => { const c = document.getElementById('cart-modal'); c.style.display = c.style.display === 'block' ? 'none' : 'block'; };
window.switchAuthMode = () => { const t = document.getElementById('auth-title'); const b = document.getElementById('btn-auth-action'); t.innerText = t.innerText === "Registrarse" ? "Iniciar Sesión" : "Registrarse"; b.innerText = t.innerText === "Registrarse" ? "Crear Cuenta" : "Entrar"; };

// --- CARGAR DATOS ---
db.collection("carrusel").onSnapshot(snap => {
    const track = document.getElementById('index-gallery');
    const fotos = snap.docs.map(doc => doc.data().url);
    totalFotos = fotos.length;
    track.innerHTML = fotos.map(url => `<img src="${url}">`).join('');
});

window.mover = (dir) => {
    const track = document.getElementById('index-gallery');
    curSlide = (curSlide + dir + totalFotos) % totalFotos;
    track.style.transform = `translateX(-${curSlide * 100}%)`;
};

db.collection("productos").onSnapshot(snap => {
    document.getElementById('product-list').innerHTML = snap.docs.map(doc => {
        const p = doc.data();
        return `<div class="product-item">
            <img src="${p.img}">
            <div style="margin-left:10px; flex:1;">
                <h4 style="margin:0; font-size:14px;">${p.desc}</h4>
                <p style="margin:2px 0; color:green; font-weight:bold;">${p.price}</p>
                <button onclick="window.agregarAlCarrito('${p.desc}', '${p.price}')" style="background:#f0c14b; border:none; padding:5px 10px; border-radius:5px; font-size:11px; cursor:pointer;">+ Carrito</button>
            </div>
        </div>`;
    }).join('');
});