/**
 * Bose Data Studio - Visual Designer Module
 * Handles Create Database & Visual Table Designer Modal
 */
const StudioDesigner = {
    init() {
        this.modalDb = document.getElementById("modal-create-db");
        this.inputDbName = document.getElementById("input-new-db-name");
        this.btnOpenDb = document.getElementById("btn-open-create-db");
        this.btnCloseDb = document.getElementById("btn-close-create-db");
        this.btnCancelDb = document.getElementById("btn-cancel-create-db");
        this.btnSubmitDb = document.getElementById("btn-submit-create-db");

        this.modalTable = document.getElementById("modal-create-table");
        this.inputTableName = document.getElementById("input-designer-table-name");
        this.colsContainer = document.getElementById("designer-columns-list");
        this.btnOpenTable = document.getElementById("btn-open-create-table");
        this.btnCloseTable = document.getElementById("btn-close-create-table");
        this.btnCancelTable = document.getElementById("btn-cancel-create-table");
        this.btnAddCol = document.getElementById("btn-add-designer-col");
        this.btnSubmitTable = document.getElementById("btn-submit-create-table");

        // Event Listeners - DB
        this.btnOpenDb.addEventListener("click", () => this.openCreateDbModal());
        this.btnCloseDb.addEventListener("click", () => this.modalDb.classList.remove("active"));
        this.btnCancelDb.addEventListener("click", () => this.modalDb.classList.remove("active"));
        this.btnSubmitDb.addEventListener("click", () => this.submitCreateDb());

        // Event Listeners - Table
        this.btnOpenTable.addEventListener("click", () => this.openCreateTableModal());
        this.btnCloseTable.addEventListener("click", () => this.modalTable.classList.remove("active"));
        this.btnCancelTable.addEventListener("click", () => this.modalTable.classList.remove("active"));
        this.btnAddCol.addEventListener("click", () => this.addColumnRow());
        this.btnSubmitTable.addEventListener("click", () => this.submitCreateTable());
    },

    openCreateDbModal() {
        const { connection } = StudioApp.state;
        this.inputDbName.value = "";
        const hint = document.getElementById("create-db-hint");
        if (connection.engine === "sqlite") {
            hint.textContent = "For SQLite: Enter file name or path (e.g. new_store.db).";
        } else {
            hint.textContent = "Creates a new database schema on active MariaDB/MySQL server.";
        }
        this.modalDb.classList.add("active");
        this.inputDbName.focus();
    },

    async submitCreateDb() {
        const dbName = this.inputDbName.value.trim();
        if (!dbName) {
            alert("Please enter a database name.");
            return;
        }

        const { connection } = StudioApp.state;
        if (connection.engine === "sqlite") {
            StudioApp.state.connection = { engine: "sqlite", database: dbName };
            StudioApp.state.currentDb = dbName.split("\\").pop().split("/").pop();
            this.modalDb.classList.remove("active");
            StudioApp.updateConnectionLabel();
            StudioSidebar.reloadDatabases();
            return;
        }

        const sql = `CREATE DATABASE \`${dbName.replace(/`/g, "")}\`;`;
        const res = await StudioAPI.executeRawSQL(sql, false, "");
        if (res.error) {
            alert(`Failed to create database: ${res.error}`);
            return;
        }

        this.modalDb.classList.remove("active");
        StudioApp.state.currentDb = dbName;
        await StudioSidebar.reloadDatabases();
    },

    openCreateTableModal() {
        const { currentDb } = StudioApp.state;
        if (!currentDb) {
            alert("Please select or create a database first.");
            return;
        }

        this.inputTableName.value = "";
        this.colsContainer.innerHTML = "";

        // Default 2 standard columns
        this.addColumnRow("id", "INTEGER", true, true);
        this.addColumnRow("name", "VARCHAR(255)", false, true);

        this.modalTable.classList.add("active");
        this.inputTableName.focus();
    },

    addColumnRow(name = "", type = "VARCHAR(255)", isPk = false, isNotNull = false) {
        const row = document.createElement("div");
        row.className = "designer-col-row";
        row.innerHTML = `
            <input type="text" class="studio-input des-col-name" style="flex:2;" placeholder="Column name" value="${name}">
            <select class="studio-select des-col-type" style="flex:2;">
                <option value="INTEGER" ${type === "INTEGER" ? "selected" : ""}>INTEGER (INT)</option>
                <option value="VARCHAR(255)" ${type === "VARCHAR(255)" ? "selected" : ""}>VARCHAR(255)</option>
                <option value="TEXT" ${type === "TEXT" ? "selected" : ""}>TEXT</option>
                <option value="DATETIME" ${type === "DATETIME" ? "selected" : ""}>DATETIME</option>
                <option value="FLOAT" ${type === "FLOAT" ? "selected" : ""}>FLOAT / DECIMAL</option>
                <option value="BOOLEAN" ${type === "BOOLEAN" ? "selected" : ""}>BOOLEAN</option>
            </select>
            <label style="flex:1; text-align:center; display:flex; justify-content:center; align-items:center;">
                <input type="checkbox" class="des-col-pk" ${isPk ? "checked" : ""}>
            </label>
            <label style="flex:1; text-align:center; display:flex; justify-content:center; align-items:center;">
                <input type="checkbox" class="des-col-null" ${isNotNull ? "checked" : ""}>
            </label>
            <button class="btn-icon btn-del-designer-col" style="width:30px; color:var(--danger);" title="Remove Column">&times;</button>
        `;

        row.querySelector(".btn-del-designer-col").addEventListener("click", () => row.remove());
        this.colsContainer.appendChild(row);
    },

    async submitCreateTable() {
        const tableName = this.inputTableName.value.trim();
        if (!tableName) {
            alert("Please enter a table name.");
            return;
        }

        const colRows = this.colsContainer.querySelectorAll(".designer-col-row");
        if (colRows.length === 0) {
            alert("Please add at least one column.");
            return;
        }

        const { connection, currentDb } = StudioApp.state;
        const isSqlite = connection.engine === "sqlite";
        const q = isSqlite ? `"` : "`";
        const defs = [];

        colRows.forEach(row => {
            const name = row.querySelector(".des-col-name").value.trim();
            const type = row.querySelector(".des-col-type").value;
            const isPk = row.querySelector(".des-col-pk").checked;
            const isNotNull = row.querySelector(".des-col-null").checked;

            if (name) {
                let colSql = `${q}${name}${q} ${type}`;
                if (isPk) {
                    colSql += isSqlite ? " PRIMARY KEY AUTOINCREMENT" : " AUTO_INCREMENT PRIMARY KEY";
                }
                if (isNotNull && !isPk) {
                    colSql += " NOT NULL";
                }
                defs.push(colSql);
            }
        });

        if (defs.length === 0) {
            alert("Please provide valid column names.");
            return;
        }

        const sql = `CREATE TABLE ${q}${tableName}${q} (\n  ${defs.join(",\n  ")}\n);`;
        this.btnSubmitTable.disabled = true;
        this.btnSubmitTable.textContent = "Creating...";

        const res = await StudioAPI.executeRawSQL(sql, false, currentDb);
        this.btnSubmitTable.disabled = false;
        this.btnSubmitTable.textContent = "Build & Create Table";

        if (res.error) {
            alert(`Failed to create table:\n${res.error}`);
            return;
        }

        this.modalTable.classList.remove("active");
        await StudioSidebar.loadTablesForDb(currentDb);
        StudioSidebar.selectTable(tableName);
    }
};

window.StudioDesigner = StudioDesigner;
