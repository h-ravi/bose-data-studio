# 📘 Bose Data Studio — Comprehensive User Guide & Technical Manual

Welcome to the official User Guide for **Bose Data Studio**, an ultra-lightweight, zero-dependency universal database management studio built from scratch with pure **BoseLang** bytecode VM and modern vanilla web technologies.

This manual provides in-depth technical knowledge, step-by-step instructions for all supported database engines, data editing workflows, security architecture details, and troubleshooting procedures.

---

## 📑 Table of Contents

1. [Introduction & System Architecture](#1-introduction--system-architecture)
2. [Prerequisites & Getting Started](#2-prerequisites--getting-started)
3. [Database Connection Guides](#3-database-connection-guides)
   - [3.1 SQLite3 (Local Embedded File)](#31-sqlite3-local-embedded-file)
   - [3.2 MariaDB & MySQL](#32-mariadb--mysql)
   - [3.3 PostgreSQL](#33-postgresql)
   - [3.4 Redis (In-Memory Key-Value & TTL)](#34-redis-in-memory-key-value--ttl)
   - [3.5 MongoDB (Document Store)](#35-mongodb-document-store)
4. [Using the Visual Data Grid](#4-using-the-visual-data-grid)
5. [Schema Designer & Structure Viewer](#5-schema-designer--structure-viewer)
6. [Interactive SQL Console](#6-interactive-sql-console)
7. [Multi-Tab & Multi-Database Workflow](#7-multi-tab--multi-database-workflow)
8. [Security & Protection Architecture](#8-security--protection-architecture)
9. [Troubleshooting & Frequently Asked Questions](#9-troubleshooting--frequently-asked-questions)

---

## 1. Introduction & System Architecture

Bose Data Studio is designed to address a critical pain point in modern database tooling: **resource bloat**. Popular database managers (DBeaver, DataGrip, Azure Data Studio) consume between 500MB and 1.5GB of RAM, take 5–15 seconds to launch, and require heavy Java or Electron runtimes.

Bose Data Studio operates on a **zero-dependency runtime model**:
* **Backend:** Runs on `bose.exe` (1.4MB), a custom Rust-engineered bytecode virtual machine.
* **Frontend:** Vanilla HTML5, modern CSS, and modular ES6 JavaScript. No bundlers, no Node.js, no npm dependencies.
* **Database Drivers:** Bundled portable CLI clients (`drivers/mariadb.exe`, `drivers/sqlite3.exe`) and native CLI adapters.
* **Memory Footprint:** Starts in under 1 second and consumes approximately **20–30 MB of RAM**.

```
[ Browser UI (Port 7474) ]
         │ (HTTP REST + JSON)
         ▼
[ BoseLang Server (server.bose) ] ── (In-Memory Session Vault)
         │
         ├── security.bose (Regex Identifier Guard & Query Sanitizer)
         └── drivers.bose  (Microsecond Timestamped SQL Redirection)
                  │
                  ├── MariaDB / MySQL (3306) via mariadb.exe
                  ├── SQLite3 (.db file) via sqlite3.exe
                  ├── PostgreSQL (5432) via psql
                  ├── Redis (6379) via redis-cli
                  └── MongoDB (27017) via mongosh
```

---

## 2. Prerequisites & Getting Started

### System Requirements
* **Operating System:** Windows 10 / 11 / Windows Server (64-bit).
* **RAM:** Minimum 64 MB (Studio uses ~25 MB).
* **Disk Space:** ~20 MB (including bundled portable drivers).
* **Web Browser:** Any modern web browser (Chrome, Edge, Firefox, Brave).

### Launching the Studio
1. Navigate to the project directory:
   ```bash
   cd bose-data-studio
   ```
2. Run the application:
   * **Easy Method:** Double-click `run.bat`.
   * **Command Line:** Run `./bose.exe server.bose`.
3. Open your browser and visit:
   ```
   http://localhost:7474
   ```

---

## 3. Database Connection Guides

When you launch Bose Data Studio, you are greeted with the **Connection Modal**. Select your target database engine from the tabs at the top.

### 3.1 SQLite3 (Local Embedded File)

SQLite requires **no server, no port, and no credentials**. It operates directly on a file on disk.

* **Database File Path:** Enter the relative or absolute path to your database file (e.g., `sample.db` or `D:/data/myapp.db`).
* **Auto-Creation:** If the specified file does not exist, Bose Data Studio will automatically initialize a blank SQLite database file for you.
* **Sample Database:** The studio comes with a pre-configured `sample.db` containing `users` and `system_settings` tables ready for instant testing.

### 3.2 MariaDB & MySQL

Connects to standard local or remote MariaDB and MySQL servers.

* **Engine:** Choose `MariaDB / MySQL`.
* **Host:** `127.0.0.1` or `localhost` (default).
* **Port:** Default is `3306`. (If using LPS integrated services, verify the port configured in LPS).
* **User:** `root` or your specific database username.
* **Password:** Enter your database password (or leave blank if none).
* **Database (Optional):** Enter a specific database name, or leave blank to automatically list all available databases on the server.

### 3.3 PostgreSQL

Connects to PostgreSQL relational servers.

* **Host:** `127.0.0.1` or remote IP.
* **Port:** Default is `5432`.
* **User:** `postgres` or your database username.
* **Password:** Enter password.
* **Database:** Default is `postgres`.

### 3.4 Redis (In-Memory Key-Value & TTL)

Redis is an in-memory data store frequently used for caching, session management, and real-time queues.

* **Host:** `127.0.0.1`.
* **Port:** Default is `6379`.
* **Password (Optional):** Enter password if your Redis server requires authentication (`AUTH`).
* **DB Index:** Select database index `0` through `15` (default is `0`).
* **Key Features in Studio:**
  * **Key Browser:** Lists all keys matching `*`.
  * **Type Detection:** Identifies `string`, `hash`, `list`, `set`, and `zset`.
  * **TTL Inspector:** Shows remaining Time-To-Live in seconds, or flags permanent keys.
  * **Live Editing:** Edit values directly and update TTLs without using CLI commands.

### 3.5 MongoDB (Document Store)

Connects to MongoDB document databases.

* **Host:** `127.0.0.1`.
* **Port:** Default is `27017`.
* **Database:** Target database name.
* **Collection Browser:** View documents formatted as JSON, edit fields inline, and run custom JSON filter queries.

---

## 4. Using the Visual Data Grid

The **Data Grid** is the primary workspace for viewing and editing records.

### Browsing & Filtering
* **Select Table:** Click on any table name in the left sidebar under **TABLES**.
* **Filter Rows:** Use the **Filter rows...** search box in the toolbar to perform instant client-side substring matching across all visible columns.
* **Pagination:** Use the `< Prev` and `Next >` buttons to navigate pages. The grid loads 50 records per page to maintain high performance even on tables with millions of rows.

### Adding a New Row
1. Click the blue **+ Add Row** button on the toolbar.
2. A modal will display an input field for each column in the active table.
3. Fill in the values and click **Save Row**. The new record is committed to the database immediately and the grid refreshes.

### Editing a Cell (Inline Editing)
1. Double-click on any cell in the table grid.
2. The cell transforms into an active text input box.
3. Modify the value and press `Enter` (or click outside the cell) to save.
4. Studio automatically generates and executes an optimized `UPDATE ... WHERE id = ...` query against the database.

### Deleting a Row
* Click the **Trash Can icon (🗑️)** in the **Action** column of any row.
* Confirm the prompt to permanently delete the record.

---

## 5. Schema Designer & Structure Viewer

Click the **🏛️ Structure** tab at the top of the main view to inspect and manage your schema.

* **Column Metadata:** View column names, data types (e.g. `INTEGER`, `VARCHAR(255)`, `DATETIME`), nullability (`YES`/`NO`), default values, and primary key status (`PRI`).
* **Visual Representation:** Understand the exact schema definition without having to write `DESCRIBE table_name` or `PRAGMA table_info()` queries manually.

---

## 6. Interactive SQL Console

Click the **📜 SQL Console** tab to write and execute custom SQL statements.

* **Multi-Line Editor:** Write arbitrary queries, including complex `JOIN`s, subqueries, aggregations (`COUNT`, `SUM`, `AVG`), and DDL statements (`CREATE TABLE`, `ALTER TABLE`).
* **Execution:** Click the **Run SQL** button or press `Ctrl + Enter`.
* **Execution Metrics:** Every query returns execution duration with millisecond precision (e.g., `⚡ Query executed in 14.2ms`), helping you identify slow queries.
* **Results Table:** `SELECT` queries render in an interactive table format. Non-selecting queries (`INSERT`, `UPDATE`, `DELETE`) show affected row counts.

---

## 7. Multi-Tab & Multi-Database Workflow

One of Bose Data Studio's most powerful capabilities is **simultaneous multi-database management without interference**.

### How it works:
1. **Open Tab 1:** Navigate to `http://localhost:7474` and connect to **MariaDB** (port 3306).
2. **Open Tab 2:** In the same browser, open a new tab to `http://localhost:7474`. Because session tokens are saved in browser-isolated `sessionStorage`, Tab 2 opens a clean connection window.
3. **Connect Tab 2 to Redis or SQLite:** Connect Tab 2 to your local Redis instance (port 6379) or a local SQLite file.
4. **Independent Execution:** Both tabs communicate with the backend via distinct session tokens (`bose_sess_...`). You can run queries in both tabs at the exact same time without data crossover.
5. **Safe Disconnect:** Clicking **Switch / Disconnect** in Tab 1 will purge only Tab 1's session from the backend vault; Tab 2 remains active and unaffected.

---

## 8. Security & Protection Architecture

Bose Data Studio incorporates enterprise-grade security controls:

### 1. Zero Shell Injection Risk (Temporary Script File Redirection)
In typical CLI wrapper tools, running `mysql.exe -e "SELECT * FROM users WHERE name = '...'"` is vulnerable to shell metacharacter injection (`"`, `&`, `|`, `^`, `%`).
Bose Data Studio **never passes raw SQL via command-line arguments**. Instead:
1. The server writes the query to an isolated temporary file with microsecond timestamping (`_tmp_my_<timestamp>.sql`).
2. The CLI executes via stdin redirection: `mariadb.exe ... < "_tmp_my_...sql"`.
3. The temporary file is immediately deleted upon execution.
4. This ensures **0% possibility of shell command injection** and bypasses Windows 8,191-character command-line limits.

### 2. Strict Identifier Whitelisting
SQL parameterization protects values, but table and column names cannot be parameterized. Bose Data Studio enforces a strict alphanumeric whitelist regex:
```bose
^[a-zA-Z0-9_]+$
```
Any table or column name containing spaces, semicolons, comments, or quotes is immediately rejected before query synthesis.

### 3. Destructive Query Interception
Accidental execution of `DROP TABLE`, `DROP DATABASE`, or `TRUNCATE TABLE` can cause catastrophic data loss. Studio's query parser scans for destructive keywords regardless of whitespace or formatting and presents a mandatory user confirmation dialog.

### 4. Credential Memory Zeroization
Database passwords entered in the connection modal are transmitted over local HTTP, verified, and **immediately wiped from DOM input fields and client memory**. Tokens stored in `sessionStorage` contain no password or plaintext credentials.

---

## 9. Troubleshooting & Frequently Asked Questions

### Q1: "Could not connect to MariaDB/MySQL at 127.0.0.1:3306"
* **Cause:** MariaDB service is not running or is configured on a different port.
* **Fix:** 
  1. Open LPS or Windows Services and verify that MariaDB/MySQL is started.
  2. If running MariaDB via LPS, check which port is assigned (e.g. 3306).
  3. Ensure your username and password are correct.

### Q2: "Port 7474 is already in use"
* **Cause:** Another instance of Bose Data Studio is already running in the background.
* **Fix:** Close the existing terminal window or kill the running `bose.exe` process via Task Manager, then run `run.bat` again.

### Q3: "SQLite database is locked"
* **Cause:** Another external application has opened the SQLite file in exclusive write mode.
* **Fix:** Close external database viewers (or your backend application) that holds an exclusive lock on the `.db` file.

### Q4: "Can I connect to remote databases over the internet?"
* **Answer:** Yes! In the Host field, enter the remote server's IP address or domain name (e.g., `db.mycompany.com`). Ensure that your database firewall allows connections from your IP.

---

<p align="center">
  <strong>Bose Data Studio</strong> — Fast. Lightweight. Secure.<br>
  Developed by <a href="https://github.com/h-ravi">h-ravi</a>.
</p>
