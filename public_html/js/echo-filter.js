/**
 * ============================================================================
 * Binkterm Echo Area Button Mod
 * Quick Network & Sub-Area Filters, Search & View Toggling on /echolist & /echomail
 * https://github.com/thewebexpert/binkterm-php-echoButtonMod
 * ============================================================================
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'binkterm_echo_filter_network';

    function getSavedNetwork() {
        try {
            // 1. Check URL query parameter (?net=...)
            const urlParams = new URLSearchParams(window.location.search);
            const netParam = urlParams.get('net');
            if (netParam) {
                return netParam.trim().toLowerCase();
            }

            // 2. Check if pathname is /echomail/TAG@DOMAIN
            const pathMatch = window.location.pathname.match(/\/echomail\/[^@]+@([a-zA-Z0-9_.-]+)/i);
            if (pathMatch && pathMatch[1]) {
                return pathMatch[1].trim().toLowerCase();
            }

            // 3. Fallback to localStorage
            const localVal = localStorage.getItem(STORAGE_KEY);
            if (localVal) {
                return localVal.trim().toLowerCase();
            }
        } catch (e) {
            // Storage access blocked or unavailable
        }
        return 'all';
    }

    function getSavedSubArea() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const areaParam = urlParams.get('area');
            if (areaParam) {
                return areaParam.trim().toLowerCase();
            }

            // Check if pathname has /echomail/TAG or /echomail/TAG@DOMAIN
            const pathMatch = window.location.pathname.match(/\/echomail\/([^/@]+)(?:@[^/@]+)?/i);
            if (pathMatch && pathMatch[1]) {
                return decodeURIComponent(pathMatch[1]).trim().toLowerCase();
            }
        } catch (e) {
            // Storage access blocked or unavailable
        }
        return null;
    }

    function setSavedNetwork(net) {
        try {
            const normalized = (net || 'all').trim().toLowerCase();
            localStorage.setItem(STORAGE_KEY, normalized);

            // Update URL query parameter without reloading
            const url = new URL(window.location);
            if (normalized === 'all') {
                url.searchParams.delete('net');
            } else {
                url.searchParams.set('net', normalized);
            }
            window.history.replaceState({}, '', url);
        } catch (e) {
            // Storage access blocked or unavailable
        }
    }

    function updateUrlParams(updates = {}) {
        try {
            const url = new URL(window.location);
            for (const [key, val] of Object.entries(updates)) {
                if (val === null || val === undefined || val === '') {
                    url.searchParams.delete(key);
                } else {
                    url.searchParams.set(key, val);
                }
            }
            window.history.replaceState({}, '', url);
        } catch (e) {
            // Ignored
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initEchoButtonMod() {
        // Strictly exclude Netmail and non-echomail pages
        const pathname = window.location.pathname;
        if (pathname === '/netmail' || pathname.startsWith('/netmail/') || pathname.startsWith('/compose/netmail')) {
            return;
        }

        const echolistPage = document.getElementById('echolist-page');
        const isEchoList = !!echolistPage || pathname === '/echolist';
        const isEchoMail = !isEchoList && (
            pathname === '/echomail' ||
            pathname.startsWith('/echomail/') ||
            !!document.getElementById('echoInfoBar') ||
            !!document.getElementById('echoAreasCollapse') ||
            !!document.getElementById('echoareasList')
        );

        if (!isEchoList && !isEchoMail) {
            return;
        }

        // Avoid duplicate initialization
        if (document.getElementById('echo-button-toolbar')) {
            return;
        }

        let allAreas = [];
        let activeNetwork = getSavedNetwork();
        let activeSubArea = getSavedSubArea();
        let showSubscribedOnly = false;
        let showUnreadOnly = false;

        // Install AJAX prefilter so /api/messages/echomail automatically carries active network
        if (typeof $ !== 'undefined' && typeof $.ajaxPrefilter === 'function' && !$.ajaxPrefilter.__echoFilterHooked) {
            $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                // Strictly exclude Netmail
                if (options.url && options.url.includes('/netmail')) {
                    return;
                }
                if (window.location.pathname.startsWith('/netmail')) {
                    return;
                }
                if (options.url && options.url.match(/^\/api\/messages\/echomail(?:\?|$)/)) {
                    if (activeNetwork && activeNetwork !== 'all') {
                        const separator = options.url.includes('?') ? '&' : '?';
                        options.url += separator + 'network=' + encodeURIComponent(activeNetwork);
                    }
                }
            });
            $.ajaxPrefilter.__echoFilterHooked = true;
        }

        function getToggleUrl(target) {
            const net = activeNetwork && activeNetwork !== 'all' ? activeNetwork : null;
            if (target === 'messages') {
                if (activeSubArea && activeSubArea !== 'all') {
                    const found = allAreas.find(a => (a.tag || '').toLowerCase() === activeSubArea.toLowerCase());
                    if (found) {
                        const areaDom = (found.domain || '').toString().trim();
                        const fullTag = areaDom ? `${found.tag}@${areaDom}` : found.tag;
                        return `/echomail/${encodeURIComponent(fullTag)}${net ? '?net=' + encodeURIComponent(net) : ''}`;
                    }
                    return `/echomail/${encodeURIComponent(activeSubArea)}${net ? '?net=' + encodeURIComponent(net) : ''}`;
                }
                return `/echomail${net ? '?net=' + encodeURIComponent(net) : ''}`;
            } else {
                const params = new URLSearchParams();
                if (net) params.set('net', net);
                if (activeSubArea && activeSubArea !== 'all') params.set('area', activeSubArea);
                const qs = params.toString();
                return `/echolist${qs ? '?' + qs : ''}`;
            }
        }

        function buildToolbarElement() {
            const tb = document.createElement('div');
            tb.id = 'echo-button-toolbar';
            tb.className = 'echo-button-toolbar';
            tb.innerHTML = `
                <div class="echo-section-title">
                    <span><i class="fas fa-network-wired me-1"></i> Quick Network Filters</span>
                    <span class="badge bg-secondary" id="echo-badge-total">-</span>
                </div>
                <div class="echo-btn-group mb-3" id="echo-network-buttons">
                    <button type="button" class="btn btn-sm btn-primary active echo-btn" data-net="all">
                        <i class="fas fa-border-all me-1"></i> ALL
                    </button>
                </div>

                <div class="echo-section-title" id="echo-subarea-section-title">
                    <span><i class="fas fa-layer-group me-1"></i> Quick Sub-Area Filters</span>
                    <div class="d-flex align-items-center gap-2">
                        <input type="text" class="form-control form-control-sm echo-subarea-search" id="echo-subarea-search-input" placeholder="Filter sub-areas..." style="height: 24px; font-size: 0.72rem; padding: 2px 6px; width: 130px;">
                        <span class="badge bg-secondary" id="echo-badge-subareas">-</span>
                    </div>
                </div>
                <div class="echo-btn-group echo-subarea-group mb-3" id="echo-subarea-buttons">
                    <span class="text-muted small p-1">Loading sub-areas...</span>
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
                    <a href="${getToggleUrl(isEchoList ? 'messages' : 'list')}" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" id="echo-btn-view-toggle" title="${isEchoList ? 'Switch to Message View' : 'Switch to Area List'}">
                        <i class="fas ${isEchoList ? 'fa-envelope-open-text' : 'fa-list'} me-1 text-primary"></i> ${isEchoList ? 'Messages' : 'Area List'}
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" id="echo-btn-newpost" title="Compose New Echomail">
                        <i class="fas fa-plus me-1 text-success"></i> New Post
                    </button>
                    <a href="/subscriptions" class="btn btn-sm btn-outline-secondary echo-btn echo-action-btn" title="Manage Subscriptions">
                        <i class="fa-solid fa-wrench me-1"></i> Manage
                    </a>
                </div>
            `;
            return tb;
        }

        if (isEchoList) {
            // Setup on /echolist
            const searchInput = document.getElementById('messageSearch');
            if (!searchInput) return;
            const searchCardBody = searchInput.closest('.card-body');
            if (!searchCardBody) return;

            // Add view switcher in header of search card
            const searchCard = searchInput.closest('.card');
            if (searchCard) {
                const cardHeader = searchCard.querySelector('.card-header');
                if (cardHeader && !cardHeader.querySelector('.echo-view-switcher')) {
                    cardHeader.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                    const viewSwitcher = document.createElement('div');
                    viewSwitcher.className = 'echo-view-switcher btn-group btn-group-sm';
                    viewSwitcher.innerHTML = `
                        <button type="button" class="btn btn-primary active" title="Currently viewing Echo Areas List">
                            <i class="fas fa-list me-1"></i> Area List
                        </button>
                        <a href="${getToggleUrl('messages')}" class="btn btn-outline-secondary" id="echo-header-toggle-messages" title="Switch to Message View">
                            <i class="fas fa-envelope-open-text me-1"></i> Messages
                        </a>
                    `;
                    cardHeader.appendChild(viewSwitcher);
                }
            }

            const toolbar = buildToolbarElement();
            searchCardBody.appendChild(toolbar);

        } else if (isEchoMail) {
            // Setup on /echomail
            const filterCard = document.createElement('div');
            filterCard.id = 'echomail-top-filter-card';
            filterCard.className = 'card mb-3';
            filterCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-search me-2"></i> Search Messages
                    </h6>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-secondary" id="echo-badge-total">-</span>
                        <div class="echo-view-switcher btn-group btn-group-sm">
                            <a href="${getToggleUrl('list')}" class="btn btn-outline-secondary" id="echo-header-toggle-list" title="Switch to Echo Area List">
                                <i class="fas fa-list me-1"></i> Area List
                            </a>
                            <button type="button" class="btn btn-primary active" title="Currently viewing Messages">
                                <i class="fas fa-envelope-open-text me-1"></i> Messages
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <form id="topMessageSearchForm" onsubmit="return false;" class="mb-2">
                        <div class="input-group">
                            <input type="text" class="form-control" id="topMessageSearchInput" placeholder="Search message content...">
                            <button class="btn btn-primary" type="submit" id="topMessageSearchBtn">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                        <small class="text-muted d-block mt-1">Search all echomail message content</small>
                    </form>
                </div>
            `;

            const toolbar = buildToolbarElement();
            filterCard.querySelector('.card-body').appendChild(toolbar);

            // Insert top card before #echoInfoBar or before .row
            const echoInfoBar = document.getElementById('echoInfoBar');
            if (echoInfoBar && echoInfoBar.parentNode) {
                echoInfoBar.parentNode.insertBefore(filterCard, echoInfoBar);
            } else {
                const mainRow = document.querySelector('.row');
                if (mainRow && mainRow.parentNode) {
                    mainRow.parentNode.insertBefore(filterCard, mainRow);
                }
            }

            // Bind top search form to Binkterm's searchMessages()
            const searchForm = document.getElementById('topMessageSearchForm');
            if (searchForm) {
                searchForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const topInput = document.getElementById('topMessageSearchInput');
                    const q = topInput ? topInput.value.trim() : '';
                    if (q.length < 2) {
                        if (typeof showError === 'function') {
                            showError('Please enter at least 2 characters to search');
                        } else {
                            alert('Please enter at least 2 characters to search');
                        }
                        return;
                    }
                    const desktopInput = document.getElementById('searchInput');
                    if (desktopInput) desktopInput.value = q;
                    const mobileInput = document.getElementById('mobileSearchInput');
                    if (mobileInput) mobileInput.value = q;

                    if (typeof searchMessages === 'function') {
                        searchMessages();
                    }
                });
            }
        }

        // Sub-Area search input listener
        const subareaSearchInput = document.getElementById('echo-subarea-search-input');
        if (subareaSearchInput) {
            subareaSearchInput.addEventListener('input', function () {
                filterSubAreaButtonsBySearch();
            });
        }

        function filterSubAreaButtonsBySearch() {
            const input = document.getElementById('echo-subarea-search-input');
            if (!input) return;
            const q = input.value.trim().toLowerCase();
            const container = document.getElementById('echo-subarea-buttons');
            if (!container) return;

            let visibleCount = 0;
            container.querySelectorAll('.echo-subarea-btn').forEach(function (btn) {
                const sub = (btn.getAttribute('data-subarea') || '').toLowerCase();
                const title = (btn.getAttribute('title') || '').toLowerCase();
                if (sub === 'all' || !q || sub.includes(q) || title.includes(q)) {
                    btn.style.display = '';
                    visibleCount++;
                } else {
                    btn.style.display = 'none';
                }
            });

            const badgeSubareas = document.getElementById('echo-badge-subareas');
            if (badgeSubareas) {
                badgeSubareas.textContent = visibleCount + ' Areas';
            }
        }

        function renderNetworkButtons(areas) {
            const netContainer = document.getElementById('echo-network-buttons');
            if (!netContainer) return;

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

            const badgeTotal = document.getElementById('echo-badge-total');
            if (badgeTotal) {
                badgeTotal.textContent = areas.length + ' Areas';
            }

            const isAllActive = (activeNetwork === 'all');
            let html = `
                <button type="button" class="btn btn-sm ${isAllActive ? 'btn-primary active' : 'btn-outline-secondary'} echo-btn" data-net="all">
                    <i class="fas fa-border-all me-1"></i> ALL
                    <span class="badge ${isAllActive ? 'bg-dark' : 'bg-secondary'} ms-1">${areas.length}</span>
                </button>
            `;

            if (localCount > 0) {
                const isLocalActive = (activeNetwork === '__local__');
                html += `
                    <button type="button" class="btn btn-sm ${isLocalActive ? 'btn-primary active' : 'btn-outline-secondary'} echo-btn" data-net="__local__">
                        <i class="fas fa-home me-1"></i> LOCAL
                        <span class="badge ${isLocalActive ? 'bg-dark' : 'bg-secondary'} ms-1">${localCount}</span>
                    </button>
                `;
            }

            const domains = Object.keys(domainCounts).sort();
            domains.forEach(function (dom) {
                const count = domainCounts[dom];
                const label = dom.toUpperCase();
                const isNetActive = (activeNetwork === dom);
                html += `
                    <button type="button" class="btn btn-sm ${isNetActive ? 'btn-primary active' : 'btn-outline-secondary'} echo-btn" data-net="${dom}">
                        <i class="fas fa-comments me-1"></i> ${label}
                        <span class="badge ${isNetActive ? 'bg-dark' : 'bg-secondary'} ms-1">${count}</span>
                    </button>
                `;
            });

            netContainer.innerHTML = html;

            netContainer.querySelectorAll('.echo-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    this.blur();
                    const net = this.getAttribute('data-net');
                    selectNetwork(net, true);
                });
            });
        }

        function renderSubAreaButtons(areas, network, selectedSubArea) {
            const container = document.getElementById('echo-subarea-buttons');
            const badgeSubareas = document.getElementById('echo-badge-subareas');
            if (!container) return;

            const net = (network || 'all').toLowerCase();
            let filtered = [];

            if (net === 'all') {
                filtered = areas.slice();
            } else if (net === '__local__') {
                filtered = areas.filter(a => !!a.is_local);
            } else {
                filtered = areas.filter(a => (a.domain || '').toLowerCase() === net);
            }

            if (showSubscribedOnly) {
                filtered = filtered.filter(a => !!a.subscribed);
            }

            if (showUnreadOnly) {
                filtered = filtered.filter(a => (a.unread_count || 0) > 0);
            }

            if (badgeSubareas) {
                badgeSubareas.textContent = filtered.length + ' Areas';
            }

            if (filtered.length === 0) {
                container.innerHTML = `<span class="text-muted small p-1">No sub-areas match the current filter.</span>`;
                return;
            }

            filtered.sort((a, b) => (a.tag || '').localeCompare(b.tag || ''));

            const allLabel = net === 'all' ? 'ALL AREAS' : `ALL ${net === '__local__' ? 'LOCAL' : net.toUpperCase()}`;
            const isAllActive = !selectedSubArea || selectedSubArea === 'all';

            let html = `
                <button type="button" class="btn btn-sm ${isAllActive ? 'btn-primary active' : 'btn-outline-secondary'} echo-btn echo-subarea-btn" data-subarea="all" data-fulltag="all">
                    <i class="fas fa-layer-group me-1"></i> ${escapeHtml(allLabel)}
                    <span class="badge ${isAllActive ? 'bg-dark' : 'bg-secondary'} ms-1">${filtered.length}</span>
                </button>
            `;

            filtered.forEach(function (area) {
                const areaDomain = (area.domain || '').toString().trim();
                const fullTag = areaDomain ? `${area.tag}@${areaDomain}` : area.tag;
                const isSubActive = selectedSubArea && (
                    selectedSubArea.toLowerCase() === (area.tag || '').toLowerCase() ||
                    selectedSubArea.toLowerCase() === fullTag.toLowerCase()
                );

                let badgeHtml = '';
                const unread = area.unread_count || 0;
                const total = area.message_count || 0;
                if (unread > 0) {
                    badgeHtml = `<span class="badge bg-danger ms-1" title="${unread} unread">${unread}</span>`;
                } else if (total > 0) {
                    badgeHtml = `<span class="badge ${isSubActive ? 'bg-dark' : 'bg-secondary'} ms-1" title="${total} posts">${total}</span>`;
                }

                html += `
                    <button type="button" class="btn btn-sm ${isSubActive ? 'btn-primary active' : 'btn-outline-secondary'} echo-btn echo-subarea-btn" data-subarea="${escapeHtml((area.tag || '').toLowerCase())}" data-fulltag="${escapeHtml(fullTag)}" title="${escapeHtml(area.description || area.tag)}">
                        <i class="fas fa-comments me-1"></i> ${escapeHtml(area.tag)}
                        ${badgeHtml}
                    </button>
                `;
            });

            container.innerHTML = html;

            container.querySelectorAll('.echo-subarea-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    this.blur();
                    const sub = this.getAttribute('data-subarea');
                    const full = this.getAttribute('data-fulltag');
                    selectSubArea(sub, full);
                });
            });

            filterSubAreaButtonsBySearch();
        }

        function updateButtonStyles(net) {
            const netContainer = document.getElementById('echo-network-buttons');
            if (!netContainer) return;

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

        function updateAllToggleLinks() {
            const toggleBtn = document.getElementById('echo-btn-view-toggle');
            if (toggleBtn) {
                toggleBtn.href = getToggleUrl(isEchoList ? 'messages' : 'list');
            }
            const headerToggleMessages = document.getElementById('echo-header-toggle-messages');
            if (headerToggleMessages) {
                headerToggleMessages.href = getToggleUrl('messages');
            }
            const headerToggleList = document.getElementById('echo-header-toggle-list');
            if (headerToggleList) {
                headerToggleList.href = getToggleUrl('list');
            }
        }

        function selectNetwork(net, savePref = true) {
            activeNetwork = (net || 'all').toLowerCase();
            activeSubArea = 'all';

            if (savePref) {
                setSavedNetwork(activeNetwork);
                updateUrlParams({ net: activeNetwork === 'all' ? null : activeNetwork, area: null });
            }

            updateButtonStyles(activeNetwork);
            renderSubAreaButtons(allAreas, activeNetwork, 'all');

            if (isEchoList) {
                applyNetworkToDropdown(activeNetwork);
                const searchInputVal = document.getElementById('areaSearch');
                if (searchInputVal) {
                    searchInputVal.value = '';
                }
                if (typeof searchEchoAreas === 'function') {
                    searchEchoAreas('');
                }
            } else if (isEchoMail) {
                if (typeof applyEchoareaFilter === 'function') {
                    applyEchoareaFilter();
                }
                if (typeof selectEchoarea === 'function') {
                    selectEchoarea(null);
                }
                if (savePref) {
                    updateUrlParams({ net: activeNetwork === 'all' ? null : activeNetwork, area: null });
                }
                updateMessagesHeaderForNetwork();
            }

            updateAllToggleLinks();
        }

        function selectSubArea(subarea, fulltag) {
            activeSubArea = (subarea || 'all').toLowerCase();

            const container = document.getElementById('echo-subarea-buttons');
            if (container) {
                container.querySelectorAll('.echo-subarea-btn').forEach(function (btn) {
                    const s = (btn.getAttribute('data-subarea') || '').toLowerCase();
                    const isMatch = (activeSubArea === 'all' && s === 'all') || (activeSubArea !== 'all' && s === activeSubArea);
                    const badge = btn.querySelector('.badge');
                    if (isMatch) {
                        btn.className = 'btn btn-sm btn-primary active echo-btn echo-subarea-btn';
                        if (badge && !badge.classList.contains('bg-danger')) {
                            badge.className = 'badge bg-dark ms-1';
                        }
                    } else {
                        btn.className = 'btn btn-sm btn-outline-secondary echo-btn echo-subarea-btn';
                        if (badge && !badge.classList.contains('bg-danger')) {
                            badge.className = 'badge bg-secondary ms-1';
                        }
                    }
                });
            }

            if (isEchoList) {
                const areaSearchInput = document.getElementById('areaSearch');
                if (activeSubArea === 'all') {
                    if (areaSearchInput) areaSearchInput.value = '';
                    updateUrlParams({ area: null });
                    if (typeof searchEchoAreas === 'function') searchEchoAreas('');
                } else {
                    if (areaSearchInput) areaSearchInput.value = subarea;
                    updateUrlParams({ area: subarea });
                    if (typeof searchEchoAreas === 'function') searchEchoAreas(subarea);
                }
            } else if (isEchoMail) {
                if (activeSubArea === 'all') {
                    if (typeof selectEchoarea === 'function') {
                        selectEchoarea(null);
                    }
                    updateUrlParams({ net: activeNetwork === 'all' ? null : activeNetwork, area: null });
                    updateMessagesHeaderForNetwork();
                } else {
                    updateUrlParams({ net: activeNetwork === 'all' ? null : activeNetwork, area: subarea });
                    if (typeof selectEchoarea === 'function') {
                        selectEchoarea(fulltag);
                    }
                }
            }

            updateAllToggleLinks();
        }

        function applyNetworkToDropdown(net) {
            const dropdown = document.getElementById('networkDropdown');
            if (!dropdown) return;

            const checkboxes = dropdown.querySelectorAll('.network-cb');
            checkboxes.forEach(function (cb) {
                if (net === 'all') {
                    cb.checked = false;
                } else {
                    cb.checked = (cb.value.toLowerCase() === net.toLowerCase());
                }
            });

            if (typeof updateNetworkPickerLabel === 'function') {
                updateNetworkPickerLabel();
            }
        }

        function hookBinktermDropdown() {
            if (typeof window.populateNetworkFilter === 'function' && !window.populateNetworkFilter.__hookedByEchoMod) {
                const originalPopulate = window.populateNetworkFilter;
                window.populateNetworkFilter = function () {
                    originalPopulate.apply(this, arguments);
                    const currentNet = getSavedNetwork();
                    if (currentNet && currentNet !== 'all') {
                        applyNetworkToDropdown(currentNet);
                    }
                };
                window.populateNetworkFilter.__hookedByEchoMod = true;
            }
        }

        function updateMessagesHeaderForNetwork() {
            if (!isEchoMail) return;
            if (activeNetwork && activeNetwork !== 'all' && (!window.currentEchoarea || activeSubArea === 'all')) {
                const netLabel = (activeNetwork === '__local__' || activeNetwork === 'local') ? 'LOCAL' : activeNetwork.toUpperCase();
                const titleEl = document.getElementById('messagesHeaderTitle');
                if (titleEl) {
                    titleEl.textContent = `Recent Messages (${netLabel})`;
                }
                const echoTitleEl = document.getElementById('echoTitle');
                if (echoTitleEl) {
                    echoTitleEl.textContent = `All ${netLabel} Messages`;
                }
            }
        }

        function hookApplyEchoareaFilter() {
            if (!isEchoMail || window.location.pathname.startsWith('/netmail')) return;
            if (typeof window.applyEchoareaFilter === 'function' && !window.applyEchoareaFilter.__hookedByEchoMod) {
                const originalApply = window.applyEchoareaFilter;
                window.applyEchoareaFilter = function () {
                    if (window.location.pathname.startsWith('/netmail')) {
                        return originalApply.apply(this, arguments);
                    }
                    if (activeNetwork && activeNetwork !== 'all' && typeof allEchoareas !== 'undefined' && Array.isArray(allEchoareas)) {
                        let filtered = allEchoareas;
                        if (activeNetwork === '__local__' || activeNetwork === 'local') {
                            filtered = filtered.filter(a => !!a.is_local);
                        } else {
                            filtered = filtered.filter(a => (a.domain || '').toLowerCase() === activeNetwork);
                        }
                        if (typeof areaListInterestFilter !== 'undefined' && areaListInterestFilter !== null) {
                            filtered = filtered.filter(area =>
                                (area.interest_ids || []).includes(areaListInterestFilter)
                            );
                        }
                        if (typeof echoareaSearchQuery !== 'undefined' && echoareaSearchQuery.length > 0) {
                            filtered = filtered.filter(area =>
                                area.tag.toLowerCase().includes(echoareaSearchQuery) ||
                                (area.description && area.description.toLowerCase().includes(echoareaSearchQuery))
                            );
                        }
                        if (typeof displayEchoareas === 'function') {
                            displayEchoareas(filtered);
                        }
                        if (typeof displayMobileEchoareas === 'function') {
                            displayMobileEchoareas(filtered);
                        }
                        return;
                    }
                    originalApply.apply(this, arguments);
                };
                window.applyEchoareaFilter.__hookedByEchoMod = true;
            }
        }

        function hookDisplayMessages() {
            if (!isEchoMail || window.location.pathname.startsWith('/netmail')) return;
            if (typeof window.displayMessages === 'function' && !window.displayMessages.__hookedByEchoMod) {
                const originalDisplay = window.displayMessages;
                window.displayMessages = function (messages, isThreaded) {
                    if (!isEchoMail || window.location.pathname.startsWith('/netmail')) {
                        return originalDisplay.call(this, messages, isThreaded);
                    }
                    let filtered = messages;
                    if (activeNetwork && activeNetwork !== 'all' && (!window.currentEchoarea || activeSubArea === 'all') && Array.isArray(messages)) {
                        if (activeNetwork === '__local__' || activeNetwork === 'local') {
                            filtered = messages.filter(m => !m.echoarea_domain);
                        } else {
                            filtered = messages.filter(m => (m.echoarea_domain || '').toLowerCase() === activeNetwork);
                        }
                    }
                    originalDisplay.call(this, filtered, isThreaded);
                    updateMessagesHeaderForNetwork();
                };
                window.displayMessages.__hookedByEchoMod = true;
            }
        }

        function hookEchomailSelect() {
            if (!isEchoMail || window.location.pathname.startsWith('/netmail')) return;
            if (typeof window.selectEchoarea === 'function' && !window.selectEchoarea.__hookedByEchoMod) {
                const originalSelect = window.selectEchoarea;
                window.selectEchoarea = function (tag) {
                    originalSelect.apply(this, arguments);
                    if (tag) {
                        const parts = tag.split('@');
                        const subTag = parts[0].toLowerCase();
                        const dom = parts[1] ? parts[1].toLowerCase() : '__local__';
                        if (dom && activeNetwork !== 'all' && activeNetwork !== dom) {
                            activeNetwork = dom;
                            setSavedNetwork(dom);
                            updateButtonStyles(dom);
                            if (typeof applyEchoareaFilter === 'function') {
                                applyEchoareaFilter();
                            }
                        }
                        activeSubArea = subTag;
                        renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
                    } else {
                        activeSubArea = 'all';
                        renderSubAreaButtons(allAreas, activeNetwork, 'all');
                        updateMessagesHeaderForNetwork();
                    }
                    updateAllToggleLinks();
                };
                window.selectEchoarea.__hookedByEchoMod = true;
            }
        }

        function syncQuickActionStates() {
            const subBtn = document.getElementById('echo-btn-subscribed');
            if (subBtn) {
                if (showSubscribedOnly) {
                    subBtn.className = 'btn btn-sm btn-primary active echo-btn echo-action-btn';
                } else {
                    subBtn.className = 'btn btn-sm btn-outline-secondary echo-btn echo-action-btn';
                }
            }

            const unreadBtn = document.getElementById('echo-btn-unread');
            if (unreadBtn) {
                if (showUnreadOnly) {
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
                showSubscribedOnly = !showSubscribedOnly;
                syncQuickActionStates();

                if (isEchoList) {
                    const subCb = document.getElementById('subscribedOnlyCheck');
                    if (subCb) {
                        subCb.checked = showSubscribedOnly;
                        if (typeof toggleSubscribedFilter === 'function') {
                            toggleSubscribedFilter();
                        }
                    }
                }

                renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
            });
        }

        const unreadBtn = document.getElementById('echo-btn-unread');
        if (unreadBtn) {
            unreadBtn.addEventListener('click', function () {
                this.blur();
                showUnreadOnly = !showUnreadOnly;
                syncQuickActionStates();

                if (isEchoList) {
                    const unreadCb = document.getElementById('unreadOnlyCheck');
                    if (unreadCb) {
                        unreadCb.checked = showUnreadOnly;
                        if (typeof toggleUnreadFilter === 'function') {
                            toggleUnreadFilter();
                        }
                    }
                } else if (isEchoMail) {
                    if (typeof setFilter === 'function') {
                        setFilter(showUnreadOnly ? 'unread' : 'all');
                    }
                }

                renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
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

        // Listen for external changes to checkboxes on echolist
        const subCb = document.getElementById('subscribedOnlyCheck');
        if (subCb) {
            subCb.addEventListener('change', function () {
                showSubscribedOnly = subCb.checked;
                syncQuickActionStates();
                renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
            });
        }
        const unreadCb = document.getElementById('unreadOnlyCheck');
        if (unreadCb) {
            unreadCb.addEventListener('change', function () {
                showUnreadOnly = unreadCb.checked;
                syncQuickActionStates();
                renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
            });
        }

        // Listen for changes on Binkterm's core network dropdown on /echolist
        const networkDropdown = document.getElementById('networkDropdown');
        if (networkDropdown) {
            networkDropdown.addEventListener('change', function (e) {
                if (e.target && e.target.classList.contains('network-cb')) {
                    const checkedCbs = networkDropdown.querySelectorAll('.network-cb:checked');
                    if (checkedCbs.length === 1) {
                        const net = checkedCbs[0].value.toLowerCase();
                        activeNetwork = net;
                        setSavedNetwork(net);
                        updateButtonStyles(net);
                        renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
                    } else if (checkedCbs.length === 0) {
                        activeNetwork = 'all';
                        setSavedNetwork('all');
                        updateButtonStyles('all');
                        renderSubAreaButtons(allAreas, 'all', activeSubArea);
                    } else {
                        updateButtonStyles('multiple');
                    }
                    updateAllToggleLinks();
                }
            });
        }

        // Listen for browser Back/Forward navigation
        window.addEventListener('popstate', function () {
            const currentSaved = getSavedNetwork();
            const currentSub = getSavedSubArea();
            if (currentSaved !== activeNetwork || currentSub !== activeSubArea) {
                activeNetwork = currentSaved;
                activeSubArea = currentSub;
                updateButtonStyles(activeNetwork);
                renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
                updateAllToggleLinks();
                if (isEchoList) {
                    applyNetworkToDropdown(activeNetwork);
                    if (typeof searchEchoAreas === 'function') {
                        searchEchoAreas(activeSubArea && activeSubArea !== 'all' ? activeSubArea : '');
                    }
                } else if (isEchoMail) {
                    if (typeof applyEchoareaFilter === 'function') {
                        applyEchoareaFilter();
                    }
                    if (activeSubArea === 'all') {
                        if (typeof selectEchoarea === 'function') {
                            selectEchoarea(null);
                        }
                        updateMessagesHeaderForNetwork();
                    }
                }
            }
        });

        // Load Areas Data
        function onAreasReady() {
            if (isEchoMail) {
                hookApplyEchoareaFilter();
                hookDisplayMessages();
                if (window.currentEchoarea) {
                    const parts = window.currentEchoarea.split('@');
                    activeSubArea = parts[0].toLowerCase();
                    if (parts[1] && activeNetwork === 'all') {
                        activeNetwork = parts[1].toLowerCase();
                        setSavedNetwork(activeNetwork);
                    }
                }
                hookEchomailSelect();
            }

            renderNetworkButtons(allAreas);
            renderSubAreaButtons(allAreas, activeNetwork, activeSubArea);
            syncQuickActionStates();
            updateAllToggleLinks();

            if (isEchoList) {
                if (activeNetwork !== 'all') {
                    selectNetwork(activeNetwork, false);
                }
                if (activeSubArea && activeSubArea !== 'all') {
                    selectSubArea(activeSubArea, activeSubArea);
                }
            } else if (isEchoMail) {
                if (activeNetwork !== 'all') {
                    if (typeof applyEchoareaFilter === 'function') {
                        applyEchoareaFilter();
                    }
                    if (!window.currentEchoarea || activeSubArea === 'all') {
                        updateMessagesHeaderForNetwork();
                        if (typeof loadMessages === 'function') {
                            loadMessages();
                        }
                    }
                }
            }
        }

        if (isEchoList) {
            let pollCount = 0;
            function checkEcholistAreas() {
                hookBinktermDropdown();
                if (typeof allEchoAreas !== 'undefined' && Array.isArray(allEchoAreas) && allEchoAreas.length > 0) {
                    allAreas = allEchoAreas;
                    onAreasReady();
                } else if (pollCount < 60) {
                    pollCount++;
                    setTimeout(checkEcholistAreas, 100);
                }
            }
            checkEcholistAreas();
        } else if (isEchoMail) {
            hookApplyEchoareaFilter();
            hookDisplayMessages();
            hookEchomailSelect();
            updateMessagesHeaderForNetwork();

            // Fetch complete echoareas list from API
            if (typeof $ !== 'undefined' && typeof $.get === 'function') {
                $.get('/api/echoareas')
                    .done(function (data) {
                        allAreas = data.echoareas || [];
                        onAreasReady();
                    })
                    .fail(function () {
                        if (typeof allEchoareas !== 'undefined' && Array.isArray(allEchoareas)) {
                            allAreas = allEchoareas;
                            onAreasReady();
                        }
                    });
            }
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEchoButtonMod);
    } else {
        initEchoButtonMod();
    }
})();
