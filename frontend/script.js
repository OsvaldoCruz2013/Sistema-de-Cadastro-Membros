// Adicione esta linha no TOPO do seu arquivo script.js
const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <-- Sua URL do backend no Render

document.getElementById("formMembro").addEventListener("submit", function(e){
    e.preventDefault(); // Previne o comportamento padrão de submit do formulário

    const dadosMembro = { // Variável renomeada para clareza
        nome: document.getElementById("nome").value,
        genero: document.querySelector('input[name="genero"]:checked').value || "",
        cpf: document.getElementById("cpf").value,
        rg: document.getElementById("rg").value,
        endereco: document.getElementById("endereco").value,
        numero: document.getElementById("numero").value,
        bairro: document.getElementById("bairro").value,
        cidade: document.getElementById("cidade").value,
        estado: document.getElementById("estado").value,
        cep: document.getElementById("cep").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        data_nascimento: document.getElementById("data_nascimento").value,
        data_cadastro: document.getElementById("data_cadastro").value,
        estadocivil: document.getElementById("estadocivil").value,
        congregacao: document.getElementById("congregacao").value,
        cargo: document.getElementById("cargo").value,
        status: document.getElementById("status").value,
        observacao: document.getElementById("observacao").value
    };

    // Altere a chamada fetch para usar a API_BASE_URL
    fetch(`${API_BASE_URL}/api/membros`, { // <-- CORREÇÃO AQUI
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosMembro) // Usando a variável 'dadosMembro'
    })
    .then(response => response.text()) // Pega a resposta como texto
    .then(message => { // Renomeado para 'message' para clareza
        alert(message); // Exibe a mensagem de sucesso do backend ("Membro salvo com sucesso")
        this.reset();   // Reseta o formulário
    })
    .catch(error => {
        console.error("Erro ao salvar:", error); // Log detalhado do erro no console
        alert("Erro ao salvar: " + error.message); // Exibe uma mensagem de erro mais útil
    });
});
