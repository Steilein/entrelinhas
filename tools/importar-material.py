"""Importa o material real do projeto (C:/Helena/Entrelinhas e C:/Helena/Fotos) para public/.

Gera:
  public/edicoes/01/pNN.webp      páginas do livreto, uma a uma (capa = p00, quarta capa = p35)
  public/edicoes/01/entrelinhas-edicao-01.pdf
  public/fotos/*.webp             ensaio fotográfico (grande e miniatura)
  public/parceiros/*.png          logos dos coletivos, recortados do fanzine
  public/pecas/*.webp             cinta, marcador e fanzine
  src/data/paginas-01.json        texto alternativo de cada página (lido do PDF)

Uso (na pasta do site): python tools/importar-material.py
"""
import io
import json
import os
import re
import shutil

import numpy as np
import pymupdf
from PIL import Image, ImageOps

RAIZ = 'C:/Helena/'
MIOLO = RAIZ + 'Entrelinhas/Miolo_Entrelinhas_Digital.pdf'
FANZINE = RAIZ + 'Entrelinhas/fanzine_entrelinhas.pdf'
PUB = 'public/'
for d in ('edicoes/01', 'fotos', 'parceiros', 'pecas'):
    os.makedirs(PUB + d, exist_ok=True)


def png(pix):
    return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')


def resumo(texto, limite=170):
    t = re.sub(r'\s\d{2}$', '', ' '.join(texto.split()))  # tira o número de página no fim
    return t if len(t) <= limite else t[:limite].rsplit(' ', 1)[0] + '…'


# ---------- livreto: cada lâmina vira duas páginas ----------
doc = pymupdf.open(MIOLO)
paginas = []  # (arquivo, alt)
LARG = 900
for i, p in enumerate(doc):
    r = p.rect
    meio = (r.x0 + r.x1) / 2
    metades = [pymupdf.Rect(r.x0, r.y0, meio, r.y1), pymupdf.Rect(meio, r.y0, r.x1, r.y1)]
    zoom = LARG / metades[0].width
    for lado, clip in enumerate(metades):
        im = png(p.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip))
        texto = p.get_text(clip=clip)
        if i == 0:
            num = 35 if lado == 0 else 0  # lâmina 1 = quarta capa | capa
        else:
            num = (i - 1) * 2 + 1 + lado
        nome = 'p%02d.webp' % num
        im.save(PUB + 'edicoes/01/' + nome, quality=78, method=6)
        if num == 0:
            alt = 'Capa: mãos em pontilhado branco sobre fundo lima e a estrela ciano com o símbolo do entrelinhas.'
        elif num == 35:
            alt = 'Quarta capa: continuação das mãos em pontilhado sobre fundo lima, com a inscrição Edição 01.'
        else:
            alt = f'Página {num:02d}. ' + (resumo(texto) if texto.strip() else 'Imagem em página inteira.')
        paginas.append((num, nome, alt))

paginas.sort()
with open('src/data/paginas-01.json', 'w', encoding='utf-8') as f:
    json.dump([{'imagem': '/edicoes/01/' + n, 'alt': a} for _, n, a in paginas], f, ensure_ascii=False, indent=2)
shutil.copyfile(PUB + 'edicoes/01/p00.webp', PUB + 'edicoes/01/capa.webp')
shutil.copyfile(MIOLO, PUB + 'edicoes/01/entrelinhas-edicao-01.pdf')

# ---------- peças ----------
fz = pymupdf.open(FANZINE)
frente = png(fz[1].get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6), clip=pymupdf.Rect(33, 33, 1223.55, 874.89)))
W, H = frente.size
pw, ph = W / 4, H / 2
lido = Image.new('RGB', (W, H), 'white')
for k in range(8):
    r, c = divmod(k, 4)
    pn = frente.crop((round(c * pw), round(r * ph), round((c + 1) * pw), round((r + 1) * ph)))
    if r == 0:
        pn = pn.rotate(180)
    lido.paste(pn, (round(c * pw), round(r * ph)))
lido.save(PUB + 'pecas/fanzine.webp', quality=80)
poster = png(fz[0].get_pixmap(matrix=pymupdf.Matrix(1.2, 1.2), clip=pymupdf.Rect(33, 33, 1223.55, 874.89))).rotate(-90, expand=True)
poster.save(PUB + 'pecas/fanzine-poster.webp', quality=80)

cinta = png(pymupdf.open(RAIZ + 'Entrelinhas/Cinta_EntreLinhas.pdf')[0].get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=pymupdf.Rect(33, 33, 874.89, 628.28)))
cinta.crop((121, 42, 1562, 383)).save(PUB + 'pecas/cinta.webp', quality=85)
marc = png(pymupdf.open(RAIZ + 'Entrelinhas/Marcador_EntreLinhas.pdf')[0].get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=pymupdf.Rect(33, 33, 628.28, 452.53)))
marc.crop((168, 110, 1022, 396)).save(PUB + 'pecas/marcador.webp', quality=85)

# ---------- parceiros: recorta cada logo do painel magenta do fanzine ----------
logos = png(fz[1].get_pixmap(matrix=pymupdf.Matrix(6, 6), clip=pymupdf.Rect(40, 778, 330, 872)))
a = np.asarray(logos).astype(int)
magenta = (abs(a[..., 0] - 230) < 40) & (a[..., 1] < 60) & (abs(a[..., 2] - 126) < 50)
cols = np.where((~magenta).sum(axis=0) > 3)[0]
grupos, ini, ant = [], cols[0], cols[0]
for x in cols[1:]:
    if x - ant > 25:
        grupos.append((ini, ant))
        ini = x
    ant = x
grupos.append((ini, ant))
grupos = [g for g in grupos if g[1] - g[0] > 80]
nomes = ['coletivo-marianas', 'marcha-mundial-das-mulheres', 'coletivo-juntas']
for nome, (x0, x1) in zip(nomes, grupos):
    rows = np.where((~magenta[:, x0:x1 + 1]).sum(axis=1) > 2)[0]
    y0, y1 = rows.min(), rows.max()
    pad = 24
    crop = logos.crop((max(0, x0 - pad), max(0, y0 - pad), min(logos.width, x1 + pad), min(logos.height, y1 + pad)))
    crop.thumbnail((520, 520), Image.LANCZOS)
    crop.save(PUB + 'parceiros/%s.png' % nome, optimize=True)
print('logos:', len(grupos))

# ---------- fotos ----------
FOTOS = ['9439', '9459', '9457', '9430', '9426', '9454', '9472', '9449', '9463', '9475', '9462', '9446', '9440', '9466']
for n in FOTOS:
    im = ImageOps.exif_transpose(Image.open(RAIZ + 'Fotos/IMG_%s.JPG' % n)).convert('RGB')
    g = im.copy()
    g.thumbnail((1600, 1600), Image.LANCZOS)
    g.save(PUB + 'fotos/%s.webp' % n, quality=78, method=6)
    t = im.copy()
    t.thumbnail((720, 720), Image.LANCZOS)
    t.save(PUB + 'fotos/%s-p.webp' % n, quality=74, method=6)
print('ok')
