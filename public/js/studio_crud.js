/**
 * Bose Data Studio - CRUD & Inline Editing Module
 * High-Security: Relies on Authoritative Backend RPCs (Zero Client-Side SQL)
 */
const StudioCRUD = {
    init() {
        this.modalInsert = document.getElementById("modal-insert-row");
        this.fieldsContainer = document.getElementById("insert-modal-fields");
        this.btnOpenInsert = document.getElementById("btn-open-insert");
        this.btnCloseInsert = document.getElementById("btn-close-insert");
        this.btnCancelInsert = document.getElementById("btn-cancel-insert");
        this.btnSubmitInsert = document.getElementById("btn-submit-insert");

        if (this.btnOpenInsert) this.btnOpenInsert.addEventListener("click", () => this.openInsertModal());
        if (this.btnCloseInsert) this.btnCloseInsert.addEventListener("click", () => this.closeInsertModal());
        if (this.btnCancelInsert) this.btnCancelInsert.addEventListener("click", () => this.closeInsertModal());
        if (this.btnSubmitInsert) this.btnSubmitInsert.addEventListener("click", () => this.submitInsertRow());
    },

    findPrimaryKey(columns, rowData) {
        if (!columns || columns.length === 0) return null;
        const pkCandidate = columns.find(c => ["id", "ID", "_id", "uid", "code"].includes(c));
        return pkCandidate || columns[0];
    },

    startInlineEdit(tdElement, rowData, colName) {
        if (tdElement.querySelector("input")) return;
        const originalVal = rowData[colName] ?? "";
        tdElement.classList.add("cell-editing");

        const input = document.createElement("input");
        input.type = "text";
        input.value = originalVal;
        input.className = "inline-cell-input";
        tdElement.innerHTML = "";
        tdElement.appendChild(input);
        input.focus();
        input.select();

        const cancel = () => {
            tdElement.classList.remove("cell-editing");
            tdElement.textContent = originalVal === "" ? "NULL" : originalVal;
        };

        const save = async () => {
            const newVal = input.value.trim();
            if (newVal === String(originalVal)) {
                cancel();
                return;
            }

            const { currentDb, currentTable, connection } = StudioApp.state;

            // MongoDB Document update delegation
            if (connection.engine === "mongo") {
                const idVal = rowData["_id"] || rowData["id"];
                if (!idVal) {
                    alert("Cannot edit: Document _id could not be determined.");
                    cancel();
                    return;
                }
                const res = await StudioAPI.executeMongoCmd("update_document", {
                    collection: currentTable,
                    id: idVal,
                    field: colName,
                    value: newVal
                });
                if (res.error) {
                    alert(`Update failed: ${res.error}`);
                    cancel();
                } else {
                    rowData[colName] = newVal;
                    tdElement.classList.remove("cell-editing");
                    tdElement.classList.add("cell-saved");
                    tdElement.textContent = newVal;
                    setTimeout(() => tdElement.classList.remove("cell-saved"), 1000);
                }
                return;
            }

            // Secure Authoritative Backend Update RPC
            const pkCol = this.findPrimaryKey(StudioGrid.currentColumns, rowData);
            const pkVal = rowData[pkCol];

            if (!pkCol || pkVal === undefined) {
                alert("Cannot edit: Primary key column could not be identified.");
                cancel();
                return;
            }

            const res = await StudioAPI.updateCell(currentDb, currentTable, pkCol, pkVal, colName, newVal);
            if (res.error) {
                alert(`Update rejected by server: ${res.error}`);
                cancel();
            } else {
                rowData[colName] = newVal;
                tdElement.classList.remove("cell-editing");
                tdElement.classList.add("cell-saved");
                tdElement.textContent = newVal;
                setTimeout(() => tdElement.classList.remove("cell-saved"), 1000);
            }
        };

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") save();
            else if (e.key === "Escape") cancel();
        });
        input.addEventListener("blur", save);
    },

    async deleteRow(rowData) {
        const { currentDb, currentTable, connection } = StudioApp.state;

        if (connection.engine === "mongo") {
            const idVal = rowData["_id"] || rowData["id"];
            if (idVal) StudioMongo.deleteDoc(idVal);
            else alert("Cannot delete: Document _id could not be determined.");
            return;
        }

        const pkCol = this.findPrimaryKey(StudioGrid.currentColumns, rowData);
        const pkVal = rowData[pkCol];

        if (!pkCol || pkVal === undefined) {
            alert("Cannot delete: Primary key could not be determined.");
            return;
        }

        if (!confirm(`Are you sure you want to delete record where ${pkCol} = '${pkVal}'?`)) {
            return;
        }

        const res = await StudioAPI.deleteRow(currentDb, currentTable, pkCol, pkVal);
        if (res.error) {
            alert(`Delete failed: ${res.error}`);
        } else {
            StudioGrid.loadActiveTableData();
        }
    },

    openInsertModal() {
        const { currentTable, connection } = StudioApp.state;
        if (connection.engine === "mongo") {
            StudioMongo.openInsertDocModal();
            return;
        }

        if (!currentTable) {
            alert("Please select a table from the sidebar first.");
            return;
        }

        document.getElementById("insert-modal-title").textContent = `Insert Record into ${currentTable}`;
        const columns = StudioGrid.currentColumns || [];
        
        let html = "";
        columns.forEach(col => {
            const isId = ["id", "ID", "_id"].includes(col);
            const hint = isId ? " (Leave empty for Auto-Increment)" : "";
            html += `
                <div class="form-row">
                    <label>${StudioGrid.escapeHtml(col)}${hint}</label>
                    <input type="text" class="studio-input insert-col-input" data-col="${StudioGrid.escapeHtml(col)}" placeholder="Enter ${StudioGrid.escapeHtml(col)} value...">
                </div>
            `;
        });

        this.fieldsContainer.innerHTML = html;
        this.modalInsert.classList.add("active");
    },

    closeInsertModal() {
        this.modalInsert.classList.remove("active");
    },

    async submitInsertRow() {
        const { currentDb, currentTable } = StudioApp.state;
        const inputs = this.fieldsContainer.querySelectorAll(".insert-col-input");
        const dataMap = {};
        let filledCount = 0;

        inputs.forEach(inp => {
            const col = inp.dataset.col;
            const val = inp.value.trim();
            if (val !== "") {
                dataMap[col] = val;
                filledCount++;
            }
        });

        if (filledCount === 0) {
            alert("Please enter at least one field value.");
            return;
        }

        this.btnSubmitInsert.disabled = true;
        this.btnSubmitInsert.textContent = "Saving...";

        const res = await StudioAPI.insertRow(currentDb, currentTable, dataMap);
        this.btnSubmitInsert.disabled = false;
        this.btnSubmitInsert.textContent = "Save Record";

        if (res.error) {
            alert(`Insert failed: ${res.error}`);
        } else {
            this.closeInsertModal();
            StudioGrid.loadActiveTableData(true);
        }
    }
};

window.StudioCRUD = StudioCRUD;
