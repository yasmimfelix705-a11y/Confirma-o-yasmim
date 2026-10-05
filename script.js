/* ========================================================= FIREBASE ========================================================= */

const firebaseConfig = { apiKey: "AIzaSyAYBh_xHUGeUGMjpHEOxBU-Nppc5ymum6g", authDomain: "yasmim-dc181.firebaseapp.com", projectId: "yasmim-dc181", storageBucket: "yasmim-dc181.firebasestorage.app", messagingSenderId: "773790336369", appId: "1:773790336369:web:9292e70565a551b4bf22d0", measurementId: "G-MRCSX5RNGN" };

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth(); const db = firebase.firestore();

/* ========================================================= AUTENTICAÇÃO ANÔNIMA ========================================================= */

auth.signInAnonymously() .catch((erro) => { console.error("Erro na autenticação:", erro); });

/* ========================================================= ABRIR CONVITE ========================================================= */

function abrirConvite(event) {

if (event) { event.stopPropagation(); } const envelope = document.getElementById("tela-envelope"); const convite = document.getElementById("tela-convite"); if (!envelope || !convite) { return; } envelope.classList.add("oculto"); setTimeout(() => { envelope.style.display = "none"; convite.classList.add("visivel"); window.scrollTo({ top: 0, behavior: "smooth" }); }, 700); 

}

/* ========================================================= CONTAGEM REGRESSIVA ========================================================= */

function atualizarContador() {

/* O ano não aparece no convite. A contagem usa o próximo dia 05 de dezembro. */ const agora = new Date(); let ano = agora.getFullYear(); let dataFesta = new Date( ano, 11, 5, 20, 0, 0 ); if (dataFesta.getTime() <= agora.getTime()) { dataFesta = new Date( ano + 1, 11, 5, 20, 0, 0 ); } const diferenca = dataFesta.getTime() - agora.getTime(); const dias = Math.floor( diferenca / (1000 * 60 * 60 * 24) ); const horas = Math.floor( (diferenca / (1000 * 60 * 60)) % 24 ); const minutos = Math.floor( (diferenca / (1000 * 60)) % 60 ); const segundos = Math.floor( (diferenca / 1000) % 60 ); const elementoDias = document.getElementById("dias"); const elementoHoras = document.getElementById("horas"); const elementoMinutos = document.getElementById("minutos"); const elementoSegundos = document.getElementById("segundos"); if (elementoDias) { elementoDias.textContent = String(dias).padStart(2, "0"); } if (elementoHoras) { elementoHoras.textContent = String(horas).padStart(2, "0"); } if (elementoMinutos) { elementoMinutos.textContent = String(minutos).padStart(2, "0"); } if (elementoSegundos) { elementoSegundos.textContent = String(segundos).padStart(2, "0"); } 

}

atualizarContador();

setInterval( atualizarContador, 1000 );

/* ========================================================= NORMALIZAR TEXTO ========================================================= */

function normalizar(texto) {

return texto .normalize("NFD") .replace(/[\u0300-\u036f]/g, "") .toLowerCase() .trim(); 

}

/* ========================================================= BUSCAR CONVITE ========================================================= */

async function buscarConvite() {

const campo = document.getElementById("busca"); const resultado = document.getElementById("resultado"); if (!campo || !resultado) { return; } const busca = normalizar(campo.value); resultado.innerHTML = ""; if (!busca) { resultado.innerHTML = ` <p class="mensagem erro"> Digite o nome da família ou de uma pessoa. </p> `; return; } const encontrados = convidados.filter((convite) => { const nomeFamilia = normalizar(convite.familia); const nomes = convite.pessoas.map(normalizar); return ( nomeFamilia.includes(busca) || nomes.some(nome => nome.includes(busca)) ); }); if (encontrados.length === 0) { resultado.innerHTML = ` <p class="mensagem erro"> Convite não encontrado. Verifique o nome digitado. </p> `; return; } for (const convite of encontrados) { await mostrarConvite( convite, resultado ); } 

}

/* ========================================================= MOSTRAR CONVITE ENCONTRADO ========================================================= */

async function mostrarConvite( convite, resultado ) {

let confirmado = false; let pessoasConfirmadas = []; try { const documento = await db .collection("confirmacoes") .doc(convite.id) .get(); if (documento.exists) { confirmado = true; const dados = documento.data(); pessoasConfirmadas = Array.isArray(dados.pessoas) ? dados.pessoas : []; } } catch (erro) { console.error( "Erro ao verificar confirmação:", erro ); } const bloco = document.createElement("div"); bloco.className = "convite-encontrado"; if (confirmado) { bloco.innerHTML = ` <h3> ${convite.familia} </h3> <p class="mensagem sucesso"> Este convite já foi confirmado. </p> <div class="lista-pessoas"> ${convite.pessoas.map((pessoa) => { const estaConfirmada = pessoasConfirmadas.includes(pessoa); return ` <div class="pessoa-check"> <span class="quadradinho" style=" background: ${estaConfirmada ? "#789fc3" : "transparent"}; "> ${estaConfirmada ? "✓" : ""} </span> <span class="nome-pessoa"> ${pessoa} </span> </div> `; }).join("")} </div> `; resultado.appendChild(bloco); return; } bloco.innerHTML = ` <h3> ${convite.familia} </h3> <p class="mensagem"> Selecione quem irá à festa: </p> <div class="lista-pessoas"> ${convite.pessoas.map((pessoa, indice) => { return ` <label class="pessoa-check"> <input type="checkbox" name="pessoa" value="${indice}" > <span class="quadradinho"></span> <span class="nome-pessoa"> ${pessoa} </span> </label> `; }).join("")} </div> <button type="button" class="botao-confirmar" onclick="confirmarPresenca('${convite.id}')" > Confirmar presença </button> <div class="mensagem" id="mensagem-${convite.id}" ></div> `; resultado.appendChild(bloco); 

}

/* ========================================================= CONFIRMAR PRESENÇA ========================================================= */

async function confirmarPresenca(conviteId) {

const convite = convidados.find( item => item.id === conviteId ); if (!convite) { return; } const mensagem = document.getElementById( `mensagem-${conviteId}` ); const bloco = mensagem ? mensagem.parentElement : null; if (!bloco) { return; } const checkboxes = bloco.querySelectorAll( 'input[name="pessoa"]:checked' ); if (checkboxes.length === 0) { mensagem.className = "mensagem erro"; mensagem.textContent = "Selecione pelo menos uma pessoa."; return; } const pessoasSelecionadas = Array.from(checkboxes).map((checkbox) => { const indice = Number(checkbox.value); return convite.pessoas[indice]; }); try { mensagem.className = "mensagem"; mensagem.textContent = "Confirmando presença..."; const usuario = auth.currentUser; if (!usuario) { await auth.signInAnonymously(); } const usuarioAtual = auth.currentUser; await db .collection("confirmacoes") .doc(conviteId) .create({ conviteId: conviteId, familia: convite.familia, pessoas: pessoasSelecionadas, uid: usuarioAtual ? usuarioAtual.uid : null, confirmadoEm: firebase.firestore.FieldValue .serverTimestamp() }); mensagem.className = "mensagem sucesso"; mensagem.textContent = "Presença confirmada com sucesso! 💙"; const botoes = bloco.querySelectorAll( "button" ); botoes.forEach((botao) => { botao.disabled = true; botao.style.opacity = "0.6"; botao.style.cursor = "default"; }); const entradas = bloco.querySelectorAll( 'input[type="checkbox"]' ); entradas.forEach((entrada) => { entrada.disabled = true; }); } catch (erro) { console.error( "Erro ao confirmar:", erro ); if ( erro.code === "already-exists" ) { mensagem.className = "mensagem erro"; mensagem.textContent = "Este convite já foi confirmado."; return; } if ( erro.code === "permission-denied" ) { mensagem.className = "mensagem erro"; mensagem.textContent = "Este convite já foi confirmado."; return; } mensagem.className = "mensagem erro"; mensagem.textContent = "Não foi possível confirmar agora. Tente novamente."; } 

}

/* ========================================================= ENTER NO CAMPO DE BUSCA ========================================================= */

document.addEventListener( "DOMContentLoaded", () => {

const campo = document.getElementById("busca"); if (!campo) { return; } campo.addEventListener( "keydown", (evento) => { if ( evento.key === "Enter" ) { evento.preventDefault(); buscarConvite(); } } ); } 

);

