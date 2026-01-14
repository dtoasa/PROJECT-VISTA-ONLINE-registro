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

// --- SEGURIDAD: CLAVE 1980 Y SESIÓN ---

// Al cargar la página, verificar si ya se logueó antes
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogged') === 'true') {
        mostrarPanel();
    }
});

window.toggleEye = () => {
    const input = document.getElementById('admin-pass');
    input.type = input.type === "password" ? "text" : "password";
};

window.validarAcceso = () => {
    const clave = document.getElementById('admin-pass').value;
    if (clave === "1980") {
        sessionStorage.setItem('adminLogged', 'true'); // Guardar sesión
        mostrarPanel();
    } else {
        alert("Clave incorrecta");
    }
};

function mostrarPanel() {
    document.getElementById('admin-lock').style.display = 'none';
    document.getElementById('panel-content').style.display = 'block';
    cargarDatosAdmin(); // Iniciar carga de Firebase
}

// --- FUNCIONES DE FIREBASE (Cargan solo después del login) ---

function cargarDatosAdmin() {
    // Escuchar Carrusel
    db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
        const container = document.getElementById('admin-carousel-list');
        if(container) container.innerHTML = snap.docs.map(doc => `
            <div class="admin-card">
                <div class="thumb-wrap"><img src="${doc.data().url}"></div>
                <button class="btn-delete" onclick="borrarC('${doc.id}')">Eliminar</button>
            </div>`).join('');
    });

    // Escuchar Productos
    db.collection("productos").orderBy("fecha", "desc").onSnapshot(snap => {
        const container = document.getElementById('admin-product-list');
        if(container) container.innerHTML = snap.docs.map(doc => {
            const p = doc.data();
            const colorBtn = p.stock === 'En Stock' ? '#2ecc71' : '#e74c3c';
            return `
            <div class="admin-card">
                <div class="thumb-wrap">
                    <button class="stock-toggle-btn" style="background:${colorBtn}" onclick="toggleStock('${doc.id}', '${p.stock}')">${p.stock}</button>
                    <img src="${p.img || p.url}">
                </div>
                <p style="font-size:11px; font-weight:bold; height:28px; overflow:hidden;">${p.desc}</p>
                <button class="btn-delete" onclick="borrarP('${doc.id}')">Eliminar</button>
            </div>`;
        }).join('');
    });
}

// --- MÉTODOS DE SUBIDA Y EDICIÓN ---

window.subirCarrusel = async () => {
    const url = document.getElementById('c-img').value;
    if(url) await db.collection("carrusel").add({ url, fecha: new Date() });
    document.getElementById('c-img').value = "";
};

window.subirProducto = async () => {
    const desc = document.getElementById('p-desc').value;
    const price = document.getElementById('p-price').value;
    const img = document.getElementById('p-img').value;
    if(desc && price && img) {
        await db.collection("productos").add({ desc, price, img, stock: "En Stock", fecha: new Date() });
        document.getElementById('p-desc').value = ""; document.getElementById('p-price').value = ""; document.getElementById('p-img').value = "";
    }
};

window.toggleStock = async (id, estado) => {
    const nuevo = estado === "En Stock" ? "Agotado" : "En Stock";
    await db.collection("productos").doc(id).update({ stock: nuevo });
};

window.borrarC = (id) => { if(confirm("¿Eliminar?")) db.collection("carrusel").doc(id).delete(); };
window.borrarP = (id) => { if(confirm("¿Eliminar?")) db.collection("productos").doc(id).delete(); };