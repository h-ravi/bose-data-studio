/**
 * Bose Data Studio - Document NoSQL (MongoDB) Module
 * Handles Collections browser, BSON/JSON Document viewer, filter & CRUD
 */
const StudioMongo = {
    allCollections: [],
    activeCollection: null,
    currentDocs: [],

    init() {
        this.containerList = document.getElementById("tables-list-container");
        this.modalInsertDoc = document.getElementById("modal-insert-mongo-doc");
        this.inputDocJson = document.getElementById("input-new-mongo-doc-json");
        this.btnCloseInsertDoc = document.getElementById("btn-close-insert-mongo-doc");
        this.btnCancelInsertDoc = document.getElementById("btn-cancel-insert-mongo-doc");
        this.btnSubmitInsertDoc = document.getElementById("btn-submit-insert-mongo-doc");

        if (this.btnCloseInsertDoc) this.btnCloseInsertDoc.addEventListener("click", () => this.modalInsertDoc.classList.remove("active"));
        if (this.btnCancelInsertDoc) this.btnCancelInsertDoc.addEventListener("click", () => this.modalInsertDoc.classList.remove("active"));
        if (this.btnSubmitInsertDoc) this.btnSubmitInsertDoc.addEventListener("click", () => this.submitInsertDoc());
    },

    async loadCollections() {
        const { currentDb } = StudioApp.state;
        const dbName = currentDb || "app_db";
        this.containerList.innerHTML = `<li class="table-item-empty">Loading collections...</li>`;

        const res = await StudioAPI.executeMongoCmd("list_collections", { db: dbName });
        if (res.error) {
            this.containerList.innerHTML = `<li class="table-item-empty" style="color:var(--danger)">${res.error}</li>`;
            return;
        }

        this.allCollections = res.result || [];
        this.renderCollectionsList(this.allCollections);

        if (!this.activeCollection && this.allCollections.length > 0) {
            this.selectCollection(this.allCollections[0]);
        }
    },

    renderCollectionsList(collections) {
        document.getElementById("tables-count").textContent = collections.length;
        if (collections.length === 0) {
            this.containerList.innerHTML = `<li class="table-item-empty">No collections in database</li>`;
            return;
        }

        let html = "";
        collections.forEach(colName => {
            const isActive = this.activeCollection === colName ? "active" : "";
            html += `
                <li class="table-item ${isActive}" data-collection="${StudioGrid.escapeHtml(colName)}">
                    <span style="color:#10b981;">🍃</span>
                    <span class="table-name-text">${StudioGrid.escapeHtml(colName)}</span>
                </li>
            `;
        });
        this.containerList.innerHTML = html;

        this.containerList.querySelectorAll(".table-item").forEach(item => {
            item.addEventListener("click", () => this.selectCollection(item.dataset.collection));
        });
    },

    filterCollections(pattern) {
        const q = pattern.trim().toLowerCase();
        if (!q) {
            this.renderCollectionsList(this.allCollections);
            return;
        }
        const filtered = this.allCollections.filter(c => c.toLowerCase().includes(q));
        this.renderCollectionsList(filtered);
    },

    async selectCollection(colName) {
        this.activeCollection = colName;
        StudioApp.state.currentTable = colName;
        this.containerList.querySelectorAll(".table-item").forEach(i => i.classList.toggle("active", i.dataset.collection === colName));

        document.getElementById("grid-table-title").textContent = `🍃 ${colName}`;
        const containerGrid = document.getElementById("grid-table-wrapper");
        containerGrid.innerHTML = `<div class="empty-state"><p>Loading documents...</p></div>`;

        const { currentDb } = StudioApp.state;
        const res = await StudioAPI.executeMongoCmd("find_documents", {
            db: currentDb || "app_db",
            collection: colName,
            limit: 50
        });

        if (res.error) {
            containerGrid.innerHTML = `<div class="empty-state" style="color:var(--danger)">${res.error}</div>`;
            return;
        }

        this.currentDocs = res.result || [];
        document.getElementById("grid-total-rows").textContent = `${this.currentDocs.length} documents`;

        // Flatten dynamic keys for Table Grid presentation
        const allKeysSet = new Set();
        allKeysSet.add("_id");
        this.currentDocs.forEach(doc => {
            Object.keys(doc).forEach(k => allKeysSet.add(k));
        });
        const columns = Array.from(allKeysSet);

        // Render in standard grid
        StudioGrid.currentColumns = columns;
        StudioGrid.currentRows = this.currentDocs;
        StudioGrid.renderTable(containerGrid, columns, this.currentDocs, true);
    },

    openInsertDocModal() {
        if (!this.activeCollection) {
            alert("Please select a collection first.");
            return;
        }
        document.getElementById("insert-mongo-doc-title").textContent = `Insert Document into ${this.activeCollection}`;
        this.inputDocJson.value = JSON.stringify({
            name: "New Item",
            status: "active",
            tags: ["demo", "bose"],
            created_at: new Date().toISOString()
        }, null, 2);
        this.modalInsertDoc.classList.add("active");
    },

    async submitInsertDoc() {
        const rawJson = this.inputDocJson.value.trim();
        let parsed = null;
        try {
            parsed = JSON.parse(rawJson);
        } catch (e) {
            alert(`Invalid JSON format: ${e.message}`);
            return;
        }

        const { currentDb } = StudioApp.state;
        const res = await StudioAPI.executeMongoCmd("insert_document", {
            db: currentDb || "app_db",
            collection: this.activeCollection,
            document: parsed
        });

        if (res.error) {
            alert(`Insert failed: ${res.error}`);
        } else {
            this.modalInsertDoc.classList.remove("active");
            this.selectCollection(this.activeCollection);
        }
    },

    async deleteDoc(docId) {
        if (!confirm(`Are you sure you want to delete document where _id = '${docId}'?`)) return;

        const { currentDb } = StudioApp.state;
        const res = await StudioAPI.executeMongoCmd("delete_document", {
            db: currentDb || "app_db",
            collection: this.activeCollection,
            id: docId
        });

        if (res.error) {
            alert(`Delete failed: ${res.error}`);
        } else {
            this.selectCollection(this.activeCollection);
        }
    }
};

window.StudioMongo = StudioMongo;
