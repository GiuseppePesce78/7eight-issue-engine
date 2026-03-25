# 🤝 Linee Guida per Contribuire a 7eight-issue-engine

# 

Innanzitutto, grazie per l'interesse nel migliorare **7eight-issue-engine**! Questo progetto nasce con l'obiettivo di ottimizzare il flusso di lavoro degli sviluppatori, automatizzando la gestione del backlog.

Per mantenere un'alta qualità del codice e coerenza nel tempo, ti chiediamo di seguire queste linee guida.

* * *

## 🛠️ Configurazione dell'Ambiente Locale

# 

Per iniziare a lavorare sulla base di codice, segui questi passaggi:

1.  **Prerequisiti**: Assicurati di avere [Node.js](https://www.google.com/search?q=https://nodejs.org/) (v18+) e la [GitHub CLI](https://www.google.com/search?q=https://cli.github.com/) installati e correttamente autenticati (`gh auth status`).
    
2.  **Fork & Clone**: Effettua il fork del repository e clonalo sulla tua macchina locale.
    
3.  **Installazione Dipendenze**:
    
    Bash
    
        npm install
    
4.  **Ambiente**: Verifica che il tuo `GITHUB_TOKEN` o la sessione della CLI abbiano i permessi necessari per creare e modificare issue nei repository di destinazione.
    

* * *

## 🌿 Strategia dei Branch

# 

Utilizziamo un modello di branching semplice e pulito. Ti preghiamo di nominare i tuoi branch usando i seguenti prefissi:

-   `feat/` : Per nuove funzionalità (es. `feat/auto-branch-creation`)
    
-   `fix/` : Per la correzione di bug (es. `fix/label-parsing-error`)
    
-   `docs/` : Per aggiornamenti alla documentazione (es. `docs/update-readme`)
    
-   `chore/` : Per attività di manutenzione o aggiornamento delle dipendenze.
    

* * *

## 📜 Standard di Codifica

# 

Per mantenere la **7eight-suite** coerente:

-   **Lingua**: Utilizza sempre termini inglesi per variabili, funzioni e commenti.
    
-   **TypeScript**: Assicurati che tutto il nuovo codice sia strettamente tipizzato.
    
-   **Idempotenza**: Ogni nuova logica deve rispettare la regola della "persistenza atomica" (aggiornare lo stato del JSON dopo ogni singola azione remota).
    

* * *

## 🧪 Testare le Modifiche

# Prima di inviare una Pull Request, verifica le tue modifiche utilizzando la modalità **Dry Run**. Questo eviterà la creazione di issue di test non necessarie su GitHub:

Bash

    # Esempio di test utilizzando il template di esempio
    DRY_RUN=true npx tsx src/bulk-issues.ts templates/sample-plan.json

* * *

## 🚀 Inviare una Pull Request

# 

1.  Crea un titolo chiaro e descrittivo per la tua PR.
    
2.  Spiega il **perché** delle modifiche, non solo il "cosa".
    
3.  Collega eventuali issue correlate, se applicabile.
    
4.  Una volta aperta, la PR verrà revisionata nel più breve tempo possibile.
    

* * *

## ⚖️ Licenza

# 

Contribuendo a **7eight-issue-engine**, accetti che i tuoi contributi siano rilasciati sotto la [Licenza MIT](https://www.google.com/search?q=./LICENSE) del progetto.