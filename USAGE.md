## 🛠️ Guida agli Script di Automazione

# 

Gli script utilizzano le variabili d'ambiente (**Environment Variables**) per cambiare il comportamento senza modificare il codice. Le due variabili principali sono:

-   `DRY_RUN`: Se `true` (default), simula l'operazione. Se `false`, scrive effettivamente su GitHub.
    
-   `TEST_MODE`: Se `true`, simula un'esecuzione fittizia per scopi di test/CI.
    

* * *

## 1\. `npm run issue:plan` (Simulazione Bulk)

# 

**Comando:** `DRY_RUN=true npx tsx bulk-issues.ts issues-plan/issues-plan.json`

Questa è la modalità **"Sicurezza"**. Si usa per verificare che un piano di issue massive sia corretto prima di applicarlo.

-   **Cosa fa:** Legge il file JSON, valida la struttura e simula la creazione delle issue.
    
-   **Output:** Mostra l'header del progetto e un'anteprima di quante issue verrebbero create o saltate.
    
-   **Quando usarlo:** Ogni volta che modifichi il file `issues-plan.json` e vuoi assicurarti che non ci siano errori di sintassi o label errate.
    

## 2\. `npm run issue:run` (Esecuzione Bulk)

# 

**Comando:** `DRY_RUN=false npx tsx bulk-issues.ts issues-plan/issues-plan.json`

Questa è la modalità **"Produzione"**. Trasforma il tuo piano JSON in issue reali su GitHub.

-   **Cosa fa:** Esegue un controllo "pre-flight" delle label, verifica se le issue esistono già (per evitare duplicati) e procede alla creazione.
    
-   **Output:** Un report dettagliato in tempo reale e un riepilogo finale con il conteggio delle issue create con successo.
    
-   **Quando usarlo:** Quando il "plan" è pronto e vuoi popolare il repository con tutte le task pianificate.
    

## 3\. `npm run issue:single` (Creazione Singola)

# 

**Comando:** `DRY_RUN=false npx tsx create-issue.ts`

Questa è la modalità **"Interattiva"**. Si usa per aggiungere rapidamente una singola task da terminale.

-   **Cosa fa:** Prende i parametri passati dopo il comando (Titolo, Body, Assignee, Label) e crea la issue.
    
-   **Logica Post-Creazione:** Una volta creata, lo script rinomina automaticamente il titolo aggiungendo il numero assegnato da GitHub (es. `ISSUE-123: Titolo`).
    
-   **Esempio d'uso:** \`\`\`bash
    
    npm run issue:single -- "Fix bug" "Descrizione del problema" "none" "bug"
    

* * *

## 🧪 Opzioni Avanzate con Variabili d'Ambiente

# 

Puoi sovrascrivere il comportamento di default lanciando i comandi direttamente con le variabili prefissate:

| **Scenario** | **Comando Esempio** | **Risultato** |
| --- | --- | --- |
| **Test veloce singola issue** | DRY\_RUN=true npm run issue:single -- "Titolo" "Body" | Mostra il comando `gh` che verrebbe lanciato senza creare la issue. |
| **Modalità Automazione (CI)** | TEST\_MODE=true npm run issue:single -- "Titolo" "Body" | Simula l'output per i test interni, restituendo sempre l'issue #999. |
| **Forzare Dry Run su Bulk** | DRY\_RUN=true npm run issue:run | Anche se lo script direbbe "run", la variabile `true` vince e forza la simulazione. |