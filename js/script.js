const firebaseConfig = {
    apiKey: "AIzaSyCiaF2kbtS7hTs2E1tK6hDbBX4ASG3Zm8Q",
    authDomain: "tienda-as-3b772.firebaseapp.com",
    projectId: "tienda-as-3b772",
    storageBucket: "tienda-as-3b772.firebasestorage.app",
    messagingSenderId: "214806360310",
    appId: "1:214806360310:web:833918e79d20722f913cd7"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

// --- LÓGICA DE ACCESO GLOBAL ---
window.toggleOjo = function() {
    const input = document.getElementById('pass-input');
    const ojo = document.getElementById('toggle-pass');
    if (input.type === "password") {
        input.type = "text";
        ojo.innerText = "🔒";
    } else {
        input.type = "password";
        ojo.innerText = "👁️";
    }
};

window.validarAcceso = function() {
    const pass = document.getElementById('pass-input').value;
    if (pass === "1234") {
        sessionStorage.setItem("adminOk", "true");
        window.location.reload();
    } else {
        alert("Clave Incorrecta");
    }
};

window.logout = function() {
    sessionStorage.removeItem("adminOk");
    window.location.reload();
};

document.addEventListener('DOMContentLoaded', function() {
    // Escuchar tecla Enter en el login
    const passInput = document.getElementById('pass-input');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.validarAcceso();
        });
    }

    // Menú Hamburguesa
    const menuBtn = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menuBtn) {
        menuBtn.onclick = () => { navList.classList.toggle('active'); };
    }

    // Persistencia Admin
    if (sessionStorage.getItem("adminOk") === "true") {
        if(document.getElementById('login-container')) document.getElementById('login-container').style.display = "none";
        if(document.getElementById('admin-content')) document.getElementById('admin-content').style.display = "block";
    }
    escucharBaseDatos();
});

// --- BASE DE DATOS (CARRUSEL Y PRODUCTOS) ---
function escucharBaseDatos() {
    // 1. Carrusel (Tienda y Vista Previa Admin)
    db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
        const track = document.getElementById('index-gallery');
        const admDest = document.getElementById('admin-destacados');
        
        let htmlTienda = "";
        let htmlAdmin = "";

        snap.forEach(doc => {
            const data = doc.data();
            htmlTienda += `<img src="${data.url}" class="slide">`;
            htmlAdmin += `
                <div style="position:relative; display:inline-block; margin:5px;">
                    <img src="${data.url}" style="width:80px; height:60px; object-fit:cover; border-radius:5px;">
                    <button onclick="borrarD('${doc.id}')" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; cursor:pointer; width:20px; height:20px;">×</button>
                </div>`;
        });

        if (track) { track.innerHTML = htmlTienda; iniciarAutoCarrusel(); }
        if (admDest) { admDest.innerHTML = htmlAdmin; }
    });

    // 2. Productos (Tienda y Vista Previa Admin)
    db.collection("productos").orderBy("fecha", "desc").onSnapshot(snap => {
        const list = document.getElementById('product-list');
        const admProd = document.getElementById('admin-catalogo');
        
        let htmlTienda = "";
        let htmlAdmin = "";

        snap.forEach(doc => {
            const i = doc.data();
            htmlTienda += `
                <div class="product-item">
                    <img src="${i.img}">
                    <div class="product-info">
                        <h3>${i.desc}</h3>
                        <p>$${i.price}</p>
                        ${i.stock === 'Agotado' ? '<span style="color:red; font-weight:bold;">Agotado</span>' : ''}
                    </div>
                </div>`;
            
            htmlAdmin += `
                <div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid #eee; padding:10px;">
                    <img src="${i.img}" style="width:50px; height:50px; object-fit:contain;">
                    <div style="flex:1"><b>${i.desc}</b><br>$${i.price}</div>
                    <button onclick="cambiarStock('${doc.id}','${i.stock}')" style="padding:5px; font-size:12px;">${i.stock || 'En Stock'}</button>
                    <button onclick="borrarC('${doc.id}')" style="color:red; border:none; background:none; cursor:pointer; font-size:18px;">🗑️</button>
                </div>`;
        });

        if (list) list.innerHTML = htmlTienda;
        if (admProd) admProd.innerHTML = htmlAdmin;
    });
}

// --- CARRUSEL ---
let indiceActual = 0;
let carruselInterval;
function iniciarAutoCarrusel() {
    clearInterval(carruselInterval);
    carruselInterval = setInterval(() => moverCarrusel(1), 5000);
}
window.moverCarrusel = function(dir) {
    const track = document.getElementById('index-gallery');
    const slides = document.querySelectorAll('.slide');
    if(track && slides.length > 0) {
        indiceActual = (indiceActual + dir + slides.length) % slides.length;
        track.style.transform = `translateX(-${indiceActual * 100}%)`;
    }
};

// --- ACCIONES ADMIN ---
window.subirDestacadoLink = async () => {
    const u = document.getElementById('url-dest').value;
    if(u) await db.collection("carrusel").add({url:u, fecha:Date.now()});
    document.getElementById('url-dest').value = "";
};
window.guardarCatalogoLink = async () => {
    const i = document.getElementById('url-cat').value, d = document.getElementById('prod-desc').value, p = document.getElementById('prod-price').value;
    if(i && d && p) await db.collection("productos").add({img:i, desc:d, price:p, stock:"En Stock", fecha:Date.now()});
    document.getElementById('url-cat').value = ""; document.getElementById('prod-desc').value = ""; document.getElementById('prod-price').value = "";
};
window.borrarD = async id => { if(confirm("¿Borrar Banner?")) await db.collection("carrusel").doc(id).delete(); };
window.borrarC = async id => { if(confirm("¿Borrar Producto?")) await db.collection("productos").doc(id).delete(); };
window.cambiarStock = async (id, s) => { await db.collection("productos").doc(id).update({ stock: s === "Agotado" ? "En Stock" : "Agotado" }); };