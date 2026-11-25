"""Gera src/content/edicoes/01-o-feminino-nao-vem-de-fabrica.md a partir de src/data/paginas-01.json.

As páginas são as imagens exportadas por tools/importar-material.py. Rode de novo se o livreto mudar:
    python tools/importar-material.py && python tools/gerar-edicao-01.py
"""
import json

paginas = json.load(open('src/data/paginas-01.json', encoding='utf-8'))
linhas = []
for p in paginas:
    linhas.append('  - layout: imagem')
    linhas.append('    imagem: ' + json.dumps(p['imagem'], ensure_ascii=False))
    linhas.append('    alt: ' + json.dumps(p['alt'], ensure_ascii=False))

md = f'''---
numero: 1
titulo: "O feminino não vem de fábrica"
tema: "Como o feminino virou o que reconhecemos como feminino?"
lancamento: "nov. 2026"
cor: "lima"
chamada: "Reconhecemos o feminino antes de saber explicá-lo. Esta edição investiga como chegamos às definições que já conhecemos."
capa: "/edicoes/01/capa.webp"
pdf: "/edicoes/01/entrelinhas-edicao-01.pdf"
pergunta: "Quem te ensinou a enxergar o feminino em um objeto, uma cor ou um gesto? E se você mudasse essa ideia, o que deixaria de ser feminino, ou passaria a ser?"
suaVezPagina: 31
referencias:
  - "Judith Butler — Gender Trouble (1990)"
  - "Teresa de Lauretis — Technologies of Gender (1987)"
  - "Michel Foucault — História da sexualidade I (1976)"
  - "Kimberlé Crenshaw — Mapping the Margins (1991)"
  - "Lélia Gonzalez — Racismo e sexismo na cultura brasileira (1984)"
  - "Angela Davis — Mulheres, raça e classe"
  - "Simone de Beauvoir — O segundo sexo"
# páginas geradas por tools/gerar-edicao-01.py (não edite à mão)
paginas:
{chr(10).join(linhas)}
---

A primeira edição parte de uma pergunta simples: de onde vem aquilo que chamamos de feminino? Cores, roupas, gestos e comportamentos parecem evidentes, mas nenhum deles nasce com significado obrigatório.

Em cinco capítulos (*Não nasceu assim*, *Aprende-se a ser*, *Parece natural*, *Não existe uma fórmula* e *Nada está acabado*), o livreto percorre como o feminino é construído, transmitido e transformado em norma, e por que nenhuma definição dá conta de todas as experiências. Judith Butler, Teresa de Lauretis, Michel Foucault, Kimberlé Crenshaw e Lélia Gonzalez conversam com obras de JeongMee Yoon, Barbara Kruger, Zanele Muholi, Rosana Paulino e das Guerrilla Girls.

Não se trata de trocar uma definição por outra, mas de ampliar o que pode existir.
'''
with open('src/content/edicoes/01-o-feminino-nao-vem-de-fabrica.md', 'w', encoding='utf-8') as f:
    f.write(md)
print(len(paginas), 'páginas')
