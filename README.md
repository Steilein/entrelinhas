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
```

---

## Editar o conteúdo

Todo o conteúdo fica em arquivos de texto. Não é preciso mexer no código.

**Se algum dado estiver errado, o build para.** Isso vale para coordenada fora de Curitiba, edição inexistente e cartaz apontando para um ponto que não existe. A mensagem diz qual arquivo e qual campo corrigir.

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
  "edicoes": [1, 2, 3],
  "descricao": "Expositor no saguão de entrada."
}
```

- **`id`**: um nome curto, sem acentos nem espaços. Aparece no link (`/mapa?ponto=biblioteca-publica`).
- **`tipo`**: `"expositor"` (onde pegar livretos, pino magenta) ou `"lambe"` (campanha de rua, pino lima).
- **`lat` / `lng`**: no Google Maps, clique com o botão direito no local e clique nos números que aparecem para copiar. O primeiro é a `lat`, o segundo a `lng`.
- **`edicoes`**: as edições disponíveis naquele expositor. No caso de um lambe-lambe, as edições dos cartazes colados ali.

### Edições: `src/content/edicoes/*.md`

Há um arquivo por livreto. O cabeçalho (entre os `---`) traz os dados. O texto abaixo dele é a sinopse que aparece na página da edição.

- **`cor`**: a cor da capa gerada. Valores: `magenta`, `lima`, `verde`, `ciano`, `azul` ou `preto`.
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

  Para usar as páginas reais do livreto, exporte cada página como JPG em proporção A6 e coloque os arquivos em `public/edicoes/01/`. Depois use o layout `imagem` em cada página.
- **`pdf`** (opcional): o caminho de um PDF em `public/` (ex.: `/edicoes/01/livreto.pdf`). Quando preenchido, o leitor ganha o botão "baixar PDF".

**Para virar o mês:** mude `edicaoAtual` em `src/data/site.ts`. As anteriores passam a "disponível" e as seguintes ficam "em breve".

### Galeria: `src/data/galeria.json`

Hoje cada cartaz é desenhado pelo próprio site (campo `variante`). Para usar fotos reais:
1. Coloque a foto em `public/galeria/` (ex.: `public/galeria/largo-01.jpg`).
2. Acrescente ao item `"imagem": "/galeria/largo-01.jpg"` e `"alt": "descrição da foto"`.

O campo `ponto` precisa ser o `id` de um ponto do mapa. É ele que gera o botão "ver no mapa".

### Parceiros: `src/data/parceiros.json`

Logo: coloque o arquivo em `public/parceiros/` e preencha `"logo": "/parceiros/nome.png"`. Os campos `url` e `instagram` são opcionais e devem ser links completos (`https://...`).

### Informações gerais: `src/data/site.ts`

Aqui ficam Instagram, e-mail, créditos, as frases do letreiro e a edição do mês. Quando os pontos e as fotos forem os definitivos, mude `conteudoIlustrativo` para `false`. Isso remove o aviso do rodapé.

---

## Identidade visual

As cores e as fontes ficam em variáveis no início de `src/styles/global.css`.

| cor | HEX | texto por cima |
|---|---|---|
| magenta | `#E6007E` | branco |
| lima | `#B5CD20` | **preto** (texto branco no lima fica ilegível) |
| verde | `#00A86B` | preto |
| ciano | `#009FE3` | preto |
| azul | `#2658A4` | branco |

**Fontes.** Alfabet e Jubilat são fontes comerciais, então o site usa substitutas gratuitas: **Archivo** no lugar da Alfabet e **Zilla Slab** no lugar da Jubilat. Para usar as originais:
- **Adobe Fonts:** crie um projeto web com Alfabet e Jubilat e cole o `<link>` do kit no `<head>` de `src/layouts/Base.astro`.
- Nos dois casos, troque `--font-display` e `--font-text` em `global.css` pelos nomes das fontes.
- **Arquivos próprios com licença web:** coloque os `.woff2` em `public/fonts/` e declare os `@font-face` no topo de `global.css`.

---

## Mapa

O mapa usa [Leaflet](https://leafletjs.com) com os tiles gratuitos do **OpenStreetMap**, sem chave e com atribuição. Isso atende bem um projeto acadêmico de tráfego baixo. Se o site passar a ter muito acesso, troque a URL dos tiles em `src/scripts/map.ts` por um provedor com chave (MapTiler, Stadia etc.), seguindo a [política de uso do OSM](https://operations.osmfoundation.org/policies/tiles/).

O botão "perto de mim" só funciona com o site publicado em **https** ou em `localhost`.

---

## Publicar

O site é estático. Escolha um destes caminhos:
- **Netlify (mais simples):**
  1. Rode `npm run build`.
  2. Arraste a pasta `dist/` para [app.netlify.com/drop](https://app.netlify.com/drop).
- **Netlify ou Vercel ligados ao GitHub:** a configuração é detectada sozinha (comando `npm run build`, pasta `dist`).
- **GitHub Pages:** em `astro.config.mjs`, defina `site` com o seu endereço e `base: '/nome-do-repositorio'`.

Depois de publicar, ajuste `site` em `astro.config.mjs` e o endereço em `public/robots.txt` para o domínio final. Assim os links de compartilhamento e o sitemap saem certos.

---

## Testes automáticos

```sh
npm run build && npm run preview   # deixe rodando num terminal
npm run qa                          # em outro terminal
```

O roteiro `tests/qa.mjs` usa o Microsoft Edge instalado no computador e verifica:
- todas as páginas, no celular e no desktop;
- filtros, links diretos e o "perto de mim" do mapa;
- o leitor;
- a galeria;
- acessibilidade, com o axe.

As capturas de tela ficam em `qa-output/`.
