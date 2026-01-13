const firebaseConfig = {
    apiKey: "AIzaSyCiaF2kbtS7hTs2E1tK6hDbBX4ASG3Zm8Q",
    authDomain: "tienda-as-3b772.firebaseapp.com",
    projectId: "tienda-as-3b772",
    storageBucket: "tienda-as-3b772.firebasestorage.app",
    messagingSenderId: "214806360310",
    appId: "1:214806360310:web:833918e79d20722f913cd7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = (typeof firebase.auth === "function") ? firebase.auth() : null;

let totalFotos = 0, curSlide = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Hamburguesa Animada
    const menuBtn = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menuBtn) {
        menuBtn.onclick = () => {
            menuBtn.classList.toggle('is-active');
            navList.classList.toggle('active');
        };
    }

    // SOPORTE PARA ENTER EN ADMIN
    const passInput = document.getElementById('pass-input');
    if (passInput) {
        passInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                validarAcceso();
            }
        });
    }

    // Verificar si ya es admin
    if (window.location.pathname.includes("galeria.html")) {
        if (sessionStorage.getItem("adminAuth") === "true") {
            document.getElementById('login-container').style.display = "none";
            document.getElementById('admin-content').style.display = "block";
            cargarListaUsuarios();
        }
    }

    // Auth Clientes
    if (auth) {
        auth.onAuthStateChanged(user => {
            const authSec = document.getElementById('auth-section');
            const profSec = document.getElementById('profile-section');
            if (user) {
                if(authSec) authSec.style.display = "none";
                if(profSec) profSec.style.display = "block";
                if(document.getElementById('welcome-name')) document.getElementById('welcome-name').innerText = "Hola, " + user.email;
            } else {
                if(authSec) authSec.style.display = "block";
                if(profSec) profSec.style.display = "none";
            }
        });
    }
    escucharBaseDatos();
});

// ACCESO
window.validarAcceso = () => {
    const input = document.getElementById('pass-input');
    if(input.value === "1980") {
        sessionStorage.setItem("adminAuth", "true");
        location.reload();
    } else { 
        alert("Clave incorrecta"); 
        input.value = "";
    }
};

window.logoutAdmin = () => { sessionStorage.removeItem("adminAuth"); location.reload(); };

// DATA
function escucharBaseDatos() {
    db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
        const fotos = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        totalFotos = fotos.length;
        const track = document.getElementById('index-gallery');
        if (track) track.innerHTML = fotos.map(f => `<img src="${f.url}">`).join('');
        const adminD = document.getElementById('admin-destacados');
        if (adminD) adminD.innerHTML = fotos.map(f => `<div class="img-card"><img src="${f.url}"><button class="delete-btn" onclick="borrarD('${f.id}')">×</button></div>`).join('');
    });

    db.collection("productos").orderBy("fecha", "desc").onSnapshot(snap => {
        const list = document.getElementById('product-list');
        if (list) list.innerHTML = snap.docs.map(doc => {
            const p = doc.data();
            return `<div class="product-item">
                <img src="${p.img}">
                <div style="flex-grow:1"><h3>${p.desc}</h3><p class="product-price">${p.price}</p></div>
            </div>`;
        }).join('');
        const adminC = document.getElementById('admin-catalogo');
        if (adminC) adminC.innerHTML = snap.docs.map(doc => {
            const p = doc.data();
            return `<div class="img-card">
                <img src="${p.img}"><button class="status-badge ${p.stock==='En Stock'?'is-stock':'is-out'}" onclick="cambiarStock('${doc.id}','${p.stock}')">${p.stock}</button>
                <button class="delete-btn" onclick="borrarC('${doc.id}')">×</button>
            </div>`;
        }).join('');
    });
}

function cargarListaUsuarios() {
    db.collection("usuarios").orderBy("fechaRegistro", "desc").onSnapshot(snap => {
        const div = document.getElementById('lista-usuarios');
        if (div) div.innerHTML = snap.docs.map(doc => `<p style="border-bottom:1px solid #ddd; padding:5px;">${doc.data().nombre} - ${doc.data().email}</p>`).join('');
    });
}

window.mover = (dir) => {
    const track = document.getElementById('index-gallery');
    if (!track || totalFotos <= 1) return;
    curSlide = (curSlide + dir + totalFotos) % totalFotos;
    track.style.transform = `translateX(-${curSlide * 100}%)`;
};

window.subirDestacadoLink = async () => {
    const url = document.getElementById('url-dest').value;
    if(url) await db.collection("carrusel").add({ url, fecha: Date.now() });
};

window.guardarCatalogoLink = async () => {
    const img = document.getElementById('url-cat').value;
    const desc = document.getElementById('prod-desc').value;
    const price = document.getElementById('prod-price').value;
    const stock = document.querySelector('input[name="stock"]:checked').value;
    if(img && desc) await db.collection("productos").add({ img, desc, price, stock, fecha: Date.now() });
};

window.cambiarStock = async (id, s) => { await db.collection("productos").doc(id).update({ stock: s === "En Stock" ? "Agotado" : "En Stock" }); };
window.borrarD = async (id) => { if(confirm("¿Borrar?")) await db.collection("carrusel").doc(id).delete(); };
window.borrarC = async (id) => { if(confirm("¿Borrar?")) await db.collection("productos").doc(id).delete(); };

window.registrarCliente = async (e) => {
    e.preventDefault();
    const em = document.getElementById('reg-email').value;
    const ps = document.getElementById('reg-pass').value;
    const nm = document.getElementById('reg-nombre').value;
    try {
        const res = await auth.createUserWithEmailAndPassword(em, ps);
        await db.collection("usuarios").doc(res.user.uid).set({ nombre: nm, email: em, fechaRegistro: Date.now() });
        alert("¡Registro exitoso!");
    } catch (err) { alert(err.message); }
};

window.loginCliente = async (e) => {
    e.preventDefault();
    try { await auth.signInWithEmailAndPassword(document.getElementById('login-email').value, document.getElementById('login-pass').value); } 
    catch (err) { alert("Datos incorrectos"); }
};
window.logoutGeneral = () => auth.signOut();