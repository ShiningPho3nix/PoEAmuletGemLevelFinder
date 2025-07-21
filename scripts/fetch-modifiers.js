const https = require('https');
const fs = require('fs');

// Configuration
const POE_WIKI_API_BASE = 'https://www.poewiki.net/w/api.php';
const OUTPUT_FILE = '../data/modifiers_data.json';
const DOMAINS = [1, 9, 10, 13, 16, 17, 20, 21, 26, 28];

// Official mappings from PoE Wiki
const GENERATION_TYPE_MAP = {
    1: 'Prefix',
    2: 'Suffix',
    3: 'Intrinsic',
    4: 'Nemesis',
    5: 'Corrupted',
    6: 'Bloodlines',
    7: 'Torment',
    8: 'Tempest',
    9: 'Talisman',
    10: 'Enchantment',
    11: 'Essence',
    12: 'Essenceitem',
    13: 'Pantheon',
    14: 'Delve',
    15: 'Delveaura',
    16: 'Synthesis',
    17: 'Synthesisimplicit',
    18: 'Synthesisarea',
    19: 'Veiled',
    20: 'Betrayal',
    21: 'Blight',
    22: 'Blightenvelope',
    23: 'Blightmonster',
    24: 'Blightchest',
    25: 'Legion',
    26: 'Metamorph',
    27: 'Metamorphosis',
    28: 'Heist',
    29: 'Heistchest',
    30: 'Harvest',
    31: 'Experimentalbase',
    32: 'Crucible',
    33: 'Cruciblemonster',
    34: 'Sanctum',
    35: 'Ultimatum',
    36: 'Ancestor'
};

const DOMAIN_MAP = {
    1: 'Item',
    2: 'Flask',
    3: 'Monster',
    4: 'Strongbox',
    5: 'Area',
    6: 'Unused',
    7: 'Relic',
    8: 'Unused',
    9: 'Crafted',
    10: 'Jewel',
    11: 'Atlas',
    12: 'Leaguestone',
    13: 'Abyss Jewel',
    14: 'Map Device',
    15: 'Dummy',
    16: 'Delve',
    17: 'Delve Area',
    18: 'Synthesis Area',
    19: 'Synthesis Monster',
    20: 'Synthesis',
    21: 'Heist',
    22: 'Heist NPC',
    23: 'Heist Chest',
    24: 'Heist Area',
    25: 'Harvest Seed',
    26: 'Harvest Plant',
    27: 'Harvest Infrastructure',
    28: 'Trinket',
    29: 'Expedition Monster',
    30: 'Expedition Logbook',
    31: 'Expedition Faction',
    32: 'Archnemesis',
    33: 'Memoryline',
    34: 'Sanctum',
    35: 'Sanctum Monster',
    36: 'Sanctum Room',
    37: 'Crucible',
    38: 'Necrotic'
};

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Logging function with colors
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Make HTTP request
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`HTTP request failed: ${error.message}`));
        });
    });
}

// Query PoE Wiki API for modifiers
async function fetchModifiersFromAPI() {
    log('🔍 Querying PoE Wiki API for all modifiers...', colors.blue);
    
    // Use working modifier query with pagination
    const baseParams = {
        action: 'cargoquery',
        tables: 'mods',
        fields: 'id,name,stat_text,stat_text_raw,generation_type,domain,tags',
        where: `(generation_type=1 OR generation_type=2) AND domain IN (${DOMAINS.join(',')})`,
        limit: '500',
        format: 'json'
    };
    
    let allResults = [];
    let offset = 0;
    let hasMoreResults = true;
    
    while (hasMoreResults) {
        const params = new URLSearchParams({
            ...baseParams,
            offset: offset.toString()
        });
        
        const url = `${POE_WIKI_API_BASE}?${params}`;
        log(`📡 Fetching modifiers batch (offset ${offset}): ${url}`, colors.yellow);
        
        try {
            const data = await makeRequest(url);
            log('✅ API request successful', colors.green);
            
            if (data.cargoquery && data.cargoquery.length > 0) {
                log(`📊 Found ${data.cargoquery.length} results in this batch`, colors.green);
                allResults = allResults.concat(data.cargoquery);
                
                // Check if we got less than the limit, meaning we're done
                if (data.cargoquery.length < 500) {
                    hasMoreResults = false;
                } else {
                    offset += 500;
                }
            } else {
                log(`⚠️ No results in batch at offset ${offset}`, colors.yellow);
                hasMoreResults = false;
            }
        } catch (error) {
            log(`❌ Batch at offset ${offset} failed: ${error.message}`, colors.red);
            hasMoreResults = false;
        }
    }
    
    if (allResults.length > 0) {
        log(`📊 Total modifiers fetched: ${allResults.length}`, colors.green);
        return { cargoquery: allResults };
    }
    
    throw new Error('All API queries failed to return data');
}

// Transform API data to our format
function transformAPIData(apiResponse) {
    log('🔄 Transforming API data...', colors.blue);
    
    const modifiers = [];
    let skippedCount = 0;
    
    apiResponse.cargoquery.forEach(item => {
        const title = item.title;
        
        // Extract modifier data (using spaced field names from API)
        const generationTypeId = parseInt(title['generation type']) || 0;
        const domainId = parseInt(title.domain) || 0;
        
        const modifier = {
            id: title.id,
            name: title.name || '',
            stat_text: title['stat text'] || '',
            stat_text_raw: title['stat text raw'] || '',
            generation_type: GENERATION_TYPE_MAP[generationTypeId] || `Unknown(${generationTypeId})`,
            generation_type_id: generationTypeId,
            domain: DOMAIN_MAP[domainId] || `Unknown(${domainId})`,
            domain_id: domainId,
            tags: title.tags || ''
        };
        
        // Basic validation - just check if we have an id
        if (!modifier.id) {
            skippedCount++;
            return;
        }
        
        modifiers.push(modifier);
    });
    
    log(`📊 Processed ${modifiers.length} modifiers, skipped ${skippedCount}`, colors.yellow);
    return modifiers;
}

// Save data to JSON files
function saveData(modifiers) {
    log('💾 Saving data to JSON files...', colors.blue);
    
    // 1. Save full modifiers data
    const fullData = {
        total_count: modifiers.length,
        domains: DOMAINS,
        modifiers: modifiers,
        last_updated: new Date().toISOString(),
        source: 'PoE Wiki API'
    };
    
    try {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fullData, null, 2));
        log(`✅ Successfully saved ${modifiers.length} modifiers to ${OUTPUT_FILE}`, colors.green);
    } catch (error) {
        throw new Error(`Failed to save full data: ${error.message}`);
    }
    
    // 2. Filter for "to Level of" modifiers
    const levelModifiers = modifiers.filter(mod => 
        mod.stat_text_raw.toLowerCase().includes('to level of')
    );
    
    const levelData = {
        total_count: levelModifiers.length,
        domains: DOMAINS,
        modifiers: levelModifiers,
        last_updated: new Date().toISOString(),
        source: 'PoE Wiki API',
        filter: 'Contains "to Level of" in stat_text_raw'
    };
    
    const levelOutputFile = '../data/modifiers_level_only.json';
    try {
        fs.writeFileSync(levelOutputFile, JSON.stringify(levelData, null, 2));
        log(`✅ Successfully saved ${levelModifiers.length} level modifiers to ${levelOutputFile}`, colors.green);
    } catch (error) {
        throw new Error(`Failed to save level data: ${error.message}`);
    }
    
    // 3. Filter level modifiers for amulet-specific ones (domain 1 = Item)
    // and exclude irrelevant modifiers like socketed support gems
    const amuletLevelModifiers = levelModifiers.filter(mod => {
        // Must be in Item domain (1)
        if (mod.domain_id !== 1) return false;
        
        // Exclude socketed gems - not relevant for gem level finder
        // These affect gems socketed in the item itself, not equipped gems
        const statText = mod.stat_text_raw.toLowerCase();
        if (statText.includes('socketed')) {
            return false;
        }
        
        return true;
    });
    
    const amuletData = {
        total_count: amuletLevelModifiers.length,
        domains: DOMAINS,
        modifiers: amuletLevelModifiers,
        last_updated: new Date().toISOString(),
        source: 'PoE Wiki API',
        filter: 'Contains "to Level of" in stat_text_raw AND domain_id = 1 (Item) AND excludes socketed gems'
    };
    
    const amuletOutputFile = '../data/modifiers_amulet_level.json';
    try {
        fs.writeFileSync(amuletOutputFile, JSON.stringify(amuletData, null, 2));
        log(`✅ Successfully saved ${amuletLevelModifiers.length} amulet level modifiers to ${amuletOutputFile}`, colors.green);
    } catch (error) {
        throw new Error(`Failed to save amulet data: ${error.message}`);
    }
    
    // Return summary for main function
    return {
        total: modifiers.length,
        level: levelModifiers.length,
        amulet: amuletLevelModifiers.length
    };
}

// Main execution
async function main() {
    try {
        log('🚀 PoE Modifier Fetcher - Starting...', colors.bright);
        log('='.repeat(50), colors.bright);
        
        // Fetch data from API
        const apiResponse = await fetchModifiersFromAPI();
        
        // Transform data
        const modifiers = transformAPIData(apiResponse);
        
        // Save to files
        const summary = saveData(modifiers);
        
        log('', colors.reset);
        log('🎉 Data fetch completed successfully!', colors.green);
        log(`📈 Total modifiers: ${summary.total}`, colors.yellow);
        log(`🔥 Level modifiers: ${summary.level}`, colors.yellow);
        log(`💎 Amulet level modifiers: ${summary.amulet}`, colors.yellow);
        log(`🕐 Last updated: ${new Date().toISOString()}`, colors.yellow);
        log(`📂 Output files: ${OUTPUT_FILE}, modifiers_level_only.json, modifiers_amulet_level.json`, colors.yellow);
        
    } catch (error) {
        log(`❌ Error: ${error.message}`, colors.red);
        process.exit(1);
    }
}

// Run the script
main();