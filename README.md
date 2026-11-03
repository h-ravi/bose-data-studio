# ⚡ Bose Data Studio

<p align="center">
  <img src="home.png" alt="Bose Data Studio Preview" width="100%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  <a href="#architecture"><img src="https://img.shields.io/badge/Engine-Pure%20BoseLang-orange.svg" alt="BoseLang Engine" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/RAM%20Usage-~25MB-brightgreen.svg" alt="RAM Usage" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/Launch%20Time-%3C1s-success.svg" alt="Instant Launch" /></a>
  <a href="#supported-databases"><img src="https://img.shields.io/badge/Databases-SQL%20%2B%20NoSQL-purple.svg" alt="Databases" /></a>
</p>

<p align="center">
  <strong>The ultra-lightweight, zero-dependency universal database management studio and visual GUI.</strong><br>
  Built from scratch on the native <strong>BoseLang</strong> virtual machine and vanilla web technologies.
</p>

---

## 🌟 Why Bose Data Studio?

Modern database clients like **DBeaver**, **DataGrip**, and **pgAdmin** are powerful, but they come at a heavy cost: **hundreds of megabytes of downloads, heavy Java or Electron runtimes, high memory consumption (500MB–1GB+ RAM), and sluggish startup times**.

**Bose Data Studio** solves this completely. It is an instant-launch, single-binary database manager requiring **no Java, no Node.js, no Python, and no Electron**. It runs in under **25MB of RAM**, launches in milliseconds, and connects seamlessly to both SQL and NoSQL databases.

### 📊 Benchmark Comparison

| Feature / Metric | DBeaver / DataGrip | phpMyAdmin | TablePlus | ⚡ Bose Data Studio |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime Footprint** | Java / JVM (250MB+) | PHP + Web Server | Native C++ (Paid) | **Pure BoseLang (<15MB)** |
| **RAM Consumption** | 500 MB – 1.2 GB | ~80 MB | ~120 MB | **~ 20–30 MB (Ultra-Light)** |
| **Startup Speed** | 5 – 12 seconds | Web server load | 1 – 2 seconds | **< 1 Second (Instant)** |
| **Installation** | Heavy installer / JDK | Apache + PHP setup | Native installer | **Zero-Install (Portable Zip)** |
| **SQL Support** | Yes | Only MySQL/MariaDB | Yes | **MariaDB, MySQL, SQLite, Postgres** |
| **NoSQL Support** | Limited / Plugins | No | Limited | **Native Redis & MongoDB** |
| **Multi-Tab Isolation** | Window-based | Cookie session | Tab-based | **Isolated Per-Tab Session Vault** |
| **License** | Community / Proprietary | GPL | Proprietary ($) | **MIT (Free & Open Source)** |

---

## 🚀 Key Features

* **🗄️ Multi-Engine Database Support:**
  * **MariaDB & MySQL:** Full SQL queries, database explorer, interactive table grid, schema designer, and CRUD.
  * **SQLite3:** Zero-configuration, serverless embedded SQL engine. Open or create local `.db` files instantly.
  * **PostgreSQL:** Multi-database connection, relational schema navigation, and query execution.
  * **Redis (In-Memory Key-Value):** Live key browser, real-time TTL inspector, type identification (`string`, `hash`, `list`, `set`), and inline editing.
  * **MongoDB:** Document database browser, collection manager, and JSON filter query engine.
* **📑 Independent Multi-Tab Isolation:**
  * Open multiple tabs in your browser simultaneously (`http://localhost:7474`).
  * Connect Tab 1 to MariaDB (Port 3306), Tab 2 to Redis (Port 6379), and Tab 3 to SQLite — **zero interference or cross-talk**, powered by client-side `sessionStorage` and backend Session Vault architecture.
* **📊 Visual Data Grid:**
  * Real-time search and filter across records.
  * Direct inline cell editing with instant database synchronization.
  * Smart pagination (custom limits, next/prev navigation).
  * 1-click new record insertion modal.
* **🏛️ Schema Designer & Structure Viewer:**
  * Inspect table definitions, column types, nullability, defaults, and primary keys without running manual SQL.
* **📜 Interactive SQL Console:**
  * Multi-line SQL execution with execution timer (millisecond precision).
  * Tabular output display for complex queries, `JOIN`s, aggregations, and subqueries.
* **🛡️ Hardened Security Architecture:**
  * **0% Shell Injection Risk:** Queries execute via uniquely-timestamped temporary script files (`< _tmp.sql`), completely eliminating command-line argument injection and Windows length limits.
  * **Strict Identifier Whitelisting:** Table and column names strictly validated with `^[a-zA-Z0-9_]+$`.
  * **Destructive Query Interception:** Automatic warnings and confirmation for accidental `DROP` or `TRUNCATE` operations.
  * **XSS Sanitization & Credential Zeroization:** Passwords are wiped from memory immediately upon connection.

---

## ⚡ Quickstart

### Option 1: One-Click Run (Windows)
1. Clone or download this repository.
2. Double-click `run.bat`.
3. Open your browser and navigate to:
   ```
   http://localhost:7474
   ```

### Option 2: Manual Start via BoseLang VM
```bash
# Clone the repository
git clone https://github.com/h-ravi/bose-data-studio.git
cd bose-data-studio

# Start the server using the bundled BoseLang bytecode engine
.\bose.exe server.bose
```

---

## 📖 In-Depth User Guide

For detailed step-by-step guides on connecting to databases, writing queries, managing Redis keys, and troubleshooting, read our comprehensive [**USER_GUIDE.md**](USER_GUIDE.md).

---

## 🏗️ Architecture & Project Structure

Bose Data Studio is engineered with clean modularity, maintaining strict file-size constraints (all source files under 400 lines) with clear separation of concerns:

```
bose-data-studio/
├── bose.exe               # Native BoseLang Bytecode Virtual Machine (1.4MB)
├── server.bose            # HTTP REST API Gateway, Routing & Session Vault
├── drivers.bose           # Database CLI Drivers (MariaDB, SQLite, Postgres, Redis, Mongo)
├── security.bose          # Sanitizer, SQL Builder, Identifier Guard & Security
├── run.bat                # 1-Click launcher script
├── home.png               # High-resolution Studio Preview
├── drivers/               # Bundled portable database CLI drivers
│   ├── mariadb.exe        # Portable MariaDB/MySQL Client (4.8MB)
│   └── sqlite3.exe        # Portable SQLite3 Engine (4.2MB)
└── public/                # Frontend GUI (Vanilla HTML5 / Modern CSS / Pure JS)
    ├── index.html         # Application Shell & Modals
    ├── css/
    │   └── studio.css     # Sleek Dark/Light Theme & Responsive Design
    └── js/
        ├── app.js             # State Controller & Lifecycle Orchestrator
        ├── studio_api.js      # Backend-Authoritative RPC with Session Tokens
        ├── studio_sidebar.js  # Database Switcher & Table List Manager
        ├── studio_grid.js     # High-Performance Data Table with Inline Editing
        ├── studio_crud.js     # Create, Read, Update, Delete Controller
        ├── studio_designer.js # Visual Schema & Structure Viewer
        ├── studio_sql.js      # Interactive SQL Console & Runner
        ├── studio_redis.js    # Key-Value, TTL & Redis Data Structure Explorer
        └── studio_mongo.js    # Document Browser & JSON Query Filter
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/h-ravi/bose-data-studio/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<p align="center">
  Crafted with ❤️ using <strong>BoseLang</strong>.
</p>
