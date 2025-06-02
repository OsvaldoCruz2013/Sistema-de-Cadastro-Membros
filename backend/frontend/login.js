const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <-- Sua URL do backend no Render
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  // Aqui é apenas um exemplo. Em produção, nunca exponha senhas assim.
  if (usuario === "admin" && senha === "654321") {
    localStorage.setItem("logado", "true");
    window.location.href = "cadastro.html";
  } else {
    document.getElementById('erroLogin').textContent = "Usuário ou senha inválidos.";
  }
});
