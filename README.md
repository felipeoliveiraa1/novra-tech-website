# Novra Tech — Website

Landing page institucional da **Novra Tech** — engenharia de software, IA e cloud para operações de missão crítica.

Construída em **Astro 5**, com foco em performance, design premium (tema escuro, aurora WebGL nas cores da marca) e motion sofisticado.

## ✨ Destaques

- **Hero com aurora líquida em WebGL** (shader de ruído fbm nas cores da marca, reativo ao cursor)
- **Tipografia cinética** (reveal das palavras), smooth scroll (Lenis), reveals com blur, botões magnéticos, cursor custom
- **Imagery em duotone** da marca (cases, banda full-bleed, depoimento)
- Seções: Hero · Stats · Serviços (8) · Cases · Processo · Diferenciais · Banda · Tecnologias · Depoimento · CTA com formulário · Footer
- Responsivo, acessível (landmarks, foco visível, `prefers-reduced-motion`), SEO/OG/JSON-LD
- Build leve (HTML/CSS + ~29 kB de JS)

## 🚀 Rodando localmente

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:4321)
npm run build    # gera o site estático em /dist
npm run preview  # serve o /dist localmente
```

## 🧩 Estrutura

```
src/
  layouts/Base.astro        # head, SEO, fundo ambiente, cursor, scroll progress
  components/*.astro         # Header, Hero, Services, Cases, Process, WhyUs, Band, TechStack, Proof, CTA, Footer, Icon
  styles/global.css          # design system (tokens, tipografia, animações)
  scripts/main.js            # Lenis, reveals, contadores, magnético, cursor, aurora WebGL, formulário
public/
  brand/                     # logo e ícones (fundo removido)
  img/                       # imagens em duotone da marca
  textures/grain.svg
social/                      # kit de Instagram (posts/carrosséis prontos + galeria)
```

## ✏️ Antes de publicar (placeholders marcados com `EDITE:` no código)

- **E-mail / CTA:** `contato@novratech.com.br`
- **Formulário:** endpoint do Formspree em `src/components/CTA.astro`
- **Métricas:** números dos Stats e dos Cases (`Stats.astro`, `Cases.astro`)
- **Depoimento:** substituir por cliente real (`Proof.astro`)
- Imagens são da Unsplash (licença livre), tratadas em duotone.

## 📲 Kit de redes sociais

A pasta `social/publicar/` contém os posts e carrosséis prontos (1080×1350) organizados por pasta, cada um com a imagem e a `legenda.txt`. Abra `social/gallery.html` no navegador para visualizar.

> As páginas geradoras (`public/social-*.html`) ficam acessíveis no build; remova-as antes do deploy se não quiser que sejam públicas.

---

🤖 Desenvolvido com [Claude Code](https://claude.com/claude-code)
