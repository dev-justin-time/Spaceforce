/**
 * Logic for market section filtering.
 * Extracted from src/market.js.
 */
export function matchesMarketFilter(listing, filter, searchTerm = '') {
    const category = (listing.item_data?.category || '').toLowerCase();
    const name = (listing.item_data?.name || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();

    // Check Search Term first
    if (term && !name.includes(term) && !category.includes(term)) {
        return false;
    }

    if (filter === 'all') return true;

    const filterMap = {
        orbital: () => category.includes('orbital') || name.includes('odin') || name.includes('thor') || category.includes('strike'),
        electronic: () => category.includes('electronic') || category.includes('electromagnetic') || name.includes('viper') || name.includes('serpent'),
        cyber: () => category.includes('cyber') || name.includes('chimera') || name.includes('oracle'),
        navigation: () => category.includes('navigation') || category.includes('propulsion') || name.includes('shark') || name.includes('warp'),
        sda: () => category.includes('space domain') || category.includes('stealth') || category.includes('recon') || name.includes('ghost') || name.includes('argus'),
        missile: () => category.includes('missile') || category.includes('warning') || name.includes('sentinel') || name.includes('aegis'),
        comms: () => category.includes('satellite') || category.includes('communications') || name.includes('constellation') || name.includes('phoenix'),
        hull: () => category.includes('hull') || name.includes('hull'),
        subsystem: () => category.includes('subsystem')
    };

    return filterMap[filter] ? filterMap[filter]() : true;
}