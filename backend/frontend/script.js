const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <-- Sua URL do backend no Render

document.getElementById('formMembro').addEventListener('submit', function(e) {
    e.preventDefault(); // Previne o comportamento padrão de submit do formulário

    const membro = {
        nome: document.getElementById('nome').value,
        genero: document.querySelector('input[name="genero"]:checked')?.value || '',
        cpf: document.getElementById('cpf').value, // O valor já virá mascarado do input
        rg: document.getElementById('rg').value,   // O valor já virá mascarado do input
        endereco: document.getElementById('endereco').value,
        numero: document.getElementById('numero').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value,
        cep: document.getElementById('cep').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        data_nascimento: document.getElementById('data_nascimento').value,
        data_cadastro: document.getElementById('data_cadastro').value,
        estadocivil: document.getElementById('estadocivil').value,
        congregacao: document.getElementById('congregacao').value,
        cargo: document.getElementById('cargo').value,
        status: document.getElementById('status').value,
        observacao: document.getElementById('observacao').value
    };

    // Altere a chamada fetch para usar a API_BASE_URL
    fetch(`${API_BASE_URL}/api/membros`, { // <-- CORREÇÃO AQUI
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(membro)
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        this.reset();
    })
    .catch(err => alert('Erro ao salvar: ' + err));
});

// --- Lógica de Máscara para CPF e RG ---
document.addEventListener('DOMContentLoaded', (event) => {
    const cpfInput = document.getElementById('cpf');
    const rgInput = document.getElementById('rg');

    // Máscara para CPF
    if (cpfInput) {
        cpfInput.addEventListener('input', function (e) {
            let value = e.target.value;
            value = value.replace(/\D/g, ''); // Remove tudo que não é dígito

            // Limita a 11 dígitos para a lógica de formatação
            if (value.length > 11) {
                value = value.slice(0, 11);
            }

            // Aplica a máscara CPF: XXX.XXX.XXX-XX
            if (value.length > 9) {
                value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
            } else if (value.length > 3) {
                value = value.replace(/^(\d{3})(\d{3})$/, '$1.$2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d{3})$/, '$1');
            }
            
            e.target.value = value;
        });
    }

    // Máscara para RG
    if (rgInput) {
        rgInput.addEventListener('input', function (e) {
            let value = e.target.value;
            value = value.replace(/\D/g, ''); // Remove tudo que não é dígito

            // Limita a 9 dígitos para a lógica de formatação (RG geralmente tem 9 dígitos + 1 dígito verificador, total 10, mas a máscara é 8+1)
            // A máscara XX.XXX.XXX-X tem 10 caracteres. Se o RG tem 9 dígitos, a máscara é 2.3.3.1.
            // Se você quer 00.000.000-00, são 10 dígitos + 2 pontos + 1 hífen = 13 caracteres.
            // Vamos usar 10 dígitos para o RG, que é o padrão mais comum para RG + dígito verificador.
            if (value.length > 10) { // Limita a 10 dígitos para a lógica de formatação
                value = value.slice(0, 10);
            }

            // Aplica a máscara RG: XX.XXX.XXX-X (ou XX.XXX.XXX-XX se o último for 2 dígitos)
            // A máscara 00.000.000-00 que você pediu sugere 10 dígitos numéricos.
            if (value.length > 8) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
            } else if (value.length > 5) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{3})$/, '$1.$2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d{2})$/, '$1');
            }
            
            e.target.value = value;
        });
    }
});
