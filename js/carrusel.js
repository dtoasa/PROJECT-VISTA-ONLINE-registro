let current = 0;
let slidesCount = 0;
let autoTimer;

// Carga de imágenes desde Firebase
db.collection("carrusel").orderBy("fecha", "desc").onSnapshot(snap => {
    const track = document.getElementById('index-gallery');
    if (!track) return;

    const fotos = snap.docs.map(doc => doc.data().url);
    slidesCount = fotos.length;
    
    track.innerHTML = fotos.map(url => `<div class="slide"><img src="${url}"></div>`).join('');
    
    iniciarIntervalo();
});

// Función de movimiento
window.mover = (dir) => {
    const track = document.getElementById('index-gallery');
    if (!track || slidesCount === 0) return;

    current = (current + dir + slidesCount) % slidesCount;
    track.style.transform = `translateX(-${current * 100}%)`;
    
    // Al mover manual, reiniciamos el tiempo
    iniciarIntervalo();
};

function iniciarIntervalo() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => window.mover(1), 5000);
}