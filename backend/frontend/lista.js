/*
function exibirMembros() {
  fetch('/api/membros')
    .then(res => res.json())
    .then(membros => {
      const tbody = document.querySelector('#tabelaMembros tbody');
      tbody.innerHTML = '';
      membros.forEach((m, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.nome}</td><td>${m.genero}</td><td>${m.cpf}</td><td>${m.rg}</td><td>${m.endereco}</td>
          <td>${m.numero}</td><td>${m.bairro}</td><td>${m.cidade}</td><td>${m.estado}</td><td>${m.cep}</td>
          <td>${m.telefone}</td><td>${m.email}</td><td>${m.data_nascimento}</td><td>${m.data_cadastro}</td>
          <td>${m.estadocivil}</td><td>${m.congregacao}</td><td>${m.cargo}</td><td>${m.status}</td>
          <td>${m.observacao}</td>
          <td class="acoes">
            <button class="btn-editar" onclick="editarLinha(this)">Editar</button>
            <button class="btn-salvar" onclick="salvarLinha(this)" disabled>Salvar</button>
            <button class="btn-excluir" onclick="excluirLinha(${m.id})">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error('Erro ao carregar membros:', err));
}

// As funções editarLinha, salvarLinha, excluirLinha podem ser ajustadas para trabalhar com API também

exibirMembros();*/

// Adicione esta linha no TOPO do seu arquivo lista.js
const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <-- Sua URL do backend no Render

function exibirMembros(){
  fetch(`${API_BASE_URL}/api/membros`) // <--- CORRIGIDO AQUI
  .then(res => res.json())
  .then(membros => { // Renomeado para 'membros' para clareza
    const tbody = document.querySelector('#tabelaMembros tbody');
    tbody.innerHTML = ''; // Limpa a tabela antes de preencher
    membros.forEach((m, i) => { // Renomeado para 'm' para clareza
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.nome}</td><td>${m.genero}</td><td>${m.cpf}</td><td>${m.rg}</td><td>${m.endereco}</td>
        <td>${m.numero}</td><td>${m.bairro}</td><td>${m.cidade}</td><td>${m.estado}</td><td>${m.cep}</td>
        <td>${m.telefone}</td><td>${m.email}</td><td>${m.data_nascimento}</td><td>${m.data_cadastro}</td>
        <td>${m.estadocivil}</td><td>${m.congregacao}</td><td>${m.cargo}</td><td>${m.status}</td>
        <td>${m.observacao}</td>
        <td class="acoes">
          <button class="btn-editar" onclick="editarLinha(this)">Editar</button>
          <button class="btn-salvar" onclick="salvarLinha(this)" disabled>Salvar</button>
          <button class="btn-excluir" onclick="excluirLinha(${m.id_fato})">Excluir</button>
        </td>
      `;
      // ATENÇÃO: Para o botão excluir, use m.id_fato, pois é o ID da tabela fato_membros
      // Se o backend espera 'id' e seu select retorna 'id_fato', precisa ajustar ou no backend ou aqui.
      // Assumi que você quer passar o id_fato para excluir.

      tbody.appendChild(tr);
    });
  })
  .catch(err => console.error('Erro ao carregar membros:', err)); // Log do erro para depuração
}

function editarLinha(button){ // Renomeado 't' para 'button'
  const row = button.closest('tr'); // Renomeado 'e' para 'row'
  // Transforma texto em inputs para edição
  row.querySelectorAll('td:not(.acoes)').forEach(cell => {
    const textContent = cell.textContent;
    cell.innerHTML = `<input type="text" value="${textContent}">`;
  });
  // Desativa Editar e Ativa Salvar
  row.querySelector('.btn-editar').disabled = true;
  row.querySelector('.btn-salvar').disabled = false;
}

function salvarLinha(button){ // Renomeado 't' para 'button'
  const row = button.closest('tr'); // Renomeado 'e' para 'row'
  const inputFields = row.querySelectorAll('td:not(.acoes) input'); // Renomeado 'o' para 'inputFields'
  const values = Array.from(inputFields).map(input => input.value); // Renomeado 'r' para 'values'

  const idMembro = row.querySelector('.btn-excluir').getAttribute('onclick').match(/\d+/)[0]; // Obtém o ID do membro
  
  const updatedMember = { // Renomeado 'a' para 'updatedMember'
    // Mapeie os valores do input para as propriedades do objeto membro, na ordem correta
    nome: values[0],
    genero: values[1],
    cpf: values[2],
    rg: values[3],
    endereco: values[4],
    numero: values[5],
    bairro: values[6],
    cidade: values[7],
    estado: values[8],
    cep: values[9],
    telefone: values[10],
    email: values[11],
    data_nascimento: values[12],
    data_cadastro: values[13],
    estadocivil: values[14],
    congregacao: values[15],
    cargo: values[16],
    status: values[17],
    observacao: values[18]
  };

  fetch(`${API_BASE_URL}/api/membros/${idMembro}`, { // <--- CORRIGIDO AQUI
      method: 'PUT', // Assumindo que você tem uma rota PUT para atualizar membros
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMember)
  })
  .then(response => { // Renomeado 't' para 'response'
    if (response.ok) {
      exibirMembros(); // Recarrega a lista se salvar com sucesso
    } else {
      console.error('Erro ao salvar membro');
      alert('Erro ao salvar membro. Verifique os logs do console.');
    }
  })
  .catch(error => { // Renomeado 't' para 'error'
    console.error('Erro ao salvar membro:', error);
    alert('Erro ao salvar membro: ' + error.message);
  });
}

function excluirLinha(idMembro){ // Renomeado 't' para 'idMembro'
  confirm('Tem certeza que deseja excluir este membro?') && 
  fetch(`${API_BASE_URL}/api/membros/${idMembro}`, { // <--- CORRIGIDO AQUI
      method: 'DELETE'
  })
  .then(response => { // Renomeado 't' para 'response'
    if (response.ok) {
      exibirMembros(); // Recarrega a lista se excluir com sucesso
    } else {
      console.error('Erro ao excluir membro');
      alert('Erro ao excluir membro. Verifique os logs do console.');
    }
  })
  .catch(error => { // Renomeado 't' para 'error'
    console.error('Erro ao excluir membro:', error);
    alert('Erro ao excluir membro: ' + error.message);
  });
}

exibirMembros(); // Chama a função para exibir a lista ao carregar a página
