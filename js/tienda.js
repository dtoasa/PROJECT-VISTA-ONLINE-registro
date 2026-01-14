db.collection("productos").onSnapshot(snap => {
    const grid = document.getElementById('product-list');
    if (!grid) return;
    
    grid.innerHTML = snap.docs.map(doc => {
        const p = doc.data();
        return `
        <div class="p-card">
            <img src="${p.img}">
            <h4>${p.desc}</h4>
            <p style="color: #B12704; font-weight: bold;">$${p.price}</p>
            <button class="btn-celeste" onclick="alert('Inicia sesión para comprar')">Añadir al carrito</button>
        </div>`;
    }).join('');
});