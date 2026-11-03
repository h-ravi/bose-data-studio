/**
 * Bose Data Studio - Sidebar Module
 * Manages Database dropdown, table tree & table filtering
 */
const StudioSidebar = {
    allTables: [],

    init() {
        this.selectDb = document.getElementById("select-database");
        this.btnRefreshDbs = document.getElementById("btn-refresh-dbs");
        this.inputSearch = document.getElementById("input-search-tables");
        this.containerTables = document.getElementById("tables-list-container");
        this.badgeCount = document.getElementById("tables-count");

        this.selectDb.addEventListener("change", () => this.onDatabaseChanged());
        this.btnRefreshDbs.addEventListener("click", () => this.reloadDatabases());
        this.inputSearch.addEventListener("input", (e) => {
            const engine = StudioApp.state.connection.engine;
            if (engine === "redis") {
                StudioRedis.filterKeys(e.target.value);
            } else if (engine === "mongo") {
                StudioMongo.filterCollections(e.target.value);
            } else {
                this.filterTables(e.target.value);
            }
        });
    },

    async reloadDatabases() {
        const conn = StudioApp.state.connection;
        this.selectDb.innerHTML = `<option value="">Loading databases...</option>`;
        
        const dbs = await StudioAPI.listDatabases();
        if (!dbs || dbs.length === 0) {
            this.selectDb.innerHTML = `<option value="">(No databases found)</option>`;
            this.renderTables([]);
            return;
        }

        let html = `<option value="">-- Choose Database --</option>`;
        dbs.forEach(db => {
            const isSel = db === StudioApp.state.currentDb ? "selected" : "";
            html += `<option value="${db}" ${isSel}>${db}</option>`;
        });
        this.selectDb.innerHTML = html;

        if (StudioApp.state.currentDb && dbs.includes(StudioApp.state.currentDb)) {
            this.selectDb.value = StudioApp.state.currentDb;
            await this.loadTablesForDb(StudioApp.state.currentDb);
        } else if (dbs.length === 1 && conn.engine === "sqlite") {
            this.selectDb.value = dbs[0];
            await this.onDatabaseChanged();
        }
    },

    async onDatabaseChanged() {
        const dbName = this.selectDb.value;
        StudioApp.state.currentDb = dbName;
        StudioApp.state.currentTable = null;
        
        if (!dbName) {
            this.renderTables([]);
            return;
        }

        await this.loadTablesForDb(dbName);
    },

    async loadTablesForDb(dbName) {
        this.containerTables.innerHTML = `<li class="table-item-empty">Loading tables...</li>`;
        const tables = await StudioAPI.listTables(dbName);
        this.allTables = tables || [];
        this.renderTables(this.allTables);

        // Auto-select first table if available
        if (this.allTables.length > 0 && !StudioApp.state.currentTable) {
            this.selectTable(this.allTables[0]);
        }
    },

    filterTables(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            this.renderTables(this.allTables);
            return;
        }
        const filtered = this.allTables.filter(t => t.toLowerCase().includes(q));
        this.renderTables(filtered);
    },

    renderTables(tables) {
        this.badgeCount.textContent = tables.length;
        if (tables.length === 0) {
            this.containerTables.innerHTML = `<li class="table-item-empty">No tables available</li>`;
            return;
        }

        let html = "";
        tables.forEach(tableName => {
            const isActive = tableName === StudioApp.state.currentTable ? "active" : "";
            html += `
                <li class="table-item ${isActive}" data-table="${tableName}">
                    <span>📄</span>
                    <span class="table-name-text">${tableName}</span>
                </li>
            `;
        });
        this.containerTables.innerHTML = html;

        // Attach click events
        this.containerTables.querySelectorAll(".table-item").forEach(item => {
            item.addEventListener("click", () => {
                const name = item.dataset.table;
                this.selectTable(name);
            });
        });
    },

    selectTable(tableName) {
        StudioApp.state.currentTable = tableName;
        
        // Highlight active
        this.containerTables.querySelectorAll(".table-item").forEach(item => {
            item.classList.toggle("active", item.dataset.table === tableName);
        });

        // Trigger active tab reload
        StudioApp.onTableSelected(tableName);
    }
};

window.StudioSidebar = StudioSidebar;
