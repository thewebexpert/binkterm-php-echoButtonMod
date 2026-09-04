/**
 * ============================================================================
 * Binkterm Echo Area Button Mod
 * Quick Network Filters & Action Buttons on /echolist
 * https://github.com/thewebexpert/binkterm-php-echoButtonMod
 * ============================================================================
 */

(function () {
    'use strict';

    function initEchoButtonMod() {
        const echolistPage = document.getElementById('echolist-page');
        if (!echolistPage) {
            return; // Only runs on the /echolist page
        }

        // Avoid duplicate initialization
        if (document.getElementById('echo-button-toolbar')) {
            return;
        }

        // Find the "Search Messages" card body
        const searchInput = document.getElementById('messageSearch');
        if (!searchInput) {
            return;
        }
        const searchCardBody = searchInput.closest('.card-body');
        if (!searchCardBody) {
            return;
        }

        // Create the toolbar container
        const toolbar = document.createElement('div');
        toolbar.id = 'echo-button-toolbar';
        toolbar.className = 'echo-button-toolbar';

        toolbar.innerHTML = `
            <div class="echo-section-title">
                <span><i class="fas fa-network-wired me-1"></i> Quick Network Filters</span>
                <span class="badge bg-secondary" id="echo-badge-total">-</span>
            </div>
            <div class="echo-btn-group mb-3" id="echo-network-buttons">
                <button type="button" class="btn btn-sm btn-primary active echo-btn" data-net="all">
                    <i class="fas fa-border-all me-1"></i> ALL
                </button>
            </div>

            <div class="echo-section-title">
                <span><i class="fas fa-bolt me-1"></i> Quick Actions</span>
            </div>
            <div class="echo-btn-group" id="echo-action-buttons">
                <button type="button" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" id="echo-btn-subscribed" title="Toggle Subscribed Areas">
                    <i class="fa-solid fa-star me-1 text-warning"></i> Subscribed
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" id="echo-btn-unread" title="Toggle Unread Messages">
                    <i class="fas fa-envelope me-1 text-info"></i> Unread
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" id="echo-btn-newpost" title="Compose New Echomail">
                    <i class="fas fa-plus me-1 text-success"></i> New Post
                </button>
                <a href="/subscriptions" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" title="Manage Subscriptions">
                    <i class="fa-solid fa-wrench me-1"></i> Manage
                </a>
            </div>
        `;

        searchCardBody.appendChild(toolbar);

        let activeNetwork = 'all';

        // Wait for allEchoAreas to be populated by Binkterm
        let pollCount = 0;
        function populateButtonsWhenReady() {
            if (typeof allEchoAreas !== 'undefined' && Array.isArray(allEchoAreas) && allEchoAreas.length > 0) {
                renderNetworkButtons(allEchoAreas);
                syncQuickActionStates();
            } else if (pollCount < 40) { // 4 seconds max
                pollCount++;
                setTimeout(populateButtonsWhenReady, 100);
            }
        }

        function renderNetworkButtons(areas) {
            const netContainer = document.getElementById('echo-network-buttons');
            if (!netContainer) return;

            // Tally areas per network
            let localCount = 0;
            const domainCounts = {};

            areas.forEach(function (area) {
                if (area.is_local) {
                    localCount++;
                } else {
                    const dom = (area.domain || 'unknown').toLowerCase();
                    domainCounts[dom] = (domainCounts[dom] || 0) + 1;
                }
            });

            // Update total badge
            const badgeTotal = document.getElementById('echo-badge-total');
            if (badgeTotal) {
                badgeTotal.textContent = areas.length + ' Areas';
            }

            // Build buttons HTML
            let html = `
                <button type="button" class="btn btn-sm btn-primary active echo-btn" data-net="all">
                    <i class="fas fa-border-all me-1"></i> ALL
                    <span class="badge bg-dark ms-1">${areas.length}</span>
                </button>
            `;

            if (localCount > 0) {
                html += `
                    <button type="button" class="btn btn-sm btn-outline-secondary echo-btn" data-net="__local__">
                        <i class="fas fa-home me-1"></i> LOCAL
                        <span class="badge bg-secondary ms-1">${localCount}</span>
                    </button>
                `;
            }

            // Sort domain names alphabetically
            const domains = Object.keys(domainCounts).sort();
            domains.forEach(function (dom) {
                const count = domainCounts[dom];
                const label = dom.toUpperCase();
                html += `
                    <button type="button" class="btn btn-sm btn-outline-secondary echo-btn" data-net="${dom}">
                        <i class="fas fa-comments me-1"></i> ${label}
                        <span class="badge bg-secondary ms-1">${count}</span>
                    </button>
                `;
            });

            netContainer.innerHTML = html;

            // Attach click listeners to network buttons
            netContainer.querySelectorAll('.echo-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    this.blur();
                    const net = this.getAttribute('data-net');
                    selectNetwork(net);
                });
            });
        }

        function selectNetwork(net) {
            activeNetwork = net;
            const netContainer = document.getElementById('echo-network-buttons');

            // Update button styles: btn-primary for active, btn-outline-secondary for inactive
            if (netContainer) {
                netContainer.querySelectorAll('.echo-btn').forEach(function (btn) {
                    const badge = btn.querySelector('.badge');
                    if (btn.getAttribute('data-net') === net) {
                        btn.className = 'btn btn-sm btn-primary active echo-btn';
                        if (badge) badge.className = 'badge bg-dark ms-1';
                    } else {
                        btn.className = 'btn btn-sm btn-outline-secondary echo-btn';
                        if (badge) badge.className = 'badge bg-secondary ms-1';
                    }
                });
            }

            // Sync with Binkterm's core network dropdown checkboxes
            const dropdown = document.getElementById('networkDropdown');
            if (dropdown && typeof searchEchoAreas === 'function') {
                const checkboxes = dropdown.querySelectorAll('.network-cb');
                checkboxes.forEach(function (cb) {
                    if (net === 'all') {
                        cb.checked = false; // "all" means none filtered
                    } else {
                        cb.checked = (cb.value.toLowerCase() === net.toLowerCase());
                    }
                });

                if (typeof updateNetworkPickerLabel === 'function') {
                    updateNetworkPickerLabel();
                }
                const searchInputVal = document.getElementById('areaSearch') ? document.getElementById('areaSearch').value : '';
                searchEchoAreas(searchInputVal);
            }
        }

        function syncQuickActionStates() {
            // Sync Subscribed toggle
            const subCb = document.getElementById('subscribedOnlyCheck');
            const subBtn = document.getElementById('echo-btn-subscribed');
            if (subCb && subBtn) {
                if (subCb.checked) {
                    subBtn.className = 'btn btn-sm btn-primary active echo-btn echo-action-btn';
                } else {
                    subBtn.className = 'btn btn-sm btn-outline-secondary echo-btn echo-action-btn';
                }
            }

            // Sync Unread toggle
            const unreadCb = document.getElementById('unreadOnlyCheck');
            const unreadBtn = document.getElementById('echo-btn-unread');
            if (unreadCb && unreadBtn) {
                if (unreadCb.checked) {
                    unreadBtn.className = 'btn btn-sm btn-primary active echo-btn echo-action-btn';
                } else {
                    unreadBtn.className = 'btn btn-sm btn-outline-secondary echo-btn echo-action-btn';
                }
            }
        }

        // Action Buttons Click Handlers
        const subBtn = document.getElementById('echo-btn-subscribed');
        if (subBtn) {
            subBtn.addEventListener('click', function () {
                this.blur();
                const subCb = document.getElementById('subscribedOnlyCheck');
                if (subCb) {
                    subCb.checked = !subCb.checked;
                    syncQuickActionStates();
                    if (typeof toggleSubscribedFilter === 'function') {
                        toggleSubscribedFilter();
                    }
                }
            });
        }

        const unreadBtn = document.getElementById('echo-btn-unread');
        if (unreadBtn) {
            unreadBtn.addEventListener('click', function () {
                this.blur();
                const unreadCb = document.getElementById('unreadOnlyCheck');
                if (unreadCb) {
                    unreadCb.checked = !unreadCb.checked;
                    syncQuickActionStates();
                    if (typeof toggleUnreadFilter === 'function') {
                        toggleUnreadFilter();
                    }
                }
            });
        }

        const newPostBtn = document.getElementById('echo-btn-newpost');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', function () {
                this.blur();
                if (typeof composeMessage === 'function') {
                    composeMessage('echomail');
                }
            });
        }

        // Listen for external changes to checkboxes on left card
        const subCb = document.getElementById('subscribedOnlyCheck');
        if (subCb) {
            subCb.addEventListener('change', syncQuickActionStates);
        }
        const unreadCb = document.getElementById('unreadOnlyCheck');
        if (unreadCb) {
            unreadCb.addEventListener('change', syncQuickActionStates);
        }

        // Kick off button population
        populateButtonsWhenReady();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEchoButtonMod);
    } else {
        initEchoButtonMod();
    }
})();
