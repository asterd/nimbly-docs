# Nimbly Docs

Nimbly Docs è un Web Component che mostra documentazione Markdown a partire da un manifest JSON. Offre sidebar, ricerca, temi, indice di pagina e link diretti, come Docsify, ma senza framework, senza plugin da scaricare e senza dipendenze a runtime.

Stai leggendo la versione italiana di questa pagina. Per tornare all'inglese usa il selettore della lingua nell'header.

:::tip Novità della 0.0.7
I code group sono indipendenti, a meno che non condividano una chiave `{sync=...}`. I chip hanno un colore legato al tema e si possono usare anche nel testo con `:badge[...]`. Le task list mostrano le checkbox, Mermaid e Pele sono in un'unica pagina sui diagrammi e le immagini relative si caricano correttamente.
:::

## Come funziona

Insieme alla tua applicazione distribuisci tre cose:

1. il viewer, un unico file ESM;
2. il manifest `index.json`, che descrive la navigazione;
3. le pagine Markdown.

Pubblicale sulla stessa origine e aggiungi `<nimbly-docs manifest="./index.json">` a una pagina. La navigazione usa l'hash dell'URL, quindi non servono regole di rewrite sul server.

## Funzionalità

| Funzione | Inclusa |
| --- | :---: |
| Sidebar annidata | ✓ |
| Routing con hash | ✓ |
| Ricerca locale | ✓ |
| Temi chiaro/scuro | ✓ |
| Componenti interattivi | ✓ |
| Documentazione per versione | ✓ |
| Diagrammi | ✓ (da attivare) |

Le traduzioni sono file Markdown separati, uno per lingua. Se una traduzione manca, il viewer mostra la pagina nella lingua predefinita.
