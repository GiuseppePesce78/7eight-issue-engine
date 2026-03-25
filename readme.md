# 🛠️ GitHub Issue Automation Suite

<p align="center">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub%20CLI-24292e?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" />
</p>

> **Transform your JSON backlog into GitHub reality with one command.**

**7eight-issue-engine** is a lightweight, TypeScript-powered automation tool designed to bridge the gap between project planning and execution. Stop creating issues manually; define your sprint in a JSON file and let the engine handle the rest.

# 🚀 7eight Issue Engine

## 

> Professional GitHub Issue Automation Engine

* * *

## 📌 Overview

## 

**7eight Issue Engine** is a TypeScript-based CLI tool designed to automate the creation and management of GitHub issues.

It allows you to:

-   Create issues in bulk from structured JSON files
    
-   Create single issues via CLI
    
-   Simulate execution (dry-run) without making changes
    
-   Track issue status directly inside the JSON file
    

The goal is to streamline backlog management, enforce consistency, and speed up development workflows.

* * *

## ⚙️ Requirements

## 

-   Node.js
    
-   GitHub CLI (`gh`) installed and authenticated
    
-   TypeScript runtime via `tsx`
    

Install GitHub CLI:  
👉 [https://cli.github.com/](https://cli.github.com/)

Login:

    gh auth login
    

* * *

## 📦 Installation

## 

    npm install
    

* * *

## 🧠 How It Works

## 

The system is built around two main scripts:

### 1\. Bulk Issue Creator

## 

File: `src/bulk-issues.ts`

-   Reads a JSON file containing a list of issues
    
-   Automatically creates issues on GitHub
    
-   Updates the issue state (`created`) inside the JSON
    
-   Prevents duplicates
    

* * *

### 2\. Single Issue Creator

## 

File: `src/create-issue.ts`

-   Creates a single issue via CLI
    
-   Automatically applies:
    
    -   labels
        
    -   assignee
        
    -   naming convention (`ISSUE-<id>`)
        

* * *

## 🧪 Execution Modes

### 🔍 DRY RUN (Simulation)

## 

No issues are created. It only shows what would happen.

    npm run issue:plan <file.json>
    

Or:

    DRY_RUN=true npx tsx src/bulk-issues.ts <file.json>
    

* * *

### 🚀 EXECUTION (Real Run)

## 

Actually creates issues on GitHub.

    npm run issue:run <file.json>
    

* * *

### 🎯 Single Issue

## 

    npm run issue:single -- "Title" "Description" "assignee" "label1" "label2"
    

* * *

## 🗂️ JSON File Structure

## 

Example:

    [
      {
        "state": "pending",
        "issue": {
          "title": "Setup authentication",
          "body": "Implement Clerk authentication",
          "assignee": "username",
          "labels": ["auth", "backend"]
        }
      }
    ]
    

* * *

## 🔁 Supported States

## 

| State | Description |
| --- | --- |
| pending | Issue to be created |
| created | Already created (skipped automatically) |

* * *

## 🧾 CLI Output

## 

During execution, the CLI displays:

-   Project name (read from `package.json`)
    
-   Execution mode (DRY RUN / EXECUTION)
    
-   Issue status:
    
    -   `[PENDING]`
        
    -   `[CREATING...]`
        
    -   `[SKIPPED]`
        

At the end:

-   Full summary
    
-   Number of created issues
    
-   Skipped items
    

* * *

## 🧩 Automatic Naming

## 

After creation, each issue is automatically renamed to:

    ISSUE-<number>: <original title>
    

* * *

## 🔐 Configuration

## 

Make sure you:

1.  Are authenticated with GitHub CLI
    
2.  Are inside a GitHub repository
    
3.  Have permissions to create issues
    

* * *

## 📁 Available Scripts

## 

    "scripts": {
      "issue:run": "DRY_RUN=false npx tsx src/bulk-issues.ts",
      "issue:plan": "DRY_RUN=true npx tsx src/bulk-issues.ts",
      "issue:single": "DRY_RUN=false npx tsx src/create-issue.ts"
    }
    

* * *

## 🧭 Recommended Workflow

## 

1.  Define issues in a JSON file
    
2.  Run simulation:
    
        npm run issue:plan issues.json
        
    
3.  Review output
    
4.  Run actual creation:
    
        npm run issue:run issues.json
        
    

* * *

## 🛠️ Tech Stack

## 

-   TypeScript
    
-   Node.js
    
-   GitHub CLI
    
-   tsx
    

* * *

## 📄 License: MIT

* * *

## 👨‍💻 Author: 7eightDev

* * *

## 💡 Philosophy

## 

This tool is built to:

-   remove manual repetition from workflows
    
-   standardize backlog structure
    
-   bridge development and project management
    

* * *

## 🚀 Future Ideas

## 

-   Multi-repository support
    
-   Bidirectional sync with GitHub
    
-   UI dashboard
    
-   Advanced issue templates
    

* * *

**Build fast. Track better. Scale clean.**
