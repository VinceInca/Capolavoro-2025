document.addEventListener('DOMContentLoaded', () => {
    // Configurazione
    const canvas = document.getElementById('canvas-gioco');
    const ctx = canvas.getContext('2d', { alpha: false });
    const schermate = {
        iniziale: document.getElementById('schermata-iniziale'),
        gioco: document.getElementById('schermata-gioco'),
        gameOver: document.getElementById('schermata-game-over')
    };
    const punteggioEl = document.getElementById('punteggio');
    const conteggioMeleEl = document.getElementById('conteggio-mele');
    const punteggioFinaleEl = document.getElementById('punteggio-finale');
    const punteggioMassimoEl = document.getElementById('punteggio-massimo');
    const punteggioMassimoFinaleEl = document.getElementById('punteggio-massimo-finale');

    // Costanti di gioco
    const DIM_GRIGLIA = 25;
    const DIM_CANVAS = 700;
    const VELOCITA = 90;
    const MELE_INIZIALI = 3;

    // Variabili di gioco
    let serpente = [], mele = [], ostacoli = [], melaSpeciale = null;
    let direzione = 'destra', prossimaDirezione = 'destra';
    let punteggio = 0, meleMangiate = 0;
    let punteggioMassimo = localStorage.getItem('snakeRecord') || 0;
    let cicloGioco, tempoMelaSpeciale;
    let ultimoTempo = 0;
    let accumulatore = 0;

    // Inizializzazione
    canvas.width = canvas.height = DIM_CANVAS;
    punteggioMassimoEl.textContent = punteggioMassimo;

    // Event listeners
    document.getElementById('bottone-gioca').addEventListener('click', iniziaGioco);
    document.getElementById('bottone-home').addEventListener('click', tornaHome);
    document.getElementById('bottone-riprova').addEventListener('click', riprovaGioco);
    document.getElementById('bottone-menu').addEventListener('click', tornaHome);
    document.addEventListener('keydown', gestisciTasto);

    function iniziaGioco() {
        schermate.iniziale.classList.add('nascosta');
        schermate.gameOver.classList.add('nascosta');
        schermate.gioco.classList.remove('nascosta');
        
        resetGioco();
        generaMele(MELE_INIZIALI);
        
        ultimoTempo = performance.now();
        cicloGioco = requestAnimationFrame(gameLoop);
    }

    function riprovaGioco() {
        schermate.gameOver.classList.add('nascosta');
        schermate.gioco.classList.remove('nascosta');
        
        resetGioco();
        generaMele(MELE_INIZIALI);
        
        ultimoTempo = performance.now();
        cicloGioco = requestAnimationFrame(gameLoop);
    }

    function gameLoop(tempoAttuale) {
        const deltaTempo = tempoAttuale - ultimoTempo;
        ultimoTempo = tempoAttuale;
        accumulatore += deltaTempo;

        while (accumulatore >= VELOCITA) {
            aggiornaGioco();
            accumulatore -= VELOCITA;
        }

        disegnaGioco();
        cicloGioco = requestAnimationFrame(gameLoop);
    }

    function resetGioco() {
        serpente = [
            {x:350,y:350},
            {x:325,y:350},
            {x:300,y:350}
        ];
        direzione = prossimaDirezione = 'destra';
        punteggio = meleMangiate = 0;
        ostacoli = [];
        melaSpeciale = null;
        punteggioEl.textContent = conteggioMeleEl.textContent = 0;
        accumulatore = 0;
        
        cancelAnimationFrame(cicloGioco);
        clearTimeout(tempoMelaSpeciale);
    }

    function aggiornaGioco() {
        direzione = prossimaDirezione;
        const testa = {...serpente[0]};
        
        // Movimento
        switch(direzione) {
            case 'su': testa.y -= DIM_GRIGLIA; break;
            case 'giu': testa.y += DIM_GRIGLIA; break;
            case 'sinistra': testa.x -= DIM_GRIGLIA; break;
            case 'destra': testa.x += DIM_GRIGLIA; break;
        }
        
        // Collisioni
        if (collisione(testa)) {
            gameOver();
            return;
        }
        
        serpente.unshift(testa);
        
        // Controllo mele
        let melaIndex = mele.findIndex(m => m.x === testa.x && m.y === testa.y);
        if (melaIndex !== -1) {
            mangiaMela(melaIndex);
        } 
        // Controllo mela speciale
        else if (melaSpeciale && testa.x === melaSpeciale.x && testa.y === melaSpeciale.y) {
            mangiaMelaSpeciale();
        } 
        // Nessuna mela mangiata
        else {
            serpente.pop();
        }
    }

    function collisione(testa) {
        return (
            testa.x < 0 || testa.x >= DIM_CANVAS ||
            testa.y < 0 || testa.y >= DIM_CANVAS ||
            serpente.some((s, i) => i > 0 && s.x === testa.x && s.y === testa.y) ||
            ostacoli.some(o => o.x === testa.x && o.y === testa.y)
        );
    }

    function mangiaMela(index) {
        punteggio += 10;
        meleMangiate++;
        punteggioEl.textContent = punteggio;
        conteggioMeleEl.textContent = meleMangiate;
        mele.splice(index, 1);
        
        // Genera nuova mela solo se ne abbiamo meno di 3
        if (mele.length < MELE_INIZIALI) {
            generaMele(1);
        }
        
        // Genera mela speciale ogni 5 mele
        if (meleMangiate % 5 === 0 && !melaSpeciale) {
            generaMelaSpeciale();
        }
        
        // Genera ostacolo ogni 7 mele
        if (meleMangiate % 7 === 0) {
            generaOstacolo();
        }
    }

    function mangiaMelaSpeciale() {
        punteggio += 50;
        punteggioEl.textContent = punteggio;
        clearTimeout(tempoMelaSpeciale);
        melaSpeciale = null;
    }

    function disegnaGioco() {
        // Sfondo
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, DIM_CANVAS, DIM_CANVAS);
        
        // Ostacoli
        ctx.fillStyle = '#555';
        ostacoli.forEach(o => {
            ctx.fillRect(o.x, o.y, DIM_GRIGLIA, DIM_GRIGLIA);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(o.x, o.y, DIM_GRIGLIA, DIM_GRIGLIA);
        });
        
        // Serpente
        serpente.forEach((s, i) => {
            if (i === 0) { // Testa
                ctx.fillStyle = '#00ff88';
                ctx.fillRect(s.x, s.y, DIM_GRIGLIA, DIM_GRIGLIA);
                
                // Occhi
                ctx.fillStyle = '#121212';
                const occhioSize = DIM_GRIGLIA / 5;
                const offset = DIM_GRIGLIA / 3;
                
                if (direzione === 'destra') {
                    ctx.fillRect(s.x + DIM_GRIGLIA - offset, s.y + offset, occhioSize, occhioSize);
                    ctx.fillRect(s.x + DIM_GRIGLIA - offset, s.y + DIM_GRIGLIA - offset*1.5, occhioSize, occhioSize);
                } else if (direzione === 'sinistra') {
                    ctx.fillRect(s.x + offset/2, s.y + offset, occhioSize, occhioSize);
                    ctx.fillRect(s.x + offset/2, s.y + DIM_GRIGLIA - offset*1.5, occhioSize, occhioSize);
                } else if (direzione === 'su') {
                    ctx.fillRect(s.x + offset, s.y + offset/2, occhioSize, occhioSize);
                    ctx.fillRect(s.x + DIM_GRIGLIA - offset*1.5, s.y + offset/2, occhioSize, occhioSize);
                } else if (direzione === 'giu') {
                    ctx.fillRect(s.x + offset, s.y + DIM_GRIGLIA - offset/1.5, occhioSize, occhioSize);
                    ctx.fillRect(s.x + DIM_GRIGLIA - offset*1.5, s.y + DIM_GRIGLIA - offset/1.5, occhioSize, occhioSize);
                }
            } else { // Corpo
                ctx.fillStyle = i % 2 === 0 ? '#00cc6a' : '#00aa55';
                ctx.fillRect(s.x, s.y, DIM_GRIGLIA, DIM_GRIGLIA);
                ctx.strokeStyle = '#264653';
                ctx.strokeRect(s.x, s.y, DIM_GRIGLIA, DIM_GRIGLIA);
            }
        });
        
        // Mele
        ctx.fillStyle = '#ff5555';
        mele.forEach(m => {
            ctx.beginPath();
            ctx.arc(m.x + DIM_GRIGLIA/2, m.y + DIM_GRIGLIA/2, DIM_GRIGLIA/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#264653';
            ctx.stroke();
        });
        
        // Mela speciale (se presente)
        if (melaSpeciale) {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(melaSpeciale.x + DIM_GRIGLIA/2, melaSpeciale.y + DIM_GRIGLIA/2, DIM_GRIGLIA/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function generaMele(numero) {
        const maxPos = DIM_CANVAS / DIM_GRIGLIA;
        
        for (let i = 0; i < numero; i++) {
            let nuovaMela;
            let tentativi = 0;
            do {
                nuovaMela = {
                    x: Math.floor(Math.random() * maxPos) * DIM_GRIGLIA,
                    y: Math.floor(Math.random() * maxPos) * DIM_GRIGLIA
                };
                tentativi++;
            } while (
                (serpente.some(s => s.x === nuovaMela.x && s.y === nuovaMela.y) ||
                 mele.some(m => m.x === nuovaMela.x && m.y === nuovaMela.y) ||
                 ostacoli.some(o => o.x === nuovaMela.x && o.y === nuovaMela.y) ||
                 (melaSpeciale && melaSpeciale.x === nuovaMela.x && melaSpeciale.y === nuovaMela.y)) &&
                tentativi < 100
            );
            
            if (tentativi < 100) {
                mele.push(nuovaMela);
            }
        }
    }

    function generaMelaSpeciale() {
        const maxPos = DIM_CANVAS / DIM_GRIGLIA;
        let nuovaMela;
        let tentativi = 0;
        
        do {
            nuovaMela = {
                x: Math.floor(Math.random() * maxPos) * DIM_GRIGLIA,
                y: Math.floor(Math.random() * maxPos) * DIM_GRIGLIA
            };
            tentativi++;
        } while (
            (serpente.some(s => s.x === nuovaMela.x && s.y === nuovaMela.y) ||
             mele.some(m => m.x === nuovaMela.x && m.y === nuovaMela.y) ||
             ostacoli.some(o => o.x === nuovaMela.x && o.y === nuovaMela.y)) &&
            tentativi < 100
        );
        
        if (tentativi < 100) {
            melaSpeciale = nuovaMela;
            
            // La mela speciale scompare dopo 5 secondi
            tempoMelaSpeciale = setTimeout(() => {
                if (melaSpeciale) {
                    melaSpeciale = null;
                    disegnaGioco();
                }
            }, 5000);
        }
    }

    function generaOstacolo() {
        const maxPos = DIM_CANVAS / DIM_GRIGLIA;
        let nuovoOstacolo;
        let tentativi = 0;
        
        do {
            nuovoOstacolo = {
                x: Math.floor(Math.random() * maxPos) * DIM_GRIGLIA,
                y: Math.floor(Math.random() * maxPos) * DIM_GRIGLIA
            };
            tentativi++;
        } while (
            (serpente.some(s => s.x === nuovoOstacolo.x && s.y === nuovoOstacolo.y) ||
             mele.some(m => m.x === nuovoOstacolo.x && m.y === nuovoOstacolo.y) ||
             ostacoli.some(o => o.x === nuovoOstacolo.x && o.y === nuovoOstacolo.y) ||
             (melaSpeciale && melaSpeciale.x === nuovoOstacolo.x && melaSpeciale.y === nuovoOstacolo.y)) &&
            tentativi < 100
        );
        
        if (tentativi < 100) {
            ostacoli.push(nuovoOstacolo);
        }
    }

    function gameOver() {
        cancelAnimationFrame(cicloGioco);
        clearTimeout(tempoMelaSpeciale);
        
        if (punteggio > punteggioMassimo) {
            punteggioMassimo = punteggio;
            localStorage.setItem('snakeRecord', punteggioMassimo);
        }
        
        punteggioFinaleEl.textContent = punteggio;
        punteggioMassimoFinaleEl.textContent = punteggioMassimo;
        schermate.gioco.classList.add('nascosta');
        schermate.gameOver.classList.remove('nascosta');
    }

    function tornaHome() {
        cancelAnimationFrame(cicloGioco);
        clearTimeout(tempoMelaSpeciale);
        schermate.gioco.classList.add('nascosta');
        schermate.gameOver.classList.add('nascosta');
        schermate.iniziale.classList.remove('nascosta');
    }

    function gestisciTasto(e) {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
            e.preventDefault();
            if (e.key === 'ArrowUp' && direzione !== 'giu') prossimaDirezione = 'su';
            else if (e.key === 'ArrowDown' && direzione !== 'su') prossimaDirezione = 'giu';
            else if (e.key === 'ArrowLeft' && direzione !== 'destra') prossimaDirezione = 'sinistra';
            else if (e.key === 'ArrowRight' && direzione !== 'sinistra') prossimaDirezione = 'destra';
        }
    }
});