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

// --- ACCESO ---
window.toggleOjo = function() {
    const input = document.getElementById('pass-input');
    const ojo = document.getElementById('toggle-pass');
    if (input.type === "password") {
        input.type = "text"; ojo.innerText = "🔒";
    } else {
        input.type = "password"; ojo.innerText = "👁️";
    }
};

window.validarAcceso = function() {
    const pass = document.getElementById('pass-input').value;
    if (pass === "1234") {
        sessionStorage.setItem("adminOk", "true");
        window.location.reload();
    } else { alert("Clave Incorrecta"); }
};

window.logout = function() {
    sessionStorage.removeItem("adminOk");
    window.location.reload();
};

document.addEventListener('DOMContentLoaded', function() {
    const passInput = document.getElementById('pass-input');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.validarAcceso(); });
    }

    if (sessionStorage.getItem("adminOk") === "true") {
        if(document.getElementById('login-container')) document.getElementById('login-container').style.display = "none";
        if(document.getElementById('admin-content')) document.getElementById('admin-content').style.display = "block";
    }
    escucharBaseDatos();
});

function escucharBaseDatos() {
    // Carrusel
    db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
        const track = document.getElementById('index-gallery');
        const admDest = document.getElementById('admin-destacados');
        let hT = "", hA = "";
        snap.forEach(doc => {
            hT += `<img src="${doc.data().url}" class="slide">`;
            hA += `<div style="display:inline-block; position:relative; margin:5px;">
                <img src="${doc.data().url}" class="admin-preview-img">
                <button onclick="borrarD('${doc.id}')" style="position:absolute; top:0; right:0; background:red; color:white; border-radius:50%; border:none; cursor:pointer;">×</button>
            </div>`;
        });
        if (track) { track.innerHTML = hT; iniciarAutoCarrusel(); }
        if (admDest) admDest.innerHTML = hA;
    });

    // Productos
    db.collection("productos").orderBy("fecha", "desc").onSnapshot(snap => {
        const list = document.getElementById('product-list');
        const admProd = document.getElementById('admin-catalogo');
        let hT = "", hA = "";
        snap.forEach(doc => {
            const i = doc.data();
            hT += `<div class="product-item"><img src="${i.img}"><div class="product-info"><h3>${i.desc}</h3><p>$${i.price}</p>${i.stock === 'Agotado' ? '<b style="color:red">Agotado</b>' : ''}</div></div>`;
            hA += `<div class="admin-card"><img src="${i.img}" class="admin-preview-img"><span>${i.desc}</span><button onclick="cambiarStock('${doc.id}','${i.stock}')">${i.stock || 'Stock'}</button><button onclick="borrarC('${doc.id}')" style="color:red;">🗑️</button></div>`;
        });
        if (list) list.innerHTML = hT;
        if (admProd) admProd.innerHTML = hA;
    });
}

let indiceActual = 0;
let carruselInterval;
function iniciarAutoCarrusel() { clearInterval(carruselInterval); carruselInterval = setInterval(() => moverCarrusel(1), 5000); }
window.moverCarrusel = function(dir) {
    const track = document.getElementById('index-gallery');
    const slides = document.querySelectorAll('.slide');
    if(track && slides.length > 0) {
        indiceActual = (indiceActual + dir + slides.length) % slides.length;
        track.style.transform = `translateX(-${indiceActual * 100}%)`;
    }
};

window.subirDestacadoLink = async () => { const u = document.getElementById('url-dest').value; if(u) await db.collection("carrusel").add({url:u, fecha:Date.now()}); document.getElementById('url-dest').value = ""; };
window.guardarCatalogoLink = async () => {
    const i = document.getElementById('url-cat').value, d = document.getElementById('prod-desc').value, p = document.getElementById('prod-price').value;
    if(i && d && p) await db.collection("productos").add({img:i, desc:d, price:p, stock:"En Stock", fecha:Date.now()});
    document.getElementById('url-cat').value = ""; document.getElementById('prod-desc').value = ""; document.getElementById('prod-price').value = "";
};
window.borrarD = async id => { if(confirm("¿Borrar?")) await db.collection("carrusel").doc(id).delete(); };
window.borrarC = async id => { if(confirm("¿Borrar?")) await db.collection("productos").doc(id).delete(); };
window.cambiarStock = async (id, s) => { await db.collection("productos").doc(id).update({ stock: s === "Agotado" ? "En Stock" : "Agotado" }); };