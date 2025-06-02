const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <-- Sua URL do backend no Render
document.getElementById('formMembro').addEventListener('submit', function(e) {
  e.preventDefault();
  const membro = {
    nome: document.getElementById('nome').value,
    genero: document.querySelector('input[name="genero"]:checked')?.value || '',
    cpf: document.getElementById('cpf').value,
    rg: document.getElementById('rg').value,
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

  fetch('/api/membros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(membro)
  })
  .then(res => res.text())
  .then(msg => {
    alert(msg);
    this.reset();
  })
  .catch(err => alert('Erro ao salvar: ' + err));
});
