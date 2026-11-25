"""Importa as imagens da galeria (pasta do Drive baixada em C:/Helena/Site/Drive) para public/.

Gera:
  public/lambes/<id>.webp e <id>-p.webp   as seis peças da campanha (três obras + três cartazes)
  public/rua/<nome>.webp e <nome>-p.webp  imagens da campanha aplicada na rua
  public/fotos/<nome>.webp e <nome>-p.webp ensaio fotográfico editado (substitui o anterior)
  public/expositores/<nome>.webp e <nome>-p.webp  simulações do expositor nos pontos de distribuição
  public/rodas/<nome>.webp e <nome>-p.webp  fotos que ilustram as rodas de conversa (do Google Doc da Helena)

Os textos (títulos, alt) ficam em src/data/galeria.json, rua.json, fotos.json e expositores.json.

Uso (na pasta do site): python tools/importar-galeria.py
"""
import glob
import os

import numpy as np
from PIL import Image, ImageOps

DRIVE = 'C:/Helena/Site/Drive/'
PUB = 'public/'
for d in ('lambes', 'rua', 'fotos', 'expositores', 'rodas'):
    os.makedirs(PUB + d, exist_ok=True)


def abrir(caminho):
    im = ImageOps.exif_transpose(Image.open(caminho))
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        fundo = Image.new('RGB', im.size, 'white')
        fundo.paste(im, mask=im.getchannel('A'))
        return fundo
    return im.convert('RGB')


def sem_moldura(im):
    """Corta a moldura preta que algumas fotos editadas trazem nas bordas."""
    a = np.asarray(im.convert('L'))
    linhas = np.where(a.mean(axis=1) > 40)[0]
    cols = np.where(a.mean(axis=0) > 40)[0]
    caixa = (cols[0], linhas[0], cols[-1] + 1, linhas[-1] + 1)
    return im.crop(caixa) if caixa != (0, 0, im.width, im.height) else im


def salvar(im, destino, grande, miniatura):
    g = im.copy()
    g.thumbnail((grande, grande), Image.LANCZOS)
    g.save(destino + '.webp', quality=80, method=6)
    t = im.copy()
    t.thumbnail((miniatura, miniatura), Image.LANCZOS)
    t.save(destino + '-p.webp', quality=76, method=6)


# ---------- peças da campanha ----------
PECAS = {
    'obra-preciso-dizer-que': 'LAMBE01_PrecisoDizerQue_entrelinhas.png',
    'obra-o-corpo': 'LAMBE02_ObraAzul_entrelinhas.PNG',
    'obra-territorios': 'LAMBE03_Territórios_entrelinhas.png',
    'cartaz-o-corpo': 'Lambe_informativo01.png',
    'cartaz-preciso-dizer-que': 'Lambe_informativo02.png',
    'cartaz-territorios': 'Lambe_informativo03.png',
}
for nome, arquivo in PECAS.items():
    salvar(abrir(DRIVE + 'peças para atualizar/' + arquivo), PUB + 'lambes/' + nome, 1800, 760)
print('peças:', len(PECAS))

# ---------- na rua ----------
rua = sorted(glob.glob(DRIVE + 'imagens simulação/NANO*'))
for caminho in rua:
    nome = os.path.splitext(os.path.basename(caminho))[0].lower()
    salvar(abrir(caminho), PUB + 'rua/' + nome, 1400, 760)
print('na rua:', len(rua))

# ---------- distribuição ----------
expositores = sorted(glob.glob(DRIVE + 'imagens expositores/NANO*'))
for caminho in expositores:
    nome = os.path.splitext(os.path.basename(caminho))[0].lower()
    salvar(abrir(caminho), PUB + 'expositores/' + nome, 1400, 760)
print('distribuição:', len(expositores))

# ---------- rodas de conversa ----------
rodas = sorted(glob.glob(DRIVE + 'imagens rodas/*'))
for caminho in rodas:
    nome = os.path.splitext(os.path.basename(caminho))[0].lower()
    salvar(abrir(caminho), PUB + 'rodas/' + nome, 1400, 760)
print('rodas:', len(rodas))

# ---------- ensaio ----------
for antigo in glob.glob(PUB + 'fotos/*.webp'):
    os.remove(antigo)
ensaio = sorted(glob.glob(DRIVE + 'ensaio fotografico/*'))
for caminho in ensaio:
    base = os.path.splitext(os.path.basename(caminho))[0]
    # IMG_9439-2 -> 9439 · _MG_8969 (1)-2 -> 8969 · IMG13-10 -> 13-10
    nome = base.replace('IMG_', '').replace('_MG_', '').replace('IMG', '').replace(' (1)', '')
    nome = nome[:-2] if nome.endswith('-2') else nome
    salvar(sem_moldura(abrir(caminho)), PUB + 'fotos/' + nome, 1600, 720)
print('ensaio:', len(ensaio))
