// Adicione esta linha no TOPO do seu arquivo login.js
const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <-- Sua URL do backend no Render

document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault(); // Previne o comportamento padrão de submit do formulário

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    try {
        // Altere a chamada fetch para usar a API_BASE_URL
        const response = await fetch(`${API_BASE_URL}/api/login`, { // <-- CORREÇÃO AQUI
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuario: usuario, senha: senha })
        });

        if (response.ok) {
            localStorage.setItem("logado", "true");
            window.location.href = "cadastro.html"; // Redireciona para a página de cadastro
        } else {
            const errorMessage = await response.text(); // Pega a mensagem de erro do backend
            document.getElementById("erroLogin").textContent = errorMessage || "Usuário ou senha inválidos.";
        }
    } catch (error) {
        document.getElementById("erroLogin").textContent = "Erro ao conectar com o servidor.";
        console.error("Erro durante o login:", error); // Log detalhado do erro no console
    }
});
