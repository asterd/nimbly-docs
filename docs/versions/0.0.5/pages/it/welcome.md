# Documentazione vicina alla tua applicazione

**Nimbly Docs** è un Web Component integrabile per documentazione Markdown locale. Offre l'esperienza tipica di Docsify—navigazione annidata, ricerca, temi, indice di pagina e deep link—senza framework, plugin remoti o dipendenze a runtime.

> Questa pagina è la variante in italiano: cambia lingua dal selettore nell'header per tornare all'inglese.

## Perché esiste

La documentazione viene spesso distribuita insieme a un'applicazione, ma gli stack moderni possono rendere un piccolo manuale locale dipendente da un framework pesante o da richieste di rete a terzi. Nimbly Docs mantiene il modello operativo volutamente semplice:

1. Distribuisci un singolo file ESM cacheabile.
2. Tieni `index.json` e i Markdown accanto all'applicazione.
3. Servili dalla stessa origine.
4. Naviga con gli hash—nessuna riscrittura server necessaria.

## Cosa ottieni

| Funzione | Inclusa |
| --- | :---: |
| Sidebar annidata | ✓ |
| Routing hash | ✓ |
| Ricerca locale | ✓ |
| Temi chiaro/scuro | ✓ |
| Diagrammi Mermaid | ✓ (opt-in) |

Le pagine tradotte sono file Markdown separati, dichiarati in `sources` per ciascuna lingua; se una traduzione manca, il viewer usa la lingua di default.
