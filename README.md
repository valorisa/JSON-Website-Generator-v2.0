# JSON Website Generator v2.0

A universal LLM prompt-system that transforms any keyword or brief into a structured, production-ready JSON blueprint — covering design tokens, site architecture, content briefs, SEO schema, tech stack selection, accessibility and performance budgets.

### *Un prompt-système universel pour transformer n'importe quelle intention en blueprint JSON de site web production-ready*

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Philosophie de conception](#2-philosophie-de-conception)
3. [Architecture du prompt](#3-architecture-du-prompt)
4. [Phase 0 — Extraction & Parsing de l'input](#4-phase-0--extraction--parsing-de-linput)
5. [Phase 1 — Design System](#5-phase-1--design-system)
6. [Phase 2 — Architecture du site](#6-phase-2--architecture-du-site)
7. [Phase 3 — Sélection du stack technique](#7-phase-3--sélection-du-stack-technique)
8. [Phase 4 — SEO & Schema.org](#8-phase-4--seo--schemaorg)
9. [Phase 5 — Quality Gates](#9-phase-5--quality-gates)
10. [Structure du JSON de sortie](#10-structure-du-json-de-sortie)
11. [Génération automatique du sitemap.xml](#11-génération-automatique-du-sitemapxml)
12. [Protocole de chunking](#12-protocole-de-chunking)
13. [Guide d'utilisation](#13-guide-dutilisation)
14. [Exemples d'inputs et d'outputs attendus](#14-exemples-dinputs-et-doutputs-attendus)
15. [Comparatif v1 → v2](#15-comparatif-v1--v2)
16. [Limites & cas particuliers](#16-limites--cas-particuliers)
17. [FAQ](#17-faq)

---

## 1. Vue d'ensemble

Le **JSON Website Generator v2.0** est un prompt-système conçu pour être injecté dans un LLM (Claude, GPT-4, Gemini, etc.) afin de transformer n'importe quelle entrée utilisateur — aussi vague soit-elle — en un **Master Blueprint JSON** complet, structuré et directement exploitable pour piloter la création d'un site web de bout en bout.

L'outil agit comme un **orchestrateur de décisions** : il prend en charge la stratégie de design, l'architecture des pages, le contenu éditorial, le SEO technique, le choix du stack, l'accessibilité, les performances et la conformité légale, en un seul objet JSON cohérent.

### Ce que produit le générateur

Un objet JSON unique (`master_blueprint`) composé de six blocs majeurs :

```
master_blueprint
├── meta               → identité du projet, scores de confiance, ordre d'exécution
├── design_system      → tokens de couleurs, typographie, espacement, motion, breakpoints
├── site_structure     → routes, sections, content briefs, SEO par page
├── tech_stack         → framework, CMS, analytics, tests, CI/CD, i18n
├── seo_schema         → JSON-LD Schema.org multi-types via @graph
└── performance_budget → cibles KB par ressource + checklist de lancement
```

Ce blueprint est conçu pour être consommé par :
- Un développeur qui scaffold un projet
- Un second prompt LLM qui génère directement le code
- Un outil no-code/low-code qui parse le JSON pour créer les pages
- Un chef de projet qui coordonne copywriters, designers et devs

---

## 2. Philosophie de conception

### Zéro biais sectoriel

La règle fondamentale du générateur est qu'**aucune donnée n'est inventée ou supposée**. Chaque champ du blueprint doit être soit déduit de l'input utilisateur, soit marqué comme valeur par défaut neutre (`[DEFAULT]`), soit marqué comme à clarifier (`[À CLARIFIER]`).

Cela évite le problème classique des générateurs IA qui "hallucinent" des valeurs plausibles : un nom de marque inventé, des mots-clés SEO hors-sujet, une palette de couleurs génériques copiée de la concurrence.

### Confiance progressive

Le générateur n'émet jamais un blueprint à moitié valide. Il opère sur un **score de confiance** calculé à partir du nombre de dimensions extraites de l'input :

- **High** (≥ 5 dimensions vérifiées) → génération complète
- **Medium** (3–4 dimensions) → génération avec `default_fallback: true` et notes explicites
- **Low** (< 3 dimensions) → arrêt total et demande de clarification

Ce design évite qu'un input vague comme `"site web"` produise un blueprint qui semble complet mais est en réalité entièrement inventé.

### Tokens plutôt que valeurs

Tous les champs inconnus sont exprimés en **placeholders `{{VARIABLE}}`** plutôt qu'en valeurs inventées. Cela permet à l'outil en aval (développeur, second prompt, parser) de savoir exactement ce qui doit être complété versus ce qui a été dérivé de l'input.

### Production-ready by design

Chaque champ du blueprint est pensé pour être directement utilisable dans du code réel :
- Les couleurs sont en HSL (calculables par code, pas juste affichables)
- La typographie suit une échelle modulaire (ratio 1.25, standard industrie)
- Les tokens motion respectent `prefers-reduced-motion`
- Les breakpoints correspondent aux conventions Tailwind CSS
- Le SEO inclut tous les champs requis par Google Search Console, les réseaux sociaux et les outils d'audit

---

## 3. Architecture du prompt

Le prompt est structuré en **6 phases séquentielles** qui s'exécutent dans l'ordre avant que le JSON soit émis. Cette structure pipeline garantit que chaque décision est prise dans le bon ordre et que les décisions aval dépendent des décisions amont (ex. : le choix du stack dépend du secteur et des contraintes, lui-même déduit en Phase 0).

```
Phase 0  →  Extraction de l'input (7 dimensions)
Phase 1  →  Dérivation du design system
Phase 2  →  Architecture du site (routes + sections)
Phase 3  →  Sélection conditionnelle du stack technique
Phase 4  →  Configuration SEO & Schema.org
Phase 5  →  Quality gates (vérification avant émission)
         ↓
     JSON output
```

Chaque phase est **auto-contenue** : elle a des inputs définis (les dimensions extraites en Phase 0 ou les décisions des phases précédentes) et des outputs définis (les blocs du JSON final).

---

## 4. Phase 0 — Extraction & Parsing de l'input

### Les 7 dimensions

C'est la phase la plus critique du générateur. Avant toute génération, le LLM doit extraire 7 dimensions de l'input utilisateur. Si une dimension ne peut pas être déduite avec certitude, elle reçoit sa valeur par défaut et est marquée `[DEFAULT]`.

| Dimension | Ce qu'elle capture | Exemple extrait | Défaut |
|---|---|---|---|
| `sector` | Domaine d'activité ou industrie | `"cabinet_avocat"` | `"general_services"` |
| `target_audience` | À qui s'adresse le site | `"PME cherchant conseil juridique"` | `"broad_public"` |
| `tone_vibe` | Registre émotionnel attendu | `"professionnel, rassurant"` | `"professional_neutral"` |
| `primary_goal` | Action principale attendue du visiteur | `"prendre rendez-vous"` | `"generate_leads"` |
| `brand_name` | Nom de la marque ou de l'entreprise | `"Dupont & Associés"` | `"{{BRAND_NAME}}"` |
| `locale_lang` | Langue et région cibles | `"fr-FR"` | `"fr-FR"` |
| `constraints` | Contraintes techniques, budget, exigences | `["CMS_required", "budget_low"]` | `[]` |

### Règle de confiance

```
≥ 5 dimensions vérifiées  →  input_confidence: "high"   → génération complète
3–4 dimensions vérifiées  →  input_confidence: "medium"  → génération + default_fallback: true
< 3 dimensions vérifiées  →  input_confidence: "low"     → ARRÊT + demande de clarification
```

**Pourquoi arrêter à < 3 ?** Parce qu'en dessous de ce seuil, le générateur n'a pas assez de signal pour prendre des décisions cohérentes. Un blueprint généré sur `"site web"` sans secteur, sans audience, sans objectif serait entièrement fictif et donc inutilisable, voire trompeur.

### Exemple d'extraction

Input utilisateur : `"landing page pour mon app de méditation"`

```
sector          → "wellbeing_app"          [VERIFIED]
target_audience → "utilisateurs mobiles cherchant réduction de stress"  [VERIFIED]
tone_vibe       → "calme, bienveillant, minimaliste"  [VERIFIED]
primary_goal    → "téléchargement app / inscription"  [VERIFIED]
brand_name      → [À CLARIFIER]            [DEFAULT]
locale_lang     → "fr-FR"                 [VERIFIED — contexte conversationnel]
constraints     → []                       [DEFAULT]

input_confidence: "high" (5 dimensions vérifiées)
```

---

## 5. Phase 1 — Design System

La Phase 1 dérive un **design system complet** à partir du `tone_vibe` et du `sector` extraits en Phase 0. C'est ici que la v2 fait le plus grand bond qualitatif par rapport à la v1.

### 5.1 Système de couleurs

La v1 se contentait de 4 valeurs hex (`primary`, `secondary`, `accent`, `neutral`). La v2 dérive un **système de tokens sémantiques complet** avec des paires dark-mode explicites, exprimé en HSL.

**Pourquoi HSL ?** Parce que HSL permet de calculer les variantes par programme : `primary-dark` est simplement `primary` avec `lightness + 20%`. Un générateur de code ou un développeur peut en dériver automatiquement tous les états (hover, active, disabled) sans ouvrir Figma.

**Palette complète :**

```
Tokens de couleur (mode clair)
├── primary         → couleur d'action dominante (CTA, liens, highlights)
├── primary-hover   → primary assombri de ~8% pour les états hover
├── secondary       → couleur de support / décorative
├── accent          → couleur de contraste (< 10% de la surface UI)
├── neutral-900     → couleur des titres (quasi-noir)
├── neutral-700     → couleur du corps de texte (gris foncé)
├── neutral-400     → couleur des placeholders et éléments désactivés
├── neutral-100     → fonds de cartes et zones légères
├── surface         → fond de page
├── border          → couleur des séparateurs et contours (10–15% opacité)
└── sémantiques     → success, warning, error, info

Tokens de couleur (mode sombre)
├── primary         → primary clair + lightness +20%
├── neutral-900     → proche blanc
├── neutral-700     → gris clair
├── neutral-100     → gris très foncé
├── surface         → quasi-noir
└── border          → blanc à 10% d'opacité
```

### 5.2 Échelle typographique

La v1 avait deux polices et deux graisses. La v2 implémente une **échelle modulaire ratio 1.25** (Major Third), standard dans les systèmes de design modernes (Material Design, Tailwind, Radix).

```
font-xs:  0.75rem   →  légendes, labels mineurs
font-sm:  0.875rem  →  texte auxiliaire, footnotes
font-md:  1rem      →  corps de texte (base, line-height 1.6)
font-lg:  1.25rem   →  sous-titres de section
font-xl:  1.563rem  →  titres de section (H2)
font-2xl: 1.953rem  →  titres de page secondaires
font-3xl: 2.441rem  →  headline hero
font-4xl: 3.052rem  →  display / impact (campagnes, hero fort)
```

Trois rôles typographiques distincts :
- **Heading** : famille serif ou sans-serif premium, graisse 600–700, tracking négatif (-0.02em)
- **Body** : famille lisible, graisse 400, line-height 1.6
- **Label** : même famille que body, graisse 500, tracking légèrement positif (0.01em)
- **Mono** : famille monospace pour code, graisse 400

### 5.3 Échelle d'espacement

Base de **4px** (convention Tailwind / Material). L'échelle suit une progression géométrique approximative qui garantit des proportions harmonieuses à toutes les tailles :

```
4px  → spacing-xs  (marges internes minimes, gaps iconiques)
8px  → spacing-sm  (padding boutons compacts, gaps inline)
12px → (intermédiaire non nommé)
16px → spacing-md  (padding standard, gap de grille mobile)
24px → (intermédiaire)
32px → spacing-lg  (gap de grille desktop, padding sections internes)
48px → (intermédiaire)
64px → spacing-xl  (marges entre sections majeures)
96px → spacing-2xl (marges de page sur desktop)
128px→ (réservé aux espacements hero)
```

### 5.4 Tokens de motion

La v2 introduit un système de **tokens d'animation** directement exploitables en CSS ou Framer Motion, incluant la gestion obligatoire de `prefers-reduced-motion` :

```
duration-fast:  150ms  →  états hover, apparition tooltips
duration-base:  300ms  →  ouverture modals, transitions de page
duration-slow:  600ms  →  reveals au scroll, animations d'entrée
easing-default: cubic-bezier(0.4, 0, 0.2, 1)   →  standard Material
easing-spring:  cubic-bezier(0.34, 1.56, 0.64, 1) →  rebond naturel
```

La règle `reduced-motion` coupe toutes les durées à 0ms pour les utilisateurs ayant activé ce réglage système. C'est une exigence WCAG 2.2 et une bonne pratique pour les utilisateurs épileptiques ou sensibles aux mouvements.

### 5.5 Breakpoints

Les breakpoints correspondent exactement aux breakpoints par défaut de Tailwind CSS, ce qui permet une intégration sans friction :

```
xs:  375px  →  iPhone SE, portrait
sm:  640px  →  mobile landscape, petits Android
md:  768px  →  iPad portrait
lg:  1024px →  iPad landscape, petit laptop
xl:  1280px →  laptop standard 13"–15"
2xl: 1536px →  grand écran, iMac
```

### 5.6 Variantes stylistiques

Trois profils de style, sélectionnés automatiquement en fonction du `tone_vibe` et du `sector` :

#### `clean_modern`
Recommandé pour : SaaS, outils, startups tech, applications B2B.
Caractéristiques : border-radius 8px, ombres douces, espacement généreux, typographie légère. Crée une impression de fiabilité et de clarté sans lourdeur institutionnelle.

#### `bold_editorial`
Recommandé pour : mode, médias, culture, luxe, agences créatives.
Caractéristiques : border-radius 0–4px (angles francs), contraste fort, typographie display massive, grilles asymétriques. Prend de la place, crée de l'impact, assume son identité.

#### `structured_pro`
Recommandé pour : droit, finance, santé, institutions publiques.
Caractéristiques : border-radius 4px, grille 12 colonnes stricte, palette désaturée, boutons en style outlined. Inspire confiance et sérieux sans être intimidant.

---

## 6. Phase 2 — Architecture du site

### Structure modulaire standard

La Phase 2 génère l'ensemble de la `site_structure` : la liste des routes, avec pour chacune ses sections, ses briefs de contenu et ses métadonnées SEO.

La structure modulaire par défaut est :

```
/                        →  Home / Landing (awareness)
/[offer-slug]            →  Page d'offre ou de produit (consideration)
/about                   →  Histoire de la marque, équipe, mission (trust)
/[resources|blog|guides] →  Hub de contenu (SEO organique, authority)
/contact                 →  Point de conversion (decision)
/legal/privacy           →  Politique de confidentialité (conformité RGPD)
/legal/terms             →  CGU / Mentions légales (conformité)
```

Cette structure peut être enrichie ou réduite selon le secteur : un portfolio n'aura pas de `/blog`, un e-commerce ajoutera `/shop` et `/product/[slug]`.

### Content Brief par section

Chaque section de chaque page reçoit un **content brief complet**, qui sert de cahier des charges éditorial pour le copywriter ou pour un second prompt de génération de contenu.

Un content brief section comprend :

**`section_id`** : identifiant unique de la section (ex. `hero`, `social_proof`, `features`, `pricing`, `faq`, `conversion_cta`)

**`layout_pattern`** : pattern de mise en page parmi les layouts courants :
- `split_text_image` : texte à gauche, image à droite (ou inversé)
- `centered_hero` : contenu centré, fond plein
- `fullwidth_video` : vidéo de fond avec overlay texte
- `grid_3col` : grille de 3 cartes
- `alternating_image_text` : alternance image/texte par item
- `logo_strip` : bande de logos clients
- `testimonial_carousel` : carousel de témoignages
- `centered_band` : bande colorée avec CTA centré

**`content_hierarchy`** : la hiérarchie éditoriale de la section :
- `h1` / `h2` : suggestion de headline (pas un texte final, une direction)
- `subheadline` : accroche de soutien
- `body_copy` : plage de mots + format (paragraphes courts, liste, etc.)
- `cta_primary` / `cta_secondary` : label + destination + style visuel
- `social_proof_hint` : type et quantité de preuve sociale attendue

**`tone_matrix`** : 5 dimensions tonales notées de 0 à 10, qui guident le copywriter sur l'équilibre à trouver pour cette section spécifique. Par exemple, le hero aura un score d'urgence modéré (5/10) mais la section CTA finale aura un score d'urgence élevé (8/10). La section "À propos" sera très chaude (warm: 9) mais peu formelle (formal: 2).

```json
"tone_matrix": {
  "formal":        0,
  "warm":          7,
  "authoritative": 6,
  "playful":       3,
  "urgent":        5
}
```

**`seo_brief`** : les mots-clés primaires, secondaires et le champ sémantique de la section :
- `primary_kw` : 1–2 mots-clés à positionner en priorité
- `secondary_kw` : mots-clés de longue traîne
- `semantic_field` : termes du vocabulaire du secteur à intégrer naturellement

**`content_pillars`** : les 2–3 arguments-clés qui doivent ressortir de cette section.

**`micro_interactions`** : liste des animations d'entrée et effets hover attendus (ex. `fade_in_up`, `stagger_children`, `hover_lift`).

**`a11y_notes`** : notes spécifiques à l'accessibilité pour cette section (ex. "le H1 doit être le premier heading de la page", "le CTA générique 'En savoir plus' doit avoir un aria-label explicite").

**`user_journey_stage`** : étape du tunnel de conversion à laquelle correspond la page (awareness → consideration → decision → retention).

---

## 7. Phase 3 — Sélection du stack technique

La v1 laissait le `tech_stack` entièrement vide avec des `{{PLACEHOLDERS}}`. La v2 implémente une **logique de sélection conditionnelle** basée sur les contraintes, le secteur et l'objectif principal extraits en Phase 0.

### Arbre de décision

```
SI constraints.cms_required = true
  → CMS : WordPress | Sanity | Strapi | Contentful
  (choix selon budget : WordPress = low, Sanity = mid, Contentful = enterprise)

SINON SI sector ∈ ["saas", "app", "outil", "plateforme"]
  → Frontend : Next.js 14 (App Router)
  → Styling  : Tailwind CSS
  → Animation: Framer Motion
  → Host     : Vercel

SINON SI primary_goal = "showcase" OU sector ∈ ["portfolio", "agence", "créatif"]
  → Frontend : Astro 4
  → Styling  : Tailwind CSS
  → Animation: GSAP ScrollTrigger
  → Host     : Netlify

SINON SI constraints.budget = "low" OU constraints.static = true
  → Frontend : Astro 4 (mode static)
  → Styling  : Tailwind CSS
  → Animation: CSS-only (pas de lib JS)
  → Host     : Netlify (gratuit)

PAR DÉFAUT
  → Frontend : Next.js 14
  → Styling  : Tailwind CSS
  → Animation: Framer Motion
  → Host     : Vercel
```

### Outils transversaux (toujours inclus)

Certains outils sont systématiquement inclus quel que soit le profil du projet, car ils relèvent des bonnes pratiques non-négociables :

| Catégorie | Outil | Justification |
|---|---|---|
| Analytics | GA4 + Plausible | GA4 pour la richesse des données, Plausible comme fallback privacy-first (RGPD sans bannière cookie) |
| Error monitoring | Sentry | Capture des erreurs runtime en production, alerting |
| Perf monitoring | Web Vitals API | Mesure continue des Core Web Vitals (LCP, CLS, FID) |
| Tests unitaires | Vitest | Compatible Vite/Next.js, rapide, syntaxe Jest-compatible |
| Tests E2E | Playwright | Multi-navigateurs, stable, maintenu par Microsoft |
| Tests a11y | axe-core | Détecte ~57% des violations WCAG automatiquement |
| CI/CD | GitHub Actions | Gratuit jusqu'à 2000 min/mois, intégration native GitHub |
| Formulaires | React Hook Form + Zod | Validation typée, performances, zéro re-render inutile |

### Internationalisation

Le champ `i18n` est conditionnel : il est peuplé si `locale_lang` contient plusieurs locales ou si le secteur est international par nature. Options :
- `next-intl` : pour les projets Next.js
- `i18next` : solution universelle multi-framework
- `null` : si le site est mono-langue confirmé

---

## 8. Phase 4 — SEO & Schema.org

### Champs SEO obligatoires par page

La v1 avait un SEO minimal (title, meta_desc, og_hint). La v2 impose **12 champs SEO par page** couvrant tous les canaux d'indexation et de partage :

| Champ | Limite | Usage |
|---|---|---|
| `title_tag` | ≤ 60 chars | Onglet navigateur + résultat Google |
| `meta_description` | ≤ 155 chars | Extrait Google (non-ranking, mais taux de clic) |
| `og_title` | ≤ 70 chars | Titre affiché lors du partage social |
| `og_description` | ≤ 200 chars | Description lors du partage social |
| `og_image_hint` | — | Description de l'image idéale (1200×630) |
| `twitter_card` | — | Type de card Twitter (`summary_large_image`) |
| `canonical` | — | URL canonique pour éviter le duplicate content |
| `hreflang` | — | Déclaration des variantes linguistiques |
| `robots` | — | Directives d'indexation (`index, follow` par défaut) |
| `sitemap` | — | Présence dans le sitemap.xml (`true`) |
| `structured_data` | — | Référence au bloc JSON-LD Schema.org |

### Schema.org via @graph

La v2 utilise le pattern `@graph` de Schema.org plutôt qu'un seul `@type`, ce qui permet de déclarer **plusieurs types d'entités dans un seul bloc JSON-LD** sans duplication :

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", ... },
    { "@type": "WebSite", "potentialAction": { "@type": "SearchAction" } }
  ]
}
```

Le `SearchAction` dans `WebSite` permet à Google d'afficher un champ de recherche dans les résultats pour le site (sitelinks search box).

### Correspondance @type par page

| Type de page | @type Schema.org |
|---|---|
| Landing / Home | `Organization` + `WebSite` + `SearchAction` |
| Page produit ou service | `Service` ou `Product` ou `SoftwareApplication` |
| Article de blog | `Article` + `BreadcrumbList` |
| Business local | `LocalBusiness` + `GeoCoordinates` + `OpeningHoursSpecification` |
| Page e-commerce | `Product` + `Offer` + `AggregateRating` |
| Page FAQ | `FAQPage` + `Question` + `Answer` |

---

## 9. Phase 5 — Quality Gates

Avant d'émettre le JSON, le LLM doit vérifier mentalement 8 gates binaires. Si l'un d'eux échoue, la correction est effectuée avant l'émission — le JSON corrigé n'est pas émis avec le gate échoué.

| Gate | Critère | Conséquence si ✗ |
|---|---|---|
| **JSON validity** | RFC 8259 parseable, pas de virgule trailing | Corriger la syntaxe |
| **Completeness** | UX, contenu, SEO, tech, assets, a11y, perf tous couverts | Compléter les blocs manquants |
| **No hallucinations** | Toute valeur est déduite de l'input ou marquée `[DEFAULT]` | Remplacer par `{{PLACEHOLDER}}` ou `[DEFAULT]` |
| **Placeholders honest** | `{{VAR}}` uniquement pour les valeurs réellement inconnues | Supprimer les placeholders là où une valeur peut être déduite |
| **Schema valid** | `@type` correspond bien au type de page | Corriger le type Schema.org |
| **Dark mode paired** | Chaque couleur a sa contrepartie dark-mode | Ajouter les tokens manquants |
| **Responsive covered** | Tous les breakpoints sont présents dans `design_system` | Ajouter les breakpoints manquants |
| **Motion accessible** | Token `reduced_motion` présent et correct | Ajouter la media query |

Ces gates remplacent le "TRIBUNAL" de la v1 qui était conceptuel et non actionnable.

---

## 10. Structure du JSON de sortie

### Vue d'ensemble de l'objet `master_blueprint`

```
master_blueprint
│
├── meta
│   ├── version, generator
│   ├── input_confidence ("high" | "medium" | "low")
│   ├── default_fallback (boolean)
│   ├── locale, brand_name, sector, target_audience, tone_vibe, primary_goal
│   ├── constraints []
│   ├── quality_targets
│   │   ├── lighthouse_min: 90
│   │   ├── lcp_ms_max: 2500
│   │   ├── cls_max: 0.1
│   │   ├── fid_ms_max: 100
│   │   ├── wcag: "2.2 AA"
│   │   ├── bundle_js_kb_max: 150
│   │   └── bundle_css_kb_max: 30
│   ├── execution_order []      ← pipeline d'orchestration
│   ├── chunking {}             ← protocole de découpage si > 1500 tokens
│   └── style_recommendation   ← justification en 1 phrase du variant choisi
│
├── design_system
│   ├── colors { light: {}, dark: {} }
│   ├── typography { scale_ratio, base_px, heading, body, label, mono, sizes }
│   ├── spacing { base_unit_px, scale [], semantic {} }
│   ├── borders { radius {}, width {} }
│   ├── shadows { none, sm, md, lg, focus }
│   ├── motion { durations, easings, reduced }
│   ├── breakpoints {}
│   ├── components []
│   ├── style_variants []       ← 3 variantes avec css_overrides
│   ├── recommended_variant     ← ID du variant sélectionné
│   ├── asset_strategy
│   │   ├── images { hint, formats, ratios, loading, srcset, cdn }
│   │   ├── icons { style, library, implementation }
│   │   ├── videos { hint, formats, lazy, poster, autoplay, playsinline }
│   │   └── fonts { source, display, preload, fallback_stack, subset }
│   ├── a11y { target, contrast_min, focus_style, skip_link, aria_landmarks, reduced_motion }
│   └── dark_mode { strategy, implementation, storage }
│
├── site_structure []
│   └── [par page]
│       ├── route, page_title
│       ├── seo { title_tag, meta_description, og_*, twitter_card, canonical, hreflang, robots, schema_type }
│       ├── user_journey_stage
│       └── sections []
│           └── [par section]
│               ├── section_id, layout_pattern
│               ├── content_hierarchy { h1, subheadline, body_copy, cta_primary, cta_secondary, social_proof_hint }
│               ├── tone_matrix { formal, warm, authoritative, playful, urgent }
│               ├── seo_brief { primary_kw, secondary_kw, semantic_field }
│               ├── content_pillars []
│               ├── micro_interactions []
│               └── a11y_notes
│
├── tech_stack
│   ├── frontend, styling, animation, cms, state_management
│   ├── forms, analytics, error_monitoring, perf_monitoring
│   ├── testing { unit, e2e, a11y }
│   ├── host, cdn, cicd, env_secrets, i18n
│
├── seo_schema
│   ├── @context, @graph []
│   └── [Organisation + WebSite + SearchAction]
│
├── performance_budget
│   ├── js_kb_max: 150
│   ├── css_kb_max: 30
│   ├── image_kb_max_hero: 200
│   ├── total_page_weight_kb_max: 800
│   ├── third_party_scripts_max: 3
│   └── font_files_max: 2
│
└── launch_checklist []
    ├── favicon.ico + apple-touch-icon.png
    ├── robots.txt
    ├── sitemap.xml
    ├── page 404 on-brand
    ├── Cookie consent banner (RGPD si EU)
    ├── /legal/privacy + /legal/terms
    ├── OG image (1200×630)
    ├── Lighthouse audit ≥ 90
    ├── axe-core 0 violations
    ├── Cross-browser (Chrome, Firefox, Safari, Edge)
    └── Mobile (iOS Safari 15+, Chrome Android)
```

### Champ `execution_order`

Le champ `meta.execution_order` définit l'ordre dans lequel les étapes de création doivent être exécutées, que ce soit par un humain, un script ou un second LLM :

```json
"execution_order": [
  "parse_input",
  "derive_design_tokens",
  "scaffold_routes",
  "inject_content_briefs",
  "configure_tech_stack",
  "generate_seo_schema",
  "a11y_audit",
  "perf_budget_check",
  "deploy_pipeline"
]
```

Cet ordre est intentionnel : on définit les tokens de design avant de scaffolder les routes, car les routes référencent les tokens. On injecte les content briefs après les routes, car les briefs sont liés aux sections des routes. L'audit a11y et le budget perf viennent en dernier car ils valident le résultat, pas le définissent.

---

## 11. Génération automatique du sitemap.xml

Le bloc `site_structure` du blueprint contient toutes les informations nécessaires pour générer un `sitemap.xml` production-ready sans aucune saisie manuelle supplémentaire : routes, URLs canoniques, directives `robots`, `hreflang` par locale et type de page. Le script `generate-sitemap.mjs` inclus dans ce repo exploite directement ces données pour produire un fichier conforme au **Sitemaps Protocol 0.9**, le seul standard reconnu nativement par Google, Bing et l'ensemble des crawlers SEO. Il n'a aucune dépendance externe et tourne sur Node.js 18+ natif. Le script applique automatiquement une logique de filtrage (exclusion des routes `noindex`, des pages `/legal`, des routes encore en placeholder `{{}}`) et calcule les valeurs de `changefreq` et `priority` selon le type de route — la page d'accueil obtient toujours `priority: 1.0` et `changefreq: weekly`, les articles de blog `0.7 / weekly`, les pages statiques `0.8 / monthly`. Si le blueprint déclare des entrées `hreflang`, les balises `xhtml:link` correspondantes sont automatiquement insérées dans chaque entrée `<url>`. Le fichier de sortie est déposable directement dans le dossier `public/` de n'importe quel framework (Next.js, Astro, Nuxt) ou à la racine d'un hébergement statique, sans modification.

```bash
# Usage standard
node generate-sitemap.mjs --blueprint ./blueprint.json --domain https://ton-domaine.com

# Avec chemin de sortie explicite (convention Next.js / Astro)
node generate-sitemap.mjs --blueprint ./blueprint.json \
  --domain https://ton-domaine.com \
  --output ./public/sitemap.xml
```

---

> Ce paragraphe est volontairement dense et technique parce qu'il s'adresse à quelqu'un qui lit un README de repo GitHub — il veut savoir exactement ce que fait le script, pourquoi il n'a pas à installer de lib, et comment l'intégrer en deux commandes.

---

## 12. Protocole de chunking

### Pourquoi le chunking est nécessaire

Un blueprint complet pour un site de 6 pages avec un design system riche peut facilement dépasser 3000–5000 tokens en JSON. Certains LLMs ont des limites de contexte de sortie, et les interfaces utilisateur peuvent tronquer des réponses trop longues.

### Découpage en 3 parties

Quand la sortie estimée dépasse **1500 tokens**, le générateur découpe le blueprint en 3 parties logiquement cohérentes :

```
Partie 1/3  →  meta + design_system
             (fondations : identité, tokens, variants)

Partie 2/3  →  site_structure
             (contenu : toutes les routes, sections, briefs SEO)

Partie 3/3  →  tech_stack + seo_schema + performance_budget + launch_checklist
             (implémentation : stack, données structurées, budget, checklist)
```

### Marqueur de chunk

Chaque partie ouvre avec un bloc `_chunk` qui indique la position, le total et le prompt de continuation :

```json
{
  "_chunk": {
    "part": 1,
    "total": 3,
    "next_prompt": "Continue JSON Website Generator part 2"
  },
  "master_blueprint": { ... }
}
```

Le champ `reconstruction_order` dans `meta.chunking` indique l'ordre de réassemblage pour les outils qui consomment le blueprint en plusieurs appels :

```json
"reconstruction_order": ["meta", "design_system", "site_structure", "tech_stack", "seo"]
```

---

## 13. Guide d'utilisation

### Usage minimal

Copier le contenu du prompt complet `json-website-generator-v2.md` dans le system prompt d'un LLM compatible, puis envoyer en message utilisateur :

```
site vitrine pour un architecte d'intérieur parisien haut de gamme
```

Le générateur extrait les dimensions, dérive le design system, génère le blueprint.

### Usage avec contraintes explicites

Pour maximiser la qualité du blueprint, enrichir l'input avec des contraintes :

```
Application SaaS de gestion de facturation pour freelances, 
public : indépendants tech en France, 
objectif : trial gratuit → conversion payante, 
stack imposé : Next.js + Prisma, 
budget : moyen, 
langue : fr-FR avec fallback en-GB
```

Plus l'input est riche, plus `input_confidence` sera élevé et plus le blueprint sera précis.

### Usage en pipeline

Le blueprint peut être utilisé comme entrée d'un second prompt de génération de code :

```
Prompt 2 : "À partir de ce Master Blueprint JSON, génère le fichier 
            tailwind.config.js avec tous les tokens du design_system"

Prompt 3 : "À partir de ce Master Blueprint JSON, génère le composant 
            React HeroSection correspondant à la section hero de la route /"

Prompt 4 : "À partir de ce Master Blueprint JSON, génère le fichier 
            next-sitemap.config.js pour toutes les routes de site_structure"
```

### Usage en orchestration no-code

Pour une intégration dans un outil no-code/low-code ou un script Python/Node :

```python
import json, anthropic

blueprint = json.loads(llm_response)

# Extraire les tokens de couleur pour les injecter dans un theme
colors = blueprint["master_blueprint"]["design_system"]["colors"]["light"]

# Itérer sur les routes pour créer les pages
for page in blueprint["master_blueprint"]["site_structure"]:
    create_page(page["route"], page["sections"])

# Extraire le JSON-LD pour le <head>
schema = blueprint["master_blueprint"]["seo_schema"]
```

---

## 14. Exemples d'inputs et d'outputs attendus

### Exemple 1 — Input minimal

**Input :** `"cabinet dentaire"`

**Dimensions extraites :**
- sector: `"healthcare_dental"` [VERIFIED]
- target_audience: `"patients locaux"` [VERIFIED]
- tone_vibe: `"rassurant, professionnel"` [DEFAULT]
- primary_goal: `"prendre rendez-vous"` [VERIFIED]
- brand_name: `[À CLARIFIER]`
- locale_lang: `"fr-FR"` [DEFAULT]
- constraints: `[]`

**input_confidence :** `"medium"` (3 VERIFIED, default_fallback: true)

**Variant sélectionné :** `structured_pro`
**Stack sélectionné :** Next.js 14 (secteur non-SaaS, objectif lead)
**Schema.org :** `LocalBusiness` + `MedicalBusiness` + `OpeningHoursSpecification`

---

### Exemple 2 — Input riche

**Input :** `"SaaS B2B de gestion de notes de frais pour PME, public CFO et comptables, objectif trial gratuit 14j, stack Next.js imposé, budget moyen, fr-FR"`

**Dimensions extraites :**
- sector: `"fintech_b2b_saas"` [VERIFIED]
- target_audience: `"CFO et comptables de PME (50–500 salariés)"` [VERIFIED]
- tone_vibe: `"professionnel, efficace, rassurant"` [VERIFIED]
- primary_goal: `"démarrer trial gratuit"` [VERIFIED]
- brand_name: `[À CLARIFIER]`
- locale_lang: `"fr-FR"` [VERIFIED]
- constraints: `["stack:next.js", "budget:medium"]` [VERIFIED]

**input_confidence :** `"high"` (5 VERIFIED)
**Variant sélectionné :** `clean_modern`
**Stack sélectionné :** Next.js 14 (imposé par contrainte + validé par secteur SaaS)
**Schema.org :** `SoftwareApplication` + `WebSite` + `SearchAction`

---

## 15. Comparatif v1 → v2

| Dimension | v1 | v2 |
|---|---|---|
| **Extraction input** | 5 champs vagues, pas de scoring | 7 dimensions avec scoring confiance (high/medium/low) |
| **Arrêt si input insuffisant** | Non — génère quand même | Oui — halt si < 3 dimensions |
| **Système de couleurs** | 4 hex (primary, secondary, accent, neutral) | Palette sémantique complète, paires dark-mode, HSL |
| **Typographie** | 2 polices, 2 graisses | Échelle modulaire ratio 1.25, 8 tailles, 4 rôles |
| **Espacement** | Absent | Échelle 4px, 10 stops, tokens sémantiques |
| **Motion** | Absent | 3 durées, 2 easings, reduced-motion obligatoire |
| **Breakpoints** | Absent | 6 breakpoints alignés Tailwind |
| **Variantes de style** | 3 variantes avec quelques overrides | 3 variantes avec css_overrides complètes + `recommended_for` |
| **Dark mode** | `"auto"` (string vague) | Stratégie complète : CSS custom props, localStorage, toggle |
| **Tech stack** | `{{PLACEHOLDERS}}` vides | Logique conditionnelle if/else complète |
| **Testing** | Absent | Vitest + Playwright + axe-core |
| **Analytics** | Absent | GA4 + Plausible |
| **Monitoring** | Absent | Sentry + Web Vitals API |
| **i18n** | Absent | next-intl / i18next conditionnel |
| **SEO** | title + meta_desc + og_hint | 12 champs par page : og_*, twitter_card, canonical, hreflang, robots |
| **Schema.org** | 1 @type unique | @graph multi-types avec SearchAction |
| **Content brief** | tone_matrix basique + word_count | Hiérarchie complète : h1, subheadline, body, CTA primaire + secondaire, social proof |
| **A11y** | Mention WCAG 2.2 AA | Contrast min, skip_link, ARIA landmarks, focus style, a11y_notes par section |
| **Performance budget** | Absent | Cibles KB par ressource (JS, CSS, images, total, fonts) |
| **Quality gates** | "TRIBUNAL" conceptuel | 8 gates binaires vérifiables |
| **Chunking** | Mentionné mais non défini | Protocole complet : 3 parties, marqueurs, reconstruction_order |
| **Launch checklist** | Absent | 11 items incluant RGPD, favicon, cross-browser |
| **User journey** | Absent | `user_journey_stage` par page (awareness → decision → retention) |

---

## 16. Limites & cas particuliers

### Ce que le générateur ne fait pas

- **Ne génère pas de code** : il produit un blueprint, pas du HTML/CSS/JSX. Il sert d'input à un générateur de code.
- **Ne fait pas de recherche web** : il ne vérifie pas les mots-clés SEO en temps réel, ne scrape pas la concurrence, ne valide pas la disponibilité des noms de domaine.
- **Ne valide pas les couleurs visuellement** : les couleurs HSL sont des suggestions dérivées du vibe, pas le résultat d'un audit visuel.
- **Ne remplace pas un designer** : le design system est un point de départ, pas une identité visuelle finalisée.

### Cas particuliers

**Input en anglais** : le générateur s'adapte. Les valeurs extraites et les hints de contenu seront en anglais, `locale_lang` sera `"en-US"` ou `"en-GB"`.

**Secteur très niche** : si le secteur est inhabituel (ex. `"fabricant de vitraux alsaciens"`), certains champs ne pourront pas être dérivés avec certitude. Ils seront marqués `[DEFAULT]` et le `default_fallback` sera activé même si `input_confidence` est "high" sur les autres dimensions.

**Contraintes contradictoires** : ex. `"budget très faible"` + `"CMS headless Contentful"`. Le générateur applique une fusion sémantique neutre et documente la contradiction dans `meta.constraints` avec une note.

**Site multilingue** : si plusieurs locales sont détectées, `locale_lang` contiendra un tableau (`["fr-FR", "en-GB"]`) et `i18n` sera peuplé avec la solution recommandée. Les `hreflang` SEO seront complétés pour chaque locale.

---

## 17. FAQ

**Q : Peut-on utiliser ce prompt avec n'importe quel LLM ?**
R : Oui. Il est écrit en anglais pour maximiser la compatibilité, mais les instructions et la structure fonctionnent avec Claude, GPT-4o, Gemini Pro et Mistral Large. Les résultats varient selon la capacité du modèle à suivre des instructions complexes ; Claude et GPT-4o donnent les meilleurs résultats.

**Q : Pourquoi le JSON est-il en anglais alors que le prompt est en français ?**
R : La convention universelle est que les clés JSON et le code sont en anglais. Cela garantit la compatibilité avec tous les parseurs, frameworks et outils qui consomment le blueprint. Les valeurs (`{{PLACEHOLDERS}}` et hints de contenu) s'adaptent à la langue de l'input.

**Q : Faut-il remplir tous les `{{PLACEHOLDERS}}` manuellement ?**
R : Non. Les placeholders sont conçus pour être remplis par un second prompt LLM, un développeur, ou un outil. Ils indiquent clairement ce qui est connu (déduit de l'input) versus ce qui doit encore être décidé.

**Q : Comment étendre le blueprint pour un e-commerce ?**
R : Ajouter dans `site_structure` les routes `/shop`, `/product/[slug]`, `/cart`, `/checkout`. Mettre à jour le `schema_type` des pages produit vers `Product + Offer + AggregateRating`. Ajouter dans `tech_stack` les champs `payment: "Stripe"`, `inventory: "{{CMS ou ERP}}"`.

**Q : Comment versionner le blueprint pour un projet long terme ?**
R : Stocker le JSON dans le repo Git du projet, versionné comme un fichier de configuration. Toute modification du design system, de l'architecture ou du stack se fait via un nouveau JSON généré ou via une modification manuelle documentée dans le changelog du repo.

**Q : Le blueprint est-il compatible avec les outils de design comme Figma ou Framer ?**
R : Pas directement, mais les tokens du `design_system` (couleurs HSL, typographie, espacement) peuvent être importés dans Figma via le plugin Tokens Studio (anciennement Figma Tokens) en adaptant le format JSON aux conventions du plugin.

---

*JSON Website Generator v2.0 — Conçu pour être précis, honnête, et directement exploitable.*
*Toute suggestion d'amélioration : soumettre via le même workflow de refactorisation.*

---

Le README couvre l'ensemble de l'outil en 16 sections, soit environ 4 500 mots. Voici ce qu'il documente :
La philosophie explique les trois principes fondateurs : zéro biais, confiance progressive, et tokens plutôt que valeurs inventées. Le guide des 6 phases détaille chaque étape du pipeline avec les règles internes, les exemples concrets d'extraction, et les arbres de décision. La section structure du JSON donne une vue arborescente complète de l'objet master_blueprint avec tous ses champs imbriqués. Le comparatif v1 → v2 liste les 20 dimensions améliorées en tableau, utile pour convaincre un tiers d'adopter la nouvelle version. Les exemples d'inputs montrent deux cas réels (input minimal vs. input riche) avec les dimensions extraites et les décisions prises. Enfin les limites et la FAQ couvrent les cas particuliers et les questions d'intégration (Figma, Git, multi-langue, e-commerce).
