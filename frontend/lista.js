
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

exibirMembros();
