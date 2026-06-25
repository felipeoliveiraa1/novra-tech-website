# Hero da NOVRA — assets para vídeo de fundo

Arquivos nesta pasta para você produzir um **vídeo de fundo** para a hero:

| Arquivo | O que é |
|---|---|
| `hero-background-1920x1080.png` | A **placa de fundo** exatamente como a hero do site (preto à esquerda + rosto sangrando do canto direito). Use como base / primeiro frame. |
| `hero-background-2560x1440.png` | Mesma placa em resolução maior (telas grandes / retina). |
| `tech-face-transparent.png` | O **rosto tecnológico** isolado (fundo transparente) — o elemento para animar. |
| `logo-art-original.png` | A **arte original** em alta (rosto + logo), maior fidelidade. |

## 🎬 Specs recomendadas para o vídeo
- **Proporção:** 16:9 · **Resolução:** 1920×1080 (mín.) ou 2560×1440
- **Formato:** `MP4 (H.264)` + idealmente um `WebM (VP9)` para leveza
- **Duração:** 8–15s em **loop perfeito** (sem corte perceptível)
- **FPS:** 24–30 · **Peso:** mire em **< 5 MB** (fundo de site precisa ser leve)
- **Áudio:** nenhum (vídeo de fundo é mudo/autoplay)

## 🧭 Regras de composição (pra casar com o layout)
1. **Metade esquerda = preto chapado.** É onde fica o texto (headline + botões). Mantenha escuro e sem movimento forte ali, senão atrapalha a leitura.
2. **Rosto à direita**, sangrando pelo canto (topo/direita cortados), dissolvendo no preto — não deixe borda reta/retângulo.
3. **Movimento sutil e premium:** anime as **linhas da rede** (dourado), pequenos **pontos de luz azuis** piscando, um leve parallax/respiração no rosto e brilhos (glints). Nada de neon exagerado nem partículas demais (segue o brandbook).
4. **Paleta:** preto · prata/cromo · azul `#2E6BFF`/`#00A8FF` · ouro `#C9A24B` só nos detalhes.

## 🔌 Como colocar no site (eu faço em 1 passo)
Quando o vídeo estiver pronto:
1. Coloque os arquivos em `public/` como `hero.mp4` (e `hero.webm` se tiver).
2. Me avise — eu troco o `<img>` do rosto por um `<video autoplay muted loop playsinline poster="...">`, mantendo o **PNG do rosto como poster** (aparece instantâneo enquanto o vídeo carrega e em conexões lentas).

Dica: dá pra animar tudo isso no After Effects, ou até em ferramentas como Runway/Canva/CapCut usando os PNGs acima como base.
