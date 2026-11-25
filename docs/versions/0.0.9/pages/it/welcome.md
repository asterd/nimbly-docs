# Nimbly Docs

Nimbly Docs è un Web Component che mostra documentazione Markdown a partire da un manifest JSON. Offre sidebar, ricerca, temi, indice di pagina e link diretti, come Docsify, ma senza framework, senza plugin da scaricare e senza dipendenze a runtime.

Stai leggendo la versione italiana di questa pagina. Per tornare all'inglese usa il selettore della lingua nell'header.

:::tip Novità della 0.0.9
I riferimenti OpenAPI e Swagger ora si vedono direttamente nella documentazione e le immagini si aprono in un visualizzatore con zoom e swipe: vedi [Riferimento API e immagini](../api-reference.md) o il link **Riferimento API** in fondo alla sidebar. Le sezioni possono avere badge a ogni livello.

Dalla 0.0.8: apri [Prova le nuove funzionalità](../feature-tour.md): trovi allegati da scaricare, esportazione Markdown, revisioni e badge colorati. Nella sidebar la sezione «Novità 0.0.8» arriva fino alla [Tabella utenti](../demo-users.md), con quattro livelli di sottosezioni e allegati ereditati. Il selettore della palette è disponibile anche nel menu mobile.
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
| Allegati raggruppati ed esportazione Markdown | ✓ |
| Revisioni dei documenti e badge semantici | ✓ |
| Routing con hash | ✓ |
| Ricerca locale | ✓ |
| Temi chiaro/scuro | ✓ |
| Componenti interattivi | ✓ |
| Documentazione per versione | ✓ |
| Diagrammi | ✓ (da attivare) |

Le traduzioni sono file Markdown separati, uno per lingua. Se una traduzione manca, il viewer mostra la pagina nella lingua predefinita.
