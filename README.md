# entrelinhas · site

Este é o site do **entrelinhas**, uma iniciativa editorial de livretos gratuitos sobre as construções sociais do feminino distribuídos em Curitiba. É o projeto de conclusão de curso em Design (PUCPR) de Helena Arioli.

O site serve para:
- **localizar os livretos** no mapa (expositores e lambe-lambes);
- apresentar o projeto;
- dar acesso à **edição digital** (um leitor folheável);
- mostrar os **parceiros**, a **galeria** da campanha e as redes sociais.

Ele é feito com [Astro](https://astro.build) e gera um site estático: só HTML, CSS e um pouco de JS. Por isso pode ser hospedado de graça em qualquer lugar.

---

## Rodar no computador

É preciso ter o [Node.js](https://nodejs.org) 22.23 ou mais recente.

```sh
npm install        # instala as dependências (só na primeira vez)
npm run dev        # abre o site em http://localhost:4321 e recarrega a cada alteração
npm run build      # gera a versão final na pasta dist/
npm run preview    # mostra a versão final localmente
npm run check      # confere erros de código e de conteúdo
npm run deploy     # publica a versão atual no GitHub Pages
```

---

## Editar o conteúdo

Todo o conteúdo fica em arquivos de texto. Não é preciso mexer no código.

**Se algum dado estiver errado, o build para.** Isso vale para coordenada fora de Curitiba, edição inexistente e peça da galeria sem imagem ou texto alternativo. A mensagem diz qual arquivo e qual campo corrigir.

### Pontos do mapa: `src/data/pontos.json`

Cada ponto é um bloco assim:

```json
{
  "id": "biblioteca-publica",
  "nome": "Biblioteca Pública do Paraná",
  "tipo": "expositor",
  "endereco": "Rua Cândido Lopes, 133",
  "bairro": "Centro",
  "lat": -25.43099,
  "lng": -49.27351,
  "horario": "No horário de funcionamento do espaço",
  "descricao": "Expositor no saguão de entrada."
}
```

- **`id`**: um nome curto, sem acentos nem espaços. Aparece no link (`/mapa?ponto=biblioteca-publica`).
- **`tipo`**: `"expositor"` (onde pegar livretos, pino magenta) ou `"lambe"` (campanha de rua, pino lima).
- **`lat` / `lng`**: no Google Maps, clique com o botão direito no local e clique nos números que aparecem para copiar. O primeiro é a `lat`, o segundo a `lng`.
- **`edicoes`** (opcional): sem esse campo, o ponto recebe todas as edições já lançadas (até `edicaoAtual`). Só preencha (ex.: `"edicoes": [1, 3]`) se um ponto específico não receber alguma edição.
- Pontos no mesmo endereço (ex.: o expositor e os lambes do Portão Cultural) ficam a uns 30 m um do outro, para os dois pinos aparecerem no mapa.
- A lista atual (13 expositores e 14 pontos de lambe) é a enviada pela Helena em nov/2026.

### Edições: `src/content/edicoes/*.md`

Há um arquivo por livreto. O cabeçalho (entre os `---`) traz os dados. O texto abaixo dele é a sinopse que aparece na página da edição.

- **`cor`**: a cor da capa gerada (e do topo da página da edição). Valores: `magenta`, `lima`, `verde`, `ciano`, `azul` ou `preto`.
- **`capa`** (opcional): a imagem da capa real (ex.: `/edicoes/01/capa.webp`). Sem ela, o site desenha uma capa no formato do livreto (10,5 × 14 cm).
- **`paginas`**: as páginas do livreto, na ordem. Cada página tem um `layout`:

  | layout | o que mostra | campos |
  |---|---|---|
  | `capa` | a capa gerada da edição | — |
  | `texto` | página de texto corrido | `titulo`, `texto` (aceita *itálico*) |
  | `citacao` | citação grande na cor da edição | `texto`, `autor` |
  | `pergunta` | pergunta provocativa em fundo preto | `texto` |
  | `pautas` | linhas para a pessoa escrever "nas entrelinhas" | `titulo`, `texto` |
  | `lista` | lista (ex.: referências) | `titulo`, `itens` |
  | `imagem` | uma página exportada do InDesign | `imagem` (ex.: `/edicoes/01/p05.jpg`), `alt` |
  | `contracapa` | contracapa com créditos | — |

  A **edição 01** já usa as páginas reais. Os dois scripts abaixo leem o PDF original em `C:\Helena\Entrelinhas`:
  - `tools/importar-material.py` exporta cada página como WebP em `public/edicoes/01/` e copia o PDF. Também gera as fotos, as peças e os logos dos parceiros.
  - `tools/gerar-edicao-01.py` reescreve o arquivo da edição, com o texto alternativo de cada página lido do PDF.

  Se o livreto mudar, rode `python tools/importar-material.py && python tools/gerar-edicao-01.py`. Para uma edição nova, siga o mesmo caminho (os scripts precisam de Python com `pymupdf` e `Pillow`).
- **`pdf`** (opcional): o caminho de um PDF em `public/` (ex.: `/edicoes/01/livreto.pdf`). Quando preenchido, o leitor ganha o botão "baixar PDF".

**Para virar o mês:** mude `edicaoAtual` em `src/data/site.ts`. As anteriores passam a "disponível" e as seguintes ficam "em breve". Hoje a edição do mês é a 01, a única com conteúdo real. As 02 a 06 aparecem como "em breve", com temas provisórios.

### Galeria

O material vem da pasta do Drive da Helena, baixada em `C:\Helena\Site\Drive` (subpastas `peças para atualizar`, `imagens simulação` e `ensaio fotografico`). `python tools/importar-galeria.py` converte tudo para WebP em `public/lambes/`, `public/rua/` e `public/fotos/` (versão grande `nome.webp` e miniatura `nome-p.webp`). Os textos ficam nos JSON:

- **`src/data/galeria.json`**: as peças da campanha. Cada série tem uma `obra` e um `cartaz` (campo `tipo`) com o mesmo `serie` (ex.: `"o corpo."`). Na página, cada série vira uma linha com as duas peças lado a lado e o texto do cartaz (`texto`). `imagem` é o caminho sem extensão.
- **`src/data/rua.json`**: as imagens da campanha nas ruas (seção "na rua" da galeria). As quatro com `"home": true` aparecem na home.
- **`src/data/fotos.json`**: o ensaio do kit. `formato: "retrato"` ocupa duas linhas da grade; `"destaque"` ocupa 2 × 2.

Em todos, `alt` é a descrição para quem usa leitor de tela.

### Parceiros: `src/data/parceiros.json`

Logo: coloque o arquivo em `public/parceiros/` e preencha `"logo": "/parceiros/nome.png"`. Os três logos atuais foram recortados do fanzine, por isso têm fundo magenta. Os campos `url` e `instagram` são opcionais e devem ser links completos (`https://...`). Os textos `descricao` e `papel` são curtos e genéricos: vale trocar pelos textos que os coletivos aprovarem.

### Informações gerais: `src/data/site.ts`

Aqui ficam Instagram, e-mail, créditos, as frases do letreiro, a edição do mês e o ID do projeto da Adobe Fonts (`adobeFonts`). `conteudoIlustrativo: true` volta a exibir o aviso de protótipo no mapa e no rodapé (desligado desde nov/2026, a pedido da Helena).

---

## Identidade visual

As cores e as fontes ficam em variáveis no início de `src/styles/global.css`. O logotipo (`Wordmark.astro`) e o símbolo "e" (`LogoMark.astro`) são os vetores originais, extraídos da cinta e do fanzine.

| cor | HEX | texto por cima |
|---|---|---|
| magenta | `#E6007E` | branco |
| lima | `#B5CD20` | **preto** (texto branco no lima fica ilegível) |
| verde | `#00A86B` | preto |
| ciano | `#009FE3` | preto |
| azul | `#2658A4` | branco |

**Fontes.** A identidade usa três:

| papel | fonte | variável CSS | onde aparece |
|---|---|---|---|
| títulos | Alfabet | `--font-display` | títulos, rótulos, botões |
| corpo e variações | Jubilat | `--font-text` | texto geral, chamadas, frases em destaque |
| leitura editorial | Times New Roman | `--font-editorial` | parágrafos de leitura (sobre, FAQ, sinopses, passos, parceiros); classe `.editorial` ou `.prose` |

Alfabet e Jubilat são comerciais e estão na **Adobe Fonts**. Para ligá-las:
1. Em fonts.adobe.com (no navegador, não no app do Creative Cloud), abra a página da Alfabet, clique em **</> Adicionar ao projeto web**, crie o projeto `entrelinhas` marcando todos os estilos. Repita na página da Jubilat, escolhendo o mesmo projeto. O navegador só baixa os estilos que o site usa, então marcar todos não pesa.
2. Copie o ID do projeto, o trecho `abc1234` de `https://use.typekit.net/abc1234.css`, e cole em `adobeFonts` no `src/data/site.ts`.
3. Confira se os nomes CSS do projeto são `alfabet` e `jubilat` (se forem outros, ajuste o bloco `:root.fontes-adobe` em `global.css`). Depois, `npm run deploy`.

O projeto atual é o `wsn2hin` (conta da Helena), com Alfabet e Jubilat em Regular e Bold, com itálicos. Os títulos pedem peso 800/900 e hoje aparecem em Bold (700); se ela acrescentar ExtraBold e Black ao projeto (**Editar projeto** em Minhas fontes Adobe → Projetos web), o site passa a usá-los sozinho, sem mudar código. As faixas coloridas dos títulos (`.box`) são recortadas por `--box-topo`/`--box-base` porque a Alfabet tem muito espaço acima das maiúsculas.

Sem o ID, o site usa as substitutas gratuitas **Archivo** (no lugar da Alfabet) e **Zilla Slab** (no lugar da Jubilat). O projeto web depende da assinatura de quem o criou: se ela acabar, o site volta sozinho para as substitutas. A Times New Roman vem do próprio aparelho; onde ela não existe (Android, Linux), entra a **Tinos**, de mesmas medidas.

---

## Mapa

O mapa usa [Leaflet](https://leafletjs.com) com os tiles gratuitos do **OpenStreetMap**, sem chave e com atribuição. Isso atende bem um projeto acadêmico de tráfego baixo. Se o site passar a ter muito acesso, troque a URL dos tiles em `src/scripts/map.ts` por um provedor com chave (MapTiler, Stadia etc.), seguindo a [política de uso do OSM](https://operations.osmfoundation.org/policies/tiles/).

O botão "perto de mim" só funciona com o site publicado em **https** ou em `localhost`.

---

## Publicar

O site está publicado no **GitHub Pages**: https://steilein.github.io/entrelinhas/
O código fica em https://github.com/Steilein/entrelinhas.

Para publicar uma nova versão depois de editar o conteúdo, rode:

```sh
npm run deploy
```

Esse comando gera o site e envia a pasta `dist/` para a branch `gh-pages`. Em cerca de 1 minuto, o GitHub Pages atualiza o endereço. Envie também o código-fonte (`git add`, `git commit`, `git push`) para manter o repositório em dia.

> Por que não há deploy automático (GitHub Actions)? Em nov/2026 o Actions da conta estava bloqueado por uma pendência de cobrança no GitHub. Resolvida a pendência, dá para voltar ao deploy automático.

**Para mudar de endereço** (domínio próprio, Netlify, Vercel):
1. Ajuste `site` e `base` em `astro.config.mjs`. Num domínio próprio ou no Netlify, `base` volta a ser `'/'`.
2. Atualize o endereço em `public/robots.txt`.
3. No Netlify, basta arrastar a pasta `dist/` para [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Testes automáticos

```sh
npm run build && npm run preview   # deixe rodando num terminal (abre em /entrelinhas/)
npm run qa                          # em outro terminal
```

O roteiro `tests/qa.mjs` usa o Microsoft Edge instalado no computador e verifica:
- todas as páginas, no celular e no desktop;
- filtros, links diretos e o "perto de mim" do mapa;
- o leitor;
- a galeria;
- acessibilidade, com o axe.

As capturas de tela ficam em `qa-output/`.
