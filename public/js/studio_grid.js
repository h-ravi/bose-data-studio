/**
 * Bose Data Studio - Grid & Structure Module
 * Handles Data Table rendering, pagination, schema & exports
 */
const StudioGrid = {
    page: 1,
    pageSize: 50,
    currentRows: [],
    currentColumns: [],

    init() {
        this.btnPrev = document.getElementById("btn-prev-page");
        this.btnNext = document.getElementById("btn-next-page");
        this.btnRefresh = document.getElementById("btn-refresh-grid");
        this.pageIndicator = document.getElementById("page-indicator");
        this.titleTable = document.getElementById("grid-table-title");
        this.badgeRows = document.getElementById("grid-total-rows");
        this.containerGrid = document.getElementById("grid-table-wrapper");
        this.inputFilter = document.getElementById("grid-filter-input");

        this.titleStruct = document.getElementById("struct-table-title");
        this.containerStruct = document.getElementById("struct-table-wrapper");

        this.btnExportJson = document.getElementById("btn-export-json");
        this.btnExportCsv = document.getElementById("btn-export-csv");

        this.btnPrev.addEventListener("click", () => this.changePage(-1));
        this.btnNext.addEventListener("click", () => this.changePage(1));
        this.btnRefresh.addEventListener("click", () => this.loadActiveTableData());
        this.inputFilter.addEventListener("input", (e) => this.filterVisibleRows(e.target.value));

        this.btnExportJson.addEventListener("click", () => this.exportCurrentData("json"));
        this.btnExportCsv.addEventListener("click", () => this.exportCurrentData("csv"));
    },

    async loadActiveTableData(resetPage = false) {
        if (resetPage) this.page = 1;
        const { currentDb, currentTable, connection } = StudioApp.state;

        if (!currentTable) {
            this.titleTable.textContent = "Select a table";
            this.badgeRows.textContent = "0 rows";
            this.containerGrid.innerHTML = `<div class="empty-state"><span class="empty-icon">🗄️</span><p>Select a table to view records</p></div>`;
            return;
        }

        this.titleTable.textContent = currentTable;
        this.pageIndicator.textContent = `Page ${this.page}`;
        this.containerGrid.innerHTML = `<div class="empty-state"><p>Loading records...</p></div>`;

        const res = await StudioAPI.browseTable(currentDb, currentTable, this.page, this.pageSize);
        if (res.error) {
            this.containerGrid.innerHTML = `<div class="empty-state" style="color: var(--danger)"><p>Error: ${res.error}</p></div>`;
            return;
        }

        this.currentColumns = res.columns || [];
        this.currentRows = res.rows || [];
        this.badgeRows.textContent = `${this.currentRows.length} rows (limit ${this.pageSize})`;

        this.renderTable(this.containerGrid, this.currentColumns, this.currentRows, true);
    },

    async loadActiveTableStructure() {
        const { currentDb, currentTable, connection } = StudioApp.state;
        if (!currentTable) {
            this.containerStruct.innerHTML = `<div class="empty-state"><p>Select a table to inspect columns</p></div>`;
            return;
        }

        this.titleStruct.textContent = `${currentTable} (Structure)`;
        this.containerStruct.innerHTML = `<div class="empty-state"><p>Loading columns schema...</p></div>`;

        const res = await StudioAPI.getTableSchema(currentDb, currentTable);
        if (res.error) {
            this.containerStruct.innerHTML = `<div class="empty-state" style="color: var(--danger)"><p>Error: ${res.error}</p></div>`;
            return;
        }

        this.renderTable(this.containerStruct, res.columns || [], res.rows || [], false);
    },

    renderTable(targetElement, columns, rows, enableCrud = false) {
        if (!columns || columns.length === 0) {
            targetElement.innerHTML = `<div class="empty-state"><p>No columns returned</p></div>`;
            return;
        }

        let html = `<table class="data-table"><thead><tr>`;
        if (enableCrud) html += `<th style="width:40px; text-align:center;">Action</th>`;
        columns.forEach(col => {
            html += `<th>${this.escapeHtml(col)}</th>`;
        });
        html += `</tr></thead><tbody>`;

        if (rows.length === 0) {
            const colSpan = enableCrud ? columns.length + 1 : columns.length;
            html += `<tr><td colspan="${colSpan}" style="text-align:center; padding:30px; color:var(--text-muted)">Table is empty</td></tr>`;
        } else {
            rows.forEach((r, idx) => {
                html += `<tr data-row-idx="${idx}">`;
                if (enableCrud) {
                    html += `<td style="text-align:center;"><button class="btn-icon btn-row-del" data-idx="${idx}" title="Delete row">🗑️</button></td>`;
                }
                columns.forEach(col => {
                    const rawVal = r[col];
                    const valText = rawVal === null || rawVal === undefined ? `<span class="null-val">NULL</span>` : this.escapeHtml(String(rawVal));
                    const editableCls = enableCrud ? `class="editable-cell" data-col="${this.escapeHtml(col)}"` : "";
                    html += `<td ${editableCls} title="${this.escapeHtml(String(rawVal ?? ''))}">${valText}</td>`;
                });
                html += `</tr>`;
            });
        }
        html += `</tbody></table>`;
        targetElement.innerHTML = html;

        // Attach CRUD Listeners if enabled
        if (enableCrud) {
            targetElement.querySelectorAll(".btn-row-del").forEach(btn => {
                btn.addEventListener("click", () => {
                    const rowData = rows[parseInt(btn.dataset.idx, 10)];
                    if (rowData) StudioCRUD.deleteRow(rowData);
                });
            });

            targetElement.querySelectorAll(".editable-cell").forEach(td => {
                td.addEventListener("dblclick", () => {
                    const tr = td.closest("tr");
                    const rowData = rows[parseInt(tr.dataset.rowIdx, 10)];
                    const colName = td.dataset.col;
                    if (rowData && colName) StudioCRUD.startInlineEdit(td, rowData, colName);
                });
            });
        }
    },

    filterVisibleRows(query) {
        const q = query.trim().toLowerCase();
        const trs = this.containerGrid.querySelectorAll("tbody tr");
        let visibleCount = 0;
        trs.forEach(tr => {
            if (!q) {
                tr.style.display = "";
                visibleCount++;
                return;
            }
            const match = tr.textContent.toLowerCase().includes(q);
            tr.style.display = match ? "" : "none";
            if (match) visibleCount++;
        });
        this.badgeRows.textContent = `${visibleCount} of ${this.currentRows.length} rows`;
    },

    changePage(delta) {
        const newPage = this.page + delta;
        if (newPage < 1) return;
        this.page = newPage;
        this.loadActiveTableData();
    },

    exportCurrentData(type) {
        if (!this.currentRows || this.currentRows.length === 0) {
            alert("No data to export!");
            return;
        }
        const tableName = StudioApp.state.currentTable || "export";
        let content = type === "json" ? JSON.stringify(this.currentRows, null, 2) : "";
        let mime = type === "json" ? "application/json" : "text/csv";
        let ext = type === "json" ? "json" : "csv";

        if (type === "csv") {
            const headerLine = this.currentColumns.map(c => `"${c.replace(/"/g, '""')}"`).join(",");
            const rowLines = this.currentRows.map(r => this.currentColumns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(","));
            content = [headerLine, ...rowLines].join("\n");
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tableName}_${Date.now()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    },

    escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
};

window.StudioGrid = StudioGrid;
