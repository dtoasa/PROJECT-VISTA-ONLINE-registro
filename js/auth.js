const auth = firebase.auth();
auth.onAuthStateChanged(user => {
    const form = document.getElementById('auth-form');
    const info = document.getElementById('user-info');
    if (user) {
        form.style.display = 'none'; info.style.display = 'block';
        document.getElementById('user-display').innerText = "Hola: " + user.email;
        window.userLogueado = user;
    } else {
        form.style.display = 'block'; info.style.display = 'none';
        window.userLogueado = null;
    }
});
window.handleAuth = () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('pass').value;
    const mode = document.getElementById('btn-auth-action').innerText;
    if(mode === "Entrar") auth.signInWithEmailAndPassword(e, p);
    else auth.createUserWithEmailAndPassword(e, p).then(() => alert("¡Cuenta creada!"));
}
window.switchAuth = () => {
    const btn = document.getElementById('btn-auth-action');
    btn.innerText = btn.innerText === "Entrar" ? "Registrarse" : "Entrar";
}
window.handleLogout = () => auth.signOut();