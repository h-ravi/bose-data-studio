/**
 * Bose Data Studio - Application Coordinator
 * State Management, Modals & Initialization
 */
const StudioApp = {
    state: {
        connection: {
            engine: "mysql",
            host: "127.0.0.1",
            port: 3306,
            user: "root",
            pass: "",
            database: ""
        },
        currentDb: "",
        currentTable: null,
        activeTab: "grid"
    },

    async init() {
        console.log("⚡ Bose Data Studio (Secure Production Gateway) initializing...");

        // Initialize child modules
        StudioSidebar.init();
        StudioCRUD.init();
        StudioDesigner.init();
        StudioRedis.init();
        StudioMongo.init();
        StudioGrid.init();
        StudioSQL.init();

        this.initTabs();
        this.initConnectionModal();

        // Connect to default local SQLite sample.db on boot (relative path)
        const defaultSample = "sample.db";
        const auth = await StudioAPI.connect({ engine: "sqlite", database: defaultSample });
        if (auth && auth.token) {
            this.state.connection = { engine: "sqlite", database: defaultSample };
            this.state.currentDb = "main";
            this.updateConnectionLabel();
            StudioSidebar.reloadDatabases();
        } else {
            this.updateConnectionLabel();
        }
    },

    initTabs() {
        const tabBtns = document.querySelectorAll(".tab-btn");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetTab = btn.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    },

    switchTab(tabId) {
        this.state.activeTab = tabId;

        // Toggle buttons
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });

        // Toggle views
        document.querySelectorAll(".tab-content").forEach(content => {
            content.classList.toggle("active", content.id === `tab-${tabId}`);
        });

        // Trigger tab content loading if table selected
        if (tabId === "grid") {
            StudioGrid.loadActiveTableData();
        } else if (tabId === "structure") {
            StudioGrid.loadActiveTableStructure();
        } else if (tabId === "sql" && this.state.currentTable) {
            if (!StudioSQL.inputSql.value.trim()) {
                const quote = this.state.connection.engine === "sqlite" ? `"` : "`";
                StudioSQL.setQueryText(`SELECT * FROM ${quote}${this.state.currentTable}${quote} LIMIT 50;`);
            }
        }
    },

    onTableSelected(tableName) {
        if (this.state.activeTab === "grid") {
            StudioGrid.loadActiveTableData(true);
        } else if (this.state.activeTab === "structure") {
            StudioGrid.loadActiveTableStructure();
        } else if (this.state.activeTab === "sql") {
            const quote = this.state.connection.engine === "sqlite" ? `"` : "`";
            StudioSQL.setQueryText(`SELECT * FROM ${quote}${tableName}${quote} LIMIT 50;`);
        }
    },

    initConnectionModal() {
        const modal = document.getElementById("modal-connect");
        const btnOpen = document.getElementById("btn-open-connect");
        const btnQuick = document.getElementById("btn-quick-connect");
        const btnClose = document.getElementById("btn-close-connect");
        const btnCancel = document.getElementById("btn-cancel-connect");
        const btnSave = document.getElementById("btn-save-connect");

        const openModal = () => modal.classList.add("active");
        const closeModal = () => modal.classList.remove("active");

        btnOpen.addEventListener("click", openModal);
        btnQuick.addEventListener("click", openModal);
        btnClose.addEventListener("click", closeModal);
        btnCancel.addEventListener("click", closeModal);

        // Engine Tabs (MySQL vs SQLite)
        const engineTabs = document.querySelectorAll(".engine-tab");
        engineTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                engineTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                const engine = tab.dataset.engine;
                document.getElementById("fields-mysql").style.display = engine === "mysql" ? "block" : "none";
                document.getElementById("fields-sqlite").style.display = engine === "sqlite" ? "block" : "none";
                document.getElementById("fields-postgres").style.display = engine === "postgres" ? "block" : "none";
                document.getElementById("fields-redis").style.display = engine === "redis" ? "block" : "none";
                document.getElementById("fields-mongo").style.display = engine === "mongo" ? "block" : "none";
            });
        });

        // Save & Connect with Authoritative Backend Vault
        btnSave.addEventListener("click", async () => {
            const activeTab = document.querySelector(".engine-tab.active");
            const engine = activeTab ? activeTab.dataset.engine : "mysql";
            let config = { engine };

            if (engine === "sqlite") {
                const path = document.getElementById("conn-sqlite-path").value.trim();
                if (!path) {
                    alert("Please enter a valid SQLite .db file path.");
                    return;
                }
                config.database = path;
            } else if (engine === "postgres") {
                config.host = document.getElementById("conn-postgres-host").value.trim() || "127.0.0.1";
                config.port = parseInt(document.getElementById("conn-postgres-port").value.trim(), 10) || 5432;
                config.database = document.getElementById("conn-postgres-db").value.trim() || "postgres";
                config.user = document.getElementById("conn-postgres-user").value.trim() || "postgres";
                config.pass = document.getElementById("conn-postgres-pass").value;
            } else if (engine === "redis") {
                config.host = document.getElementById("conn-redis-host").value.trim() || "127.0.0.1";
                config.port = parseInt(document.getElementById("conn-redis-port").value.trim(), 10) || 6379;
                config.pass = document.getElementById("conn-redis-pass").value;
                config.dbIndex = parseInt(document.getElementById("conn-redis-db").value.trim(), 10) || 0;
            } else if (engine === "mongo") {
                config.host = document.getElementById("conn-mongo-host").value.trim() || "127.0.0.1";
                config.port = parseInt(document.getElementById("conn-mongo-port").value.trim(), 10) || 27017;
                config.database = document.getElementById("conn-mongo-db").value.trim() || "app_db";
                config.user = document.getElementById("conn-mongo-user").value.trim() || "";
            } else {
                config.host = document.getElementById("conn-mysql-host").value.trim() || "127.0.0.1";
                config.port = parseInt(document.getElementById("conn-mysql-port").value.trim(), 10) || 3306;
                config.user = document.getElementById("conn-mysql-user").value.trim() || "root";
                config.pass = document.getElementById("conn-mysql-pass").value;
                config.database = "";
            }

            btnSave.disabled = true;
            btnSave.textContent = "Authenticating...";

            const authRes = await StudioAPI.connect(config);
            btnSave.disabled = false;
            btnSave.textContent = "Connect & Load";

            // Zeroize sensitive inputs immediately from DOM
            const passMysql = document.getElementById("conn-mysql-pass");
            const passRedis = document.getElementById("conn-redis-pass");
            const passPg = document.getElementById("conn-postgres-pass");
            if (passMysql) passMysql.value = "";
            if (passRedis) passRedis.value = "";
            if (passPg) passPg.value = "";

            if (!authRes || authRes.status !== "ok") {
                const errMsg = authRes && authRes.error ? authRes.error : "Database server unreachable or connection refused.";
                alert(`❌ Connection Failed:\n\n${errMsg}`);
                return;
            }

            // Store ONLY safe metadata in frontend state (NO PASSWORDS)
            this.state.connection = {
                engine: authRes.engine,
                host: authRes.host,
                port: authRes.port,
                database: authRes.database,
                user: authRes.user
            };

            this.state.currentDb = authRes.database || (engine === "sqlite" ? "main" : "");
            this.state.currentTable = null;
            this.updateConnectionLabel();
            closeModal();

            if (engine === "redis") {
                this.applyRedisMode(true);
                this.applyMongoMode(false);
                StudioRedis.loadRedisKeys();
            } else if (engine === "mongo") {
                this.applyRedisMode(false);
                this.applyMongoMode(true);
                StudioMongo.loadCollections();
            } else {
                this.applyRedisMode(false);
                this.applyMongoMode(false);
                StudioSidebar.reloadDatabases();
            }
        });
    },

    applyRedisMode(isRedis) {
        document.querySelector(".db-picker-section").style.display = isRedis ? "none" : "block";
        document.querySelector(".tables-header-title").textContent = isRedis ? "REDIS KEYS" : "TABLES";
        document.getElementById("input-search-tables").placeholder = isRedis ? "Search keys (e.g. user:*)..." : "Search tables...";
        document.querySelector(".grid-table-wrapper").style.display = isRedis ? "none" : "block";
        document.querySelector(".grid-toolbar").style.display = isRedis ? "none" : "flex";
        document.getElementById("tab-redis-inspector").style.display = isRedis ? "flex" : "none";
        document.querySelector("button[data-tab='structure']").style.display = isRedis ? "none" : "flex";

        const btnNew = document.getElementById("btn-open-create-table");
        btnNew.textContent = isRedis ? "+ Key" : "+ New";
        btnNew.onclick = isRedis ? () => StudioRedis.openAddKeyModal() : null;
    },

    applyMongoMode(isMongo) {
        document.querySelector(".db-picker-section").style.display = isMongo ? "none" : "block";
        document.querySelector(".tables-header-title").textContent = isMongo ? "COLLECTIONS" : "TABLES";
        document.getElementById("input-search-tables").placeholder = isMongo ? "Search collections..." : "Search tables...";
        document.querySelector(".grid-table-wrapper").style.display = "block";
        document.querySelector(".grid-toolbar").style.display = "flex";
        document.getElementById("tab-redis-inspector").style.display = "none";
        document.querySelector("button[data-tab='structure']").style.display = isMongo ? "none" : "flex";

        const btnNew = document.getElementById("btn-open-create-table");
        const btnAddRow = document.getElementById("btn-open-insert");

        if (isMongo) {
            btnNew.textContent = "+ Col";
            btnNew.onclick = () => {
                const name = prompt("Enter new collection name:");
                if (name && name.trim()) {
                    StudioAPI.executeMongoCmd(this.state.connection, "create_collection", {
                        db: this.state.currentDb || "app_db",
                        collection: name.trim()
                    }).then(() => StudioMongo.loadCollections());
                }
            };
            if (btnAddRow) btnAddRow.textContent = "+ Add Doc";
        } else {
            btnNew.textContent = "+ New";
            btnNew.onclick = null;
            if (btnAddRow) btnAddRow.textContent = "+ Add Row";
        }
    },

    updateConnectionLabel() {
        const label = document.getElementById("active-conn-text");
        const conn = this.state.connection;
        if (conn.engine === "sqlite") {
            const fileName = conn.database ? conn.database.split("\\").pop().split("/").pop() : "No file";
            label.textContent = `📁 SQLite: ${fileName}`;
        } else if (conn.engine === "redis") {
            label.textContent = `⚡ Redis @ ${conn.host}:${conn.port} [DB ${conn.dbIndex || 0}]`;
        } else if (conn.engine === "mongo") {
            label.textContent = `🍃 MongoDB @ ${conn.host}:${conn.port} [${conn.database || "app_db"}]`;
        } else if (conn.engine === "postgres") {
            label.textContent = `🐘 PostgreSQL @ ${conn.host}:${conn.port} [${conn.database || "postgres"}]`;
        } else {
            label.textContent = `🐬 MariaDB @ ${conn.host}:${conn.port}`;
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    StudioApp.init();
});
