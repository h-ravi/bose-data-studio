/**
 * Bose Data Studio - Secure API Client Module
 * Backend-Authoritative RPC with Session Vault Tokens
 */
const StudioAPI = {
    getToken() {
        return sessionStorage.getItem("bose_session_token") || "";
    },

    setToken(token) {
        if (token) {
            sessionStorage.setItem("bose_session_token", token);
        } else {
            sessionStorage.removeItem("bose_session_token");
        }
    },

    async post(endpoint, data = {}) {
        try {
            const token = this.getToken();
            const payload = { ...data, token };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Studio-Token": token
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                return { error: `HTTP ${res.status}: ${text}` };
            }

            const json = await res.json();
            if (json.error === "UNAUTHORIZED_SESSION") {
                this.setToken("");
                document.getElementById("modal-connect").classList.add("active");
            }
            return json;
        } catch (e) {
            return { error: e.message };
        }
    },

    async connect(config) {
        const res = await this.post("/api/auth/connect", config);
        if (res && res.token) {
            this.setToken(res.token);
        }
        return res;
    },

    async disconnect() {
        const res = await this.post("/api/auth/disconnect", {});
        this.setToken("");
        return res;
    },

    async listDatabases() {
        const res = await this.post("/api/schema/databases");
        if (res && res.error) {
            console.error("Failed to list databases:", res.error);
            alert("Database Error:\n" + res.error);
            return [];
        }
        return res.databases || [];
    },

    async listTables(dbName) {
        const res = await this.post("/api/schema/tables", { database: dbName });
        if (res && res.error) {
            console.error("Failed to list tables:", res.error);
            alert("Table Error:\n" + res.error);
            return [];
        }
        return res.tables || [];
    },

    async getTableSchema(dbName, tableName) {
        const res = await this.post("/api/schema/columns", { database: dbName, table: tableName });
        return res;
    },

    async browseTable(dbName, tableName, page = 1, limit = 50) {
        const res = await this.post("/api/data/browse", { database: dbName, table: tableName, page, limit });
        return res;
    },

    async updateCell(dbName, tableName, pkCol, pkVal, col, val) {
        return await this.post("/api/data/update_cell", {
            database: dbName,
            table: tableName,
            pk_col: pkCol,
            pk_val: pkVal,
            col: col,
            val: val
        });
    },

    async deleteRow(dbName, tableName, pkCol, pkVal) {
        return await this.post("/api/data/delete_row", {
            database: dbName,
            table: tableName,
            pk_col: pkCol,
            pk_val: pkVal
        });
    },

    async insertRow(dbName, tableName, rowData) {
        return await this.post("/api/data/insert_row", {
            database: dbName,
            table: tableName,
            data: rowData
        });
    },

    async executeRawSQL(sql, confirmDestructive = false, dbName = "") {
        return await this.post("/api/data/raw_query", {
            database: dbName,
            sql: sql,
            confirm_destructive: confirmDestructive
        });
    },

    async executeRedisCmd(cmdArgs) {
        return await this.post("/api/redis/cmd", { args: cmdArgs });
    },

    async executeMongoCmd(action, params = {}) {
        return await this.post("/api/mongo/cmd", { action, params });
    }
};

window.StudioAPI = StudioAPI;
