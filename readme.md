# 🛠️ GitHub Issue Automation Suite

Questa suite di strumenti in TypeScript è progettata per l'automazione
del backlog di progetto. Permette la creazione programmatica di issue su
GitHub partendo da definizioni strutturate in formato JSON, garantendo
coerenza di naming e tracciabilità dello stato di avanzamento.

**Project Owner:** 7eightDev\
**Core Stack:** TypeScript, GitHub CLI (`gh`), Node.js (`fs`, `path`)

------------------------------------------------------------------------

## 📖 Indice

1.  [Architettura e Principi](#architettura-e-principi)
2.  [Componenti del Sistema](#componenti-del-sistema)
3.  [Specifiche del Formato JSON](#specifiche-del-formato-json)
4.  [Guida Operativa](#guida-operativa)
5.  [Gestione degli Errori e
    Recovery](#gestione-degli-errori-e-recovery)

------------------------------------------------------------------------

## 🧠 Architettura e Principi

Il sistema implementa tre pattern fondamentali per il software di
automazione professionale:

-   **Idempotenza:** ogni operazione può essere ripetuta senza produrre
    effetti collaterali (duplicati su GitHub), grazie al controllo dello
    stato (`state: "created"`) nel file di origine.
-   **Atomic Persistence:** lo script salva lo stato su disco
    immediatamente dopo ogni singola transazione riuscita con le API di
    GitHub, prevenendo desincronizzazioni in caso di crash.
-   **Dry Run First:** entrambi gli script supportano una modalità di
    simulazione integrale per validare intestazioni, percorsi file e
    logica prima dell'esecuzione reale.

------------------------------------------------------------------------

## ⚙️ Componenti del Sistema

### 1. `create-issue.ts` (The Atomic Worker)

Gestisce la logica di creazione della singola issue.

-   **Auto-Prefixing:** rinomina la issue post-creazione aggiungendo il
    prefisso `ISSUE-#XX` al titolo.
-   **Dynamic Metadata:** estrae il nome del progetto dal `package.json`
    della root per contestualizzare i log.
-   **Commit Helper:** genera e stampa un suggerimento per il messaggio
    di commit basato sulla issue appena creata.

------------------------------------------------------------------------

### 2. `bulk-issues.ts` (The Orchestrator)

Gestisce l'iterazione su dataset multipli.

-   **Skipping Logic:** analizza il file JSON e processa esclusivamente
    le entry con `state: "pending"`.
-   **IO Synchronization:** utilizza `fs.writeFileSync` in tempo reale
    per mantenere il JSON sincronizzato con lo stato del repository.

------------------------------------------------------------------------

## 🧾 Specifiche del Formato JSON

Il file di input (es. `issues-plan.json`) agisce come un piccolo
database di stato:

``` json
[
  {
    "issue": {
      "title": "feat(scope): breve descrizione",
      "body": "Corpo dettagliato della issue",
      "assignee": "@me",
      "labels": ["label1", "label2"]
    },
    "state": "pending",
    "issueNumber": null,
    "createdAt": null
  }
]
```

------------------------------------------------------------------------

## 🚀 Guida Operativa

### ✅ Prerequisiti

-   GitHub CLI autenticata:

    ``` bash
    gh auth login
    ```

-   Node.js e `tsx` installati nel progetto

------------------------------------------------------------------------

### 🧪 Simulazione (Dry Run)

Utilizzare per verificare la correttezza dei dati senza inviare
richieste reali alle API:

``` bash
# Simulazione piano completo
npm run issue:plan -- scripts/issues-plan/issues-plan.json

# Simulazione issue singola
DRY_RUN=true npx tsx scripts/create-issue.ts "titolo" "body" "@me" "label"
```

------------------------------------------------------------------------

### ⚡ Esecuzione Reale

Utilizzare per creare effettivamente le issue su GitHub e aggiornare il
file JSON:

``` bash
# Esecuzione piano completo
npm run issue:run -- scripts/issues-plan/issues-plan.json

# Esecuzione issue singola
DRY_RUN=false npx tsx scripts/create-issue.ts "titolo" "body" "@me" "label"
```

------------------------------------------------------------------------

## 🛡️ Gestione degli Errori e Recovery

In caso di interruzione (es. errore di rete o label inesistente):

-   **Interruzione di sicurezza:** lo script termina immediatamente
    (`process.exit(1)`) per prevenire stati inconsistenti.
-   **Persistenza dello stato:** il file JSON mantiene lo stato
    aggiornato in tempo reale:
    -   `state: "created"` → issue completata
    -   `state: "pending"` → issue non ancora processata
-   **Ripristino (Resume):** una volta risolta la causa del blocco (es.
    creazione della label mancante), è sufficiente rilanciare il
    comando. Il sistema eseguirà automaticamente lo **skipping** delle
    issue già completate e riprenderà dal punto di interruzione.
