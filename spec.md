# Nimbly Docs

## Specifica di implementazione di un viewer Markdown embeddable

**Nimbly Docs** e un viewer documentale embeddable, a singolo bundle, progettato come alternativa moderna a Docsify per documentazione distribuita insieme alle applicazioni. Ha la stessa esperienza d'uso attesa - sidebar, menu annidati, routing, ricerca, indice della pagina, temi e Markdown - ma elimina configurazione globale, plugin remoti e dipendenze runtime.

La promessa tecnica non e una “magia” di peso: il profilo completo deve rimanere entro **120 KB gzip**, incluso parser Markdown, sanitizzatore, ricerca, UI e icone. Non sono ammessi framework o asset caricati al runtime. Ogni build produce esattamente un JavaScript autoconsistente.

## 1 Scopo

Realizzare una libreria JavaScript distribuita come **un solo file statico** (`nimbly-docs.<versione>.<hash>.min.js`), priva di dipendenze runtime esterne, che renda una documentazione locale composta da un manifest JSON e file Markdown. La libreria deve essere integrabile in qualunque applicazione o static hosting tramite una pagina HTML minimale.

Il prodotto non e un generatore di siti: funziona nel browser a runtime. Ogni progetto resta proprietario di contenuti, struttura e configurazione; il viewer fornisce interfaccia, routing, rendering, ricerca e accessibilita.

### Posizionamento rispetto a Docsify

| Capacita | Nimbly Docs | Principio progettuale |
|---|---|---|
| Sidebar e menu annidato | Si | Generato dal manifest validato |
| Routing e deep link | Si | Hash routing senza rewrite server |
| Markdown e TOC | Si | Parsing sicuro e id stabili |
| Ricerca | Si | Indice locale, niente servizio esterno |
| Temi chiaro scuro e custom | Si | Token CSS, non CSS/esecuzione arbitraria |
| Codice e pulsante copia | Si | Nessun codice Markdown eseguito |
| Plugin | API limitata | Estensioni registrate localmente, mai scaricate dal manifest |
| Configurazione | `index.json` | Co-locata con la documentazione |
| Runtime | Un bundle ESM | Nessuna dipendenza, font o CDN impliciti |

Nimbly Docs non deve imitare la compatibilita dei file di configurazione di Docsify. Il suo vantaggio e un contratto esplicito e validabile, adatto a una piattaforma interna con molte applicazioni.

## 2 Obiettivi e confini

### Obiettivi

- Un unico bundle ESM, hashabile e cacheabile a lungo (`nimbly-docs.<hash>.min.js`).
- Nessun backend richiesto dal viewer; hostabile su OpenShift, Nginx, Apache, CDN o bucket statico.
- Manifest e contenuti risolti con URL relativi al manifest.
- Navigazione condivisibile, back/forward e refresh senza configurazioni di rewrite server.
- Markdown sicuro, temi configurabili, menu laterale responsive, navigazione da tastiera e struttura semantica.
- Avvio rapido: rendere lo shell dell'interfaccia subito e caricare Markdown solo quando richiesto.
- Nessuna telemetria, cookie, chiamata remota o font remoto impliciti.
- Header con titolo, ricerca, controllo tema, menu mobile, breadcrumb e TOC contestuale.

### Fuori ambito nella prima versione

- Editing collaborativo, autenticazione applicativa, generazione statica e indicizzazione server-side.
- Esecuzione di JavaScript nei documenti.
- Inclusioni remote arbitrarie, iframe automatici o supporto a HTML non fidato.
- Compatibilita con manifest proprietari non validati.

## 3 Architettura scelta

Usare un **Web Component** nativo, `nimbly-docs`. Incapsula il comportamento e non richiede React, Vue o framework dell'host.

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="module" src="/assets/nimbly-docs.1.0.0.min.js"></script>
  </head>
  <body>
    <nimbly-docs manifest="./index.json"></nimbly-docs>
  </body>
</html>
```

Il viewer utilizza Shadow DOM per isolare gli stili. Espone parti CSS (`::part`) e Custom Properties per il branding. Il contenuto Markdown viene inserito nel light DOM o in un contenitore dedicato dentro lo Shadow DOM dopo sanitizzazione; la scelta raccomandata e Shadow DOM anche per il contenuto, con classi e tipografia controllate dalla libreria.

Layout desktop: sidebar sinistra comprimibile, contenuto centrale a larghezza di lettura, TOC a destra opzionale. Layout mobile: header sticky, drawer laterale modale e TOC collassato sopra il contenuto. Il layout deve essere CSS-first: nessun calcolo JavaScript di larghezze o altezza per la normale resa.

### Flusso di caricamento

1. Il browser scarica il bundle dal percorso centralizzato o dalla stessa app.
2. `docs-viewer` calcola il `manifestUrl` usando `new URL(attribute, document.baseURI)`.
3. Scarica e valida `index.json`.
4. Renderizza header, menu e stato di caricamento.
5. Legge la route hash e risolve la pagina richiesta.
6. Costruisce l'URL del Markdown con `new URL(page.source, manifestUrl)`.
7. Scarica, trasforma, sanitizza e renderizza il documento.

Con questa regola, `source: "./guide/start.md"` e sempre relativo alla posizione di `index.json`, indipendentemente da dove risiede la libreria.

## 4 Contratto pubblico del componente

```html
<nimbly-docs
  manifest="./index.json"
  theme="auto"
  locale="it"
  router="hash"
  search="on">
</nimbly-docs>
```

| Attributo | Default | Significato |
|---|---:|---|
| `manifest` | `./index.json` | URL relativo o assoluto del manifest |
| `theme` | tema del manifest, poi `nimbly` | Nome di tema built-in o del manifest; `light`, `dark`, `auto` restano alias legacy dell'aspetto |
| `locale` | lingua documento | Lingua UI e fallback dei testi |
| `router` | `hash` | In v1 supportare solo `hash` |
| `search` | `on` | Abilita la ricerca client-side se il manifest lo consente |
| `toc` | `auto` | Mostra indice della pagina da `h2` a `h4` |
| `sidebar` | `auto` | Sidebar aperta su desktop, drawer su mobile |
| `debug` | `false` | Log diagnostici locali, mai attivi in produzione |

Eventi DOM:

- `docs-ready`: manifest valido e shell renderizzato;
- `docs-navigate`: pagina resa con dettaglio `{ id, url, version }` (`version` e l'id della versione attiva, `null` se la documentazione non e versionata);
- `docs-error`: dettaglio `{ code, message, cause }` senza leak di informazioni sensibili.

Metodi pubblici opzionali: `navigate(id)`, `reload()`, `setTheme(name)`, `setVersion(id)`, `openSearch()`.

### Menu laterale e navigazione

La sidebar e costruita solo dal manifest. Ogni sezione e espandibile, conserva lo stato per la sessione e marca la pagina corrente. Per documentazioni grandi la sidebar deve virtualizzare le sezioni chiuse e non creare nodi per testo Markdown non visualizzato. La ricerca e disponibile con Ctrl/Cmd+K, offre titoli e frammenti, e porta alla pagina selezionata senza full reload.

La UI include, sempre senza configurazione aggiuntiva: logo/testo, titolo, breadcrumb, precedente/successiva, pulsante copia per codice, link per titolo, pulsante tema e tabella dei contenuti. Tutte le funzioni sono disattivabili nel manifest; nessuna e caricata da CDN.

## 5 Routing

Il routing standard e hash-based:

```text
/docs/docs.html#/introduzione
/docs/docs.html#/api/ordini
/docs/docs.html#/introduzione#installazione
```

Il primo hash identifica la pagina. L'ancora Markdown diventa un secondo frammento: la libreria interpreta `#/pagina#ancora`. Se la documentazione e versionata, le versioni diverse da quella predefinita aggiungono un segmento `@<versione>/` subito dopo `#/` (es. `#/@1.x/introduzione#installazione`). Gli id pagina non possono iniziare con `@`, quindi la grammatica non e ambigua. Deve aggiornare `aria-current="page"`, titolo documento e focus al contenuto principale a ogni navigazione.

Regole:

- route vuota: prima pagina marcata `home`, altrimenti prima pagina del manifest;
- id sconosciuto: pagina 404 interna, senza richiesta di file;
- link Markdown relativi a un altro `.md`: se il target corrisponde a una pagina nota, convertirlo nella route interna;
- versione sconosciuta: si usa la versione predefinita;
- cambio versione dal selettore: si mantiene la pagina corrente se esiste nella versione di destinazione, altrimenti si apre la home di quella versione;
- link esterni: `target="_blank"`, `rel="noopener noreferrer"` solo se cosi definito dal contenuto; altrimenti lasciare la normale navigazione.

## 6 Specifica del manifest v1

Il file e JSON UTF-8 e ha MIME type `application/json`.

```json
{
  "$schema": "https://example.invalid/docs-viewer/manifest/v1/schema.json",
  "version": "1.0",
  "title": "Portale Ordini",
  "description": "Documentazione tecnica e utente",
  "language": "it",
  "theme": "corporate",
  "home": "overview",
  "features": {
    "search": true,
    "toc": true,
    "copyCode": true,
    "previousNext": true,
    "breadcrumbs": true,
    "sidebar": { "collapsible": true, "defaultExpanded": ["start"] }
  },
  "sections": [
    {
      "id": "start",
      "title": "Inizia qui",
      "pages": [
        { "id": "overview", "title": "Panoramica", "source": "./overview.md" },
        { "id": "install", "title": "Installazione", "source": "./install.md" }
      ]
    }
  ]
}
```

Vincoli di validazione:

- `version` obbligatoria e compatibile con la major supportata;
- `title`, `sections`, almeno una `page` obbligatori;
- `id` univoco globalmente, pattern `^[a-z0-9][a-z0-9/_-]{0,127}$`;
- `source` obbligatorio, URL `http:` o `https:`; in asset locale usare riferimenti relativi;
- nessun campo sconosciuto interpretato come comportamento eseguibile;
- limiti: 500 pagine, 256 KB per manifest, 2 MB per file Markdown configurabili;
- validazione con JSON Schema compilato nel bundle e controlli semantici aggiuntivi.

Per evitare ambiguita, `source` non deve contenere query di autenticazione o token. L'accesso protetto appartiene al reverse proxy/SSO dell'applicazione.

### Versioni della documentazione

Un software puo avere piu versioni con documentazione diversa. Ogni versione e un albero di documentazione completo e indipendente (manifest, pagine, lingue, tema). Il **manifest radice**, cioe quello indicato dall'attributo `manifest`, elenca le versioni:

```json
"versions": [
  { "id": "2.x", "label": "v2.x (latest)", "status": "current" },
  { "id": "next", "label": "Next", "manifest": "./versions/next/index.json", "status": "unreleased" },
  { "id": "1.x", "label": "v1.x", "manifest": "./versions/1.x/index.json", "status": "legacy" }
]
```

Vincoli:

- `id` obbligatorio e univoco, pattern `^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$`;
- esattamente una voce senza `manifest` (o con `manifest` che risolve al manifest radice): e la versione descritta dal manifest radice, con route senza prefisso `@`;
- `manifest` risolto rispetto al manifest radice, solo `http:`/`https:` senza credenziali;
- `status` in `current` (default), `legacy`, `unreleased`;
- l'elenco `versions` e letto solo dal manifest radice: un eventuale elenco dentro un manifest di versione viene ignorato.

Comportamento visivo:

- selettore di versione nell'header, accanto al brand, visibile con almeno due versioni; le versioni non correnti sono etichettate `legacy` o `unreleased`;
- banner localizzato in testa al contenuto per le versioni `legacy` (non piu mantenuta) e `unreleased` (non ancora rilasciata), con link alla stessa pagina nella versione predefinita;
- ricerca, sidebar, lingue e tema predefinito seguono la versione attiva.

Il comando `nimbly-docs-version <id>` (`scripts/snapshot-version.mjs`) congela la documentazione corrente in `versions/<id>/` (manifest, pagine e immagini, mai il bundle) e la registra nel manifest radice.

## 7 Markdown e sicurezza

Il viewer deve includere nel bundle un parser Markdown deterministico e un sanitizzatore HTML. La pipeline e obbligatoria:

```text
Markdown -> parser senza HTML raw -> HTML -> sanitizzazione allow-list -> DOM
```

Configurazione sicura predefinita:

- HTML raw disabilitato nel parser;
- rimuovere `script`, `style`, `iframe`, `object`, event handler (`on*`), form e URL `javascript:`;
- permettere le sole tag necessarie: titoli, paragrafi, liste, tabelle, codice, immagini e link;
- immagini: solo `https:`, `http:` se esplicitamente autorizzato, e path relativi; niente `data:` salvo casi motivati;
- blocchi codice sono testo, mai codice eseguibile;
- SVG inline disabilitato per default;
- nessuna estensione/plugin eseguibile caricata dal manifest.

### Componenti interattivi dichiarativi ("MDX-lite")

MDX non e supportato: compila JSX in JavaScript eseguito a runtime, in contrasto con i vincoli di questa sezione (niente HTML raw, niente script dai contenuti, sanitizzazione allow-list, zero dipendenze, compatibilita con CSP restrittive). Gli stessi componenti si ottengono con **direttive Markdown**:

```text
:::nome Titolo opzionale {chiave=valore}
contenuto Markdown, anche con direttive annidate
:::
```

- La chiusura e una riga `:::` nuda; l'annidamento si risolve per profondita, non contando i due punti. Le righe `:::` dentro blocchi di codice recintati sono ignorate.
- Direttive supportate: callout `note`, `tip`, `important`, `warning`, `danger` (alias `info`, `success`, `caution`, `error`); `tabs` e `tab`; `code-group`; `steps`; `cards` e `card` (`href` opzionale); `details` (`open` opzionale). I nomi sconosciuti degradano al solo contenuto.
- Gli alert GitHub (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) producono gli stessi callout.
- I blocchi di codice accettano un titolo: ```` ```js title="app.js" ```` oppure ```` ```js [app.js] ````.
- `code-group` trasforma blocchi di codice consecutivi in tab, etichettati dal titolo o dal linguaggio. I gruppi con la stessa chiave `sync` (predefinita `code` per i code group, opzionale per i tab) cambiano insieme e la scelta viene salvata in `localStorage` (`nimbly-docs:tabs:<chiave>`): e lo switch di linguaggio degli esempi.

Sicurezza: il parser emette solo tag gia in allow-list (`div`, `p`, `details`, `summary`, `pre`, `code`) e gli attributi `data-kind`, `data-label`, `data-sync`, `data-title`. Bottoni, ruoli ARIA (pattern WAI-ARIA tabs, con frecce, Home ed End) e icone sono creati dal viewer **dopo** la sanitizzazione, con valori autoriali inseriti solo come testo o valori di attributo. Gli `href` delle card passano dalla stessa validazione URL dei link.

Fuori ambito: playground eseguibili. Se introdotti, dovranno essere un modulo opzionale caricato on demand (come il motore dei diagrammi), eseguito in un `iframe sandbox="allow-scripts"` senza `allow-same-origin`, creato dal viewer e mai dal Markdown.

I link e asset relativi dentro un Markdown si risolvono contro l'URL del Markdown corrente. Le immagini devono avere `loading="lazy"`, `decoding="async"` e testo alternativo; la libreria evidenzia in console immagini prive di alt text in modalita sviluppo.

## 8 Tema e personalizzazione

Il tema e un set di token CSS, non CSS arbitrario nel manifest. Tema (palette e skin) e aspetto (`light`, `dark`, `auto`) sono assi indipendenti: ogni tema definisce sia la variante chiara sia quella scura.

```css
docs-viewer {
  --dv-color-bg: #ffffff;
  --dv-color-text: #1a1a1a;
  --dv-color-brand: #005ea8;
  --dv-color-border: #d0d7de;
  --dv-font-body: system-ui, sans-serif;
  --dv-content-max-width: 76ch;
}
```

Un tema manifest puo sovrascrivere soltanto token definiti e valori CSS semplici validati (colore, lunghezza, font stack senza URL). Il viewer rispetta `prefers-color-scheme`, `prefers-reduced-motion` e contrasto minimo WCAG AA. Non carica Google Fonts o risorse remote implicite.

Un tema agisce su due livelli:

- **palette**: colori di sfondo, superfici, testo, brand, accento, bordi, codice, focus e callout;
- **skin**: token strutturali (`font-size`, `line-height`, `heading-weight`, `header-bg`, `header-text`, `header-muted`, `header-border`, `sidebar-bg`, `nav-active-bg`, `nav-active-text`) e poche regole CSS mirate per tema. Un tema custom eredita palette e skin del proprio `base`.

Temi inclusi:

| Nome | Carattere |
|---|---|
| `nimbly` | **Nimbly Classic**, predefinito |
| `nimbus` | neutro blu |
| `midnight` | navy profondo |
| `paper` | editoriale ad alto contrasto |
| `sabbia` | caldo, sabbia/tortora |
| `material` | ispirato a Material for MkDocs: app bar colorata, Roboto, titoli leggeri |
| `stellar` | ispirato a Starlight (Astro): accento viola, voce di navigazione attiva piena |
| `evergreen` | ispirato al tema classic di Docusaurus: navbar bianca, brand verde |

I temi "ispirati a" ricreano l'aspetto con i token di Nimbly, senza copiare codice, font o asset di marchio, e senza caricare font remoti: usano stack di sistema che iniziano con il font originale se gia installato.

**Nimbly Classic** e progettato per riconoscibilita e leggibilita su ogni dispositivo: corpo 16px, interlinea 1.7, misura 72ch (vicina ai 45–75 caratteri per riga raccomandati), testo `#16201f` su `#f8faf9` (circa 15,9:1, evitando nero puro su bianco puro), variante scura `#e3ece9` su `#0c1312` (circa 15,6:1), testo secondario e link sempre sopra WCAG AA (link almeno 7,5:1 e sottolineati), brand teal `#0b7a70` con accento ambra `#c2410c` usato anche per l'anello di focus. Font nativi: SF / Segoe UI Variable / Roboto, poi Inter; codice con `ui-monospace`, SF Mono, Cascadia Code e JetBrains Mono. Elementi distintivi: una barra teal→ambra in cima all'header e sotto il titolo di pagina, e il bordo teal sulla voce attiva della sidebar.

Ogni tema mantiene la stessa struttura semantica. Il cambio tema e immediato, non richiede ricaricare il Markdown e viene memorizzato solo in `localStorage` sotto una chiave namespaced, se disponibile.

## 9 Prestazioni e caching

Budget iniziale vincolante: bundle gzip <= 120 KB; CSS e icone inclusi; nessun framework completo. Il bundle e unico: parser, sanitizzatore, UI, ricerca e tema sono inclusi. Per rispettare il budget, il syntax highlighting deve usare una grammatica compatta per i linguaggi principali e fallback testuale per tutti gli altri; non includere motori di highlighting completi.

- fetch con `AbortController`: annulla la pagina precedente durante una navigazione rapida;
- cache in memoria LRU per manifest e ultime 10 pagine;
- usare `ETag` e `Cache-Control` del server; non duplicare cache persistente senza necessità;
- prefetch solo delle pagine linkate nel viewport o della pagina successiva, mai dell'intera documentazione;
- evidenziazione codice solo per blocchi visibili e linguaggi consentiti;
- ricerca: costruire l'indice in `requestIdleCallback`, degradando a ricerca titolo se non disponibile;
- evitare layout shift con shell e skeleton stabili.

OpenShift/Nginx dovrebbero pubblicare il bundle con `Cache-Control: public, max-age=31536000, immutable` quando il nome contiene hash. Manifest e Markdown con ETag e cache breve/moderata, ad esempio `max-age=300, must-revalidate`.

## 10 Affidabilita e comportamento in errore

Il viewer non deve mai lasciare una pagina vuota. Errori previsti: manifest assente/non valido, pagina non trovata, rete lenta, Markdown non valido, contenuto oltre limite.

Per ogni errore mostra messaggio accessibile e azione di retry; in produzione non rendere stack trace. Il dettaglio tecnico e disponibile solo tramite evento `docs-error` e console in modalita `debug`.

Timeout di rete: 15 secondi configurabili. Effettuare un retry massimo per errori transitori idempotenti; non ritentare 4xx. Rispettare `offline` e mostrare i contenuti gia in cache in memoria.

## 11 Accessibilita e UX

- Landmark semantici `header`, `nav`, `main`, `aside` e collegamento “salta al contenuto”.
- Navigazione tastiera completa, focus visibile e ordine di tab coerente.
- Menu mobile accessibile con `aria-expanded`; Escape lo chiude e restituisce focus al bottone.
- Titoli Markdown generano id stabili, TOC e link copiabili.
- Annunciare cambio pagina in una live region moderata.
- Non usare il solo colore per stato o errore; contrasto AA minimo.

## 12 Distribuzione e compatibilita

Output di build per ciascun profilo di rilascio:

```text
dist/nimbly-docs.1.0.0.<hash>.min.js
dist/nimbly-docs.1.0.0.<hash>.min.js.sha384
dist/nimbly-docs.1.0.0.<hash>.min.js.map
```

Distribuire il bundle da un repository di artefatti interno o da una route statica. Le applicazioni possono bloccare una versione precisa e usare Subresource Integrity quando il bundle e su origine differente:

```html
<script type="module"
  src="https://assets.apps.local/nimbly-docs.1.0.0.<hash>.min.js"
  integrity="sha384-..."
  crossorigin="anonymous"></script>
```

Target: browser evergreen supportati dall'organizzazione. Nessun polyfill automatico. Se il requisito include browser legacy, fornire un secondo bundle legacy esplicito, non degradare il bundle principale.

## 13 Sicurezza di deployment

La configurazione raccomandata e same-origin: `docs.html`, `index.json`, Markdown e asset nella stessa Route OpenShift. In questo modello non serve CORS.

Se il manifest e cross-origin, l'host remoto deve autorizzare esplicitamente l'origine del viewer tramite CORS; non usare proxy aperti. Mai accettare un URL manifest da query string nel viewer embeddable standard. Se serve un portale centrale, creare una variante separata con allow-list di origin e validazione URL rigorosa.

CSP indicativa:

```text
default-src 'self'; script-src 'self'; style-src 'self';
img-src 'self' https:; connect-src 'self'; object-src 'none';
base-uri 'self'; frame-ancestors 'self';
```

Adattare `img-src` e `connect-src` solo agli host effettivamente necessari.

## 14 Implementazione interna consigliata

Moduli compilati in un solo artefatto:

```text
element  manifest  router  loader  markdown  sanitize
shell    sidebar   toc     render  search    theme   a11y    cache
```

Usare TypeScript con API browser standard, testare il bundle finale senza dipendenze globali. Le dipendenze di build devono essere pin-nate e analizzate per licenza e vulnerabilita. Preferire librerie mature e piccole per parsing/sanitizzazione invece di scrivere un parser Markdown o un sanitizzatore proprietario.

L'interfaccia non deve usare `innerHTML` su testo non sanitizzato. Tutti gli aggiornamenti DOM avvengono in modo atomico: preparare il contenuto in un `DocumentFragment`, poi sostituire la vista al completamento per evitare stati parziali.

## 15 Piano di test e criteri di accettazione

Test automatici minimi:

- schema e risoluzione URL relativi, inclusi livelli di directory diversi;
- routing, hash, anchor, back/forward e refresh;
- sanitizzazione contro XSS, URL ostili e SVG/script inline;
- link e immagini relativi; pagine assenti e manifest malformati;
- navigazione rapida con annullamento fetch;
- tema chiaro/scuro per ogni tema incluso, viewport mobile e tastiera;
- direttive: annidamento, `:::` dentro codice recintato, escape di titoli e attributi, sincronizzazione dei tab;
- versioni: validazione del manifest, route `@versione`, fallback alla home e banner;
- test E2E su server statico reale con cache e MIME type corretti;
- scansione dipendenze, dimensione bundle e Lighthouse/accessibilita nel CI.

Criteri di rilascio v1:

- avvio shell <= 200 ms e prima pagina <= 1 s su rete locale standard, escluso server lento;
- bundle gzip entro il budget deciso;
- zero vulnerabilita critiche note nelle dipendenze;
- nessun sink XSS non sanitizzato;
- WCAG 2.2 AA per le schermate base;
- compatibilita verificata sulle versioni browser dichiarate.

## 16 Versionamento e governance

Usare SemVer. La major del viewer deve supportare la major del manifest dichiarata. Aggiunte compatibili al manifest sono opzionali e ignorabili; cambi incompatibili richiedono una nuova major.

Pubblicare insieme al bundle: JSON Schema, changelog, matrice compatibilita viewer-manifest e una pagina di migrazione. Ogni applicazione deve bloccare una versione del viewer; aggiornamenti “latest” non sono ammessi in produzione.

## 17 Decisione finale

La soluzione raccomandata e **Nimbly Docs**: un Web Component TypeScript distribuito come bundle ESM unico, configurato con `manifest="./index.json"`, hash routing e file Markdown relativi al manifest. Deve offrire la UX che ci si aspetta da Docsify - sidebar, ricerca, temi, TOC e navigazione completa - senza le sue dipendenze implicite e con un contratto manifest sicuro. La centralizzazione riguarda soltanto il codice del viewer; documenti e configurazioni restano insieme a ogni applicazione.
