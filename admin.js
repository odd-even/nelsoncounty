        // Test if functions are available
        window.addEventListener('load', function() {
            setTimeout(function() {
                console.log('Testing functions:', {
                    reloadFromSheets: typeof window.reloadFromSheets,
                    saveAllToSheets: typeof window.saveAllToSheets,
                    downloadCSV: typeof window.downloadCSV,
                    openAddModal: typeof window.openAddModal,
                    logout: typeof window.logout,
                    switchTab: typeof window.switchTab,
                    filterAdminByType: typeof window.filterAdminByType,
                    closeModal: typeof window.closeModal
                });
            }, 1000);
        });


const REMOVED_LISTING_FIELDS = [
    'imageGallery',
    'amenitiesTags',
    'wordpressUrl',
    'authorEmail',
    'authorUsername',
    'authorId',
    'status',
    'commentStatus',
    'pingStatus',
    'originalCategories',
    'originalAttributes',
    'dataConfidence',
    'notes',
    'descriptionSource',
    'amenitiesGuessed',
    'missingFields'
];

// Admin card/table image transform width. Kept fairly large so grid images
// don't look blurry when cards render ~350-450px wide.
const ADMIN_IMAGE_TRANSFORM_WIDTH = 900;
const DATA_TABLE_ROW_HEIGHT = 100;
const DATA_TABLE_VIRTUAL_OVERSCAN = 6;
const TABLE_THUMBNAILS_STORAGE_KEY = 'nelsonCounty_tableShowThumbnails';
const TABLE_COLUMN_WIDTHS_STORAGE_KEY = 'nelsonCounty_tableColumnWidths_v2';
const DATA_TABLE_COL_MIN_WIDTH = 88;
const DATA_TABLE_COL_MAX_WIDTH = 1400;
const DATA_TABLE_DEFAULT_COLUMN_WIDTHS = {
    name: 300,
    slug: 210,
    type: 150,
    category: 170,
    area: 150,
    description: 380,
    detailedDescription: 440,
    customHtml: 380,
    image1: 280,
    image1Desc: 240,
    image2: 280,
    image2Desc: 240,
    image3: 280,
    image3Desc: 240,
    website: 260,
    phone: 150,
    address: 280,
    latitude: 110,
    longitude: 110,
    authorName: 170,
    publishedDate: 150,
    modifiedDate: 150,
    directionsLink: 260,
    videoLink: 260,
    document1: 250,
    document1Name: 190,
    document2: 250,
    document2Name: 190,
    amenities: 420,
    featured: 100,
    private: 100,
    googleMapsUrl: 260,
    accordionPanel1Title: 210,
    accordionPanel1Content: 320,
    accordionPanel2Title: 210,
    accordionPanel2Content: 320,
    accordionPanel3Title: 210,
    accordionPanel3Content: 320,
    accordionPanel4Title: 210,
    accordionPanel4Content: 320,
    actions: 120
};
const DATA_TABLE_FALLBACK_COLUMN_WIDTH = 180;

let dataTableShowThumbnails = false;
let dataTableSortedListings = [];
let tableRowDrafts = {};
let _dataTableImageObserver = null;
let _dataTableScrollRaf = null;
let _dataTableColCount = 0;
let _dataTableColumnWidths = null;
let _dataTableColResizeState = null;

function loadDataTableShowThumbnails() {
    try {
        const v = localStorage.getItem(TABLE_THUMBNAILS_STORAGE_KEY);
        if (v === '1' || v === 'true') return true;
        if (v === '0' || v === 'false') return false;
    } catch (e) { /* ignore */ }
    return false;
}

function saveDataTableShowThumbnails(on) {
    dataTableShowThumbnails = !!on;
    try {
        localStorage.setItem(TABLE_THUMBNAILS_STORAGE_KEY, on ? '1' : '0');
    } catch (e) { /* ignore */ }
    const table = document.getElementById('dataTable');
    if (table) {
        table.classList.toggle('data-table--thumbnails', dataTableShowThumbnails);
    }
}

window.setDataTableShowThumbnails = function setDataTableShowThumbnails(enabled) {
    saveDataTableShowThumbnails(enabled);
    if (_dataTableImageObserver) {
        _dataTableImageObserver.disconnect();
        _dataTableImageObserver = null;
    }
    if (typeof renderDataTableVirtualWindow === 'function') {
        renderDataTableVirtualWindow();
    }
};

function getDataTableColumnCount() {
    if (_dataTableColCount) return _dataTableColCount;
    const table = document.getElementById('dataTable');
    if (!table) return 42;
    _dataTableColCount = table.querySelectorAll('thead tr:first-child th').length || 42;
    return _dataTableColCount;
}

function isDataTableThumbnailsEnabled() {
    return dataTableShowThumbnails;
}

function getAdminImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    let finalUrl = url.trim();
    if (!finalUrl) return finalUrl;
    const isImageKit = finalUrl.startsWith('https://ik.imagekit.io/');
    const isDataUrl = finalUrl.startsWith('data:');
    if (!isImageKit || isDataUrl) {
        return finalUrl;
    }
    const transformParam = 'tr=w-' + ADMIN_IMAGE_TRANSFORM_WIDTH + ',f-auto,q-85';
    const parts = finalUrl.split('?');
    const base = parts[0];
    const query = parts[1] ? parts[1].split('&').filter(function(param) {
        return param && !param.startsWith('tr=');
    }) : [];
    query.push(transformParam);
    return base + '?' + query.join('&');
}

function layoutAdminCardImageStrip(imgContainer, imgWrapper, imageCount) {
    if (!imgContainer || !imgWrapper) return;
    if (imageCount <= 1) {
        imgContainer.classList.add('single-image');
        imgWrapper.style.width = '100%';
        return;
    }
    imgContainer.classList.remove('single-image');
    function apply() {
        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
        if (containerWidth <= 0) return false;
        imgWrapper.style.width = (containerWidth * imageCount) + 'px';
        imgWrapper.querySelectorAll('img').forEach(function(img) {
            img.style.width = containerWidth + 'px';
            img.style.minWidth = containerWidth + 'px';
            img.style.maxWidth = containerWidth + 'px';
            img.style.height = '240px';
        });
        return true;
    }
    if (apply()) return;
    requestAnimationFrame(function() {
        if (apply()) return;
        requestAnimationFrame(apply);
    });
}

function parseListingBool(value) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value === null || value === undefined || value === '') return false;
    const s = String(value).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
}

function sanitizeListing(listing) {
    if (!listing || typeof listing !== 'object') return listing;
    
    const galleryImage = listing.imageGallery;
    if (!listing.image3 && galleryImage) {
        listing.image3 = galleryImage;
    }
    
    // Normalize dates if they exist
    if (listing.publishedDate && typeof listing.publishedDate === 'string') {
        listing.publishedDate = normalizeDate(listing.publishedDate);
    }
    if (listing.modifiedDate && typeof listing.modifiedDate === 'string') {
        // Keep time when present so same-day edits sort correctly
        listing.modifiedDate = normalizeModifiedTimestamp(listing.modifiedDate);
    }
    if (listing.eventStartDate && typeof listing.eventStartDate === 'string') {
        listing.eventStartDate = normalizeDate(listing.eventStartDate);
    }
    if (listing.eventEndDate && typeof listing.eventEndDate === 'string') {
        listing.eventEndDate = normalizeDate(listing.eventEndDate);
    }
    if ('isEvent' in listing) {
        listing.isEvent = parseListingBool(listing.isEvent);
    }
    if ('eventAllDay' in listing) {
        listing.eventAllDay = parseListingBool(listing.eventAllDay);
    }
    
    REMOVED_LISTING_FIELDS.forEach(function(field) {
        if (field in listing) {
            delete listing[field];
        }
    });
    delete listing.imageGallery;
    
    return listing;
}

function escapeHtml(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Table View: thumbnail beside image URL fields (loaded via Intersection Observer when enabled)
function buildDataTableImageCell(field, urlValue) {
    const val = urlValue != null ? String(urlValue) : '';
    const trimmed = val.trim();
    const attrVal = escapeHtml(val);
    const previewClass = 'table-image-preview' + (trimmed ? '' : ' table-image-preview--empty');
    const pendingAttr = trimmed ? ' data-pending-url="' + escapeHtml(trimmed) + '"' : '';
    return '<td class="cell-image"><div class="table-image-cell">' +
        '<div class="' + previewClass + '"' + pendingAttr + '></div>' +
        '<input type="text" class="table-image-url-input" value="' + attrVal + '" data-field="' + field + '" placeholder="Image URL" />' +
        '</div></td>';
}

function setTableImagePreviewSrc(preview, url) {
    if (!preview || !url) return;
    let img = preview.querySelector('.table-image-preview-img');
    if (!img) {
        img = document.createElement('img');
        img.className = 'table-image-preview-img';
        img.alt = '';
        preview.appendChild(img);
    }
    const src = getAdminImageUrl(url);
    if (img.getAttribute('data-loaded-src') === src) return;
    img.onload = function() {
        preview.classList.remove('table-image-preview--error');
        img.style.display = 'block';
    };
    img.onerror = function() {
        preview.classList.add('table-image-preview--error');
        img.style.display = 'none';
    };
    img.setAttribute('data-loaded-src', src);
    img.src = src;
}

function initDataTableImageObserver() {
    if (_dataTableImageObserver) return;
    const root = document.querySelector('.table-wrapper');
    _dataTableImageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting || !isDataTableThumbnailsEnabled()) return;
            const preview = entry.target;
            const url = preview.getAttribute('data-pending-url');
            if (url) setTableImagePreviewSrc(preview, url);
        });
    }, { root: root || null, rootMargin: '160px 0px', threshold: 0.01 });
}

function observeDataTableImagePreviews(scope) {
    if (!isDataTableThumbnailsEnabled()) return;
    initDataTableImageObserver();
    (scope || document).querySelectorAll('.table-image-preview[data-pending-url]').forEach(function(el) {
        _dataTableImageObserver.observe(el);
    });
}

function syncTableImagePreview(input) {
    if (!input || !input.getAttribute('data-field')) return;
    const field = input.getAttribute('data-field');
    if (field !== 'image1' && field !== 'image2' && field !== 'image3') return;
    const wrap = input.closest('.table-image-cell');
    if (!wrap) return;
    const preview = wrap.querySelector('.table-image-preview');
    if (!preview) return;
    const val = (input.value || '').trim();
    const img = preview.querySelector('.table-image-preview-img');
    preview.classList.remove('table-image-preview--error');
    if (!val) {
        preview.classList.add('table-image-preview--empty');
        preview.removeAttribute('data-pending-url');
        if (img) img.remove();
        return;
    }
    preview.classList.remove('table-image-preview--empty');
    preview.setAttribute('data-pending-url', val);
    if (img) img.remove();
    if (isDataTableThumbnailsEnabled()) {
        observeDataTableImagePreviews(wrap);
    }
}

function syncTableImagePreviewsInRow(row) {
    if (!row || !isDataTableThumbnailsEnabled()) return;
    row.querySelectorAll('input[data-field="image1"], input[data-field="image2"], input[data-field="image3"]').forEach(function(input) {
        syncTableImagePreview(input);
    });
}

var LISTING_IMAGE_INPUT_IDS = ['listingImage1', 'listingImage2', 'listingImage3'];

function syncListingImagePreview(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(inputId + 'Preview');
    if (!input || !preview) return;
    const url = (input.value || '').trim();
    preview.classList.remove('listing-image-preview--error');
    preview.classList.toggle('listing-image-preview--empty', !url);
    preview.setAttribute('aria-hidden', url ? 'false' : 'true');
    if (!url) {
        preview.innerHTML = '';
        return;
    }
    let img = preview.querySelector('.listing-image-preview-img');
    if (!img) {
        img = document.createElement('img');
        img.className = 'listing-image-preview-img';
        img.alt = 'Image preview';
        preview.appendChild(img);
    }
    const src = getAdminImageUrl(url);
    if (img.getAttribute('data-loaded-src') === src) return;
    img.onload = function() {
        preview.classList.remove('listing-image-preview--error');
        img.style.display = 'block';
    };
    img.onerror = function() {
        preview.classList.add('listing-image-preview--error');
        img.style.display = 'none';
    };
    img.setAttribute('data-loaded-src', src);
    img.src = src;
}

function syncAllListingImagePreviews() {
    LISTING_IMAGE_INPUT_IDS.forEach(syncListingImagePreview);
}

function initListingImagePreviewListeners() {
    if (window.__listingImagePreviewBound) return;
    window.__listingImagePreviewBound = true;
    LISTING_IMAGE_INPUT_IDS.forEach(function(id) {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('input', function() { syncListingImagePreview(id); });
        input.addEventListener('change', function() { syncListingImagePreview(id); });
    });
}

function getTableRowFieldValue(listing, dataIndex, field) {
    const draft = tableRowDrafts[dataIndex];
    if (draft && Object.prototype.hasOwnProperty.call(draft, field)) {
        return draft[field];
    }
    return listing[field];
}

function captureTableRowDraft(row) {
    if (!row || !row.getAttribute('data-index')) return;
    const index = parseInt(row.getAttribute('data-index'), 10);
    if (isNaN(index) || !data.listings[index]) return;
    const draft = tableRowDrafts[index] || {};
    row.querySelectorAll('[data-field]').forEach(function(input) {
        const field = input.getAttribute('data-field');
        if (field === 'modifiedDate') return;
        if (input.type === 'checkbox') {
            draft[field] = input.checked;
        } else if (field === 'amenities') {
            draft[field] = input.value.split(',').map(function(a) { return a.trim(); }).filter(function(a) { return a.length > 0; });
        } else if (field === 'latitude' || field === 'longitude') {
            const raw = String(input.value || '').trim();
            if (!raw) draft[field] = null;
            else {
                const num = parseFloat(raw);
                draft[field] = isNaN(num) ? null : num;
            }
        } else {
            draft[field] = input.value;
        }
    });
    tableRowDrafts[index] = draft;
}

function captureAllVisibleTableRowDrafts() {
    document.querySelectorAll('#dataTableBody tr[data-index]').forEach(captureTableRowDraft);
}

function applyTableRowFieldsToListing(listing, fields, rowEl) {
    let rowEdited = false;
    let changeCount = 0;
    Object.keys(fields).forEach(function(field) {
        if (field === 'modifiedDate') return;
        const newValue = fields[field];
        if (field === 'amenities') {
            if (JSON.stringify(listing[field]) !== JSON.stringify(newValue)) {
                listing[field] = newValue;
                changeCount++;
                rowEdited = true;
            }
        } else if (field === 'category') {
            const currentCategory = listing[field] || '';
            const newCategory = newValue || '';
            if (currentCategory !== newCategory) {
                listing[field] = newCategory;
                changeCount++;
                rowEdited = true;
            }
        } else if (listing[field] !== newValue) {
            listing[field] = newValue;
            if (field === 'directionsLink') {
                listing.googleMapsUrl = newValue;
            }
            changeCount++;
            rowEdited = true;
        }
    });
    if (rowEdited && bumpListingModifiedDate(listing, rowEl)) {
        changeCount++;
    }
    return changeCount;
}

function applyAllTableRowDrafts() {
    let changeCount = 0;
    Object.keys(tableRowDrafts).forEach(function(key) {
        const index = parseInt(key, 10);
        const listing = data.listings[index];
        const draft = tableRowDrafts[key];
        if (!listing || !draft) return;
        changeCount += applyTableRowFieldsToListing(listing, draft, null);
    });
    return changeCount;
}

function bindDataTableVirtualScroll() {
    const wrapper = document.querySelector('.table-wrapper');
    if (!wrapper || wrapper.dataset.virtualBound === '1') return;
    wrapper.dataset.virtualBound = '1';
    wrapper.addEventListener('scroll', function() {
        if (_dataTableScrollRaf) cancelAnimationFrame(_dataTableScrollRaf);
        _dataTableScrollRaf = requestAnimationFrame(renderDataTableVirtualWindow);
    }, { passive: true });
}

function buildDataTableRowHtml(listing, index) {
    const safe = function(value) { return (value === undefined || value === null) ? '' : value; };
    const safeArray = function(value) { return Array.isArray(value) ? value : []; };
    const val = function(field) {
        const v = getTableRowFieldValue(listing, index, field);
        return v === undefined || v === null ? '' : v;
    };
    const valBool = function(field) {
        return !!getTableRowFieldValue(listing, index, field);
    };
    const categoryKeys = Object.keys(TYPE_CATEGORIES);
    const categoryKeysSet = new Set(categoryKeys);
    let categoryOptions = '<option value="">Select Category</option>' +
        categoryKeys.map(function(categoryKey) {
            const category = TYPE_CATEGORIES[categoryKey];
            const isSelected = safe(val('category')) === categoryKey;
            return '<option value="' + escapeHtml(categoryKey) + '" ' + (isSelected ? 'selected' : '') + '>' + escapeHtml(category.emoji || '') + ' ' + escapeHtml(category.name) + '</option>';
        }).join('');
    const listingCategory = safe(val('category'));
    if (listingCategory && listingCategory.trim() !== '' && !categoryKeysSet.has(listingCategory)) {
        categoryOptions += '<option value="' + escapeHtml(listingCategory) + '" selected>' + escapeHtml(listingCategory) + ' (from Google Sheets)</option>';
    }
    const listingType = safe(val('type'));
    const typeList = (data.filterOptions && Array.isArray(data.filterOptions.types)) ? data.filterOptions.types.slice() : [];
    if (listingType && typeList.indexOf(listingType) === -1) typeList.unshift(listingType);
    const typeOptions = typeList.map(function(t) {
        return '<option value="' + escapeHtml(t) + '" ' + (listingType === t ? 'selected' : '') + '>' + escapeHtml(t) + '</option>';
    }).join('');
    const listingArea = safe(val('area'));
    const areaList = (data.filterOptions && Array.isArray(data.filterOptions.areas)) ? data.filterOptions.areas.slice() : [];
    if (listingArea && areaList.indexOf(listingArea) === -1) areaList.unshift(listingArea);
    const areaOptions = areaList.map(function(a) {
        return '<option value="' + escapeHtml(a) + '" ' + (listingArea === a ? 'selected' : '') + '>' + escapeHtml(a) + '</option>';
    }).join('');
    const amenitiesRaw = safeArray(getTableRowFieldValue(listing, index, 'amenities')).join(', ');
    return '<tr data-index="' + index + '">' +
        '<td class="cell-name"><textarea data-field="name" rows="2">' + escapeHtml(val('name')) + '</textarea></td>' +
        '<td class="cell-slug"><input type="text" value="' + escapeHtml(val('slug')) + '" data-field="slug" placeholder="auto" /></td>' +
        '<td class="cell-type"><select data-field="type">' + typeOptions + '</select></td>' +
        '<td class="cell-category"><select data-field="category">' + categoryOptions + '</select></td>' +
        '<td class="cell-area"><select data-field="area">' + areaOptions + '</select></td>' +
        '<td class="cell-description"><textarea data-field="description">' + escapeHtml(val('description')) + '</textarea></td>' +
        '<td class="cell-description-detailed"><textarea data-field="detailedDescription">' + escapeHtml(val('detailedDescription')) + '</textarea></td>' +
        '<td class="cell-custom-html"><textarea data-field="customHtml">' + escapeHtml(val('customHtml')) + '</textarea></td>' +
        buildDataTableImageCell('image1', val('image1')) +
        '<td class="cell-image-desc"><textarea data-field="image1Desc" rows="2">' + escapeHtml(val('image1Desc')) + '</textarea></td>' +
        buildDataTableImageCell('image2', val('image2')) +
        '<td class="cell-image-desc"><textarea data-field="image2Desc" rows="2">' + escapeHtml(val('image2Desc')) + '</textarea></td>' +
        buildDataTableImageCell('image3', val('image3')) +
        '<td class="cell-image-desc"><textarea data-field="image3Desc" rows="2">' + escapeHtml(val('image3Desc')) + '</textarea></td>' +
        '<td class="cell-website"><input type="text" value="' + escapeHtml(val('website')) + '" data-field="website" placeholder="www.example.com or https://..." /></td>' +
        '<td class="cell-phone"><input type="tel" value="' + escapeHtml(val('phone')) + '" data-field="phone" /></td>' +
        '<td class="cell-address"><input type="text" value="' + escapeHtml(val('address')) + '" data-field="address" /></td>' +
        '<td class="cell-coord"><input type="number" step="any" value="' + escapeHtml(val('latitude') || '') + '" data-field="latitude" /></td>' +
        '<td class="cell-coord"><input type="number" step="any" value="' + escapeHtml(val('longitude') || '') + '" data-field="longitude" /></td>' +
        '<td class="cell-author"><input type="text" value="' + escapeHtml(val('authorName')) + '" data-field="authorName" placeholder="Author name" /></td>' +
        '<td class="cell-date"><input type="date" value="' + escapeHtml(val('publishedDate') ? normalizeDate(val('publishedDate')) : '') + '" data-field="publishedDate" /></td>' +
        '<td class="cell-date"><input type="date" value="' + escapeHtml(val('modifiedDate') ? normalizeDate(val('modifiedDate')) : '') + '" data-field="modifiedDate" readonly title="Set automatically when the row is saved" /></td>' +
        '<td class="cell-directions"><input type="url" value="' + escapeHtml(val('directionsLink')) + '" data-field="directionsLink" placeholder="https://..." /></td>' +
        '<td class="cell-video"><input type="url" value="' + escapeHtml(val('videoLink')) + '" data-field="videoLink" placeholder="https://youtube.com/..." /></td>' +
        '<td class="cell-document"><input type="url" value="' + escapeHtml(val('document1')) + '" data-field="document1" placeholder="PDF URL..." /></td>' +
        '<td class="cell-document-name"><input type="text" value="' + escapeHtml(val('document1Name')) + '" data-field="document1Name" placeholder="Document name..." /></td>' +
        '<td class="cell-document"><input type="url" value="' + escapeHtml(val('document2')) + '" data-field="document2" placeholder="PDF URL..." /></td>' +
        '<td class="cell-document-name"><input type="text" value="' + escapeHtml(val('document2Name')) + '" data-field="document2Name" placeholder="Document name..." /></td>' +
        '<td class="cell-amenities"><div class="amenities-cell"><div class="amenities-pills-preview"></div><textarea data-field="amenities" class="amenities-raw-input" rows="1" spellcheck="false" placeholder="Wi-Fi, Parking, Pet friendly…">' + escapeHtml(amenitiesRaw) + '</textarea></div></td>' +
        '<td class="cell-featured"><input type="checkbox" ' + (valBool('featured') ? 'checked' : '') + ' data-field="featured" /></td>' +
        '<td class="cell-private"><input type="checkbox" ' + (valBool('private') ? 'checked' : '') + ' data-field="private" /></td>' +
        '<td class="cell-googlemaps"><input type="url" value="' + escapeHtml(val('googleMapsUrl')) + '" data-field="googleMapsUrl" placeholder="Google Maps URL" /></td>' +
        '<td class="cell-accordion-title"><input type="text" value="' + escapeHtml(val('accordionPanel1Title')) + '" data-field="accordionPanel1Title" placeholder="Panel 1 Title" /></td>' +
        '<td class="cell-accordion-content"><textarea data-field="accordionPanel1Content" placeholder="Panel 1 Content">' + escapeHtml(val('accordionPanel1Content')) + '</textarea></td>' +
        '<td class="cell-accordion-title"><input type="text" value="' + escapeHtml(val('accordionPanel2Title')) + '" data-field="accordionPanel2Title" placeholder="Panel 2 Title" /></td>' +
        '<td class="cell-accordion-content"><textarea data-field="accordionPanel2Content" placeholder="Panel 2 Content">' + escapeHtml(val('accordionPanel2Content')) + '</textarea></td>' +
        '<td class="cell-accordion-title"><input type="text" value="' + escapeHtml(val('accordionPanel3Title')) + '" data-field="accordionPanel3Title" placeholder="Panel 3 Title" /></td>' +
        '<td class="cell-accordion-content"><textarea data-field="accordionPanel3Content" placeholder="Panel 3 Content">' + escapeHtml(val('accordionPanel3Content')) + '</textarea></td>' +
        '<td class="cell-accordion-title"><input type="text" value="' + escapeHtml(val('accordionPanel4Title')) + '" data-field="accordionPanel4Title" placeholder="Panel 4 Title" /></td>' +
        '<td class="cell-accordion-content"><textarea data-field="accordionPanel4Content" placeholder="Panel 4 Content">' + escapeHtml(val('accordionPanel4Content')) + '</textarea></td>' +
        '<td class="cell-actions">' +
            '<button type="button" class="btn-table-delete' + (deleteConfirmId === listing.slug ? ' btn-table-delete--confirm' : '') + '" onclick="deleteFromTable(' + index + ')">' +
            (deleteConfirmId === listing.slug ? 'Confirm?' : 'Delete') +
            '</button>' +
        '</td>' +
    '</tr>';
}

function renderDataTableVirtualWindow() {
    const wrapper = document.querySelector('.table-wrapper');
    const tbody = document.getElementById('dataTableBody');
    if (!wrapper || !tbody) return;

    const total = dataTableSortedListings.length;
    if (total === 0) {
        tbody.innerHTML = '';
        return;
    }

    captureAllVisibleTableRowDrafts();

    const scrollTop = wrapper.scrollTop;
    const viewHeight = wrapper.clientHeight || 600;
    const start = Math.max(0, Math.floor(scrollTop / DATA_TABLE_ROW_HEIGHT) - DATA_TABLE_VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil(viewHeight / DATA_TABLE_ROW_HEIGHT) + DATA_TABLE_VIRTUAL_OVERSCAN * 2;
    const end = Math.min(total, start + visibleCount);

    const colSpan = getDataTableColumnCount();
    const topPad = start * DATA_TABLE_ROW_HEIGHT;
    const bottomPad = Math.max(0, (total - end) * DATA_TABLE_ROW_HEIGHT);

    let html = '';
    if (topPad > 0) {
        html += '<tr class="data-table-spacer" aria-hidden="true" style="height:' + topPad + 'px;"><td colspan="' + colSpan + '" style="height:' + topPad + 'px;padding:0;border:none;background:transparent;line-height:0;font-size:0;"></td></tr>';
    }
    for (let i = start; i < end; i++) {
        const item = dataTableSortedListings[i];
        html += buildDataTableRowHtml(item.listing, item.dataIndex);
    }
    if (bottomPad > 0) {
        html += '<tr class="data-table-spacer" aria-hidden="true" style="height:' + bottomPad + 'px;"><td colspan="' + colSpan + '" style="height:' + bottomPad + 'px;padding:0;border:none;background:transparent;line-height:0;font-size:0;"></td></tr>';
    }
    tbody.innerHTML = html;

    tbody.querySelectorAll('textarea.amenities-raw-input').forEach(function(ta) {
        syncTableAmenitiesPillsPreview(ta);
    });
    observeDataTableImagePreviews(tbody);
    syncDataTableResizableRows();
}

// Table View: live pill preview above the comma-separated amenities field
function syncTableAmenitiesPillsPreview(textarea) {
    if (!textarea || textarea.getAttribute('data-field') !== 'amenities') return;
    const wrap = textarea.closest('.amenities-cell');
    if (!wrap) return;
    const preview = wrap.querySelector('.amenities-pills-preview');
    if (!preview) return;
    const parts = String(textarea.value || '').split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
    if (parts.length === 0) {
        preview.innerHTML = '';
        return;
    }
    preview.innerHTML = parts.map(function(a) {
        return '<span class="amenity-pill">' + escapeHtml(a) + '</span>';
    }).join('');
}

// Keep filter-row sticky offset under the (possibly wrapped) sort header row
function syncDataTableStickyHeaderOffset() {
    const table = document.getElementById('dataTable');
    if (!table) return;
    const sortRow = table.querySelector('thead tr:first-child');
    if (!sortRow) return;
    const h = sortRow.getBoundingClientRect().height;
    table.style.setProperty('--data-table-header-row1-height', Math.max(Math.ceil(h), 40) + 'px');
}

var _dataTableResizeObserver = null;

function syncDataTableResizableRows() {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;

    function syncRowFromTextarea(ta) {
        const tr = ta.closest('tr');
        if (!tr) return;
        const rowH = Math.max(100, ta.offsetHeight + 14);
        const expanded = rowH > 100;
        tr.classList.toggle('data-table-row-expanded', expanded);
        tr.style.height = expanded ? rowH + 'px' : '';
        tr.querySelectorAll('td').forEach(function(td) {
            td.style.height = expanded ? rowH + 'px' : '';
        });
    }

    tbody.querySelectorAll('textarea').forEach(function(ta) {
        if (ta.dataset.resizeBound === '1') return;
        ta.dataset.resizeBound = '1';
        ta.addEventListener('mouseup', function() { syncRowFromTextarea(ta); });
        if (typeof ResizeObserver !== 'undefined') {
            if (!_dataTableResizeObserver) {
                _dataTableResizeObserver = new ResizeObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.target.tagName === 'TEXTAREA') {
                            syncRowFromTextarea(entry.target);
                        }
                    });
                });
            }
            _dataTableResizeObserver.observe(ta);
        }
    });
}

function sanitizeCustomHtml(html) {
    if (!html) return '';
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script, iframe, object, embed, link, meta, style').forEach(el => el.remove());
    template.content.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || name === 'srcdoc') {
                el.removeAttribute(attr.name);
            }
        });
    });
    return template.innerHTML;
}

function normalizeFilterValue(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed;
}

// Normalize date strings to YYYY-MM-DD format
function normalizeDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return dateStr;
    }
    const trimmed = dateStr.trim();
    if (!trimmed) {
        return '';
    }
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    // Datetime → calendar date for <input type="date"> / display
    const datePart = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (datePart) {
        return datePart[1];
    }
    // Try to parse as Date object (handles Google Sheets date format)
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }
    // If can't parse, return original (validation will catch it)
    return trimmed;
}

// Preserve YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss for modifiedDate sorting
function normalizeModifiedTimestamp(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return dateStr || '';
    }
    const trimmed = dateStr.trim();
    if (!trimmed) return '';
    const dtMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (dtMatch) {
        return dtMatch[1] + 'T' + dtMatch[2] + ':' + dtMatch[3] + ':' + (dtMatch[4] || '00');
    }
    return normalizeDate(trimmed);
}

// Today's calendar date in local timezone (YYYY-MM-DD) for published dates
function getLocalDateYYYYMMDD() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// Local timestamp for modifiedDate so same-day edits sort newest-first
function getLocalDateTimeISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds;
}

function parseListingTimestamp(dateStr) {
    if (!dateStr) return 0;
    const s = String(dateStr).trim();
    if (!s) return 0;
    const dtMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (dtMatch) {
        return new Date(
            parseInt(dtMatch[1], 10),
            parseInt(dtMatch[2], 10) - 1,
            parseInt(dtMatch[3], 10),
            parseInt(dtMatch[4], 10),
            parseInt(dtMatch[5], 10),
            parseInt(dtMatch[6] || '0', 10)
        ).getTime();
    }
    const dateMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
        // Date-only → local midnight (sorts below same-day timed edits)
        return new Date(
            parseInt(dateMatch[1], 10),
            parseInt(dateMatch[2], 10) - 1,
            parseInt(dateMatch[3], 10)
        ).getTime();
    }
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

// Set modifiedDate to now when a listing is edited; returns true if changed
function bumpListingModifiedDate(listing, rowEl) {
    if (!listing) return false;
    const now = getLocalDateTimeISO();
    if (listing.modifiedDate === now) return false;
    listing.modifiedDate = now;
    if (rowEl) {
        const modInput = rowEl.querySelector('[data-field="modifiedDate"]');
        if (modInput) modInput.value = normalizeDate(now);
    }
    return true;
}

// Load categories from localStorage (synced between admin and front page)
function loadCategoriesFromStorage() {
    try {
        // Check if localStorage is available
        if (typeof localStorage === 'undefined' || !localStorage) {
            console.error('❌ localStorage is not available');
            return null;
        }
        
        // Debug: Check all localStorage keys
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allKeys.push(key);
        }
        console.log('🔍 All localStorage keys:', allKeys);
        
        const stored = localStorage.getItem('nelsonCounty_categories');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                const categoryKeys = Object.keys(parsed);
                console.log('✅ loadCategoriesFromStorage: Found', categoryKeys.length, 'categories in localStorage');
                console.log('📋 Category keys:', categoryKeys);
                console.log('📋 Category names:', categoryKeys.map(function(k) {
                    return toSentenceCase(k);
                }).join(', '));
                return parsed;
            } else {
                console.warn('⚠️ loadCategoriesFromStorage: Stored value is not an object:', typeof parsed);
                console.warn('⚠️ Raw stored value:', stored);
            }
        } else {
            console.log('⚠️ loadCategoriesFromStorage: No categories found in localStorage');
            console.log('🔍 Checking if key exists with different value...');
            // Double-check by trying to access it directly
            try {
                const directAccess = localStorage['nelsonCounty_categories'];
                if (directAccess) {
                    console.log('⚠️ Found value via direct access:', directAccess);
        }
    } catch (e) {
                console.log('⚠️ Direct access also failed:', e);
            }
        }
    } catch (e) {
        console.error('❌ Error loading categories from storage:', e);
        console.error('❌ Error details:', e.message, e.stack);
    }
    return null;
}

// Save categories to localStorage (synced between admin and front page)
function saveCategoriesToStorage(categories) {
    try {
        // Check if localStorage is available
        if (typeof localStorage === 'undefined' || !localStorage) {
            console.error('❌ localStorage is not available for saving');
            return false;
        }
        
        const categoryKeys = Object.keys(categories);
        const customKeys = categoryKeys.filter(function(key) {
            return !DEFAULT_TYPE_CATEGORIES.hasOwnProperty(key);
        });
        console.log('💾 saveCategoriesToStorage: Saving', categoryKeys.length, 'categories to localStorage');
        if (customKeys.length > 0) {
            console.log('🔧 Custom categories being saved:', customKeys.map(function(k) {
                return toSentenceCase(k);
            }).join(', '));
        }
        
        const jsonString = JSON.stringify(categories);
        localStorage.setItem('nelsonCounty_categories', jsonString);
        
        // Verify the save worked by reading it back
        const verification = localStorage.getItem('nelsonCounty_categories');
        if (verification === jsonString) {
            console.log('✅ Categories saved successfully and verified');
            console.log('🔍 Verification: Found', Object.keys(JSON.parse(verification)).length, 'categories after save');
        } else {
            console.warn('⚠️ Warning: Save verification failed! Categories may not have been saved correctly.');
            console.warn('⚠️ Expected length:', jsonString.length, 'Got length:', verification ? verification.length : 0);
        }
        
        return true;
    } catch (e) {
        console.error('❌ Error saving categories to storage:', e);
        console.error('❌ Error details:', e.message, e.stack);
        return false;
    }
}

// ===========================================
// ICON MAPPING MANAGEMENT (synced between admin and front page)
// ===========================================
function loadIconMappingsFromStorage() {
    try {
        const stored = localStorage.getItem('nelsonCounty_iconMappings');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error loading icon mappings from storage:', e);
    }
    return null;
}

function saveIconMappingsToStorage(iconMappings) {
    try {
        localStorage.setItem('nelsonCounty_iconMappings', JSON.stringify(iconMappings));
        return true;
    } catch (e) {
        console.error('Error saving icon mappings to storage:', e);
        return false;
    }
}

// Default icon mappings - comprehensive list (merged from admin and front page)
// Only declare if not already defined (admin.js might have it)
// Use window object to avoid duplicate variable errors
if (typeof window.DEFAULT_ICON_MAPPINGS === 'undefined' && typeof DEFAULT_ICON_MAPPINGS === 'undefined') {
    window.DEFAULT_ICON_MAPPINGS = {
    'Wine': 'icon-wine',
    'Winery': 'icon-wine',
    'Beer': 'icon-beer',
    'Brewery': 'icon-beer',
    'Spirits': 'icon-spirits',
    'Distillery': 'icon-spirits',
    'Cocktails': 'icon-cocktail',
    'Cocktail Bar': 'icon-cocktail',
    'Coffee': 'icon-coffee',
    'Coffee Shop': 'icon-coffee',
    'Café': 'icon-coffee',
    'Tea': 'icon-tea',
    'Tea Room': 'icon-tea',
    'Restaurant': 'icon-restaurant',
    'Dining': 'icon-restaurant',
    'Bakery': 'icon-bakery',
    'Patisserie': 'icon-bakery',
    'Cheese': 'icon-cheese',
    'Fromagerie': 'icon-cheese',
    'Chocolate': 'icon-chocolate',
    'Chocolatier': 'icon-chocolate',
    'Museum': 'icon-museum',
    'Art': 'icon-art',
    'Art Gallery': 'icon-gallery',
    'Gallery': 'icon-gallery',
    'Hiking': 'icon-hiking',
    'Hike': 'icon-hiking',
    'Trail': 'icon-hiking',
    'Cycling': 'icon-cycling',
    'Bike': 'icon-cycling',
    'Activity': 'icon-activity',
    'Activities': 'icon-activity',
    'Outdoor': 'icon-outdoor',
    'Outdoor Activity': 'icon-outdoor',
    'Kayaking': 'icon-kayaking',
    'Kayak': 'icon-kayaking',
    'Spa': 'icon-spa',
    'Wellness': 'icon-wellness',
    'Health': 'icon-wellness',
    'Shopping': 'icon-shopping',
    'Shop': 'icon-shopping',
    'Market': 'icon-market',
    'Farmers Market': 'icon-market',
    'Concert': 'icon-concert',
    'Music': 'icon-concert',
    'Theater': 'icon-theater',
    'Theatre': 'icon-theater',
    'Cinema': 'icon-cinema',
    'Movie': 'icon-cinema',
    'Film': 'icon-cinema',
    'Festival': 'icon-festival',
    'Event': 'icon-festival',
    'Hotel': 'icon-lodging',
    'Lodging': 'icon-lodging',
    'B&B': 'icon-lodging',
    'BnB': 'icon-lodging',
    'Inn': 'icon-lodging',
    'Cabin': 'icon-lodging',
    'Camping': 'icon-lodging',
    'Transport': 'icon-transport',
    'Transportation': 'icon-transport',
    'Train': 'icon-train',
    'Railway': 'icon-train',
    'Boat': 'icon-boat',
    'Ferry': 'icon-boat',
    'Scenic': 'icon-scenic',
    'Viewpoint': 'icon-viewpoint',
    'Lookout': 'icon-viewpoint',
    'Park': 'icon-park',
    'Garden': 'icon-garden',
    'Beach': 'icon-beach',
    'History': 'icon-history',
    'Historical': 'icon-history',
    'Heritage': 'icon-history',
    'Culture': 'icon-culture',
    'Cultural': 'icon-culture',
    'Architecture': 'icon-architecture',
    'Building': 'icon-architecture',
    'Local': 'icon-local',
    'Tour': 'icon-tour',
    'Guided Tour': 'icon-tour',
    'Workshop': 'icon-workshop',
    'Class': 'icon-class',
    'Course': 'icon-class',
    'Food': 'icon-food',
    'Cuisine': 'icon-food',
    'Cidery': 'icon-cidery',
    'Cider': 'icon-cidery',
    'Indoor Activity': 'icon-indoor',
    'Indoor': 'icon-indoor',
    'Attraction': 'icon-attraction',
    'Attractions': 'icon-attraction',
    'Farm & Orchard': 'icon-farm',
    'Farm': 'icon-farm',
    'Orchard': 'icon-farm'
};
} // End of DEFAULT_ICON_MAPPINGS conditional declaration

// Initialize icon mappings from storage or defaults
let ICON_MAPPINGS = loadIconMappingsFromStorage();
if (!ICON_MAPPINGS || Object.keys(ICON_MAPPINGS).length === 0) {
    ICON_MAPPINGS = (typeof window.DEFAULT_ICON_MAPPINGS !== 'undefined' ? window.DEFAULT_ICON_MAPPINGS : (typeof DEFAULT_ICON_MAPPINGS !== 'undefined' ? DEFAULT_ICON_MAPPINGS : {}));
    saveIconMappingsToStorage(ICON_MAPPINGS);
}

// Default category definitions - comprehensive list based on user requirements
// Only define if not already defined (e.g., from admin.js)
if (typeof DEFAULT_TYPE_CATEGORIES === 'undefined') {
    var DEFAULT_TYPE_CATEGORIES = {
    'taste': {
        emoji: '☕',
        name: 'Taste',
        description: 'Food and drink experiences of all kinds.',
        icon: 'icon-food',
        types: ['Restaurant', 'Café', 'Coffee Shop', 'Bakery', 'Brewery', 'Winery', 'Cidery', 'Distillery', 'Bar', 'Cocktail Bar', 'Food Market', 'Farmers Market', 'Food Tour', 'Cooking Class', 'Local Specialty', 'Street Food', 'Fine Dining']
    },
    'stay': {
        emoji: '🏠',
        name: 'Stay',
        description: 'Places to sleep or retreat.',
        icon: 'icon-lodging',
        types: ['Lodging', 'Hotel', 'B&B', 'BnB', 'Inn', 'Cabin', 'Camping', 'Glamping', 'Hostel', 'Boutique Stay', 'Treehouse', 'Unique Stay', 'Airbnb', 'Lodge', 'Boat', 'Entire House', 'House Stay', 'House Rental', 'Vacation Rental', 'Rental', 'Apartment', 'Condo', 'Cottage', 'Villa', 'Home', 'Property']
    },
    'outdoor': {
        emoji: '⛰️',
        name: 'Outdoor',
        description: 'Nature, adventure, and recreation outside.',
        icon: 'icon-outdoor',
        types: ['Hiking', 'Outdoor', 'Outdoor Activity', 'Park', 'Beach', 'Trail', 'Camping', 'Climbing', 'Water Sports', 'Skiing', 'Scenic Drive', 'Viewpoint', 'Nature Walk', 'Biking', 'Cycling', 'Kayaking', 'Kayak', 'Farm & Orchard', 'National Park', 'Hike']
    },
    'culture': {
        emoji: '🎭',
        name: 'Culture',
        description: 'Art, heritage, people, and traditions.',
        icon: 'icon-culture',
        types: ['Museum', 'Gallery', 'Art Gallery', 'Art', 'Architecture', 'Landmark', 'Historical Site', 'Festival', 'Cultural Tour', 'Craft', 'Music', 'Theater', 'Theatre', 'Dance', 'Local Craft', 'Cultural Site']
    },
    'experience': {
        emoji: '🛼',
        name: 'Experience',
        description: 'Fun, entertainment, and activities.',
        icon: 'icon-activity',
        types: ['Activity', 'Activities', 'Indoor Activity', 'Event', 'Nightlife', 'Club', 'Amusement Park', 'Arcade', 'Live Show', 'Interactive Experience', 'Workshop', 'Tour', 'Entertainment']
    },
    'attractions': {
        emoji: '⭐',
        name: 'Attractions',
        description: 'Places to visit, shop, and enjoy resorts.',
        icon: 'icon-local',
        types: ['Attraction', 'Attractions', 'Shopping', 'Shop', 'Retail', 'Resorts', 'Resort']
    }
};
}

function migrateCommunityToAttractions(cats) {
    if (!cats || typeof cats !== 'object') return cats;
    if (cats.community) {
        if (!cats.attractions) {
            cats.attractions = cats.community;
        }
        delete cats.community;
    }
    if (cats.attractions && DEFAULT_TYPE_CATEGORIES.attractions) {
        cats.attractions.name = DEFAULT_TYPE_CATEGORIES.attractions.name;
        cats.attractions.description = DEFAULT_TYPE_CATEGORIES.attractions.description;
        cats.attractions.types = DEFAULT_TYPE_CATEGORIES.attractions.types.slice();
        cats.attractions.icon = cats.attractions.icon || DEFAULT_TYPE_CATEGORIES.attractions.icon;
        cats.attractions.emoji = cats.attractions.emoji || DEFAULT_TYPE_CATEGORIES.attractions.emoji;
    }
    return cats;
}

function normalizeCategoryKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (key === 'community' || key === 'attraction' || key === 'attractions') return 'attractions';
    return key;
}

// Initialize TYPE_CATEGORIES from localStorage or defaults
let loadedCategories = migrateCommunityToAttractions(loadCategoriesFromStorage());
let TYPE_CATEGORIES;

if (loadedCategories && Object.keys(loadedCategories).length > 0) {
    // Identify custom categories FIRST (before any modifications)
    const customCategoryKeys = Object.keys(loadedCategories).filter(function(key) {
        return !DEFAULT_TYPE_CATEGORIES.hasOwnProperty(key) && key !== 'community';
    });
    
    // Preserve custom categories data BEFORE any merging
    const preservedCustomCategories = {};
    if (customCategoryKeys.length > 0) {
        console.log('🔧 Found custom categories to preserve:', customCategoryKeys.map(function(k) {
            return loadedCategories[k].name || k;
        }).join(', '));
        customCategoryKeys.forEach(function(key) {
            preservedCustomCategories[key] = JSON.parse(JSON.stringify(loadedCategories[key]));
        });
    }
    
    // Start with loaded categories from localStorage (preserves custom categories)
    TYPE_CATEGORIES = JSON.parse(JSON.stringify(loadedCategories));
    console.log('✅ Loaded categories from localStorage. Total:', Object.keys(TYPE_CATEGORIES).length);
    console.log('📋 Categories:', Object.keys(TYPE_CATEGORIES).map(function(k) {
        return TYPE_CATEGORIES[k].name;
    }).join(', '));
    
    // Ensure all default categories have icons (but don't overwrite custom categories)
    let needsUpdate = false;
    for (const categoryKey in DEFAULT_TYPE_CATEGORIES) {
        if (TYPE_CATEGORIES[categoryKey]) {
            // If category exists but doesn't have an icon, set it from defaults
            if (!TYPE_CATEGORIES[categoryKey].icon && DEFAULT_TYPE_CATEGORIES[categoryKey].icon) {
                TYPE_CATEGORIES[categoryKey].icon = DEFAULT_TYPE_CATEGORIES[categoryKey].icon;
                needsUpdate = true;
            }
        } else {
            // If default category is missing, add it from defaults
            TYPE_CATEGORIES[categoryKey] = JSON.parse(JSON.stringify(DEFAULT_TYPE_CATEGORIES[categoryKey]));
            needsUpdate = true;
        }
    }
    
    // Explicitly re-add custom categories to ensure they're preserved after merge
    // This is a safety measure in case the merge somehow removed them
    for (const key in preservedCustomCategories) {
        TYPE_CATEGORIES[key] = preservedCustomCategories[key];
    }
    migrateCommunityToAttractions(TYPE_CATEGORIES);
    
    // Verify custom categories are still present
    const finalCustomKeys = Object.keys(TYPE_CATEGORIES).filter(function(key) {
        return !DEFAULT_TYPE_CATEGORIES.hasOwnProperty(key);
    });
    if (finalCustomKeys.length !== customCategoryKeys.length) {
        console.warn('⚠️ Warning: Custom category count changed during merge!', {
            before: customCategoryKeys.length,
            after: finalCustomKeys.length
        });
    }
    
    // Save updated categories if we made changes (preserves custom categories)
    if (needsUpdate || customCategoryKeys.length > 0) {
        saveCategoriesToStorage(TYPE_CATEGORIES);
        console.log('💾 Saved categories to localStorage. Total:', Object.keys(TYPE_CATEGORIES).length);
        if (customCategoryKeys.length > 0) {
            console.log('✅ Preserved custom categories:', customCategoryKeys.map(function(k) {
                return TYPE_CATEGORIES[k].name;
            }).join(', '));
        }
    }
} else {
    // No categories in localStorage, use defaults
    console.log('⚠️ No categories in localStorage, using defaults');
    TYPE_CATEGORIES = JSON.parse(JSON.stringify(DEFAULT_TYPE_CATEGORIES));
    saveCategoriesToStorage(TYPE_CATEGORIES);
}

function normalizeCategoryInput(value) {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    if (lower === 'community' || lower === 'attractions') return 'attractions';
    
    // First check if it's a direct key match
    if (TYPE_CATEGORIES[lower]) {
        return lower;
    }
    
    // Check if it matches a category name
    for (const categoryKey in TYPE_CATEGORIES) {
        const category = TYPE_CATEGORIES[categoryKey];
        if (!category) continue;
        if (categoryKey.toLowerCase() === lower) {
            return categoryKey;
        }
        if (category.emoji && category.emoji === trimmed) {
            return categoryKey;
        }
    }
    
    // Check if it matches a slugified version
    const slugified = lower.replace(/\s+/g, '-');
    if (TYPE_CATEGORIES[slugified]) {
        return slugified;
    }
    
    // If no match found, return the original trimmed value
    // This preserves custom categories that aren't in TYPE_CATEGORIES yet
    console.log('⚠️ normalizeCategoryInput: Category "' + trimmed + '" not found in TYPE_CATEGORIES, preserving original value');
    return trimmed;
}

// Keyword mappings for automatic category assignment based on type content
// Used when exact type match is not found in category types array
const TYPE_KEYWORD_MAPPINGS = {
    'taste': ['coffee', 'cafe', 'café', 'restaurant', 'food', 'dining', 'bakery', 'brewery', 'winery', 'cidery', 'distillery', 'bar', 'cocktail', 'market', 'food', 'cuisine', 'cooking', 'chef', 'meal', 'eat', 'drink', 'beverage', 'wine', 'beer', 'spirit', 'liquor', 'tea', 'espresso', 'latte', 'pizza', 'burger', 'sandwich', 'deli', 'grocery', 'farmers market', 'food tour', 'culinary'],
    'stay': ['hotel', 'lodging', 'inn', 'bed and breakfast', 'bnb', 'cabin', 'camping', 'glamping', 'hostel', 'boutique stay', 'treehouse', 'unique stay', 'airbnb', 'lodge', 'accommodation', 'room', 'suite', 'retreat', 'getaway', 'entire house', 'house stay', 'house rental', 'vacation rental', 'rental', 'apartment', 'condo', 'cottage', 'villa', 'home', 'property', 'entire', 'house', 'vacation', 'short term rental', 'str', 'vrbo', 'booking', 'reservation'],
    'outdoor': ['hiking', 'hike', 'trail', 'park', 'beach', 'outdoor', 'nature', 'camping', 'climbing', 'water sports', 'skiing', 'snow', 'scenic', 'viewpoint', 'lookout', 'nature walk', 'biking', 'cycling', 'bike', 'kayaking', 'kayak', 'canoe', 'paddle', 'fishing', 'hunting', 'wildlife', 'forest', 'mountain', 'river', 'lake', 'national park', 'state park', 'garden', 'botanical'],
    'culture': ['museum', 'gallery', 'art', 'architecture', 'landmark', 'historical', 'history', 'heritage', 'festival', 'cultural', 'craft', 'music', 'theater', 'theatre', 'dance', 'performance', 'concert', 'show', 'exhibit', 'exhibition', 'monument', 'memorial', 'site', 'local craft', 'cultural site', 'tradition'],
    'experience': ['activity', 'activities', 'indoor activity', 'indoor', 'event', 'nightlife', 'club', 'amusement', 'arcade', 'live show', 'interactive', 'entertainment', 'fun', 'play', 'game', 'adventure', 'experience', 'tour', 'excursion'],
    'attractions': ['attraction', 'attractions', 'shopping', 'shop', 'retail', 'boutique', 'store', 'resort', 'resorts']
};

// Map individual types to categories (case-insensitive)
// Uses exact match first, then keyword matching, then default fallback
// Also checks for category override on listing
function getCategoryForType(type, listing) {
    // If listing has a category override, use it
    if (listing && listing.category) {
        return normalizeCategoryKey(listing.category) || listing.category;
    }
    
    if (!type) return null;
    const normalizedType = normalizeFilterValue(type).toLowerCase();
    
    // Step 1: Try exact match (case-insensitive) against category types arrays
    for (const categoryKey in TYPE_CATEGORIES) {
        const category = TYPE_CATEGORIES[categoryKey];
        if (category.types.some(function(catType) {
            return catType.toLowerCase() === normalizedType;
        })) {
            return categoryKey;
        }
    }
    
    // Step 2: Try keyword-based matching if exact match failed
    // Check if the type contains keywords that suggest a category
    for (const categoryKey in TYPE_KEYWORD_MAPPINGS) {
        const keywords = TYPE_KEYWORD_MAPPINGS[categoryKey];
        if (keywords.some(function(keyword) {
            return normalizedType.indexOf(keyword.toLowerCase()) > -1;
        })) {
            return categoryKey;
        }
    }
    
        // Step 3: Default fallback for unmapped types
        return 'experience'; // Default to Experience
}

// Diagnostic function: Check which types don't have categories assigned
function checkUnassignedTypes() {
    if (!data || !data.listings) {
        console.log('⚠️ No data available to check types');
        return;
    }
    
    // Get all unique types from listings
    const allTypes = [];
    const typeCounts = {};
    data.listings.forEach(function(listing) {
        if (listing.type) {
            if (typeCounts[listing.type]) {
                typeCounts[listing.type]++;
            } else {
                typeCounts[listing.type] = 1;
                allTypes.push(listing.type);
            }
        }
    });
    
    // Check each type to see if it has a category assigned
    const unassignedTypes = [];
    const categoryAssignments = {};
    
    allTypes.forEach(function(type) {
        // Create a mock listing to test category assignment
        const mockListing = { type: type };
        const category = getCategoryForType(type, mockListing);
        
        if (!category) {
            unassignedTypes.push(type);
        } else {
            if (!categoryAssignments[category]) {
                categoryAssignments[category] = [];
            }
            categoryAssignments[category].push({
                type: type,
                count: typeCounts[type]
            });
        }
    });
    
    // Log results
    console.log('📊 Type Category Assignment Report:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total unique types:', allTypes.length);
    console.log('');
    
    // Show types by category
    console.log('✅ Types with categories assigned:');
    for (const categoryKey in categoryAssignments) {
        const category = TYPE_CATEGORIES[categoryKey];
        const categoryName = toSentenceCase(categoryKey);
        console.log(`  ${categoryName} (${categoryKey}):`);
        categoryAssignments[categoryKey].forEach(function(item) {
            console.log(`    - ${item.type} (${item.count} listing${item.count !== 1 ? 's' : ''})`);
        });
    }
    console.log('');
    
    // Show unassigned types (should be none if everything is working)
    if (unassignedTypes.length > 0) {
        console.log('⚠️ Types without categories (falling back to default "experience"):');
        unassignedTypes.forEach(function(type) {
            console.log(`  - ${type} (${typeCounts[type]} listing${typeCounts[type] !== 1 ? 's' : ''})`);
        });
    } else {
        console.log('✅ All types have categories assigned!');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Also check types from filterOptions that might not be in listings yet
    if (data.filterOptions && data.filterOptions.types) {
        const filterTypes = data.filterOptions.types;
        const filterTypesNotInListings = filterTypes.filter(function(type) {
            return allTypes.indexOf(type) === -1;
        });
        
        if (filterTypesNotInListings.length > 0) {
            console.log('');
            console.log('ℹ️ Types in filterOptions but not in current listings:');
            filterTypesNotInListings.forEach(function(type) {
                const category = getCategoryForType(type, { type: type });
                const categoryName = category && TYPE_CATEGORIES[category] ? TYPE_CATEGORIES[category].name : (category || 'experience (default)');
                console.log(`  - ${type} → ${categoryName}`);
            });
        }
    }
}

function collectUsedFilterOptions(listings) {
    const types = [];
    const areas = [];
    const amenities = [];
    
    const typeSet = new Set();
    const areaSet = new Set();
    const amenitySet = new Set();
    
    (Array.isArray(listings) ? listings : []).forEach(function(listing) {
        if (listing && typeof listing === 'object') {
            const type = normalizeFilterValue(listing.type);
            if (type && !typeSet.has(type)) {
                typeSet.add(type);
                types.push(type);
            }
            
            const area = normalizeFilterValue(listing.area);
            if (area && !areaSet.has(area)) {
                areaSet.add(area);
                areas.push(area);
            }
            
            let listingAmenities = [];
            if (Array.isArray(listing.amenities)) {
                listingAmenities = listing.amenities;
            } else if (typeof listing.amenities === 'string') {
                listingAmenities = listing.amenities.split(/[,;]+/).map(function(value) { return value.trim(); });
            }
            
            listingAmenities.forEach(function(rawAmenity) {
                const amenity = normalizeFilterValue(rawAmenity);
                if (amenity && !amenitySet.has(amenity)) {
                    amenitySet.add(amenity);
                    amenities.push(amenity);
                }
            });
        }
    });
    
    return { types: types, areas: areas, amenities: amenities };
}

function mergeOptionsPreservingOrder(existing, required) {
    const existingArray = Array.isArray(existing) ? existing.map(normalizeFilterValue) : [];
    const requiredArray = Array.isArray(required) ? required.map(normalizeFilterValue).filter(function(value) { return value.length > 0; }) : [];
    const requiredSet = new Set(requiredArray);
    
    const keptExisting = existingArray.filter(function(value) { return value && requiredSet.has(value); });
    const missing = requiredArray.filter(function(value) { return keptExisting.indexOf(value) === -1; });
    
    return keptExisting.concat(missing);
}

function sanitizeFilterOptions(existingOptions, listings) {
    const usage = collectUsedFilterOptions(listings);
    const options = existingOptions || {};
    
    return {
        types: mergeOptionsPreservingOrder(options.types, usage.types),
        areas: mergeOptionsPreservingOrder(options.areas, usage.areas),
        amenities: mergeOptionsPreservingOrder(options.amenities, usage.amenities)
    };
}

function haveDifferentValues(previous, next) {
    const prevArray = Array.isArray(previous) ? previous : [];
    const nextArray = Array.isArray(next) ? next : [];
    
    if (prevArray.length !== nextArray.length) return true;
    for (let i = 0; i < prevArray.length; i++) {
        if (prevArray[i] !== nextArray[i]) {
            return true;
        }
    }
    return false;
}

function refreshFilterSelect(selectId, values) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const defaultOption = select.querySelector('option[value=""]');
    if (!select.dataset.placeholderText) {
        if (defaultOption) {
            select.dataset.placeholderText = defaultOption.textContent;
        } else if (select.getAttribute('data-placeholder')) {
            select.dataset.placeholderText = select.getAttribute('data-placeholder');
        } else {
            select.dataset.placeholderText = 'All';
        }
    }
    
    const placeholderText = select.dataset.placeholderText || 'All';
    const currentValue = select.value;
    const safeValues = Array.isArray(values) ? values : [];
    
    // Sort values alphabetically
    const sortedValues = safeValues.slice().sort(function(a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    
    select.innerHTML = '';
    
    const firstOption = document.createElement('option');
    firstOption.value = '';
    firstOption.textContent = placeholderText;
    select.appendChild(firstOption);
    
    sortedValues.forEach(function(value) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
    
    if (sortedValues.indexOf(currentValue) > -1) {
        select.value = currentValue;
    } else {
        select.value = '';
    }
}

function applyFilterOptionCleanup(existingOptions) {
    if (typeof data === 'undefined') return false;
    
    data.listings = (data.listings || []).map(function(listing) {
        return sanitizeListing(listing);
    });
    
    const sanitized = sanitizeFilterOptions(existingOptions || data.filterOptions, data.listings);
    const typesChanged = haveDifferentValues(data.filterOptions && data.filterOptions.types, sanitized.types);
    const areasChanged = haveDifferentValues(data.filterOptions && data.filterOptions.areas, sanitized.areas);
    const amenitiesChanged = haveDifferentValues(data.filterOptions && data.filterOptions.amenities, sanitized.amenities);
    
    const hasChanges = typesChanged || areasChanged || amenitiesChanged;
    
    data.filterOptions = sanitized;
    
    if (hasChanges) {
        saveFilterOptions();
    }
    
    updateTypeDropdown();
    updateAreaDropdown();
    renderAmenitiesCheckboxes();
    populateAdminFilters();
    populatePreviewFilters();
    
    if (hasChanges) {
        renderSettings();
    }
    
    return hasChanges;
}

initialData.filterOptions = sanitizeFilterOptions(initialData.filterOptions, initialData.listings);

const DEFAULT_TABLE_HEADERS = [
    'name',
    'slug',
    'type',
    'category',
    'area',
    'description',
    'detailedDescription',
    'customHtml',
    'image1',
    'image1Desc',
    'image2',
    'image2Desc',
    'image3',
    'image3Desc',
    'website',
    'phone',
    'address',
    'latitude',
    'longitude',
    'authorName',
    'publishedDate',
    'modifiedDate',
    'directionsLink',
    'amenities',
    'featured'
];

initialData.sheetHeaders = DEFAULT_TABLE_HEADERS.slice();

function normalizeHeaderKey(header) {
    return (header || '')
        .toString()
        .trim()
        .toLowerCase();
}

const TABLE_HEADER_KEY_MAP = [
    { key: 'name', matches: ['name', 'title', 'listing name'] },
    { key: 'slug', matches: ['slug'] },
    { key: 'type', matches: ['type'] },
    { key: 'category', matches: ['category'] },
    { key: 'area', matches: ['area'] },
    { key: 'description', matches: ['description', 'desc'] },
    { key: 'detailedDescription', matches: ['detailed description', 'detaileddescription', 'long description'] },
    { key: 'customHtml', matches: ['custom html', 'customhtml', 'framer html'] },
    { key: 'image1', matches: ['image1', 'image 1', 'photo', 'photo 1'] },
    { key: 'image1Desc', matches: ['image1 desc', 'image 1 desc', 'photo 1 desc', 'image1 description'] },
    { key: 'image2', matches: ['image2', 'image 2', 'photo 2'] },
    { key: 'image2Desc', matches: ['image2 desc', 'image 2 desc', 'photo 2 desc', 'image2 description'] },
    { key: 'image3', matches: ['image3', 'image 3', 'photo 3'] },
    { key: 'image3Desc', matches: ['image3 desc', 'image 3 desc', 'photo 3 desc', 'image3 description'] },
    { key: 'website', matches: ['website', 'external website', 'url'] },
    { key: 'phone', matches: ['phone', 'phone number'] },
    { key: 'address', matches: ['address', 'street address'] },
    { key: 'latitude', matches: ['latitude', 'lat'] },
    { key: 'longitude', matches: ['longitude', 'lng', 'lon'] },
    { key: 'authorName', matches: ['author', 'author name', 'contributor'] },
    { key: 'publishedDate', matches: ['published date', 'publish date', 'created date'] },
    { key: 'modifiedDate', matches: ['modified date', 'updated date', 'last updated'] },
    { key: 'directionsLink', matches: ['directions link', 'directions url', 'google maps url', 'maps url'] },
    { key: 'amenities', matches: ['amenities', 'amenity'] },
    { key: 'featured', matches: ['featured'] }
];

const TABLE_HEADER_LOOKUP = TABLE_HEADER_KEY_MAP.reduce((acc, item) => {
    item.matches.forEach(match => {
        acc[normalizeHeaderKey(match)] = item.key;
    });
    return acc;
}, {});

function sanitizeSheetHeaders(headers) {
    if (!Array.isArray(headers) || headers.length === 0) {
        return DEFAULT_TABLE_HEADERS.slice();
    }
    return headers
        .map(header => header === undefined || header === null ? '' : header.toString())
        .filter(header => header.trim() !== '');
}

function applySheetHeaders(headers) {
    const sanitized = sanitizeSheetHeaders(headers);
    if (typeof data !== 'undefined' && data) {
        data.sheetHeaders = sanitized;
    }
    updateTableHeaderLabelsFromSheet(sanitized);
}

function updateTableHeaderLabelsFromSheet(headersList) {
    if (!Array.isArray(headersList) || headersList.length === 0) return;
    
    headersList.forEach(header => {
        const normalized = normalizeHeaderKey(header);
        const columnKey = TABLE_HEADER_LOOKUP[normalized];
        if (!columnKey) return;
        
        document.querySelectorAll('th[data-column-key="' + columnKey + '"]').forEach(function(th) {
            const label = th.querySelector('.th-label');
            if (label) {
                label.textContent = header;
            } else {
                th.textContent = header;
            }
        });
    });
    if (typeof ensureDataTableHeaderResizeUI === 'function') {
        ensureDataTableHeaderResizeUI();
    }
    requestAnimationFrame(function() {
        requestAnimationFrame(syncDataTableStickyHeaderOffset);
    });
}

function getDefaultDataTableColumnWidth(columnKey) {
    const preset = DATA_TABLE_DEFAULT_COLUMN_WIDTHS[columnKey];
    if (Number.isFinite(preset)) {
        return Math.max(DATA_TABLE_COL_MIN_WIDTH, Math.min(DATA_TABLE_COL_MAX_WIDTH, preset));
    }
    return DATA_TABLE_FALLBACK_COLUMN_WIDTH;
}

function buildDataTableDefaultColumnWidths() {
    const widths = {};
    getDataTableHeaderCells().forEach(function(th, i) {
        const key = th.getAttribute('data-column-key') || ('col-' + i);
        widths[key] = getDefaultDataTableColumnWidth(key);
    });
    return widths;
}

function loadDataTableColumnWidths() {
    try {
        const raw = localStorage.getItem(TABLE_COLUMN_WIDTHS_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        const out = {};
        Object.keys(parsed).forEach(function(key) {
            const n = Number(parsed[key]);
            if (Number.isFinite(n) && n >= DATA_TABLE_COL_MIN_WIDTH) {
                out[key] = Math.min(DATA_TABLE_COL_MAX_WIDTH, Math.round(n));
            }
        });
        return out;
    } catch (e) {
        return {};
    }
}

function saveDataTableColumnWidths(widths) {
    _dataTableColumnWidths = widths && typeof widths === 'object' ? widths : {};
    try {
        localStorage.setItem(TABLE_COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(_dataTableColumnWidths));
    } catch (e) { /* ignore */ }
}

function getDataTableHeaderCells() {
    const table = document.getElementById('dataTable');
    if (!table) return [];
    const row = table.querySelector('thead tr:first-child');
    if (!row) return [];
    return Array.prototype.slice.call(row.children);
}

function ensureDataTableHeaderResizeUI() {
    getDataTableHeaderCells().forEach(function(th) {
        if (!(th instanceof HTMLElement)) return;
        let label = th.querySelector(':scope > .th-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'th-label';
            while (th.firstChild) {
                label.appendChild(th.firstChild);
            }
            th.appendChild(label);
        }
        let handle = th.querySelector(':scope > .col-resize-handle');
        if (!handle) {
            handle = document.createElement('span');
            handle.className = 'col-resize-handle';
            handle.setAttribute('aria-hidden', 'true');
            handle.title = 'Drag to resize column. Double-click to reset.';
            th.appendChild(handle);
        }
    });
}

function ensureDataTableColgroup() {
    const table = document.getElementById('dataTable');
    if (!table) return null;
    const headers = getDataTableHeaderCells();
    let colgroup = table.querySelector('colgroup[data-data-table-cols="1"]');
    if (!colgroup) {
        colgroup = document.createElement('colgroup');
        colgroup.setAttribute('data-data-table-cols', '1');
        table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < headers.length) {
        colgroup.appendChild(document.createElement('col'));
    }
    while (colgroup.children.length > headers.length) {
        colgroup.removeChild(colgroup.lastChild);
    }
    headers.forEach(function(th, i) {
        const col = colgroup.children[i];
        const key = th.getAttribute('data-column-key') || ('col-' + i);
        col.setAttribute('data-column-key', key);
    });
    return colgroup;
}

function applyDataTableColumnWidths(options) {
    options = options || {};
    const table = document.getElementById('dataTable');
    if (!table) return;
    ensureDataTableHeaderResizeUI();
    const colgroup = ensureDataTableColgroup();
    if (!colgroup) return;
    if (!_dataTableColumnWidths) {
        _dataTableColumnWidths = loadDataTableColumnWidths();
    }
    if (options.useDefaults || Object.keys(_dataTableColumnWidths).length === 0) {
        _dataTableColumnWidths = buildDataTableDefaultColumnWidths();
    }
    let total = 0;
    const headers = getDataTableHeaderCells();
    headers.forEach(function(th, i) {
        const key = th.getAttribute('data-column-key') || ('col-' + i);
        let width = _dataTableColumnWidths[key];
        if (!width || !Number.isFinite(width)) {
            width = getDefaultDataTableColumnWidth(key);
            _dataTableColumnWidths[key] = width;
        }
        width = Math.max(DATA_TABLE_COL_MIN_WIDTH, Math.min(DATA_TABLE_COL_MAX_WIDTH, Math.round(width)));
        _dataTableColumnWidths[key] = width;
        const col = colgroup.children[i];
        if (col) {
            col.style.width = width + 'px';
            col.style.minWidth = width + 'px';
        }
        total += width;
    });
    table.classList.add('data-table--resized');
    table.style.setProperty('--data-table-total-width', total + 'px');
    table.style.width = total + 'px';
    syncDataTableStickyHeaderOffset();
}

function setDataTableColumnWidth(columnKey, widthPx, persist) {
    if (!_dataTableColumnWidths) {
        _dataTableColumnWidths = loadDataTableColumnWidths();
    }
    const width = Math.max(DATA_TABLE_COL_MIN_WIDTH, Math.min(DATA_TABLE_COL_MAX_WIDTH, Math.round(widthPx)));
    _dataTableColumnWidths[columnKey] = width;
    const table = document.getElementById('dataTable');
    if (!table) return width;
    const col = table.querySelector('colgroup[data-data-table-cols="1"] col[data-column-key="' + columnKey + '"]');
    if (col) {
        col.style.width = width + 'px';
        col.style.minWidth = width + 'px';
    }
    let total = 0;
    table.querySelectorAll('colgroup[data-data-table-cols="1"] col').forEach(function(c) {
        total += parseFloat(c.style.width) || 0;
    });
    table.style.setProperty('--data-table-total-width', total + 'px');
    table.style.width = total + 'px';
    if (persist) saveDataTableColumnWidths(_dataTableColumnWidths);
    return width;
}

function resetDataTableColumnWidths() {
    _dataTableColumnWidths = {};
    try {
        localStorage.removeItem(TABLE_COLUMN_WIDTHS_STORAGE_KEY);
        localStorage.removeItem('nelsonCounty_tableColumnWidths');
    } catch (e) { /* ignore */ }
    const table = document.getElementById('dataTable');
    if (table) {
        table.classList.remove('data-table--resized');
        table.style.removeProperty('--data-table-total-width');
        table.style.width = '';
        const colgroup = table.querySelector('colgroup[data-data-table-cols="1"]');
        if (colgroup) colgroup.remove();
    }
    requestAnimationFrame(function() {
        applyDataTableColumnWidths({ useDefaults: true });
        saveDataTableColumnWidths(_dataTableColumnWidths);
    });
}

window.resetDataTableColumnWidths = resetDataTableColumnWidths;

function initDataTableColumnResize() {
    ensureDataTableHeaderResizeUI();
    _dataTableColumnWidths = loadDataTableColumnWidths();
    applyDataTableColumnWidths({
        useDefaults: Object.keys(_dataTableColumnWidths).length === 0
    });
    saveDataTableColumnWidths(_dataTableColumnWidths);

    document.addEventListener('mousedown', function(e) {
        const handle = e.target.closest('.col-resize-handle');
        if (!handle) return;
        const th = handle.closest('th[data-column-key]');
        if (!th) return;
        e.preventDefault();
        e.stopPropagation();
        const key = th.getAttribute('data-column-key');
        if (!key) return;
        if (!_dataTableColumnWidths) _dataTableColumnWidths = loadDataTableColumnWidths();
        const startWidth = _dataTableColumnWidths[key] || getDefaultDataTableColumnWidth(key);
        _dataTableColResizeState = {
            key: key,
            startX: e.clientX,
            startWidth: startWidth
        };
        document.body.classList.add('data-table-col-resizing');
    });

    document.addEventListener('mousemove', function(e) {
        if (!_dataTableColResizeState) return;
        const dx = e.clientX - _dataTableColResizeState.startX;
        setDataTableColumnWidth(_dataTableColResizeState.key, _dataTableColResizeState.startWidth + dx, false);
    });

    document.addEventListener('mouseup', function() {
        if (!_dataTableColResizeState) return;
        saveDataTableColumnWidths(_dataTableColumnWidths);
        _dataTableColResizeState = null;
        document.body.classList.remove('data-table-col-resizing');
        syncDataTableStickyHeaderOffset();
    });

    document.addEventListener('dblclick', function(e) {
        const handle = e.target.closest('.col-resize-handle');
        if (!handle) return;
        const th = handle.closest('th[data-column-key]');
        if (!th) return;
        e.preventDefault();
        e.stopPropagation();
        const key = th.getAttribute('data-column-key');
        if (!key) return;
        setDataTableColumnWidth(key, getDefaultDataTableColumnWidth(key), true);
        syncDataTableStickyHeaderOffset();
    });
}

// =================================
// GOOGLE SHEETS CONFIGURATION
// =================================
        // Step 1: Get your Google Sheet's published CSV URL (optional - used as fallback)
        // File → Share → Publish to web → CSV → Copy URL
        const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjIYDylHAm_j9b4rwGOjfPe0aoPRA1rcqsZ8NZg8ugT97pkM83n87NrDVhx7NU63-whpia-hRscywD/pub?gid=0&single=true&output=csv';

        // Openable Sheet link for Settings → View Google Sheet.
        // Prefer the Share/edit link (docs.google.com/spreadsheets/d/SHEET_ID/edit).
        // Falls back to the published HTML view; override anytime via localStorage key nelsonCounty_googleSheetUrl.
        const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjIYDylHAm_j9b4rwGOjfPe0aoPRA1rcqsZ8NZg8ugT97pkM83n87NrDVhx7NU63-whpia-hRscywD/pubhtml';
        
        // Step 2: Your Google Apps Script Web App URL (REQUIRED for read/write)
        // This URL is already configured and working!
        const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec';
        const LISTINGS_JSON_URL = 'data/listings.json';
        const GOOGLE_MAPS_API_KEY = 'AIzaSyDysf1CQM7-kZd_mhDcBIhp92o7Tb6SmAQ';
        const IMAGEKIT_PUBLIC_KEY = 'public_bEXbACd1Av+LMd7EASiu/x25f4o=';
        const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/OE';
        const IMAGEKIT_AUTH_ACTION = 'getImageKitUploadParams';
        
        // OpenAI API configuration for image description generation
        // Set your API key in the Google Apps Script or use environment variable
        const OPENAI_API_KEY = ''; // Leave empty to use server-side via Google Apps Script
        const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

        window.openGoogleSheet = function openGoogleSheet() {
            let url = '';
            try {
                url = (localStorage.getItem('nelsonCounty_googleSheetUrl') || '').trim();
            } catch (e) {}
            if (!url) url = (typeof GOOGLE_SHEET_URL === 'string' ? GOOGLE_SHEET_URL : '').trim();
            if (!url || /YOUR_SHEET/i.test(url)) {
                alert('Google Sheet link is not configured yet.');
                return;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        };
        
        // Initialize data with initialData (will be updated from Google Sheets on load)
        let data = JSON.parse(JSON.stringify(initialData));
        data.listings = (data.listings || []).map(function(listing) {
            return sanitizeListing(listing);
        });
        
        // Load saved filterOptions from localStorage if available
        const savedFilterOptions = localStorage.getItem('nelsonCounty_filterOptions');
        if (savedFilterOptions) {
            try {
                const parsedFilterOptions = JSON.parse(savedFilterOptions);
                data.filterOptions = sanitizeFilterOptions(parsedFilterOptions, data.listings);
            } catch (e) {
                console.error('Error loading saved filterOptions:', e);
                data.filterOptions = sanitizeFilterOptions(data.filterOptions, data.listings);
            }
        } else {
            data.filterOptions = sanitizeFilterOptions(data.filterOptions, data.listings);
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            updateUnsavedChangesBadge();
            updateTabsStickyStackStuck();
            window.addEventListener('scroll', updateTabsStickyStackStuck, { passive: true });
            window.addEventListener('resize', updateTabsStickyStackStuck);
            // Initialize Quill editor for detailedDescription
            initializeQuillEditor();
            // Note: Accordion Quill editors initialize when modal opens (they're inside the modal)
        });

        function registerQuillBreakAndShiftEnterOnce() {
            try {
                if (window.__quillShiftEnterBreakReady) return;
                if (typeof Quill === 'undefined') return;
                const Embed = Quill.import('blots/embed');
                class BreakBlot extends Embed {}
                BreakBlot.blotName = 'break';
                BreakBlot.tagName = 'BR';
                Quill.register(BreakBlot, true);
                window.__quillShiftEnterBreakReady = true;
            } catch (e) {
                // If registration fails, we just won't override Shift+Enter
                console.warn('Could not register Quill break blot:', e);
            }
        }

        function enableShiftEnterBr(quillInstance) {
            if (!quillInstance || !quillInstance.keyboard) return;
            registerQuillBreakAndShiftEnterOnce();
            if (!window.__quillShiftEnterBreakReady) return;
            quillInstance.keyboard.addBinding({ key: 13, shiftKey: true }, function(range) {
                this.quill.insertEmbed(range.index, 'break', true, Quill.sources.USER);
                this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
                return false;
            });
        }
        
        // Shared Quill config for listing modal editors (bounds keeps link/tooltip UI in view)
        function getListingQuillBounds() {
            return document.querySelector('#listingModal .listing-editor__scroll')
                || document.getElementById('listingModal')
                || document.body;
        }
        function getListingQuillOptions() {
            return {
                theme: 'snow',
                bounds: getListingQuillBounds(),
                modules: {
                    toolbar: [
                        [{ 'header': [3, 4, 6, false] }],
                        ['bold', 'italic'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['blockquote'],
                        ['link'],
                        ['clean']
                    ]
                },
                formats: ['header', 'bold', 'italic', 'list', 'blockquote', 'link']
            };
        }

        // Initialize Quill editor for detailedDescription (same pattern as accordion: init ONCE, reuse)
        function initializeQuillEditor() {
            const editorContainer = document.getElementById('listingDetailedDescriptionEditor');
            if (!editorContainer) {
                console.warn('Quill editor container not found');
                return;
            }
            // Reuse existing instance — do not create a second one (prevents duplication when opening cards)
            if (quillDetailedDescription) return;
            if (editorContainer.__quill) {
                quillDetailedDescription = editorContainer.__quill;
                return;
            }
            // Safety: if toolbars/editor exist but instance was lost, wipe once to prevent stacking
            if (editorContainer.querySelector('.ql-toolbar') || editorContainer.querySelector('.ql-editor')) {
                editorContainer.innerHTML = '';
                editorContainer.__quill = null;
            }
            
            // Configure Quill with allowed formats
            quillDetailedDescription = new Quill('#listingDetailedDescriptionEditor', getListingQuillOptions());
            enableShiftEnterBr(quillDetailedDescription);
            
            // Sync Quill content to hidden textarea on change
            quillDetailedDescription.on('text-change', function() {
                const html = quillDetailedDescription.root.innerHTML;
                const textarea = document.getElementById('listingDetailedDescription');
                if (textarea) {
                    textarea.value = html;
                }
            });
        }
        
        // Initialize Quill editor for accordion panel 1
        function initializeAccordionPanel1Editor() {
            const editorContainer = document.getElementById('listingAccordionPanel1ContentEditor');
            if (!editorContainer) {
                console.warn('⚠️ Accordion Panel 1 editor container not found');
                return;
            }
            // Match detailedDescription behavior: initialize ONCE, then reuse.
            if (quillAccordionPanel1) return;
            if (editorContainer.__quill) {
                quillAccordionPanel1 = editorContainer.__quill;
                return;
            }
            // Safety: if toolbars exist but instance was lost, wipe once to prevent stacking.
            if (editorContainer.querySelector('.ql-toolbar') || editorContainer.querySelector('.ql-editor')) {
                editorContainer.innerHTML = '';
                editorContainer.__quill = null;
            }
            console.log('🔧 Initializing Quill for Accordion Panel 1');
            try {
                quillAccordionPanel1 = new Quill('#listingAccordionPanel1ContentEditor', getListingQuillOptions());
                enableShiftEnterBr(quillAccordionPanel1);
                console.log('✅ Accordion Panel 1: Quill initialized successfully');
                quillAccordionPanel1.on('text-change', function() {
                    const html = quillAccordionPanel1.root.innerHTML;
                    const textarea = document.getElementById('listingAccordionPanel1Content');
                    if (textarea) {
                        textarea.value = html;
                    }
                });
            } catch(error) {
                console.error('❌ Error initializing Accordion Panel 1 Quill:', error);
            }
        }
        
        // Initialize Quill editor for accordion panel 2
        function initializeAccordionPanel2Editor() {
            const editorContainer = document.getElementById('listingAccordionPanel2ContentEditor');
            if (!editorContainer) {
                console.warn('⚠️ Accordion Panel 2 editor container not found');
                return;
            }
            // Match detailedDescription behavior: initialize ONCE, then reuse.
            if (quillAccordionPanel2) return;
            if (editorContainer.__quill) {
                quillAccordionPanel2 = editorContainer.__quill;
                return;
            }
            // Safety: if toolbars exist but instance was lost, wipe once to prevent stacking.
            if (editorContainer.querySelector('.ql-toolbar') || editorContainer.querySelector('.ql-editor')) {
                editorContainer.innerHTML = '';
                editorContainer.__quill = null;
            }
            console.log('🔧 Initializing Quill for Accordion Panel 2');
            try {
                quillAccordionPanel2 = new Quill('#listingAccordionPanel2ContentEditor', getListingQuillOptions());
                enableShiftEnterBr(quillAccordionPanel2);
                console.log('✅ Accordion Panel 2: Quill initialized successfully');
                quillAccordionPanel2.on('text-change', function() {
                    const html = quillAccordionPanel2.root.innerHTML;
                    const textarea = document.getElementById('listingAccordionPanel2Content');
                    if (textarea) {
                        textarea.value = html;
                    }
                });
            } catch(error) {
                console.error('❌ Error initializing Accordion Panel 2 Quill:', error);
            }
        }
        
        // Initialize Quill editor for accordion panel 3
        function initializeAccordionPanel3Editor() {
            const editorContainer = document.getElementById('listingAccordionPanel3ContentEditor');
            if (!editorContainer) {
                console.warn('⚠️ Accordion Panel 3 editor container not found');
                return;
            }
            // Match detailedDescription behavior: initialize ONCE, then reuse.
            if (quillAccordionPanel3) return;
            if (editorContainer.__quill) {
                quillAccordionPanel3 = editorContainer.__quill;
                return;
            }
            // Safety: if toolbars exist but instance was lost, wipe once to prevent stacking.
            if (editorContainer.querySelector('.ql-toolbar') || editorContainer.querySelector('.ql-editor')) {
                editorContainer.innerHTML = '';
                editorContainer.__quill = null;
            }
            console.log('🔧 Initializing Quill for Accordion Panel 3');
            try {
                quillAccordionPanel3 = new Quill('#listingAccordionPanel3ContentEditor', getListingQuillOptions());
                enableShiftEnterBr(quillAccordionPanel3);
                console.log('✅ Accordion Panel 3: Quill initialized successfully');
                quillAccordionPanel3.on('text-change', function() {
                    const html = quillAccordionPanel3.root.innerHTML;
                    const textarea = document.getElementById('listingAccordionPanel3Content');
                    if (textarea) {
                        textarea.value = html;
                    }
                });
            } catch(error) {
                console.error('❌ Error initializing Accordion Panel 3 Quill:', error);
            }
        }
        
        // Initialize Quill editor for accordion panel 4
        function initializeAccordionPanel4Editor() {
            const editorContainer = document.getElementById('listingAccordionPanel4ContentEditor');
            if (!editorContainer) {
                console.warn('⚠️ Accordion Panel 4 editor container not found');
                return;
            }
            // Match detailedDescription behavior: initialize ONCE, then reuse.
            if (quillAccordionPanel4) return;
            if (editorContainer.__quill) {
                quillAccordionPanel4 = editorContainer.__quill;
                return;
            }
            // Safety: if toolbars exist but instance was lost, wipe once to prevent stacking.
            if (editorContainer.querySelector('.ql-toolbar') || editorContainer.querySelector('.ql-editor')) {
                editorContainer.innerHTML = '';
                editorContainer.__quill = null;
            }
            console.log('🔧 Initializing Quill for Accordion Panel 4');
            try {
                quillAccordionPanel4 = new Quill('#listingAccordionPanel4ContentEditor', getListingQuillOptions());
                enableShiftEnterBr(quillAccordionPanel4);
                console.log('✅ Accordion Panel 4: Quill initialized successfully');
                quillAccordionPanel4.on('text-change', function() {
                    const html = quillAccordionPanel4.root.innerHTML;
                    const textarea = document.getElementById('listingAccordionPanel4Content');
                    if (textarea) {
                        textarea.value = html;
                    }
                });
            } catch(error) {
                console.error('❌ Error initializing Accordion Panel 4 Quill:', error);
            }
        }
        
        document.addEventListener('input', function(event) {
            const target = event.target;
            if (!target) return;
            if (target.closest('#listingForm')) {
                showUnsavedChangesBadge();
            } else if (target.closest('#dataTableBody') && target.matches('[data-field]')) {
                if (target.matches('textarea[data-field="amenities"]')) {
                    syncTableAmenitiesPillsPreview(target);
                } else if (target.matches('input[data-field="image1"], input[data-field="image2"], input[data-field="image3"]')) {
                    syncTableImagePreview(target);
                }
                const tableRow = target.closest('tr[data-index]');
                if (tableRow) captureTableRowDraft(tableRow);
                markTableEditsPending();
            }
        });
        
        document.addEventListener('change', function(event) {
            const target = event.target;
            if (!target) return;
            if (target.closest('#listingForm')) {
                showUnsavedChangesBadge();
            } else if (target.closest('#dataTableBody') && target.matches('[data-field]')) {
                const tableRow = target.closest('tr[data-index]');
                if (tableRow) captureTableRowDraft(tableRow);
                markTableEditsPending();
            }
        });
        
        updateTableHeaderLabelsFromSheet(data.sheetHeaders || DEFAULT_TABLE_HEADERS);
        
        let deleteConfirmId = null;
        let deleteConfirmTimeout = null;
        const deletingSlugs = Object.create(null);
        const DELETE_CONFIRM_MS = 15000;
        const DELETE_BTN_HTML =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 16H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>' +
            '</svg>Delete';

        function setCardDeleteButtonState(btn, isPending) {
            if (isPending) {
                btn.textContent = 'Confirm Delete?';
                btn.style.background = '#dc2626';
                btn.style.color = '#ffffff';
            } else {
                btn.innerHTML = DELETE_BTN_HTML;
                btn.style.background = '#FDECF0';
                btn.style.color = '';
            }
        }

        function updateDeleteConfirmButtons() {
            const pendingSlug = deleteConfirmId;
            document.querySelectorAll('#listingsGrid .flip-card[data-slug]').forEach(function(card) {
                const slug = card.getAttribute('data-slug');
                const isPending = !!(pendingSlug && slug === pendingSlug);
                card.querySelectorAll('.btn-delete').forEach(function(btn) {
                    setCardDeleteButtonState(btn, isPending);
                });
            });
            document.querySelectorAll('#dataTableBody tr[data-index]').forEach(function(row) {
                const idx = parseInt(row.getAttribute('data-index'), 10);
                const listing = data.listings[idx];
                if (!listing) return;
                const btn = row.querySelector('.btn-table-delete');
                if (!btn) return;
                const isPending = pendingSlug === listing.slug;
                btn.textContent = isPending ? 'Confirm?' : 'Delete';
                btn.classList.toggle('btn-table-delete--confirm', isPending);
                btn.style.background = '';
                btn.style.color = '';
            });
        }

        function beginDeleteConfirm(slug) {
            deleteConfirmId = slug;
            if (deleteConfirmTimeout) clearTimeout(deleteConfirmTimeout);
            updateDeleteConfirmButtons();
            deleteConfirmTimeout = setTimeout(function() {
                deleteConfirmId = null;
                updateDeleteConfirmButtons();
            }, DELETE_CONFIRM_MS);
        }

        function clearDeleteConfirm() {
            deleteConfirmId = null;
            if (deleteConfirmTimeout) clearTimeout(deleteConfirmTimeout);
            deleteConfirmTimeout = null;
        }

        function refreshListingsAfterDelete() {
            try {
                applyFilterOptionCleanup();
            } catch (err) {
                console.warn('applyFilterOptionCleanup after delete:', err);
            }
            try {
                filterListings();
            } catch (err) {
                console.error('filterListings after delete failed; forcing full grid refresh:', err);
                renderListings(data.listings);
            }
            try {
                if (typeof renderDataTable === 'function') renderDataTable();
            } catch (err) {
                console.warn('renderDataTable after delete:', err);
            }
        }

        function removeListingFromLocalData(slug) {
            const target = String(slug || '').trim();
            const beforeCount = data.listings.length;
            data.listings = data.listings.filter(function(l) {
                return String(l.slug).trim() !== target;
            });
            return beforeCount - data.listings.length;
        }

        function restoreListingToLocalData(listing, index) {
            if (!listing) return;
            const target = String(listing.slug || '').trim();
            if (data.listings.some(function(l) { return String(l.slug).trim() === target; })) {
                return;
            }
            const insertAt = Math.max(0, Math.min(
                typeof index === 'number' && !isNaN(index) ? index : data.listings.length,
                data.listings.length
            ));
            data.listings.splice(insertAt, 0, listing);
        }

        function isSheetsDeleteAlreadyGoneError(message) {
            const m = String(message || '').toLowerCase();
            return (
                m.indexOf('not found') !== -1 ||
                m.indexOf("wasn't found") !== -1 ||
                m.indexOf('was not found') !== -1 ||
                m.indexOf('does not exist') !== -1 ||
                m.indexOf('no matching') !== -1 ||
                m.indexOf('already deleted') !== -1
            );
        }
        /** Table View: cell edits in the DOM not yet applied with Update Table */
        let tableEditsPending = false;
        let committingTableEdits = false;
        let unsavedChanges = false;
        let quillDetailedDescription = null;
        let quillAccordionPanel1 = null;
        let quillAccordionPanel2 = null;
        let quillAccordionPanel3 = null;
        let quillAccordionPanel4 = null;
        let listingFormOriginalData = null; // Store original form data to detect changes
        
function showUnsavedChangesBadge() {
    unsavedChanges = true;
    updateUnsavedChangesBadge();
}

function resetUnsavedChanges() {
    unsavedChanges = false;
    updateUnsavedChangesBadge();
}

function markTableEditsPending() {
    if (committingTableEdits) return;
    tableEditsPending = true;
    updateUnsavedChangesBadge();
}

function clearTableEditsPending() {
    tableEditsPending = false;
    updateUnsavedChangesBadge();
}

var SHEETS_BANNER_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
var TABLE_COMMIT_BANNER_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>';
var TABLE_COMMITTED_BANNER_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
var tableCommittedFlashUntil = 0;

function flashTableCommittedBanner() {
    tableCommittedFlashUntil = Date.now() + 1400;
    updateUnsavedChangesBadge();
    setTimeout(function() {
        if (Date.now() >= tableCommittedFlashUntil) {
            updateUnsavedChangesBadge();
        }
    }, 1500);
}

function updateUnsavedChangesBadge() {
    const badge = document.getElementById('unsavedChangesBadge');
    if (!badge) return;
    badge.classList.remove('unsaved-changes-badge--table-pending');
    badge.onclick = null;
    badge.onkeydown = null;

    const now = Date.now();
    if (tableCommittedFlashUntil && now < tableCommittedFlashUntil) {
        badge.classList.add('visible');
        badge.setAttribute('aria-label', 'Table updated. You can now save to Google Sheets.');
        badge.innerHTML = TABLE_COMMITTED_BANNER_SVG + '<span>Table updated ✓ Now save to Google Sheets</span>';
        badge.onclick = function() { saveAllToSheets(); };
        badge.onkeydown = function(ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); saveAllToSheets(); }
        };
        if (typeof updateTabsStickyStackStuck === 'function') updateTabsStickyStackStuck();
        return;
    }

    if (tableEditsPending) {
        badge.classList.add('visible', 'unsaved-changes-badge--table-pending');
        badge.setAttribute('aria-label', 'Table edits not committed. Click to run Update Table, or use the Update Table button in Table View.');
        badge.innerHTML = TABLE_COMMIT_BANNER_SVG +
            '<span>Table edits not committed: update table</span>';
        badge.onclick = function() {
            saveTableChanges({ silent: true, fromBanner: true });
        };
        badge.onkeydown = function(ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                saveTableChanges({ silent: true, fromBanner: true });
            }
        };
    } else if (unsavedChanges) {
        badge.classList.add('visible');
        badge.setAttribute('aria-label', 'Unsaved changes. Click to save all listings to Google Sheets.');
        badge.innerHTML = SHEETS_BANNER_SVG + '<span>Unsaved changes — Save to Google Sheets now</span>';
        badge.onclick = function() {
            saveAllToSheets();
        };
        badge.onkeydown = function(ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                saveAllToSheets();
            }
        };
    } else {
        badge.classList.remove('visible');
        badge.innerHTML = '';
        badge.removeAttribute('aria-label');
    }
    if (typeof updateTabsStickyStackStuck === 'function') {
        updateTabsStickyStackStuck();
    }
}

function updateTabsStickyStackStuck() {
    var stack = document.querySelector('.tabs-sticky-stack');
    if (!stack) return;
    var badge = document.getElementById('unsavedChangesBadge');
    var stickyTop = (badge && badge.classList.contains('visible')) ? 30 : 0;
    var rect = stack.getBoundingClientRect();
    var stuck = rect.top <= stickyTop + 0.75;
    stack.classList.toggle('is-stuck', stuck);
}

        // Helper function to parse CSV/TSV text into array of objects
        // Robust parser that handles: CSV, TSV, BOM, multiline fields, various edge cases
        function parseCSV(csvText) {
            if (!csvText) return { headers: [], dataRows: [], errors: [], warnings: [] };
            
            const errors = [];
            const warnings = [];
            
            // Remove BOM if present (UTF-8 BOM: \uFEFF)
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.slice(1);
                warnings.push('Removed BOM character from file');
            }
            
            // Auto-detect delimiter: TSV (tab) vs CSV (comma)
            // Check first line for tabs vs commas
            const firstLineEnd = csvText.indexOf('\n');
            const firstLine = firstLineEnd > 0 ? csvText.substring(0, firstLineEnd) : csvText;
            const tabCount = (firstLine.match(/\t/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;
            const delimiter = tabCount > commaCount ? '\t' : ',';
            const formatName = delimiter === '\t' ? 'TSV' : 'CSV';
            
            console.log(`📊 Detected format: ${formatName} (${delimiter === '\t' ? 'tabs' : 'commas'}: ${delimiter === '\t' ? tabCount : commaCount})`);
            
            // Split into rows, handling quoted fields that may contain newlines
            const rows = [];
            let currentRow = '';
            let inQuotes = false;
            
            for (let i = 0; i < csvText.length; i++) {
                const char = csvText[i];
                const nextChar = csvText[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Escaped quote (doubled)
                        currentRow += '"';
                        i++;
                    } else {
                        // Toggle quote state
                        inQuotes = !inQuotes;
                        currentRow += char;
                    }
                } else if ((char === '\n' || char === '\r') && !inQuotes) {
                    // End of row (only if not inside quotes)
                    if (char === '\r' && nextChar === '\n') i++; // Skip \n after \r
                    if (currentRow.length > 0) rows.push(currentRow);
                    currentRow = '';
                } else {
                    currentRow += char;
                }
            }
            // Don't forget the last row
            if (currentRow.length > 0) rows.push(currentRow);
            
            const filteredRows = rows.filter(row => row.trim().length > 0);
            if (filteredRows.length === 0) {
                errors.push('File appears to be empty or contains no valid rows');
                return { headers: [], dataRows: [], errors, warnings };
            }
            
            // Parse a single line into values
            const parseLine = (line, lineNum) => {
                const values = [];
                let current = '';
                let inQuotes = false;
                let quoteBalance = 0;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];
                    
                    if (char === '"') {
                        if (inQuotes && nextChar === '"') {
                            // Escaped quote
                            current += '"';
                            i++;
                        } else {
                            // Toggle quote state
                            inQuotes = !inQuotes;
                            quoteBalance += inQuotes ? 1 : -1;
                        }
                    } else if (char === delimiter && !inQuotes) {
                        // Field separator
                        values.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current);
                
                // Check for unbalanced quotes (common error)
                if (quoteBalance !== 0) {
                    warnings.push(`Row ${lineNum}: Unbalanced quotes detected - attempting to recover`);
                }
                
                // Clean up values: trim and handle quotes
                return values.map(value => {
                    value = value.trim();
                    // Remove surrounding quotes if present
                    if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
                        value = value.slice(1, -1);
                    }
                    // Replace escaped quotes (doubled quotes become single)
                    value = value.replace(/""/g, '"');
                    return value;
                });
            };
            
            // Parse header row
            let headers = parseLine(filteredRows[0], 1).filter(h => h && h.trim());
            
            // Clean header names (remove any leftover BOM artifacts, normalize whitespace)
            headers = headers.map(h => h.trim().replace(/^\uFEFF/, ''));
            
            if (headers.length === 0) {
                errors.push('No valid headers found in the first row');
                return { headers: [], dataRows: [], errors, warnings };
            }
            
            console.log(`📊 Found ${headers.length} columns: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`);
            
            const dataRows = [];
            let skippedRows = 0;
            let fixedRows = 0;
            
            for (let i = 1; i < filteredRows.length; i++) {
                const lineNum = i + 1;
                let values = parseLine(filteredRows[i], lineNum);
                
                // Skip completely empty rows
                if (!values.some(v => v && v.trim())) {
                    skippedRows++;
                    continue;
                }
                
                // Handle column count mismatch - try to fix instead of failing
                if (values.length !== headers.length) {
                    const rowName = values[1] || values[0] || 'Unknown';
                    const diff = values.length - headers.length;
                    
                    if (values.length < headers.length) {
                        // Pad with empty strings
                        warnings.push(`Row ${lineNum} (${rowName}): Has ${headers.length - values.length} fewer columns than expected - padding with empty values`);
                        while (values.length < headers.length) {
                            values.push('');
                        }
                        fixedRows++;
                    } else {
                        // Truncate extra columns (but log what we're losing)
                        const extra = values.slice(headers.length);
                        const hasData = extra.some(v => v && v.trim());
                        if (hasData) {
                            warnings.push(`Row ${lineNum} (${rowName}): Has ${values.length - headers.length} extra columns - truncating (lost: ${extra.slice(0, 3).join(', ')}${extra.length > 3 ? '...' : ''})`);
                        }
                        values = values.slice(0, headers.length);
                        fixedRows++;
                    }
                }
                
                // Build row object
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = (values[index] !== undefined) ? values[index] : '';
                });
                dataRows.push(row);
            }
            
            // Summary logging
            console.log(`📊 Parse complete: ${dataRows.length} rows parsed successfully`);
            if (fixedRows > 0) {
                console.warn(`⚠️ Fixed column counts in ${fixedRows} rows`);
            }
            if (skippedRows > 0) {
                console.log(`📊 Skipped ${skippedRows} empty rows`);
            }
            if (warnings.length > 0) {
                console.warn(`⚠️ ${warnings.length} warnings during parsing:`, warnings.slice(0, 5));
            }
            if (errors.length > 0) {
                console.error(`❌ ${errors.length} errors during parsing:`, errors);
            }
            
            return { headers, dataRows, errors, warnings };
        }
        
        // Map CSV row to listing object
        function slugify(value) {
            return (value || '')
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        // Slug uniqueness: no two listings may share the same slug (case-insensitive).
        function normalizeSlugKey(value) {
            return String(value || '').trim().toLowerCase();
        }

        function findListingIndexBySlug(slug) {
            const target = normalizeSlugKey(slug);
            if (!target || !data || !Array.isArray(data.listings)) return -1;
            return data.listings.findIndex(function(l) {
                return normalizeSlugKey(l && l.slug) === target;
            });
        }

        function isSlugTaken(slug, options) {
            options = options || {};
            const target = normalizeSlugKey(slug);
            if (!target || !data || !Array.isArray(data.listings)) return false;
            const excludeIndex = options.excludeIndex;
            let skippedExcludeSlug = false;
            const excludeSlug = options.excludeSlug != null ? normalizeSlugKey(options.excludeSlug) : null;
            return data.listings.some(function(listing, index) {
                if (excludeIndex != null && index === excludeIndex) return false;
                const current = normalizeSlugKey(listing && listing.slug);
                if (!current || current !== target) return false;
                // When excluding by prior slug, skip only the first match (the row being edited).
                if (excludeSlug && current === excludeSlug && !skippedExcludeSlug) {
                    skippedExcludeSlug = true;
                    return false;
                }
                return true;
            });
        }

        function ensureUniqueSlug(baseSlug, options) {
            options = options || {};
            let root = slugify(baseSlug) || 'listing';
            if (!isSlugTaken(root, options)) return root;
            let n = 2;
            let candidate = root + '-' + n;
            while (isSlugTaken(candidate, options)) {
                n += 1;
                candidate = root + '-' + n;
            }
            return candidate;
        }

        function findDuplicateSlugs(listings) {
            const rows = Array.isArray(listings) ? listings : (data && data.listings) || [];
            const bySlug = {};
            rows.forEach(function(listing, index) {
                const key = normalizeSlugKey(listing && listing.slug);
                if (!key) return;
                if (!bySlug[key]) bySlug[key] = [];
                bySlug[key].push({
                    index: index,
                    slug: String(listing.slug || '').trim(),
                    name: String(listing.name || '').trim() || '(unnamed)'
                });
            });
            return Object.keys(bySlug).filter(function(key) {
                return bySlug[key].length > 1;
            }).map(function(key) {
                return { slug: key, listings: bySlug[key] };
            });
        }

        function formatDuplicateSlugMessage(duplicates) {
            if (!duplicates || !duplicates.length) return '';
            return duplicates.slice(0, 8).map(function(dup) {
                const names = dup.listings.map(function(item) {
                    return item.name;
                }).join(', ');
                return '• "' + dup.slug + '" → ' + names;
            }).join('\n') + (duplicates.length > 8 ? '\n• …and ' + (duplicates.length - 8) + ' more' : '');
        }

        window.isSlugTaken = isSlugTaken;
        window.ensureUniqueSlug = ensureUniqueSlug;
        window.findDuplicateSlugs = findDuplicateSlugs;
        
        function mapCSVRowToListing(row) {
            const normalizedRow = {};
            if (row && typeof row === 'object') {
                Object.keys(row).forEach(function(key) {
                    if (key === undefined || key === null) return;
                    const normalizedKey = String(key).trim().toLowerCase();
                    if (normalizedKey) {
                        normalizedRow[normalizedKey] = row[key];
                    }
                });
            }
            
            const getField = (fieldName, altNames = [], preserveEmpty = false) => {
                const names = [fieldName, ...altNames];
                for (const name of names) {
                    const normalizedName = String(name).trim().toLowerCase();
                    if (!normalizedName) continue;
                    if (Object.prototype.hasOwnProperty.call(normalizedRow, normalizedName)) {
                        const value = normalizedRow[normalizedName];
                        if (value !== undefined && value !== null) {
                            const trimmed = String(value).trim();
                            // For date fields, return undefined if empty (to preserve existing dates)
                            if (preserveEmpty && trimmed === '') {
                                return undefined;
                            }
                            return trimmed;
                        }
                    }
                }
                return preserveEmpty ? undefined : '';
            };
            
            const parseList = (value) => {
                if (!value) return [];
                return value.split(/[,;]/).map(a => a.trim()).filter(Boolean);
            };
            
            const featuredStr = getField('Featured', ['featured']);
            const privateStr = getField('Private', ['private']);
            const isEventStr = getField('isEvent', ['Is Event', 'is event', 'Event Mode', 'event mode']);
            const eventAllDayStr = getField('eventAllDay', ['Event All Day', 'event all day', 'All Day', 'allDay']);
            const detailedDescriptionValue = getField('Detailed Description', [
                'detailedDescription',
                'detaileddescription',
                'detailed description',
                'DetailedDescription',
                'long description',
                'longdescription',
                'full description',
                'fulldescription',
                'detail description',
                'detaildescription',
                'extended description',
                'extendeddescription'
            ]);
            const customHtmlValue = getField('Custom HTML', [
                'custom html',
                'customhtml',
                'custom content',
                'customcontent',
                'custom_html',
                'framer html',
                'framer content'
            ]);
            const image3Value = getField('Image3', ['image3', 'Image 3', 'Photo 3', 'photo3', 'Photo3', 'Third Photo', 'Tertiary Photo']);
            const galleryValue = getField('imageGallery', ['ImageGallery', 'Image Gallery', 'gallery', 'Gallery']);
            
            const googleMapsUrlField = getField('Google Maps URL', ['Google Map URL', 'Google Maps Link', 'Maps URL', 'Map URL', 'Google Maps', 'googleMapsUrl', 'google_maps_url', 'map url', 'maps link']);
            const directionsLinkField = getField('directionsLink', ['Directions Link', 'Directions URL', 'Map Link', 'map directions', 'directions url']);
            const videoLinkField = getField('Video Link', ['videoLink', 'Video URL', 'video url', 'youtube', 'YouTube', 'youtube url', 'YouTube URL', 'youtube link', 'video']);
            
            // Handle category EXACTLY like type - simple and direct
            // Type: getField('Type', ['type']) - no normalization, no transformation
            // Category: getField('Category', ['category']) - same approach
            const categoryValue = getField('Category', ['category']);
            
            const listing = {
                name: getField('Title', ['Name', 'name', 'title']) || getField('name'),
                type: getField('Type', ['type']), // Simple, direct - no normalization
                category: categoryValue, // Simple, direct - same as type (no normalization)
                area: getField('Area', ['area']),
                description: getField('Description', ['description', 'Desc', 'desc']),
                detailedDescription: detailedDescriptionValue,
                customHtml: customHtmlValue,
                image1: getField('Photo', ['photo', 'Image', 'image', 'Image1', 'image1', 'Image 1']),
                image2: getField('Image2', ['image2', 'Image 2', 'Photo 2', 'photo2', 'Photo2', 'Second Photo', 'Secondary Photo']),
                image3: image3Value || galleryValue,
                image1Desc: getField('Image1 Desc', ['image1Desc', 'Image1 Description', 'image1 description', 'Image 1 Description', 'Photo 1 Description']),
                image2Desc: getField('Image2 Desc', ['image2Desc', 'Image2 Description', 'image2 description', 'Image 2 Description', 'Photo 2 Description']),
                image3Desc: getField('Image3 Desc', ['image3Desc', 'Image3 Description', 'image3 description', 'Image 3 Description', 'Photo 3 Description']),
                website: getField('External Website', ['Website', 'website', 'URL', 'url', 'website url', 'site url', 'business website', 'website link']),
                phone: getField('Phone', ['phone', 'phone number', 'business phone', 'contact phone', 'primary phone']),
                address: getField('Address', ['address', 'street address', 'business address', 'physical address', 'location']),
                latitude: parseFloat(getField('Latitude', ['latitude', 'lat'])) || null,
                longitude: parseFloat(getField('Longitude', ['longitude', 'lng', 'lon'])) || null,
                amenities: parseList(getField('Amenities', ['amenities', 'Amenity'])),
                featured: featuredStr === 'TRUE' || featuredStr === 'true' || featuredStr === '1' || featuredStr === 'Yes' || featuredStr === 'yes',
                private: privateStr === 'TRUE' || privateStr === 'true' || privateStr === '1' || privateStr === 'Yes' || privateStr === 'yes',
                isEvent: parseListingBool(isEventStr),
                eventStartDate: (function() {
                    const date = getField('eventStartDate', ['Event Start Date', 'event start date', 'Start Date', 'startDate'], true);
                    return date ? normalizeDate(date) : date;
                })(),
                eventEndDate: (function() {
                    const date = getField('eventEndDate', ['Event End Date', 'event end date', 'End Date', 'endDate'], true);
                    return date ? normalizeDate(date) : date;
                })(),
                eventStartTime: getField('eventStartTime', ['Event Start Time', 'event start time', 'Start Time', 'startTime']),
                eventEndTime: getField('eventEndTime', ['Event End Time', 'event end time', 'End Time', 'endTime']),
                eventAllDay: parseListingBool(eventAllDayStr),
                eventTicketUrl: getField('eventTicketUrl', ['Event Ticket URL', 'event ticket url', 'Ticket URL', 'ticketUrl', 'RSVP URL', 'rsvpUrl']),
                eventCost: getField('eventCost', ['Event Cost', 'event cost', 'Cost', 'Price', 'price']),
                eventVenueName: getField('eventVenueName', ['Event Venue Name', 'event venue name', 'Venue Name', 'venueName', 'Venue']),
                slug: getField('slug'),
                authorName: getField('authorName', ['Author Name', 'Author', 'author', 'contributor', 'contributor name']),
                publishedDate: (function() {
                    const date = getField('publishedDate', ['Published Date', 'Created Date', 'createdDate', 'Date Created', 'publishDate', 'created on'], true);
                    return date ? normalizeDate(date) : date;
                })(),
                modifiedDate: (function() {
                    const date = getField('modifiedDate', ['Modified Date', 'Updated Date', 'updatedDate', 'Date Updated', 'editedDate', 'Edited Date', 'last updated', 'last modified'], true);
                    return date ? normalizeModifiedTimestamp(date) : date;
                })(),
                directionsLink: directionsLinkField || googleMapsUrlField || '',
                videoLink: videoLinkField || '',
                document1: getField('Document1', ['document1', 'Document 1', 'document1link', 'document 1 link']),
                document1Name: getField('Document1Name', ['document1Name', 'Document 1 Name', 'document 1 name']),
                document2: getField('Document2', ['document2', 'Document 2', 'document2link', 'document 2 link']),
                document2Name: getField('Document2Name', ['document2Name', 'Document 2 Name', 'document 2 name']),
                image1FileId: getField('Image1FileId', ['image1FileId', 'Image 1 File ID', 'Image1 File ID', 'image1 file id']),
                image2FileId: getField('Image2FileId', ['image2FileId', 'Image 2 File ID', 'Image2 File ID', 'image2 file id']),
                image3FileId: getField('Image3FileId', ['image3FileId', 'Image 3 File ID', 'Image3 File ID', 'image3 file id']),
                googleMapsUrl: googleMapsUrlField || '',
                accordionPanel1Title: (function() {
                    const val = getField('accordionPanel1Title', ['AccordionPanel1Title', 'Accordion Panel 1 Title', 'accordion panel 1 title']);
                    if (row && row.name && !window._accordionDebugLogged) {
                        console.log('🎯 Accordion mapping debug for:', row.name);
                        console.log('   Raw row keys (first 15):', Object.keys(row).slice(0, 15));
                        console.log('   normalizedRow keys containing "accordion":', Object.keys(normalizedRow).filter(k => k.includes('accordion')));
                        console.log('   normalizedRow[\"accordionpanel1title\"]:', normalizedRow['accordionpanel1title']?.substring(0, 50) || '(not found)');
                        console.log('   getField result:', val?.substring(0, 50) || '(empty)');
                        window._accordionDebugLogged = true;
                    }
                    return val;
                })(),
                accordionPanel1Content: getField('accordionPanel1Content', ['AccordionPanel1Content', 'Accordion Panel 1 Content', 'accordion panel 1 content']),
                accordionPanel2Title: getField('accordionPanel2Title', ['AccordionPanel2Title', 'Accordion Panel 2 Title', 'accordion panel 2 title']),
                accordionPanel2Content: getField('accordionPanel2Content', ['AccordionPanel2Content', 'Accordion Panel 2 Content', 'accordion panel 2 content']),
                accordionPanel3Title: getField('accordionPanel3Title', ['AccordionPanel3Title', 'Accordion Panel 3 Title', 'accordion panel 3 title']),
                accordionPanel3Content: getField('accordionPanel3Content', ['AccordionPanel3Content', 'Accordion Panel 3 Content', 'accordion panel 3 content']),
                accordionPanel4Title: getField('accordionPanel4Title', ['AccordionPanel4Title', 'Accordion Panel 4 Title', 'accordion panel 4 title']),
                accordionPanel4Content: getField('accordionPanel4Content', ['AccordionPanel4Content', 'Accordion Panel 4 Content', 'accordion panel 4 content'])
            };
            
            if (!listing.slug && listing.name) {
                listing.slug = slugify(listing.name);
            }
            
            listing.googleMapsUrl = googleMapsUrlField || listing.directionsLink || '';
            if (!listing.directionsLink && listing.googleMapsUrl) {
                listing.directionsLink = listing.googleMapsUrl;
            }
            
            return sanitizeListing(listing);
        }
        
        // Update sync status UI
        function updateSyncStatus(success, message) {
            const statusBadge = document.getElementById('sheetsStatusBadge');
            const statusIcon = document.getElementById('sheetsStatusIcon');
            const statusText = document.getElementById('sheetsStatusText');
            const actionStatus = document.getElementById('sheetsActionStatus');
            const lastSync = document.getElementById('lastSyncTime');
            
            const sheetsCheckSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            const sheetsConnectingSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
            const sheetsErrorSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            if (success) {
                statusBadge.className = 'sheets-status-badge sheets-status-badge--connected';
                statusIcon.innerHTML = sheetsCheckSvg;
                statusText.removeAttribute('title');
                
                // Extract count from messages like "Loaded 390 listings" or "Loaded 390 listings (CSV)"
                if (message) {
                    const countMatch = message.match(/(\d+)\s+listings?/);
                    if (countMatch) {
                        const count = countMatch[1];
                        statusText.textContent = 'Connected (' + count + ' listings)';
                    } else {
                statusText.textContent = 'Connected';
                    }
                } else {
                    statusText.textContent = 'Connected';
                }
                
                lastSync.textContent = new Date().toLocaleTimeString();
            } else {
                // Check if it's a loading/connecting state or an error
                if (message && (message.includes('Loading') || message.includes('Connecting') || message.includes('Deleting'))) {
                    statusBadge.className = 'sheets-status-badge sheets-status-badge--connecting';
                    statusIcon.innerHTML = sheetsConnectingSvg;
                    statusText.removeAttribute('title');
                    statusText.textContent = message.includes('Deleting') ? 'Deleting...' : 'Connecting...';
                } else {
                    statusBadge.className = 'sheets-status-badge sheets-status-badge--error';
                    statusIcon.innerHTML = sheetsErrorSvg;
                    var errRaw = (message && String(message).trim()) ? String(message).trim() : '';
                    var errLabel = errRaw || 'Error';
                    if (errLabel.length > 140) {
                        errLabel = errLabel.slice(0, 137) + '...';
                    }
                    statusText.textContent = errLabel;
                    if (errRaw) {
                        statusText.setAttribute('title', errRaw);
                    } else {
                        statusText.removeAttribute('title');
                    }
                }
            }
            
            if (message) {
                // Don't show "Loaded X listings" or "Connecting…" messages - they're redundant with the status badge
                const isPermanentMessage = message.includes('Loaded') && message.match(/\d+\s+listings?/);
                const isConnectingMessage = message.includes('Connecting') || message.includes('Deleting');
                if (!isPermanentMessage && !isConnectingMessage) {
                actionStatus.textContent = message;
                const lower = (message || '').toLowerCase();
                const isProblem = !success || (success && (
                    lower.includes('not saved') ||
                    lower.includes('sync failed') ||
                    (lower.includes('failed') && !lower.includes('retrying'))
                ));
                actionStatus.className = 'tabs-action-status' + (isProblem ? ' tabs-action-status--problem' : '');
                setTimeout(() => {
                    actionStatus.textContent = '';
                    actionStatus.className = 'tabs-action-status';
                }, 3000);
                } else {
                    // Clear the action status for redundant messages
                    actionStatus.textContent = '';
                    actionStatus.className = 'tabs-action-status';
                }
            }
        }
        
        // Load data from Google Sheets on page load
        // Tries static listings.json first, then Apps Script, then CSV as fallback
        function syncTypeCategoriesAfterListingsLoad(listings) {
            const categoriesFromData = [...new Set(listings.map(function(l) { return l.category; }).filter(Boolean))];
            console.log('📋 Categories found in loaded data:', categoriesFromData);

            const categoriesFromStorage = loadCategoriesFromStorage();
            let addedCustomCategories = false;
            categoriesFromData.forEach(function(rawKey) {
                const categoryKey = normalizeCategoryKey(rawKey);
                if (!categoryKey || categoryKey === 'community') return;
                if (categoryKey && categoryKey.trim() && !TYPE_CATEGORIES[categoryKey]) {
                    let categoryData = null;
                    if (categoriesFromStorage && categoriesFromStorage[categoryKey]) {
                        categoryData = categoriesFromStorage[categoryKey];
                        console.log('✅ Found category in localStorage (from admin):', categoryKey, 'with emoji:', categoryData.emoji);
                    } else if (DEFAULT_TYPE_CATEGORIES[categoryKey]) {
                        categoryData = DEFAULT_TYPE_CATEGORIES[categoryKey];
                        console.log('✅ Found category in DEFAULT_TYPE_CATEGORIES:', categoryKey, 'with emoji:', categoryData.emoji);
                    }

                    TYPE_CATEGORIES[categoryKey] = categoryData ? {
                        name: categoryData.name || categoryKey,
                        emoji: categoryData.emoji || '',
                        description: categoryData.description || 'Custom category from Google Sheets',
                        types: categoryData.types || [],
                        icon: categoryData.icon || ''
                    } : {
                        name: categoryKey,
                        emoji: '⭐',
                        description: 'Custom category from Google Sheets',
                        types: []
                    };
                    addedCustomCategories = true;
                    console.log('✅ Added category from loaded data to TYPE_CATEGORIES:', categoryKey, 'with emoji:', TYPE_CATEGORIES[categoryKey].emoji || '(none)');
                } else if (TYPE_CATEGORIES[categoryKey]) {
                    if (categoriesFromStorage && categoriesFromStorage[categoryKey]) {
                        const storageCategory = categoriesFromStorage[categoryKey];
                        if (storageCategory.emoji) {
                            TYPE_CATEGORIES[categoryKey].emoji = storageCategory.emoji;
                            console.log('🔄 Synced emoji for category', categoryKey, 'from admin:', storageCategory.emoji);
                        }
                        if (storageCategory.name) {
                            TYPE_CATEGORIES[categoryKey].name = storageCategory.name;
                            console.log('🔄 Synced name for category', categoryKey, 'from admin:', storageCategory.name);
                        }
                        if (storageCategory.description) {
                            TYPE_CATEGORIES[categoryKey].description = storageCategory.description;
                        }
                        if (storageCategory.icon) {
                            TYPE_CATEGORIES[categoryKey].icon = storageCategory.icon;
                        }
                    } else if (DEFAULT_TYPE_CATEGORIES[categoryKey]) {
                        const defaultCategory = DEFAULT_TYPE_CATEGORIES[categoryKey];
                        if (defaultCategory.emoji && !TYPE_CATEGORIES[categoryKey].emoji) {
                            TYPE_CATEGORIES[categoryKey].emoji = defaultCategory.emoji;
                            console.log('🔄 Using default emoji for category', categoryKey, ':', defaultCategory.emoji);
                        }
                    }
                }
            });

            if (categoriesFromStorage) {
                Object.keys(categoriesFromStorage).forEach(function(categoryKey) {
                    if (categoryKey === 'community' || normalizeCategoryKey(categoryKey) === 'community') return;
                    if (!TYPE_CATEGORIES[categoryKey]) {
                        TYPE_CATEGORIES[categoryKey] = JSON.parse(JSON.stringify(categoriesFromStorage[categoryKey]));
                        console.log('✅ Preserved custom category from localStorage:', categoryKey, 'with emoji:', TYPE_CATEGORIES[categoryKey].emoji || '(none)');
                    }
                });
            }

            migrateCommunityToAttractions(TYPE_CATEGORIES);
            if (TYPE_CATEGORIES.community) delete TYPE_CATEGORIES.community;
            saveCategoriesToStorage(TYPE_CATEGORIES);

            if (addedCustomCategories) {
                console.log('📋 TYPE_CATEGORIES after adding loaded categories:', Object.keys(TYPE_CATEGORIES).length, 'categories');
                console.log('📋 Category keys:', Object.keys(TYPE_CATEGORIES));
            }
        }

        function finalizeAdminListingsLoad(listings, sheetHeaders, statusMessage) {
            if (typeof data === 'undefined' || !data) {
                data = JSON.parse(JSON.stringify(initialData));
            }
            const existingFilterOptions = data.filterOptions || initialData.filterOptions;
            const sanitizedFilterOptions = sanitizeFilterOptions(existingFilterOptions, listings);
            const headers = sanitizeSheetHeaders(sheetHeaders || (data && data.sheetHeaders));

            data = {
                listings: listings,
                filterOptions: sanitizedFilterOptions,
                sheetHeaders: headers
            };
            // Drop any table drafts captured before Sheets finished loading
            // (empty selects / placeholders), then rebuild both views.
            tableRowDrafts = {};
            if (typeof clearTableEditsPending === 'function') clearTableEditsPending();
            resetUnsavedChanges();
            updateTableHeaderLabelsFromSheet(headers);
            applyFilterOptionCleanup(sanitizedFilterOptions);
            syncTypeCategoriesAfterListingsLoad(listings);
            updateSyncStatus(true, statusMessage);
            renderListings();
            populateAdminFilters();
            updateStats();
            if (typeof renderDataTable === 'function') {
                renderDataTable();
            }
        }

        async function loadDataFromGoogleSheets(options) {
            options = options || {};
            // Set initial status to "Connecting..." (not "Connected" yet)
            updateSyncStatus(false, 'Connecting…');
            
            // Check if running from file:// protocol (local file)
            const isFileProtocol = window.location.protocol === 'file:';
            
            // Try Apps Script first (live Google Sheets — preferred for admin)
            if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                try {
                    console.log('📊 Loading data from Google Sheets via Apps Script...');
                    const url = GOOGLE_APPS_SCRIPT_URL + '?t=' + Date.now();
                    let response;
                    
                    // If file:// protocol, use proxy immediately (CORS doesn't work with file://)
                    if (isFileProtocol) {
                        console.log('⚠️ Running from file://, using proxy...');
                        console.warn('⚠️ Note: Opening HTML files directly (file://) has CORS limitations.');
                        console.warn('   For best results, host this file on a web server (e.g., GitHub Pages, Netlify, or local server).');
                        
                        try {
                            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
                            response = await fetch(proxyUrl, {
                                method: 'GET',
                                mode: 'cors',
                                cache: 'no-cache'
                            });
                            
                            if (!response || !response.ok) {
                                throw new Error('Proxy request failed');
                            }
                        } catch (proxyError) {
                            console.error('❌ Proxy also failed due to CORS:', proxyError);
                            throw new Error('Cannot load from Apps Script when opening file directly. Please host on a web server or use CSV fallback.');
                        }
                    } else {
                        // Try direct fetch first (Apps Script should be configured for CORS)
                        try {
                            response = await fetch(url, {
                                method: 'GET',
                                mode: 'cors',
                                cache: 'no-cache',
                                credentials: 'omit'
                            });
                            
                            if (!response || !response.ok) {
                                throw new Error('Failed to fetch from Apps Script');
                            }
                        } catch (fetchError) {
                            // Check if it's a CORS error or network error
                            const isCorsError = fetchError.message.includes('CORS') || 
                                              fetchError.message.includes('access control') ||
                                              fetchError.message.includes('Failed to fetch') ||
                                              fetchError.name === 'TypeError';
                            
                            if (isCorsError) {
                                // Try proxy as fallback
                                try {
                                    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
                                    response = await fetch(proxyUrl, {
                                        method: 'GET',
                                        mode: 'cors',
                                        cache: 'no-cache'
                                    });
                                    
                                    if (!response || !response.ok) {
                                        throw new Error('Proxy also failed');
                                    }
                                } catch (proxyError) {
                                    console.error('Proxy also failed:', proxyError);
                                    throw new Error('Unable to fetch from Apps Script. Please check CORS configuration.');
                                }
                            } else {
                                throw fetchError;
                            }
                        }
                    }
                    
                    if (!response.ok) {
                        // Try to get error message from response
                        let errorMessage = `Failed to fetch from Apps Script (Status: ${response.status})`;
                        try {
                            const errorText = await response.text();
                            if (errorText) {
                                const errorJson = JSON.parse(errorText);
                                errorMessage = errorJson.error || errorMessage;
                            }
                        } catch (e) {
                            // If we can't parse error, use status code
                            if (response.status === 500) {
                                errorMessage = 'Apps Script returned 500 error - check your script for errors';
                            } else if (response.status === 403) {
                                errorMessage = 'Apps Script access denied - check permissions';
                            } else if (response.status === 404) {
                                errorMessage = 'Apps Script URL not found - check your URL';
                            }
                        }
                        throw new Error(errorMessage);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success && result.listings && result.listings.length > 0) {
                        // Debug: Check first listing's category before processing
                        if (result.listings.length > 0) {
                            console.log('🔍 First listing from Google Sheets (before processing):', {
                                name: result.listings[0].name,
                                category: result.listings[0].category,
                                hasCategory: 'category' in result.listings[0],
                                allKeys: Object.keys(result.listings[0]),
                                categoryValue: result.listings[0].category,
                                categoryType: typeof result.listings[0].category
                            });
                        }
                        
                        const listings = result.listings.map(function(listing, index) {
                            // Handle category EXACTLY like type - simple and direct
                            // Type is handled as: listing.type (no normalization, no special logic)
                            // Category should be handled the same way: listing.category
                            
                            // Store original category BEFORE any processing (just like type)
                            const originalCategory = listing.category;
                            
                            // Create a copy of the listing (same as type handling)
                            const listingCopy = Object.assign({}, listing);
                            
                            // Sanitize the listing
                            const sanitized = sanitizeListing(listingCopy);
                            
                            // Restore category EXACTLY as it was in Google Sheets (same as type)
                            // Don't normalize, don't transform - just use what's in Sheets
                            sanitized.category = originalCategory;
                            // Listings loaded from Google Sheets are not "local-only"
                            sanitized._localOnly = false;
                            
                            // Log for debugging (but don't transform the value)
                            if (originalCategory !== undefined && originalCategory !== null && originalCategory !== '') {
                                console.log('✅ Category from Google Sheets (preserved as-is):', sanitized.name, '->', sanitized.category);
                            } else {
                                console.log('⚠️ No category in Google Sheets for:', sanitized.name);
                            }
                            
                            return sanitized;
                        });
                        
                        // Preserve existing filterOptions when loading from Sheets
                        // Ensure data is initialized before accessing it
                        if (typeof data === 'undefined' || !data) {
                            data = JSON.parse(JSON.stringify(initialData));
                        }
                        console.log('✅ Loaded ' + listings.length + ' listings from Google Sheets (Apps Script)');
                        finalizeAdminListingsLoad(
                            listings,
                            result.headers || result.sheetHeaders || null,
                            'Loaded ' + listings.length + ' listings'
                        );
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error loading from Apps Script:', error);
                    
                    // Check what type of error it is
                    if (error.message.includes('500')) {
                        updateSyncStatus(false, 'Apps Script error (500); using CSV backup.');
                        console.error('⚠️ Your Google Apps Script has an internal error. Check the Apps Script execution logs.');
                        console.error('   Error:', error.message);
                    } else if (error.message.includes('CORS') || error.message.includes('access control') || error.message.includes('Origin null')) {
                        updateSyncStatus(false, 'CORS error; retrying…');
                        // Only log CORS warning if it's a persistent issue
                        // (Suppress on first attempt, will retry via CSV fallback)
                        if (error.message.includes('Proxy also failed')) {
                            console.warn('⚠️ CORS Error: Your Google Apps Script may need CORS headers configured.\n' +
                                        'If this persists, add to your doGet function:\n' +
                                        'return ContentService\n' +
                                        '  .createTextOutput(JSON.stringify({success: true, listings: [...]}))\n' +
                                        '  .setMimeType(ContentService.MimeType.JSON);');
                        } else {
                            // First CORS attempt - just log briefly, will retry
                            console.log('⚠️ CORS blocked, trying proxy...');
                        }
                    } else {
                        updateSyncStatus(false, 'Connection error; using CSV backup.');
                        console.error('   Error:', error.message);
                    }
                    
                    console.log('⚠️ Falling back to CSV...');
                }
            }
            
            // Fallback to CSV if Apps Script fails or not configured
            if (GOOGLE_SHEET_CSV_URL && !GOOGLE_SHEET_CSV_URL.includes('YOUR_SHEET_ID')) {
                try {
                    const cacheBustUrl = GOOGLE_SHEET_CSV_URL + (GOOGLE_SHEET_CSV_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
                    console.log('📊 Loading data from Google Sheets CSV...');
                    
                    let response;
                    // If file:// protocol, try multiple approaches
                    if (isFileProtocol) {
                        // Try different proxy services
                        const proxies = [
                            'https://api.allorigins.win/raw?url=',
                            'https://corsproxy.io/?',
                            'https://cors-anywhere.herokuapp.com/'
                        ];
                        
                        let proxySuccess = false;
                        for (let i = 0; i < proxies.length && !proxySuccess; i++) {
                            try {
                                const proxyUrl = proxies[i] + encodeURIComponent(cacheBustUrl);
                                console.log(`🔄 Trying proxy ${i + 1}/${proxies.length}...`);
                                response = await fetch(proxyUrl, {
                                    method: 'GET',
                                    mode: 'cors',
                                    cache: 'no-cache'
                                });
                                
                                if (response && response.ok) {
                                    proxySuccess = true;
                                    console.log('✅ Proxy succeeded!');
                                    break;
                                }
                            } catch (proxyError) {
                                console.warn(`⚠️ Proxy ${i + 1} failed:`, proxyError.message);
                                continue;
                            }
                        }
                        
                        if (!proxySuccess) {
                            // Last resort: try direct fetch (will likely fail but worth trying)
                            console.warn('⚠️ All proxies failed, trying direct CSV fetch...');
                            try {
                                response = await fetch(cacheBustUrl, {
                                    method: 'GET',
                                    mode: 'no-cors'
                                });
                                // If no-cors, we can't verify success, so throw
                                throw new Error('Direct CSV fetch from file:// not possible');
                            } catch (directError) {
                                throw new Error('Cannot load CSV from file:// protocol. All methods failed.');
                            }
                        }
                    } else {
                        response = await fetch(cacheBustUrl);
                    }
                    
                    if (!response || !response.ok) {
                        throw new Error(`Failed to fetch CSV (Status: ${response?.status || 'unknown'})`);
                    }
                    
                    const csvText = await response.text();
                    const parsed = parseCSV(csvText);
                    
                    if (parsed.dataRows && parsed.dataRows.length > 0) {
                            const listings = parsed.dataRows
                                .map(row => mapCSVRowToListing(row))
                            .filter(listing => listing.name); // Only keep listings with names
                        
                        // Extract filter options from listings
                        console.log('✅ Loaded ' + listings.length + ' listings from Google Sheets (CSV)');
                        finalizeAdminListingsLoad(
                            listings,
                            parsed.headers || null,
                            'Loaded ' + listings.length + ' listings (CSV)'
                        );
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error loading from CSV:', error);
                    updateSyncStatus(false, 'CSV fetch failed.');
                }
            }

            // Fallback to static listings.json if Google Sheets is unreachable
            if (LISTINGS_JSON_URL && !isFileProtocol) {
                try {
                    const jsonUrl = LISTINGS_JSON_URL + (LISTINGS_JSON_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
                    console.log('📦 Google Sheets unavailable — trying static listings.json:', jsonUrl);
                    const jsonResponse = await fetch(jsonUrl, {
                        method: 'GET',
                        cache: 'no-cache',
                        credentials: 'omit'
                    });

                    if (jsonResponse.ok) {
                        const payload = await jsonResponse.json();
                        const rows = Array.isArray(payload) ? payload : (payload && payload.rows) || [];
                        if (rows.length > 0) {
                            const listings = rows
                                .map(function(row, index) { return mapCSVRowToListing(row, index); })
                                .filter(function(listing) { return listing.name; });
                            const generatedAt = (payload && payload.generatedAt) || 'unknown';
                            console.log('✅ Loaded ' + listings.length + ' listings from static listings.json (generated ' + generatedAt + ')');
                            finalizeAdminListingsLoad(
                                listings,
                                (payload && payload.headers) || null,
                                'Loaded ' + listings.length + ' listings (JSON fallback)'
                            );
                            return;
                        }
                    }
                } catch (jsonError) {
                    console.log('⚠️ listings.json fallback failed:', jsonError.message);
                }
            }
            
            // If all sources fail, use initial data and still render the UI
            console.log('⚠️ Could not load from Google Sheets, using initial data');
            updateSyncStatus(false, 'Using local data only.');
            updateTableHeaderLabelsFromSheet((data && data.sheetHeaders) || DEFAULT_TABLE_HEADERS);
            renderListings();
            populateAdminFilters();
            updateStats();
            
            // Show warning if running from file://
            if (isFileProtocol) {
                console.error('❌ IMPORTANT: Opening from file:// protocol has CORS restrictions.');
                console.error('   To fix this, run a local web server:');
                console.error('   1. Open Terminal in this folder');
                console.error('   2. Run: python3 -m http.server 8000');
                console.error('   3. Open: http://localhost:8000/index-sheets.html');
                console.error('   OR host on GitHub Pages / Netlify / etc.');
                
                // Show alert to user
                setTimeout(() => {
                    alert('⚠️ CORS Error\n\n' +
                          'Opening HTML files directly (file://) has browser restrictions.\n\n' +
                          'To fix:\n' +
                          '1. Open Terminal in this folder\n' +
                          '2. Run: python3 -m http.server 8000\n' +
                          '3. Open: http://localhost:8000/index-sheets.html\n\n' +
                          'For now, using local data only.');
                }, 1000);
            }
        }
        
        // Reload data from Google Sheets (manual refresh)
        window.reloadFromSheets = async function reloadFromSheets() {
            const confirmed = confirm('⚠️ Warning: Reloading from Google Sheets\n\n' +
                                    'This will override all changes you\'ve made in this admin panel.\n' +
                                    'Any unsaved changes will be lost.\n\n' +
                                    'Click OK to reload from Google Sheets and override local changes\n' +
                                    'Click Cancel to keep your local changes');
            if (!confirmed) {
                return;
            }
            // Status will be updated by loadDataFromGoogleSheets()
            await loadDataFromGoogleSheets();
        }
        
        /**
         * Styled notice modal (replaces native alert for key admin messages).
         * @param {{ title: string, body: string, tone?: 'success'|'warning', buttonLabel?: string }} opts
         * @returns {Promise<void>}
         */
        function showAdminNotice(opts) {
            const options = opts || {};
            const title = options.title || 'Notice';
            const body = options.body || '';
            const tone = options.tone === 'warning' ? 'warning' : 'success';
            const buttonLabel = options.buttonLabel || 'Got it';

            return new Promise(function(resolve) {
                const existing = document.querySelector('.admin-notice-overlay');
                if (existing && existing.parentNode) {
                    existing.parentNode.removeChild(existing);
                }

                const overlay = document.createElement('div');
                overlay.className = 'admin-notice-overlay';
                overlay.setAttribute('role', 'presentation');

                const dialog = document.createElement('div');
                dialog.className = 'admin-notice admin-notice--' + tone;
                dialog.setAttribute('role', 'alertdialog');
                dialog.setAttribute('aria-modal', 'true');
                dialog.setAttribute('aria-labelledby', 'adminNoticeTitle');
                dialog.setAttribute('aria-describedby', 'adminNoticeBody');

                const iconSvg = tone === 'warning'
                    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

                dialog.innerHTML = ''
                    + '<div class="admin-notice__icon">' + iconSvg + '</div>'
                    + '<h2 class="admin-notice__title" id="adminNoticeTitle"></h2>'
                    + '<p class="admin-notice__body" id="adminNoticeBody"></p>'
                    + '<div class="admin-notice__actions">'
                    + '<button type="button" class="admin-notice__btn admin-notice__btn--primary" id="adminNoticeOk"></button>'
                    + '</div>';

                dialog.querySelector('#adminNoticeTitle').textContent = title;
                dialog.querySelector('#adminNoticeBody').innerHTML = body;
                const okBtn = dialog.querySelector('#adminNoticeOk');
                okBtn.textContent = buttonLabel;

                function close() {
                    document.removeEventListener('keydown', onKey);
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    resolve();
                }

                function onKey(e) {
                    if (e.key === 'Escape' || e.key === 'Enter') {
                        e.preventDefault();
                        close();
                    }
                }

                okBtn.addEventListener('click', close);
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) close();
                });
                document.addEventListener('keydown', onKey);

                overlay.appendChild(dialog);
                document.body.appendChild(overlay);
                okBtn.focus();
            });
        }
        window.showAdminNotice = showAdminNotice;

        /**
         * Save-to-Sheets confirmation. Optional CSV backup uses an explicit
         * "Continue" step so a browser download prompt cannot skip the save.
         * @param {number} listingCount
         * @returns {Promise<boolean>} true to proceed with save, false to cancel
         */
        function showBackupConfirmation(listingCount) {
            return new Promise(function(resolve) {
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';

                const modal = document.createElement('div');
                modal.style.cssText = 'background: white; padding: 30px; border-radius: 8px; max-width: 520px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';

                function closeModal(result) {
                    if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                    }
                    resolve(result);
                }

                function showContinueAfterBackup() {
                    modal.innerHTML = ''
                        + '<div style="margin-bottom: 20px;">'
                        + '<h2 style="margin: 0 0 15px 0; color: #212529; font-size: 24px;">CSV backup started</h2>'
                        + '<p style="margin: 0 0 15px 0; color: #6c757d; line-height: 1.6;">'
                        + 'Your browser may ask whether to view or download the file. Handle that prompt, then click below to save '
                        + listingCount + ' listing(s) to Google Sheets.'
                        + '</p>'
                        + '<p style="margin: 0; color: #856404; line-height: 1.6; font-size: 14px;">'
                        + 'This replaces all existing sheet data and cannot be undone.'
                        + '</p>'
                        + '</div>'
                        + '<div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">'
                        + '<button type="button" id="backupCancelBtn" style="padding: 10px 20px; border: 1px solid #dee2e6; background: white; color: #212529; border-radius: 18px; cursor: pointer; font-weight: 500;">Cancel</button>'
                        + '<button type="button" id="backupContinueBtn" style="padding: 10px 20px; border: none; background: #4E6B52; color: white; border-radius: 18px; cursor: pointer; font-weight: 600;">Save to Google Sheets</button>'
                        + '</div>';
                    document.getElementById('backupCancelBtn').onclick = function() { closeModal(false); };
                    document.getElementById('backupContinueBtn').onclick = function() { closeModal(true); };
                }

                modal.innerHTML = ''
                    + '<div style="margin-bottom: 20px;">'
                    + '<h2 style="margin: 0 0 15px 0; color: #212529; font-size: 24px;">Save to Google Sheets?</h2>'
                    + '<p style="margin: 0 0 15px 0; color: #6c757d; line-height: 1.6;">'
                    + 'You are about to replace <strong>all existing data</strong> in Google Sheets with '
                    + listingCount + ' listing(s). This cannot be undone.'
                    + '</p>'
                    + '<p style="margin: 0; color: #6c757d; line-height: 1.6;">'
                    + 'We recommend downloading a CSV backup first.'
                    + '</p>'
                    + '</div>'
                    + '<div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">'
                    + '<button type="button" id="backupCancelBtn" style="padding: 10px 20px; border: 1px solid #dee2e6; background: white; color: #212529; border-radius: 18px; cursor: pointer; font-weight: 500;">Cancel</button>'
                    + '<button type="button" id="backupDownloadBtn" style="padding: 10px 20px; border: none; background: #4E6B52; color: white; border-radius: 18px; cursor: pointer; font-weight: 600;">Download CSV backup</button>'
                    + '<button type="button" id="backupProceedBtn" style="padding: 10px 20px; border: none; background: #84FBA9; color: #212529; border-radius: 18px; cursor: pointer; font-weight: 600;">Save without backup</button>'
                    + '</div>';

                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                document.getElementById('backupCancelBtn').onclick = function() { closeModal(false); };
                document.getElementById('backupDownloadBtn').onclick = function() {
                    downloadCSV();
                    showContinueAfterBackup();
                };
                document.getElementById('backupProceedBtn').onclick = function() { closeModal(true); };

                overlay.onclick = function(e) {
                    if (e.target === overlay) {
                        closeModal(false);
                    }
                };
            });
        }
        
        window.saveAllToSheets = async function saveAllToSheets() {
            if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                alert('⚠️ Google Sheets not configured. Please set up your Apps Script URL.');
                return;
            }
            
            if (!data.listings || data.listings.length === 0) {
                alert('⚠️ No listings to save.');
                return;
            }

            const duplicateSlugs = findDuplicateSlugs(data.listings);
            if (duplicateSlugs.length) {
                alert(
                    '⚠️ Cannot Save to Sheets — duplicate slugs found.\n\n' +
                    'Each listing needs a unique slug. Fix these first:\n\n' +
                    formatDuplicateSlugMessage(duplicateSlugs)
                );
                updateSyncStatus(false, 'Save blocked: duplicate slugs');
                return;
            }
            
            /* Apply any in-progress Table View cell edits before posting to Sheets (avoids overwriting with stale data) */
            if (tableEditsPending) {
                saveTableChanges({ silent: true });
            }
            
            const confirmed = await showBackupConfirmation(data.listings.length);
            if (!confirmed) {
                return;
            }
            
            // Show "in progress" status
            updateSyncStatus(true, `Saving ${data.listings.length} listings…`);
            
            try {
                // Verify categories are in listings before saving
                const listingsWithCategories = data.listings.map(function(listing) {
                    // Ensure category field is included
                    const listingCopy = Object.assign({}, listing);
                    if (!('category' in listingCopy)) {
                        console.warn('⚠️ Listing missing category field:', listing.name);
                        listingCopy.category = listing.category || '';
                    }
                    console.log('💾 Saving listing:', listing.name, '- Category:', listingCopy.category);
                    return listingCopy;
                });
                
                // Log category summary before saving
                const categoriesBeingSaved = [...new Set(listingsWithCategories.map(l => l.category).filter(Boolean))];
                console.log('📋 Categories being saved to Google Sheets:', categoriesBeingSaved);
                
                // Send all listings at once with a "replaceAll" action
                // This tells the Apps Script to clear the sheet and replace with these listings
                const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                const postData = JSON.stringify({
                    action: 'replaceAllListings',
                    listings: listingsWithCategories,
                    sessionToken: session && session.token ? session.token : null
                });
                
                let result = { success: false };
                
                // Try direct fetch first
                try {
                    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        mode: 'cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: postData
                    });
                    
                    try {
                        const responseText = await response.text();
                        result = responseText ? JSON.parse(responseText) : { success: true };
                    } catch (e) {
                        result = { success: true }; // Assume success if no response
                    }
                } catch (corsError) {
                    const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent || '');
                    if (isWindows) {
                        console.warn('Direct POST failed on Windows (likely CORS/preflight). Trying text/plain POST...');
                        try {
                            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                // text/plain avoids the CORS preflight that some Windows browser setups block
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: postData
                            });
                            const responseText = await response.text();
                            result = responseText ? JSON.parse(responseText) : { success: true };
                        } catch (e) {
                            console.error('Windows fallback POST failed:', e);
                            result = {
                                success: false,
                                error: 'Save blocked by browser/network policy on Windows. Try a different browser (Chrome), disable strict tracking protection for this site, or have an admin run the save.'
                            };
                        }
                    } else {
                        console.log('Direct POST failed due to CORS, trying no-cors mode...');
                        
                        // Try no-cors mode - sends request but can't read response
                        try {
                            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'no-cors',
                                body: postData  // Send raw JSON string
                            });
                            
                            // With no-cors, we can't read response, so assume success
                            result = { success: true };
                            console.log('Sent via no-cors mode (can\'t verify response)');
                        } catch (e) {
                            console.error('No-cors also failed:', e);
                            result = { success: false, error: 'Failed to connect to Google Sheets' };
                            alert('⚠️ Unable to save to Google Sheets. Changes saved locally only.\n\n' +
                                  'This may be due to CORS restrictions. Your Apps Script may need to be configured to allow CORS.');
                        }
                    }
                }
                
                if (result.success) {
            updateSyncStatus(true, `Replaced all data in Google Sheets (${data.listings.length} listings).`);
            resetUnsavedChanges();
                    // Mark all listings as now persisted (no longer local-only)
                    if (data && Array.isArray(data.listings)) {
                        data.listings.forEach(function(l) { l._localOnly = false; });
                    }
                    alert(`✅ Successfully saved all ${data.listings.length} listings to Google Sheets!`);
                } else {
                    updateSyncStatus(false);
                    alert('❌ Error saving to Google Sheets: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error saving to Google Sheets:', error);
                updateSyncStatus(false, 'Save failed.');
                alert('❌ Error saving to Google Sheets: ' + error.message);
            }
        }
        
        // Store current sort value (default: modified date, newest first)
        let currentAdminSort = 'modifiedDate-desc';

        const LISTINGS_GRID_CARD_ROW_HEIGHT = 680;
        const LISTINGS_GRID_VIRTUAL_OVERSCAN_ROWS = 2;
        let listingsGridSortedListings = [];
        let listingsGridMeasuredRowHeight = 0;
        let listingsGridScrollRaf = null;
        let mapMarkersUpdateTimer = null;

        function compareListingsForAdminSort(a, b) {
            const aName = (a.name || '').trim().toLowerCase();
            const bName = (b.name || '').trim().toLowerCase();
            const aArea = (a.area || '').trim().toLowerCase();
            const bArea = (b.area || '').trim().toLowerCase();
            const aType = (a.type || '').trim().toLowerCase();
            const bType = (b.type || '').trim().toLowerCase();

            switch (currentAdminSort) {
                case 'default': {
                    const areaCompare = aArea.localeCompare(bArea);
                    if (areaCompare !== 0) return areaCompare;
                    const typeCompare = aType.localeCompare(bType);
                    if (typeCompare !== 0) return typeCompare;
                    return aName.localeCompare(bName);
                }
                case 'name-asc':
                    return aName.localeCompare(bName);
                case 'name-desc':
                    return bName.localeCompare(aName);
                case 'area-asc':
                    return aArea.localeCompare(bArea);
                case 'type-asc':
                    return aType.localeCompare(bType);
                case 'publishedDate-asc': {
                    const parseDate = function(dateStr) {
                        if (!dateStr) return 0;
                        const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (dateMatch) {
                            return new Date(parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[3], 10)).getTime();
                        }
                        const parsed = new Date(dateStr);
                        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
                    };
                    return parseDate(a.publishedDate) - parseDate(b.publishedDate);
                }
                case 'publishedDate-desc': {
                    const parseDateDesc = function(dateStr) {
                        if (!dateStr) return 0;
                        const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (dateMatch) {
                            return new Date(parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[3], 10)).getTime();
                        }
                        const parsed = new Date(dateStr);
                        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
                    };
                    return parseDateDesc(b.publishedDate) - parseDateDesc(a.publishedDate);
                }
                case 'modifiedDate-asc': {
                    return parseListingTimestamp(a.modifiedDate) - parseListingTimestamp(b.modifiedDate);
                }
                case 'modifiedDate-desc': {
                    return parseListingTimestamp(b.modifiedDate) - parseListingTimestamp(a.modifiedDate);
                }
                default: {
                    const areaCompareDefault = aArea.localeCompare(bArea);
                    if (areaCompareDefault !== 0) return areaCompareDefault;
                    const typeCompareDefault = aType.localeCompare(bType);
                    if (typeCompareDefault !== 0) return typeCompareDefault;
                    return aName.localeCompare(bName);
                }
            }
        }

        function sortListingsForGrid(listings) {
            return listings.slice().sort(compareListingsForAdminSort);
        }

        function getListingsGridColumnCount(grid) {
            if (!grid) return 1;
            const width = grid.clientWidth || 0;
            if (width === 0) return 1;
            return Math.max(1, Math.floor((width + 20) / 380));
        }

        function getListingsGridRowHeight(grid) {
            if (listingsGridMeasuredRowHeight > 0) return listingsGridMeasuredRowHeight;
            if (grid) {
                const card = grid.querySelector('.flip-card');
                if (card) {
                    const h = Math.ceil(card.getBoundingClientRect().height);
                    if (h > 0) {
                        listingsGridMeasuredRowHeight = h + 20;
                        return listingsGridMeasuredRowHeight;
                    }
                }
            }
            return LISTINGS_GRID_CARD_ROW_HEIGHT;
        }

        function ensureListingsGridScrollListeners() {
            if (window.__listingsGridScrollListenersReady) return;
            window.__listingsGridScrollListenersReady = true;
            window.addEventListener('scroll', scheduleListingsGridVirtualRefresh, { passive: true });
            window.addEventListener('resize', scheduleListingsGridVirtualRefresh);
        }

        function scheduleListingsGridVirtualRefresh() {
            if (listingsGridScrollRaf) return;
            listingsGridScrollRaf = requestAnimationFrame(function() {
                listingsGridScrollRaf = null;
                const adminTab = document.getElementById('adminTab');
                if (!adminTab || !adminTab.classList.contains('active')) return;
                if (!listingsGridSortedListings.length) return;
                renderListingsVirtualWindow();
            });
        }

        function showListingsGridLoading(message) {
            const grid = document.getElementById('listingsGrid');
            if (!grid) return;
            grid.innerHTML = '<div class="listings-grid-loading" aria-live="polite">' + (message || 'Loading listings…') + '</div>';
        }

        function updateListingsGridStats(listings) {
            updateStats(listings);
            const countDisplay = document.getElementById('listingsCount');
            if (countDisplay) {
                const count = listings.length;
                countDisplay.textContent = count === 1 ? '1 listing' : count + ' listings';
            }
        }

        function scheduleMapMarkersUpdate(listings) {
            if (mapMarkersUpdateTimer) clearTimeout(mapMarkersUpdateTimer);
            mapMarkersUpdateTimer = setTimeout(function() {
                mapMarkersUpdateTimer = null;
                if (!mapVisible || !map || typeof updateMapMarkers !== 'function') return;
                updateMapMarkers(listings || listingsGridSortedListings || data.listings);
            }, 400);
        }

        function renderListingsVirtualWindow() {
            const grid = document.getElementById('listingsGrid');
            if (!grid) return;
            ensureListingsGridScrollListeners();

            const total = listingsGridSortedListings.length;
            if (total === 0) {
                grid.innerHTML = '';
                return;
            }

            const columns = getListingsGridColumnCount(grid);
            const rowHeight = getListingsGridRowHeight(grid);
            const totalRows = Math.ceil(total / columns);
            const gridTop = grid.getBoundingClientRect().top + window.scrollY;
            const viewTop = window.scrollY;
            const viewBottom = viewTop + window.innerHeight;
            const relativeTop = Math.max(0, viewTop - gridTop);
            const relativeBottom = Math.max(0, viewBottom - gridTop);
            const startRow = Math.max(0, Math.floor(relativeTop / rowHeight) - LISTINGS_GRID_VIRTUAL_OVERSCAN_ROWS);
            const endRow = Math.min(totalRows, Math.ceil(relativeBottom / rowHeight) + LISTINGS_GRID_VIRTUAL_OVERSCAN_ROWS);
            const startIndex = startRow * columns;
            const endIndex = Math.min(total, endRow * columns);
            const topPad = startRow * rowHeight;
            const bottomPad = Math.max(0, (totalRows - endRow) * rowHeight);

            grid.innerHTML = '';
            if (topPad > 0) {
                const topSpacer = document.createElement('div');
                topSpacer.className = 'listings-grid-spacer';
                topSpacer.style.height = topPad + 'px';
                grid.appendChild(topSpacer);
            }
            for (let i = startIndex; i < endIndex; i++) {
                const card = buildListingCardElement(listingsGridSortedListings[i]);
                if (card) grid.appendChild(card);
            }
            if (bottomPad > 0) {
                const bottomSpacer = document.createElement('div');
                bottomSpacer.className = 'listings-grid-spacer';
                bottomSpacer.style.height = bottomPad + 'px';
                grid.appendChild(bottomSpacer);
            }

            if (!listingsGridMeasuredRowHeight) {
                const sampleCard = grid.querySelector('.flip-card');
                if (sampleCard) {
                    const measured = Math.ceil(sampleCard.getBoundingClientRect().height) + 20;
                    if (measured > 0 && Math.abs(measured - rowHeight) > 40) {
                        listingsGridMeasuredRowHeight = measured;
                    }
                }
            }
        }

        function renderListings(listings) {
            if (!listings) listings = data.listings;
            const grid = document.getElementById('listingsGrid');
            if (!grid) return;

            listingsGridSortedListings = sortListingsForGrid(listings);
            listingsGridMeasuredRowHeight = 0;
            ensureListingsGridScrollListeners();
            updateListingsGridStats(listingsGridSortedListings);

            function paintGrid(attempt) {
                attempt = attempt || 0;
                renderListingsVirtualWindow();
                scheduleMapMarkersUpdate(listingsGridSortedListings);
                if (grid.clientWidth === 0 && attempt < 15) {
                    requestAnimationFrame(function() {
                        paintGrid(attempt + 1);
                    });
                }
            }

            paintGrid(0);
        }
        
        // Error Console Functions
        function showErrorConsole() {
            if (typeof window.switchTab === 'function') {
                window.switchTab('admin');
            }
            document.getElementById('errorConsoleSection').style.display = 'block';
            document.body.classList.add('error-console-open');
            validateListings();
        }
        
        function hideErrorConsole() {
            document.getElementById('errorConsoleSection').style.display = 'none';
            document.body.classList.remove('error-console-open');
        }
        
        async function validateListings() {
            if (!data || !data.listings) {
                console.warn('No data available to validate');
                return;
            }
            
            const errors = [];
            const slugCounts = {};
            
            // First pass: collect slugs for duplicate checking
            data.listings.forEach(function(listing, index) {
                // Check slug - be lenient with what we accept
                const slugValue = listing.slug;
                
                // Accept slug if it exists and is not null/undefined/empty
                // Even if it's a number or matches ID, it's still a valid slug
                if (slugValue !== undefined && slugValue !== null && slugValue !== '') {
                    const slugStr = String(slugValue).trim();
                    if (slugStr !== '') {
                        if (!slugCounts[slugStr]) {
                            slugCounts[slugStr] = [];
                        }
                        slugCounts[slugStr].push({ index: index, listing: listing });
                    }
                }
            });
            
            // Check for duplicate slugs
            Object.keys(slugCounts).forEach(function(slug) {
                if (slugCounts[slug].length > 1) {
                    slugCounts[slug].forEach(function(item) {
                        errors.push({
                            type: 'duplicate-slug',
                            severity: 'error',
                            message: 'Duplicate slug: "' + slug + '"',
                            listing: item.listing,
                            index: item.index
                        });
                    });
                }
            });
            
            // Check each listing for issues
            data.listings.forEach(function(listing, index) {
                // Required fields - only check name and slug
                if (!listing.name || listing.name.trim() === '') {
                    errors.push({
                        type: 'missing-field',
                        severity: 'error',
                        message: 'Missing required field: name',
                        listing: listing,
                        index: index
                    });
                }
                
                // Check for missing slug - slugs are needed for View Details URLs
                const slugValue = listing.slug;
                if (!slugValue || slugValue === null || slugValue === '' || String(slugValue).trim() === '') {
                    errors.push({
                        type: 'missing-slug',
                        severity: 'warning',
                        message: 'Missing slug: "' + (listing.name || 'Unnamed listing') + '" will use auto-generated slug from name',
                        listing: listing,
                        index: index
                    });
                }
                
                // Validate dates
                if (listing.publishedDate && listing.publishedDate.trim() !== '') {
                    // Normalize the date before validation
                    const normalizedDate = normalizeDate(listing.publishedDate);
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
                        errors.push({
                            type: 'invalid-date',
                            severity: 'warning',
                            message: 'Invalid date format for publishedDate: "' + listing.publishedDate + '" (expected YYYY-MM-DD)',
                            listing: listing,
                            index: index
                        });
                    } else if (normalizedDate !== listing.publishedDate) {
                        // Update the listing with normalized date
                        listing.publishedDate = normalizedDate;
                    }
                }
                
                if (listing.modifiedDate && listing.modifiedDate.trim() !== '') {
                    const normalizedTs = normalizeModifiedTimestamp(listing.modifiedDate);
                    const dateOnly = normalizeDate(normalizedTs);
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
                        errors.push({
                            type: 'invalid-date',
                            severity: 'warning',
                            message: 'Invalid date format for modifiedDate: "' + listing.modifiedDate + '" (expected YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)',
                            listing: listing,
                            index: index
                        });
                    } else if (normalizedTs !== listing.modifiedDate) {
                        listing.modifiedDate = normalizedTs;
                    }
                }
                
                // Validate status
                if (listing.status && listing.status.trim() !== '') {
                    const status = listing.status.toLowerCase();
                    if (status !== 'publish' && status !== 'draft' && status !== 'private') {
                        errors.push({
                            type: 'invalid-status',
                            severity: 'warning',
                            message: 'Invalid status: "' + listing.status + '" (expected publish/draft/private)',
                            listing: listing,
                            index: index
                        });
                    }
                }
                
                // Validate featured field
                if (listing.featured !== undefined && listing.featured !== null && listing.featured !== '' && listing.featured !== 'TRUE' && listing.featured !== 'FALSE' && listing.featured !== true && listing.featured !== false) {
                    errors.push({
                        type: 'invalid-featured',
                        severity: 'warning',
                        message: 'Invalid featured value: "' + listing.featured + '" (expected TRUE/FALSE)',
                        listing: listing,
                        index: index
                    });
                }
                
                // Check URLs for validity (basic format check)
                const urlFields = ['website', 'image1', 'image2', 'image3', 'directionsLink', 'videoLink', 'externalWebsite'];
                urlFields.forEach(function(field) {
                    if (listing[field] && listing[field].trim() !== '') {
                        const url = listing[field].trim();
                        // Basic URL validation
                        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                            errors.push({
                                type: 'invalid-url',
                                severity: 'warning',
                                message: 'Invalid URL format for ' + field + ': "' + url + '"',
                                listing: listing,
                                index: index
                            });
                        }
                        
                        // Ensure primary images come from ImageKit for Framer performance
                        const isImageField = (field === 'image1' || field === 'image2' || field === 'image3');
                        if (isImageField && url.startsWith('http') && !url.includes('ik.imagekit.io/')) {
                            errors.push({
                                type: 'non-imagekit-image',
                                severity: 'warning',
                                message: field + ' is not hosted on ImageKit. Convert before importing: "' + url + '"',
                                listing: listing,
                                index: index
                            });
                        }
                    }
                });

                // Alt text required whenever an image URL is present
                [
                    { urlField: 'image1', descField: 'image1Desc', label: 'Image 1' },
                    { urlField: 'image2', descField: 'image2Desc', label: 'Image 2' },
                    { urlField: 'image3', descField: 'image3Desc', label: 'Image 3' }
                ].forEach(function(pair) {
                    const imageUrl = listing[pair.urlField];
                    if (!imageUrl || String(imageUrl).trim() === '') return;
                    const desc = listing[pair.descField];
                    if (!desc || String(desc).trim() === '') {
                        errors.push({
                            type: 'missing-image-desc',
                            severity: 'error',
                            message: pair.label + ' has a URL but no alt text',
                            listing: listing,
                            index: index
                        });
                    }
                });
            });
            
            // Display errors first (synchronous checks)
            displayErrors(errors);
            
            // Check for broken image URLs (async - check ALL images)
            const imageErrors = [];
            const checkedImages = new Set();
            
            // Show loading state
            const consoleContent = document.getElementById('errorConsoleContent');
            const loadingHtml = consoleContent.innerHTML + '<div class="error-console-section__loading">Checking images for broken URLs. <span id="imageCheckProgress">0</span> checked. This may take a moment.</div>';
            consoleContent.innerHTML = loadingHtml;
            
            // Collect ALL images to check from all listings
            const imagesToCheck = [];
            data.listings.forEach(function(listing, index) {
                const imageFields = ['image1', 'image2', 'image3'];
                
                imageFields.forEach(function(field) {
                    const imageUrl = listing[field];
                    if (imageUrl && imageUrl.trim() !== '' && !checkedImages.has(imageUrl)) {
                        checkedImages.add(imageUrl);
                        try {
                            const url = new URL(imageUrl);
                            if (url.protocol === 'http:' || url.protocol === 'https:') {
                                imagesToCheck.push({
                                    url: imageUrl,
                                    listing: listing,
                                    index: index,
                                    field: field
                                });
                            }
                        } catch (e) {
                            // Invalid URL format - already caught above
                        }
                    }
                });
            });
            
            // Check images using Image object - this should detect 404s
            const checkImage = function(imageInfo) {
                return new Promise(function(resolve) {
                    const img = new Image();
                    let resolved = false;
                    const timeout = 12000; // 12 second timeout
                    
                    // Set up timeout first
                    const timeoutId = setTimeout(function() {
                        if (!resolved) {
                            resolved = true;
                            resolve({
                                error: {
                                    type: 'broken-image',
                                    severity: 'error',
                                    message: 'Image load timeout (12s): ' + imageInfo.url,
                                    listing: imageInfo.listing,
                                    index: imageInfo.index,
                                    field: imageInfo.field
                                }
                            });
                        }
                    }, timeout);
                    
                    // Image loaded successfully
                    img.onload = function() {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            resolve({ error: null });
                        }
                    };
                    
                    // Image failed to load (404, network error, etc.)
                    img.onerror = function() {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            resolve({
                                error: {
                                    type: 'broken-image',
                                    severity: 'error',
                                    message: '404 or broken image: ' + imageInfo.url,
                                    listing: imageInfo.listing,
                                    index: imageInfo.index,
                                    field: imageInfo.field
                                }
                            });
                        }
                    };
                    
                    // Start loading the image
                    // Add cache busting to ensure fresh check
                    const separator = imageInfo.url.includes('?') ? '&' : '?';
                    img.src = imageInfo.url + separator + '_check=' + Date.now();
                });
            };
            
            // Check images in parallel batches (10 at a time)
            (async function() {
                console.log('🔍 Starting image validation for', imagesToCheck.length, 'images');
                const batchSize = 10;
                let checkedCount = 0;
                
                for (let i = 0; i < imagesToCheck.length; i += batchSize) {
                    const batch = imagesToCheck.slice(i, i + batchSize);
                    const batchPromises = batch.map(function(imageInfo) {
                        return checkImage(imageInfo).then(function(result) {
                            checkedCount++;
                            // Update progress
                            const progressEl = document.getElementById('imageCheckProgress');
                            if (progressEl) {
                                progressEl.textContent = checkedCount + ' / ' + imagesToCheck.length;
                            }
                            
                            // Log errors for debugging
                            if (result && result.error) {
                                console.log('❌ Broken image found:', result.error.message, 'for listing:', result.error.listing.name);
                            }
                            
                            return result;
                        });
                    });
                    
                    const batchResults = await Promise.all(batchPromises);
                    batchResults.forEach(function(result) {
                        if (result && result.error) {
                            imageErrors.push(result.error);
                        }
                    });
                }
                
                console.log('✅ Image validation complete. Found', imageErrors.length, 'broken images');
                
                // Merge image errors with other errors and re-display
                errors.push.apply(errors, imageErrors);
                displayErrors(errors);
            })();
        }
        
        function displayErrors(errors) {
            const consoleContent = document.getElementById('errorConsoleContent');
            const consoleTitle = document.getElementById('errorConsoleTitle');
            
            if (errors.length === 0) {
                consoleContent.innerHTML = '<div class="error-console-section__empty"><p class="error-console-section__success-title">No errors found</p><p class="error-console-section__success-lead">All listings are ready for Framer Google Sheets import.</p></div>';
                consoleTitle.textContent = 'Framer Import Error Console — No errors';
                return;
            }
            
            // Sort errors by severity (errors first, then warnings)
            errors.sort(function(a, b) {
                if (a.severity === 'error' && b.severity !== 'error') return -1;
                if (a.severity !== 'error' && b.severity === 'error') return 1;
                return 0;
            });
            
            // Group errors by type
            const errorsByType = {};
            errors.forEach(function(error) {
                if (!errorsByType[error.type]) {
                    errorsByType[error.type] = [];
                }
                errorsByType[error.type].push(error);
            });
            
            let html = '<div class="error-console-section__summary">Total issues: ' + errors.length + '</div>';
            
            Object.keys(errorsByType).forEach(function(type) {
                const typeErrors = errorsByType[type];
                const severity = typeErrors[0].severity;
                const severityLabel = severity === 'error' ? 'Error' : 'Warning';
                const typeLabel = type.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                
                html += '<div class="error-console-section__group">';
                html += '<h4 class="error-console-section__group-title error-console-section__group-title--' + severity + '">' + severityLabel + ': ' + typeLabel + ' (' + typeErrors.length + ')</h4>';
                
                typeErrors.forEach(function(error) {
                    const listingName = error.listing.name || 'Unnamed Listing';
                    
                    html += '<div class="error-console-section__row" onclick="navigateToListing(' + error.index + ')">';
                    html += '<div class="error-console-section__row-name">' + listingName + '</div>';
                    html += '<div class="error-console-section__row-msg">' + error.message + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            });
            
            consoleContent.innerHTML = html;
            consoleTitle.textContent = 'Framer Import Error Console — ' + errors.length + ' issue' + (errors.length !== 1 ? 's' : '');
        }
        
        function navigateToListing(index) {
            // Find the listing card by ID or slug
            const listing = data.listings[index];
            if (!listing) return;
            
            // Scroll to the listings grid
            const grid = document.getElementById('listingsGrid');
            if (!grid) return;
            
            // Find the card element for this listing by data attribute or by position
            const cards = grid.querySelectorAll('.flip-card');
            let targetCard = null;
            
            // Try to find by data attribute if it exists
            cards.forEach(function(card) {
                const cardSlug = card.getAttribute('data-slug');
                if (cardSlug === listing.slug) {
                    targetCard = card;
                }
            });
            
            // Fallback: try by index
            if (!targetCard && cards[index]) {
                targetCard = cards[index];
            }
            
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight the card
                targetCard.style.boxShadow = '0 0 0 4px #dc3545';
                targetCard.style.transition = 'box-shadow 0.3s';
                targetCard.style.zIndex = '1000';
                setTimeout(function() {
                    targetCard.style.boxShadow = '';
                    targetCard.style.zIndex = '';
                }, 2000);
            } else {
                // Card not found - might be filtered out, so clear filters and search for it
                const searchInput = document.getElementById('adminSearchInput');
                if (searchInput && listing.name) {
                    // Clear all filters
                    if (document.getElementById('adminTypeFilter')) {
                        document.getElementById('adminTypeFilter').value = '';
                    }
                    if (document.getElementById('adminAreaFilter')) {
                        document.getElementById('adminAreaFilter').value = '';
                    }
                    if (document.getElementById('adminAmenityFilter')) {
                        document.getElementById('adminAmenityFilter').value = '';
                    }
                    searchInput.value = listing.name;
                    filterListings();
                    // Try again after a short delay
                    setTimeout(function() {
                        navigateToListing(index);
                    }, 300);
                }
            }
        }
        
        function buildListingCardElement(listing) {
                const card = document.createElement('div');
                card.className = 'flip-card';
                // Add data attributes for navigation
                if (listing.slug) {
                    card.setAttribute('data-slug', listing.slug);
                }
                
                // Flip functionality on click (but not when clicking buttons or links)
                card.onclick = function(e) {
                    // Don't flip if clicking on links or buttons inside
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
                        return;
                    }
                    
                    // Close all other flipped cards
                    document.querySelectorAll('.flip-card.flipped').forEach(function(otherCard) {
                        if (otherCard !== card) {
                            otherCard.classList.remove('flipped');
                        }
                    });
                    
                    this.classList.toggle('flipped');
                };
                
                const inner = document.createElement('div');
                inner.className = 'flip-card-inner';
                
                // Front of card
                const front = document.createElement('div');
                front.className = 'flip-card-front';
                
                // Create scrollable image container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'card-front-image-scroll';
                imgContainer.style.cssText = 'position: relative; width: 100%; height: 240px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0;';
                imgContainer.style.setProperty('-ms-overflow-style', 'none');
                
                const imgWrapper = document.createElement('div');
                imgWrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex;';
                
                // Count images
                const imageCount = (listing.image1 ? 1 : 0) + (listing.image2 ? 1 : 0) + (listing.image3 ? 1 : 0);
                
                // Add image1 if it exists
                if (listing.image1) {
                    const img1 = document.createElement('img');
                    img1.src = getAdminImageUrl(listing.image1);
                    img1.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img1.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img1);
                }
                
                // Add image2 if it exists
                if (listing.image2) {
                    const img2 = document.createElement('img');
                    img2.src = getAdminImageUrl(listing.image2);
                    img2.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img2.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img2);
                }
                
                // Add image3 if it exists
                if (listing.image3) {
                    const img3 = document.createElement('img');
                    img3.src = getAdminImageUrl(listing.image3);
                    img3.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img3.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img3);
                }
                
                // If no images, add fallback
                if (imageCount === 0) {
                    const img = document.createElement('img');
                    img.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    img.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    imgWrapper.appendChild(img);
                }
                
                imgContainer.appendChild(imgWrapper);
                front.appendChild(imgContainer);
                
                // Add scroll arrow if there are multiple images
                if (imageCount > 1) {
                    const totalImages = imageCount;
                    
                    // Function to get current index based on scroll position
                    const getCurrentIndex = function() {
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        if (containerWidth === 0) return 0;
                        const scrollLeft = imgContainer.scrollLeft || 0;
                        // Round to nearest index
                        return Math.round(scrollLeft / containerWidth);
                    };
                    
                    // Single right arrow that cycles forward through images
                    const rightArrow = document.createElement('div');
                    rightArrow.className = 'scroll-arrow scroll-arrow-right';
                    
                    rightArrow.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        if (containerWidth === 0) return;
                        
                        let currentIndex = getCurrentIndex();
                        // Cycle forward (next image)
                        currentIndex = (currentIndex + 1) % totalImages;
                        imgContainer.scrollTo({ left: currentIndex * containerWidth, behavior: 'smooth' });
                    });
                    
                    // Position arrow at center of image container (same approach as frontpage_framer.html)
                    setTimeout(function() {
                        const containerHeight = imgContainer.offsetHeight || 240;
                        if (containerHeight > 0) {
                            // Use container height divided by 2 for vertical center
                            // This matches frontpage_framer.html which uses containerWidth / 2 for square containers
                            // Use setProperty with 'important' to override CSS 'top: 50% !important'
                            rightArrow.style.setProperty('top', (containerHeight / 2) + 'px', 'important');
                            rightArrow.style.setProperty('transform', 'translateY(-50%)', 'important');
                        }
                    }, 10);
                    
                    // Append to front (not imgContainer) so it doesn't scroll with images
                    front.appendChild(rightArrow);
                }
                
                // Featured badge
                if (listing.featured) {
                    const badge = document.createElement('div');
                    badge.className = 'featured-badge';
                    badge.textContent = 'FEATURED';
                    badge.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 10;';
                    front.appendChild(badge);
                }
                
                // Private badge
                if (listing.private) {
                    const badge = document.createElement('div');
                    badge.className = 'private-badge';
                    badge.textContent = 'PRIVATE';
                    badge.style.cssText = 'position: absolute; top: 10px; left: ' + (listing.featured ? '100px' : '10px') + '; z-index: 10;';
                    front.appendChild(badge);
                }
                
                // Card content - allow it to grow to show all content
                const cardContent = document.createElement('div');
                cardContent.style.cssText = 'padding: 20px 0px 0px 0px; display: flex; flex-direction: column; flex: 1 1 auto;';
                
                // Build contact info HTML with icons
                // Check if address is the booking site placeholder
                const bookingSiteText = 'Full address available on booking site';
                const isBookingSiteAddress = listing.address === bookingSiteText;
                const mapUrl = (!isBookingSiteAddress && listing.address) ? (listing.directionsLink && listing.directionsLink.trim() 
                    ? listing.directionsLink 
                    : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(listing.address)) : '';
                
                // Format modified date for inline display
                const formatModifiedDate = function(dateStr) {
                    if (!dateStr) return '';
                    try {
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return '';
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return months[date.getMonth()] + ' ' + date.getDate();
                    } catch (e) {
                        return '';
                    }
                };
                const modifiedDateFormatted = formatModifiedDate(listing.modifiedDate);
                const authorWithDate = listing.authorName + (modifiedDateFormatted ? ' <span style="color: var(--text-secondary); font-weight: normal;">(edited ' + modifiedDateFormatted + ')</span>' : '');
                
                const contactHtml = '<div class="listing-contact">' +
                    // Author with icon and modified date inline
                    (listing.authorName ? 
                    '<div class="card-info-item" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text">' + authorWithDate + '</div>' +
                    '</div>' : '') +
                    // Modified date (replaces published/created on card preview)
                    (listing.modifiedDate ? 
                    '<div class="card-info-item" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text">Modified: ' + escapeHtml((function(dateStr) {
                        const day = normalizeDate(dateStr || '');
                        const full = normalizeModifiedTimestamp(dateStr || '');
                        const tm = String(full).match(/T(\d{2}):(\d{2})/);
                        return tm ? (day + ' ' + tm[1] + ':' + tm[2]) : day;
                    })(listing.modifiedDate)) + '</div>' +
                    '</div>' : '') +
                    // Phone with icon
                    (listing.phone ? 
                    '<a href="tel:' + listing.phone.replace(/[^0-9+]/g, '') + '" class="card-info-item" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text">' + listing.phone + '</div>' +
                    '</a>' : '') +
                    // Address with icon (clickable to map)
                    (listing.address ? 
                    '<a href="' + mapUrl + '" target="_blank" class="card-info-item" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text">' + listing.address + '</div>' +
                    '</a>' : '') +
                    // Website with icon
                    (listing.website ? 
                    '<a href="' + listing.website + '" target="_blank" class="card-info-item card-info-item--website" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text">' + listing.website + '</div>' +
                    '</a>' : '') +
                    // YouTube / Video link with icon
                    (listing.videoLink ?
                    '<a href="' + listing.videoLink + '" target="_blank" class="card-info-item" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M21.582 7.19a2.75 2.75 0 0 0-1.93-1.95C18.02 4.8 12 4.8 12 4.8s-6.02 0-7.652.44A2.75 2.75 0 0 0 2.418 7.19C2 8.84 2 12 2 12s0 3.16.418 4.81a2.75 2.75 0 0 0 1.93 1.95c1.632.44 7.652.44 7.652.44s6.02 0 7.652-.44a2.75 2.75 0 0 0 1.93-1.95C22 15.16 22 12 22 12s0-3.16-.418-4.81zM10 15.5v-7l6 3.5-6 3.5z"/>' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text">' + listing.videoLink + '</div>' +
                    '</a>' : '') +
                    '</div>';

                // Directions + Document buttons (front + back)
                const docUrl = (listing.document1 && String(listing.document1).trim())
                    ? String(listing.document1).trim()
                    : ((listing.document2 && String(listing.document2).trim()) ? String(listing.document2).trim() : '');
                const docName = (listing.document1Name && String(listing.document1Name).trim())
                    ? String(listing.document1Name).trim()
                    : ((listing.document2Name && String(listing.document2Name).trim()) ? String(listing.document2Name).trim() : 'Document');
                const actionButtonsHtml = ((mapUrl && mapUrl.trim()) || (docUrl && docUrl.trim())) ? (
                    '<div class="listing-action-buttons">' +
                    ((mapUrl && mapUrl.trim()) ? (
                        '<a href="' + mapUrl + '" target="_blank" class="action-pill action-pill--primary" onclick="event.stopPropagation();">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />' +
                        '<path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />' +
                        '</svg>' +
                        'Get Directions' +
                        '</a>'
                    ) : '') +
                    ((docUrl && docUrl.trim()) ? (
                        '<a href="' + docUrl + '" target="_blank" class="action-pill action-pill--secondary" onclick="event.stopPropagation();">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                        '<path d="M14 2v6h6"/>' +
                        '<path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/>' +
                        '</svg>' +
                        escapeHtml(docName) +
                        '</a>'
                    ) : '') +
                    '</div>'
                ) : '';
                
                // Description with up to 5 lines
                const descriptionHTML = listing.description ? 
                    '<p class="listing-desc">' + listing.description + '</p>' :
                    '<p class="listing-desc">No description</p>';
                
                // Get category name for display
                const categoryKey = getCategoryForType(listing.type, listing);
                const categoryHTML = categoryKey ? 
                    '<div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.5px; margin-bottom: 4px;">' + toSentenceCase(categoryKey) + '</div>' : '';
                
                cardContent.innerHTML = 
                    categoryHTML +
                    '<h3 style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">' + listing.name + '</h3>' +
                    '<div class="listing-meta" style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">' +
                    '<span class="badge badge-type ' + getIconClass(listing.type, listing) + '" data-type="' + listing.type + '" onclick="filterByAdminBadge(event, \'type\', \'' + listing.type.replace(/'/g, "\\'") + '\')" style="cursor: pointer;">' + listing.type + '</span>' +
                    '<span class="badge badge-area" data-area="' + listing.area + '" onclick="filterByAdminBadge(event, \'area\', \'' + listing.area.replace(/'/g, "\\'") + '\')" style="cursor: pointer;">' + listing.area + '</span>' +
                    '</div>' +
                    descriptionHTML +
                    actionButtonsHtml +
                    (listing.amenities && listing.amenities.length > 0 ? 
                    '<div class="listing-amenities">' +
                    listing.amenities.map(function(a) {
                        const escapedAmenity = a.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        return '<span class="amenity" onclick="filterByAdminBadge(event, \'amenity\', \'' + escapedAmenity + '\')" style="cursor: pointer;">' + a + '</span>';
                    }).join('') +
                    '</div>' : '') +
                    contactHtml;
                
                // Edit and Delete buttons
                const actions = document.createElement('div');
                actions.className = 'listing-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-edit';
                editBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>' +
                    '</svg>' +
                    'Edit';
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    editListing(listing.slug);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete';
                
                // Check if this listing is waiting for confirmation
                if (deleteConfirmId === listing.slug) {
                    deleteBtn.textContent = 'Confirm Delete?';
                    deleteBtn.style.background = '#dc2626';
                    deleteBtn.style.color = '#ffffff';
                } else {
                    deleteBtn.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                        '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 16H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>' +
                        '</svg>' +
                        'Delete';
                    deleteBtn.style.background = '#FDECF0';
                    deleteBtn.style.color = '';
                }
                
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteListing(listing.slug);
                });
                
                const duplicateBtn = document.createElement('button');
                duplicateBtn.className = 'btn-duplicate';
                duplicateBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/>' +
                    '</svg>' +
                    'Duplicate';
                duplicateBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    duplicateListing(listing.slug);
                });

                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn-view';
                viewBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>' +
                    '</svg>' +
                    'Live';
                viewBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const safeSlug = (listing.slug || '').toString().trim();
                    if (!safeSlug) return;
                    window.open('https://www.nelsoncounty.com/explore/' + encodeURIComponent(safeSlug) + '/', '_blank', 'noopener,noreferrer');
                });
                
                actions.appendChild(editBtn);
                actions.appendChild(duplicateBtn);
                actions.appendChild(viewBtn);
                actions.appendChild(deleteBtn);
                cardContent.appendChild(actions);
                front.appendChild(cardContent);
                
                // Back of card
                const back = document.createElement('div');
                back.className = 'flip-card-back';
                
                // Build description sections with labels for back of card
                const backDescriptionText = listing.description && listing.description.trim() ? escapeHtml(listing.description).replace(/\n/g, '<br>') : '';
                const backDescriptionHTML = backDescriptionText ? 
                    '<div style="margin-bottom: 15px;">' +
                    '<h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Description</h4>' +
                    '<div class="preview-richtext preview-richtext--compact"><p>' + backDescriptionText + '</p></div>' +
                    '</div>' : '';
                
                const hasDetailedDescription = listing.detailedDescription && listing.detailedDescription.trim();
                const detailedDescriptionRaw = hasDetailedDescription ? String(listing.detailedDescription) : '';
                const detailedDescriptionHtml = detailedDescriptionRaw ? (
                    (detailedDescriptionRaw.includes('<') && detailedDescriptionRaw.includes('>'))
                        ? sanitizeCustomHtml(detailedDescriptionRaw)
                        : ('<p>' + escapeHtml(detailedDescriptionRaw).replace(/\n/g, '<br>') + '</p>')
                ) : '';
                const backDetailedDescriptionHTML = detailedDescriptionHtml ? 
                    '<div style="margin-bottom: 15px;">' +
                    '<h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Detailed Description</h4>' +
                    '<div class="preview-richtext preview-richtext--compact">' + detailedDescriptionHtml + '</div>' +
                    '</div>' : '';
                
                const sanitizedCustomHtml = listing.customHtml && listing.customHtml.trim() ? sanitizeCustomHtml(listing.customHtml) : '';
                const backCustomHtmlPreview = sanitizedCustomHtml ?
                    '<div class="custom-html-preview">' +
                    '<div class="custom-html-preview-title">Custom HTML Preview</div>' +
                    '<div class="custom-html-render">' + sanitizedCustomHtml + '</div>' +
                    '</div>' : '';

                const amenitiesHtml = (listing.amenities && Array.isArray(listing.amenities) && listing.amenities.length > 0) ? (
                    '<div style="margin-bottom: 15px;">' +
                    '<div class="listing-amenities">' +
                    listing.amenities.map(function(a) {
                        const escapedAmenity = a.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        return '<span class="amenity" onclick="filterByAdminBadge(event, \'amenity\', \'' + escapedAmenity + '\')" style="cursor: pointer;">' + a + '</span>';
                    }).join('') +
                    '</div>' +
                    '</div>'
                ) : '';

                function renderAccordionPanel(panelTitle, panelContent) {
                    const title = (panelTitle || '').toString().trim();
                    const raw = (panelContent || '').toString().trim();
                    if (!title && !raw) return '';
                    const contentHtml = raw ? (
                        (raw.includes('<') && raw.includes('>'))
                            ? sanitizeCustomHtml(raw)
                            : ('<p>' + escapeHtml(raw).replace(/\n/g, '<br>') + '</p>')
                    ) : '';
                    return (
                        '<div style="margin-bottom: 10px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-hover);">' +
                        (title ? '<div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">' + escapeHtml(title) + '</div>' : '') +
                        (contentHtml ? '<div class="preview-richtext preview-richtext--compact">' + contentHtml + '</div>' : '') +
                        '</div>'
                    );
                }

                const accordionPanelsHtml = (function() {
                    const blocks = [
                        renderAccordionPanel(listing.accordionPanel1Title, listing.accordionPanel1Content),
                        renderAccordionPanel(listing.accordionPanel2Title, listing.accordionPanel2Content),
                        renderAccordionPanel(listing.accordionPanel3Title, listing.accordionPanel3Content),
                        renderAccordionPanel(listing.accordionPanel4Title, listing.accordionPanel4Content)
                    ].filter(Boolean);
                    if (blocks.length === 0) return '';
                    return (
                        '<div style="margin-bottom: 15px;">' +
                        '<h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Accordion</h4>' +
                        blocks.join('') +
                        '</div>'
                    );
                })();

                const backMetaBadgesHtml = (function() {
                    const typeBadge =
                        '<span class="badge badge-type ' + getIconClass(listing.type, listing) + '" data-type="' + listing.type + '" onclick="filterByAdminBadge(event, \'type\', \'' + listing.type.replace(/'/g, "\\'") + '\')" style="cursor: pointer;">' + listing.type + '</span>';
                    const areaBadge =
                        '<span class="badge badge-area" data-area="' + listing.area + '" onclick="filterByAdminBadge(event, \'area\', \'' + listing.area.replace(/'/g, "\\'") + '\')" style="cursor: pointer;">' + listing.area + '</span>';
                    return (
                        '<div class="listing-meta" style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">' +
                        typeBadge +
                        areaBadge +
                        '</div>'
                    );
                })();

                const backContactHtml = contactHtml ? ('<div style="margin-bottom: 10px;">' + contactHtml + '</div>') : '';
                
                // Match the front layout: images at top, content below
                back.style.padding = '0';
                back.innerHTML = '';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'flip-close-btn';
                closeBtn.innerHTML = '&times;';
                closeBtn.onclick = function(e) {
                    e.stopPropagation();
                    const parentCard = this.closest('.flip-card');
                    if (parentCard) parentCard.classList.remove('flipped');
                };
                back.appendChild(closeBtn);
                
                // Create scrollable image container (same as front)
                const backImgContainer = document.createElement('div');
                backImgContainer.className = 'card-front-image-scroll';
                backImgContainer.style.cssText = 'position: relative; width: 100%; height: 240px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0;';
                backImgContainer.style.setProperty('-ms-overflow-style', 'none');
                
                const backImgWrapper = document.createElement('div');
                backImgWrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex;';
                
                const backImageCount = (listing.image1 ? 1 : 0) + (listing.image2 ? 1 : 0) + (listing.image3 ? 1 : 0);
                
                if (listing.image1) {
                    const img1 = document.createElement('img');
                    img1.src = getAdminImageUrl(listing.image1);
                    img1.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px 12px 0 0; flex-shrink: 0; scroll-snap-align: start;';
                    img1.onerror = function() { this.src = 'https://via.placeholder.com/400x400?text=No+Image'; };
                    backImgWrapper.appendChild(img1);
                }
                if (listing.image2) {
                    const img2 = document.createElement('img');
                    img2.src = getAdminImageUrl(listing.image2);
                    img2.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px 12px 0 0; flex-shrink: 0; scroll-snap-align: start;';
                    img2.onerror = function() { this.src = 'https://via.placeholder.com/400x400?text=No+Image'; };
                    backImgWrapper.appendChild(img2);
                }
                if (listing.image3) {
                    const img3 = document.createElement('img');
                    img3.src = getAdminImageUrl(listing.image3);
                    img3.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px 12px 0 0; flex-shrink: 0; scroll-snap-align: start;';
                    img3.onerror = function() { this.src = 'https://via.placeholder.com/400x400?text=No+Image'; };
                    backImgWrapper.appendChild(img3);
                }
                if (backImageCount === 0) {
                    const img = document.createElement('img');
                    img.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    img.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px 12px 0 0; flex-shrink: 0; scroll-snap-align: start;';
                    backImgWrapper.appendChild(img);
                }
                
                backImgContainer.appendChild(backImgWrapper);
                back.appendChild(backImgContainer);
                
                if (backImageCount > 1) {
                    const totalImages = backImageCount;
                    const getCurrentIndex = function() {
                        const containerWidth = backImgContainer.offsetWidth || backImgContainer.clientWidth;
                        if (containerWidth === 0) return 0;
                        const scrollLeft = backImgContainer.scrollLeft || 0;
                        return Math.round(scrollLeft / containerWidth);
                    };
                    
                    const rightArrow = document.createElement('div');
                    rightArrow.className = 'scroll-arrow scroll-arrow-right';
                    rightArrow.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const containerWidth = backImgContainer.offsetWidth || backImgContainer.clientWidth;
                        if (containerWidth === 0) return;
                        let currentIndex = getCurrentIndex();
                        currentIndex = (currentIndex + 1) % totalImages;
                        backImgContainer.scrollTo({ left: currentIndex * containerWidth, behavior: 'smooth' });
                    });
                    
                    setTimeout(function() {
                        const containerHeight = backImgContainer.offsetHeight || 240;
                        if (containerHeight > 0) {
                            rightArrow.style.setProperty('top', (containerHeight / 2) + 'px', 'important');
                            rightArrow.style.setProperty('transform', 'translateY(-50%)', 'important');
                        }
                    }, 10);
                    
                    back.appendChild(rightArrow);
                }
                
                if (listing.featured) {
                    const badge = document.createElement('div');
                    badge.className = 'featured-badge';
                    badge.textContent = 'FEATURED';
                    badge.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 10;';
                    back.appendChild(badge);
                }
                
                if (listing.private) {
                    const badge = document.createElement('div');
                    badge.className = 'private-badge';
                    badge.textContent = 'PRIVATE';
                    badge.style.cssText = 'position: absolute; top: 10px; left: ' + (listing.featured ? '100px' : '10px') + '; z-index: 10;';
                    back.appendChild(badge);
                }
                
                const backContent = document.createElement('div');
                backContent.style.cssText = 'padding: 20px 15px 24px 15px; display: flex; flex-direction: column;';
                backContent.innerHTML =
                    categoryHTML +
                    '<h3 style="font-size: 22px; margin-bottom: 10px; color: var(--text-primary);">' + listing.name + '</h3>' +
                    backMetaBadgesHtml +
                    backContactHtml +
                    amenitiesHtml +
                    actionButtonsHtml +
                    backDescriptionHTML +
                    backDetailedDescriptionHTML +
                    accordionPanelsHtml +
                    backCustomHtmlPreview;
                back.appendChild(backContent);
                
                // Add Edit and Delete buttons to the back of the card
                const backActions = document.createElement('div');
                backActions.className = 'listing-actions';
                
                const backEditBtn = document.createElement('button');
                backEditBtn.className = 'btn-edit';
                backEditBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>' +
                    '</svg>' +
                    'Edit';
                backEditBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    editListing(listing.slug);
                });
                
                const backDeleteBtn = document.createElement('button');
                backDeleteBtn.className = 'btn-delete';
                
                // Check if this listing is waiting for confirmation
                if (deleteConfirmId === listing.slug) {
                    backDeleteBtn.textContent = 'Confirm Delete?';
                    backDeleteBtn.style.background = '#dc2626';
                    backDeleteBtn.style.color = '#ffffff';
                } else {
                    backDeleteBtn.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                        '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 16H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>' +
                        '</svg>' +
                        'Delete';
                    backDeleteBtn.style.background = '#FDECF0';
                    backDeleteBtn.style.color = '';
                }
                
                backDeleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteListing(listing.slug);
                });
                
                const backDuplicateBtn = document.createElement('button');
                backDuplicateBtn.className = 'btn-duplicate';
                backDuplicateBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/>' +
                    '</svg>' +
                    'Duplicate';
                backDuplicateBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    duplicateListing(listing.slug);
                });

                const backViewBtn = document.createElement('button');
                backViewBtn.className = 'btn-view';
                backViewBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>' +
                    '</svg>' +
                    'Live';
                backViewBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const safeSlug = (listing.slug || '').toString().trim();
                    if (!safeSlug) return;
                    window.open('https://www.nelsoncounty.com/explore/' + encodeURIComponent(safeSlug) + '/', '_blank', 'noopener,noreferrer');
                });
                
                backActions.appendChild(backEditBtn);
                backActions.appendChild(backDuplicateBtn);
                backActions.appendChild(backViewBtn);
                backActions.appendChild(backDeleteBtn);
                back.appendChild(backActions);
                
                inner.appendChild(front);
                inner.appendChild(back);
                card.appendChild(inner);
                layoutAdminCardImageStrip(imgContainer, imgWrapper, imageCount);
                layoutAdminCardImageStrip(backImgContainer, backImgWrapper, backImageCount);
                return card;
        }
        
        function updateStats(listings) {
            if (!listings) listings = data.listings;
            document.getElementById('totalListings').textContent = listings.length;
            document.getElementById('featuredCount').textContent = listings.filter(function(l) { return l.featured; }).length;
            const uniqueAreas = {};
            listings.forEach(function(l) { uniqueAreas[l.area] = true; });
            document.getElementById('areasCount').textContent = Object.keys(uniqueAreas).length;
            const uniqueTypes = {};
            listings.forEach(function(l) { uniqueTypes[l.type] = true; });
            document.getElementById('typesCount').textContent = Object.keys(uniqueTypes).length;
        }
        
        let currentAdminTypeFilter = ''; // Track which category is currently active (empty string = "All Types")
        let currentAdminSubfilter = '';
        
        function filterListings() {
            const searchTerm = document.getElementById('adminSearchInput').value.toLowerCase().trim();
            const areaFilter = document.getElementById('adminAreaFilter').value;
            const amenityFilter = document.getElementById('adminAmenityFilter').value;
            
            const filtered = data.listings.filter(function(listing) {
                // Special handling for "featured" search
                if (searchTerm === 'featured') {
                    // Show all featured listings OR listings containing "featured" in content
                    const isFeatured = listing.featured === true || listing.featured === 'true' || listing.featured === 'TRUE';
                    const hasFeaturedInContent = [
                        listing.name || '',
                        listing.description || '',
                        listing.detailedDescription || '',
                        listing.customHtml || ''
                    ].join(' ').toLowerCase().indexOf('featured') > -1;
                    
                    if (!isFeatured && !hasFeaturedInContent) {
                        return false; // Doesn't match featured search
                    }
                }
                if (searchTerm === 'private') {
                    // Show all private listings OR listings containing "private" in content
                    const isPrivate = listing.private === true || listing.private === 'true' || listing.private === 'TRUE';
                    const hasPrivateInContent = [
                        listing.name || '',
                        listing.description || '',
                        listing.detailedDescription || '',
                        listing.customHtml || ''
                    ].join(' ').toLowerCase().indexOf('private') > -1;
                    
                    if (!isPrivate && !hasPrivateInContent) {
                        return false; // Doesn't match private search
                    }
                }
                
                // Build comprehensive searchable text from all listing fields
                const searchableText = [
                    listing.name || '',
                    listing.slug || '',
                    listing.type || '',
                    listing.category || '',
                    listing.area || '',
                    listing.description || '',
                    listing.detailedDescription || '',
                    listing.customHtml || '',
                    listing.address || '',
                    listing.phone || '',
                    listing.website || '',
                    listing.authorName || '',
                    listing.publishedDate || '',
                    listing.modifiedDate || '',
                    listing.directionsLink || '',
                    listing.videoLink || '',
                    listing.document1 || '',
                    listing.document1Name || '',
                    listing.document2 || '',
                    listing.document2Name || '',
                    listing.googleMapsUrl || '',
                    listing.image1Desc || '',
                    listing.image2Desc || '',
                    listing.image3Desc || '',
                    Array.isArray(listing.amenities) ? listing.amenities.join(' ') : (listing.amenities || ''),
                    // Include featured status in searchable text
                    (listing.featured === true || listing.featured === 'true' || listing.featured === 'TRUE') ? 'featured' : ''
                ].join(' ').toLowerCase();
                
                const matchesSearch = !searchTerm || searchableText.indexOf(searchTerm) > -1;
                // Check if type matches - either direct match or category match
                let matchesType = true;
                if (currentAdminTypeFilter) {
                    if (currentAdminSubfilter === 'shopping' || currentAdminSubfilter === 'resorts' || currentAdminSubfilter === 'attraction') {
                        const listingType = String(listing.type || '').toLowerCase();
                        if (currentAdminSubfilter === 'shopping') {
                            matchesType = listingType === 'shop' || listingType === 'shops' || listingType === 'store' || listingType.indexOf('shopping') > -1 || listingType.indexOf('retail') > -1 || listingType.indexOf('boutique') > -1;
                        } else if (currentAdminSubfilter === 'resorts') {
                            matchesType = listingType.indexOf('resort') > -1;
                        } else {
                            matchesType = listingType === 'attraction' || listingType === 'attractions';
                        }
                    } else if (TYPE_CATEGORIES && (TYPE_CATEGORIES[currentAdminTypeFilter] || currentAdminTypeFilter === 'community')) {
                        // Use getCategoryForType to determine the listing's category
                        // This handles both automatic type mapping and category overrides
                        const listingCategory = normalizeCategoryKey(getCategoryForType(listing.type, listing));
                        matchesType = listingCategory === normalizeCategoryKey(currentAdminTypeFilter);
                        
                        // Debug logging
                        if (listingCategory !== currentAdminTypeFilter) {
                            // This listing doesn't match the selected category
                        }
                    } else {
                        // Direct type match (legacy support)
                        matchesType = listing.type === currentAdminTypeFilter;
                    }
                }
                const matchesArea = !areaFilter || listing.area === areaFilter;
                let matchesAmenity = true;
                if (amenityFilter) {
                    const amenities = Array.isArray(listing.amenities)
                        ? listing.amenities
                        : (listing.amenities ? String(listing.amenities).split(/[,|]/).map(function(a) { return a.trim(); }).filter(Boolean) : []);
                    matchesAmenity = amenities.indexOf(amenityFilter) > -1;
                }
                
                return matchesSearch && matchesType && matchesArea && matchesAmenity;
            });
            
            console.log('📊 filterListings result:', filtered.length, 'of', data.listings.length, 'listings match filter');
            if (currentAdminTypeFilter) {
                console.log('📊 Filtering by category:', currentAdminTypeFilter);
                console.log('📊 Sample filtered types:', filtered.slice(0, 5).map(function(l) {
                    return l.type + ' -> ' + getCategoryForType(l.type, l);
                }).join(', '));
            }
            
            // Update clear button style based on filter state
            updateClearButtonStyle();
            
            renderListings(filtered);
        }
        
        function sortAdminListings() {
            const sortDropdown = document.getElementById('adminSortDropdown');
            if (sortDropdown) {
                currentAdminSort = sortDropdown.value;
                
                // Get currently filtered listings by re-running the filter
                // This will re-render with the new sort
                filterListings();
            }
        }
        
        window.filterAdminByType = function filterAdminByType(typeOrCategory) {
            currentAdminTypeFilter = typeOrCategory === 'community' ? 'attractions' : (typeOrCategory || '');
            currentAdminSubfilter = '';
            
            console.log('🔍 filterAdminByType called with:', typeOrCategory, '| currentAdminTypeFilter:', currentAdminTypeFilter);
            console.log('📋 TYPE_CATEGORIES available:', TYPE_CATEGORIES ? 'YES' : 'NO');
            if (TYPE_CATEGORIES && typeOrCategory) {
                console.log('📋 Category exists in TYPE_CATEGORIES:', TYPE_CATEGORIES[typeOrCategory] ? 'YES' : 'NO');
            }
            
            // Update button active states - only one category should be active at a time
            const buttons = document.querySelectorAll('#adminTab .type-filter-btn');
            buttons.forEach(function(btn) {
                btn.classList.remove('active');
                // Check if it matches by type or category
                if (!currentAdminTypeFilter) {
                    // "All Types" button - activate if no filter
                    if (btn.dataset.type === '' && !btn.dataset.category) {
                        btn.classList.add('active');
                    }
                } else {
                    // Category button - activate if it matches the current filter
                    if (normalizeCategoryKey(btn.dataset.category) === normalizeCategoryKey(currentAdminTypeFilter)) {
                        btn.classList.add('active');
                    }
                }
            });
            
            // Call filterListings to apply the filter
            filterListings();
            // Update clear button style
            updateClearButtonStyle();
            try {
                ensureAdminAttractionsSubmenu(document.querySelector('#adminTab .type-quick-filters'));
            } catch (e) {}
        }
        
        window.handleAdminTypeFilter = function handleAdminTypeFilter() {
            const typeFilter = document.getElementById('adminTypeFilter');
            const value = typeFilter ? typeFilter.value : '';
            
            // Set the type filter to the selected type (direct type match, not category)
            if (value) {
                currentAdminTypeFilter = value;
            } else {
                currentAdminTypeFilter = '';
            }
            
            // Update button active states
            const buttons = document.querySelectorAll('#adminTab .type-filter-btn');
            buttons.forEach(function(btn) {
                btn.classList.remove('active');
                if (!value && btn.dataset.type === '' && !btn.dataset.category) {
                    btn.classList.add('active');
                }
            });
            
            // Call filterListings to apply the filter
            filterListings();
            // Update clear button style
            updateClearButtonStyle();
        }
        
        window.filterByAdminBadge = function filterByAdminBadge(event, filterType, value) {
            event.stopPropagation(); // Prevent card flip
            
            if (filterType === 'type') {
                // Set type filter
                const typeFilter = document.getElementById('adminTypeFilter');
                if (typeFilter) {
                    typeFilter.value = value;
                    handleAdminTypeFilter();
                }
            } else if (filterType === 'area') {
                // Set area filter
                const areaFilter = document.getElementById('adminAreaFilter');
                if (areaFilter) {
                    areaFilter.value = value;
                    filterListings();
                }
            } else if (filterType === 'amenity') {
                // Set amenity filter
                const amenityFilter = document.getElementById('adminAmenityFilter');
                if (amenityFilter) {
                    amenityFilter.value = value;
                    filterListings();
                }
            }
        }
        
        // Function to check if any filter is applied
        function hasActiveFilters() {
            const searchTerm = document.getElementById('adminSearchInput').value.trim();
            const areaFilter = document.getElementById('adminAreaFilter').value;
            const amenityFilter = document.getElementById('adminAmenityFilter').value;
            return searchTerm || areaFilter || amenityFilter || currentAdminTypeFilter;
        }
        
        // Function to update clear button style based on filter state
        function updateClearButtonStyle() {
            const clearButton = document.querySelector('button[onclick="clearAdminFilters()"]');
            if (!clearButton) return;
            
            if (hasActiveFilters()) {
                clearButton.style.display = '';
                clearButton.style.background = '#dc3545';
                clearButton.style.color = 'white';
                clearButton.style.borderColor = '#dc3545';
            } else {
                clearButton.style.display = 'none';
            }
        }
        
        function clearAdminFilters() {
            document.getElementById('adminSearchInput').value = '';
            const typeFilter = document.getElementById('adminTypeFilter');
            if (typeFilter) typeFilter.value = '';
            document.getElementById('adminAreaFilter').value = '';
            document.getElementById('adminAmenityFilter').value = '';
            currentAdminTypeFilter = '';
            
            // Update button style after clearing
            updateClearButtonStyle();
            
            // Reset quick filter buttons - only activate "All Types" button
            // Category buttons have both data-type="" and data-category, so we need to exclude those
            const buttons = document.querySelectorAll('#adminTab .type-filter-btn');
            buttons.forEach(function(btn) {
                btn.classList.remove('active');
                // Only activate "All Types" button: it has data-type="" but NO data-category attribute
                // OR it has the ID adminAllTypesBtn
                if ((btn.id === 'adminAllTypesBtn') || 
                    (btn.dataset.type === '' && !btn.dataset.category)) {
                    btn.classList.add('active');
                }
            });
            
            renderListings(data.listings);
        }
        
        function populateAdminFilters() {
            if (!data || !data.filterOptions) return;
            refreshFilterSelect('adminTypeFilter', data.filterOptions.types);
            refreshFilterSelect('adminAreaFilter', data.filterOptions.areas);
            refreshFilterSelect('adminAmenityFilter', data.filterOptions.amenities);
            
            // Render type filter buttons dynamically based on usage
            if (data.listings) {
                renderAdminTypeFilterButtons(data.listings, '#adminTab .type-quick-filters'); // Show all categories
                
                // Update clear button style after filters are populated
                updateClearButtonStyle();
                
                // Make sure "All Types" button has correct handler after categories are rendered
                // Use ID selector first, then fallback to querySelector
                const allTypesBtn = document.getElementById('adminAllTypesBtn') || 
                                    document.querySelector('#adminTab .type-filter-btn[data-type=""]:not([data-category])');
                if (allTypesBtn) {
                    // Remove any existing onclick handlers
                    allTypesBtn.onclick = null;
                    // Remove any existing event listeners by cloning and replacing
                    const newAllTypesBtn = allTypesBtn.cloneNode(true);
                    allTypesBtn.parentNode.replaceChild(newAllTypesBtn, allTypesBtn);
                    // Set ID on new button
                    newAllTypesBtn.id = 'adminAllTypesBtn';
                    // Add handler
                    newAllTypesBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 All Types button clicked');
                        currentAdminTypeFilter = '';
                        filterAdminByType('');
                    };
                }
            }
        }

        function populatePreviewFilters() {
            if (!data || !data.filterOptions) return;
            refreshFilterSelect('previewAreaFilter', data.filterOptions.areas);
            refreshFilterSelect('previewAmenityFilter', data.filterOptions.amenities);
        }
        
        // Get all categories from TYPE_CATEGORIES
        // Returns ALL categories regardless of whether they have matching types in the data
        // Categories with matching types will have a count > 0
        function getCategoriesByUsage(listings) {
            migrateCommunityToAttractions(TYPE_CATEGORIES);
            if (TYPE_CATEGORIES.community) delete TYPE_CATEGORIES.community;
            // Initialize counts for all categories (0 if no listings)
            const categoryCounts = {};
            const categoryTypesMap = {};
            
            // Track custom categories from Google Sheets that aren't in TYPE_CATEGORIES
            const customCategories = {};
            
            // Initialize all categories from TYPE_CATEGORIES
            for (const categoryKey in TYPE_CATEGORIES) {
                categoryCounts[categoryKey] = 0;
                categoryTypesMap[categoryKey] = [];
            }
            
            // Count listings for each category if we have listings
            // Use category from Google Sheets directly (no auto-assignment)
            if (listings && listings.length > 0) {
                listings.forEach(function(listing) {
                    // Use category from Google Sheets if it exists (simple, direct - no auto-assignment)
                    let listingCategory = null;
                    if (listing.category && listing.category.trim() !== '') {
                        listingCategory = normalizeCategoryKey(listing.category.trim());
                    } else if (listing.type) {
                        listingCategory = normalizeCategoryKey(getCategoryForType(listing.type, listing));
                    }
                    
                    if (listingCategory && listingCategory !== 'community') {
                        if (TYPE_CATEGORIES[listingCategory]) {
                            // Category exists in TYPE_CATEGORIES - count it
                            categoryCounts[listingCategory] = (categoryCounts[listingCategory] || 0) + 1;
                            // Track which types belong to this category
                            if (listing.type && categoryTypesMap[listingCategory].indexOf(listing.type) === -1) {
                                categoryTypesMap[listingCategory].push(listing.type);
                            }
                        } else {
                            // Category exists in Google Sheets but not in TYPE_CATEGORIES
                            // Add it as a custom category so it shows in sidebar
                            if (!customCategories[listingCategory]) {
                        customCategories[listingCategory] = {
                            name: listingCategory,
                            emoji: '⭐',
                            description: 'Custom category from Google Sheets',
                            count: 0,
                            types: []
                        };
                            }
                            customCategories[listingCategory].count++;
                            if (listing.type && customCategories[listingCategory].types.indexOf(listing.type) === -1) {
                                customCategories[listingCategory].types.push(listing.type);
                            }
                        }
                    }
                });
            }
            
            // Add custom categories to TYPE_CATEGORIES temporarily for display
            // (They'll be shown in sidebar but won't persist - admin should add them properly)
            for (const customKey in customCategories) {
                if (customKey === 'community' || normalizeCategoryKey(customKey) === 'attractions') continue;
                if (!TYPE_CATEGORIES[customKey]) {
                    TYPE_CATEGORIES[customKey] = {
                        name: customCategories[customKey].name,
                        emoji: customCategories[customKey].emoji,
                        description: customCategories[customKey].description,
                        types: []
                    };
                    categoryCounts[customKey] = customCategories[customKey].count;
                    categoryTypesMap[customKey] = customCategories[customKey].types;
                    console.log('✅ Added custom category to TYPE_CATEGORIES:', customKey, 'with', customCategories[customKey].count, 'listings');
                }
            }
            
            // Convert all categories to array
            const categoriesArray = Object.keys(TYPE_CATEGORIES).map(function(categoryKey) {
                return {
                    key: categoryKey,
                    category: TYPE_CATEGORIES[categoryKey],
                    count: categoryCounts[categoryKey] || 0,
                    types: categoryTypesMap[categoryKey] || [] // Types found in data for this category
                };
            });
            
            // Sort by count (descending), then by category name (ascending) for ties
            categoriesArray.sort(function(a, b) {
                if (b.count !== a.count) {
                    return b.count - a.count; // Most used first
                }
                return a.key.localeCompare(b.key); // Alphabetical for ties
            });
            
            return categoriesArray;
        }
        
        // Dynamically render category filter buttons
        // Shows ALL categories from TYPE_CATEGORIES regardless of whether they have matching types
        function renderAdminTypeFilterButtons(listings, containerSelector, maxVisible) {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            
            // Get ALL categories (will show all regardless of usage)
            const categoriesByUsage = getCategoriesByUsage(listings || []).filter(function(c) {
                return c && c.key && String(c.key).toLowerCase() !== 'community';
            });
            
            if (categoriesByUsage.length === 0) {
                console.log('⚠️ No categories defined in TYPE_CATEGORIES');
                return;
            }
            
            console.log('📊 Admin: All categories (showing all regardless of usage):', categoriesByUsage.map(function(c) {
                return toSentenceCase(c.key) + ' (' + c.count + ' listings)';
            }).join(', '));
            
            // Show ALL categories - if maxVisible is not specified or is less than total, show all
            // Otherwise respect maxVisible but default to showing all
            const totalCategories = categoriesByUsage.length;
            const effectiveMaxVisible = maxVisible && maxVisible >= totalCategories ? maxVisible : totalCategories;
            
            const visibleCategories = categoriesByUsage.slice(0, effectiveMaxVisible);
            const hiddenCategories = categoriesByUsage.slice(effectiveMaxVisible);
            
            // Clear existing buttons (except "All Types" button)
            const existingButtons = container.querySelectorAll('.type-filter-btn[data-category]:not([data-category=""])');
            existingButtons.forEach(function(btn) {
                btn.remove();
            });
            
            // Remove existing expanded section and see-more button if they exist
            const existingExpanded = container.querySelector('.type-filters-expanded');
            const existingSeeMore = container.querySelector('.type-filter-see-more-btn');
            if (existingExpanded) existingExpanded.remove();
            if (existingSeeMore) existingSeeMore.remove();
            
            // Get the "All Types" button to insert after it
            const allTypeBtn = container.querySelector('.type-filter-btn[data-type=""]');
            
            // Render visible categories - insert them right after the "All Types" button
            visibleCategories.forEach(function(categoryInfo) {
                const btn = document.createElement('button');
                btn.className = 'type-filter-btn category-filter-btn';
                btn.setAttribute('data-category', categoryInfo.key);
                btn.setAttribute('data-type', ''); // Empty to indicate it's a category
                
                // Create button content with icon and name (match frontpage_framer.html icons/<key>.svg)
                const iconSpan = document.createElement('span');
                iconSpan.className = 'category-icon';
                const iconImg = document.createElement('img');
                const baseKey = categoryInfo.key ? String(categoryInfo.key).toLowerCase().split(':')[0] : '';
                iconImg.src = baseKey ? ('icons/' + baseKey + '.svg') : 'icons/all-types.svg';
                iconImg.alt = categoryInfo.category && categoryInfo.category.name ? categoryInfo.category.name : toSentenceCase(categoryInfo.key);
                iconImg.style.cssText = 'width: 24px; height: 24px; display: block;';
                iconSpan.appendChild(iconImg);
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'category-name';
                nameSpan.textContent = toSentenceCase(categoryInfo.key);
                
                btn.appendChild(iconSpan);
                btn.appendChild(nameSpan);
                btn.title = categoryInfo.category.description;
                
                // When clicked, filter by all types in this category
                // Only one category can be active at a time
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check if this category is already active
                    if (currentAdminTypeFilter === categoryInfo.key) {
                        // If clicking the same category, clear the filter and show "All Types"
                        console.log('🔄 Clearing category filter');
                        currentAdminTypeFilter = '';
                        filterAdminByType('');
                    } else {
                        // Clear previous selection and set this category as active
                        console.log('🎯 Filtering by category:', categoryInfo.key, categoryInfo.category.name);
                        currentAdminTypeFilter = categoryInfo.key;
                        filterAdminByType(categoryInfo.key);
                    }
                };
                
                if (allTypeBtn) {
                    // Insert after "All Types" button
                    if (allTypeBtn.nextSibling) {
                        container.insertBefore(btn, allTypeBtn.nextSibling);
                    } else {
                        // If "All Types" button is the last child, append after it
                        container.appendChild(btn);
                    }
                } else {
                    // If no "All Types" button, just append
                    container.appendChild(btn);
                }
            });
            
            // Render hidden categories in expandable section (if there are any)
            if (hiddenCategories.length > 0) {
                const expandedDiv = document.createElement('div');
                expandedDiv.className = 'type-filters-expanded';
                expandedDiv.style.display = 'none';
                
                hiddenCategories.forEach(function(categoryInfo) {
                    const btn = document.createElement('button');
                    btn.className = 'type-filter-btn category-filter-btn';
                    btn.setAttribute('data-category', categoryInfo.key);
                    btn.setAttribute('data-type', '');
                    
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'category-icon';
                    const iconImg = document.createElement('img');
                    const baseKey = categoryInfo.key ? String(categoryInfo.key).toLowerCase().split(':')[0] : '';
                    iconImg.src = baseKey ? ('icons/' + baseKey + '.svg') : 'icons/all-types.svg';
                    iconImg.alt = categoryInfo.category && categoryInfo.category.name ? categoryInfo.category.name : toSentenceCase(categoryInfo.key);
                    iconImg.style.cssText = 'width: 24px; height: 24px; display: block;';
                    iconSpan.appendChild(iconImg);
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'category-name';
                    nameSpan.textContent = categoryInfo.category.name;
                    
                    btn.appendChild(iconSpan);
                    btn.appendChild(nameSpan);
                    btn.title = categoryInfo.category.description;
                    
                    // Only one category can be active at a time
                    btn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if this category is already active
                        if (currentAdminTypeFilter === categoryInfo.key) {
                            // If clicking the same category, clear the filter and show "All Types"
                            console.log('🔄 Clearing category filter (hidden category)');
                            currentAdminTypeFilter = '';
                            filterAdminByType('');
                        } else {
                            // Clear previous selection and set this category as active
                            console.log('🎯 Filtering by category (hidden):', categoryInfo.key, categoryInfo.category.name);
                            currentAdminTypeFilter = categoryInfo.key;
                            filterAdminByType(categoryInfo.key);
                        }
                    };
                    
                    expandedDiv.appendChild(btn);
                });
                
                container.appendChild(expandedDiv);
                
                // Add "See More" button
                const seeMoreBtn = document.createElement('button');
                seeMoreBtn.className = 'type-filter-see-more-btn';
                seeMoreBtn.onclick = function() {
                    toggleAdminTypeFilters();
                };
                seeMoreBtn.innerHTML = '<span class="see-more-text">See More</span><span class="see-less-text" style="display: none;">See Less</span>';
                container.appendChild(seeMoreBtn);
            }

            ensureAdminAttractionsSubmenu(container);
        }
        
        // Toggle "See More" functionality for admin type filters
        function toggleAdminTypeFilters() {
            const container = document.querySelector('#adminTab .type-quick-filters');
            if (!container) return;
            
            const expanded = container.querySelector('.type-filters-expanded');
            const seeMoreBtn = container.querySelector('.type-filter-see-more-btn');
            
            if (expanded && seeMoreBtn) {
                const seeMoreTextSpan = seeMoreBtn.querySelector('.see-more-text');
                const seeLessTextSpan = seeMoreBtn.querySelector('.see-less-text');
                
                if (expanded.style.display === 'none' || !expanded.style.display) {
                    expanded.style.display = 'block';
                    if (seeMoreTextSpan) seeMoreTextSpan.style.display = 'none';
                    if (seeLessTextSpan) seeLessTextSpan.style.display = 'inline';
                } else {
                    expanded.style.display = 'none';
                    if (seeMoreTextSpan) seeMoreTextSpan.style.display = 'inline';
                    if (seeLessTextSpan) seeLessTextSpan.style.display = 'none';
                }
            }
        }
        
        // Make toggleAdminTypeFilters available globally
        window.toggleAdminTypeFilters = toggleAdminTypeFilters;

        function ensureAdminAttractionsSubmenu(container) {
            if (!container) return;
            const attractionsBtn = container.querySelector('.category-filter-btn[data-category="attractions"]')
                || container.querySelector('.category-filter-btn[data-category="community"]');
            if (!attractionsBtn) return;

            let submenu = container.querySelector('.category-submenu.attractions-submenu');
            if (!submenu) {
                submenu = document.createElement('div');
                submenu.className = 'category-submenu attractions-submenu';
                submenu.innerHTML =
                    '<button class="submenu-item" type="button" data-subfilter="attraction">' +
                        '<span class="submenu-icon"><img src="icons/attractions-attraction.svg" alt="" /></span>' +
                        '<span>Attractions</span>' +
                    '</button>' +
                    '<button class="submenu-item" type="button" data-subfilter="shopping">' +
                        '<span class="submenu-icon"><img src="icons/attractions-shopping.svg" alt="" /></span>' +
                        '<span>Shopping</span>' +
                    '</button>' +
                    '<button class="submenu-item" type="button" data-subfilter="resorts">' +
                        '<span class="submenu-icon"><img src="icons/attractions-resorts.svg" alt="" /></span>' +
                        '<span>Resorts</span>' +
                    '</button>';
                submenu.addEventListener('click', function(e) {
                    const item = e.target && e.target.closest ? e.target.closest('.submenu-item') : null;
                    if (!item) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const key = item.getAttribute('data-subfilter') || '';
                    currentAdminTypeFilter = 'attractions';
                    currentAdminSubfilter = currentAdminSubfilter === key ? '' : key;
                    document.querySelectorAll('#adminTab .type-filter-btn').forEach(function(btn) {
                        btn.classList.toggle('active', normalizeCategoryKey(btn.dataset.category) === 'attractions');
                    });
                    submenu.querySelectorAll('.submenu-item').forEach(function(btn) {
                        btn.classList.toggle('active', currentAdminSubfilter && btn === item);
                    });
                    filterListings();
                    updateClearButtonStyle();
                });
            }
            if (attractionsBtn.nextSibling !== submenu) {
                container.insertBefore(submenu, attractionsBtn.nextSibling);
            }
            const show = normalizeCategoryKey(currentAdminTypeFilter) === 'attractions';
            submenu.style.display = show ? 'block' : 'none';
            submenu.querySelectorAll('.submenu-item').forEach(function(btn) {
                btn.classList.toggle('active', show && btn.getAttribute('data-subfilter') === currentAdminSubfilter);
            });
        }
        
        function renderAmenitiesCheckboxes() {
            const container = document.getElementById('amenitiesCheckboxes');
            if (!container) return;
            
            // Ensure data is initialized
            if (typeof data === 'undefined' || !data || !data.filterOptions || !data.filterOptions.amenities) {
                console.warn('Data not initialized yet, skipping renderAmenitiesCheckboxes');
                return;
            }
            
            // Sort amenities alphabetically - CSS Grid with grid-auto-flow: column handles the rest!
            const amenities = data.filterOptions.amenities.slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            
            // Simple rendering - CSS handles column-first flow automatically
            container.innerHTML = amenities.map(function(amenity) {
                const id = 'amenity-' + amenity.replace(/\s+/g, '-').toLowerCase();
                return '<div class="checkbox-item">' +
                    '<input type="checkbox" id="' + id + '" value="' + amenity + '" />' +
                    '<label for="' + id + '" style="font-weight: normal; margin: 0;">' + amenity + '</label>' +
                    '</div>';
            }).join('');
        }
        
        window.openAddModal = function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add New Listing';
            document.getElementById('listingForm').reset();
            document.getElementById('editingId').value = '';
            // Reset address type dropdown
            const addressTypeSelect = document.getElementById('listingAddressType');
            if (addressTypeSelect) addressTypeSelect.value = 'full';
            if (typeof syncListingAddressTypeUi === 'function') {
                syncListingAddressTypeUi();
            }
            // Clear coordinates for new listing
            const latInput = document.getElementById('listingLatitude');
            const lngInput = document.getElementById('listingLongitude');
            const coordsDisplay = document.getElementById('coordsDisplay');
            if (latInput) latInput.value = '';
            if (lngInput) lngInput.value = '';
            if (coordsDisplay) coordsDisplay.style.display = 'none';
            // Event mode off for new listings (form.reset already clears fields)
            if (typeof syncListingEventModeUi === 'function') {
                syncListingEventModeUi();
            }
            // Reset default value for slug auto-generation
            const nameInput = document.getElementById('listingName');
            if (nameInput) nameInput.defaultValue = '';
            // Clear detailed description Quill (reuse instance; do not destroy — same as accordion)
            if (quillDetailedDescription) quillDetailedDescription.root.innerHTML = '';
            const detailedDescriptionTextarea = document.getElementById('listingDetailedDescription');
            if (detailedDescriptionTextarea) {
                detailedDescriptionTextarea.value = '';
            }
            
            // Clear accordion Quill editors (reuse instances; do not destroy toolbars)
            if (quillAccordionPanel1) quillAccordionPanel1.root.innerHTML = '';
            if (quillAccordionPanel2) quillAccordionPanel2.root.innerHTML = '';
            if (quillAccordionPanel3) quillAccordionPanel3.root.innerHTML = '';
            if (quillAccordionPanel4) quillAccordionPanel4.root.innerHTML = '';
            
            const accordionTextareas = ['listingAccordionPanel1Content', 'listingAccordionPanel2Content', 'listingAccordionPanel3Content', 'listingAccordionPanel4Content'];
            accordionTextareas.forEach(function(id) {
                const textarea = document.getElementById(id);
                if (textarea) textarea.value = '';
            });
            // Ensure dropdowns are populated with current options
            updateTypeDropdown();
            updateAreaDropdown();
            updateCategoryDropdown();
            renderAmenitiesCheckboxes();
            
            syncAllListingImagePreviews();
            
            // Set default category (first available category)
            const categoryInput = document.getElementById('listingCategory');
            if (categoryInput) {
                const availableCategories = Object.keys(TYPE_CATEGORIES);
                if (availableCategories.length > 0) {
                    categoryInput.value = availableCategories[0];
                }
            }
            
            // Capture original form data (empty for new listing)
            listingFormOriginalData = captureFormData();
            
            document.getElementById('listingModal').classList.add('active');
            // Initialize Quill editors if not already initialized (same pattern as detailedDescription)
            // Wait a bit longer for modal to be fully visible before initializing accordion editors
            setTimeout(function() {
                if (!quillDetailedDescription) {
                    initializeQuillEditor();
                }
            }, 50);
            // Initialize accordion editors after modal is fully visible
            setTimeout(function() {
                if (!quillAccordionPanel1) {
                    initializeAccordionPanel1Editor();
                }
                if (!quillAccordionPanel2) {
                    initializeAccordionPanel2Editor();
                }
                if (!quillAccordionPanel3) {
                    initializeAccordionPanel3Editor();
                }
                if (!quillAccordionPanel4) {
                    initializeAccordionPanel4Editor();
                }
                // Re-capture form data after all Quill editors are initialized
                setTimeout(function() {
                    listingFormOriginalData = captureFormData();
                }, 100);
            }, 150);
            // Initialize image upload buttons after modal is shown
            setTimeout(function() {
                initImageUploadButtons();
                initDocumentUploadButtons();
            }, 100);
            // Initialize address autocomplete after modal is shown
            setTimeout(function() {
                initializeAddressAutocomplete();
            }, 100);
        }
        
        function editListing(slug) {
            const listing = data.listings.find(function(l) { return l.slug === slug; });
            if (!listing) return;
            
            // Ensure dropdowns are populated with current options
            updateTypeDropdown();
            updateAreaDropdown();
            updateCategoryDropdown();
            renderAmenitiesCheckboxes();
            
            document.getElementById('modalTitle').textContent = 'Edit Listing';
            document.getElementById('editingId').value = slug;
            const nameInput = document.getElementById('listingName');
            nameInput.value = listing.name;
            nameInput.defaultValue = listing.name; // Store original name for slug comparison
            document.getElementById('listingType').value = listing.type;
            document.getElementById('listingArea').value = listing.area;
            document.getElementById('listingDescription').value = listing.description;
            
            // Initialize Quill if not already initialized
            if (!quillDetailedDescription) {
                initializeQuillEditor();
            }
            
            // Set detailedDescription in Quill editor (preserve existing HTML)
            const detailedDescriptionValue = listing.detailedDescription || '';
            const detailedDescriptionTextarea = document.getElementById('listingDetailedDescription');
            if (detailedDescriptionTextarea) {
                detailedDescriptionTextarea.value = detailedDescriptionValue;
            }
            
            // Set content in Quill editor
            if (quillDetailedDescription) {
                // If content is HTML, set it directly; otherwise treat as plain text
                if (detailedDescriptionValue.trim()) {
                    // Check if it looks like HTML
                    if (detailedDescriptionValue.includes('<') && detailedDescriptionValue.includes('>')) {
                        // It's HTML - set it directly
                        quillDetailedDescription.root.innerHTML = detailedDescriptionValue;
                    } else {
                        // It's plain text - convert to HTML paragraphs
                        const lines = detailedDescriptionValue.split('\n').filter(line => line.trim());
                        if (lines.length > 0) {
                            const htmlContent = lines.map(line => `<p>${line}</p>`).join('');
                            quillDetailedDescription.root.innerHTML = htmlContent;
                        } else {
                            quillDetailedDescription.root.innerHTML = '';
                        }
                    }
                } else {
                    quillDetailedDescription.root.innerHTML = '';
                }
            }
            const customHtmlInput = document.getElementById('listingCustomHtml');
            if (customHtmlInput) customHtmlInput.value = listing.customHtml || '';
            const slugInput = document.getElementById('listingSlug');
            // Show the slug if it exists, otherwise show the auto-generated slug
            if (slugInput) {
                slugInput.value = listing.slug || slugify(listing.name || '');
            }
            
            // Set category from Google Sheets - simple, direct (no auto-assignment)
            const categoryInput = document.getElementById('listingCategory');
            if (categoryInput) {
                // Use category from listing (from Google Sheets) - no auto-assignment
                let categoryValue = listing.category || '';
                
                // Ensure category is never empty
                if (!categoryValue) {
                    // Try to get category from type
                    if (listing.type) {
                        categoryValue = getCategoryForType(listing.type, listing);
                    }
                    // If still no category, use first available category as fallback
                    if (!categoryValue) {
                        const availableCategories = Object.keys(TYPE_CATEGORIES);
                        if (availableCategories.length > 0) {
                            categoryValue = availableCategories[0];
                        }
                    }
                }
                
                // Set the value directly (same as type field)
                categoryInput.value = categoryValue;
                console.log('📋 Set category for', listing.name, 'to:', categoryValue, '(from Google Sheets or auto-assigned)');
            }
            const image1Input = document.getElementById('listingImage1');
            if (image1Input) {
                image1Input.value = listing.image1 || '';
                // Store fileId from listing data (if available) for ImageKit metadata updates
                if (listing.image1FileId) {
                    image1Input.dataset.imagekitFileId = listing.image1FileId;
                    console.log('Loaded image1FileId from listing:', listing.image1FileId);
                }
            }
            
            const image2Input = document.getElementById('listingImage2');
            if (image2Input) {
                image2Input.value = listing.image2 || '';
                // Store fileId from listing data (if available) for ImageKit metadata updates
                if (listing.image2FileId) {
                    image2Input.dataset.imagekitFileId = listing.image2FileId;
                    console.log('Loaded image2FileId from listing:', listing.image2FileId);
                }
            }
            
            const image3Input = document.getElementById('listingImage3');
            if (image3Input) {
                image3Input.value = listing.image3 || '';
                // Store fileId from listing data (if available) for ImageKit metadata updates
                if (listing.image3FileId) {
                    image3Input.dataset.imagekitFileId = listing.image3FileId;
                    console.log('Loaded image3FileId from listing:', listing.image3FileId);
                }
            }
            
            syncAllListingImagePreviews();
            
            // Set image descriptions
            const image1DescInput = document.getElementById('listingImage1Desc');
            if (image1DescInput) image1DescInput.value = listing.image1Desc || '';
            const image2DescInput = document.getElementById('listingImage2Desc');
            if (image2DescInput) image2DescInput.value = listing.image2Desc || '';
            const image3DescInput = document.getElementById('listingImage3Desc');
            if (image3DescInput) image3DescInput.value = listing.image3Desc || '';
            document.getElementById('listingWebsite').value = listing.website;
            document.getElementById('listingPhone').value = listing.phone || '';
            // Handle address type dropdown
            const addressTypeSelect = document.getElementById('listingAddressType');
            const addressInput = document.getElementById('listingAddress');
            const bookingSiteText = 'Full address available on booking site';
            if (listing.address === bookingSiteText) {
                if (addressTypeSelect) addressTypeSelect.value = 'booking';
                if (addressInput) {
                    addressInput.value = '';
                    addressInput.style.display = 'none';
                }
            } else {
                if (addressTypeSelect) addressTypeSelect.value = 'full';
                if (addressInput) {
                    addressInput.value = listing.address || '';
                    addressInput.style.display = 'block';
                }
            }
            if (typeof syncListingAddressTypeUi === 'function') {
                syncListingAddressTypeUi();
            }
            // Populate latitude/longitude if available
            const latInput = document.getElementById('listingLatitude');
            const lngInput = document.getElementById('listingLongitude');
            const coordsText = document.getElementById('coordsText');
            if (latInput) latInput.value = listing.latitude || '';
            if (lngInput) lngInput.value = listing.longitude || '';
            if (listing.latitude && listing.longitude && coordsText) {
                coordsText.textContent = '✓ Coordinates loaded from saved data';
                coordsText.style.color = '#28a745';
            } else if (coordsText) {
                coordsText.textContent = 'Coordinates auto-fill when address is selected';
                coordsText.style.color = '#666';
            }
            const authorNameInput = document.getElementById('listingAuthorName');
            if (authorNameInput) authorNameInput.value = listing.authorName || '';
            const publishedInput = document.getElementById('listingPublishedDate');
            if (publishedInput) publishedInput.value = listing.publishedDate ? normalizeDate(listing.publishedDate) : '';
            const modifiedInput = document.getElementById('listingModifiedDate');
            if (modifiedInput) modifiedInput.value = listing.modifiedDate ? normalizeDate(listing.modifiedDate) : '';
            const directionsInput = document.getElementById('listingDirectionsLink');
            // If directions link is empty but address exists, auto-generate it
            // Skip if address is the booking site placeholder
            // (bookingSiteText already declared above)
            if (directionsInput) {
                if (listing.directionsLink && listing.directionsLink.trim()) {
                    directionsInput.value = listing.directionsLink;
                } else if (listing.address && listing.address.trim() && listing.address !== bookingSiteText) {
                    const encodedAddress = encodeURIComponent(listing.address.trim());
                    directionsInput.value = 'https://www.google.com/maps/search/?api=1&query=' + encodedAddress;
                } else {
                    directionsInput.value = '';
                }
            }
            const videoLinkInput = document.getElementById('listingVideoLink');
            if (videoLinkInput) videoLinkInput.value = listing.videoLink || '';
            const document1Input = document.getElementById('listingDocument1');
            if (document1Input) document1Input.value = listing.document1 || '';
            const document1NameInput = document.getElementById('listingDocument1Name');
            if (document1NameInput) document1NameInput.value = listing.document1Name || '';
            const document2Input = document.getElementById('listingDocument2');
            if (document2Input) document2Input.value = listing.document2 || '';
            const document2NameInput = document.getElementById('listingDocument2Name');
            if (document2NameInput) document2NameInput.value = listing.document2Name || '';
            document.getElementById('listingFeatured').checked = listing.featured || false;
            const privateInput = document.getElementById('listingPrivate');
            if (privateInput) privateInput.checked = listing.private || false;
            const isEventInput = document.getElementById('listingIsEvent');
            if (isEventInput) isEventInput.checked = parseListingBool(listing.isEvent);
            const eventStartDateInput = document.getElementById('listingEventStartDate');
            if (eventStartDateInput) eventStartDateInput.value = listing.eventStartDate ? normalizeDate(listing.eventStartDate) : '';
            const eventEndDateInput = document.getElementById('listingEventEndDate');
            if (eventEndDateInput) eventEndDateInput.value = listing.eventEndDate ? normalizeDate(listing.eventEndDate) : '';
            const eventStartTimeInput = document.getElementById('listingEventStartTime');
            if (eventStartTimeInput) eventStartTimeInput.value = listing.eventStartTime || '';
            const eventEndTimeInput = document.getElementById('listingEventEndTime');
            if (eventEndTimeInput) eventEndTimeInput.value = listing.eventEndTime || '';
            const eventAllDayInput = document.getElementById('listingEventAllDay');
            if (eventAllDayInput) eventAllDayInput.checked = parseListingBool(listing.eventAllDay);
            const eventTicketUrlInput = document.getElementById('listingEventTicketUrl');
            if (eventTicketUrlInput) eventTicketUrlInput.value = listing.eventTicketUrl || '';
            const eventCostInput = document.getElementById('listingEventCost');
            if (eventCostInput) eventCostInput.value = listing.eventCost || '';
            const eventVenueNameInput = document.getElementById('listingEventVenueName');
            if (eventVenueNameInput) eventVenueNameInput.value = listing.eventVenueName || '';
            if (typeof syncListingEventModeUi === 'function') {
                syncListingEventModeUi();
            }
            
            // Set accordion fields
            const accordionPanel1TitleInput = document.getElementById('listingAccordionPanel1Title');
            if (accordionPanel1TitleInput) {
                accordionPanel1TitleInput.value = listing.accordionPanel1Title || '';
                // Debug: Log accordion data when editing
                if (listing.accordionPanel1Title && !window._editAccordionDebugLogged) {
                    console.log('🎯 editListing (index-sheets.html) - Accordion data for:', listing.name);
                    console.log('   accordionPanel1Title:', listing.accordionPanel1Title?.substring(0, 50) || '(empty)');
                    console.log('   accordionPanel1Content:', listing.accordionPanel1Content?.substring(0, 50) || '(empty)');
                    console.log('   Setting input value to:', accordionPanel1TitleInput.value?.substring(0, 50) || '(empty)');
                    window._editAccordionDebugLogged = true;
                }
            }
            // Set accordion panel titles immediately
            const accordionPanel2TitleInput = document.getElementById('listingAccordionPanel2Title');
            if (accordionPanel2TitleInput) accordionPanel2TitleInput.value = listing.accordionPanel2Title || '';
            const accordionPanel3TitleInput = document.getElementById('listingAccordionPanel3Title');
            if (accordionPanel3TitleInput) accordionPanel3TitleInput.value = listing.accordionPanel3Title || '';
            const accordionPanel4TitleInput = document.getElementById('listingAccordionPanel4Title');
            if (accordionPanel4TitleInput) accordionPanel4TitleInput.value = listing.accordionPanel4Title || '';
            
            // Initialize accordion Quill editors after modal is visible (they're inside the modal)
            // Then set content after editors are initialized (same pattern as detailedDescription)
            setTimeout(function() {
                // Always reinitialize Quill editors to ensure clean state (containers are cleared in init functions)
                initializeAccordionPanel1Editor();
                initializeAccordionPanel2Editor();
                initializeAccordionPanel3Editor();
                initializeAccordionPanel4Editor();
                
                // Set accordion panel 1 content after editor is initialized
                const accordionPanel1ContentValue = listing.accordionPanel1Content || '';
                const accordionPanel1ContentTextarea = document.getElementById('listingAccordionPanel1Content');
                if (accordionPanel1ContentTextarea) {
                    accordionPanel1ContentTextarea.value = accordionPanel1ContentValue;
                }
                if (quillAccordionPanel1) {
                    if (accordionPanel1ContentValue.trim()) {
                        if (accordionPanel1ContentValue.includes('<') && accordionPanel1ContentValue.includes('>')) {
                            quillAccordionPanel1.root.innerHTML = accordionPanel1ContentValue;
                        } else {
                            const lines = accordionPanel1ContentValue.split('\n').filter(line => line.trim());
                            if (lines.length > 0) {
                                quillAccordionPanel1.root.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
                            } else {
                                quillAccordionPanel1.root.innerHTML = '';
                            }
                        }
                    } else {
                        quillAccordionPanel1.root.innerHTML = '';
                    }
                }
                
                // Set accordion panel 2 content after editor is initialized
                const accordionPanel2ContentValue = listing.accordionPanel2Content || '';
                const accordionPanel2ContentTextarea = document.getElementById('listingAccordionPanel2Content');
                if (accordionPanel2ContentTextarea) {
                    accordionPanel2ContentTextarea.value = accordionPanel2ContentValue;
                }
                if (quillAccordionPanel2) {
                    if (accordionPanel2ContentValue.trim()) {
                        if (accordionPanel2ContentValue.includes('<') && accordionPanel2ContentValue.includes('>')) {
                            quillAccordionPanel2.root.innerHTML = accordionPanel2ContentValue;
                        } else {
                            const lines = accordionPanel2ContentValue.split('\n').filter(line => line.trim());
                            if (lines.length > 0) {
                                quillAccordionPanel2.root.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
                            } else {
                                quillAccordionPanel2.root.innerHTML = '';
                            }
                        }
                    } else {
                        quillAccordionPanel2.root.innerHTML = '';
                    }
                }
                
                // Set accordion panel 3 content after editor is initialized
                const accordionPanel3ContentValue = listing.accordionPanel3Content || '';
                const accordionPanel3ContentTextarea = document.getElementById('listingAccordionPanel3Content');
                if (accordionPanel3ContentTextarea) {
                    accordionPanel3ContentTextarea.value = accordionPanel3ContentValue;
                }
                if (quillAccordionPanel3) {
                    if (accordionPanel3ContentValue.trim()) {
                        if (accordionPanel3ContentValue.includes('<') && accordionPanel3ContentValue.includes('>')) {
                            quillAccordionPanel3.root.innerHTML = accordionPanel3ContentValue;
                        } else {
                            const lines = accordionPanel3ContentValue.split('\n').filter(line => line.trim());
                            if (lines.length > 0) {
                                quillAccordionPanel3.root.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
                            } else {
                                quillAccordionPanel3.root.innerHTML = '';
                            }
                        }
                    } else {
                        quillAccordionPanel3.root.innerHTML = '';
                    }
                }
                
                // Set accordion panel 4 content after editor is initialized
                const accordionPanel4ContentValue = listing.accordionPanel4Content || '';
                const accordionPanel4ContentTextarea = document.getElementById('listingAccordionPanel4Content');
                if (accordionPanel4ContentTextarea) {
                    accordionPanel4ContentTextarea.value = accordionPanel4ContentValue;
                }
                if (quillAccordionPanel4) {
                    if (accordionPanel4ContentValue.trim()) {
                        if (accordionPanel4ContentValue.includes('<') && accordionPanel4ContentValue.includes('>')) {
                            quillAccordionPanel4.root.innerHTML = accordionPanel4ContentValue;
                        } else {
                            const lines = accordionPanel4ContentValue.split('\n').filter(line => line.trim());
                            if (lines.length > 0) {
                                quillAccordionPanel4.root.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
                            } else {
                                quillAccordionPanel4.root.innerHTML = '';
                            }
                        }
                    } else {
                        quillAccordionPanel4.root.innerHTML = '';
                    }
                }
            }, 100);
            
            // Set googleMapsUrl if it exists
            const googleMapsUrlInput = document.getElementById('listingGoogleMapsUrl');
            if (googleMapsUrlInput) googleMapsUrlInput.value = listing.googleMapsUrl || '';
            
            const checkboxes = document.querySelectorAll('#amenitiesCheckboxes input[type="checkbox"]');
            const listingAmenities = Array.isArray(listing.amenities)
                ? listing.amenities
                : (listing.amenities ? String(listing.amenities).split(/[,|]/).map(function(a) { return a.trim(); }).filter(Boolean) : []);
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = listingAmenities.indexOf(checkbox.value) > -1;
            });
            
            // Capture original form data after populating all fields
            setTimeout(function() {
                listingFormOriginalData = captureFormData();
            }, 200);
            
            document.getElementById('listingModal').classList.add('active');
            // Initialize Quill editors if not already initialized (same pattern as detailedDescription)
            // Wait a bit longer for modal to be fully visible before initializing accordion editors
            setTimeout(function() {
                if (!quillDetailedDescription) {
                    initializeQuillEditor();
                }
            }, 50);
            // Initialize accordion editors after modal is fully visible
            setTimeout(function() {
                if (!quillAccordionPanel1) {
                    initializeAccordionPanel1Editor();
                }
                if (!quillAccordionPanel2) {
                    initializeAccordionPanel2Editor();
                }
                if (!quillAccordionPanel3) {
                    initializeAccordionPanel3Editor();
                }
                if (!quillAccordionPanel4) {
                    initializeAccordionPanel4Editor();
                }
                // Re-capture form data after all Quill editors are initialized
                setTimeout(function() {
                    listingFormOriginalData = captureFormData();
                }, 100);
            }, 150);
            // Re-initialize image upload buttons after modal is shown
            setTimeout(function() {
                initImageUploadButtons();
                initDocumentUploadButtons();
            }, 100);
            // Initialize address autocomplete after modal is shown
            setTimeout(function() {
                initializeAddressAutocomplete();
            }, 100);
        }
        
        async function deleteListing(slug) {
            const listingIndex = data.listings.findIndex(function(l) { return l.slug === slug; });
            const listing = listingIndex >= 0 ? data.listings[listingIndex] : null;
            
            if (!listing) {
                alert('Listing not found!');
                return;
            }

            if (deletingSlugs[slug]) {
                return;
            }
            
            // Check if this is the confirmation click
            if (deleteConfirmId === slug) {
                // Confirmed - delete it
                clearDeleteConfirm();
                captureAllVisibleTableRowDrafts();
                applyAllTableRowDrafts();
                tableRowDrafts = {};
                deletingSlugs[slug] = true;

                const listingSnapshot = listing;
                const restoreIndex = listingIndex;
                const listingName = listing.name || 'Listing';

                try {
                    // Local-only listing (not yet saved to Google Sheets): delete locally only
                    if (listing._localOnly) {
                        removeListingFromLocalData(slug);
                        console.log('🗑️ Local-only delete for', listingName);
                        updateSyncStatus(true, 'Deleted locally; not saved to Google Sheets yet.');
                        showUnsavedChangesBadge();
                        refreshListingsAfterDelete();
                        showAdminNotice({
                            tone: 'success',
                            title: 'Deleted locally',
                            body: '<strong>' + escapeHtml(listingName) + '</strong> was removed from this admin view.<br><br>Click <strong>Save to Sheets</strong> when you are ready to sync.',
                            buttonLabel: 'Got it'
                        });
                        return;
                    }
                    
                    // Delete from Google Sheets if configured
                    if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                        // Optimistic UI: remove from the grid immediately, restore only on real failure.
                        removeListingFromLocalData(slug);
                        refreshListingsAfterDelete();
                        updateSyncStatus(false, 'Deleting "' + listingName + '"…');
                        const actionStatus = document.getElementById('sheetsActionStatus');
                        if (actionStatus) {
                            actionStatus.textContent = 'Deleting "' + listingName + '"…';
                            actionStatus.className = 'tabs-action-status';
                        }

                        try {
                            let result = { success: false };
                            
                            // Use GET request to avoid CORS preflight (OPTIONS) issues
                            // GET requests don't trigger CORS preflight, so they work even if OPTIONS fails
                            try {
                                const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                                const tokenParam = session && session.token ? ('&token=' + encodeURIComponent(session.token)) : '';
                                const deleteUrl = GOOGLE_APPS_SCRIPT_URL + '?action=deleteListing&listingSlug=' + encodeURIComponent(slug) + tokenParam + '&t=' + Date.now();
                                const response = await fetch(deleteUrl, {
                                    method: 'GET',
                                    mode: 'cors'
                                });
                                
                                if (!response.ok) {
                                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                                }
                                
                                const responseText = await response.text();
                                if (!responseText || responseText.trim() === '') {
                                    throw new Error('Empty response from server');
                                }
                                
                                result = JSON.parse(responseText);
                                console.log('Delete response:', result);
                                
                                // Verify we got a valid response
                                if (!result || typeof result.success === 'undefined') {
                                    throw new Error('Invalid response format from server');
                                }
                            } catch (fetchError) {
                                console.error('Error deleting from Google Sheets:', fetchError);
                                throw new Error('Failed to delete from Google Sheets: ' + fetchError.message);
                            }
                            
                            const alreadyGone = !result.success && isSheetsDeleteAlreadyGoneError(result.error);
                            if (result.success || alreadyGone) {
                                console.log(alreadyGone
                                    ? 'ℹ️ Listing already gone from Sheets; kept local removal:'
                                    : '✅ Delete confirmed successful:', result);
                                
                                updateSyncStatus(true, alreadyGone
                                    ? 'Already deleted in Google Sheets.'
                                    : 'Deleted from Google Sheets.');
                                showUnsavedChangesBadge();
                            } else {
                                const errorMsg = result && result.error ? result.error : 'Delete failed - unknown error';
                                console.error('❌ Delete failed:', errorMsg);
                                console.error('Full result:', result);
                                throw new Error(errorMsg);
                            }
                        } catch (error) {
                            console.error('❌ Error deleting from Google Sheets:', error);
                            console.error('Error details:', error.message, error.stack);

                            // If Sheets says the row is already gone, keep the optimistic removal.
                            if (isSheetsDeleteAlreadyGoneError(error.message)) {
                                updateSyncStatus(true, 'Already deleted in Google Sheets.');
                                showUnsavedChangesBadge();
                                return;
                            }

                            // Real failure: put the listing back where it was.
                            restoreListingToLocalData(listingSnapshot, restoreIndex);
                            refreshListingsAfterDelete();
                            updateSyncStatus(false, 'Delete failed: ' + error.message);
                            alert('❌ Failed to delete from Google Sheets: ' + error.message + '\n\n' +
                                  'The listing was restored in this view. Please try again or check the Google Apps Script logs.\n\n' +
                                  'If the problem persists, you can delete it directly in Google Sheets.');
                        }
                    } else {
                        // No Google Sheets configured - delete locally only
                        removeListingFromLocalData(slug);
                        updateSyncStatus(false, 'Deleted locally only (Google Sheets not configured).');
                        refreshListingsAfterDelete();
                        showAdminNotice({
                            tone: 'warning',
                            title: 'Deleted locally',
                            body: '<strong>' + escapeHtml(listingName) + '</strong> was removed from this admin view only.<br><br>Google Sheets is not configured, so this change was not synced.',
                            buttonLabel: 'Got it'
                        });
                    }
                } finally {
                    delete deletingSlugs[slug];
                }
                
            } else {
                beginDeleteConfirm(slug);
            }
        }
        
        function uniqueCopySlug(baseSlug) {
            const root = slugify(String(baseSlug || 'listing').replace(/-copy(-\d+)?$/i, '')) || 'listing';
            return ensureUniqueSlug(root + '-copy');
        }

        function duplicateListing(slug) {
            const listing = data.listings.find(function(l) { return l.slug === slug; });
            
            if (!listing) {
                alert('Listing not found!');
                return;
            }
            
            // Create a deep copy of the listing
            const duplicate = JSON.parse(JSON.stringify(listing));
            
            // Modify the name to indicate it's a duplicate
            duplicate.name = (listing.name || 'Untitled Listing') + ' (Copy)';
            
            // Always mint a unique slug — never reuse the source listing's slug
            const baseSlug = listing.slug || listing.name || 'listing';
            duplicate.slug = uniqueCopySlug(baseSlug);
            if (isSlugTaken(duplicate.slug)) {
                duplicate.slug = ensureUniqueSlug(duplicate.slug || 'listing');
            }
            
            // Fresh timestamps for the new listing
            duplicate.publishedDate = getLocalDateYYYYMMDD();
            duplicate.modifiedDate = getLocalDateTimeISO();

            // Add to the listings array
            duplicate._localOnly = true; // Not yet saved to Google Sheets
            data.listings.push(duplicate);
            
            // Re-render the list to show the new duplicate
            try {
                if (typeof filterListings === 'function') filterListings();
                else renderListings();
            } catch (err) {
                console.warn('Duplicate refresh failed:', err);
                renderListings(data.listings);
            }
            showUnsavedChangesBadge();
            updateSyncStatus(true, '"' + duplicate.name + '" duplicated locally. Save the form, then Save to Sheets.');
            
            // Open the duplicate for editing (skip blocking alert so Save works immediately)
            setTimeout(function() {
                editListing(duplicate.slug);
            }, 50);
        }
        window.duplicateListing = duplicateListing;
        
        function saveListing(event) {
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }

            // Booking-site mode must not leave a hidden required address field.
            if (typeof syncListingAddressTypeUi === 'function') {
                syncListingAddressTypeUi();
            }
            // Event mode must not leave a hidden required start-date field.
            if (typeof syncListingEventModeUi === 'function') {
                syncListingEventModeUi();
            }

            const form = document.getElementById('listingForm');
            // Prefer focusing the first invalid *visible* control (avoids
            // "invalid form control … is not focusable" on hidden fields).
            if (form) {
                const invalid = form.querySelector(':invalid');
                if (invalid) {
                    const hidden = invalid.offsetParent === null ||
                        (invalid.style && invalid.style.display === 'none') ||
                        invalid.getAttribute('aria-hidden') === 'true';
                    if (hidden) {
                        invalid.required = false;
                        invalid.removeAttribute('required');
                    } else {
                        if (typeof form.reportValidity === 'function') {
                            form.reportValidity();
                        } else if (typeof invalid.focus === 'function') {
                            invalid.focus();
                        }
                        return;
                    }
                    // Re-check after clearing a hidden required control
                    const stillInvalid = form.querySelector(':invalid');
                    if (stillInvalid) {
                        if (typeof form.reportValidity === 'function') {
                            form.reportValidity();
                        }
                        return;
                    }
                }
            }

            const getValue = function(id) {
                const el = document.getElementById(id);
                return el ? el.value : '';
            };
            
            const getChecked = function(id) {
                const el = document.getElementById(id);
                return el ? el.checked : false;
            };

            // Address is required only for "Full Address" mode (not booking-site).
            const addressTypeEl = document.getElementById('listingAddressType');
            const addressType = addressTypeEl ? addressTypeEl.value : 'full';
            if (addressType !== 'booking') {
                const addressVal = String(getValue('listingAddress') || '').trim();
                if (!addressVal) {
                    alert('⚠️ Please enter an address, or choose "Full address available on booking site".');
                    const addressInput = document.getElementById('listingAddress');
                    if (addressInput) {
                        addressInput.focus();
                        addressInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                    return;
                }
            }

            const isEvent = getChecked('listingIsEvent');
            if (isEvent) {
                const eventStartDateVal = String(getValue('listingEventStartDate') || '').trim();
                if (!eventStartDateVal) {
                    alert('⚠️ Please enter an event start date, or turn off Event mode.');
                    const eventStartDateInput = document.getElementById('listingEventStartDate');
                    if (eventStartDateInput) {
                        eventStartDateInput.focus();
                        eventStartDateInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                    return;
                }
            }
            
            const checkboxes = document.querySelectorAll('#amenitiesCheckboxes input[type="checkbox"]:checked');
            const selectedAmenities = [];
            checkboxes.forEach(function(cb) { selectedAmenities.push(cb.value); });
            
            const editingSlug = document.getElementById('editingId').value;
            const isUpdate = !!editingSlug;
            const existingListing = isUpdate ? data.listings.find(function(l) { return l.slug === editingSlug; }) : null;
            
            // Get category - handle EXACTLY like type (simple, direct, no normalization)
            // Type: getValue('listingType') - no transformation
            // Category: getValue('listingCategory') - same approach
            let categoryValue = getValue('listingCategory');
            
            // Category is required (do not auto-assign silently)
            if (!categoryValue || categoryValue.trim() === '') {
                alert('⚠️ Please select a Category (Taste / Stay / Outdoor / etc) before saving.');
                const categorySelect = document.getElementById('listingCategory');
                if (categorySelect) {
                    categorySelect.focus();
                    categorySelect.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
                return;
            }

            const hasMeaningfulRichText = function(value) {
                if (value === undefined || value === null) return false;
                const str = String(value).trim();
                if (!str) return false;
                // If it's HTML-ish, strip tags and check text content (Quill empty often = <p><br></p>)
                if (str.includes('<') && str.includes('>')) {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = str;
                    const text = (tmp.textContent || '').replace(/\u00A0/g, ' ').trim();
                    // Treat as meaningful if there is visible text OR an image/embed/link element
                    if (text) return true;
                    if (tmp.querySelector('img, video, iframe, embed, object, a')) return true;
                    return false;
                }
                return true;
            };

            const requireAccordionTitlesIfContent = function() {
                const panels = [
                    { idx: 1, titleId: 'listingAccordionPanel1Title', getContent: () => (quillAccordionPanel1 ? quillAccordionPanel1.root.innerHTML : getValue('listingAccordionPanel1Content')) },
                    { idx: 2, titleId: 'listingAccordionPanel2Title', getContent: () => (quillAccordionPanel2 ? quillAccordionPanel2.root.innerHTML : getValue('listingAccordionPanel2Content')) },
                    { idx: 3, titleId: 'listingAccordionPanel3Title', getContent: () => (quillAccordionPanel3 ? quillAccordionPanel3.root.innerHTML : getValue('listingAccordionPanel3Content')) },
                    { idx: 4, titleId: 'listingAccordionPanel4Title', getContent: () => (quillAccordionPanel4 ? quillAccordionPanel4.root.innerHTML : getValue('listingAccordionPanel4Content')) }
                ];
                
                for (const panel of panels) {
                    const contentVal = panel.getContent();
                    if (!hasMeaningfulRichText(contentVal)) continue;
                    const titleEl = document.getElementById(panel.titleId);
                    const titleVal = titleEl ? String(titleEl.value || '').trim() : '';
                    if (!titleVal) {
                        alert(`⚠️ Accordion Panel ${panel.idx} has content, but no title.\n\nPlease add a title or clear the panel content.`);
                        if (titleEl) {
                            titleEl.focus();
                            titleEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }
                        return false;
                    }
                }
                return true;
            };

            const requireDocumentNamesIfUrlPresent = function() {
                const docPairs = [
                    { idx: 1, urlId: 'listingDocument1', nameId: 'listingDocument1Name' },
                    { idx: 2, urlId: 'listingDocument2', nameId: 'listingDocument2Name' }
                ];
                
                for (const doc of docPairs) {
                    const urlVal = String(getValue(doc.urlId) || '').trim();
                    if (!urlVal) continue;
                    const nameEl = document.getElementById(doc.nameId);
                    const nameVal = nameEl ? String(nameEl.value || '').trim() : '';
                    if (!nameVal) {
                        alert(`⚠️ Document ${doc.idx} has a URL, but no name.\n\nPlease add a name (button text) or clear the URL.`);
                        if (nameEl) {
                            nameEl.focus();
                            nameEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }
                        return false;
                    }
                }
                return true;
            };

            const requireImageDescsIfUrlPresent = function() {
                const imagePairs = [
                    { idx: 1, urlId: 'listingImage1', descId: 'listingImage1Desc' },
                    { idx: 2, urlId: 'listingImage2', descId: 'listingImage2Desc' },
                    { idx: 3, urlId: 'listingImage3', descId: 'listingImage3Desc' }
                ];

                for (const img of imagePairs) {
                    const urlVal = String(getValue(img.urlId) || '').trim();
                    if (!urlVal) continue;
                    const descEl = document.getElementById(img.descId);
                    const descVal = descEl ? String(descEl.value || '').trim() : '';
                    if (!descVal) {
                        alert(`⚠️ Image ${img.idx} has a URL, but no alt text.\n\nPlease add alt text (or use Generate ALT text) or clear the image URL.`);
                        if (descEl) {
                            descEl.focus();
                            descEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }
                        return false;
                    }
                }
                return true;
            };

            if (!requireAccordionTitlesIfContent()) {
                return;
            }
            if (!requireDocumentNamesIfUrlPresent()) {
                return;
            }
            if (!requireImageDescsIfUrlPresent()) {
                return;
            }
            
            // Get fileIds from dataset attributes (stored during upload or loaded from listing data)
            const image1Field = document.getElementById('listingImage1');
            const image2Field = document.getElementById('listingImage2');
            const image3Field = document.getElementById('listingImage3');
            
            const listingUpdates = {
                name: getValue('listingName'),
                slug: getValue('listingSlug'),
                type: getValue('listingType'), // Simple, direct - no normalization
                area: getValue('listingArea'),
                description: getValue('listingDescription'),
                detailedDescription: quillDetailedDescription ? quillDetailedDescription.root.innerHTML : getValue('listingDetailedDescription'),
                customHtml: getValue('listingCustomHtml'),
                image1: getValue('listingImage1'),
                image2: getValue('listingImage2'),
                image3: getValue('listingImage3'),
                image1Desc: getValue('listingImage1Desc'),
                image2Desc: getValue('listingImage2Desc'),
                image3Desc: getValue('listingImage3Desc'),
                // Store fileIds for ImageKit metadata updates (preserved when duplicating)
                image1FileId: image1Field && image1Field.dataset.imagekitFileId ? image1Field.dataset.imagekitFileId : (existingListing && existingListing.image1FileId ? existingListing.image1FileId : undefined),
                image2FileId: image2Field && image2Field.dataset.imagekitFileId ? image2Field.dataset.imagekitFileId : (existingListing && existingListing.image2FileId ? existingListing.image2FileId : undefined),
                image3FileId: image3Field && image3Field.dataset.imagekitFileId ? image3Field.dataset.imagekitFileId : (existingListing && existingListing.image3FileId ? existingListing.image3FileId : undefined),
                website: getValue('listingWebsite'),
                phone: getValue('listingPhone'),
                address: (() => {
                    const addressType = document.getElementById('listingAddressType')?.value;
                    if (addressType === 'booking') {
                        return 'Full address available on booking site';
                    }
                    return getValue('listingAddress');
                })(),
                latitude: (() => {
                    const val = getValue('listingLatitude');
                    return val ? parseFloat(val) : null;
                })(),
                longitude: (() => {
                    const val = getValue('listingLongitude');
                    return val ? parseFloat(val) : null;
                })(),
                amenities: selectedAmenities,
                featured: getChecked('listingFeatured'),
                private: getChecked('listingPrivate'),
                isEvent: isEvent,
                eventStartDate: isEvent ? getValue('listingEventStartDate') : '',
                eventEndDate: isEvent ? getValue('listingEventEndDate') : '',
                eventStartTime: isEvent && !getChecked('listingEventAllDay') ? getValue('listingEventStartTime') : '',
                eventEndTime: isEvent && !getChecked('listingEventAllDay') ? getValue('listingEventEndTime') : '',
                eventAllDay: isEvent ? getChecked('listingEventAllDay') : false,
                eventTicketUrl: isEvent ? getValue('listingEventTicketUrl') : '',
                eventCost: isEvent ? getValue('listingEventCost') : '',
                eventVenueName: isEvent ? getValue('listingEventVenueName') : '',
                authorName: getValue('listingAuthorName'),
                publishedDate: getValue('listingPublishedDate'),
                modifiedDate: getLocalDateTimeISO(),
                directionsLink: getValue('listingDirectionsLink'),
                googleMapsUrl: getValue('listingDirectionsLink'),
                videoLink: getValue('listingVideoLink'),
                document1: getValue('listingDocument1'),
                document1Name: getValue('listingDocument1Name'),
                document2: getValue('listingDocument2'),
                document2Name: getValue('listingDocument2Name'),
                category: categoryValue, // Always has a value (validated above)
                accordionPanel1Title: getValue('listingAccordionPanel1Title'),
                accordionPanel1Content: quillAccordionPanel1 ? quillAccordionPanel1.root.innerHTML : getValue('listingAccordionPanel1Content'),
                accordionPanel2Title: getValue('listingAccordionPanel2Title'),
                accordionPanel2Content: quillAccordionPanel2 ? quillAccordionPanel2.root.innerHTML : getValue('listingAccordionPanel2Content'),
                accordionPanel3Title: getValue('listingAccordionPanel3Title'),
                accordionPanel3Content: quillAccordionPanel3 ? quillAccordionPanel3.root.innerHTML : getValue('listingAccordionPanel3Content'),
                accordionPanel4Title: getValue('listingAccordionPanel4Title'),
                accordionPanel4Content: quillAccordionPanel4 ? quillAccordionPanel4.root.innerHTML : getValue('listingAccordionPanel4Content')
            };
            
            const listing = sanitizeListing(Object.assign({}, existingListing || {}, listingUpdates));
            
            const editingIndex = isUpdate
                ? data.listings.findIndex(function(l) { return l.slug === editingSlug; })
                : -1;
            const slugOptions = { excludeIndex: editingIndex >= 0 ? editingIndex : undefined };

            if (!listing.slug && listing.name) {
                listing.slug = ensureUniqueSlug(listing.name, slugOptions);
            } else if (listing.slug) {
                listing.slug = slugify(listing.slug) || String(listing.slug).trim();
            }

            if (!listing.slug) {
                alert('⚠️ Please enter a slug (or a name so one can be generated).');
                const slugInput = document.getElementById('listingSlug');
                if (slugInput) {
                    slugInput.focus();
                    slugInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
                return;
            }

            if (isSlugTaken(listing.slug, slugOptions)) {
                const conflictIndex = data.listings.findIndex(function(l, index) {
                    if (editingIndex >= 0 && index === editingIndex) return false;
                    return normalizeSlugKey(l && l.slug) === normalizeSlugKey(listing.slug);
                });
                const conflict = conflictIndex >= 0 ? data.listings[conflictIndex] : null;
                alert(
                    '⚠️ That slug is already used by another listing.\n\n' +
                    'Slug: "' + listing.slug + '"\n' +
                    (conflict ? 'Used by: ' + (conflict.name || conflict.slug) + '\n\n' : '\n') +
                    'Please choose a unique slug before saving.'
                );
                const slugInput = document.getElementById('listingSlug');
                if (slugInput) {
                    slugInput.value = listing.slug;
                    slugInput.focus();
                    slugInput.select();
                    slugInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
                return;
            }

            // Preserve local-only flag for duplicates / new listings until Save to Sheets
            if (existingListing && existingListing._localOnly) {
                listing._localOnly = true;
            }
            
            // Save locally only - user must click "Save to Sheets" to sync
            if (isUpdate) {
                const index = data.listings.findIndex(function(l) { return l.slug === editingSlug; });
                if (index >= 0) {
                    data.listings[index] = listing;
                    updateSyncStatus(true, '"' + listing.name + '" updated locally.');
                } else {
                    listing._localOnly = true;
                    data.listings.push(listing);
                    updateSyncStatus(true, '"' + listing.name + '" added locally.');
                }
            } else {
                listing._localOnly = true;
                data.listings.push(listing);
                updateSyncStatus(true, '"' + listing.name + '" added locally.');
            }
            
            // Update ImageKit metadata for all images that have descriptions and ImageKit URLs
            // This ensures descriptions are synced to ImageKit when saving
            async function syncImageDescriptionsToImageKit() {
                const imageFields = ['listingImage1', 'listingImage2', 'listingImage3'];
                const descFields = ['listingImage1Desc', 'listingImage2Desc', 'listingImage3Desc'];
                
                for (let i = 0; i < imageFields.length; i++) {
                    const imageField = document.getElementById(imageFields[i]);
                    const descField = document.getElementById(descFields[i]);
                    
                    if (!imageField || !descField) continue;
                    
                    const imageUrl = imageField.value.trim();
                    const description = descField.value.trim();
                    
                    // Only update if both description and image URL are present and it's an ImageKit URL
                    if (description && imageUrl && imageUrl.includes('ik.imagekit.io')) {
                        try {
                            // Try to get fileId from multiple sources:
                            // 1. From the image input's data attribute (stored during upload or loaded from listing)
                            // 2. From the current listing data (for duplicated listings)
                            // 3. From the existing listing data (if available)
                            const storedFileId = imageField.dataset.imagekitFileId || null;
                            const listingFileIdKey = imageFields[i] === 'listingImage1' ? 'image1FileId' : 
                                                     imageFields[i] === 'listingImage2' ? 'image2FileId' : 
                                                     imageFields[i] === 'listingImage3' ? 'image3FileId' : null;
                            // Check the listing we're about to save (includes fileIds from duplicate)
                            const currentListingFileId = listingFileIdKey && listing[listingFileIdKey] ? listing[listingFileIdKey] : null;
                            // Also check the existing listing (for updates)
                            const existingListingFileId = listingFileIdKey && existingListing && existingListing[listingFileIdKey] ? existingListing[listingFileIdKey] : null;
                            // Use the most reliable source: stored in DOM > current listing > existing listing
                            const fileIdToUse = storedFileId || currentListingFileId || existingListingFileId || null;
                            
                            console.log('Syncing ImageKit metadata on save:', {
                                image: imageUrl.substring(0, 50) + '...',
                                description: description.substring(0, 50) + '...',
                                fileId: fileIdToUse || 'not available (will search by path)',
                                source: storedFileId ? 'DOM' : (currentListingFileId ? 'current listing' : (existingListingFileId ? 'existing listing' : 'none'))
                            });
                            
                            // Update ImageKit metadata - if fileId is not available, search by path
                            await updateImageKitMetadata(imageUrl, description, fileIdToUse);
                            
                            console.log('✅ ImageKit metadata synced for', imageFields[i]);
                        } catch (error) {
                            console.warn('Failed to sync ImageKit metadata for', imageFields[i], ':', error);
                            // Don't fail the save if ImageKit update fails
                        }
                    }
                }
            }
            
            // Sync image descriptions to ImageKit (don't await - do it in background)
            syncImageDescriptionsToImageKit().catch(function(error) {
                console.warn('Some ImageKit metadata syncs may have failed:', error);
            });
            
            // Clear original data since we saved — always close even if refresh throws
            listingFormOriginalData = null;
            try {
                applyFilterOptionCleanup();
                if (typeof filterListings === 'function') filterListings();
                else renderListings();
                showUnsavedChangesBadge();
            } catch (refreshErr) {
                console.error('Post-save refresh failed:', refreshErr);
                try { renderListings(data.listings); } catch (e2) {}
                try { showUnsavedChangesBadge(); } catch (e3) {}
            }
            closeModal(true); // Force close since we just saved
        }
        window.saveListing = saveListing;
        
        // Capture current form data as a snapshot
        function captureFormData() {
            const form = document.getElementById('listingForm');
            if (!form) return null;
            
            const getValue = function(id) {
                const el = document.getElementById(id);
                if (!el) return '';
                if (el.type === 'checkbox') return el.checked;
                return el.value || '';
            };
            
            const getChecked = function(selector) {
                const checkboxes = document.querySelectorAll(selector + ':checked');
                return Array.from(checkboxes).map(cb => cb.value);
            };
            
            return {
                name: getValue('listingName'),
                slug: getValue('listingSlug'),
                type: getValue('listingType'),
                category: getValue('listingCategory'),
                area: getValue('listingArea'),
                description: getValue('listingDescription'),
                detailedDescription: quillDetailedDescription ? quillDetailedDescription.root.innerHTML : getValue('listingDetailedDescription'),
                customHtml: getValue('listingCustomHtml'),
                image1: getValue('listingImage1'),
                image1Desc: getValue('listingImage1Desc'),
                image2: getValue('listingImage2'),
                image2Desc: getValue('listingImage2Desc'),
                image3: getValue('listingImage3'),
                image3Desc: getValue('listingImage3Desc'),
                website: getValue('listingWebsite'),
                phone: getValue('listingPhone'),
                address: getValue('listingAddress'),
                addressType: getValue('listingAddressType'),
                authorName: getValue('listingAuthorName'),
                publishedDate: getValue('listingPublishedDate'),
                modifiedDate: getValue('listingModifiedDate'),
                directionsLink: getValue('listingDirectionsLink'),
                videoLink: getValue('listingVideoLink'),
                document1: getValue('listingDocument1'),
                document1Name: getValue('listingDocument1Name'),
                document2: getValue('listingDocument2'),
                document2Name: getValue('listingDocument2Name'),
                accordionPanel1Title: getValue('listingAccordionPanel1Title'),
                accordionPanel1Content: quillAccordionPanel1 ? quillAccordionPanel1.root.innerHTML : getValue('listingAccordionPanel1Content'),
                accordionPanel2Title: getValue('listingAccordionPanel2Title'),
                accordionPanel2Content: quillAccordionPanel2 ? quillAccordionPanel2.root.innerHTML : getValue('listingAccordionPanel2Content'),
                accordionPanel3Title: getValue('listingAccordionPanel3Title'),
                accordionPanel3Content: quillAccordionPanel3 ? quillAccordionPanel3.root.innerHTML : getValue('listingAccordionPanel3Content'),
                accordionPanel4Title: getValue('listingAccordionPanel4Title'),
                accordionPanel4Content: quillAccordionPanel4 ? quillAccordionPanel4.root.innerHTML : getValue('listingAccordionPanel4Content'),
                amenities: getChecked('#amenitiesCheckboxes input[type="checkbox"]'),
                featured: getValue('listingFeatured'),
                private: getValue('listingPrivate'),
                isEvent: getValue('listingIsEvent'),
                eventStartDate: getValue('listingEventStartDate'),
                eventEndDate: getValue('listingEventEndDate'),
                eventStartTime: getValue('listingEventStartTime'),
                eventEndTime: getValue('listingEventEndTime'),
                eventAllDay: getValue('listingEventAllDay'),
                eventTicketUrl: getValue('listingEventTicketUrl'),
                eventCost: getValue('listingEventCost'),
                eventVenueName: getValue('listingEventVenueName'),
                googleMapsUrl: getValue('listingGoogleMapsUrl')
            };
        }
        
        // Check if form has unsaved changes
        function hasFormChanges() {
            if (!listingFormOriginalData) return false;
            const currentData = captureFormData();
            if (!currentData) return false;
            
            // Compare all fields
            for (const key in listingFormOriginalData) {
                if (key === 'amenities') {
                    // Compare arrays
                    const orig = (listingFormOriginalData[key] || []).sort().join(',');
                    const curr = (currentData[key] || []).sort().join(',');
                    if (orig !== curr) return true;
                } else {
                    const orig = String(listingFormOriginalData[key] || '').trim();
                    const curr = String(currentData[key] || '').trim();
                    if (orig !== curr) return true;
                }
            }
            return false;
        }
        
        window.closeModal = function closeModal(force) {
            // Check for unsaved changes unless force is true
            if (!force && hasFormChanges()) {
                const shouldSave = confirm('You have unsaved changes. Do you want to save before closing?\n\nOK = Save\nCancel = Discard');
                if (shouldSave) {
                    // Trigger save
                    const form = document.getElementById('listingForm');
                    if (form) {
                        const event = new Event('submit', { bubbles: true, cancelable: true });
                        form.dispatchEvent(event);
                    }
                    return; // Don't close yet - let save handle it
                }
            }
            
            // Clear original data
            listingFormOriginalData = null;
            
            // Clear detailed description Quill content (reuse instance; do not destroy — same as accordion)
            if (quillDetailedDescription) quillDetailedDescription.root.innerHTML = '';
            const detailedDescriptionTextarea = document.getElementById('listingDetailedDescription');
            if (detailedDescriptionTextarea) {
                detailedDescriptionTextarea.value = '';
            }
            
            // Clear accordion Quill editors (reuse instances; do not destroy toolbars)
            if (quillAccordionPanel1) quillAccordionPanel1.root.innerHTML = '';
            if (quillAccordionPanel2) quillAccordionPanel2.root.innerHTML = '';
            if (quillAccordionPanel3) quillAccordionPanel3.root.innerHTML = '';
            if (quillAccordionPanel4) quillAccordionPanel4.root.innerHTML = '';
            
            const accordionTextareas = ['listingAccordionPanel1Content', 'listingAccordionPanel2Content', 'listingAccordionPanel3Content', 'listingAccordionPanel4Content'];
            accordionTextareas.forEach(function(id) {
                const textarea = document.getElementById(id);
                if (textarea) textarea.value = '';
            });
            
            document.getElementById('listingModal').classList.remove('active');
        }
        
        function exportData() {
            const format = confirm('Choose Export Format\n\n' +
                                'Click OK to export as JSON data file\n' +
                                'Click Cancel to export full HTML admin backup');
            
            if (format) {
                const dataStr = JSON.stringify(data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'adventure-directory-data-' + new Date().toISOString().split('T')[0] + '.json';
                link.click();
                URL.revokeObjectURL(url);
                alert('JSON data exported! Check your downloads folder.');
            } else {
                const htmlContent = document.documentElement.outerHTML;
                const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(htmlBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'adventure-directory-admin-backup-' + new Date().toISOString().split('T')[0] + '.html';
                link.click();
                URL.revokeObjectURL(url);
                alert('Full admin backup exported! You can open this HTML file anytime to continue editing.');
            }
        }
        
        function quickExportJSON() {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'data-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
            alert('JSON file downloaded! This contains all your listing data.');
        }
        
        // Download JSON backup (same as quickExportJSON but with different naming)
        function downloadJSON() {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'nelson-county-listings-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            // Update status AFTER download completes
            setTimeout(() => {
                updateSyncStatus(true, 'JSON backup downloaded.');
            }, 100);
        }
        
        document.getElementById('listingModal').addEventListener('click', function(e) {
            // Clicking the backdrop should NOT close the modal when editing.
            // Only allow backdrop-click close when there are no unsaved changes.
            if (e.target === this && !hasFormChanges()) closeModal(true);
        });
        
        // Keyboard shortcut: Cmd+S (Mac) or Ctrl+S (Windows) to save listing
        document.addEventListener('keydown', function(e) {
            // Check if modal is open
            const modal = document.getElementById('listingModal');
            if (!modal || !modal.classList.contains('active')) {
                return;
            }
            
            // Check if Cmd+S (Mac) or Ctrl+S (Windows) is pressed
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isSaveShortcut = (isMac && e.metaKey && e.key === 's') || (!isMac && e.ctrlKey && e.key === 's');
            
            if (isSaveShortcut) {
                // Prevent default browser save dialog
                e.preventDefault();
                e.stopPropagation();
                
                // Trigger form submission (which calls saveListing via onsubmit)
                const form = document.getElementById('listingForm');
                if (form) {
                    // Validate form first
                    if (form.checkValidity()) {
                        // Use requestSubmit() if available (triggers onsubmit handler and validation)
                        // Otherwise, create a synthetic submit event and call saveListing directly
                        if (typeof form.requestSubmit === 'function') {
                            form.requestSubmit();
                        } else {
                            // Fallback: Create synthetic event and call saveListing directly
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            // Call saveListing directly with the event
                            saveListing(submitEvent);
                        }
                    } else {
                        // If form is invalid, show validation errors
                        form.reportValidity();
                    }
                }
            }
        });
        
        // Initialize OpenStreetMap Nominatim Autocomplete for address field (FREE, no API key needed)
        let addressAutocompleteTimeout = null;
        let addressAutocompleteAbortController = null;
        let addressInputHandlersInitialized = false;
        let selectedAutocompleteIndex = -1;
        let lastGeocodedAddress = ''; // Track last geocoded address to avoid duplicate API calls
        
        // Helper function to set coordinates (used by both Nominatim and Google geocoder)
        function setCoordinates(lat, lng, source) {
            const latInput = document.getElementById('listingLatitude');
            const lngInput = document.getElementById('listingLongitude');
            const coordsText = document.getElementById('coordsText');
            
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            
            // Update status text
            if (coordsText) {
                const sourceLabel = source === 'nominatim' ? 'auto-filled from address' : 
                                   source === 'google' ? 'auto-filled (Google)' : 
                                   source === 'saved' ? 'loaded from saved data' : 'set';
                coordsText.textContent = '✓ Coordinates ' + sourceLabel;
                coordsText.style.color = '#28a745';
            }
            
            console.log('📍 Coordinates set:', lat, lng, 'via', source);
        }
        
        // Clear coordinates when address changes
        function clearCoordinates() {
            const latInput = document.getElementById('listingLatitude');
            const lngInput = document.getElementById('listingLongitude');
            const coordsText = document.getElementById('coordsText');
            
            if (latInput) latInput.value = '';
            if (lngInput) lngInput.value = '';
            if (coordsText) {
                coordsText.textContent = 'Coordinates auto-fill when address is selected';
                coordsText.style.color = '#666';
            }
        }
        
        // Google Geocoder fallback (for manually typed addresses)
        function geocodeAddressWithGoogle(address) {
            if (!address || address.length < 10) return;
            if (address === lastGeocodedAddress) return; // Skip if already geocoded
            
            // Check if Google Maps API is available
            if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
                console.warn('Google Maps Geocoder not available');
                return;
            }
            
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, function(results, status) {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    const lat = location.lat();
                    const lng = location.lng();
                    setCoordinates(lat, lng, 'google');
                    lastGeocodedAddress = address;
                } else {
                    console.warn('Google geocoding failed:', status);
                }
            });
        }
        
        // Keep address required state in sync with Full vs booking-site mode.
        // Hidden + required fields silently block Save (no visible validation UI).
        function syncListingAddressTypeUi() {
            const addressTypeSelect = document.getElementById('listingAddressType');
            const addressInput = document.getElementById('listingAddress');
            if (!addressTypeSelect || !addressInput) return;
            if (addressTypeSelect.value === 'booking') {
                addressInput.style.display = 'none';
                addressInput.required = false;
                addressInput.removeAttribute('required');
            } else {
                addressInput.style.display = 'block';
                addressInput.required = true;
                addressInput.setAttribute('required', '');
            }
        }
        window.syncListingAddressTypeUi = syncListingAddressTypeUi;

        // Event mode: show/hide event fields and only require start date while on.
        // Place listing fields are unchanged; this is additive only.
        function syncListingEventModeUi() {
            const toggle = document.getElementById('listingIsEvent');
            const section = document.getElementById('listingEventSection');
            const startDate = document.getElementById('listingEventStartDate');
            const allDay = document.getElementById('listingEventAllDay');
            const startTime = document.getElementById('listingEventStartTime');
            const endTime = document.getElementById('listingEventEndTime');
            const timesRow = document.getElementById('listingEventTimesRow');
            if (!toggle || !section) return;

            const on = !!toggle.checked;
            section.hidden = !on;

            if (startDate) {
                if (on) {
                    startDate.required = true;
                    startDate.setAttribute('required', '');
                } else {
                    startDate.required = false;
                    startDate.removeAttribute('required');
                }
            }

            const allDayOn = !!(allDay && allDay.checked);
            if (timesRow) {
                timesRow.style.display = allDayOn ? 'none' : '';
            }
            [startTime, endTime].forEach(function(el) {
                if (!el) return;
                el.disabled = allDayOn;
                if (allDayOn) {
                    el.required = false;
                    el.removeAttribute('required');
                }
            });
        }
        window.syncListingEventModeUi = syncListingEventModeUi;

        (function bindListingEventModeControls() {
            const toggle = document.getElementById('listingIsEvent');
            const allDay = document.getElementById('listingEventAllDay');
            if (toggle && !toggle.dataset.boundEventModeChange) {
                toggle.dataset.boundEventModeChange = '1';
                toggle.addEventListener('change', function() {
                    syncListingEventModeUi();
                });
            }
            if (allDay && !allDay.dataset.boundEventAllDayChange) {
                allDay.dataset.boundEventAllDayChange = '1';
                allDay.addEventListener('change', function() {
                    syncListingEventModeUi();
                });
            }
            syncListingEventModeUi();
        })();

        // Helper function to generate Google Maps URL from address (always reads current value)
        function generateGoogleMapsUrlFromAddress() {
            const addressTypeSelect = document.getElementById('listingAddressType');
            const addressInputElement = document.getElementById('listingAddress');
            
            // Check if "booking site" option is selected
            if (addressTypeSelect && addressTypeSelect.value === 'booking') {
                return ''; // Don't generate maps link for booking site addresses
            }
            
            if (!addressInputElement) return '';
            
            const address = addressInputElement.value.trim();
            if (!address || address.length < 5) return '';
            
            const encodedAddress = encodeURIComponent(address);
            return 'https://www.google.com/maps/search/?api=1&query=' + encodedAddress;
        }
        
        // Function to initialize autocomplete when modal opens
        window.initializeAddressAutocomplete = function initializeAddressAutocomplete() {
            const addressInput = document.getElementById('listingAddress');
            const addressTypeSelect = document.getElementById('listingAddressType');
            const directionsLinkInput = document.getElementById('listingDirectionsLink');
            const dropdown = document.getElementById('addressAutocompleteDropdown');
            
            if (!addressInput || !addressTypeSelect) {
                console.warn('Address input or type select not found');
                return;
            }

            syncListingAddressTypeUi();
            
            // Handle address type dropdown change (bind once — modal re-inits often)
            if (!addressTypeSelect.dataset.boundAddressTypeChange) {
                addressTypeSelect.dataset.boundAddressTypeChange = '1';
                addressTypeSelect.addEventListener('change', function() {
                    if (this.value === 'booking') {
                        addressInput.value = '';
                        if (directionsLinkInput) directionsLinkInput.value = '';
                    }
                    syncListingAddressTypeUi();
                });
            }
            // Set up Nominatim autocomplete
            if (!addressInputHandlersInitialized) {
                let debounceTimer;
                
                addressInput.addEventListener('input', function() {
                    const query = this.value.trim();
                    
                    // Clear previous timeout
                    if (addressAutocompleteTimeout) {
                        clearTimeout(addressAutocompleteTimeout);
                    }
                    
                    // Cancel previous request
                    if (addressAutocompleteAbortController) {
                        addressAutocompleteAbortController.abort();
                    }
                    
                    // Hide dropdown if input is empty
                    if (!query || query.length < 3) {
                        if (dropdown) dropdown.classList.remove('show');
                        return;
                    }
                    
                    // Debounce API calls (wait 500ms after user stops typing)
                    addressAutocompleteTimeout = setTimeout(function() {
                        fetchAddressSuggestions(query, addressInput, dropdown, directionsLinkInput);
                    }, 500);
                });
                
                // Handle keyboard navigation
                addressInput.addEventListener('keydown', function(e) {
                    const items = dropdown ? dropdown.querySelectorAll('.address-autocomplete-item') : [];
                    
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, items.length - 1);
                        updateSelectedItem(items);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
                        updateSelectedItem(items);
                    } else if (e.key === 'Enter' && selectedAutocompleteIndex >= 0 && items[selectedAutocompleteIndex]) {
                        e.preventDefault();
                        items[selectedAutocompleteIndex].click();
                    } else if (e.key === 'Escape') {
                        if (dropdown) dropdown.classList.remove('show');
                        selectedAutocompleteIndex = -1;
                    }
                });
                
                // Hide dropdown when clicking outside
                document.addEventListener('click', function(e) {
                    if (!addressInput.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });
                
                // Set up live auto-update of directions link whenever address changes
                if (directionsLinkInput) {
                    let addressUpdateTimer = null;
                    let userManuallyEditedLink = false;
                    
                    // Track if user manually edits the directions link
                    directionsLinkInput.addEventListener('input', function() {
                        // Check if the current value doesn't match an auto-generated pattern
                        const currentValue = this.value.trim();
                        const isAutoGenerated = currentValue.startsWith('https://www.google.com/maps/search/?api=1&query=');
                        
                        // If user types something that's not an auto-generated link, mark as manually edited
                        if (currentValue && !isAutoGenerated) {
                            userManuallyEditedLink = true;
                        } else if (!currentValue) {
                            // If field is cleared, reset the flag
                            userManuallyEditedLink = false;
                        }
                    });
                    
                    // Live update: whenever address changes, update the Google Maps link
                    addressInput.addEventListener('input', function() {
                        // Clear previous timer
                        if (addressUpdateTimer) {
                            clearTimeout(addressUpdateTimer);
                        }
                        
                        // Debounce the update (wait 300ms after user stops typing)
                        addressUpdateTimer = setTimeout(function() {
                            const address = addressInput.value.trim();
                            const currentLink = directionsLinkInput.value.trim();
                            
                            // Only update if:
                            // 1. Address has some content (at least 5 characters)
                            // 2. Directions link is empty OR it's an auto-generated link (user hasn't manually edited)
                            const isAutoGeneratedLink = currentLink.startsWith('https://www.google.com/maps/search/?api=1&query=');
                            const shouldUpdate = address.length >= 5 && (!currentLink || (isAutoGeneratedLink && !userManuallyEditedLink));
                            
                            if (shouldUpdate) {
                                const googleMapsUrl = generateGoogleMapsUrlFromAddress();
                                if (googleMapsUrl) {
                                    directionsLinkInput.value = googleMapsUrl;
                                    userManuallyEditedLink = false; // Reset flag since we just auto-generated
                                }
                            }
                        }, 300);
                    });
                }
                
                // Add blur handler for Google geocoder fallback (for manually typed addresses)
                addressInput.addEventListener('blur', function() {
                    const address = addressInput.value.trim();
                    const latInput = document.getElementById('listingLatitude');
                    
                    // Only geocode if:
                    // 1. Address has content (at least 10 chars for a valid address)
                    // 2. No coordinates already set (Nominatim didn't provide them)
                    // 3. Not a booking site address
                    const addressTypeSelect = document.getElementById('listingAddressType');
                    const isBookingAddress = addressTypeSelect && addressTypeSelect.value === 'booking';
                    const hasCoords = latInput && latInput.value && latInput.value.trim() !== '';
                    
                    if (address.length >= 10 && !hasCoords && !isBookingAddress) {
                        console.log('📍 No coords from Nominatim, falling back to Google geocoder...');
                        geocodeAddressWithGoogle(address);
                    }
                });
                
                // Clear coordinates when address input changes (user is typing new address)
                addressInput.addEventListener('input', function() {
                    // Clear coords when user starts modifying the address
                    // They'll be re-set when user selects from dropdown or on blur
                    clearCoordinates();
                    lastGeocodedAddress = ''; // Reset so we can re-geocode
                });
                
                addressInputHandlersInitialized = true;
            }
        };
        
        // Fetch address suggestions from Nominatim
        function fetchAddressSuggestions(query, addressInput, dropdown, directionsLinkInput) {
            if (!dropdown) return;
            
            // Create new AbortController for this request
            addressAutocompleteAbortController = new AbortController();
            
            // Build Nominatim API URL
            // Restrict to US addresses and limit results
            const url = 'https://nominatim.openstreetmap.org/search?' + 
                'format=json&' +
                'addressdetails=1&' +
                'limit=5&' +
                'countrycodes=us&' +
                'q=' + encodeURIComponent(query + ', USA');
            
            fetch(url, {
                signal: addressAutocompleteAbortController.signal,
                headers: {
                    'User-Agent': 'NelsonCountyDirectory/1.0' // Required by Nominatim
                }
            })
            .then(function(response) {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(function(data) {
                if (!dropdown || !addressInput) return;
                
                // Clear previous results
                dropdown.innerHTML = '';
                selectedAutocompleteIndex = -1;
                
                if (data && data.length > 0) {
                    // Display suggestions
                    data.forEach(function(item, index) {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'address-autocomplete-item';
                        itemDiv.setAttribute('data-index', index);
                        
                        // Format address display
                        const displayName = item.display_name || item.name || '';
                        const addressParts = [];
                        if (item.address) {
                            if (item.address.road) addressParts.push(item.address.road);
                            if (item.address.house_number) addressParts.unshift(item.address.house_number);
                            if (item.address.city || item.address.town || item.address.village) {
                                addressParts.push(item.address.city || item.address.town || item.address.village);
                            }
                            if (item.address.state) addressParts.push(item.address.state);
                            if (item.address.postcode) addressParts.push(item.address.postcode);
                        }
                        
                        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : displayName;
                        
                        itemDiv.innerHTML = '<strong>' + escapeHtml(displayName.split(',')[0]) + '</strong>' +
                            '<small>' + escapeHtml(fullAddress) + '</small>';
                        
                        itemDiv.addEventListener('click', function() {
                            // Set the full formatted address
                            const selectedAddress = fullAddress || displayName;
                            addressInput.value = selectedAddress;
                            dropdown.classList.remove('show');
                            
                            // Capture coordinates from Nominatim response (FREE geocoding!)
                            if (item.lat && item.lon) {
                                const lat = parseFloat(item.lat);
                                const lng = parseFloat(item.lon);
                                setCoordinates(lat, lng, 'nominatim');
                            }
                            
                            // The live update system will automatically update the directions link
                            // Trigger the input event to ensure it updates
                            addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            // Focus back on input
                            addressInput.focus();
                        });
                        
                        dropdown.appendChild(itemDiv);
                    });
                    
                    dropdown.classList.add('show');
                } else {
                    dropdown.classList.remove('show');
                }
            })
            .catch(function(error) {
                if (error.name === 'AbortError') {
                    // Request was cancelled, ignore
                    return;
                }
                console.error('Error fetching address suggestions:', error);
                if (dropdown) dropdown.classList.remove('show');
            });
        }
        
        // Update selected item in dropdown (for keyboard navigation)
        function updateSelectedItem(items) {
            items.forEach(function(item, index) {
                if (index === selectedAutocompleteIndex) {
                    item.style.background = 'var(--bg-hover)';
                    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    item.style.background = '';
                }
            });
        }
        
        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Slug from name: new listing = live slugify(name); edit existing = only fill when slug field is empty (stable URLs)
        const listingNameInput = document.getElementById('listingName');
        const listingSlugInput = document.getElementById('listingSlug');
        
        if (listingNameInput && listingSlugInput) {
            function isEditingExistingListing() {
                var el = document.getElementById('editingId');
                return !!(el && String(el.value || '').trim());
            }
            function syncSlugFromName() {
                var name = String(listingNameInput.value || '').trim();
                if (isEditingExistingListing()) {
                    if (!listingSlugInput.value.trim() && name) {
                        var editingSlug = String(document.getElementById('editingId').value || '').trim();
                        var editingIndex = findListingIndexBySlug(editingSlug);
                        listingSlugInput.value = ensureUniqueSlug(name, {
                            excludeIndex: editingIndex >= 0 ? editingIndex : undefined
                        });
                    }
                    return;
                }
                listingSlugInput.value = name ? ensureUniqueSlug(name) : '';
            }
            listingNameInput.addEventListener('input', syncSlugFromName);
            listingNameInput.addEventListener('blur', syncSlugFromName);
            listingSlugInput.addEventListener('blur', function() {
                if (!listingSlugInput.value.trim() && String(listingNameInput.value || '').trim()) {
                    var editingSlug = String((document.getElementById('editingId') || {}).value || '').trim();
                    var editingIndex = findListingIndexBySlug(editingSlug);
                    listingSlugInput.value = ensureUniqueSlug(String(listingNameInput.value || '').trim(), {
                        excludeIndex: editingIndex >= 0 ? editingIndex : undefined
                    });
                    return;
                }
                var raw = String(listingSlugInput.value || '').trim();
                if (!raw) return;
                var normalized = slugify(raw) || raw;
                var editingSlug = String((document.getElementById('editingId') || {}).value || '').trim();
                var editingIndex = findListingIndexBySlug(editingSlug);
                if (isSlugTaken(normalized, { excludeIndex: editingIndex >= 0 ? editingIndex : undefined })) {
                    listingSlugInput.setCustomValidity('This slug is already used by another listing.');
                    listingSlugInput.reportValidity();
                } else {
                    listingSlugInput.setCustomValidity('');
                    listingSlugInput.value = normalized;
                }
            });
            listingSlugInput.addEventListener('input', function() {
                listingSlugInput.setCustomValidity('');
            });
        }
        
        // Define switchTab early so it's available for onclick handlers
        if (typeof window.switchTab === 'undefined') {
        window.switchTab = function switchTab(tab) {
            var settingsBtn = document.getElementById('tabSettingsBtn');
            var toggleTrack = document.getElementById('adminDataToggle');
            var toggleBtns = document.querySelectorAll('.tabs-toggle-btn');
            document.querySelectorAll('.tab-content').forEach(function(content) { content.classList.remove('active'); });
            
            const header = document.querySelector('.header');
            const tabsStack = document.querySelector('.tabs-sticky-stack');
            
            if (tab === 'admin') {
                if (settingsBtn) settingsBtn.classList.remove('active');
                toggleBtns.forEach(function(btn, i) {
                    var on = i === 0;
                    btn.classList.toggle('active', on);
                    btn.setAttribute('aria-selected', on ? 'true' : 'false');
                });
                if (toggleTrack) {
                    toggleTrack.classList.remove('tabs-toggle-track--data');
                    toggleTrack.classList.add('tabs-toggle-track--admin');
                }
                document.getElementById('adminTab').classList.add('active');
                if (header) header.style.display = 'block';
                if (tabsStack) tabsStack.style.display = '';
                if (typeof scheduleListingsGridVirtualRefresh === 'function') {
                    scheduleListingsGridVirtualRefresh();
                }
            } else if (tab === 'data') {
                if (settingsBtn) settingsBtn.classList.remove('active');
                toggleBtns.forEach(function(btn, i) {
                    var on = i === 1;
                    btn.classList.toggle('active', on);
                    btn.setAttribute('aria-selected', on ? 'true' : 'false');
                });
                if (toggleTrack) {
                    toggleTrack.classList.remove('tabs-toggle-track--admin');
                    toggleTrack.classList.add('tabs-toggle-track--data');
                }
                document.getElementById('dataTab').classList.add('active');
                if (header) header.style.display = 'block';
                if (tabsStack) tabsStack.style.display = '';
                renderDataTable();
            } else if (tab === 'settings') {
                if (settingsBtn) settingsBtn.classList.add('active');
                document.getElementById('settingsTab').classList.add('active');
                if (header) header.style.display = 'block';
                if (tabsStack) tabsStack.style.display = '';
                renderSettings();
            }
            };
        }
        
        // ===========================================
        // ACTIVITY / AUDIT LOG (Settings)
        // ===========================================
        var activityLogEntriesCache = [];
        var activityLogFilter = 'all';
        var activityLogLoading = false;

        function activityLogEscape(text) {
            if (typeof escapeHtml === 'function') return escapeHtml(text);
            return String(text == null ? '' : text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function activityInitials(email) {
            var local = String(email || '').split('@')[0] || '?';
            var parts = local.split(/[._\-+]+/).filter(Boolean);
            if (parts.length >= 2) {
                return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            }
            return local.slice(0, 2).toUpperCase();
        }

        function activityTone(email) {
            var s = String(email || '');
            var hash = 0;
            for (var i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
            return Math.abs(hash) % 6;
        }

        function activityActionLabel(action) {
            var a = String(action || '').toLowerCase();
            if (a === 'create') return 'Created';
            if (a === 'update') return 'Updated';
            if (a === 'delete') return 'Deleted';
            if (a === 'save-all') return 'Saved all';
            return a ? a : 'Change';
        }

        function activityActionClass(action) {
            var a = String(action || '').toLowerCase();
            if (a === 'create' || a === 'update' || a === 'delete' || a === 'save-all') return a;
            return 'other';
        }

        function parseActivityTimestamp(value) {
            if (!value) return null;
            if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
            var s = String(value).trim();
            var d = new Date(s);
            if (!isNaN(d.getTime())) return d;
            // Apps Script sometimes returns "M/D/YYYY H:MM:SS"
            var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
            if (m) {
                d = new Date(
                    parseInt(m[3], 10),
                    parseInt(m[1], 10) - 1,
                    parseInt(m[2], 10),
                    parseInt(m[4] || '0', 10),
                    parseInt(m[5] || '0', 10),
                    parseInt(m[6] || '0', 10)
                );
                if (!isNaN(d.getTime())) return d;
            }
            return null;
        }

        function formatActivityRelative(date) {
            if (!date) return '';
            var diff = Date.now() - date.getTime();
            if (diff < 0) diff = 0;
            var sec = Math.floor(diff / 1000);
            if (sec < 45) return 'Just now';
            var min = Math.floor(sec / 60);
            if (min < 60) return min + 'm ago';
            var hr = Math.floor(min / 60);
            if (hr < 24) return hr + 'h ago';
            var day = Math.floor(hr / 24);
            if (day < 7) return day + 'd ago';
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }

        function formatActivityDayLabel(date) {
            if (!date) return 'Earlier';
            var today = new Date();
            var startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            var startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            var dayDiff = Math.round((startToday - startThat) / 86400000);
            if (dayDiff === 0) return 'Today';
            if (dayDiff === 1) return 'Yesterday';
            return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        }

        function displayNameFromEmail(email) {
            var local = String(email || '').split('@')[0] || 'Someone';
            return local.replace(/[._\-+]+/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        }

        // Parse audit details into visual change pills for the middle column.
        function buildActivityChangePills(entry) {
            var pills = [];
            var fields = String(entry.changedFields || '')
                .split(',')
                .map(function(f) { return f.trim(); })
                .filter(Boolean);
            var details = String(entry.details || '').trim();
            var handledFields = {};

            function pushPill(kind, label) {
                if (!label) return;
                pills.push({ kind: kind, label: label });
            }

            details.split(/\s\|\s/).forEach(function(part) {
                part = part.trim();
                if (!part) return;

                var amenityPlain = part.match(/^amenities:\s*(.+)$/i);
                if (amenityPlain && !/→/.test(amenityPlain[1])) {
                    handledFields.amenities = true;
                    var remMatch = amenityPlain[1].match(/removed\s+([^;]+)/i);
                    var addMatch = amenityPlain[1].match(/added\s+([^;]+)/i);
                    if (remMatch) {
                        remMatch[1].split(',').map(function(s) { return s.trim(); }).filter(Boolean).forEach(function(name) {
                            pushPill('removed', '− ' + name);
                        });
                    }
                    if (addMatch) {
                        addMatch[1].split(',').map(function(s) { return s.trim(); }).filter(Boolean).forEach(function(name) {
                            pushPill('added', '+ ' + name);
                        });
                    }
                    return;
                }

                var amenityArrow = part.match(/^amenities:\s*"([^"]*)"\s*→\s*"([^"]*)"$/i);
                if (amenityArrow) {
                    handledFields.amenities = true;
                    var before = amenityArrow[1].split(/[;,]/).map(function(s) { return s.trim(); }).filter(Boolean);
                    var after = amenityArrow[2].split(/[;,]/).map(function(s) { return s.trim(); }).filter(Boolean);
                    var beforeMap = {};
                    var afterMap = {};
                    before.forEach(function(v) { beforeMap[v.toLowerCase()] = v; });
                    after.forEach(function(v) { afterMap[v.toLowerCase()] = v; });
                    Object.keys(beforeMap).forEach(function(k) {
                        if (!afterMap[k]) pushPill('removed', '− ' + beforeMap[k]);
                    });
                    Object.keys(afterMap).forEach(function(k) {
                        if (!beforeMap[k]) pushPill('added', '+ ' + afterMap[k]);
                    });
                    return;
                }

                var flagChange = part.match(/^(featured|private):\s*(TRUE|FALSE)\s*→\s*(TRUE|FALSE)$/i);
                if (flagChange) {
                    handledFields[flagChange[1].toLowerCase()] = true;
                    pushPill(
                        flagChange[3].toUpperCase() === 'TRUE' ? 'added' : 'removed',
                        flagChange[1] + ': ' + flagChange[2] + ' → ' + flagChange[3]
                    );
                    return;
                }

                var generic = part.match(/^([a-zA-Z0-9_]+):\s*"([^"]*)"\s*→\s*"([^"]*)"$/);
                if (generic) {
                    handledFields[generic[1].toLowerCase()] = true;
                    var from = generic[2];
                    var to = generic[3];
                    if (!from && to) {
                        pushPill('added', generic[1] + ' set');
                    } else if (from && !to) {
                        pushPill('removed', generic[1] + ' cleared');
                    } else if (from.length > 28 || to.length > 28) {
                        pushPill('field', generic[1]);
                    } else {
                        pushPill('changed', generic[1] + ': ' + from + ' → ' + to);
                    }
                    return;
                }

                if (/^New listing/i.test(part) || /^Listing deleted/i.test(part)) {
                    pushPill('field', part);
                }
            });

            fields.forEach(function(field) {
                if (handledFields[field.toLowerCase()]) return;
                pushPill('field', field);
            });

            if (!pills.length) {
                var action = String(entry.action || '').toLowerCase();
                if (action === 'create') pushPill('added', 'New listing');
                else if (action === 'delete') pushPill('removed', 'Deleted');
                else if (details) pushPill('field', details.length > 80 ? details.slice(0, 77) + '…' : details);
                else pushPill('field', 'Changed');
            }

            return pills.slice(0, 12).map(function(p) {
                return '<span class="activity-log-pill activity-log-pill--' + p.kind + '">' +
                    activityLogEscape(p.label) +
                    '</span>';
            }).join('');
        }

        window.setActivityLogFilter = function setActivityLogFilter(filter) {
            activityLogFilter = filter || 'all';
            document.querySelectorAll('.activity-log-filter').forEach(function(btn) {
                btn.classList.toggle('is-active', btn.getAttribute('data-filter') === activityLogFilter);
            });
            renderActivityLogList();
        };

        function renderActivityLogList() {
            var statusEl = document.getElementById('activityLogStatus');
            var listEl = document.getElementById('activityLogList');
            if (!statusEl || !listEl) return;

            var entries = (activityLogEntriesCache || []).filter(function(entry) {
                if (activityLogFilter === 'all') {
                    return String(entry.action || '').toLowerCase() !== 'save-all';
                }
                return String(entry.action || '').toLowerCase() === activityLogFilter;
            });

            if (!entries.length) {
                listEl.hidden = true;
                listEl.innerHTML = '';
                statusEl.hidden = false;
                statusEl.className = 'activity-log-status';
                if (!(activityLogEntriesCache || []).length) {
                    statusEl.textContent = 'No activity yet. Changes appear here after Save to Sheets.';
                } else {
                    statusEl.textContent = 'No matching activity for this filter.';
                }
                return;
            }

            statusEl.hidden = true;
            listEl.hidden = false;
            var html = '';
            var lastDay = '';
            entries.forEach(function(entry) {
                var when = parseActivityTimestamp(entry.timestamp);
                var dayLabel = formatActivityDayLabel(when);
                if (dayLabel !== lastDay) {
                    lastDay = dayLabel;
                    html += '<div class="activity-log-day">' + activityLogEscape(dayLabel) + '</div>';
                }
                var action = String(entry.action || '').toLowerCase();
                var email = entry.email || '';
                var who = displayNameFromEmail(email);
                var listingLabel = entry.name || entry.slug || 'Listing';
                var changePills = buildActivityChangePills(entry);

                html +=
                    '<article class="activity-log-item">' +
                        '<div class="activity-log-who">' +
                            '<div class="activity-log-avatar" data-tone="' + activityTone(email) + '" aria-hidden="true">' +
                                activityLogEscape(activityInitials(email)) +
                            '</div>' +
                            '<div class="activity-log-who-text">' +
                                '<div class="activity-log-person">' + activityLogEscape(who) + '</div>' +
                                '<div class="activity-log-listing" title="' + activityLogEscape(listingLabel) + '">' +
                                    activityLogEscape(listingLabel) +
                                '</div>' +
                                (email
                                    ? '<div class="activity-log-email" title="' + activityLogEscape(email) + '">' + activityLogEscape(email) + '</div>'
                                    : '') +
                            '</div>' +
                        '</div>' +
                        '<div class="activity-log-changes" title="' + activityLogEscape(entry.details || entry.changedFields || '') + '">' +
                            (changePills || '<span class="activity-log-pill activity-log-pill--field">Changed</span>') +
                        '</div>' +
                        '<div class="activity-log-side">' +
                            '<span class="activity-log-badge activity-log-badge--' + activityActionClass(action) + '">' +
                                activityLogEscape(activityActionLabel(action)) +
                            '</span>' +
                            '<span class="activity-log-time" title="' + activityLogEscape(entry.timestamp || '') + '">' +
                                activityLogEscape(formatActivityRelative(when) || entry.timestamp || '') +
                            '</span>' +
                        '</div>' +
                    '</article>';
            });
            listEl.innerHTML = html;
        }

        window.loadActivityLog = async function loadActivityLog(force) {
            var statusEl = document.getElementById('activityLogStatus');
            var listEl = document.getElementById('activityLogList');
            var refreshBtn = document.getElementById('activityLogRefreshBtn');
            if (!statusEl || !listEl) return;
            if (activityLogLoading && !force) return;
            activityLogLoading = true;
            if (refreshBtn) refreshBtn.disabled = true;

            statusEl.hidden = false;
            statusEl.className = 'activity-log-status';
            statusEl.textContent = 'Loading activity…';
            if (!activityLogEntriesCache.length) {
                listEl.hidden = true;
            }

            try {
                var scriptUrl = (typeof GOOGLE_APPS_SCRIPT_URL !== 'undefined')
                    ? GOOGLE_APPS_SCRIPT_URL
                    : (typeof window.getGoogleAppsScriptURL === 'function' ? window.getGoogleAppsScriptURL() : '');
                if (!scriptUrl || /YOUR_SCRIPT/i.test(scriptUrl)) {
                    throw new Error('Apps Script URL is not configured.');
                }
                var token = (typeof getAdminSessionToken === 'function') ? getAdminSessionToken() : '';
                if (!token) {
                    throw new Error('Sign in again to view activity.');
                }
                var url = scriptUrl +
                    '?action=getAuditLog' +
                    '&limit=150' +
                    '&token=' + encodeURIComponent(token) +
                    '&t=' + Date.now();
                var response = await fetch(url, { method: 'GET', mode: 'cors' });
                var text = await response.text();
                var result = null;
                try { result = JSON.parse(text); } catch (e) { result = null; }

                // Old deployments ignore unknown actions and return listings instead.
                if (!result || !Array.isArray(result.entries)) {
                    activityLogEntriesCache = [];
                    listEl.hidden = true;
                    listEl.innerHTML = '';
                    statusEl.hidden = false;
                    statusEl.className = 'activity-log-status activity-log-status--error';
                    statusEl.innerHTML =
                        'Activity history isn’t available on the current Apps Script deploy yet.<br>' +
                        'Redeploy <code>COMPLETE-GOOGLE-APPS-SCRIPT.gs</code> (with audit log), then Refresh.';
                    return;
                }
                if (result.success === false) {
                    throw new Error(result.error || 'Could not load activity.');
                }

                activityLogEntriesCache = result.entries || [];
                renderActivityLogList();
                if (!activityLogEntriesCache.length && result.message) {
                    statusEl.hidden = false;
                    statusEl.className = 'activity-log-status';
                    statusEl.textContent = result.message;
                }
            } catch (error) {
                console.warn('Activity log load failed:', error);
                listEl.hidden = true;
                statusEl.hidden = false;
                statusEl.className = 'activity-log-status activity-log-status--error';
                statusEl.textContent = (error && error.message) ? error.message : 'Could not load activity.';
            } finally {
                activityLogLoading = false;
                if (refreshBtn) refreshBtn.disabled = false;
            }
        };

        // ===========================================
        // SETTINGS MANAGEMENT FUNCTIONS
        // ===========================================
        function renderSettings() {
            renderTypesList();
            renderAreasList();
            renderAmenitiesList();
            renderCategoriesList();
            loadActivityLog();

            // Debug: Check what's in localStorage when rendering
            const storedRaw = localStorage.getItem('adminAllowedEmails');
            console.log('🔍 renderSettings: Raw localStorage value:', storedRaw);
            if (storedRaw) {
                try {
                    const parsed = JSON.parse(storedRaw);
                    console.log('🔍 renderSettings: Parsed emails:', parsed);
                } catch (e) {
                    console.error('🔍 renderSettings: Parse error:', e);
                }
            }

            renderAllowedEmailsList();
        }
        
        // ===========================================
        // ALLOWED EMAILS MANAGEMENT FUNCTIONS
        // ===========================================
        
        // Save allowed emails to localStorage
        function saveAllowedEmails(emails) {
            // Ensure at least one email remains
            if (emails.length === 0) {
                alert('Error: At least one email address must remain in the allowed list.');
                return false;
            }
            
            try {
                const emailsJson = JSON.stringify(emails);
                localStorage.setItem('adminAllowedEmails', emailsJson);
                console.log('💾 Saved to localStorage:', emailsJson);
                
                // Verify it was saved
                const verify = localStorage.getItem('adminAllowedEmails');
                if (verify !== emailsJson) {
                    console.error('❌ localStorage verification failed!');
                    return false;
                }
                console.log('✅ localStorage verified successfully');
                
                // Update the global AUTHORIZED_EMAILS
                if (typeof window.AUTHORIZED_EMAILS !== 'undefined') {
                    window.AUTHORIZED_EMAILS = emails;
                }
                return true;
            } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
                return false;
            }
        }
        
        // Render the allowed emails list
        function renderAllowedEmailsList() {
            const container = document.getElementById('allowedEmailsList');
            if (!container) return;
            
            const emails = window.loadAuthorizedEmails();
            console.log('📋 Rendering emails list:', emails);
            
            if (emails.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No emails configured</p>';
                return;
            }
            
            container.innerHTML = emails.map(function(email, index) {
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #4E6B52;">' +
                    '<span style="font-weight: 500;">' + escapeHtml(email) + '</span>' +
                    '<button onclick="removeAllowedEmail(\'' + escapeHtml(email) + '\')" style="background: #ffcccc; color: #000; border: none; padding: 6px 12px; border-radius: 18px; cursor: pointer; font-size: 12px; font-weight: 600;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        // Show modal to add new email
        window.showAddEmailModal = function showAddEmailModal() {
            const modal = document.getElementById('addEmailModal');
            const form = document.getElementById('addEmailForm');
            const otpForm = document.getElementById('addEmailOTPForm');
            const verifySelect = document.getElementById('verifyEmailSelect');
            const newEmailInput = document.getElementById('newEmailInput');
            
            if (!modal || !form || !otpForm || !verifySelect) return;
            
            // Reset forms
            form.style.display = 'block';
            otpForm.style.display = 'none';
            newEmailInput.value = '';
            document.getElementById('addEmailOTPInput').value = '';
            
            // Populate verify email dropdown with existing emails
            const emails = window.loadAuthorizedEmails();
            verifySelect.innerHTML = '<option value="">Select an email to verify with...</option>' +
                emails.map(function(email) {
                    return '<option value="' + escapeHtml(email) + '">' + escapeHtml(email) + '</option>';
                }).join('');
            
            modal.style.display = 'block';
        };
        
        // Close add email modal
        window.closeAddEmailModal = function closeAddEmailModal() {
            const modal = document.getElementById('addEmailModal');
            if (modal) modal.style.display = 'none';
        };
        
        // Close modal when clicking outside
        document.addEventListener('DOMContentLoaded', function() {
            const addEmailModal = document.getElementById('addEmailModal');
            if (addEmailModal) {
                addEmailModal.addEventListener('click', function(e) {
                    if (e.target === addEmailModal) {
                        closeAddEmailModal();
                    }
                });
            }
        });
        
        // Initiate adding email (send OTP)
        window.initiateAddEmail = async function initiateAddEmail() {
            const newEmail = document.getElementById('newEmailInput').value.trim().toLowerCase();
            const verifyEmail = document.getElementById('verifyEmailSelect').value;
            
            if (!newEmail || !verifyEmail) {
                alert('Please enter a new email address and select an email to verify with.');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Check if email already exists
            const existingEmails = window.loadAuthorizedEmails();
            if (existingEmails.includes(newEmail)) {
                alert('This email address is already in the allowed list.');
                return;
            }
            
            // Send OTP to verification email
            try {
                const result = await window.sendOTP(verifyEmail);
                if (result.success) {
                    // Show OTP form
                    document.getElementById('addEmailForm').style.display = 'none';
                    document.getElementById('addEmailOTPForm').style.display = 'block';
                    document.getElementById('verifyEmailDisplay').textContent = verifyEmail;
                    document.getElementById('addEmailOTPInput').focus();
                    
                    // Store new email and verify email for later
                    document.getElementById('addEmailOTPForm').dataset.newEmail = newEmail;
                    document.getElementById('addEmailOTPForm').dataset.verifyEmail = verifyEmail;
                } else {
                    alert('Error sending verification code: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error initiating add email:', error);
                alert('Error sending verification code. Please try again.');
            }
        };
        
        // Verify OTP and add email
        window.verifyAndAddEmail = async function verifyAndAddEmail() {
            const otpForm = document.getElementById('addEmailOTPForm');
            const otpInput = document.getElementById('addEmailOTPInput');
            const code = otpInput.value.trim();
            const newEmail = otpForm.dataset.newEmail;
            const verifyEmail = otpForm.dataset.verifyEmail;
            
            if (!code || code.length !== 6) {
                alert('Please enter the 6-digit verification code.');
                return;
            }
            
            if (!newEmail || !verifyEmail) {
                alert('Error: Missing email information. Please try again.');
                return;
            }
            
            try {
                const result = await window.verifyOTP(verifyEmail, code);
                if (result.success) {
                    // Add new email to list
                    const emails = window.loadAuthorizedEmails();
                    console.log('📧 Current emails before adding:', emails);
                    console.log('📧 Adding new email:', newEmail);
                    
                    // Check if email already exists
                    if (emails.includes(newEmail.toLowerCase())) {
                        alert('This email is already in the allowed list.');
                        return;
                    }
                    
                    emails.push(newEmail.toLowerCase());
                    console.log('📧 Emails after adding:', emails);
                    
                    // Save to localStorage
                    const saveResult = saveAllowedEmails(emails);
                    console.log('💾 Save result:', saveResult);
                    
                    // Verify it was saved
                    const verifySaved = window.loadAuthorizedEmails();
                    console.log('✅ Verified saved emails:', verifySaved);
                    
                    if (saveResult) {
                        // Update AUTHORIZED_EMAILS for current session
                        if (typeof window.AUTHORIZED_EMAILS !== 'undefined') {
                            window.AUTHORIZED_EMAILS = emails;
                        }
                        
                        // Try to sync with server
                        console.log('🔄 Attempting to sync to server...');
                        const syncSuccess = await syncAuthorizedEmailsToServer(emails);
                        console.log('🔄 Sync result:', syncSuccess);
                        
                        // Refresh the list
                        renderAllowedEmailsList();
                        
                        // Close modal
                        closeAddEmailModal();
                        
                        // Show success message with instructions
                        if (!syncSuccess) {
                            alert('Email address added to local list, but server sync failed.\n\n⚠️ IMPORTANT: The new email will NOT be able to log in until you manually update the Google Apps Script.\n\nTo fix this:\n1. Open your Google Apps Script editor\n2. Find the AUTHORIZED_EMAILS array\n3. Add the new email: "' + newEmail + '"\n4. Save and redeploy the script\n\nUntil then, the new email will see "This email is not authorized" error.');
                        } else {
                            alert('Email address added successfully and synced to server!');
                        }
                        
                        // Show warning in UI
                        const warningDiv = document.getElementById('emailSyncWarning');
                        if (warningDiv && !syncSuccess) {
                            warningDiv.style.display = 'block';
                        }
                    } else {
                        console.error('❌ Failed to save emails to localStorage');
                        alert('Error: Failed to save email address. Please check the browser console for details.');
                    }
                } else {
                    alert('Verification failed: ' + (result.error || 'Invalid code'));
                }
            } catch (error) {
                console.error('Error verifying OTP:', error);
                alert('Error verifying code. Please try again.');
            }
        };
        
        // Resend OTP for add email
        window.resendAddEmailOTP = async function resendAddEmailOTP() {
            const otpForm = document.getElementById('addEmailOTPForm');
            const verifyEmail = otpForm.dataset.verifyEmail;
            
            if (!verifyEmail) {
                alert('Error: Missing verification email. Please start over.');
                return;
            }
            
            try {
                const result = await window.sendOTP(verifyEmail);
                if (result.success) {
                    alert('Verification code resent successfully!');
                } else {
                    alert('Error resending code: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error resending OTP:', error);
                alert('Error resending code. Please try again.');
            }
        };
        
        // Sync authorized emails to Google Apps Script
        function syncAuthorizedEmailsToServer(emails) {
            return new Promise(function(resolve) {
                try {
                    // Get the Google Apps Script URL
                    let scriptUrl;
                    if (typeof GOOGLE_APPS_SCRIPT_URL !== 'undefined') {
                        scriptUrl = GOOGLE_APPS_SCRIPT_URL;
                    } else if (typeof window.getGoogleAppsScriptURL === 'function') {
                        scriptUrl = window.getGoogleAppsScriptURL();
                    } else {
                        // Fallback URL
                        scriptUrl = 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec';
                    }
                    
                    console.log('🔄 Sync: Using script URL:', scriptUrl);
                    console.log('🔄 Sync: Emails to sync:', emails);
                    
                    // Get session token if available (check localStorage for adminAuthSession)
                    let sessionToken = null;
                    try {
                        const sessionData = localStorage.getItem('adminAuthSession');
                        if (sessionData) {
                            const session = JSON.parse(sessionData);
                            sessionToken = session.token;
                            console.log('🔄 Sync: Found session token from adminAuthSession');
                        } else {
                            console.log('⚠️  Sync: No adminAuthSession found in localStorage');
                        }
                    } catch (e) {
                        console.warn('⚠️  Could not retrieve session token:', e);
                    }
                    
                    const params = new URLSearchParams({
                        action: 'updateAuthorizedEmails',
                        emails: JSON.stringify(emails)
                    });
                    
                    // Add session token if available
                    if (sessionToken) {
                        params.append('token', sessionToken);
                        console.log('🔄 Sync: Including session token');
                    } else {
                        console.log('⚠️  Sync: No session token available - will rely on email overlap validation');
                    }
                    
                    const fullUrl = scriptUrl + '?' + params.toString();
                    console.log('🔄 Sync: Full URL:', fullUrl);
                    
                    fetch(fullUrl, {
                        method: 'GET',
                        mode: 'cors'
                    }).then(function(response) {
                        console.log('🔄 Sync: Response status:', response.status, response.statusText);
                        if (response.ok) {
                            return response.text();
                        } else {
                            console.error('🔄 Sync: Response not OK:', response.status, response.statusText);
                            return response.text().then(function(text) {
                                console.error('🔄 Sync: Response body:', text);
                                return null;
                            });
                        }
                    }).then(function(responseText) {
                        console.log('🔄 Sync: Response text:', responseText);
                        if (responseText) {
                            try {
                                const result = JSON.parse(responseText);
                                console.log('🔄 Sync: Parsed result:', result);
                                if (result.success) {
                                    console.log('✅ Authorized emails synced to server successfully');
                                    resolve(true);
                                    return;
                                } else {
                                    console.error('❌ Sync failed:', result.error);
                                }
                            } catch (e) {
                                console.error('❌ Error parsing sync response:', e, 'Response:', responseText);
                            }
                        }
                        resolve(false);
                    }).catch(function(error) {
                        console.error('❌ Sync fetch error:', error);
                        console.error('❌ Error details:', error.message, error.stack);
                        resolve(false);
                    });
                } catch (error) {
                    console.error('❌ Sync error:', error);
                    resolve(false);
                }
            });
        }
        
        // Manual sync function (for testing/debugging)
        window.manualSyncEmails = async function manualSyncEmails() {
            const emails = window.loadAuthorizedEmails();
            console.log('🔄 Manual sync: Starting sync for', emails.length, 'emails');
            const result = await syncAuthorizedEmailsToServer(emails);
            if (result) {
                alert('✅ Emails synced to server successfully!');
            } else {
                alert('❌ Failed to sync emails to server. Check the browser console for details.');
            }
            return result;
        };
        
        // Check what's stored on the server
        window.checkServerEmails = async function checkServerEmails() {
            try {
                let scriptUrl;
                if (typeof GOOGLE_APPS_SCRIPT_URL !== 'undefined') {
                    scriptUrl = GOOGLE_APPS_SCRIPT_URL;
                } else if (typeof window.getGoogleAppsScriptURL === 'function') {
                    scriptUrl = window.getGoogleAppsScriptURL();
                } else {
                    scriptUrl = 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec';
                }
                
                const emailsToken = getAdminSessionToken();
                const url = scriptUrl + '?action=getAuthorizedEmails' + (emailsToken ? '&token=' + encodeURIComponent(emailsToken) : '');
                console.log('🔍 Checking server emails:', url);
                
                const response = await fetch(url, { method: 'GET', mode: 'cors' });
                const text = await response.text();
                console.log('🔍 Server response:', text);
                
                if (text) {
                    const result = JSON.parse(text);
                    if (result.success) {
                        console.log('📧 Emails on server:', result.emails);
                        alert('Server has ' + result.emails.length + ' emails:\n' + result.emails.join('\n'));
                    } else {
                        console.error('❌ Server error:', result.error);
                        alert('Error: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('❌ Error checking server:', error);
                alert('Error checking server: ' + error.message);
            }
        };
        
        // Remove allowed email
        window.removeAllowedEmail = async function removeAllowedEmail(email) {
            const emails = window.loadAuthorizedEmails();
            
            // Safety check: prevent removing the last email
            if (emails.length <= 1) {
                alert('Error: At least one email address must remain in the allowed list.');
                return;
            }
            
            if (!confirm('Are you sure you want to remove ' + email + ' from the allowed list?')) {
                return;
            }
            
            const index = emails.indexOf(email.toLowerCase());
                if (index > -1) {
                emails.splice(index, 1);
                if (saveAllowedEmails(emails)) {
                    // Update AUTHORIZED_EMAILS for current session
                    if (typeof window.AUTHORIZED_EMAILS !== 'undefined') {
                        window.AUTHORIZED_EMAILS = emails;
                    }
                    
                    // Try to sync with server
                    await syncAuthorizedEmailsToServer(emails);
                    
                    // Refresh the list
                    renderAllowedEmailsList();
                    
                    alert('Email address removed successfully!');
                }
            }
        };
        
        function renderTypesList() {
            const container = document.getElementById('typesList');
            if (!container) return;
            
            // Sort types alphabetically
            const sortedTypes = data.filterOptions.types.slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            
            container.innerHTML = sortedTypes.map(function(type) {
                const index = data.filterOptions.types.indexOf(type);
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">' +
                    '<span>' + type + '</span>' +
                    '<button onclick="removeType(' + index + ')" style="background: #ffcccc; color: #000; border: none; padding: 4px 12px; border-radius: 18px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        function renderAreasList() {
            const container = document.getElementById('areasList');
            if (!container) return;
            
            // Sort areas alphabetically
            const sortedAreas = data.filterOptions.areas.slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            
            container.innerHTML = sortedAreas.map(function(area) {
                const index = data.filterOptions.areas.indexOf(area);
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">' +
                    '<span>' + area + '</span>' +
                    '<button onclick="removeArea(' + index + ')" style="background: #ffcccc; color: #000; border: none; padding: 4px 12px; border-radius: 18px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        function renderAmenitiesList() {
            const container = document.getElementById('amenitiesList');
            if (!container) return;
            
            // Sort amenities alphabetically
            const sortedAmenities = data.filterOptions.amenities.slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            
            container.innerHTML = sortedAmenities.map(function(amenity) {
                const index = data.filterOptions.amenities.indexOf(amenity);
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">' +
                    '<span>' + amenity + '</span>' +
                    '<button onclick="removeAmenity(' + index + ')" style="background: #ffcccc; color: #000; border: none; padding: 4px 12px; border-radius: 18px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        function addType() {
            const input = document.getElementById('newTypeInput');
            const value = input.value.trim();
            if (!value) return;
            
            if (data.filterOptions.types.indexOf(value) === -1) {
                data.filterOptions.types.push(value);
                saveFilterOptions();
                renderTypesList();
                updateTypeDropdown();
                input.value = '';
            } else {
                alert('This type already exists.');
            }
        }
        
        function removeType(index) {
            const confirmed = confirm('Remove Filter Type: "' + data.filterOptions.types[index] + '"\n\n' +
                                    'This will remove it from filter options but will not affect existing listings.\n\n' +
                                    'Click OK to remove this filter type\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                data.filterOptions.types.splice(index, 1);
                saveFilterOptions();
                renderTypesList();
                updateTypeDropdown();
            }
        }
        
        function addArea() {
            const input = document.getElementById('newAreaInput');
            const value = input.value.trim();
            if (!value) return;
            
            if (data.filterOptions.areas.indexOf(value) === -1) {
                data.filterOptions.areas.push(value);
                saveFilterOptions();
                renderAreasList();
                updateAreaDropdown();
                input.value = '';
            } else {
                alert('This area already exists.');
            }
        }
        
        function removeArea(index) {
            const confirmed = confirm('Remove Filter Area: "' + data.filterOptions.areas[index] + '"\n\n' +
                                    'This will remove it from filter options but will not affect existing listings.\n\n' +
                                    'Click OK to remove this filter area\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                data.filterOptions.areas.splice(index, 1);
                saveFilterOptions();
                renderAreasList();
                updateAreaDropdown();
            }
        }
        
        function addAmenity() {
            const input = document.getElementById('newAmenityInput');
            const value = input.value.trim();
            if (!value) return;
            
            if (data.filterOptions.amenities.indexOf(value) === -1) {
                data.filterOptions.amenities.push(value);
                saveFilterOptions();
                renderAmenitiesList();
                updateAmenitiesCheckboxes();
                input.value = '';
            } else {
                alert('This amenity already exists.');
            }
        }
        
        function removeAmenity(index) {
            const confirmed = confirm('Remove Filter Amenity: "' + data.filterOptions.amenities[index] + '"\n\n' +
                                    'This will remove it from filter options but will not affect existing listings.\n\n' +
                                    'Click OK to remove this filter amenity\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                data.filterOptions.amenities.splice(index, 1);
                saveFilterOptions();
                renderAmenitiesList();
                updateAmenitiesCheckboxes();
            }
        }
        
        function renderCategoriesList() {
            const container = document.getElementById('categoriesList');
            if (!container) return;
            
            // Clean up duplicate/unused categories on render
            // Check for case-sensitive duplicates (e.g., "community" vs "Community")
            const categoryKeys = Object.keys(TYPE_CATEGORIES);
            const lowerCaseKeys = {};
            const duplicatesToRemove = [];
            
            categoryKeys.forEach(function(key) {
                const lowerKey = key.toLowerCase();
                if (!lowerCaseKeys[lowerKey]) {
                    lowerCaseKeys[lowerKey] = key;
                } else {
                    // Found a duplicate - check which one has listings
                    const existingKey = lowerCaseKeys[lowerKey];
                    const existingListings = data && data.listings ? data.listings.filter(function(l) { return l.category === existingKey; }).length : 0;
                    const newListings = data && data.listings ? data.listings.filter(function(l) { return l.category === key; }).length : 0;
                    
                    if (newListings === 0 && existingListings > 0) {
                        // Remove the one with no listings
                        duplicatesToRemove.push(key);
                    } else if (existingListings === 0 && newListings > 0) {
                        // Remove the existing one, keep the new one
                        duplicatesToRemove.push(existingKey);
                        lowerCaseKeys[lowerKey] = key;
                    } else {
                        // Both have same usage (likely 0), prefer lowercase
                        if (key !== lowerKey && existingKey === lowerKey) {
                            duplicatesToRemove.push(key);
                        } else if (existingKey !== lowerKey && key === lowerKey) {
                            duplicatesToRemove.push(existingKey);
                            lowerCaseKeys[lowerKey] = key;
                        }
                    }
                }
            });
            
            // Remove duplicates
            if (duplicatesToRemove.length > 0) {
                console.log('🧹 Removing duplicate/unused category keys:', duplicatesToRemove);
                duplicatesToRemove.forEach(function(key) {
                    delete TYPE_CATEGORIES[key];
                });
                saveCategoriesToStorage(TYPE_CATEGORIES);
            }

            migrateCommunityToAttractions(TYPE_CATEGORIES);
            if (TYPE_CATEGORIES.community) {
                delete TYPE_CATEGORIES.community;
                saveCategoriesToStorage(TYPE_CATEGORIES);
            }
            
            // Get all category keys and sort by name
            const finalCategoryKeys = Object.keys(TYPE_CATEGORIES).filter(function(key) {
                return String(key).toLowerCase() !== 'community';
            }).slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            
            container.innerHTML = finalCategoryKeys.map(function(categoryKey) {
                const category = TYPE_CATEGORIES[categoryKey];
                const escapedKey = categoryKey.replace(/'/g, "\\'");
                return '<div id="categoryItem_' + escapedKey + '" style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">' +
                    '<span>' + (category.emoji || '⭐') + ' ' + escapeHtml(toSentenceCase(categoryKey)) + '</span>' +
                    '<div style="display: flex; gap: 8px;">' +
                    '<button onclick="renameCategoryKey(\'' + escapedKey + '\')" style="background: #007bff; color: white; border: none; padding: 4px 12px; border-radius: 18px; cursor: pointer; font-size: 12px;">Edit</button>' +
                    '<button onclick="removeCategory(\'' + escapedKey + '\')" style="background: #ffcccc; color: #000; border: none; padding: 4px 12px; border-radius: 18px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>' +
                    '</div>';
            }).join('');
        }
        
        window.renameCategoryKey = async function renameCategoryKey(oldKey) {
            const category = TYPE_CATEGORIES[oldKey];
            if (!category) return;
            
            // Check if any listings use this category
            const affectedListings = data && data.listings ? data.listings.filter(function(listing) {
                return listing.category === oldKey;
            }) : [];
            
            // Prompt for new key, emoji, and description
            const newKey = prompt(
                '⚠️ Edit Category\n\n' +
                'Current key: "' + oldKey + '"\n' +
                'Current emoji: ' + (category.emoji || '⭐') + '\n' +
                'Current description: ' + (category.description || '(none)') + '\n\n' +
                (affectedListings.length > 0 ? 'This will update ' + affectedListings.length + ' listing(s).\n\n' : '') +
                'Enter new category key (lowercase, no spaces, e.g., "tasting"):',
                oldKey
            );
            
            if (!newKey || newKey.trim() === '') {
                return; // User cancelled
            }
            
            const trimmedNewKey = newKey.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            const keyChanged = trimmedNewKey !== oldKey;
            
            if (keyChanged) {
                // Check if new key already exists
                if (TYPE_CATEGORIES[trimmedNewKey]) {
                    alert('A category with key "' + trimmedNewKey + '" already exists. Please choose a different key.');
                    return;
                }
            }
            
            // Prompt for emoji
            const newEmoji = prompt(
                'Enter emoji for this category:',
                category.emoji || '⭐'
            );
            
            if (newEmoji === null) {
                return; // User cancelled
            }
            
            // Prompt for description
            const newDescription = prompt(
                'Enter description for this category:',
                category.description || ''
            );
            
            if (newDescription === null) {
                return; // User cancelled
            }
            
            const confirmed = confirm(
                '⚠️ Final Confirmation\n\n' +
                'Edit category:\n' +
                (keyChanged ? '  Key: "' + oldKey + '" → "' + trimmedNewKey + '"\n' : '  Key: "' + oldKey + '" (unchanged)\n') +
                '  Emoji: ' + (category.emoji || '⭐') + ' → ' + (newEmoji ? newEmoji.trim() : category.emoji || '⭐') + '\n' +
                '  Description: ' + (category.description || '(none)') + ' → ' + (newDescription ? newDescription.trim() : category.description || '(none)') + '\n\n' +
                (affectedListings.length > 0 ? 'This will update ' + affectedListings.length + ' listing(s) and sync to Google Sheets.\n\n' : '') +
                'Click OK to proceed\n' +
                'Click Cancel to abort'
            );
            
            if (!confirmed) {
                return;
            }
            
            if (keyChanged) {
                // Create new category with new key and updated values
                TYPE_CATEGORIES[trimmedNewKey] = {
                    emoji: newEmoji ? newEmoji.trim() || '⭐' : category.emoji || '⭐',
                    description: newDescription ? newDescription.trim() : category.description || '',
                    icon: category.icon || '',
                    types: category.types || []
                };
                
                // Update all affected listings to use new key
                if (affectedListings.length > 0) {
                    affectedListings.forEach(function(listing) {
                        listing.category = trimmedNewKey;
                    });
                }
                
                // Delete old category
                delete TYPE_CATEGORIES[oldKey];
            } else {
                // Key didn't change, just update the category in place
                category.emoji = newEmoji ? newEmoji.trim() || '⭐' : category.emoji || '⭐';
                category.description = newDescription ? newDescription.trim() : category.description || '';
            }
            
            // Save to localStorage
            saveCategoriesToStorage(TYPE_CATEGORIES);
            renderCategoriesList();
            renderCategories();
            updateCategoryDropdown();
            
            // Refresh listings display - always refresh to show updated category info
            if (data && data.listings) {
                populateAdminFilters();
                renderListings(data.listings);
            }
            
            // Push changes to Google Sheets
            if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                try {
                    updateSyncStatus(true, 'Syncing category edit to Google Sheets…');
                    
                    // Save categories first
                    const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                    const categoriesData = JSON.stringify({
                        action: 'saveCategories',
                        categories: TYPE_CATEGORIES,
                        sessionToken: session && session.token ? session.token : null
                    });
                    
                    // Always save listings if there are any (to ensure admin display is synced)
                    if (data && data.listings && data.listings.length > 0) {
                        const listingsData = JSON.stringify({
                            action: 'replaceAllListings',
                            listings: data.listings,
                            sessionToken: session && session.token ? session.token : null
                        });
                        
                        try {
                            // Save categories
                            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: categoriesData
                            });
                            
                            // Save listings (to ensure all listings are synced with updated category info)
                            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: listingsData
                            });
                            
                            updateSyncStatus(true, 'Category edited; changes synced to Google Sheets.');
                            alert('✅ Category edited:\n' +
                                  (keyChanged ? '  Key: "' + oldKey + '" → "' + trimmedNewKey + '"\n' : '  Key: "' + oldKey + '" (unchanged)\n') +
                                  (affectedListings.length > 0 ? '  Updated ' + affectedListings.length + ' listing(s).\n' : '') +
                                  '\nChanges have been synced to Google Sheets.');
                        } catch (e) {
                            console.warn('⚠️ Could not sync category edit to Google Sheets:', e);
                            updateSyncStatus(false, 'Category edited locally (sync failed).');
                            alert('⚠️ Category edited locally, but sync to Google Sheets failed.\n\n' +
                                  'Please click "Save to Sheets" to sync changes.');
                        }
                    } else {
                        // No listings, just save categories
                        try {
                            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: categoriesData
                            });
                            updateSyncStatus(true, 'Category edited and synced to Google Sheets.');
                            alert('✅ Category edited:\n' +
                                  (keyChanged ? '  Key: "' + oldKey + '" → "' + trimmedNewKey + '"\n' : '  Key: "' + oldKey + '" (unchanged)\n') +
                                  '\nChanges have been synced to Google Sheets.');
                        } catch (e) {
                            console.warn('⚠️ Could not sync category edit to Google Sheets:', e);
                            updateSyncStatus(false, 'Category edited locally (sync failed).');
                            alert('⚠️ Category edited locally, but sync to Google Sheets failed.\n\n' +
                                  'Please click "Save to Sheets" to sync changes.');
                        }
                    }
                } catch (error) {
                    console.error('Error syncing category edit to Google Sheets:', error);
                    updateSyncStatus(false, 'Category edited locally (sync failed).');
                    alert('⚠️ Category edited locally, but sync to Google Sheets failed.\n\n' +
                          'Please click "Save to Sheets" to sync changes.');
                }
            } else {
                alert('✅ Category edited:\n' +
                      (keyChanged ? '  Key: "' + oldKey + '" → "' + trimmedNewKey + '"\n' : '  Key: "' + oldKey + '" (unchanged)\n') +
                      (affectedListings.length > 0 ? '  Updated ' + affectedListings.length + ' listing(s).\n' : '') +
                      '\n⚠️ Google Sheets not configured. Changes saved locally only.');
            }
        }
        
        async function addCategory() {
            const input = document.getElementById('newCategoryInput');
            const categoryName = input.value.trim();
            if (!categoryName) return;
            
            // Check if category name already exists
            const existingCategory = Object.keys(TYPE_CATEGORIES).find(function(key) {
                return TYPE_CATEGORIES[key].name && TYPE_CATEGORIES[key].name.toLowerCase() === categoryName.toLowerCase();
            });
            
            if (existingCategory) {
                alert('A category with this name already exists.');
                return;
            }
            
            // Prompt for emoji
            const emoji = prompt('Enter an emoji for this category (optional):', '⭐');
            const finalEmoji = emoji ? emoji.trim() : '⭐';
            
            // Create category key from name (lowercase, replace spaces with hyphens)
            const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            // Check if key already exists
            if (TYPE_CATEGORIES[categoryKey]) {
                alert('A category with this key already exists. Please use a different name.');
                return;
            }
            
            // Add new category
            TYPE_CATEGORIES[categoryKey] = {
                emoji: finalEmoji,
                name: categoryName,
                description: categoryName + ' listings',
                icon: 'icon-default',
                types: []
            };
            
            saveCategoriesToStorage(TYPE_CATEGORIES);
            renderCategoriesList();
            updateCategoryDropdown();
            input.value = '';
            
            // Save to Google Sheets
            if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                updateSyncStatus(true, 'Syncing new category to Google Sheets…');
                const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                const postData = JSON.stringify({
                    action: 'saveCategories',
                    categories: TYPE_CATEGORIES,
                    sessionToken: session && session.token ? session.token : null
                });
                fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: postData
                })
                .then(function(response) {
                    return response.json();
                })
                .then(function(result) {
                    if (result.success) {
                        updateSyncStatus(true, 'Category added and synced to Google Sheets.');
                    } else {
                        updateSyncStatus(false, 'Category added locally (sync failed).');
                    }
                })
                .catch(function(e) {
                    console.warn('⚠️ Could not sync new category to Google Sheets:', e);
                    updateSyncStatus(false, 'Category added locally (sync failed).');
                });
            }
        }
        
        async function removeCategory(categoryKey) {
            const category = TYPE_CATEGORIES[categoryKey];
            if (!category) return;
            
            // Check if any listings use this category
            const affectedListings = data && data.listings ? data.listings.filter(function(listing) {
                return listing.category === categoryKey;
            }) : [];
            
            if (affectedListings.length > 0) {
                // Show dialog asking for replacement category
                const availableCategories = Object.keys(TYPE_CATEGORIES).filter(function(key) {
                    return key !== categoryKey;
                });
                
                if (availableCategories.length === 0) {
                    alert('⚠️ Cannot delete this category!\n\n' +
                          'This is the only category remaining. You must have at least one category.\n\n' +
                          'Please create another category first before deleting this one.');
                    return;
                }
                
                // Build category selection options
                let categoryOptions = 'Select a replacement category for ' + affectedListings.length + ' listing(s):\n\n';
                availableCategories.forEach(function(key, index) {
                    const cat = TYPE_CATEGORIES[key];
                    categoryOptions += (index + 1) + '. ' + (cat.emoji || '') + ' ' + (cat.name || key) + '\n';
                });
                
                const replacementKey = prompt(
                    '⚠️ Delete Category: "' + (category.name || categoryKey) + '"\n\n' +
                    'This category is used by ' + affectedListings.length + ' listing(s).\n\n' +
                    categoryOptions + '\n' +
                    'Enter the number (1-' + availableCategories.length + ') of the category to replace it with:',
                    '1'
                );
                
                if (!replacementKey) {
                    return; // User cancelled
                }
                
                const replacementIndex = parseInt(replacementKey) - 1;
                if (isNaN(replacementIndex) || replacementIndex < 0 || replacementIndex >= availableCategories.length) {
                    alert('Invalid selection. Category deletion cancelled.');
                    return;
                }
                
                const newCategoryKey = availableCategories[replacementIndex];
                const newCategory = TYPE_CATEGORIES[newCategoryKey];
                
                const confirmed = confirm(
                    '⚠️ Final Confirmation\n\n' +
                    'Delete Category: "' + (category.name || categoryKey) + '"\n\n' +
                    'Replace with: ' + (newCategory.emoji || '') + ' ' + (newCategory.name || newCategoryKey) + '\n\n' +
                    'This will update ' + affectedListings.length + ' listing(s) and sync to Google Sheets.\n\n' +
                    'Click OK to proceed\n' +
                    'Click Cancel to abort'
                );
                
                if (!confirmed) {
                    return; // User cancelled
                }
                
                // Update all affected listings
                affectedListings.forEach(function(listing) {
                    listing.category = newCategoryKey;
                });
                
                // Delete the category
                delete TYPE_CATEGORIES[categoryKey];
                saveCategoriesToStorage(TYPE_CATEGORIES);
                renderCategoriesList();
                renderCategories();
                updateCategoryDropdown();
                
                // Refresh listings display
                if (data && data.listings) {
                    populateAdminFilters();
                    renderListings(data.listings);
                }
                
                // Push changes to Google Sheets
                if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                    try {
                        updateSyncStatus(true, 'Syncing category deletion to Google Sheets…');
                        
                        // Save updated categories and listings
                        const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                        const categoriesData = JSON.stringify({
                            action: 'saveCategories',
                            categories: TYPE_CATEGORIES,
                            sessionToken: session && session.token ? session.token : null
                        });
                        const listingsData = JSON.stringify({
                            action: 'replaceAllListings',
                            listings: data.listings,
                            sessionToken: session && session.token ? session.token : null
                        });
                        
                        try {
                            // Save categories first
                            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: categoriesData
                            });
                            
                            // Then save listings
                            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: listingsData
                            });
                            
                            updateSyncStatus(true, 'Category deleted; changes synced to Google Sheets.');
                            alert('✅ Category "' + (category.name || categoryKey) + '" deleted.\n\n' +
                                  'Updated ' + affectedListings.length + ' listing(s) to use "' + (newCategory.name || newCategoryKey) + '"\n\n' +
                                  'Changes have been synced to Google Sheets.');
                        } catch (e) {
                            console.warn('⚠️ Could not sync category deletion to Google Sheets:', e);
                            updateSyncStatus(false, 'Category deleted locally (sync failed).');
                            alert('⚠️ Category deleted locally, but sync to Google Sheets failed.\n\n' +
                                  'Please click "Save to Sheets" to sync changes.');
                        }
                    } catch (error) {
                        console.error('Error syncing category deletion to Google Sheets:', error);
                        updateSyncStatus(false, 'Category deleted locally (sync failed).');
                        alert('⚠️ Category deleted locally, but sync to Google Sheets failed.\n\n' +
                              'Please click "Save to Sheets" to sync changes.');
                    }
                } else {
                    alert('✅ Category "' + (category.name || categoryKey) + '" deleted.\n\n' +
                          'Updated ' + affectedListings.length + ' listing(s) to use "' + (newCategory.name || newCategoryKey) + '"\n\n' +
                          '⚠️ Google Sheets not configured. Changes saved locally only.');
                }
            } else {
                // No listings use this category, safe to delete
                const confirmed = confirm('Remove Category: "' + (category.name || categoryKey) + '"\n\n' +
                                        'This category is not used by any listings.\n\n' +
                                        'Click OK to remove this category\n' +
                                        'Click Cancel to keep it');
                if (confirmed) {
                    delete TYPE_CATEGORIES[categoryKey];
                    saveCategoriesToStorage(TYPE_CATEGORIES);
                    renderCategoriesList();
                    renderCategories();
                    updateCategoryDropdown();
                    
                    // Save to Google Sheets
                    if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                        try {
                            updateSyncStatus(true, 'Syncing category deletion to Google Sheets…');
                            const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                            const postData = JSON.stringify({
                                action: 'saveCategories',
                                categories: TYPE_CATEGORIES,
                                sessionToken: session && session.token ? session.token : null
                            });
                            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: postData
                            });
                            const result = await response.json();
                            if (result.success) {
                                updateSyncStatus(true, 'Category deleted and synced to Google Sheets.');
                            } else {
                                updateSyncStatus(false, 'Category deleted locally (sync failed).');
                            }
                        } catch (e) {
                            console.warn('⚠️ Could not sync category deletion to Google Sheets:', e);
                            updateSyncStatus(false, 'Category deleted locally (sync failed).');
                        }
                    }
                }
            }
        }
        
        // ===========================================
        // ICON MAPPING MANAGEMENT FUNCTIONS
        // ===========================================
        
        // List of available icon classes
        const AVAILABLE_ICONS = [
            'icon-wine', 'icon-beer', 'icon-spirits', 'icon-cocktail', 'icon-coffee', 'icon-tea',
            'icon-restaurant', 'icon-bakery', 'icon-cheese', 'icon-chocolate', 'icon-museum', 'icon-art',
            'icon-gallery', 'icon-hiking', 'icon-cycling', 'icon-activity', 'icon-kayaking', 'icon-spa',
            'icon-wellness', 'icon-shopping', 'icon-market', 'icon-concert', 'icon-theater', 'icon-cinema',
            'icon-festival', 'icon-hotel', 'icon-lodging', 'icon-transport', 'icon-train', 'icon-boat',
            'icon-scenic', 'icon-viewpoint', 'icon-park', 'icon-garden', 'icon-beach', 'icon-history',
            'icon-culture', 'icon-architecture', 'icon-local', 'icon-tour', 'icon-workshop', 'icon-class',
            'icon-food', 'icon-cidery', 'icon-indoor', 'icon-attraction', 'icon-farm', 'icon-outdoor',
            'icon-default'
        ];
        
        function renderIconMappings() {
            const container = document.getElementById('iconsList');
            if (!container) return;
            
            // Get sorted list of type-icon mappings
            const mappings = Object.keys(ICON_MAPPINGS).map(function(type) {
                return { type: type, icon: ICON_MAPPINGS[type] };
            }).sort(function(a, b) {
                return a.type.localeCompare(b.type);
            });
            
            if (mappings.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; padding: 20px; text-align: center;">No icon mappings found. Click "Add New Mapping" to create one.</p>';
                return;
            }
            
            // Create a temporary container to build the HTML safely
            const tempContainer = document.createElement('div');
            
            mappings.forEach(function(mapping, index) {
                const iconOptions = AVAILABLE_ICONS.map(function(icon) {
                    return '<option value="' + icon + '"' + (icon === mapping.icon ? ' selected' : '') + '>' + icon.replace('icon-', '') + '</option>';
                }).join('');
                
                // Escape type for HTML display only
                const escapedTypeForHTML = mapping.type.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                const item = document.createElement('div');
                item.className = 'icon-mapping-item';
                item.setAttribute('data-type', mapping.type); // Store actual type in data attribute
                item.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 15px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px;';
                
                item.innerHTML = '<div style="flex: 1;">' +
                    '<div style="font-weight: 600; color: #212529; margin-bottom: 5px;">' + escapedTypeForHTML + '</div>' +
                    '<div style="font-size: 12px; color: #6c757d;">Type</div>' +
                    '</div>' +
                    '<div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">' +
                    '<span class="badge-type ' + mapping.icon + '" style="width: 24px; height: 24px; display: inline-block;"></span>' +
                    '</div>' +
                    '<div style="flex: 1;">' +
                    '<select class="icon-select" style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">' +
                    iconOptions +
                    '</select>' +
                    '</div>' +
                    '<button class="remove-icon-mapping-btn" style="background: #ffcccc; color: #000; border: none; padding: 8px 16px; border-radius: 18px; cursor: pointer; font-size: 14px;">Remove</button>';
                
                tempContainer.appendChild(item);
            });
            
            container.innerHTML = '';
            container.appendChild(tempContainer);
            
            // Attach event listeners after rendering
            container.querySelectorAll('.icon-select').forEach(function(select) {
                select.addEventListener('change', function() {
                    const item = this.closest('.icon-mapping-item');
                    const type = item.getAttribute('data-type');
                    const iconClass = this.value;
                    updateIconMapping(type, iconClass);
                });
            });
            
            container.querySelectorAll('.remove-icon-mapping-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const item = this.closest('.icon-mapping-item');
                    const type = item.getAttribute('data-type');
                    removeIconMapping(type);
                });
            });
        }
        
        window.updateIconMapping = function updateIconMapping(type, iconClass) {
            if (!type || !iconClass) return;
            
            ICON_MAPPINGS[type] = iconClass;
            saveIconMappingsToStorage(ICON_MAPPINGS);
            
            // Re-render to show updated icon
            renderIconMappings();
            
            // Update preview if we have listings displayed
            if (data && data.listings) {
                renderListings(data.listings);
                if (typeof renderPreview === 'function') {
                    renderPreview(data.listings);
                }
            }
        };
        
        window.addIconMapping = function addIconMapping() {
            const type = prompt('Enter the listing type name:');
            if (!type || !type.trim()) return;
            
            const trimmedType = type.trim();
            if (ICON_MAPPINGS[trimmedType]) {
                alert('This type already has an icon mapping. Use the edit function to change it.');
                return;
            }
            
            // Default to icon-default
            ICON_MAPPINGS[trimmedType] = 'icon-default';
            saveIconMappingsToStorage(ICON_MAPPINGS);
            renderIconMappings();
            
            // Scroll to the new mapping
            setTimeout(function() {
                const item = document.querySelector('.icon-mapping-item[data-type="' + trimmedType + '"]');
                if (item) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.style.background = '#fff3cd';
                    setTimeout(function() {
                        item.style.background = '#ffffff';
                    }, 2000);
                }
            }, 100);
        };
        
        window.removeIconMapping = function removeIconMapping(type) {
            if (!type) return;
            
            const confirmed = confirm('Remove icon mapping for type: "' + type + '"\n\n' +
                                    'This will remove the custom mapping. The type will use the default icon.\n\n' +
                                    'Click OK to remove this mapping\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                delete ICON_MAPPINGS[type];
                saveIconMappingsToStorage(ICON_MAPPINGS);
                renderIconMappings();
                
                // Update preview if we have listings displayed
                if (data && data.listings) {
                    renderListings(data.listings);
                    if (typeof renderPreview === 'function') {
                        renderPreview(data.listings);
                    }
                }
            }
        };
        
        window.filterIconMappings = function filterIconMappings() {
            const searchTerm = document.getElementById('iconMappingSearch').value.toLowerCase().trim();
            const items = document.querySelectorAll('.icon-mapping-item');
            
            items.forEach(function(item) {
                const type = item.dataset.type.toLowerCase();
                const iconSelect = item.querySelector('.icon-select');
                const icon = iconSelect ? iconSelect.value.toLowerCase() : '';
                const matches = !searchTerm || type.indexOf(searchTerm) > -1 || icon.indexOf(searchTerm) > -1;
                item.style.display = matches ? 'flex' : 'none';
            });
        };
        
        window.resetIconMappingsToDefaults = function resetIconMappingsToDefaults() {
            const confirmed = confirm('Reset all icon mappings to defaults?\n\n' +
                                    'This will replace all current mappings with the default set.\n\n' +
                                    'Click OK to reset\n' +
                                    'Click Cancel to keep current mappings');
            if (confirmed) {
                ICON_MAPPINGS = JSON.parse(JSON.stringify(window.DEFAULT_ICON_MAPPINGS || DEFAULT_ICON_MAPPINGS));
                saveIconMappingsToStorage(ICON_MAPPINGS);
                renderIconMappings();
                
                // Update preview if we have listings displayed
                if (data && data.listings) {
                    renderListings(data.listings);
                    if (typeof renderPreview === 'function') {
                        renderPreview(data.listings);
                    }
                }
            }
        };
        
        window.exportIconMappings = function exportIconMappings() {
            const dataStr = JSON.stringify(ICON_MAPPINGS, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'icon-mappings-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
        };
        
        window.importIconMappings = function importIconMappings(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported && typeof imported === 'object') {
                        const confirmed = confirm('Import icon mappings?\n\n' +
                                                'This will replace all current mappings with the imported ones.\n\n' +
                                                'Click OK to import\n' +
                                                'Click Cancel to cancel');
                        if (confirmed) {
                            ICON_MAPPINGS = imported;
                            saveIconMappingsToStorage(ICON_MAPPINGS);
                            renderIconMappings();
                            
                            // Update preview if we have listings displayed
                            if (data && data.listings) {
                                renderListings(data.listings);
                                if (typeof renderPreview === 'function') {
                                    renderPreview(data.listings);
                                }
                            }
                            
                            alert('Icon mappings imported successfully!');
                        }
                    } else {
                        alert('Invalid file format. Please import a valid JSON file.');
                    }
                } catch (err) {
                    alert('Error importing file: ' + err.message);
                }
            };
            reader.readAsText(file);
            event.target.value = ''; // Reset file input
        };
        
        function saveFilterOptions() {
            // Save to localStorage
            localStorage.setItem('nelsonCounty_filterOptions', JSON.stringify(data.filterOptions));
            // Show green banner for settings changes
            updateSyncStatus(true, 'Settings updated.');
        }
        
        // ===========================================
        // CATEGORY MANAGEMENT FUNCTIONS
        // ===========================================
        
        // Convert text to sentence case (first letter capitalized, rest lowercase)
        function toSentenceCase(text) {
            if (!text || typeof text !== 'string') return text;
            const trimmed = text.trim();
            if (trimmed.length === 0) return text;
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        }
        
        function renderCategories() {
            // Use the same function as renderCategoriesList for consistency
            renderCategoriesList();
        }
        
        window.updateCategory = async function updateCategory(categoryKey) {
            const category = TYPE_CATEGORIES[categoryKey];
            if (!category) return;
            
            const emojiInput = document.getElementById('categoryEmoji_' + categoryKey);
            const descInput = document.getElementById('categoryDesc_' + categoryKey);
            
            if (!emojiInput || !descInput) return;
            
            category.emoji = emojiInput.value.trim() || '⭐';
            category.description = descInput.value.trim();
            
            // Note: Icons are set in DEFAULT_TYPE_CATEGORIES and not editable
            // If icon is missing, preserve it from defaults or use category key as fallback
            if (!category.icon && DEFAULT_TYPE_CATEGORIES[categoryKey]) {
                category.icon = DEFAULT_TYPE_CATEGORIES[categoryKey].icon || 'icon-default';
            }
            
            saveCategoriesToStorage(TYPE_CATEGORIES);
            renderCategories();
            
            // Refresh admin filters and listings to show updated category info
            if (data && data.listings) {
                populateAdminFilters();
                renderListings(data.listings);
            }
            
            // Automatically push category definitions to Google Sheets
            if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                try {
                    updateSyncStatus(true, 'Syncing category definitions to Google Sheets…');
                    
                    // Save all categories to Google Sheets Categories sheet
                    const session = (typeof getAuthSession === 'function') ? await getAuthSession() : null;
                    const postData = JSON.stringify({
                        action: 'saveCategories',
                        categories: TYPE_CATEGORIES,
                        sessionToken: session && session.token ? session.token : null
                    });
                    
                    try {
                        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                            method: 'POST',
                            mode: 'cors',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: postData
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            updateSyncStatus(true, 'Category definitions synced to Google Sheets.');
                            console.log('✅ Category "' + category.name + '" updated and synced to Google Sheets');
                        } else {
                            throw new Error(result.error || 'Unknown error');
                        }
                    } catch (e) {
                        console.warn('⚠️ Could not sync category definitions to Google Sheets:', e);
                        updateSyncStatus(false, 'Category saved locally (sync failed).');
                    }
                } catch (error) {
                    console.error('Error syncing category to Google Sheets:', error);
                    updateSyncStatus(false, 'Category saved locally (sync failed).');
                }
            }
        };
        
        
        window.resetCategoriesToDefaults = function resetCategoriesToDefaults() {
            if (confirm('Reset all categories to default values? This will overwrite all your customizations.')) {
                TYPE_CATEGORIES = JSON.parse(JSON.stringify(DEFAULT_TYPE_CATEGORIES));
                saveCategoriesToStorage(TYPE_CATEGORIES);
                renderCategories();
                alert('Categories reset to defaults.');
            }
        };
        
        window.exportCategories = function exportCategories() {
            const blob = new Blob([JSON.stringify(TYPE_CATEGORIES, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'categories-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };
        
        window.importCategories = function importCategories(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported && typeof imported === 'object') {
                        if (confirm('Import categories? This will overwrite your current categories.')) {
                            TYPE_CATEGORIES = imported;
                            saveCategoriesToStorage(TYPE_CATEGORIES);
                            renderCategories();
                            alert('Categories imported successfully.');
                        }
                    } else {
                        alert('Invalid categories file.');
                    }
                } catch (error) {
                    alert('Error importing categories: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        function updateCategoryDropdown() {
            const select = document.getElementById('listingCategory');
            if (!select) return;
            
            const currentValue = select.value;
            const categoryKeys = Object.keys(TYPE_CATEGORIES).filter(function(key) {
                return String(key).toLowerCase() !== 'community';
            });
            const categoryKeysSet = new Set(categoryKeys);
            
            // Build options list with all categories from TYPE_CATEGORIES
            let optionsHtml = '<option value="">Select Category</option>' +
                categoryKeys.map(function(categoryKey) {
                    const category = TYPE_CATEGORIES[categoryKey];
                    return '<option value="' + escapeHtml(categoryKey) + '">' + escapeHtml(category.emoji || '') + ' ' + escapeHtml(toSentenceCase(categoryKey)) + '</option>';
                }).join('');
            
            // If current value exists but isn't in TYPE_CATEGORIES, add it to preserve custom categories from Google Sheets
            if (currentValue && currentValue.trim() && !categoryKeysSet.has(currentValue) && normalizeCategoryKey(currentValue) !== 'attractions') {
                optionsHtml += '<option value="' + escapeHtml(currentValue) + '">' + escapeHtml(currentValue) + ' (from Google Sheets)</option>';
                console.log('📋 Adding custom category to dropdown:', currentValue);
            }
            
            select.innerHTML = optionsHtml;
            if (normalizeCategoryKey(currentValue) === 'attractions') {
                select.value = 'attractions';
            } else {
                select.value = currentValue;
            }
        }
        
        function updateTypeDropdown() {
            const select = document.getElementById('listingType');
            if (!select) return;
            
            // Ensure data is initialized
            if (typeof data === 'undefined' || !data || !data.filterOptions || !data.filterOptions.types) {
                console.warn('Data not initialized yet, skipping updateTypeDropdown');
                return;
            }
            
            const currentValue = select.value;
            // Sort types alphabetically
            const sortedTypes = data.filterOptions.types.slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            // Build options list, preserving the current value if it's not in filterOptions.types
            const typesSet = new Set(sortedTypes);
            let optionsHtml = '<option value="">Select Type</option>' +
                sortedTypes.map(function(type) {
                    return '<option value="' + escapeHtml(type) + '">' + escapeHtml(type) + '</option>';
                }).join('');
            
            // If current value exists but isn't in the standard types, add it to preserve user input
            if (currentValue && currentValue.trim() && !typesSet.has(currentValue)) {
                optionsHtml += '<option value="' + escapeHtml(currentValue) + '">' + escapeHtml(currentValue) + '</option>';
            }
            
            select.innerHTML = optionsHtml;
            select.value = currentValue; // This will now work even for custom types
            
            // Update category dropdown when type changes
            updateCategoryDropdown();
        }
        
        function updateAreaDropdown() {
            const select = document.getElementById('listingArea');
            if (!select) return;
            
            // Ensure data is initialized
            if (typeof data === 'undefined' || !data || !data.filterOptions || !data.filterOptions.areas) {
                console.warn('Data not initialized yet, skipping updateAreaDropdown');
                return;
            }
            
            const currentValue = select.value;
            // Sort areas alphabetically
            const sortedAreas = data.filterOptions.areas.slice().sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            select.innerHTML = '<option value="">Select Area</option>' +
                sortedAreas.map(function(area) {
                    return '<option value="' + escapeHtml(area) + '">' + escapeHtml(area) + '</option>';
                }).join('');
            select.value = currentValue;
        }
        
        function updateAmenitiesCheckboxes() {
            renderAmenitiesCheckboxes();
        }

        async function fetchImageKitUploadParams() {
            const imagekitToken = getAdminSessionToken();
            const tokenQuery = imagekitToken ? '&token=' + encodeURIComponent(imagekitToken) : '';
            const urlWithQuery = GOOGLE_APPS_SCRIPT_URL + '?action=' + encodeURIComponent(IMAGEKIT_AUTH_ACTION) + tokenQuery + '&t=' + Date.now();
            
            try {
                console.log('Fetching ImageKit params via GET from:', urlWithQuery);
                const response = await fetch(urlWithQuery, { method: 'GET' });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('GET request failed with status', response.status, 'Response:', errorText);
                    throw new Error('HTTP ' + response.status + ': ' + errorText.substring(0, 200));
                }
                
                let json;
                try {
                    const responseText = await response.text();
                    console.log('GET response text:', responseText.substring(0, 500));
                    json = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse GET response as JSON:', parseError);
                    throw new Error('Invalid JSON response from server');
                }
                
                if (!json || json.success === false) {
                    throw new Error((json && json.error) || 'Failed to fetch ImageKit upload params');
                }
                const data = json.data || json;
                if (!data || !data.token || !data.signature || !data.expire) {
                    console.error('Missing required fields in response:', data);
                    throw new Error('Invalid ImageKit params response (missing fields). Got: ' + JSON.stringify(Object.keys(data || {})));
                }
                console.log('ImageKit params fetched successfully via GET');
                return data;
            } catch (getError) {
                console.warn('GET request for ImageKit params failed, falling back to POST:', getError);
                
                try {
                    console.log('Fetching ImageKit params via POST from:', GOOGLE_APPS_SCRIPT_URL);
                    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'action=' + encodeURIComponent(IMAGEKIT_AUTH_ACTION) + (imagekitToken ? '&token=' + encodeURIComponent(imagekitToken) : '')
                    });
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('POST request failed with status', response.status, 'Response:', errorText);
                        throw new Error('HTTP ' + response.status + ': ' + errorText.substring(0, 200));
                    }
                    
                    let json;
                    try {
                        const responseText = await response.text();
                        console.log('POST response text:', responseText.substring(0, 500));
                        json = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('Failed to parse POST response as JSON:', parseError);
                        throw new Error('Invalid JSON response from server');
                    }
                    
                    if (!json || json.success === false) {
                        throw new Error((json && json.error) || 'Failed to fetch ImageKit upload params');
                    }
                    const data = json.data || json;
                    if (!data || !data.token || !data.signature || !data.expire) {
                        console.error('Missing required fields in POST response:', data);
                        throw new Error('Invalid ImageKit params response (missing fields). Got: ' + JSON.stringify(Object.keys(data || {})));
                    }
                    console.log('ImageKit params fetched successfully via POST');
                    return data;
                } catch (postError) {
                    console.error('Both GET and POST failed. POST error:', postError);
                    throw new Error('Failed to fetch ImageKit upload params: ' + (postError.message || postError));
                }
            }
        }
        
        // Generate AI description for an image using OpenAI API
        async function generateImageDescription(imageUrl) {
            try {
                // Use Google Apps Script to call OpenAI API (to avoid exposing API key)
                // Action: 'generateImageDescription'
                if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                    console.warn('Google Apps Script URL not configured, skipping AI description generation');
                    return null;
                }
                
                console.log('Calling Google Apps Script to generate description for:', imageUrl);
                
                // Use GET request with query parameters to avoid CORS issues with POST
                // Google Apps Script handles GET requests better for CORS
                const params = new URLSearchParams({
                    action: 'generateImageDescription',
                    imageUrl: imageUrl,
                    t: Date.now().toString() // Cache busting
                });
                const aiToken = getAdminSessionToken();
                if (aiToken) params.append('token', aiToken);
                
                const requestUrl = GOOGLE_APPS_SCRIPT_URL + '?' + params.toString();
                console.log('Request URL:', requestUrl);
                
                let response;
                try {
                    response = await fetch(requestUrl, {
                        method: 'GET',
                        mode: 'cors',
                        redirect: 'follow' // Follow redirects
                    });
                } catch (fetchError) {
                    // Check if it's a rate limit error
                    if (fetchError.message && fetchError.message.includes('429')) {
                        throw new Error('Google Apps Script rate limit exceeded. Please wait a minute and try again.');
                    }
                    throw fetchError;
                }
                
                console.log('Response status:', response.status, response.statusText);
                console.log('Response URL:', response.url); // Log final URL after redirects
                
                // Check for rate limiting (429)
                if (response.status === 429) {
                    throw new Error('Google Apps Script rate limit exceeded (429). Please wait a minute and try again.');
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error text:', errorText);
                    throw new Error('Failed to generate description: HTTP ' + response.status + ' - ' + errorText);
                }
                
                const responseText = await response.text();
                console.log('Response text (first 1000 chars):', responseText.substring(0, 1000));
                console.log('Full response length:', responseText.length);
                
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse JSON response:', parseError);
                    console.error('Raw response:', responseText);
                    throw new Error('Invalid JSON response from server: ' + responseText.substring(0, 200));
                }
                
                console.log('Parsed result:', JSON.stringify(result, null, 2));
                
                if (result.success && result.description) {
                    console.log('✅ Description successfully generated, length:', result.description.length);
                    console.log('Description preview:', result.description.substring(0, 100) + '...');
                    return result.description;
                } else {
                    console.error('❌ Description generation failed. Full result:', JSON.stringify(result, null, 2));
                    const errorMsg = result.error || 'Failed to generate description. Response: ' + JSON.stringify(result);
                    console.error('Error message:', errorMsg);
                    
                    // Check if it's an API key configuration error
                    if (errorMsg.includes('No AI API key') || errorMsg.includes('GEMINI_API_KEY') || errorMsg.includes('OPENAI_API_KEY')) {
                        console.error('⚠️ API KEY CONFIGURATION ISSUE DETECTED');
                        console.error('Please check Google Apps Script Script Properties for:');
                        console.error('1. Property name: GEMINI_API_KEY (case-sensitive, must be exact)');
                        console.error('2. Property value: Your Gemini API key (starts with AIza...)');
                        console.error('3. Available properties:', result.error && result.error.includes('Available properties:') ? result.error.split('Available properties:')[1] : 'Not shown');
                    }
                    
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('Error generating image description:', error);
                console.error('Error stack:', error.stack);
                // Fallback: try direct OpenAI API if API key is configured (not recommended for production)
                if (OPENAI_API_KEY) {
                    try {
                        const response = await fetch(OPENAI_API_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + OPENAI_API_KEY
                            },
                            body: JSON.stringify({
                                model: 'gpt-4o',
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'Describe this image in detail for use as an alt text or meta description. Keep it concise (50-150 words), descriptive, and SEO-friendly. Focus on what is visible in the image.'
                                            },
                                            {
                                                type: 'image_url',
                                                image_url: { url: imageUrl }
                                            }
                                        ]
                                    }
                                ],
                                max_tokens: 200
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error('OpenAI API error: ' + response.status);
                        }
                        
                        const data = await response.json();
                        if (data.choices && data.choices[0] && data.choices[0].message) {
                            return data.choices[0].message.content.trim();
                        }
                    } catch (directError) {
                        console.error('Direct OpenAI API call failed:', directError);
                        return null;
                    }
                }
                return null;
            }
        }

        // Update ImageKit file metadata (description)
        // fileId is optional - if provided, will be used directly instead of searching by path
        async function updateImageKitMetadata(imageUrl, description, fileId = null) {
            try {
                if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                    console.warn('Google Apps Script URL not configured, skipping ImageKit metadata update');
                    return;
                }
                
                if (!description || !description.trim()) {
                    console.warn('Empty description provided, skipping ImageKit metadata update');
                    return;
                }
                
                // Extract file path from ImageKit URL
                // ImageKit URLs look like: https://ik.imagekit.io/OE/folder/file.jpg
                // Or filePath from API: /folder/file.jpg
                let filePath = null;
                if (imageUrl.includes('ik.imagekit.io')) {
                    try {
                        const urlObj = new URL(imageUrl);
                        // URL structure: https://ik.imagekit.io/OE/folder/file.jpg
                        // Pathname will be: /OE/folder/file.jpg
                        // We need: /folder/file.jpg (remove the /OE part)
                        const pathname = urlObj.pathname;
                        const pathParts = pathname.split('/').filter(p => p); // Remove empty parts
                        
                        // Remove the first part (usually the ImageKit ID like 'OE')
                        if (pathParts.length > 1) {
                            filePath = '/' + pathParts.slice(1).join('/');
                        } else {
                            filePath = pathname;
                        }
                        
                        // Remove query string if present
                        filePath = filePath.split('?')[0];
                    } catch (urlError) {
                        // Fallback to old method
                        const urlParts = imageUrl.split('/');
                        filePath = '/' + urlParts.slice(4).join('/').split('?')[0];
                    }
                } else if (imageUrl.startsWith('/')) {
                    // Already a file path
                    filePath = imageUrl.split('?')[0];
                }
                
                if (!filePath) {
                    console.error('Could not extract file path from URL:', imageUrl);
                    throw new Error('Could not extract file path from ImageKit URL: ' + imageUrl);
                }
                
                console.log('Updating ImageKit metadata:');
                console.log('  - Image URL:', imageUrl);
                console.log('  - File Path:', filePath);
                console.log('  - Description length:', description.length);
                console.log('  - Description preview:', description.substring(0, 100) + '...');
                
                // Use GET request with query parameters to avoid CORS issues
                const params = new URLSearchParams({
                    action: 'updateImageKitMetadata',
                    filePath: filePath,
                    imageUrl: imageUrl,
                    customMetadata: JSON.stringify({ description: description }),
                    t: Date.now().toString()
                });
                const metadataToken = getAdminSessionToken();
                if (metadataToken) params.append('token', metadataToken);
                
                // If we have fileId, pass it directly to avoid search
                if (fileId) {
                    params.append('fileId', fileId);
                    console.log('  - Using fileId directly:', fileId);
                }
                
                const requestUrl = GOOGLE_APPS_SCRIPT_URL + '?' + params.toString();
                console.log('Request URL (first 200 chars):', requestUrl.substring(0, 200) + '...');
                
                const response = await fetch(requestUrl, {
                    method: 'GET',
                    mode: 'cors'
                });
                
                console.log('Response status:', response.status, response.statusText);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error:', errorText);
                    throw new Error('Failed to update ImageKit metadata: HTTP ' + response.status + ' - ' + errorText);
                }
                
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse response:', parseError);
                    throw new Error('Invalid JSON response: ' + responseText.substring(0, 200));
                }
                
                if (result.success) {
                    console.log('✅ ImageKit metadata updated successfully:', result);
                } else {
                    console.error('❌ ImageKit metadata update failed:', result);
                    throw new Error(result.error || 'Failed to update ImageKit metadata');
                }
            } catch (error) {
                console.error('❌ Error updating ImageKit metadata:', error);
                console.error('Error stack:', error.stack);
                throw error;
            }
        }
        
        async function uploadImageToImageKit(file, onProgress) {
            let token, expire, signature, folder;
            
            try {
                console.log('Fetching ImageKit upload parameters...');
                const params = await fetchImageKitUploadParams();
                token = params.token;
                expire = params.expire;
                signature = params.signature;
                folder = params.folder;
                console.log('ImageKit upload parameters fetched successfully');
            } catch (error) {
                console.error('Failed to fetch ImageKit upload parameters:', error);
                throw new Error('Failed to get upload credentials: ' + (error.message || error));
            }

            const form = new FormData();
            form.append('file', file);
            form.append('fileName', file.name);
            form.append('token', token);
            form.append('expire', expire);
            form.append('signature', signature);
            form.append('publicKey', IMAGEKIT_PUBLIC_KEY);
            form.append('useUniqueFileName', 'true');
            if (folder) form.append('folder', folder);

            const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
            const xhr = new XMLHttpRequest();
            
            // Set timeout to 60 seconds for large files
            xhr.timeout = 60000;

            const uploadPromise = new Promise(function(resolve, reject) {
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const responseText = xhr.responseText;
                                console.log('ImageKit upload response:', responseText);
                                
                                if (!responseText || responseText.trim() === '') {
                                    reject(new Error('Empty response from ImageKit'));
                                    return;
                                }
                                
                                let responseData;
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (parseError) {
                                    console.error('Failed to parse ImageKit response:', parseError, 'Response:', responseText);
                                    reject(new Error('Invalid response format from ImageKit: ' + responseText.substring(0, 100)));
                                    return;
                                }
                                
                                // Check if response indicates an error
                                if (responseData.error) {
                                    reject(new Error(responseData.error || 'ImageKit upload failed'));
                                    return;
                                }
                                
                                // Ensure we have a URL or filePath
                                if (!responseData.url && !responseData.filePath) {
                                    reject(new Error('No URL returned from ImageKit. Response: ' + JSON.stringify(responseData)));
                                    return;
                                }
                                
                                resolve(responseData);
                            } catch (error) {
                                console.error('Error processing ImageKit response:', error);
                                reject(error);
                            }
                        } else {
                            let errorMessage = 'ImageKit upload failed with status ' + xhr.status;
                            try {
                                const errorResponse = JSON.parse(xhr.responseText);
                                if (errorResponse.message || errorResponse.error) {
                                    errorMessage = errorResponse.message || errorResponse.error;
                                }
                            } catch (e) {
                                errorMessage = xhr.responseText || errorMessage;
                            }
                            reject(new Error(errorMessage));
                        }
                    }
                };
                xhr.onerror = function() {
                    reject(new Error('Network error while uploading to ImageKit'));
                };
                xhr.ontimeout = function() {
                    reject(new Error('Upload timeout - please check your internet connection'));
                };
            });

            if (typeof onProgress === 'function') {
                xhr.upload.onprogress = function(event) {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        onProgress(percent);
                    }
                };
            }

            xhr.open('POST', uploadUrl);
            xhr.send(form);

            return uploadPromise;
        }

        // Convert URL image to File object for ImageKit upload
        async function urlToFile(imageUrl, fileName) {
            try {
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch image: ' + response.status);
                }
                const blob = await response.blob();
                const file = new File([blob], fileName || 'image.jpg', { type: blob.type || 'image/jpeg' });
                return file;
            } catch (error) {
                console.error('Error converting URL to file:', error);
                throw new Error('Failed to download image from URL: ' + error.message);
            }
        }
        
        // Auto-upload URL images to ImageKit
        async function autoUploadImageUrl(inputId, imageUrl) {
            if (!imageUrl || !imageUrl.trim()) return false;
            
            const url = imageUrl.trim();
            // Check if it's a URL (http/https) and not already ImageKit or base64
            if (url.startsWith('http://') || url.startsWith('https://')) {
                // Check if it's already an ImageKit URL
                if (url.includes('ik.imagekit.io') || url.includes('imagekit.io')) {
                    return false; // Already ImageKit, no need to upload
                }
                
                // Check if it's base64
                if (url.startsWith('data:image/')) {
                    return false; // Base64, no need to upload
                }
                
                const input = document.getElementById(inputId);
                if (!input) return false;
                
                // Show uploading state
                const originalValue = input.value;
                input.disabled = true;
                input.value = 'Uploading from URL...';
                
                try {
                    // Extract filename from URL or use default
                    const urlParts = url.split('/');
                    const urlFileName = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
                    const fileName = urlFileName || 'image.jpg';
                    
                    console.log('Downloading image from URL:', url);
                    const file = await urlToFile(url, fileName);
                    
                    console.log('Uploading to ImageKit...');
                    const result = await uploadImageToImageKit(file);
                    
                    const imageKitUrl = result.url || result.filePath || '';
                    if (imageKitUrl) {
                        input.value = imageKitUrl;
                        console.log('Image uploaded successfully. New URL:', imageKitUrl);
                        return true;
                    } else {
                        throw new Error('No URL returned from upload');
                    }
                } catch (error) {
                    console.error('Error uploading image from URL:', error);
                    input.value = originalValue; // Restore original URL on error
                    alert('Failed to upload image from URL: ' + (error.message || 'Unknown error') + '\n\nOriginal URL kept.');
                    return false;
                } finally {
                    input.disabled = false;
                }
            }
            return false;
        }

        function initImageUploadButtons() {
            initListingImagePreviewListeners();
            syncAllListingImagePreviews();
            document.querySelectorAll('.btn-upload-image').forEach(function(button) {
                // Skip if already initialized (check for data attribute)
                if (button.dataset.uploadInitialized === 'true') {
                    return;
                }
                
                // Mark as initialized
                button.dataset.uploadInitialized = 'true';
                
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const targetId = button.dataset.target;
                    if (!targetId) {
                        console.error('Upload button missing data-target attribute');
                        alert('Error: Upload button configuration issue. Please refresh the page.');
                        return;
                    }
                    
                    const input = document.getElementById(targetId);
                    if (!input) {
                        console.error('Input field not found: ' + targetId);
                        alert('Error: Cannot find target input field: ' + targetId);
                        return;
                    }

                    const filePicker = document.createElement('input');
                    filePicker.type = 'file';
                    filePicker.accept = 'image/*';
                    filePicker.style.display = 'none';
                    
                    // Append to body temporarily (some browsers need this)
                    document.body.appendChild(filePicker);

                    filePicker.onchange = async function(event) {
                        console.log('File picker changed, files:', event.target.files);
                        
                        if (!filePicker.files || !filePicker.files.length || !filePicker.files[0]) {
                            console.log('No file selected');
                            document.body.removeChild(filePicker);
                            return;
                        }
                        
                        const file = filePicker.files[0];
                        console.log('Selected file:', file.name, file.size, 'bytes');

                        button.disabled = true;
                        const originalText = button.textContent;
                        button.textContent = 'Uploading...';

                                try {
                                    console.log('Starting upload to ImageKit...');
                                    const result = await uploadImageToImageKit(file);
                                    console.log('Upload successful, result:', result);
                                    
                                    const imageUrl = result.url || result.filePath || '';
                                    const fileId = result.fileId || null; // Store fileId from upload response
                                    if (imageUrl) {
                                        input.value = imageUrl;
                                        syncListingImagePreview(targetId);
                                        
                                        // Store fileId as a data attribute for later use
                                        if (fileId) {
                                            input.dataset.imagekitFileId = fileId;
                                            console.log('Stored fileId for later use:', fileId);
                                        }
                                        
                                        // Reset button text
                                        button.textContent = 'Upload';
                                        
                                        // Upload successful
                                        alert('✅ Image uploaded successfully!\n\nURL: ' + imageUrl + '\n\nClick "Generate AI Description" to create a description.');
                            } else {
                                throw new Error('No URL returned from upload');
                            }
                        } catch (error) {
                            console.error('ImageKit upload error:', error);
                            const errorMsg = error.message || 'Unknown error occurred';
                            alert('Image upload failed: ' + errorMsg + '\n\nPlease check the browser console for details.');
                        } finally {
                            button.disabled = false;
                            button.textContent = originalText;
                            // Clean up file picker
                            if (filePicker.parentNode) {
                                document.body.removeChild(filePicker);
                            }
                        }
                    };

                    // Handle cancel
                    filePicker.oncancel = function() {
                        console.log('File picker cancelled');
                        setTimeout(function() {
                            if (filePicker.parentNode) {
                                document.body.removeChild(filePicker);
                            }
                        }, 100);
                    };

                    try {
                        filePicker.click();
                    } catch (clickError) {
                        console.error('Error clicking file picker:', clickError);
                        alert('Error opening file picker. Please try again.');
                        if (filePicker.parentNode) {
                            document.body.removeChild(filePicker);
                        }
                    }
                });
            });
            
            // Add event listeners for "Generate AI Description" buttons
            document.querySelectorAll('.btn-generate-desc').forEach(function(btn) {
                // Skip if already initialized
                if (btn.dataset.generateInitialized === 'true') {
                    return;
                }
                btn.dataset.generateInitialized = 'true';
                
                btn.addEventListener('click', async function() {
                    const imageFieldId = btn.dataset.image;
                    const descFieldId = btn.dataset.desc;
                    
                    const imageField = document.getElementById(imageFieldId);
                    const descField = document.getElementById(descFieldId);
                    
                    if (!imageField || !descField) {
                        alert('Error: Could not find image or description field.');
                        return;
                    }
                    
                    const imageUrl = imageField.value.trim();
                    
                    if (!imageUrl) {
                        alert('Please upload an image first before generating a description.');
                        return;
                    }
                    
                    if (!imageUrl.includes('ik.imagekit.io')) {
                        alert('Please upload an image to ImageKit first. External URLs are not supported for AI description generation.');
                        return;
                    }
                    
                    // Get stored fileId if available
                    const fileId = imageField.dataset.imagekitFileId || null;
                    
                    // Disable button and show loading
                    const originalText = btn.textContent;
                    btn.disabled = true;
                    btn.textContent = 'Generating...';
                    btn.style.opacity = '0.6';
                    
                    try {
                        console.log('Generating AI description for image:', imageUrl);
                        const description = await generateImageDescription(imageUrl);
                        console.log('Description generated:', description ? 'Yes (' + description.length + ' chars)' : 'No');
                        
                        if (description && description.trim()) {
                            descField.value = description;
                            console.log('Description saved to field:', descFieldId, 'Value length:', description.length);
                            
                            // Trigger input event to ensure form recognizes the change
                            descField.dispatchEvent(new Event('input', { bubbles: true }));
                            descField.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            // Update ImageKit metadata with the description
                            try {
                                console.log('Updating ImageKit metadata with description...');
                                if (fileId) {
                                    await updateImageKitMetadata(imageUrl, description, fileId);
                                } else {
                                    await updateImageKitMetadata(imageUrl, description);
                                }
                                console.log('ImageKit metadata updated successfully');
                            } catch (metadataError) {
                                console.warn('Failed to update ImageKit metadata:', metadataError);
                                // Don't fail if metadata update fails
                            }
                            
                            // Focus the description field
                            setTimeout(function() {
                                descField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                descField.focus();
                            }, 100);
                            
                            // Success message removed per user request
                        } else {
                            console.warn('No description was generated (description is null/empty)');
                            alert('⚠️ Could not generate description. Check console for details.\n\nMake sure GEMINI_API_KEY or OPENAI_API_KEY is configured in Google Apps Script.');
                        }
                    } catch (descError) {
                        console.error('Failed to generate image description:', descError);
                        console.error('Error details:', descError.message, descError.stack);
                        alert('❌ Error generating description:\n\n' + descError.message + '\n\nCheck browser console for more details.');
                    } finally {
                        // Re-enable button
                        btn.disabled = false;
                        btn.textContent = originalText;
                        btn.style.opacity = '1';
                    }
                });
            });
            
            // Add event listeners for manual description input
            // This will sync manual changes to ImageKit metadata
            ['listingImage1Desc', 'listingImage2Desc', 'listingImage3Desc'].forEach(function(descFieldId) {
                const descField = document.getElementById(descFieldId);
                if (!descField) return;
                
                // Skip if already initialized
                if (descField.dataset.metadataInitialized === 'true') {
                    return;
                }
                descField.dataset.metadataInitialized = 'true';
                
                // Get the corresponding image input field ID
                const imageFieldId = descFieldId.replace('Desc', '');
                const imageField = document.getElementById(imageFieldId);
                
                if (!imageField) {
                    console.warn('Could not find corresponding image field for:', descFieldId);
                    return;
                }
                
                // Update ImageKit metadata when description field loses focus (blur)
                // This works for both new and existing listings - even days later!
                descField.addEventListener('blur', async function() {
                    const description = descField.value.trim();
                    const imageUrl = imageField.value.trim();
                    
                    // Only update if both description and image URL are present
                    if (description && imageUrl) {
                        // Only update if the image URL is from ImageKit
                        if (imageUrl.includes('ik.imagekit.io')) {
                            console.log('📝 Updating ImageKit metadata for existing image:');
                            console.log('  - Image URL:', imageUrl.substring(0, 60) + '...');
                            console.log('  - Description length:', description.length);
                            console.log('  - Description preview:', description.substring(0, 50) + '...');
                            
                            // Try to get fileId from the image input's data attribute (if stored during upload)
                            // For existing listings loaded from Google Sheets, this might be null,
                            // but updateImageKitMetadata will search by filePath instead
                            const storedFileId = imageField.dataset.imagekitFileId || null;
                            if (storedFileId) {
                                console.log('  - Using stored fileId:', storedFileId);
                            } else {
                                console.log('  - No stored fileId - will search ImageKit by file path');
                            }
                            
                            try {
                                await updateImageKitMetadata(imageUrl, description, storedFileId);
                                console.log('✅ ImageKit metadata updated successfully!');
                                console.log('   The description has been saved to ImageKit and will persist.');
                            } catch (error) {
                                console.error('❌ Failed to update ImageKit metadata:', error);
                                console.error('   This might happen if the image was deleted from ImageKit or the URL is incorrect.');
                                // Don't show alert - just log it (user can check console if needed)
                            }
                        } else {
                            console.log('⚠️ Image URL is not from ImageKit, skipping metadata update:', imageUrl);
                        }
                    } else if (imageUrl && !description) {
                        // If image URL exists but description is empty, user might have deleted it
                        // We could optionally clear the ImageKit description, but for now we'll skip
                        console.log('ℹ️ Description field is empty - skipping ImageKit update');
                    }
                });
            });
            
            // Add auto-upload functionality for URL images
            ['listingImage1', 'listingImage2', 'listingImage3'].forEach(function(imageId) {
                const input = document.getElementById(imageId);
                if (input && !input.dataset.urlUploadInitialized) {
                    input.dataset.urlUploadInitialized = 'true';
                    
                    // Auto-upload on blur (when user leaves the field)
                    input.addEventListener('blur', async function(e) {
                        const url = this.value.trim();
                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                            // Check if it's already ImageKit or base64
                            if (!url.includes('ik.imagekit.io') && !url.includes('imagekit.io') && !url.startsWith('data:image/')) {
                                // Ask user if they want to upload
                                const shouldUpload = confirm('This appears to be an external image URL. Would you like to upload it to ImageKit and replace it with the ImageKit URL?');
                                if (shouldUpload) {
                                    await autoUploadImageUrl(imageId, url);
                                }
                            }
                        }
                    });
                }
            });
        }
        
        // Initialize document upload buttons (for PDFs)
        function initDocumentUploadButtons() {
            console.log('🔍 initDocumentUploadButtons: Looking for .btn-upload-document buttons...');
            const buttons = document.querySelectorAll('.btn-upload-document');
            console.log('🔍 Found', buttons.length, 'document upload buttons');
            
            buttons.forEach(function(button) {
                // Skip if already initialized
                if (button.dataset.uploadInitialized === 'true') {
                    console.log('⏭️ Button already initialized, skipping:', button.dataset.target);
                    return;
                }
                
                // Mark as initialized
                button.dataset.uploadInitialized = 'true';
                console.log('✅ Initializing document upload button for:', button.dataset.target);
                
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Document upload button clicked:', button.dataset.target);
                    
                    const targetId = button.dataset.target;
                    if (!targetId) {
                        console.error('❌ Upload button missing data-target attribute');
                        alert('Error: Upload button configuration issue. Please refresh the page.');
                        return;
                    }
                    
                    const input = document.getElementById(targetId);
                    if (!input) {
                        console.error('❌ Input field not found: ' + targetId);
                        alert('Error: Cannot find target input field: ' + targetId);
                        return;
                    }
                    
                    console.log('✅ Found input field:', targetId);

                    const filePicker = document.createElement('input');
                    filePicker.type = 'file';
                    filePicker.accept = 'application/pdf';
                    filePicker.style.display = 'none';
                    
                    // Append to body temporarily
                    document.body.appendChild(filePicker);

                    filePicker.onchange = async function(event) {
                        console.log('File picker changed, files:', event.target.files);
                        
                        if (!filePicker.files || !filePicker.files.length || !filePicker.files[0]) {
                            console.log('No file selected');
                            document.body.removeChild(filePicker);
                            return;
                        }
                        
                        const file = filePicker.files[0];
                        console.log('Selected file:', file.name, file.size, 'bytes');
                        
                        // Validate it's a PDF
                        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                            alert('Please select a PDF file.');
                            document.body.removeChild(filePicker);
                            return;
                        }

                        button.disabled = true;
                        const originalText = button.textContent;
                        button.textContent = 'Uploading...';

                        try {
                            console.log('Starting PDF upload to ImageKit...');
                            // Use the same upload function - ImageKit supports PDFs
                            const result = await uploadImageToImageKit(file);
                            console.log('Upload successful, result:', result);
                            
                            const documentUrl = result.url || result.filePath || '';
                            if (documentUrl) {
                                input.value = documentUrl;
                                
                                // Reset button text
                                button.textContent = 'Upload PDF';
                                
                                // Upload successful
                                alert('✅ PDF uploaded successfully!\n\nURL: ' + documentUrl);
                            } else {
                                throw new Error('No URL returned from upload');
                            }
                        } catch (error) {
                            console.error('ImageKit upload error:', error);
                            const errorMsg = error.message || 'Unknown error occurred';
                            alert('PDF upload failed: ' + errorMsg + '\n\nPlease check the browser console for details.');
                        } finally {
                            button.disabled = false;
                            button.textContent = originalText;
                            // Clean up file picker
                            if (filePicker.parentNode) {
                                document.body.removeChild(filePicker);
                            }
                        }
                    };

                    // Handle cancel
                    filePicker.oncancel = function() {
                        console.log('File picker cancelled');
                        setTimeout(function() {
                            if (filePicker.parentNode) {
                                document.body.removeChild(filePicker);
                            }
                        }, 100);
                    };

                    try {
                        filePicker.click();
                    } catch (clickError) {
                        console.error('Error clicking file picker:', clickError);
                        alert('Error opening file picker. Please try again.');
                        if (filePicker.parentNode) {
                            document.body.removeChild(filePicker);
                        }
                    }
                });
            });
            
            // Add event listeners for "Generate AI Description" buttons
            document.querySelectorAll('.btn-generate-desc').forEach(function(btn) {
                // Skip if already initialized
                if (btn.dataset.generateInitialized === 'true') {
                    return;
                }
                btn.dataset.generateInitialized = 'true';
                
                btn.addEventListener('click', async function() {
                    const imageFieldId = btn.dataset.image;
                    const descFieldId = btn.dataset.desc;
                    
                    const imageField = document.getElementById(imageFieldId);
                    const descField = document.getElementById(descFieldId);
                    
                    if (!imageField || !descField) {
                        alert('Error: Could not find image or description field.');
                        return;
                    }
                    
                    const imageUrl = imageField.value.trim();
                    
                    if (!imageUrl) {
                        alert('Please upload an image first before generating a description.');
                        return;
                    }
                    
                    if (!imageUrl.includes('ik.imagekit.io')) {
                        alert('Please upload an image to ImageKit first. External URLs are not supported for AI description generation.');
                        return;
                    }
                    
                    // Get stored fileId if available
                    const fileId = imageField.dataset.imagekitFileId || null;
                    
                    // Disable button and show loading
                    const originalText = btn.textContent;
                    btn.disabled = true;
                    btn.textContent = 'Generating...';
                    btn.style.opacity = '0.6';
                    
                    try {
                        console.log('Generating AI description for image:', imageUrl);
                        const description = await generateImageDescription(imageUrl);
                        console.log('Description generated:', description ? 'Yes (' + description.length + ' chars)' : 'No');
                        
                        if (description && description.trim()) {
                            descField.value = description;
                            console.log('Description saved to field:', descFieldId, 'Value length:', description.length);
                            
                            // Trigger input event to ensure form recognizes the change
                            descField.dispatchEvent(new Event('input', { bubbles: true }));
                            descField.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            // Update ImageKit metadata with the description
                            try {
                                console.log('Updating ImageKit metadata with description...');
                                if (fileId) {
                                    await updateImageKitMetadata(imageUrl, description, fileId);
                                } else {
                                    await updateImageKitMetadata(imageUrl, description);
                                }
                                console.log('ImageKit metadata updated successfully');
                            } catch (metadataError) {
                                console.warn('Failed to update ImageKit metadata:', metadataError);
                                // Don't fail if metadata update fails
                            }
                            
                            // Focus the description field
                            setTimeout(function() {
                                descField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                descField.focus();
                            }, 100);
                            
                            // Success message removed per user request
                        } else {
                            console.warn('No description was generated (description is null/empty)');
                            alert('⚠️ Could not generate description. Check console for details.\n\nMake sure GEMINI_API_KEY or OPENAI_API_KEY is configured in Google Apps Script.');
                        }
                    } catch (descError) {
                        console.error('Failed to generate image description:', descError);
                        console.error('Error details:', descError.message, descError.stack);
                        alert('❌ Error generating description:\n\n' + descError.message + '\n\nCheck browser console for more details.');
                    } finally {
                        // Re-enable button
                        btn.disabled = false;
                        btn.textContent = originalText;
                        btn.style.opacity = '1';
                    }
                });
            });
            
            // Add event listeners for manual description input
            // This will sync manual changes to ImageKit metadata
            ['listingImage1Desc', 'listingImage2Desc', 'listingImage3Desc'].forEach(function(descFieldId) {
                const descField = document.getElementById(descFieldId);
                if (!descField) return;
                
                // Skip if already initialized
                if (descField.dataset.metadataInitialized === 'true') {
                    return;
                }
                descField.dataset.metadataInitialized = 'true';
                
                // Get the corresponding image input field ID
                const imageFieldId = descFieldId.replace('Desc', '');
                const imageField = document.getElementById(imageFieldId);
                
                if (!imageField) {
                    console.warn('Could not find corresponding image field for:', descFieldId);
                    return;
                }
                
                // Update ImageKit metadata when description field loses focus (blur)
                // This works for both new and existing listings - even days later!
                descField.addEventListener('blur', async function() {
                    const description = descField.value.trim();
                    const imageUrl = imageField.value.trim();
                    
                    // Only update if both description and image URL are present
                    if (description && imageUrl) {
                        // Only update if the image URL is from ImageKit
                        if (imageUrl.includes('ik.imagekit.io')) {
                            console.log('📝 Updating ImageKit metadata for existing image:');
                            console.log('  - Image URL:', imageUrl.substring(0, 60) + '...');
                            console.log('  - Description length:', description.length);
                            console.log('  - Description preview:', description.substring(0, 50) + '...');
                            
                            // Try to get fileId from the image input's data attribute (if stored during upload)
                            // For existing listings loaded from Google Sheets, this might be null,
                            // but updateImageKitMetadata will search by filePath instead
                            const storedFileId = imageField.dataset.imagekitFileId || null;
                            if (storedFileId) {
                                console.log('  - Using stored fileId:', storedFileId);
                            } else {
                                console.log('  - No stored fileId - will search ImageKit by file path');
                            }
                            
                            try {
                                await updateImageKitMetadata(imageUrl, description, storedFileId);
                                console.log('✅ ImageKit metadata updated successfully!');
                                console.log('   The description has been saved to ImageKit and will persist.');
                            } catch (error) {
                                console.error('❌ Failed to update ImageKit metadata:', error);
                                console.error('   This might happen if the image was deleted from ImageKit or the URL is incorrect.');
                                // Don't show alert - just log it (user can check console if needed)
                            }
                        } else {
                            console.log('⚠️ Image URL is not from ImageKit, skipping metadata update:', imageUrl);
                        }
                    } else if (imageUrl && !description) {
                        // If image URL exists but description is empty, user might have deleted it
                        // We could optionally clear the ImageKit description, but for now we'll skip
                        console.log('ℹ️ Description field is empty - skipping ImageKit update');
                    }
                });
            });
            
            // Add auto-upload functionality for URL images
            ['listingImage1', 'listingImage2', 'listingImage3'].forEach(function(imageId) {
                const input = document.getElementById(imageId);
                if (input && !input.dataset.urlUploadInitialized) {
                    input.dataset.urlUploadInitialized = 'true';
                    
                    // Auto-upload on blur (when user leaves the field)
                    input.addEventListener('blur', async function(e) {
                        const url = this.value.trim();
                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                            // Check if it's already ImageKit or base64
                            if (!url.includes('ik.imagekit.io') && !url.includes('imagekit.io') && !url.startsWith('data:image/')) {
                                // Ask user if they want to upload
                                const shouldUpload = confirm('This appears to be an external image URL. Would you like to upload it to ImageKit and replace it with the ImageKit URL?');
                                if (shouldUpload) {
                                    await autoUploadImageUrl(imageId, url);
                                }
                            }
                        }
                    });
                }
            });
        }
        
        // Icon mapping function - uses shared icon mappings from localStorage
        // Changes made here will sync to front page automatically
        function getIconClass(type, listing) {
            if (!type) return 'icon-default';
            
            // Get the category for this type
            const categoryKey = getCategoryForType(type, listing);
            if (categoryKey && TYPE_CATEGORIES[categoryKey] && TYPE_CATEGORIES[categoryKey].icon) {
                return TYPE_CATEGORIES[categoryKey].icon;
            }
            
            // Fallback to default icon
            return 'icon-default';
        }
        
        function renderPreview(filteredListings) {
            const listings = filteredListings || data.listings;
            const grid = document.getElementById('previewGrid');
            grid.innerHTML = '';
            
            // Populate filter dropdowns
            populatePreviewFilters();
            
            // Update results count
            document.getElementById('previewResultsCount').textContent = 'Showing ' + listings.length + ' listing' + (listings.length !== 1 ? 's' : '');
            
            listings.forEach(function(listing) {
                const card = document.createElement('div');
                card.className = 'flip-card';
                
                let flipBackTimeout = null;
                
                card.onclick = function(e) {
                    // Don't flip if clicking on links or buttons inside
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
                        return;
                    }
                    
                    // Close all other flipped cards
                    document.querySelectorAll('.flip-card.flipped').forEach(function(otherCard) {
                        if (otherCard !== card) {
                            otherCard.classList.remove('flipped');
                        }
                    });
                    
                    this.classList.toggle('flipped');
                };
                
                const inner = document.createElement('div');
                inner.className = 'flip-card-inner';
                
                const front = document.createElement('div');
                front.className = 'flip-card-front';
                
                // Create scrollable image container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'card-front-image-scroll';
                imgContainer.style.cssText = 'position: relative; width: 100%; height: 240px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;';
                imgContainer.style.setProperty('-ms-overflow-style', 'none');
                
                const imgWrapper = document.createElement('div');
                imgWrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex;';
                
                // Count images
                const imageCount = (listing.image1 ? 1 : 0) + (listing.image2 ? 1 : 0) + (listing.image3 ? 1 : 0);
                
                // Add image1 if it exists
                if (listing.image1) {
                    const img1 = document.createElement('img');
                    img1.src = getAdminImageUrl(listing.image1);
                    img1.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img1.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img1);
                }
                
                // Add image2 if it exists
                if (listing.image2) {
                    const img2 = document.createElement('img');
                    img2.src = getAdminImageUrl(listing.image2);
                    img2.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img2.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img2);
                }
                
                // Add image3 if it exists
                if (listing.image3) {
                    const img3 = document.createElement('img');
                    img3.src = getAdminImageUrl(listing.image3);
                    img3.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img3.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img3);
                }
                
                // If no images, add fallback
                if (imageCount === 0) {
                    const img = document.createElement('img');
                    img.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    img.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    imgWrapper.appendChild(img);
                }
                
                imgContainer.appendChild(imgWrapper);
                front.appendChild(imgContainer);
                
                // Add scroll arrows if there are multiple images
                if (imageCount > 1) {
                    const totalImages = imageCount;
                    
                    // Function to get current index based on scroll position
                    const getCurrentIndex = function() {
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        if (containerWidth === 0) return 0;
                        const scrollLeft = imgContainer.scrollLeft || 0;
                        // Round to nearest index
                        return Math.round(scrollLeft / containerWidth);
                    };
                    
                    // Single right arrow that cycles forward through images
                    const rightArrow = document.createElement('div');
                    rightArrow.className = 'scroll-arrow scroll-arrow-right';
                    
                    rightArrow.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        if (containerWidth === 0) return;
                        
                        let currentIndex = getCurrentIndex();
                        // Cycle forward (next image)
                        currentIndex = (currentIndex + 1) % totalImages;
                        imgContainer.scrollTo({ left: currentIndex * containerWidth, behavior: 'smooth' });
                    });
                    
                    // Append to front so it doesn't scroll with images
                    front.appendChild(rightArrow);
                }
                
                // Add card content below images
                const cardContent = document.createElement('div');
                cardContent.style.cssText = 'padding: 20px 0px 0px 0px;';
                
                // Get category name for display
                const categoryKey = getCategoryForType(listing.type, listing);
                const categoryName = categoryKey && TYPE_CATEGORIES && TYPE_CATEGORIES[categoryKey] ? TYPE_CATEGORIES[categoryKey].name : '';
                const categoryHTML = categoryName ? 
                    '<div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">' + categoryName + '</div>' : '';
                
                cardContent.innerHTML = 
                    categoryHTML +
                    '<h3 style="font-size: 20px; margin-bottom: 10px; color: var(--text-primary);">' + listing.name + '</h3>' +
                    '<div style="display: flex; gap: 8px; margin-bottom: 10px;">' +
                    '<span class="badge-type ' + getIconClass(listing.type, listing) + '" data-type="' + listing.type + '" onclick="filterByBadge(event, \'type\', \'' + listing.type + '\')">' + listing.type + '</span>' +
                    '<span class="badge-area" data-area="' + listing.area + '" onclick="filterByBadge(event, \'area\', \'' + listing.area + '\')">' + listing.area + '</span>' +
                    '</div>' +
                    '<p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">' + listing.description.substring(0, 100) + '...</p>';
                
                front.appendChild(cardContent);
                
                const back = document.createElement('div');
                back.className = 'flip-card-back';
                
                // Build description sections with labels for back of card
                const backDescriptionHTML = listing.description && listing.description.trim() ? 
                    '<div style="margin-bottom: 15px;">' +
                    '<h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Description</h4>' +
                    '<p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; margin: 0;">' + listing.description + '</p>' +
                    '</div>' : '';
                
                const backDetailedDescriptionHTML = listing.detailedDescription && listing.detailedDescription.trim() ? 
                    '<div style="margin-bottom: 15px;">' +
                    '<h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Detailed Description</h4>' +
                    '<p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; margin: 0;">' + listing.detailedDescription + '</p>' +
                    '</div>' : '';
                
                back.innerHTML = 
                    '<button class="flip-close-btn" onclick="event.stopPropagation(); this.closest(\'.flip-card\').classList.remove(\'flipped\');">&times;</button>' +
                    '<h3 style="font-size: 22px; margin-bottom: 12px; color: var(--text-primary);">' + listing.name + '</h3>' +
                    backDescriptionHTML +
                    backDetailedDescriptionHTML;
                
                inner.appendChild(front);
                inner.appendChild(back);
                card.appendChild(inner);
                grid.appendChild(card);
                layoutAdminCardImageStrip(imgContainer, imgWrapper, imageCount);
            });
        }
        
        let currentTypeFilter = '';
        
        function closeAllFlippedCards() {
            document.querySelectorAll('.flip-card.flipped').forEach(function(card) {
                card.classList.remove('flipped');
            });
        }
        
        function filterByBadge(event, filterType, value) {
            event.stopPropagation(); // Prevent card flip
            
            if (filterType === 'type') {
                currentTypeFilter = value;
                
                // Update button active states
                document.querySelectorAll('#previewTab .type-filter-btn').forEach(function(btn) {
                    btn.classList.remove('active');
                    if (btn.dataset.type === value) {
                        btn.classList.add('active');
                    }
                });
            } else if (filterType === 'area') {
                document.getElementById('previewAreaFilter').value = value;
            }
            
            filterPreview();
        }
        
        function filterPreview() {
            const searchTerm = document.getElementById('previewSearchInput').value.toLowerCase().trim();
            const areaFilter = document.getElementById('previewAreaFilter').value;
            const amenityFilter = document.getElementById('previewAmenityFilter').value;
            
            const filtered = data.listings.filter(function(listing) {
                // Search text
                const searchableText = [
                    listing.name,
                    listing.slug,
                    listing.type,
                    listing.area,
                    listing.description,
                    listing.detailedDescription,
                    listing.amenities.join(' ')
                ].join(' ').toLowerCase();
                
                const matchesSearch = !searchTerm || searchableText.indexOf(searchTerm) > -1;
                const matchesType = !currentTypeFilter || listing.type === currentTypeFilter;
                const matchesArea = !areaFilter || listing.area === areaFilter;
                let matchesAmenity = true;
                if (amenityFilter) {
                    const amenities = Array.isArray(listing.amenities)
                        ? listing.amenities
                        : (listing.amenities ? String(listing.amenities).split(/[,|]/).map(function(a) { return a.trim(); }).filter(Boolean) : []);
                    matchesAmenity = amenities.indexOf(amenityFilter) > -1;
                }
                
                return matchesSearch && matchesType && matchesArea && matchesAmenity;
            });
            
            renderPreview(filtered);
        }
        
        function clearPreviewFilters() {
            document.getElementById('previewSearchInput').value = '';
            document.getElementById('previewAreaFilter').value = '';
            document.getElementById('previewAmenityFilter').value = '';
            currentTypeFilter = '';
            
            // Reset quick filter buttons
            document.querySelectorAll('.type-filter-btn').forEach(function(btn) {
                btn.classList.remove('active');
                if (btn.dataset.type === '') {
                    btn.classList.add('active');
                }
            });
            
            renderPreview();
        }
        
        // Table sort and filter state (default: Area → Type → Name)
        let tableSortField = 'default';
        let tableSortDirection = 'asc';
        let tableFilters = {};
        
        function renderDataTable() {
            // Avoid re-capturing stale empty cells from a pre-Sheets render.
            // Drafts are only useful while the same dataset is on screen.
            const tbody = document.getElementById('dataTableBody');
            if (tbody && tbody.querySelector('tr[data-index]') && Object.keys(tableRowDrafts).length > 0) {
                captureAllVisibleTableRowDrafts();
            }
            if (tbody) tbody.innerHTML = '';
            
            // Get filter values
            const filterInputs = document.querySelectorAll('.data-table .filter-input, .data-table .filter-select');
            tableFilters = {};
            filterInputs.forEach(function(input) {
                const field = input.getAttribute('data-filter');
                const value = input.value.trim();
                if (value) {
                    tableFilters[field] = value;
                }
            });
            
            // Apply filters
            let filteredListings = data.listings.filter(function(listing) {
                for (let field in tableFilters) {
                    const filterValue = tableFilters[field].toLowerCase();
                    let listingValue = '';
                    
                    if (field === 'featured') {
                        listingValue = String(listing.featured || false).toLowerCase();
                        if (filterValue !== listingValue) return false;
                    } else if (field === 'private') {
                        listingValue = String(listing.private || false).toLowerCase();
                        if (filterValue !== listingValue) return false;
                    } else if (field === 'amenities') {
                        listingValue = (Array.isArray(listing.amenities) ? listing.amenities.join(', ') : '').toLowerCase();
                        if (listingValue.indexOf(filterValue) === -1) return false;
                    } else if (filterValue === 'has' || filterValue === 'empty') {
                        // Universal presence filtering for ANY column
                        const raw = listing[field];
                        const isEmpty = (function() {
                            if (raw === undefined || raw === null) return true;
                            if (Array.isArray(raw)) return raw.length === 0;
                            const s = String(raw).trim();
                            return s === '';
                        })();
                        if (filterValue === 'has' && isEmpty) return false;
                        if (filterValue === 'empty' && !isEmpty) return false;
                    } else if (field === 'category' || field === 'type' || field === 'area') {
                        listingValue = String(listing[field] || '').toLowerCase();
                        if (filterValue !== listingValue) return false;
                    } else {
                        // Normal text search
                        listingValue = String(listing[field] || '').toLowerCase();
                        if (listingValue.indexOf(filterValue) === -1) return false;
                    }
                }
                return true;
            });
            
            // Apply sorting
            const sortedListings = filteredListings.slice().sort(function(a, b) {
                // Default sort: Area → Type → Name (all A-Z)
                if (tableSortField === 'default') {
                    const aArea = ((a.area || '').toString()).trim().toLowerCase();
                    const bArea = ((b.area || '').toString()).trim().toLowerCase();
                    const aType = ((a.type || '').toString()).trim().toLowerCase();
                    const bType = ((b.type || '').toString()).trim().toLowerCase();
                    const aName = ((a.name || '').toString()).trim().toLowerCase();
                    const bName = ((b.name || '').toString()).trim().toLowerCase();
                    
                    const areaCompare = aArea.localeCompare(bArea);
                    if (areaCompare !== 0) return tableSortDirection === 'asc' ? areaCompare : -areaCompare;
                    const typeCompare = aType.localeCompare(bType);
                    if (typeCompare !== 0) return tableSortDirection === 'asc' ? typeCompare : -typeCompare;
                    const nameCompare = aName.localeCompare(bName);
                    return tableSortDirection === 'asc' ? nameCompare : -nameCompare;
                }
                
                let aValue = a[tableSortField];
                let bValue = b[tableSortField];
                
                // Handle different data types
                if (tableSortField === 'featured') {
                    aValue = aValue ? 1 : 0;
                    bValue = bValue ? 1 : 0;
                } else if (tableSortField === 'private') {
                    aValue = aValue ? 1 : 0;
                    bValue = bValue ? 1 : 0;
                } else if (tableSortField === 'amenities') {
                    aValue = Array.isArray(aValue) ? aValue.join(', ') : '';
                    bValue = Array.isArray(bValue) ? bValue.join(', ') : '';
                } else if (tableSortField === 'publishedDate') {
                    const parseDate = function(dateStr) {
                        if (!dateStr) return 0;
                        const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (dateMatch) {
                            return new Date(parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[3], 10)).getTime();
                        }
                        const parsed = new Date(dateStr);
                        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
                    };
                    aValue = parseDate(aValue);
                    bValue = parseDate(bValue);
                } else if (tableSortField === 'modifiedDate') {
                    aValue = parseListingTimestamp(aValue);
                    bValue = parseListingTimestamp(bValue);
                } else {
                    aValue = (aValue || '').toString().toLowerCase();
                    bValue = (bValue || '').toString().toLowerCase();
                }
                
                let result = 0;
                if (aValue < bValue) result = -1;
                else if (aValue > bValue) result = 1;
                
                return tableSortDirection === 'asc' ? result : -result;
            });
            
            dataTableSortedListings = sortedListings.map(function(listing) {
                return { listing: listing, dataIndex: data.listings.indexOf(listing) };
            });

            bindDataTableVirtualScroll();
            const wrapper = document.querySelector('.table-wrapper');
            if (wrapper) wrapper.scrollTop = 0;
            renderDataTableVirtualWindow();

            // Update sort indicators
            document.querySelectorAll('.data-table th.sortable').forEach(function(th) {
                th.classList.remove('sort-asc', 'sort-desc');
                if (th.getAttribute('data-sort') === tableSortField) {
                    th.classList.add('sort-' + tableSortDirection);
                }
            });
            
            // Populate filter dropdowns
            updateTableFilterDropdowns();
            clearTableEditsPending();
            requestAnimationFrame(function() {
                requestAnimationFrame(syncDataTableStickyHeaderOffset);
            });
        }
        
        function updateTableFilterDropdowns() {
            if (!data || !data.listings) return;
            
            // Type filter dropdown
            const typeFilter = document.querySelector('.data-table select[data-filter="type"]');
            if (typeFilter && (!typeFilter.dataset.populated || typeFilter.options.length <= 1)) {
                // Clear existing options except "All"
                while (typeFilter.options.length > 1) {
                    typeFilter.remove(1);
                }
                const uniqueTypes = [...new Set(data.listings.map(l => l.type).filter(t => t))].sort();
                uniqueTypes.forEach(function(type) {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    typeFilter.appendChild(option);
                });
                typeFilter.dataset.populated = 'true';
            }
            
            // Area filter dropdown
            const areaFilter = document.querySelector('.data-table select[data-filter="area"]');
            if (areaFilter && (!areaFilter.dataset.populated || areaFilter.options.length <= 1)) {
                // Clear existing options except "All"
                while (areaFilter.options.length > 1) {
                    areaFilter.remove(1);
                }
                const uniqueAreas = [...new Set(data.listings.map(l => l.area).filter(a => a))].sort();
                uniqueAreas.forEach(function(area) {
                    const option = document.createElement('option');
                    option.value = area;
                    option.textContent = area;
                    areaFilter.appendChild(option);
                });
                areaFilter.dataset.populated = 'true';
            }
            
            // Category filter dropdown
            const categoryFilter = document.querySelector('.data-table select[data-filter="category"]');
            if (categoryFilter && (!categoryFilter.dataset.populated || categoryFilter.options.length <= 1)) {
                // Clear existing options except "All"
                while (categoryFilter.options.length > 1) {
                    categoryFilter.remove(1);
                }
                const uniqueCategories = [...new Set(data.listings.map(l => l.category).filter(c => c))].sort();
                uniqueCategories.forEach(function(category) {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = TYPE_CATEGORIES && TYPE_CATEGORIES[category]
                        ? (TYPE_CATEGORIES[category].name || category)
                        : category;
                    categoryFilter.appendChild(option);
                });
                categoryFilter.dataset.populated = 'true';
            }
        }
        
        function clearTableFilters() {
            // Clear all filter inputs
            const filterInputs = document.querySelectorAll('.data-table .filter-input');
            filterInputs.forEach(function(input) {
                input.value = '';
            });
            
            // Clear all filter selects (set to "All" or empty)
            const filterSelects = document.querySelectorAll('.data-table .filter-select');
            filterSelects.forEach(function(select) {
                select.value = '';
            });
            
            // Clear the tableFilters object
            tableFilters = {};
            
            // Re-render the table with cleared filters
            renderDataTable();
        }
        
        function initDataTableFilterTooltips() {
            var help = {
                name: 'Text: rows stay if Name contains this text (case-insensitive). Special keywords: has = name is not blank; empty = name is blank.',
                slug: 'Text: Slug contains this substring (case-insensitive). has = slug present; empty = no slug.',
                type: 'Dropdown: one Type only, or Empty (no type), or All. Matching is exact (case-insensitive).',
                category: 'Dropdown: one Category, or Empty (uncategorized), or All. Exact match.',
                area: 'Dropdown: one Area, or Empty (no area), or All. Exact match.',
                description: 'Text: Description contains substring. has / empty = any text vs blank.',
                detailedDescription: 'Text: detailed description contains substring. has / empty supported.',
                customHtml: 'Text: Custom HTML contains substring. has = any HTML; empty = none.',
                image1: 'Text: Image 1 URL contains substring. has = URL set; empty = no image URL.',
                image1Desc: 'Text: image 1 description contains substring. has / empty supported.',
                image2: 'Text: Image 2 URL contains substring. has / empty supported.',
                image2Desc: 'Text: image 2 description contains substring. has / empty supported.',
                image3: 'Text: Image 3 URL contains substring. has / empty supported.',
                image3Desc: 'Text: image 3 description contains substring. has / empty supported.',
                website: 'Text: website field contains substring. has / empty supported.',
                phone: 'Text: phone contains substring. has / empty supported.',
                address: 'Text: address contains substring. has / empty supported.',
                latitude: 'has = latitude present; empty = missing; or type digits to match the stored number text.',
                longitude: 'has = longitude present; empty = missing; or type digits to match the stored number text.',
                authorName: 'Text: author name contains substring. has / empty supported.',
                publishedDate: 'Text: matches characters in the published date. has / empty supported.',
                modifiedDate: 'Text: matches characters in the modified date. has / empty supported.',
                directionsLink: 'Text: directions link contains substring. has / empty supported.',
                videoLink: 'Text: video link contains substring. has / empty supported.',
                document1: 'Text: Document 1 URL contains substring. has / empty supported.',
                document1Name: 'Text: Document 1 name contains substring. has / empty supported.',
                document2: 'Text: Document 2 URL contains substring. has / empty supported.',
                document2Name: 'Text: Document 2 name contains substring. has / empty supported.',
                amenities: 'Text: substring appears anywhere in the comma-separated amenities. has / empty supported.',
                featured: 'Dropdown: Yes / No = only that flag; All = no filter.',
                private: 'Dropdown: Yes / No = only that flag; All = no filter.',
                googleMapsUrl: 'Text: Google Maps URL contains substring. has / empty supported.',
                accordionPanel1Title: 'Text: panel 1 title contains substring. has / empty supported.',
                accordionPanel1Content: 'Text: panel 1 content contains substring. has / empty supported.',
                accordionPanel2Title: 'Text: panel 2 title contains substring. has / empty supported.',
                accordionPanel2Content: 'Text: panel 2 content contains substring. has / empty supported.',
                accordionPanel3Title: 'Text: panel 3 title contains substring. has / empty supported.',
                accordionPanel3Content: 'Text: panel 3 content contains substring. has / empty supported.',
                accordionPanel4Title: 'Text: panel 4 title contains substring. has / empty supported.',
                accordionPanel4Content: 'Text: panel 4 content contains substring. has / empty supported.'
            };
            document.querySelectorAll('.data-table thead tr.filter-row [data-filter]').forEach(function(el) {
                var key = el.getAttribute('data-filter');
                if (key && help[key]) {
                    el.setAttribute('title', help[key]);
                }
            });
        }
        
        // Add event listeners for sorting and filtering after DOM is ready
        setTimeout(function() {
            // Sort functionality
            document.addEventListener('click', function(e) {
                if (e.target.closest('.col-resize-handle')) return;
                if (e.target.closest('.data-table th.sortable')) {
                    const th = e.target.closest('.data-table th.sortable');
                    const sortField = th.getAttribute('data-sort');
                    
                    if (tableSortField === sortField) {
                        // Toggle direction
                        tableSortDirection = tableSortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        tableSortField = sortField;
                        tableSortDirection = 'asc';
                    }
                    
                    renderDataTable();
                }
            });
            
            // Filter functionality
            document.addEventListener('input', function(e) {
                if (e.target.matches('.data-table .filter-input, .data-table .filter-select')) {
                    renderDataTable();
                }
            });
            
            // Filter functionality for change events (for select dropdowns)
            document.addEventListener('change', function(e) {
                if (e.target.matches('.data-table .filter-select')) {
                    renderDataTable();
                }
            });
            initDataTableFilterTooltips();
            dataTableShowThumbnails = loadDataTableShowThumbnails();
            saveDataTableShowThumbnails(dataTableShowThumbnails);
            const thumbToggle = document.getElementById('dataTableShowThumbnails');
            if (thumbToggle) thumbToggle.checked = dataTableShowThumbnails;
            initDataTableColumnResize();
            var headerStickyResizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(headerStickyResizeTimer);
                headerStickyResizeTimer = setTimeout(function() {
                    syncDataTableStickyHeaderOffset();
                    renderDataTableVirtualWindow();
                }, 120);
            });
            syncDataTableStickyHeaderOffset();
        }, 100);
        
        function saveTableChanges(options) {
            options = options || {};
            committingTableEdits = true;
            captureAllVisibleTableRowDrafts();

            // Category fallback for visible rows with empty category (same as before)
            document.querySelectorAll('#dataTableBody tr[data-index]').forEach(function(row) {
                const index = parseInt(row.getAttribute('data-index'), 10);
                const listing = data.listings[index];
                if (!listing) return;
                const categoryInput = row.querySelector('[data-field="category"]');
                if (!categoryInput) return;
                let newValue = categoryInput.value.trim();
                if (!newValue) {
                    const typeValue = listing.type;
                    if (typeValue) newValue = getCategoryForType(typeValue, listing);
                    if (!newValue) {
                        const availableCategories = Object.keys(TYPE_CATEGORIES);
                        if (availableCategories.length > 0) {
                            newValue = availableCategories[0];
                            categoryInput.value = newValue;
                            alert('⚠️ Listing "' + listing.name + '" had no category. Assigned to: ' + (TYPE_CATEGORIES[newValue].name || newValue));
                        }
                    } else {
                        categoryInput.value = newValue;
                    }
                    if (newValue) {
                        if (!tableRowDrafts[index]) tableRowDrafts[index] = {};
                        tableRowDrafts[index].category = newValue;
                    }
                }
            });

            let changeCount = 0;
            const slugConflicts = [];

            Object.keys(tableRowDrafts).forEach(function(key) {
                const index = parseInt(key, 10);
                const listing = data.listings[index];
                const draft = tableRowDrafts[key];
                if (!listing || !draft) return;

                if (Object.prototype.hasOwnProperty.call(draft, 'slug')) {
                    let nextSlug = String(draft.slug || '').trim();
                    if (!nextSlug && listing.name) {
                        nextSlug = ensureUniqueSlug(listing.name, { excludeIndex: index });
                        draft.slug = nextSlug;
                    } else if (nextSlug) {
                        nextSlug = slugify(nextSlug) || nextSlug;
                        draft.slug = nextSlug;
                    }
                    if (nextSlug && isSlugTaken(nextSlug, { excludeIndex: index })) {
                        const conflict = data.listings.find(function(l, i) {
                            if (i === index) return false;
                            return normalizeSlugKey(l && l.slug) === normalizeSlugKey(nextSlug);
                        });
                        slugConflicts.push({
                            name: listing.name || '(unnamed)',
                            slug: nextSlug,
                            conflictName: conflict ? (conflict.name || conflict.slug) : 'another listing'
                        });
                        delete draft.slug; // do not apply the colliding slug
                    }
                }

                changeCount += applyTableRowFieldsToListing(listing, draft, null);
            });

            tableRowDrafts = {};

            if (slugConflicts.length) {
                alert(
                    '⚠️ Some slug changes were not saved because they collide with another listing:\n\n' +
                    slugConflicts.slice(0, 8).map(function(item) {
                        return '• "' + item.name + '" → "' + item.slug + '" (already used by ' + item.conflictName + ')';
                    }).join('\n') +
                    '\n\nOther field edits were kept. Pick unique slugs and try again.'
                );
            }

            applyFilterOptionCleanup();
            renderListings();

            tableEditsPending = false;
            if (changeCount > 0) {
                showUnsavedChangesBadge();
                if (!options.silent) {
                    alert('Table updated — ' + changeCount + ' field(s) saved to local data.\n\nThe top bar is now green: use Save to Google Sheets when you are ready to sync.');
                }
                if (options.fromBanner) {
                    flashTableCommittedBanner();
                }
            } else {
                if (!options.silent) {
                    if (slugConflicts.length) {
                        alert('No other changes were saved. Resolve the duplicate slug(s) and try again.');
                    } else {
                        alert('No changes detected in the table — nothing to commit.');
                    }
                }
            }
            updateUnsavedChangesBadge();
            committingTableEdits = false;
        }

        function deleteFromTable(index) {
            const listing = data.listings[index];
            if (!listing) return;
            deleteListing(listing.slug);
        }
        
        window.downloadCSV = function downloadCSV() {
            try {
                const escapeCsv = function(value) {
                    const str = value === undefined || value === null ? '' : String(value);
                    if (str === '') return '';
                    return '"' + str.replace(/"/g, '""') + '"';
                };
                
                const joinList = function(arr) {
                    if (!arr || !arr.length) return '';
                    return arr.join('; ');
                };
                
                // Collect ALL unique fields from all listings to ensure nothing is missed
                const allFields = new Set();
                
                // Add standard fields first (in preferred order)
                const standardFields = [
                    'name', 'slug', 'type', 'category', 'area', 'description', 'detailedDescription', 'customHtml',
                    'image1', 'image1Desc', 'image1FileId',
                    'image2', 'image2Desc', 'image2FileId',
                    'image3', 'image3Desc', 'image3FileId',
                    'website', 'phone', 'address',
                    'authorName', 'publishedDate', 'modifiedDate', 'directionsLink', 'videoLink', 
                    'document1', 'document1Name', 'document2', 'document2Name',
                    'accordionPanel1Title', 'accordionPanel1Content',
                    'accordionPanel2Title', 'accordionPanel2Content',
                    'accordionPanel3Title', 'accordionPanel3Content',
                    'accordionPanel4Title', 'accordionPanel4Content',
                    'amenities', 'featured', 'private', 'googleMapsUrl',
                    'isEvent', 'eventStartDate', 'eventEndDate', 'eventStartTime', 'eventEndTime',
                    'eventAllDay', 'eventTicketUrl', 'eventCost', 'eventVenueName'
                ];
                
                standardFields.forEach(field => allFields.add(field));
                
                // Add any additional fields found in listings
                if (data && data.listings && Array.isArray(data.listings)) {
                    data.listings.forEach(function(listing) {
                        if (listing && typeof listing === 'object') {
                            Object.keys(listing).forEach(function(key) {
                                if (key && typeof key === 'string') {
                                    allFields.add(key);
                                }
                            });
                        }
                    });
                }
                
                // Convert to array and sort (standard fields first, then others alphabetically)
                const headers = Array.from(allFields);
                headers.sort(function(a, b) {
                    const aIndex = standardFields.indexOf(a);
                    const bIndex = standardFields.indexOf(b);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return a.localeCompare(b);
                });
                
                const rows = data.listings.map(function(listing) {
                    const safeAmenities = joinList(listing.amenities || []);
                    
                    // Build row dynamically using headers
                    return headers.map(function(header) {
                        if (header === 'amenities') {
                            return escapeCsv(safeAmenities);
                        } else if (header === 'featured') {
                            return escapeCsv(listing.featured ? 'true' : 'false');
                        } else if (header === 'private') {
                            return escapeCsv(listing.private ? 'true' : 'false');
                        } else if (header === 'isEvent') {
                            return escapeCsv(listing.isEvent ? 'true' : 'false');
                        } else if (header === 'eventAllDay') {
                            return escapeCsv(listing.eventAllDay ? 'true' : 'false');
                        } else if (header === 'googleMapsUrl' && !listing.googleMapsUrl) {
                            // Fallback to directionsLink if googleMapsUrl is empty
                            return escapeCsv(listing.directionsLink || '');
                        } else {
                            return escapeCsv(listing[header] || '');
                        }
                    }).join(',');
                });
                
                const csv = [headers.join(',')].concat(rows).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'listings-' + new Date().toISOString().split('T')[0] + '.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // Update status AFTER download completes
                // Use setTimeout to ensure download has started
                setTimeout(() => {
                    updateSyncStatus(true, 'CSV backup downloaded.');
                }, 100);
            } catch (error) {
                console.error('Error downloading CSV:', error);
                updateSyncStatus(false, 'CSV download failed.');
                alert('Error downloading CSV: ' + error.message);
            }
        }
        
        // Download as TSV (Tab-Separated Values) - more robust for complex data
        window.downloadTSV = function downloadTSV() {
            try {
                const escapeTsv = function(value) {
                    const str = value === undefined || value === null ? '' : String(value);
                    if (str === '') return '';
                    // TSV: Replace tabs with spaces, replace newlines with \\n literal
                    return str.replace(/\t/g, ' ').replace(/\r?\n/g, '\\n');
                };
                
                const joinList = function(arr) {
                    if (!arr || !arr.length) return '';
                    return arr.join('; ');
                };
                
                // Use same field collection as CSV
                const allFields = new Set();
                const standardFields = [
                    'name', 'slug', 'type', 'category', 'area', 'description', 'detailedDescription', 'customHtml',
                    'image1', 'image1Desc', 'image1FileId',
                    'image2', 'image2Desc', 'image2FileId',
                    'image3', 'image3Desc', 'image3FileId',
                    'website', 'phone', 'address',
                    'authorName', 'publishedDate', 'modifiedDate', 'directionsLink', 'videoLink', 
                    'document1', 'document1Name', 'document2', 'document2Name',
                    'accordionPanel1Title', 'accordionPanel1Content',
                    'accordionPanel2Title', 'accordionPanel2Content',
                    'accordionPanel3Title', 'accordionPanel3Content',
                    'accordionPanel4Title', 'accordionPanel4Content',
                    'amenities', 'featured', 'private', 'googleMapsUrl',
                    'isEvent', 'eventStartDate', 'eventEndDate', 'eventStartTime', 'eventEndTime',
                    'eventAllDay', 'eventTicketUrl', 'eventCost', 'eventVenueName'
                ];
                
                standardFields.forEach(field => allFields.add(field));
                
                if (data && data.listings && Array.isArray(data.listings)) {
                    data.listings.forEach(function(listing) {
                        if (listing && typeof listing === 'object') {
                            Object.keys(listing).forEach(function(key) {
                                if (key && typeof key === 'string') {
                                    allFields.add(key);
                                }
                            });
                        }
                    });
                }
                
                const headers = Array.from(allFields);
                headers.sort(function(a, b) {
                    const aIndex = standardFields.indexOf(a);
                    const bIndex = standardFields.indexOf(b);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return a.localeCompare(b);
                });
                
                const rows = data.listings.map(function(listing) {
                    const safeAmenities = joinList(listing.amenities || []);
                    
                    return headers.map(function(header) {
                        if (header === 'amenities') {
                            return escapeTsv(safeAmenities);
                        } else if (header === 'featured') {
                            return escapeTsv(listing.featured ? 'true' : 'false');
                        } else if (header === 'private') {
                            return escapeTsv(listing.private ? 'true' : 'false');
                        } else if (header === 'isEvent') {
                            return escapeTsv(listing.isEvent ? 'true' : 'false');
                        } else if (header === 'eventAllDay') {
                            return escapeTsv(listing.eventAllDay ? 'true' : 'false');
                        } else if (header === 'googleMapsUrl' && !listing.googleMapsUrl) {
                            return escapeTsv(listing.directionsLink || '');
                        } else {
                            return escapeTsv(listing[header] || '');
                        }
                    }).join('\t');
                });
                
                const tsv = [headers.join('\t')].concat(rows).join('\n');
                
                const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'listings-' + new Date().toISOString().split('T')[0] + '.tsv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                setTimeout(() => {
                    updateSyncStatus(true, 'TSV backup downloaded.');
                }, 100);
            } catch (error) {
                console.error('Error downloading TSV:', error);
                updateSyncStatus(false, 'TSV download failed.');
                alert('Error downloading TSV: ' + error.message);
            }
        }
        
        function handleCSVUpload(event) {
            try {
                console.log('CSV/TSV upload started');
                const file = event.target.files[0];
                if (!file) {
                    console.log('No file selected');
                    return;
                }
                
                const fileName = file.name.toLowerCase();
                const isTSV = fileName.endsWith('.tsv') || fileName.endsWith('.txt');
                console.log('Reading file:', file.name, isTSV ? '(TSV format)' : '(CSV format)');
                const reader = new FileReader();
                
                reader.onerror = function(error) {
                    console.error('File read error:', error);
                    alert('Error reading file: ' + error);
                };
                
                reader.onload = function(e) {
                    try {
                        console.log('File loaded, parsing with header mapping...');
                        const text = e.target.result;
                        const parsed = parseCSV(text);
                        
                        // Check for parsing errors
                        if (parsed.errors && parsed.errors.length > 0) {
                            const errorMsg = 'Errors encountered while parsing:\n\n' + 
                                parsed.errors.slice(0, 5).join('\n') +
                                (parsed.errors.length > 5 ? `\n...and ${parsed.errors.length - 5} more` : '');
                            alert(errorMsg);
                            console.error('Parse errors:', parsed.errors);
                        }
                        
                        // Show warnings if any (but don't block)
                        if (parsed.warnings && parsed.warnings.length > 0) {
                            console.warn('Parse warnings:', parsed.warnings);
                            // Only show first few warnings to user if there are many
                            if (parsed.warnings.length > 3) {
                                console.log(`📋 ${parsed.warnings.length} total warnings - check console for full list`);
                            }
                        }
                        
                        if (!parsed || !parsed.headers || parsed.headers.length === 0) {
                            alert('File is missing a header row. Please include column names in the first row.');
                            return;
                        }
                        
                        console.log('Detected headers:', parsed.headers);
                        
                        const newListings = parsed.dataRows
                            .map(function(row, index) {
                                const listing = mapCSVRowToListing(row);
                                // Debug: Log accordion data for first few rows
                                if (index < 3 && listing.name) {
                                    console.log('🔍 Row', index + 2, '-', listing.name, {
                                        hasAccordionTitle: !!listing.accordionPanel1Title,
                                        accordionTitle: listing.accordionPanel1Title?.substring(0, 50) || '(empty)',
                                        hasAccordionContent: !!listing.accordionPanel1Content,
                                        customHtml: listing.customHtml?.substring(0, 50) || '(empty)',
                                        rawRowKeys: Object.keys(row).slice(0, 10)
                                    });
                                }
                                if (!listing.name && !listing.slug) {
                                    console.warn('Skipping row', index + 2, '- missing required name/slug field', row);
                                    return null;
                                }
                                return listing;
                            })
                            .filter(Boolean);
                        
                        console.log('Parsed listings:', newListings.length);
                        
                        if (newListings.length === 0) {
                            alert('No valid listings found in CSV file. Please verify the column names match the expected headers (e.g., "name", "type", "area").');
                            return;
                        }
                        
                        const confirmed = confirm('Upload CSV with ' + newListings.length + ' listings?\n\n' +
                                                '⚠️ This will replace all current listings with the CSV data.\n\n' +
                                                'Click OK to upload CSV and replace all current listings\n' +
                                                'Click Cancel to keep current listings unchanged');
                        if (confirmed) {
                            const existingFilterOptions = (data && data.filterOptions) ? data.filterOptions : (initialData.filterOptions || { types: [], areas: [], amenities: [] });
                            const sanitizedFilterOptions = sanitizeFilterOptions(existingFilterOptions, newListings);
                            
                            if (!data) {
                                data = { listings: [], filterOptions: { types: [], areas: [], amenities: [] } };
                            }
                            
                            // Create a map of existing listings by slug for date preservation
                            const existingListingsMap = {};
                            if (data.listings && Array.isArray(data.listings)) {
                                data.listings.forEach(function(existing) {
                                    if (existing && existing.slug) {
                                        existingListingsMap[existing.slug] = existing;
                                    }
                                });
                            }
                            
                            data.listings = newListings.map(function(listing) {
                                // Preserve existing dates if CSV doesn't have them
                                if (listing.slug && existingListingsMap[listing.slug]) {
                                    const existing = existingListingsMap[listing.slug];
                                    // Only preserve dates if CSV date is undefined (not provided)
                                    if (listing.publishedDate === undefined && existing.publishedDate) {
                                        listing.publishedDate = existing.publishedDate;
                                    }
                                    if (listing.modifiedDate === undefined && existing.modifiedDate) {
                                        listing.modifiedDate = existing.modifiedDate;
                                    }
                                }
                                // Convert undefined to empty string for consistency
                                if (listing.publishedDate === undefined) listing.publishedDate = '';
                                if (listing.modifiedDate === undefined) listing.modifiedDate = '';
                                return sanitizeListing(listing);
                            });
                            data.filterOptions = sanitizedFilterOptions;
                            data.sheetHeaders = sanitizeSheetHeaders(parsed.headers || (data && data.sheetHeaders));
                            
                            applyFilterOptionCleanup(sanitizedFilterOptions);
                            updateTableHeaderLabelsFromSheet(data.sheetHeaders);
                            applyFilterOptionCleanup(sanitizedFilterOptions);
                            updateTableHeaderLabelsFromSheet(data.sheetHeaders);
                            renderDataTable();
                            renderListings();
                            updateStats();
                            showUnsavedChangesBadge();
                            
                            // Build success message with any warnings
                            let successMsg = `✅ Upload successful! ${newListings.length} listings imported locally.`;
                            if (parsed.warnings && parsed.warnings.length > 0) {
                                successMsg += `\n\n⚠️ ${parsed.warnings.length} warning(s) during parsing (check console for details)`;
                            }
                            successMsg += '\n\n💾 Click "Save to Sheets" to sync changes.';
                            alert(successMsg);
                        }
                        
                        // Reset file input
                        event.target.value = '';
                        
                    } catch (parseError) {
                        console.error('Error parsing file:', parseError);
                        alert('Error parsing file: ' + parseError.message + '\n\nTip: Try saving your file as TSV (tab-separated) if CSV is causing issues.');
                    }
                };
                
                reader.readAsText(file);
                
            } catch (error) {
                console.error('Error in handleCSVUpload:', error);
                alert('Error uploading file: ' + error.message);
            }
        }
        
        window.bootstrapAdminAppIfNeeded = async function bootstrapAdminAppIfNeeded() {
            if (window._adminBootstrapped) return;
            if (!document.body.classList.contains('logged-in')) return;
            window._adminBootstrapped = true;

            showListingsGridLoading();
            await new Promise(function(resolve) { setTimeout(resolve, 100); });
            await loadDataFromGoogleSheets();

            checkUnassignedTypes();
            updateTypeDropdown();
            updateAreaDropdown();
            renderAmenitiesCheckboxes();
            populatePreviewFilters();
            initImageUploadButtons();
            initDataTableFilterTooltips();

            const backToTopBtn = document.getElementById('backToTopBtn');
            if (backToTopBtn && !backToTopBtn.dataset.bound) {
                backToTopBtn.dataset.bound = '1';
                backToTopBtn.addEventListener('click', function() {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                window.addEventListener('scroll', function() {
                    if (window.scrollY > 400) {
                        backToTopBtn.classList.remove('hidden');
                    } else {
                        backToTopBtn.classList.add('hidden');
                    }
                });
            }

            document.querySelectorAll('#adminTab .type-filter-btn:not([data-category])').forEach(function(btn) {
                if (btn.dataset.adminFilterBound) return;
                btn.dataset.adminFilterBound = '1';
                btn.onclick = null;
                btn.addEventListener('click', function() {
                    if (this.dataset.type === '' && !this.dataset.category) {
                        filterAdminByType('');
                    } else {
                        const type = this.dataset.type || '';
                        filterAdminByType(type);
                    }
                });
            });

            if (data && data.listings && data.listings.length) {
                requestAnimationFrame(function() {
                    renderListings(data.listings);
                });
            }
        };

        if (window._pendingAdminBootstrap) {
            window._pendingAdminBootstrap = false;
            window.bootstrapAdminAppIfNeeded();
        }

        window.addEventListener('DOMContentLoaded', async function() {
            if (document.body.classList.contains('logged-in')) {
                await bootstrapAdminAppIfNeeded();
            }
        });
        
        // ===========================================
        // GITHUB INTEGRATION FUNCTIONS
        // ===========================================
        async function saveToGitHub() {
            const token = document.getElementById('githubToken').value.trim();
            const username = document.getElementById('githubUsername').value.trim();
            const repo = document.getElementById('githubRepo').value.trim();
            const path = document.getElementById('githubPath').value.trim();
            const statusDiv = document.getElementById('githubStatus');
            
            // Validation
            if (!token) {
                statusDiv.textContent = '❌ Please enter your GitHub token';
                statusDiv.style.color = '#dc3545';
                return;
            }
            if (!username || !repo || !path) {
                statusDiv.textContent = '❌ Please fill in all fields';
                statusDiv.style.color = '#dc3545';
                return;
            }
            
            try {
                statusDiv.textContent = '⏳ Saving to GitHub...';
                statusDiv.style.color = '#ffc107';
                
                // Get your data object (this already exists in your admin panel)
                const jsonData = data;
                
                // Convert to base64 (required by GitHub API)
                let content;
                try {
                    content = btoa(JSON.stringify(jsonData, null, 2));
                } catch (e) {
                    // If btoa fails due to special characters, use UTF-8 encoding
                    const jsonString = JSON.stringify(jsonData, null, 2);
                    content = btoa(unescape(encodeURIComponent(jsonString)));
                }
                
                // Check if file exists to get SHA (required for updates)
                const getUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
                let sha = null;
                
                try {
                    const getRes = await fetch(getUrl, {
                        headers: { 
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (getRes.ok) {
                        const fileData = await getRes.json();
                        sha = fileData.sha;
                    }
                } catch (e) {
                    console.log('File does not exist yet, will create new file');
                }
                
                // Commit the file
                const commitMessage = `Update from admin panel - ${new Date().toISOString()}`;
                const putRes = await fetch(getUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: commitMessage,
                        content: content,
                        sha: sha
                    })
                });
                
                if (putRes.ok) {
                    const result = await putRes.json();
                    statusDiv.textContent = '✅ Successfully saved to GitHub!';
                    statusDiv.style.color = '#28a745';
                    
                    // Save config to localStorage so user doesn't have to re-enter
                    localStorage.setItem('github_username', username);
                    localStorage.setItem('github_repo', repo);
                    localStorage.setItem('github_path', path);
                    
                    console.log('File saved at:', result.content.html_url);
                } else {
                    const error = await putRes.json();
                    console.error('GitHub API Error:', error);
                    statusDiv.textContent = `❌ Error: ${error.message}`;
                    statusDiv.style.color = '#dc3545';
                }
                
            } catch (error) {
                console.error('Save to GitHub error:', error);
                statusDiv.textContent = `❌ Error: ${error.message}`;
                statusDiv.style.color = '#dc3545';
            }
        }
        
        function downloadJSON() {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'adventure-directory-data-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
            
            const statusDiv = document.getElementById('githubStatus');
            if (statusDiv) {
                statusDiv.textContent = '✅ JSON file downloaded!';
                statusDiv.style.color = '#28a745';
                setTimeout(() => { statusDiv.textContent = ''; }, 3000);
            }
        }
        
        // Load saved GitHub config from localStorage on page load
        document.addEventListener('DOMContentLoaded', function() {
            const savedUsername = localStorage.getItem('github_username');
            const savedRepo = localStorage.getItem('github_repo');
            const savedPath = localStorage.getItem('github_path');
            
            if (savedUsername) document.getElementById('githubUsername').value = savedUsername;
            if (savedRepo) document.getElementById('githubRepo').value = savedRepo;
            if (savedPath) document.getElementById('githubPath').value = savedPath;
        });
        
        // ===========================================        // GOOGLE OAUTH AUTHENTICATION
        // ===========================================
        // 🔧 TESTING: Set to false to disable Google OAuth temporarily
        // Set to true to re-enable authentication
        const ENABLE_GOOGLE_AUTH = false; // 👈 Change to false to skip login
        
        // 🔐 CONFIGURATION: Google OAuth Client ID
        // Get this from: https://console.cloud.google.com/apis/credentials
        // 1. Create OAuth 2.0 Client ID
        // 2. Application type: Web application
        // 3. Authorized JavaScript origins: Add your domain (e.g., https://yourdomain.com)
        // 4. Authorized redirect URIs: Add your domain
        const GOOGLE_OAUTH_CLIENT_ID = '1087570888908-4g9jboc2hoi1dl9t9qs5hmnak6ct1t24.apps.googleusercontent.com';
        
        // 🔐 AUTHORIZED EMAILS: List of Google email addresses that can access the admin panel
        // SECURITY NOTE: For better security, move this list to your Google Apps Script
        // and fetch it via an API call instead of storing it in the client code.
        // Used only by the legacy Google OAuth flow (ENABLE_GOOGLE_AUTH, currently
        // false). Left empty so no admin addresses are exposed in public source.
        // The active OTP login enforces authorization server-side in the Apps Script.
        const AUTHORIZED_EMAILS = [];
        
        // Parse JWT token to get user info
        function parseJwt(token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload);
            } catch (e) {
                console.error('Error parsing JWT:', e);
                return null;
            }
        }
        
        // Handle Google OAuth callback
        function handleCredentialResponse(response) {
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            
            try {
                // Parse the JWT token
                const payload = parseJwt(response.credential);
                
                if (!payload || !payload.email) {
                    throw new Error('Invalid token - missing email');
                }
                
                const userEmail = payload.email;
                const userName = payload.name || userEmail;
                
                console.log('Google Sign-In successful:', userEmail);
                
                // Check if email is authorized
                if (AUTHORIZED_EMAILS.includes(userEmail)) {
                    // Authorized - hide login overlay
                document.getElementById('loginOverlay').style.display = 'none';
                
                    // Store session info
                sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminEmail', userEmail);
                    sessionStorage.setItem('adminName', userName);
                    
                    // Show success message briefly
                    const overlay = document.getElementById('loginOverlay');
                    const overlayContent = overlay.querySelector('div');
                    overlayContent.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <div style="color: #22c55e; font-size: 48px; margin-bottom: 20px;">✓</div>
                            <h2 style="color: #4E6B52; margin: 0 0 10px 0;">Welcome, ${userName}!</h2>
                            <p style="color: #6c757d; margin: 0;">Loading admin panel...</p>
                        </div>
                    `;
                    
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 1000);
                
            } else {
                    // Not authorized
                    errorText.textContent = `Access denied. ${userEmail} is not authorized to access this admin panel.`;
                errorDiv.style.display = 'block';
                
                // Shake animation
                const overlay = document.getElementById('loginOverlay');
                overlay.style.animation = 'shake 0.5s';
                setTimeout(() => { overlay.style.animation = ''; }, 500);
                    
                    // Log the unauthorized attempt
                    console.warn('Unauthorized access attempt:', userEmail);
                }
            } catch (error) {
                console.error('Error processing Google Sign-In:', error);
                errorText.textContent = 'Authentication failed. Please try again.';
                errorDiv.style.display = 'block';
            }
        }
        
        // Initialize Google Sign-In
        let initAttempts = 0;
        const MAX_INIT_ATTEMPTS = 50; // 5 seconds max wait
        
        function initializeGoogleSignIn() {
            initAttempts++;
            const loadingMessage = document.getElementById('loadingMessage');
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            const buttonContainer = document.getElementById('googleSignInContainer');
            const fallbackContainer = document.getElementById('fallbackButtonContainer');
            
            console.log('Initializing Google Sign-In, attempt:', initAttempts);
            console.log('Client ID:', GOOGLE_OAUTH_CLIENT_ID);
            console.log('Google object:', typeof google !== 'undefined' ? 'exists' : 'missing');
            
            // Check if Client ID is configured (check for undefined, empty, or placeholder)
            if (!GOOGLE_OAUTH_CLIENT_ID || 
                GOOGLE_OAUTH_CLIENT_ID === 'YOUR_CLIENT_ID.apps.googleusercontent.com' ||
                GOOGLE_OAUTH_CLIENT_ID.trim() === '') {
                if (loadingMessage) loadingMessage.style.display = 'none';
                errorText.innerHTML = `
                    <strong>⚠️ Configuration Required:</strong><br>
                    Google OAuth Client ID is not configured or is invalid.<br>
                    <small>See line ~5393 in index-sheets.html<br>
                    Replace 'YOUR_CLIENT_ID.apps.googleusercontent.com' with your actual Client ID from Google Cloud Console</small>
                `;
                errorDiv.style.display = 'block';
                // Show fallback button
                if (fallbackContainer) {
                    fallbackContainer.style.display = 'block';
                }
                return;
            }
            
            // Wait for Google Identity Services to load
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    if (loadingMessage) loadingMessage.style.display = 'none';
                    
                    console.log('✅ Google Identity Services loaded, initializing...');
                    console.log('📍 Current origin:', window.location.origin);
                    console.log('🔑 Client ID:', GOOGLE_OAUTH_CLIENT_ID);
                    
                    // Validate Client ID format before calling Google API
                    if (!GOOGLE_OAUTH_CLIENT_ID.includes('.apps.googleusercontent.com')) {
                        throw new Error('Invalid Client ID format. Must end with .apps.googleusercontent.com');
                    }
                    
                    google.accounts.id.initialize({
                        client_id: GOOGLE_OAUTH_CLIENT_ID,
                        callback: handleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });
                    
                    console.log('✅ Google Sign-In initialized successfully');
                    console.log('🎨 Rendering button...');
                    
                    // Clear container first
                    buttonContainer.innerHTML = '';
                    
                    // Render the sign-in button
                    google.accounts.id.renderButton(
                        buttonContainer,
                        {
                            theme: 'filled_blue',
                            size: 'large',
                            width: 300,
                            text: 'signin_with',
                            type: 'standard'
                        }
                    );
                    
                    console.log('✅ Google Sign-In button rendered successfully!');
                    console.log('✅ Everything looks good! The button should be visible now.');
                    
                    // Hide fallback button and loading message
                    if (fallbackContainer) fallbackContainer.style.display = 'none';
                    if (loadingMessage) loadingMessage.style.display = 'none';
                    
                } catch (error) {
                    console.error('❌ Error rendering Google Sign-In button:', error);
                    console.error('Error details:', {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        origin: window.location.origin,
                        clientId: GOOGLE_OAUTH_CLIENT_ID
                    });
                    
                    if (loadingMessage) loadingMessage.style.display = 'none';
                    
                    // Show fallback button
                    if (fallbackContainer) {
                        fallbackContainer.style.display = 'block';
                        errorText.innerHTML = `
                            <strong>⚠️ Error loading Google button:</strong><br>
                            ${error.message || 'Unknown error'}<br>
                            <small>This usually means your domain isn't authorized yet or Google hasn't updated (can take 1-5 minutes).<br>
                            Check the browser console (F12) for more details.<br>
                            Click the button below to try manual sign-in.</small>
                        `;
                        errorDiv.style.display = 'block';
                    } else {
                        errorText.innerHTML = `
                            <strong>❌ Error loading Google Sign-In:</strong><br>
                            ${error.message || 'Unknown error'}<br>
                            <small>Check your browser console for more details.</small>
                        `;
                        errorDiv.style.display = 'block';
                    }
                }
            } else {
                // Retry after a short delay if Google Identity Services hasn't loaded yet
                if (initAttempts < MAX_INIT_ATTEMPTS) {
                    if (loadingMessage) {
                        loadingMessage.textContent = `Loading sign-in button... (${initAttempts}/${MAX_INIT_ATTEMPTS})`;
                    }
                    setTimeout(initializeGoogleSignIn, 100);
                } else {
                    // Timeout - Google script failed to load, show fallback
                    console.error('Google Identity Services failed to load after', MAX_INIT_ATTEMPTS, 'attempts');
                    if (loadingMessage) loadingMessage.style.display = 'none';
                    
                    // Always show fallback button if Google's button doesn't load
                    if (fallbackContainer) {
                        fallbackContainer.style.display = 'block';
                        const currentOrigin = window.location.origin;
                        errorText.innerHTML = `
                            <strong>⚠️ Google Sign-In script didn't load:</strong><br>
                            <strong>Your current domain:</strong> <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${currentOrigin}</code><br>
                            <br>
                            <strong>To fix:</strong><br>
                            1. Go to: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #4285f4;">Google Cloud Console → Credentials</a><br>
                            2. Click your OAuth 2.0 Client ID<br>
                            3. Under "Authorized JavaScript origins", click "+ ADD URI"<br>
                            4. Add: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${currentOrigin}</code><br>
                            5. Also add: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">http://localhost</code> (for local testing)<br>
                            6. Under "Authorized redirect URIs", add the same URLs<br>
                            7. Click "SAVE"<br>
                            8. Wait 1-2 minutes, then refresh this page<br>
                            <br>
                            <strong>Click the button below to try manual sign-in:</strong>
                        `;
                        errorDiv.style.display = 'block';
                    } else {
                        errorText.innerHTML = `
                            <strong>❌ Failed to load Google Sign-In:</strong><br>
                            Google Identity Services script did not load.<br>
                            <small>Please check your internet connection and try refreshing the page.</small>
                        `;
                        errorDiv.style.display = 'block';
                    }
                }
            }
        }
        
        // Fallback function to trigger Google Sign-In manually
        // Make it globally accessible for onclick handlers
        window.triggerGoogleSignIn = function triggerGoogleSignIn() {
            console.log('Triggering manual Google Sign-In');
            console.log('Client ID:', GOOGLE_OAUTH_CLIENT_ID);
            console.log('Google object:', typeof google !== 'undefined' ? 'exists' : 'missing');
            
            // Check if Client ID is configured
            if (!GOOGLE_OAUTH_CLIENT_ID || GOOGLE_OAUTH_CLIENT_ID === 'YOUR_CLIENT_ID.apps.googleusercontent.com') {
                alert('❌ Google OAuth Client ID is not configured.\n\nPlease set GOOGLE_OAUTH_CLIENT_ID in the code.');
                return;
            }
            
            // Try to use the One Tap prompt if available
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    // First, ensure Google is initialized with our Client ID
                    google.accounts.id.initialize({
                        client_id: GOOGLE_OAUTH_CLIENT_ID,
                        callback: handleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });
                    
                    // Try to show One Tap prompt
                    google.accounts.id.prompt((notification) => {
                        console.log('One Tap notification:', notification);
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            // One Tap failed, try popup using renderButton
                            const buttonContainer = document.getElementById('googleSignInContainer');
                            if (buttonContainer) {
                                buttonContainer.innerHTML = '';
                                google.accounts.id.renderButton(
                                    buttonContainer,
                                    {
                                        theme: 'filled_blue',
                                        size: 'large',
                                        width: '100%',
                                        text: 'signin_with',
                                        type: 'standard',
                                        click_listener: function() {
                                            // This will trigger the callback
                                        }
                                    }
                                );
                                // Click the button programmatically
                                const button = buttonContainer.querySelector('div[role="button"]');
                                if (button) {
                                    button.click();
                                } else {
                                    // Fallback: redirect to OAuth
                                    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=openid%20profile%20email&nonce=${Date.now()}`;
                                }
                            } else {
                                // Fallback: redirect to OAuth
                                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=openid%20profile%20email&nonce=${Date.now()}`;
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error with One Tap:', error);
                    // Fallback: redirect to OAuth popup
                    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=openid%20profile%20email&nonce=${Date.now()}`;
                }
            } else {
                const currentOrigin = window.location.origin;
                alert('❌ Google OAuth Client ID is not configured.\n\nPlease set GOOGLE_OAUTH_CLIENT_ID in the code.');
            }
        };
        
        // OLD GOOGLE OAUTH CODE - DISABLED
        // Email OTP authentication is now handled by the embedded code above
        // This old Google OAuth event listener is disabled - just return immediately
        window.addEventListener('load', function() {
            // Email OTP authentication is handled by the code embedded earlier in the page
            // This old Google OAuth code is completely disabled
            return;
        });
        
        // Test and diagnostic functions
        function testGoogleSignIn() {
            console.log('🧪 Testing Google Sign-In configuration...');
            const origin = window.location.origin;
            const clientId = GOOGLE_OAUTH_CLIENT_ID;
            
            console.log('📍 Current origin:', origin);
            console.log('🔑 Client ID:', clientId);
            console.log('🌐 Google script loaded:', typeof google !== 'undefined' ? '✅ Yes' : '❌ No');
            
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: function(response) {
                            console.log('✅ Test successful! Got credential response');
                            alert('✅ Test successful! Google Sign-In is working.\n\nIf you see this, your configuration is correct!');
                        },
                        auto_select: false
                    });
                    
                    // Try to render a test button
                    const testDiv = document.createElement('div');
                    document.body.appendChild(testDiv);
                    
                    google.accounts.id.renderButton(testDiv, {
                        theme: 'filled_blue',
                        size: 'large',
                        text: 'signin_with'
                    });
                    
                    console.log('✅ Test button rendered - configuration is correct!');
                    alert('✅ Test successful! Google Sign-In button rendered.\n\nYour configuration is working correctly!\n\nIf you still don\'t see the button on the login screen, wait 1-2 minutes for Google\'s servers to update.');
                    
                    // Remove test button
                    setTimeout(() => testDiv.remove(), 5000);
                } catch (error) {
                    console.error('❌ Test failed:', error);
                    alert('❌ Test failed: ' + error.message + '\n\nThis usually means:\n1. Your domain isn\'t authorized yet (wait 1-5 minutes)\n2. Or there\'s a configuration issue\n\nCheck the console for details.');
                }
            } else {
                alert('❌ Google Identity Services script not loaded.\n\nCheck:\n1. Your internet connection\n2. Browser console for errors\n3. That the script tag is in the HTML');
            }
        }
        
        function checkOAuthConfig() {
            const origin = window.location.origin;
            const clientId = GOOGLE_OAUTH_CLIENT_ID;
            
            const config = {
                origin: origin,
                clientId: clientId,
                googleLoaded: typeof google !== 'undefined',
                buttonContainer: document.getElementById('googleSignInContainer') ? 'exists' : 'missing',
                authorizedEmails: AUTHORIZED_EMAILS.length
            };
            
            console.log('📋 OAuth Configuration Check:', config);
            
            let message = '📋 OAuth Configuration:\n\n';
            message += `Domain: ${origin}\n`;
            message += `Client ID: ${clientId.substring(0, 20)}...\n`;
            message += `Google Script: ${config.googleLoaded ? '✅ Loaded' : '❌ Not loaded'}\n`;
            message += `Button Container: ${config.buttonContainer}\n`;
            message += `Authorized Emails: ${config.authorizedEmails}\n\n`;
            
            if (config.googleLoaded) {
                message += '✅ Google script is loaded\n';
            } else {
                message += '❌ Google script not loaded - check internet connection\n';
            }
            
            message += `\nMake sure "${origin}" is added to Google Cloud Console → Authorized JavaScript origins`;
            
            alert(message);
            console.log('Full config:', config);
        }
        
        // Update diagnostic info on load
        function updateDiagnostics() {
            const diagSection = document.getElementById('diagnosticSection');
            if (diagSection) {
                document.getElementById('diagOrigin').textContent = window.location.origin;
                document.getElementById('diagClientId').textContent = GOOGLE_OAUTH_CLIENT_ID.substring(0, 30) + '...';
                document.getElementById('diagGoogleLoaded').textContent = typeof google !== 'undefined' ? '✅ Yes' : '❌ No';
                document.getElementById('diagContainer').textContent = document.getElementById('googleSignInContainer') ? '✅ Found' : '❌ Missing';
                
                const status = typeof google !== 'undefined' && document.getElementById('googleSignInContainer') ? '✅ Ready' : '⏳ Waiting...';
                document.getElementById('diagStatus').textContent = status;
                
                // Show diagnostic section
                diagSection.style.display = 'block';
            }
        }
        
        // Logout function
        window.logout = function logout() {
            // Revoke Google token if available
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.disableAutoSelect();
            }
            
            // Clear session data
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminEmail');
            sessionStorage.removeItem('adminName');
            localStorage.removeItem('adminLoggedIn');
            
            // Reload page to show login screen
            location.reload();
        }
        
        // Ensure all functions are available immediately
        console.log('✅ admin.js loaded successfully');
        console.log('✅ Functions available:', {
            reloadFromSheets: typeof window.reloadFromSheets,
            saveAllToSheets: typeof window.saveAllToSheets,
            downloadCSV: typeof window.downloadCSV,
            openAddModal: typeof window.openAddModal,
            logout: typeof window.logout,
            switchTab: typeof window.switchTab,
            filterAdminByType: typeof window.filterAdminByType,
            closeModal: typeof window.closeModal
        });

        // Fallback: If critical functions fail to load, show error after 2 seconds
        window.addEventListener('load', function() {
            setTimeout(function() {
                // Check if critical functions exist
                if (typeof initializeGoogleSignIn === 'undefined') {
            const errorDiv = document.getElementById('loginError');
                    const errorText = document.getElementById('loginErrorText');
                    const loadingMessage = document.getElementById('loadingMessage');
                    
                    if (loadingMessage) loadingMessage.style.display = 'none';
                    if (errorDiv && errorText) {
                        errorText.innerHTML = `
                            <strong>⚠️ JavaScript Error:</strong><br>
                            Critical functions failed to load. Please check the browser console for errors.
                        `;
                errorDiv.style.display = 'block';
                    }
                }
            }, 2000);
        });
        
        // Google Maps functionality (lazy-loaded when map is opened)
        let map = null;
        let markers = [];
        let markerCluster = null;
        let mapVisible = false;
        let infoWindow = null;
        let mapsScriptLoading = false;
        let mapsScriptLoaded = false;
        let mapsScriptLoadPromise = null;

        function loadGoogleMapsScript() {
            if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                mapsScriptLoaded = true;
                return Promise.resolve();
            }
            if (mapsScriptLoadPromise) {
                return mapsScriptLoadPromise;
            }

            mapsScriptLoadPromise = new Promise(function(resolve, reject) {
                mapsScriptLoading = true;
                var script = document.createElement('script');
                script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(GOOGLE_MAPS_API_KEY) + '&libraries=places';
                script.async = true;
                script.defer = true;
                script.onload = function() {
                    mapsScriptLoaded = true;
                    mapsScriptLoading = false;
                    resolve();
                };
                script.onerror = function() {
                    mapsScriptLoading = false;
                    mapsScriptLoadPromise = null;
                    reject(new Error('Failed to load Google Maps'));
                };
                document.head.appendChild(script);
            });

            return mapsScriptLoadPromise;
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function fixEncoding(text) {
            if (!text) return '';
            return text.replace(/â€™/g, "'").replace(/â€"/g, '"').replace(/â€"/g, '"');
        }
        
        function normalizeImageUrl(url) {
            if (!url) return '';
            // If it's a base64 image, return as is
            if (url.startsWith('data:image/')) return url;
            // If it's a relative path, make it absolute
            if (url.startsWith('/')) return url;
            // If it's a full URL, return as is
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            // Otherwise, assume it's an ImageKit URL
            return url;
        }
        
        function initMap() {
            // Check if map element exists
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.log('Map element not found yet, retrying...');
                setTimeout(initMap, 100);
                return;
            }
            
            // Check if Google Maps API is loaded
            if (typeof google === 'undefined' || typeof google.maps === 'undefined' || typeof google.maps.Map === 'undefined') {
                console.log('Google Maps API not loaded yet, retrying...');
                // Retry after a short delay
                setTimeout(initMap, 100);
                return;
            }
            
            if (!map) {
                try {
                    // Initialize Google Map centered on Nelson County, VA
                    map = new google.maps.Map(mapElement, {
                        center: { lat: 37.8, lng: -79.0 },
                        zoom: 10,
                        mapTypeControl: false,
                        zoomControl: true,
                        zoomControlOptions: {
                            position: google.maps.ControlPosition ? google.maps.ControlPosition.RIGHT_TOP : 1
                        },
                        streetViewControl: false,
                        fullscreenControl: false,
                        keyboardShortcuts: false,
                        gestureHandling: 'cooperative',
                        styles: [
                            // Hide all points of interest
                            {
                                featureType: "poi",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "poi.business",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "poi",
                                stylers: [{ visibility: "off" }]
                            },
                            // Hide transit
                            {
                                featureType: "transit",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "transit.station",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "transit.line",
                                stylers: [{ visibility: "off" }]
                            },
                            // Simplify administrative boundaries
                            {
                                featureType: "administrative",
                                elementType: "geometry.stroke",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "administrative.locality",
                                elementType: "labels",
                                stylers: [{ visibility: "simplified" }]
                            },
                            {
                                featureType: "administrative.neighborhood",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "administrative.land_parcel",
                                stylers: [{ visibility: "off" }]
                            },
                            // Hide minor/local roads and their labels
                            {
                                featureType: "road.local",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "road.local",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "road",
                                elementType: "labels.text.fill",
                                stylers: [{ visibility: "simplified" }]
                            },
                            // Hide water labels
                            {
                                featureType: "water",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }]
                            },
                            {
                                featureType: "water",
                                elementType: "labels.text",
                                stylers: [{ visibility: "off" }]
                            },
                            // Natural features
                            {
                                featureType: "landscape.natural",
                                stylers: [
                                    { color: "#E1F3C9" }
                                ]
                            },
                            {
                                featureType: "water",
                                stylers: [
                                    { color: "#CAE8F2" }
                                ]
                            }
                        ]
                    });
                    
                    // Apply rounded corners to zoom controls after map loads
                    setTimeout(() => {
                        const mapContainer = document.getElementById('map');
                        if (mapContainer) {
                            const buttons = mapContainer.querySelectorAll('button');
                            buttons.forEach(button => {
                                if (button.getAttribute('aria-label') && button.getAttribute('aria-label').includes('Zoom')) {
                                    button.style.borderRadius = '16px';
                                }
                            });
                            
                            const zoomControls = mapContainer.querySelectorAll('[aria-label*="Zoom"]');
                            zoomControls.forEach(control => {
                                const parent = control.closest('div[style*="position"]');
                                if (parent) {
                                    parent.style.borderRadius = '16px';
                                    parent.style.overflow = 'hidden';
                                }
                            });
                        }
                    }, 500);
                    
                    // Also apply on map idle event
                    map.addListener('idle', () => {
                        const mapContainer = document.getElementById('map');
                        if (mapContainer) {
                            const buttons = mapContainer.querySelectorAll('button');
                            buttons.forEach(button => {
                                if (button.getAttribute('aria-label') && button.getAttribute('aria-label').includes('Zoom')) {
                                    button.style.borderRadius = '16px';
                                }
                                const parent = button.parentElement;
                                if (parent && parent.style.position === 'absolute') {
                                    parent.style.borderRadius = '16px';
                                    parent.style.overflow = 'hidden';
                                }
                            });
                        }
                    });
                    
                    // Create single info window to reuse
                    infoWindow = new google.maps.InfoWindow();
                } catch (e) {
                    console.error('Error initializing map:', e);
                    setTimeout(function() {
                        if (!map) {
                            initMap();
                        }
                    }, 500);
                }
            }
        }
        
        function updateMapMarkers(listings) {
            if (!map) return;
            
            // Clear existing clusterer if it exists
            if (markerCluster) {
                markerCluster.clearMarkers();
                markerCluster = null;
            }
            
            // Clear existing markers
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            markers = [];
            
            // Create bounds
            var bounds = new google.maps.LatLngBounds();
            var markersToAdd = [];
            var geocodeCount = 0;
            var totalListings = listings.length;
            
            // Add markers for each listing
            listings.forEach(function(listing) {
                // Use pre-stored coordinates if available, otherwise geocode the address
                geocodeAddress(listing, function(lat, lng) {
                    if (lat && lng) {
                        var position = { lat: lat, lng: lng };
                        
                        // Create custom marker icon (SVG)
                        var markerIcon = {
                            path: 'M 12,2 C 8.1340068,2 5,5.1340068 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.8659932 -3.134007,-7 -7,-7 z',
                            fillColor: '#E3795C',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 1.5,
                            anchor: new google.maps.Point(12, 22)
                        };
                        
                        // Create marker
                        var marker = new google.maps.Marker({
                            position: position,
                            icon: markerIcon,
                            title: fixEncoding(listing.name),
                            animation: google.maps.Animation.DROP
                        });
                        
                        // Create popup content
                        var imageUrl = listing.image1 ? normalizeImageUrl(listing.image1) : 'https://via.placeholder.com/400x400?text=No+Image';
                        var cardWidth = (window.innerWidth < 969) ? 120 : 200;
                        var cardHeight = cardWidth; // Square
                        var fontSize = (window.innerWidth < 969) ? 12 : 14;
                        var gradientHeight = (window.innerWidth < 969) ? 50 : 60;
                        var simpleContent = '<div style="padding: 0 12px 16px 12px !important; margin: 0 !important; text-align: center; cursor: pointer; width: ' + cardWidth + 'px; height: ' + cardHeight + 'px; position: relative; overflow: hidden; border-radius: 12px; line-height: 0; font-size: 0; background-image: url(\'' + imageUrl + '\'); background-size: cover !important; background-position: center center !important; background-repeat: no-repeat !important; display: flex; flex-direction: column; justify-content: flex-end; border: 4px solid #ffffff; outline: 0; box-sizing: border-box; min-width: ' + cardWidth + 'px; min-height: ' + cardHeight + 'px;" onclick="if(window.filterByListingName) filterByListingName(\'' + escapeHtml(fixEncoding(listing.name)).replace(/'/g, "\\'") + '\'); if(window.google && window.google.maps) google.maps.event.trigger(map, \'click\');">' + 
                            '<div style="position: absolute; bottom: 0; left: 0; right: 0; height: ' + gradientHeight + 'px; background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0)); pointer-events: none; z-index: 1; margin: 0; padding: 0;"></div>' +
                            '<div style="font-size: ' + fontSize + 'px; font-weight: 600; color: #ffffff; line-height: 1.1; padding: 0 10px 18px 10px; margin: 0; position: relative; z-index: 2; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">' + escapeHtml(fixEncoding(listing.name)) + '</div>' +
                            '</div>';
                        
                        // Add click listener to show info window
                        marker.addListener('click', function() {
                            infoWindow.setContent(simpleContent);
                            infoWindow.open(map, marker);
                        });
                        
                        markers.push(marker);
                        markersToAdd.push(marker);
                        bounds.extend(position);
                    }
                    
                    geocodeCount++;
                    // When all geocoding is done, add markers to map
                    if (geocodeCount === totalListings) {
                        // Add markers directly to map (no clustering for now)
                        markersToAdd.forEach(function(marker) {
                            marker.setMap(map);
                        });
                        
                        // Fit bounds with animation if there are markers
                        if (markers.length > 0) {
                            setTimeout(function() {
                                map.fitBounds(bounds);
                                
                                // Limit max zoom
                                var listener = google.maps.event.addListener(map, "idle", function() {
                                    if (map.getZoom() > 13) map.setZoom(13);
                                    google.maps.event.removeListener(listener);
                                });
                            }, 500);
                        }
                    }
                });
            });
        }
        
        // Geocoding function - uses pre-stored coordinates if available, falls back to approximate locations
        function geocodeAddress(listing, callback) {
            // If listing has pre-stored coordinates, use them directly (most accurate)
            if (listing.latitude && listing.longitude && !isNaN(listing.latitude) && !isNaN(listing.longitude)) {
                callback(listing.latitude, listing.longitude);
                return;
            }
            
            // Fall back to address-based geocoding
            var address = listing.address || '';
            
            // Skip geocoding for booking site addresses (no real address available)
            if (!address) {
                callback(null, null);
                return;
            }
            var addressLower = address.toLowerCase().trim();
            var isBookingSiteAddress = addressLower.includes('full address available') || 
                                       addressLower.includes('address available on booking') ||
                                       addressLower.includes('address on booking site') ||
                                       addressLower.includes('booking site');
            if (isBookingSiteAddress) {
                callback(null, null);
                return;
            }
            
            // Approximate coordinates for Nelson County area locations (fallback for listings without pre-stored coords)
            var locations = {
                'Roseland': [37.8167, -79.0833],
                'Montebello': [37.8500, -79.1333],
                'Wintergreen': [37.9167, -79.0000],
                'Afton': [38.0333, -78.8333],
                'Lovingston': [37.7667, -78.8667],
                'Nellysford': [37.9000, -78.8833]
            };
            
            // Try to match address to known locations
            for (var loc in locations) {
                if (address.includes(loc)) {
                    var coords = locations[loc];
                    // Add small random offset for multiple locations in same area
                    var lat = coords[0] + (Math.random() - 0.5) * 0.02;
                    var lng = coords[1] + (Math.random() - 0.5) * 0.02;
                    callback(lat, lng);
                    return;
                }
            }
            
            // Default to center of Nelson County with random offset
            callback(37.8 + (Math.random() - 0.5) * 0.1, -79.0 + (Math.random() - 0.5) * 0.1);
        }
        
        function toggleMap() {
            var container = document.getElementById('mapContainer');
            var toggleIcon = document.getElementById('mapToggleIcon');
            var toggleText = container ? container.querySelector('.map-toggle-text') : null;
            
            if (!container || !toggleIcon) return;
            
            if (mapVisible) {
                container.classList.add('map-collapsed');
                toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5"></path>';
                if (toggleText) toggleText.textContent = 'Open Map';
                mapVisible = false;
            } else {
                container.classList.remove('map-collapsed');
                toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>';
                if (toggleText) toggleText.textContent = 'Close Map';
                mapVisible = true;

                loadGoogleMapsScript().then(function() {
                    if (!map) {
                        initMap();
                    }
                    setTimeout(function() {
                        if (map && typeof google !== 'undefined' && google.maps) {
                            google.maps.event.trigger(map, 'resize');
                        }
                        if (map && data && data.listings && typeof updateMapMarkers === 'function') {
                            updateMapMarkers(data.listings);
                        }
                    }, 150);
                }).catch(function(err) {
                    console.error('Failed to load Google Maps:', err);
                });
            }
        }
