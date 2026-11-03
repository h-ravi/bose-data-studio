/**
 * Bose Data Studio - NoSQL (Redis / KeyDB) Module
 * Handles Keys browser, Key-Value inspection, TTL & raw commands
 */
const StudioRedis = {
    allKeys: [],
    activeKey: null,

    init() {
        this.containerKeys = document.getElementById("tables-list-container");
        this.viewRedis = document.getElementById("tab-redis-inspector");
        this.titleKey = document.getElementById("redis-active-key-name");
        this.badgeType = document.getElementById("redis-active-key-type");
        this.badgeTtl = document.getElementById("redis-active-key-ttl");
        this.valEditor = document.getElementById("redis-key-value-editor");
        this.btnSaveVal = document.getElementById("btn-redis-save-val");
        this.btnDeleteKey = document.getElementById("btn-redis-delete-key");
        this.inputTtl = document.getElementById("redis-input-ttl");
        this.btnUpdateTtl = document.getElementById("btn-redis-update-ttl");

        this.btnOpenAddKey = document.getElementById("btn-open-create-table"); // Reused in Redis mode
        this.modalAddKey = document.getElementById("modal-add-redis-key");
        this.btnCloseAddKey = document.getElementById("btn-close-add-key");
        this.btnCancelAddKey = document.getElementById("btn-cancel-add-key");
        this.btnSubmitAddKey = document.getElementById("btn-submit-add-key");

        if (this.btnSaveVal) this.btnSaveVal.addEventListener("click", () => this.saveActiveKeyValue());
        if (this.btnDeleteKey) this.btnDeleteKey.addEventListener("click", () => this.deleteActiveKey());
        if (this.btnUpdateTtl) this.btnUpdateTtl.addEventListener("click", () => this.updateActiveKeyTtl());

        if (this.btnCloseAddKey) this.btnCloseAddKey.addEventListener("click", () => this.modalAddKey.classList.remove("active"));
        if (this.btnCancelAddKey) this.btnCancelAddKey.addEventListener("click", () => this.modalAddKey.classList.remove("active"));
        if (this.btnSubmitAddKey) this.btnSubmitAddKey.addEventListener("click", () => this.submitAddKey());
    },

    async loadRedisKeys(pattern = "*") {
        const { connection } = StudioApp.state;
        this.containerKeys.innerHTML = `<li class="table-item-empty">Scanning keys (${pattern})...</li>`;

        const res = await StudioAPI.executeRedisCmd(["LIST_KEYS", pattern]);
        if (res.error) {
            this.containerKeys.innerHTML = `<li class="table-item-empty" style="color:var(--danger)">${res.error}</li>`;
            return;
        }

        this.allKeys = res.result || [];
        this.renderKeysList(this.allKeys);
    },

    renderKeysList(keys) {
        document.getElementById("tables-count").textContent = keys.length;
        if (keys.length === 0) {
            this.containerKeys.innerHTML = `<li class="table-item-empty">No keys found (DB empty)</li>`;
            return;
        }

        let html = "";
        keys.forEach(k => {
            const keyName = typeof k === "string" ? k : k.key;
            const typeStr = (typeof k === "object" && k.type ? k.type : "str").toUpperCase();
            const isActive = this.activeKey === keyName ? "active" : "";
            const badgeCls = `badge-type-${typeStr.toLowerCase()}`;

            html += `
                <li class="table-item ${isActive}" data-key="${StudioGrid.escapeHtml(keyName)}">
                    <span class="type-pill ${badgeCls}">${typeStr.substring(0, 4)}</span>
                    <span class="table-name-text">${StudioGrid.escapeHtml(keyName)}</span>
                </li>
            `;
        });
        this.containerKeys.innerHTML = html;

        this.containerKeys.querySelectorAll(".table-item").forEach(item => {
            item.addEventListener("click", () => this.inspectKey(item.dataset.key));
        });

        // Auto inspect first key if none active
        if (!this.activeKey && keys.length > 0) {
            const first = typeof keys[0] === "string" ? keys[0] : keys[0].key;
            this.inspectKey(first);
        }
    },

    filterKeys(pattern) {
        const q = pattern.trim().toLowerCase();
        if (!q) {
            this.renderKeysList(this.allKeys);
            return;
        }
        const filtered = this.allKeys.filter(k => {
            const name = typeof k === "string" ? k : k.key;
            return name.toLowerCase().includes(q);
        });
        this.renderKeysList(filtered);
    },

    async inspectKey(keyName) {
        this.activeKey = keyName;
        this.containerKeys.querySelectorAll(".table-item").forEach(i => i.classList.toggle("active", i.dataset.key === keyName));

        // Switch to Redis view
        StudioApp.switchTab("grid");
        this.titleKey.textContent = keyName;
        this.valEditor.value = "Loading value...";

        const res = await StudioAPI.executeRedisCmd(["GET_KEY", keyName]);
        if (res.error) {
            this.valEditor.value = `Error loading key: ${res.error}`;
            return;
        }

        const typeStr = (res.type || "string").toUpperCase();
        this.badgeType.textContent = typeStr;
        this.badgeType.className = `type-pill badge-type-${typeStr.toLowerCase()}`;

        const ttlSec = res.ttl !== undefined ? res.ttl : -1;
        this.badgeTtl.textContent = ttlSec === -1 ? "TTL: Persistent (No expiry)" : `TTL: ${ttlSec}s`;
        this.inputTtl.value = ttlSec === -1 ? "" : ttlSec;

        let valStr = "";
        if (typeof res.result === "object") {
            valStr = JSON.stringify(res.result, null, 2);
        } else {
            valStr = String(res.result ?? "");
        }
        this.valEditor.value = valStr;
    },

    async saveActiveKeyValue() {
        if (!this.activeKey) return;
        const newVal = this.valEditor.value;

        this.btnSaveVal.disabled = true;
        this.btnSaveVal.textContent = "Saving...";

        const res = await StudioAPI.executeRedisCmd(["SET", this.activeKey, newVal]);
        this.btnSaveVal.disabled = false;
        this.btnSaveVal.textContent = "Save Value";

        if (res.error) {
            alert(`Save failed: ${res.error}`);
        } else {
            alert("Key value updated successfully!");
        }
    },

    async deleteActiveKey() {
        if (!this.activeKey) return;
        if (!confirm(`Are you sure you want to delete Redis key '${this.activeKey}'?`)) return;

        const res = await StudioAPI.executeRedisCmd(["DEL", this.activeKey]);
        if (res.error) {
            alert(`Delete failed: ${res.error}`);
        } else {
            this.activeKey = null;
            this.loadRedisKeys();
        }
    },

    async updateActiveKeyTtl() {
        if (!this.activeKey) return;
        const ttl = parseInt(this.inputTtl.value.trim(), 10);
        if (isNaN(ttl) || ttl <= 0) {
            alert("Please enter valid seconds for TTL (e.g. 3600).");
            return;
        }

        const res = await StudioAPI.executeRedisCmd(["EXPIRE", this.activeKey, String(ttl)]);
        if (res.error) {
            alert(`TTL update failed: ${res.error}`);
        } else {
            this.badgeTtl.textContent = `TTL: ${ttl}s`;
            alert(`TTL set to ${ttl} seconds.`);
        }
    },

    openAddKeyModal() {
        document.getElementById("input-new-redis-key").value = "";
        document.getElementById("input-new-redis-val").value = "";
        document.getElementById("input-new-redis-ttl").value = "";
        this.modalAddKey.classList.add("active");
    },

    async submitAddKey() {
        const key = document.getElementById("input-new-redis-key").value.trim();
        const val = document.getElementById("input-new-redis-val").value;
        const ttl = document.getElementById("input-new-redis-ttl").value.trim();

        if (!key) {
            alert("Please enter a Key name.");
            return;
        }

        const args = ttl ? ["SETEX", key, ttl, val] : ["SET", key, val];

        const res = await StudioAPI.executeRedisCmd(args);
        if (res.error) {
            alert(`Failed to add key: ${res.error}`);
        } else {
            this.modalAddKey.classList.remove("active");
            this.activeKey = key;
            await this.loadRedisKeys();
            this.inspectKey(key);
        }
    }
};

window.StudioRedis = StudioRedis;
