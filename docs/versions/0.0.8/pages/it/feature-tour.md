# Prova le nuove funzionalità della 0.0.8

Questa pagina attiva i nuovi controlli con file di esempio scaricabili. Inizia
da **Download** e **Versione e fonti**, sopra il contenuto della pagina.

:::note Metadati dimostrativi
I branch `demo/catalog` e `demo/review`, le date e gli stati di revisione di
questa sezione sono dati di esempio nel manifest. Non rappresentano lo stato
Git del repository. Gli allegati sono file reali che puoi scaricare.
:::

## 1. Scarica la pagina e gli allegati

Espandi **Download**. Trovi tre file divisi in gruppi:

| Gruppo | File | Cosa provare |
| --- | --- | --- |
| Questa pagina | Markdown della pagina corrente | Scaricalo e aprilo: il frontmatter YAML contiene titolo, id, branch dimostrativo e data. Sotto trovi il Markdown originale. |
| Progetto | Contesto del progetto demo | Allegato ereditato dalla sezione, disponibile anche nelle pagine annidate del database. |
| Revisione | Checklist di revisione | Allegato aggiunto solo a questa pagina, con i controlli da provare. |

Gli allegati mostrano formato, dimensione e, quando presente, descrizione.
Il download della pagina viene creato nel browser; gli altri file sono serviti
insieme alla demo. I file di esempio sono in inglese.

## 2. Apri le informazioni sulla revisione

Espandi **Versione e fonti**. La sezione definisce branch, data e stato; questa
pagina aggiunge il percorso del sorgente. Il branch ha un badge ambra, lo stato
dimostrativo un badge blu e la pagina un badge verde `0.0.8` nella sidebar.

Apri [Tabella utenti](../demo-users.md): il branch e lo stato vengono sostituiti
con valori e badge verdi, mentre la data e gli allegati rimangono ereditati.

## 3. Esplora quattro livelli di sottosezioni

Nella sidebar espandi questo percorso:

```text
Novità 0.0.8
└─ Workspace di esempio
   └─ Piattaforma dati
      └─ PostgreSQL
         └─ Tabelle
            └─ Tabella utenti
```

Ogni sezione si apre e si chiude separatamente. PostgreSQL e Tabelle partono
chiuse. Seguendo il link [Tabella utenti](../demo-users.md), tutti gli antenati
della pagina si aprono automaticamente. [Panoramica database](../demo-database.md)
si trova più in alto nello stesso albero: confronta rientri e breadcrumb.
Queste due pagine usano il contenuto inglese come fallback.

## 4. Prova palette, aspetto e navigazione da tastiera

Cambia palette dall'header, poi passa fra aspetto chiaro e scuro. Controlla
badge, pannello download e informazioni di revisione in entrambi gli aspetti.
Con Tab raggiungi il selettore della palette e premi Invio per aprirlo; usa le
frecce per muoverti, Invio per scegliere ed Esc per chiudere.

Riduci la larghezza della finestra o usa la vista mobile: apri il menu di
navigazione e prova il selettore della palette al suo interno. La preferenza
viene salvata localmente.

## Configura il tuo sito

In [Downloads and document information](../downloads.md) trovi il contratto
per allegati, revisioni e personalizzazione CSS. Il [Manifest reference](../manifest.md)
descrive la struttura di navigazione. Gli esempi funzionano con soli file statici.
