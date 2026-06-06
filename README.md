# 🚀 Estudar Online — Hub Educacional Aberto

[![Status: Active](https://img.shields.io/badge/Status-Active-success.svg)](#) [![Versão: 1.0.0](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#) [![Licença: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

O **[Estudar Online](https://estudaronline.org/)** é um produto digital focado na democratização do acesso à educação de alta qualidade. Nossa missão é mapear o ecossistema educacional na internet para localizar plataformas gratuitas e eliminar "barreiras ocultas" (como taxas surpresas para emissão de certificados, usabilidade hostil ou paywalls agressivos), conectando estudantes autodidatas às melhores oportunidades de qualificação profissional.

---

## 🎯 Visão do Produto (Product Vision)

O mercado de educação digital muitas vezes atrai o usuário com a premissa de "cursos gratuitos", apenas para bloqueá-lo na etapa final com a cobrança de diplomas. O Estudar Online nasce para ser a camada de **confiança e transparência** entre o estudante e o conhecimento. 

**Problema:** Alta carga cognitiva e frustração na busca por cursos gratuitos reais e chancelados por instituições de peso.  
**Solução:** Um diretório estático, ultrarrápido, curatorial e transparente, que indica claramente os *trade-offs* de cada plataforma (ex: tags `[Sem Certificado]` ou `[Modo Ouvinte]`), utilizando um design system acessível, imersivo e livre de distrações predatórias.

---

## 🏗️ Arquitetura e Engenharia

O projeto foi concebido sob uma arquitetura *Serverless/Static*, garantindo tempo de carregamento mínimo (LCP otimizado para SEO) e custo zero de infraestrutura (hospedagem nativa via GitHub Pages). O banco de dados foi desacoplado em arquivos JSON, permitindo escalabilidade curatorial sem a necessidade de deploys complexos.

### 📁 Estrutura do Diretório

| Arquivo / Diretório | Propósito do Componente |
| :--- | :--- |
| `index.html` | Interface principal do hub (App Web). Contém a *Hero Section*, barra de busca assíncrona, filtros do tipo Bento e integração nativa com GTM, Open Graph e Google Ads. |
| `sobre.html` | Página de transparência editorial. Descreve a metodologia estratégica e os critérios rigorosos de seleção (Product Discovery) dos cursos listados. |
| `privacidade.html` | Política de dados focada no usuário (Privacy by Design). Esclarece a inexistência de rastreamento invasivo ou bancos de dados comportamentais. |
| `style.css` | Design System completo. Utiliza estética orgânica/moderna, *Glassmorphism* avançado e suporte nativo a *Dark/Light Mode* sem o uso de cores absolutas (preto/branco puros), garantindo conformidade com padrões de contraste WCAG. |
| `script.js` | Motor de busca e regras de negócio no *Client-side*. Gerencia o parseamento de Regex para badges dinâmicas, *fetch* de bases JSON, modais de interação, history API (URLs compartilháveis) e Web Share API. |
| `dados.json` | Banco de dados central (NoSQL/JSON) do ecossistema de cursos. Contém nome, dor resolvida, descrição estratégica, URLs e emojis de cada plataforma. |
| `parceiros.json` | Matriz de dados secundária. Alimenta dinamicamente o rodapé com o ecossistema de projetos interligados (Cross-selling), permitindo escalar iniciativas futuras. |
| `tags.json` | Arquivo de configuração de regras de interface (UI). Determina cores, bordas e fundos paramétricos para as *badges* de alerta inseridas nos títulos dos cursos. |
| `sitemap.xml` | Mapa de rotas atualizado para crawlers de motores de busca (Googlebot), garantindo indexação rápida da estrutura. |
| `robots.txt` | Regras de rastreamento para indexadores. Bloqueia estrategicamente a indexação de queries de busca internas (`?q=`) para evitar penalizações por conteúdo duplicado no Google. |

---

## 💡 Diferenciais de UX e Design System

- **Acessibilidade Dinâmica:** Toggle nativo de acessibilidade visual (Claro/Escuro) e dimensionamento de fonte interativo salvo via `localStorage`.
- **Prevenção de Fadiga Visual:** Eliminação completa de valores hexadecimais `#000000` (preto) e `#FFFFFF` (branco). Uso de gradientes sutis, tons terrosos, *Poly Green* e *Flame* para um contraste macio (AA/AAA dependendo do tema).
- **Glassmorphism:** Componentes translúcidos modernos que dão profundidade e contexto tátil (inspirado nas diretrizes do iOS).
- **Micro-interações:** Uso de emojis semânticos no menu "Bento" para acelerar o reconhecimento cognitivo de categorias.

---

## 🚀 Estratégia de Crescimento (Growth & SEO)

1. **Top of Funnel (ToFu):** Captura de volume massivo de buscas via Google e integração de botão nativo para estender a pesquisa para a SERP, gerando utilidade extra e volume de tráfego.
2. **Cross-Selling de Ecossistema:** Rodapé inteligente apontando para verticais parceiras (`0800 Eu Vou`, `Trabalho e Futuro`, `Viajar com Seguro`).
3. **Loop de Viralidade:** Integração do Web Share API no modal de detalhes do curso, permitindo que usuários enviem links estruturados (`?modal=id`) diretamente para WhatsApp, LinkedIn ou Telegram com um único clique.

---

## 👨‍💻 Criador & Product Manager

Idealizado, projetado e gerenciado por **Paulin Basalces**.  
*Focado em construir produtos digitais de impacto, centrados no usuário, unindo design de interação, visão estratégica de negócios e engenharia de front-end de alta performance.*
