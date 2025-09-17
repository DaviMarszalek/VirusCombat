// --- CONFIGURAÇÃO INICIAL E ELEMENTOS DA UI ---
const tela = document.getElementById('telaJogo');
const contexto = tela.getContext('2d');
tela.width = 800; tela.height = 600;

// --- CARREGAMENTO DE SPRITES ---
const sprites = {
    jogador: new Image(),
    jogadorEsquerda: new Image(),
    virus1: new Image(),
    virus2: new Image(),
    virus3: new Image(),
    virus4: new Image(),
    vacina: new Image(),
    antibiotico: new Image(),
    alcool: new Image()
};
sprites.jogador.src = '/imagens/jogador.png';
sprites.jogadorEsquerda.src = '/imagens/jogador_esquerda.png';
sprites.virus1.src = '/imagens/virus1.png';
sprites.virus2.src = '/imagens/virus2.png';
sprites.virus3.src = '/imagens/virus3.png';
sprites.virus4.src = '/imagens/virus4.png';
sprites.vacina.src = '/imagens/vacina.png';
sprites.antibiotico.src = '/imagens/antibiotico.png';
sprites.alcool.src = '/imagens/alcool.png';
const elementoTimer = document.getElementById('timer');
const elementoNivel = document.getElementById('nivel');
const elementoContadorInimigos = document.getElementById('contador-inimigos');
const elementoTextoVida = document.getElementById('texto-vida');
const elementoBarraVida = document.getElementById('barra-vida-preenchimento');
const elementoXpBar = document.getElementById('xp-bar-fill');
const telaUpgrade = document.getElementById('telaUpgrade');
const opcoesUpgradeContainer = document.getElementById('opcoesUpgrade');
const telaFimDeJogo = document.getElementById('telaFimDeJogo');
const elementoTempoFinal = document.getElementById('tempoFinal');
const botaoReiniciar = document.getElementById('botaoReiniciar');
const chefeBarraVidaContainer = document.getElementById('chefe-barra-vida-container');
const chefeBarraVidaPreenchimento = document.getElementById('chefe-barra-vida-preenchimento');

// --- ESTADO DO JOGO ---
let jogador, inimigos, projeteis, gemasXP, chefe;
let teclas = {}, tempoDeJogo = 0, cronometroGerarInimigo = 0;
let fimDeJogo = false, jogoPausado = false, intervaloDoLoop;
let nivel = 1, experiencia = 0, xpParaProximoNivel = 10;

// --- POOL DE UPGRADES ---
const listaDeUpgrades = [
    { nome: "Projétil Adicional", descricao: "Atira +1 projétil em um arco.", aplicar: () => jogador.quantidadeProjeteis++ },
    { nome: "Força +", descricao: "Aumenta o dano do projétil em 8.", aplicar: () => jogador.danoProjetil += 8 },
    { nome: "Cadência ++", descricao: "Aumenta a velocidade de tiro em 20%.", aplicar: () => jogador.cadenciaDeTiro *= 0.80 },
    { nome: "Perfuração +", descricao: "Projéteis atravessam +1 inimigo.", aplicar: () => jogador.perfuracaoProjetil++ },
    { nome: "Velocidade +", descricao: "Aumenta a velocidade de movimento do jogador.", aplicar: () => jogador.velocidade += 0.6 },
    { nome: "Projéteis Velozes", descricao: "Aumenta a velocidade dos projéteis.", aplicar: () => jogador.velocidadeProjetil += 1.5 },
    { nome: "Vida Máxima +", descricao: "Aumenta a vida máxima em 25.", aplicar: () => { jogador.vidaMaxima += 25; jogador.vidaAtual += 25; } },
    { nome: "Magneto", descricao: "Aumenta o raio de coleta de XP.", aplicar: () => jogador.raioColetaXP += 50 },
    { nome: "Regeneração Vital", descricao: "Recupera 30% da vida perdida.", aplicar: () => { jogador.vidaAtual = Math.min(jogador.vidaMaxima, jogador.vidaAtual + (jogador.vidaMaxima - jogador.vidaAtual) * 0.30); } },
    { nome: "Vacina", descricao: "Muda projéteis para vacinas.", aplicar: () => jogador.tipoProjetil = 'vacina' },
    { nome: "Antibiótico", descricao: "Muda projéteis para antibióticos.", aplicar: () => jogador.tipoProjetil = 'antibiotico' },
    { nome: "Álcool Gel", descricao: "Muda projéteis para spray de álcool.", aplicar: () => jogador.tipoProjetil = 'alcool' }
];

function configurar_jogo() {
    jogador = {
        x: tela.width / 2, y: tela.height / 2, largura: 60, altura: 60,
        hitboxLargura: 30, hitboxAltura: 30,
        velocidade: 4, vidaMaxima: 100, vidaAtual: 100,
        cadenciaDeTiro: 0.8, cronometroDeTiro: 0,
        danoProjetil: 10, velocidadeProjetil: 8,
        quantidadeProjeteis: 1,
        perfuracaoProjetil: 0,
        raioColetaXP: 100,
        direcao: 'direita',
        tipoProjetil: 'vacina'
    };
    inimigos = []; projeteis = []; gemasXP = []; chefe = null;
    teclas = {}; tempoDeJogo = 0; cronometroGerarInimigo = 0;
    fimDeJogo = false; jogoPausado = false;
    nivel = 1; experiencia = 0; xpParaProximoNivel = 8;

    telaFimDeJogo.style.display = 'none';
    telaUpgrade.style.display = 'none';
    chefeBarraVidaContainer.style.display = 'none';
    
    atualizar_interface_geral();

    if (intervaloDoLoop) clearInterval(intervaloDoLoop);
    intervaloDoLoop = setInterval(loop_do_jogo, 1000 / 60);
}

function atualizar_interface_geral() {
    elementoNivel.innerText = nivel;
    elementoContadorInimigos.innerText = inimigos.length + (chefe ? 1 : 0);
    const porcentagemVida = (jogador.vidaAtual / jogador.vidaMaxima) * 100;
    elementoBarraVida.style.width = `${porcentagemVida}%`;
    elementoTextoVida.innerText = `${Math.floor(jogador.vidaAtual)}/${jogador.vidaMaxima}`;
    
    // Atualizar fundo baseado na vida
    atualizar_fundo_bunker(porcentagemVida);
    
    const porcentagemXP = (experiencia / xpParaProximoNivel) * 100;
    elementoXpBar.style.width = `${porcentagemXP}%`;
    if (chefe) {
        const porcentagemVidaChefe = (chefe.vidaAtual / chefe.vidaMaxima) * 100;
        chefeBarraVidaPreenchimento.style.width = `${porcentagemVidaChefe}%`;
    }
}

function atualizar_fundo_bunker(porcentagemVida) {
    tela.className = '';
    if (porcentagemVida > 66) {
        tela.classList.add('bunker1');
    } else if (porcentagemVida > 33) {
        tela.classList.add('bunker2');
    } else {
        tela.classList.add('bunker3');
    }
}

function adicionar_xp(valor) {
    experiencia += valor;
    if (experiencia >= xpParaProximoNivel) {
        subir_de_nivel();
    }
    atualizar_interface_geral();
}

function subir_de_nivel() {
    experiencia -= xpParaProximoNivel;
    nivel++;
    xpParaProximoNivel = Math.floor(xpParaProximoNivel * 1.5);
    mostrar_tela_upgrade();
}

function mostrar_tela_upgrade() {
    jogoPausado = true;
    opcoesUpgradeContainer.innerHTML = '';
    const upgradesDisponiveis = [...listaDeUpgrades];
    for (let i = 0; i < 3; i++) {
        if (upgradesDisponiveis.length === 0) break;
        const indiceAleatorio = Math.floor(Math.random() * upgradesDisponiveis.length);
        const upgrade = upgradesDisponiveis.splice(indiceAleatorio, 1)[0];
        const botao = document.createElement('button');
        botao.innerHTML = `<strong>${upgrade.nome}</strong><br><small>${upgrade.descricao}</small>`;
        botao.onclick = () => escolher_upgrade(upgrade);
        opcoesUpgradeContainer.appendChild(botao);
    }
    telaUpgrade.style.display = 'flex';
}

function escolher_upgrade(upgrade) {
    upgrade.aplicar();
    telaUpgrade.style.display = 'none';
    jogoPausado = false;
    atualizar_interface_geral();
}

function gerar_inimigo() {
    let x, y;
    if (Math.random() < 0.5) { x = Math.random() < 0.5 ? -50 : tela.width+50; y = Math.random() * tela.height; }
    else { x = Math.random() * tela.width; y = Math.random() < 0.5 ? -50 : tela.height+50; }
    const fatorDeEscala = 1 + (tempoDeJogo / 120);
    let inimigo;
    const chance = Math.random();
    if (chance > 0.75) {
        inimigo = { tipo: 'virus4', x, y, largura: 100, altura: 100, velocidade: 0.8, vidaMaxima: 80 * fatorDeEscala, vidaAtual: 80 * fatorDeEscala, dano: 25, sprite: 'virus4', xp: 20 };
    } else if (chance > 0.5) {
        inimigo = { tipo: 'virus3', x, y, largura: 80, altura: 80, velocidade: 1.0, vidaMaxima: 40 * fatorDeEscala, vidaAtual: 40 * fatorDeEscala, dano: 15, sprite: 'virus3', xp: 10 };
    } else if (chance > 0.25) {
        inimigo = { tipo: 'virus2', x, y, largura: 60, altura: 60, velocidade: 1.5, vidaMaxima: 20 * fatorDeEscala, vidaAtual: 20 * fatorDeEscala, dano: 10, sprite: 'virus2', xp: 5 };
    } else {
        inimigo = { tipo: 'virus1', x, y, largura: 40, altura: 40, velocidade: 2.0, vidaMaxima: 10 * fatorDeEscala, vidaAtual: 10 * fatorDeEscala, dano: 5, sprite: 'virus1', xp: 2 };
    }
    inimigos.push(inimigo);
}

function gerar_chefe() {
    chefe = { x: tela.width / 2, y: -200, largura: 200, altura: 200, velocidade: 2, vidaMaxima: 2000, vidaAtual: 2000, dano: 40, cor: '#8B0000', xp: 500 };
    chefeBarraVidaContainer.style.display = 'block';
}

// ==========================================================
// AQUI ESTÁ A FUNÇÃO CORRIGIDA QUE FAZ O JOGADOR ANDAR
// ==========================================================
function atualizar_jogador() {
    // Lógica de movimento baseada nas teclas pressionadas
    if (teclas['w'] || teclas['arrowup']) jogador.y -= jogador.velocidade;
    if (teclas['s'] || teclas['arrowdown']) jogador.y += jogador.velocidade;
    if (teclas['a'] || teclas['arrowleft']) { jogador.x -= jogador.velocidade; jogador.direcao = 'esquerda'; }
    if (teclas['d'] || teclas['arrowright']) { jogador.x += jogador.velocidade; jogador.direcao = 'direita'; }

    // Impede o jogador de sair da tela
    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x + jogador.largura > tela.width) jogador.x = tela.width - jogador.largura;
    if (jogador.y < 0) jogador.y = 0;
    if (jogador.y + jogador.altura > tela.height) jogador.y = tela.height - jogador.altura;

    // Lógica de tiro automático
    if (jogador.cronometroDeTiro > 0) {
        jogador.cronometroDeTiro -= 1 / 60;
    } else if (inimigos.length > 0 || chefe) {
        disparar_projetil();
        jogador.cronometroDeTiro = jogador.cadenciaDeTiro;
    }
}

function disparar_projetil() {
    let alvoMaisProximo = null, menorDistancia = Infinity;
    const alvos = [...inimigos];
    if (chefe) alvos.push(chefe);
    for (const alvo of alvos) {
        const dx = alvo.x - jogador.x, dy = alvo.y - jogador.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < menorDistancia) { menorDistancia = distancia; alvoMaisProximo = alvo; }
    }
    if (!alvoMaisProximo) return;

    const pontoInicialX = jogador.x + jogador.largura / 2;
    const pontoInicialY = jogador.y + jogador.altura / 2;
    const alvoX = alvoMaisProximo.x + alvoMaisProximo.largura / 2;
    const alvoY = alvoMaisProximo.y + alvoMaisProximo.altura / 2;

    const anguloBase = Math.atan2(alvoY - pontoInicialY, alvoX - pontoInicialX);
    const anguloDispersao = Math.PI / 12;

    const ePar = jogador.quantidadeProjeteis % 2 === 0;
    const metade = Math.floor(jogador.quantidadeProjeteis / 2);

    for (let i = 0; i < jogador.quantidadeProjeteis; i++) {
        let anguloFinal;
        if (ePar) {
            anguloFinal = anguloBase + (i - metade + 0.5) * anguloDispersao;
        } else {
            anguloFinal = anguloBase + (i - metade) * anguloDispersao;
        }

        projeteis.push({
            x: pontoInicialX, y: pontoInicialY, largura: 30, altura: 30, velocidade: jogador.velocidadeProjetil,
            dano: jogador.danoProjetil,
            direcaoX: Math.cos(anguloFinal),
            direcaoY: Math.sin(anguloFinal),
            perfuracao: jogador.perfuracaoProjetil,
            atingidos: new Set(),
            tipo: jogador.tipoProjetil
        });
    }
}

function atualizar_inimigos_e_chefe() {
    const todosOsInimigos = [...inimigos];
    if (chefe) todosOsInimigos.push(chefe);

    for (let i = 0; i < todosOsInimigos.length; i++) {
        const inimigoA = todosOsInimigos[i];
        const dx_p = (jogador.x + jogador.largura/2) - (inimigoA.x + inimigoA.largura/2);
        const dy_p = (jogador.y + jogador.altura/2) - (inimigoA.y + inimigoA.altura/2);
        const dist_p = Math.sqrt(dx_p*dx_p + dy_p*dy_p);
        if(dist_p > 1) { inimigoA.x += (dx_p/dist_p)*inimigoA.velocidade; inimigoA.y += (dy_p/dist_p)*inimigoA.velocidade; }

        for (let j = i + 1; j < todosOsInimigos.length; j++) {
            const inimigoB = todosOsInimigos[j];
            const dx = inimigoA.x - inimigoB.x, dy = inimigoA.y - inimigoB.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const distMin = (inimigoA.largura/2) + (inimigoB.largura/2);
            if(dist < distMin) {
                const sobreposicao = distMin-dist;
                const empurraoX = (dx/dist)*sobreposicao; const empurraoY = (dy/dist)*sobreposicao;
                inimigoA.x += empurraoX * 0.5; inimigoA.y += empurraoY * 0.5;
                inimigoB.x -= empurraoX * 0.5; inimigoB.y -= empurraoY * 0.5;
            }
        }
    }
    for (let i = inimigos.length - 1; i >= 0; i--) {
        const inimigo = inimigos[i];
        const jogadorHitboxX = jogador.x + (jogador.largura - jogador.hitboxLargura) / 2;
        const jogadorHitboxY = jogador.y + (jogador.altura - jogador.hitboxAltura) / 2;
        if (jogadorHitboxX < inimigo.x + inimigo.largura && jogadorHitboxX + jogador.hitboxLargura > inimigo.x && jogadorHitboxY < inimigo.y + inimigo.altura && jogadorHitboxY + jogador.hitboxAltura > inimigo.y) {
            receber_dano(inimigo.dano);
            inimigos.splice(i, 1);
        }
    }
    if (chefe) {
        const jogadorHitboxX = jogador.x + (jogador.largura - jogador.hitboxLargura) / 2;
        const jogadorHitboxY = jogador.y + (jogador.altura - jogador.hitboxAltura) / 2;
        if (jogadorHitboxX < chefe.x + chefe.largura && jogadorHitboxX + jogador.hitboxLargura > chefe.x && jogadorHitboxY < chefe.y + chefe.altura && jogadorHitboxY + jogador.hitboxAltura > chefe.y) {
            receber_dano(chefe.dano);
        }
    }
}

function receber_dano(dano) {
    jogador.vidaAtual -= dano;
    tela.classList.add('shake');
    setTimeout(() => tela.classList.remove('shake'), 100);
}

function atualizar_projeteis() {
    for (let i = projeteis.length - 1; i >= 0; i--) {
        const projetil = projeteis[i];
        projetil.x += projetil.direcaoX * projetil.velocidade;
        projetil.y += projetil.direcaoY * projetil.velocidade;
        
        if (projetil.x < 0 || projetil.x > tela.width || projetil.y < 0 || projetil.y > tela.height) {
            projeteis.splice(i, 1); continue;
        }
        
        const alvos = [...inimigos];
        if(chefe) alvos.push(chefe);

        for (const alvo of alvos) {
            if (projetil.atingidos.has(alvo)) continue;

            if (projetil.x < alvo.x + alvo.largura && projetil.x + projetil.largura > alvo.x &&
                projetil.y < alvo.y + alvo.altura && projetil.y + projetil.altura > alvo.y) {
                
                alvo.vidaAtual -= projetil.dano;
                projetil.atingidos.add(alvo);

                if (projetil.perfuracao > 0) {
                    projetil.perfuracao--;
                } else {
                    projeteis.splice(i, 1);
                }

                if (alvo.vidaAtual <= 0) {
                    gemasXP.push({x: alvo.x, y: alvo.y, valor: alvo.xp});
                    if (alvo === chefe) {
                        chefe = null; chefeBarraVidaContainer.style.display = 'none';
                    } else {
                        inimigos.splice(inimigos.indexOf(alvo), 1);
                    }
                }
                
                if (!projeteis.includes(projetil)) break;
            }
        }
    }
}

function atualizar_gemas_xp() {
    for (let i = gemasXP.length - 1; i >= 0; i--) {
        const gema = gemasXP[i];
        const dx = (jogador.x + jogador.largura/2) - (gema.x + 5), dy = (jogador.y + jogador.altura/2) - (gema.y + 5);
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < jogador.raioColetaXP) {
            gema.x += (dx/dist) * 5; gema.y += (dy/dist) * 5;
        }
        if (dist < 20) {
            adicionar_xp(gema.valor);
            gemasXP.splice(i, 1);
        }
    }
}

function desenhar_elementos() {
    contexto.clearRect(0, 0, tela.width, tela.height);
    
    // Desenhar gemas XP
    contexto.fillStyle = '#00aaff';
    gemasXP.forEach(gema => { contexto.fillRect(gema.x, gema.y, 20, 20); });
    
    // Desenhar jogador com sprite
    const spriteJogador = jogador.direcao === 'esquerda' ? sprites.jogadorEsquerda : sprites.jogador;
    if (spriteJogador.complete) {
        contexto.drawImage(spriteJogador, jogador.x, jogador.y, jogador.largura, jogador.altura);
    } else {
        contexto.fillStyle = '#00ff00';
        contexto.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
    }
    
    // Desenhar inimigos com sprites
    inimigos.forEach(inimigo => {
        const sprite = sprites[inimigo.sprite];
        if (sprite && sprite.complete) {
            contexto.drawImage(sprite, inimigo.x, inimigo.y, inimigo.largura, inimigo.altura);
        } else {
            contexto.fillStyle = '#ff0000';
            contexto.fillRect(inimigo.x, inimigo.y, inimigo.largura, inimigo.altura);
        }
    });
    
    // Desenhar chefe
    if(chefe) { 
        contexto.fillStyle = chefe.cor; 
        contexto.fillRect(chefe.x, chefe.y, chefe.largura, chefe.altura); 
    }
    
    // Desenhar projéteis com sprites
    projeteis.forEach(p => {
        const sprite = sprites[p.tipo];
        if (sprite && sprite.complete) {
            contexto.drawImage(sprite, p.x, p.y, p.largura, p.altura);
        } else {
            contexto.fillStyle = '#00ffff';
            contexto.fillRect(p.x, p.y, p.largura, p.altura);
        }
    });
}

function loop_do_jogo() {
    if (fimDeJogo || jogoPausado) return;

    if (tempoDeJogo > 180 && !chefe) { gerar_chefe(); }

    atualizar_jogador(); // A chamada para a função de movimento está aqui
    atualizar_inimigos_e_chefe();
    atualizar_projeteis();
    atualizar_gemas_xp();

    tempoDeJogo += 1 / 60;
    elementoTimer.innerText = Math.floor(tempoDeJogo);
    
    const intervaloSpawn = Math.max(0.4, 1.5 - (tempoDeJogo / 180));
    cronometroGerarInimigo += 1 / 60;
    if (cronometroGerarInimigo > intervaloSpawn) {
        const quantidadeOnda = 1 + Math.floor(tempoDeJogo / 30);
        for(let i=0; i<quantidadeOnda; i++){
            gerar_inimigo();
        }
        cronometroGerarInimigo = 0;
    }
    
    desenhar_elementos();
    atualizar_interface_geral();

    if (jogador.vidaAtual <= 0) {
        fimDeJogo = true;
        telaFimDeJogo.style.display = 'flex';
        elementoTempoFinal.innerText = Math.floor(tempoDeJogo);
        clearInterval(intervaloDoLoop);
    }
}

// --- CONTROLES E INICIALIZAÇÃO ---
window.addEventListener('keydown', (e) => { teclas[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { teclas[e.key.toLowerCase()] = false; });
botaoReiniciar.addEventListener('click', configurar_jogo);

configurar_jogo();

