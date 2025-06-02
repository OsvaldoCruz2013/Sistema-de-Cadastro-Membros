const API_BASE_URL = 'https://sistema-cadastro-backend-api.onrender.com'; // <--- ADICIONE ESTA LINHA COM SUA URL DO BACKEND

function exibirMembros(){
  fetch(`${API_BASE_URL}/api/membros`) // <--- ALTERADO AQUI
  .then(t=>t.json())
  .then(t=>{
    const e=document.querySelector("#tabelaMembros tbody");
    e.innerHTML="",
    t.forEach((t,o)=>{
      const r=document.createElement("tr");
      r.innerHTML=`
                <td>${t.nome}</td><td>${t.genero}</td><td>${t.cpf}</td><td>${t.rg}</td><td>${t.endereco}</td>
                <td>${t.numero}</td><td>${t.bairro}</td><td>${t.cidade}</td><td>${t.estado}</td><td>${t.cep}</td>
                <td>${t.telefone}</td><td>${t.email}</td><td>${t.data_nascimento}</td><td>${t.data_cadastro}</td>
                <td>${t.estadocivil}</td><td>${t.congregacao}</td><td>${t.cargo}</td><td>${t.status}</td>
                <td>${t.observacao}</td>
                <td class="acoes">
                  <button class="btn-editar" onclick="editarLinha(this)">Editar</button>
                  <button class="btn-salvar" onclick="salvarLinha(this)" disabled>Salvar</button>
                  <button class="btn-excluir" onclick="excluirLinha(${t.id})">Excluir</button>
                </td>
              `,
      e.appendChild(r)
    })
  })
  .catch(t=>console.error("Erro ao carregar membros:",t))
}

function editarLinha(t){
  const e=t.closest("tr");
  e.querySelectorAll("td:not(.acoes)").forEach(t=>{const e=t.textContent;t.innerHTML=`<input type="text" value="${e}">`}),
  e.querySelector(".btn-editar").disabled=!0,
  e.querySelector(".btn-salvar").disabled=!1
}

function salvarLinha(t){
  const e=t.closest("tr"),
  o=e.querySelectorAll("td:not(.acoes) input"),
  r=Array.from(o).map(t=>t.value),
  a={nome:r[0],genero:r[1],cpf:r[2],rg:r[3],endereco:r[4],numero:r[5],bairro:r[6],cidade:r[7],estado:r[8],cep:r[9],telefone:r[10],email:r[11],data_nascimento:r[12],data_cadastro:r[13],estadocivil:r[14],congregacao:r[15],cargo:r[16],status:r[17],observacao:r[18]},
  n=e.querySelector(".btn-excluir").getAttribute("onclick").match(/\d+/)[0];
  fetch(`${API_BASE_URL}/api/membros/${n}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)}) // <--- ALTERADO AQUI
  .then(t=>{t.ok?exibirMembros():console.error("Erro ao salvar membro")})
}

function excluirLinha(t){
  confirm("Tem certeza que deseja excluir este membro?")&&
  fetch(`${API_BASE_URL}/api/membros/${t}`,{method:"DELETE"}) // <--- ALTERADO AQUI
  .then(t=>{t.ok?exibirMembros():console.error("Erro ao excluir membro")})
}

exibirMembros();