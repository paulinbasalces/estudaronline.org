document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let categoriaAtiva = 'Todas';
    const htmlElement = document.documentElement;
    const msgErroPadrao = '<p style="text-align:center; padding: 40px; font-weight: 600; color: var(--text-muted);">Não conseguimos carregar a lista de cursos no momento. Por favor, verifique sua conexão ou tente recarregar a página.</p>';

    /* Controles de Acessibilidade: Tema e Tipografia */
    if (localStorage.getItem('tema') === 'dark') htmlElement.setAttribute('data-theme', 'dark');
    
    document.getElementById('btn-tema').addEventListener('click', () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        htmlElement.toggleAttribute('data-theme', !isDark);
        localStorage.setItem('tema', isDark ? 'light' : 'dark');
    });

    let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
    const atualizarFonte = () => { 
        htmlElement.style.fontSize = fontScale + '%'; 
        localStorage.setItem('fontScale', fontScale); 
    };
    atualizarFonte();
    
    document.getElementById('btn-fonte-mais').addEventListener('click', () => { 
        if(fontScale < 130) { 
            fontScale += 10; 
            atualizarFonte(); 
        } 
    });
    
    document.getElementById('btn-fonte-menos').addEventListener('click', () => { 
        if(fontScale > 90) { 
            fontScale -= 10; 
            atualizarFonte(); 
        } 
    });

    /* Inicialização de Dados via Fetch API */
    fetch('dados.json')
        .then(res => {
            if (!res.ok) throw new Error('Falha na requisição dos dados.');
            return res.json();
        })
        .then(data => {
            baseDeDados = data || [];
            document.getElementById('total-ferramentas').textContent = baseDeDados.length;
            
            const categoriasUnicas = new Set(baseDeDados.map(i => i.categoria));
            document.getElementById('total-categorias').textContent = categoriasUnicas.size;
            
            renderizarFiltros();
            renderizarInterface();
            abrirModalDaUrl();
        })
        .catch(err => {
            console.error('Erro ao carregar base de curadoria:', err);
            document.getElementById('status-resultados').textContent = 'Aviso de sistema';
            document.getElementById('lista-ferramentas').innerHTML = msgErroPadrao;
        });

    /* Motores de Busca e Filtro Local */
    const campoBusca = document.getElementById('campo-busca');
    const btnLimpar = document.getElementById('btn-limpar-busca');

    campoBusca.addEventListener('input', () => { 
        atualizarUrlParam('q', campoBusca.value); 
        renderizarInterface(); 
    });
    
    btnLimpar.addEventListener('click', () => { 
        campoBusca.value = ''; 
        categoriaAtiva = 'Todas'; 
        atualizarUrlParam('q', null); 
        renderizarFiltros(); 
        renderizarInterface(); 
        campoBusca.focus();
    });

    function renderizarFiltros() {
        const cats = ['Todas', ...new Set(baseDeDados.map(i => i.categoria))];
        const container = document.getElementById('bento-menu');
        
        container.innerHTML = cats.map(cat => {
            const ativo = cat === categoriaAtiva ? 'true' : 'false';
            const total = cat === 'Todas' ? baseDeDados.length : baseDeDados.filter(i => i.categoria === cat).length;
            return `
                <button type="button" class="bento-card" data-cat="${cat}" aria-pressed="${ativo}">
                    <span>${cat}</span> <strong>(${total})</strong>
                </button>
            `;
        }).join('');
        
        container.querySelectorAll('.bento-card').forEach(btn => {
            btn.addEventListener('click', () => {
                categoriaAtiva = btn.dataset.cat; 
                renderizarFiltros(); 
                renderizarInterface(); 
            });
        });
    }

    function renderizarInterface() {
        const termoOriginal = campoBusca.value;
        const termoNormalizado = termoOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtradas = baseDeDados.filter(item => {
            const textoCompleto = (item.nome + " " + item.dor_resolvida + " " + item.descricao).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const textMatch = termoNormalizado === '' || textoCompleto.includes(termoNormalizado);
            const catMatch = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;
            return textMatch && catMatch;
        });

        const statusTxt = filtradas.length === 1 ? '1 recurso encontrado.' : `${filtradas.length} recursos encontrados.`;
        document.getElementById('status-resultados').textContent = termoOriginal ? `Buscando por "${termoOriginal}": ${statusTxt}` : statusTxt;
        
        const container = document.getElementById('lista-ferramentas');
        
        if (!filtradas.length) { 
            container.innerHTML = `<p style="text-align:center; padding: 40px; font-weight: 600; color: var(--text-main);">Nenhum curso ou plataforma encontrada para os critérios atuais. Tente ajustar os termos da busca.</p>`; 
            return; 
        }

        const gruposDeCategorias = filtradas.reduce((acc, obj) => { 
            (acc[obj.categoria] = acc[obj.categoria] || []).push(obj); 
            return acc; 
        }, {});
        
        container.innerHTML = Object.keys(gruposDeCategorias).map((cat, idx, arr) => {
            const cardsHTML = gruposDeCategorias[cat].map(item => `
                <article class="card">
                    <div class="card-topo">
                        <span class="card-emoji" aria-hidden="true">${item.emoji}</span>
                        <span class="card-tag">${item.categoria}</span>
                    </div>
                    <h3>${item.nome}</h3>
                    <p class="card-desc">${item.dor_resolvida}</p>
                    <p class="card-editorial">${item.descricao}</p>
                    <div class="card-footer">
                        <button class="btn-card-abrir" onclick="abrirModal('${item.id}')" aria-label="Ver detalhes sobre ${item.nome}">Ver Detalhes</button>
                        <a class="link-card-oficial" href="${item.url}" target="_blank" rel="noopener noreferrer">Acessar ➔</a>
                    </div>
                </article>
            `).join('');
            
            const blocoPublicidade = idx < arr.length - 1 ? `<div class="area-adsense"><p class="ads-label">Apoio e Publicidade</p></div>` : '';
            return `
                <section class="sessao-categoria">
                    <h2 class="sessao-titulo">${cat}</h2>
                    <div class="grid-cards">${cardsHTML}</div>
                </section>
                ${blocoPublicidade}
            `;
        }).join('');
    }

    /* Gerenciamento de Estado (Modal) e API de Histórico */
    window.abrirModal = function(id) {
        const item = baseDeDados.find(i => String(i.id) === String(id));
        if(!item) return;
        
        document.getElementById('artigo-emoji').textContent = item.emoji;
        document.getElementById('artigo-titulo').textContent = item.nome;
        document.getElementById('artigo-categoria').textContent = item.categoria;
        document.getElementById('artigo-dor').textContent = item.dor_resolvida;
        document.getElementById('artigo-descricao').textContent = item.descricao;
        
        document.getElementById('artigo-melhor-para').textContent = 'Estudantes autodidatas buscando aprimoramento contínuo e validação de currículo.';
        document.getElementById('artigo-cuidado').textContent = 'Certifique-se de preencher o perfil corretamente na plataforma oficial para emissão correta do certificado.';
        
        const btnLink = document.getElementById('artigo-link');
        btnLink.href = item.url;
        
        const btnShare = document.getElementById('botoes-compartilhamento');
        btnShare.innerHTML = `<button class="btn-share" onclick="compartilhar('${item.nome}', '${item.id}')" aria-label="Copiar link de ${item.nome}">Copiar Link e Indicar</button>`;
        
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        
        atualizarUrlParam('modal', item.id);
        document.getElementById('fechar-modal').focus();
    };

    const modalOverlay = document.getElementById('modal-overlay');
    
    document.getElementById('fechar-modal').addEventListener('click', fecharModal);
    
    modalOverlay.addEventListener('click', (e) => { 
        if(e.target.id === 'modal-overlay') fecharModal(); 
    });
    
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) fecharModal();
    });
    
    function fecharModal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.setAttribute('aria-hidden', 'true');
        atualizarUrlParam('modal', null);
    }

    /* Utilitários de URL e Compartilhamento Nativo */
    function atualizarUrlParam(key, value) {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(key, value); 
        } else {
            url.searchParams.delete(key);
        }
        window.history.replaceState({}, '', url);
    }

    function abrirModalDaUrl() {
        const modalId = new URLSearchParams(window.location.search).get('modal');
        if (modalId && baseDeDados.length > 0) {
            window.abrirModal(modalId);
        }
    }

    window.compartilhar = async function(nome, id) {
        const urlFinal = `${window.location.origin}${window.location.pathname}?modal=${id}`;
        
        if (navigator.share) {
            try { 
                await navigator.share({ 
                    title: `Conheça: ${nome} - Estudar Online`, 
                    text: `Dá uma olhada neste recurso gratuito que encontrei no Estudar Online:`,
                    url: urlFinal 
                }); 
            } catch(err) {
                console.log('Compartilhamento cancelado ou falhou.', err);
            }
        } else {
            navigator.clipboard.writeText(urlFinal).then(() => {
                alert('Link copiado para a área de transferência! Cole onde quiser.');
            }).catch(err => {
                console.error('Falha ao copiar:', err);
            });
        }
    };
});