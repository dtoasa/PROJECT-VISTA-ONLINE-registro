window.toggleMenu = () => {
    const nav = document.getElementById('nav-links');
    const btn = document.querySelector('.menu-btn');
    
    if (nav && btn) {
        nav.classList.toggle('active');
        btn.classList.toggle('is-active');
    }
}