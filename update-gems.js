#!/usr/bin/env node

/**
 * PoE Gem Level Finder - Data Update Utility
 * 
 * This script fetches the latest skill gem data from the PoE Wiki API
 * and updates the gems_cleaned.json file used by the web application.
 * 
 * Usage: node update-gems.js
 */

const fs = require('fs');
const https = require('https');
const { URL } = require('url');

// Configuration
const POE_WIKI_API_BASE = 'https://www.poewiki.net/w/api.php';
const OUTPUT_FILE = 'gems_cleaned.json';

// Console colors for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Make HTTP request (Node.js compatible)
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`JSON parsing error: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Query PoE Wiki API for skill gems
async function fetchGemsFromAPI() {
    log('🔍 Querying PoE Wiki API for skill gems...', colors.blue);
    
    // Use working skill_gems query with pagination
    const baseParams = {
        action: 'cargoquery',
        tables: 'skill_gems',
        fields: '_pageName=Page,gem_tags__full=gem tags',
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
        log(`📡 Fetching skill_gems batch (offset ${offset}): ${url}`, colors.yellow);
        
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
        log(`📊 Total skill_gems fetched: ${allResults.length}`, colors.green);
        return { cargoquery: allResults };
    }
    
    throw new Error('All API queries failed to return data');
}

// Transform API response to match current data structure
function transformAPIData(apiResponse) {
    log('🔄 Transforming API data...', colors.blue);
    
    if (!apiResponse.cargoquery || !Array.isArray(apiResponse.cargoquery)) {
        throw new Error('Invalid API response format - missing cargoquery array');
    }
    
    const skillGems = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    apiResponse.cargoquery.forEach(item => {
        const title = item.title;
        
        // Handle different data structures
        let name, tags;
        
        if (title.Page && title['gem tags']) {
            // Skill_gems table structure with aliased field names
            name = title.Page;
            tags = title['gem tags'];
        } else if (title._pageName && title['gem_tags__full']) {
            // Skill_gems table structure with raw field names
            name = title._pageName;
            tags = title['gem_tags__full'];
        } else if (title.name && title.gem_tags) {
            // Items table with gem_tags field
            name = title.name;
            tags = title.gem_tags;
        } else if (title.name) {
            // Items table structure (fallback)
            name = title.name;
            tags = title.tags || '';
        } else {
            skippedCount++;
            return;
        }
        
        if (!name || !tags) {
            skippedCount++;
            return;
        }
        
        // Parse tags (handle both comma-separated and bullet-separated formats)
        let tagArray;
        if (tags.includes('•')) {
            // PoE Wiki format: "Spell • Minion • Duration • Physical • Lightning • AoE"
            tagArray = tags.split('•').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else {
            // Fallback: comma-separated format
            tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        
        // Skip support gems
        if (tagArray.includes('Support')) {
            skippedCount++;
            return;
        }
        
        // Skip gems without meaningful tags
        if (tagArray.length === 0) {
            skippedCount++;
            return;
        }
        
        skillGems.push({
            name: name,
            tags: tagArray
        });
        
        processedCount++;
    });
    
    log(`📊 Processed ${processedCount} skill gems, skipped ${skippedCount}`, colors.yellow);
    
    // Sort gems alphabetically by name
    skillGems.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
        total_count: skillGems.length,
        skill_gems: skillGems,
        last_updated: new Date().toISOString(),
        source: 'PoE Wiki API'
    };
}

// Save data to JSON file
function saveToFile(data, filename) {
    log(`💾 Saving data to ${filename}...`, colors.blue);
    
    try {
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(filename, jsonString, 'utf8');
        log(`✅ Successfully saved ${data.total_count} gems to ${filename}`, colors.green);
    } catch (error) {
        log(`❌ Error saving file: ${error.message}`, colors.red);
        throw error;
    }
}

// Main execution function
async function main() {
    log('🚀 PoE Gem Level Finder - Data Update Utility', colors.bright);
    log('================================================', colors.bright);
    
    try {
        // Fetch data from API
        const apiResponse = await fetchGemsFromAPI();
        
        // Transform data
        const transformedData = transformAPIData(apiResponse);
        
        // Save to file
        saveToFile(transformedData, OUTPUT_FILE);
        
        log('', colors.reset);
        log('🎉 Data update completed successfully!', colors.green);
        log(`📈 Total gems: ${transformedData.total_count}`, colors.yellow);
        log(`🕐 Last updated: ${transformedData.last_updated}`, colors.yellow);
        log(`📂 Output file: ${OUTPUT_FILE}`, colors.yellow);
        
    } catch (error) {
        log('', colors.reset);
        log('💥 Data update failed!', colors.red);
        log(`❌ Error: ${error.message}`, colors.red);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { fetchGemsFromAPI, transformAPIData, saveToFile };