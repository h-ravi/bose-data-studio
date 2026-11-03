/**
 * Bose Data Studio - SQL Console Module
 * Handles raw query execution, keyboard shortcuts & result rendering
 */
const StudioSQL = {
    init() {
        this.inputSql = document.getElementById("sql-editor-input");
        this.btnRun = document.getElementById("btn-run-sql");
        this.badgeTiming = document.getElementById("sql-timing");
        this.metaResults = document.getElementById("sql-results-meta");
        this.containerResults = document.getElementById("sql-results-wrapper");

        this.btnRun.addEventListener("click", () => this.runQuery());

        // Keyboard Shortcut: Ctrl + Enter to run
        this.inputSql.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                this.runQuery();
            }
        });
    },

    setQueryText(sql) {
        this.inputSql.value = sql;
    },

    async runQuery() {
        const sql = this.inputSql.value.trim();
        if (!sql) {
            alert("Please type an SQL query to execute.");
            return;
        }

        const conn = StudioApp.state.connection;
        const dbName = StudioApp.state.currentDb;

        this.btnRun.disabled = true;
        this.btnRun.textContent = "Running...";
        this.containerResults.innerHTML = `<div class="empty-state"><p>Executing query...</p></div>`;

        const startT = performance.now();
        let res = await StudioAPI.executeRawSQL(sql, false, dbName);
        
        // Destructive Query Interception
        if (res && res.error === "DESTRUCTIVE_CONFIRMATION_REQUIRED") {
            const confirmed = confirm("⚠️ DESTRUCTIVE QUERY DETECTED!\n\nThis statement contains DROP or TRUNCATE which permanently deletes data.\n\nAre you ABSOLUTELY sure you want to execute it?");
            if (confirmed) {
                res = await StudioAPI.executeRawSQL(sql, true, dbName);
            } else {
                this.btnRun.disabled = false;
                this.btnRun.textContent = "▶ Run Query (Ctrl+Enter)";
                this.containerResults.innerHTML = `<div class="empty-state"><p>Destructive query cancelled by user.</p></div>`;
                return;
            }
        }
        
        const totalDuration = (performance.now() - startT).toFixed(1);

        this.btnRun.disabled = false;
        this.btnRun.textContent = "▶ Run Query (Ctrl+Enter)";

        // Show execution time badge
        const serverMs = res.duration_ms !== undefined ? res.duration_ms : totalDuration;
        this.badgeTiming.textContent = `⏱️ ${serverMs}ms`;

        if (res.error) {
            this.metaResults.textContent = "Execution failed";
            this.metaResults.style.color = "var(--danger)";
            this.containerResults.innerHTML = `
                <div class="empty-state" style="color: var(--danger)">
                    <span style="font-size:24px">⚠️</span>
                    <p style="margin-top:8px; font-family:var(--font-mono)">${StudioGrid.escapeHtml(res.error)}</p>
                </div>
            `;
            return;
        }

        this.metaResults.style.color = "var(--text-muted)";
        const rowCount = res.rows ? res.rows.length : (res.count || 0);
        this.metaResults.textContent = `${rowCount} row(s) returned / affected`;

        if (res.columns && res.columns.length > 0) {
            StudioGrid.renderTable(this.containerResults, res.columns, res.rows || []);
        } else {
            this.containerResults.innerHTML = `
                <div class="empty-state" style="color: var(--success)">
                    <span style="font-size:24px">✅</span>
                    <p style="margin-top:8px">Query executed successfully! (${rowCount} affected)</p>
                </div>
            `;
        }
    }
};

window.StudioSQL = StudioSQL;
