// Global variables
let gemsData = null;
let filteredGems = [];
let selectedGem = null;

// DOM elements
const gemSearch = document.getElementById('gem-search');
const gemDropdown = document.getElementById('gem-dropdown');
const levelSelector = document.getElementById('level-selector');
const gemInfo = document.getElementById('gem-info');
const selectedGemName = document.getElementById('selected-gem-name');
const selectedGemTags = document.getElementById('selected-gem-tags');
const resultsSection = document.getElementById('results-section');
const modList = document.getElementById('mod-list');
const gemCount = document.getElementById('gem-count');
// filterButtons removed - no longer needed
const copyBtn = document.getElementById('copy-btn');
const exportBtn = document.getElementById('export-btn');

// Load gems data on page load
document.addEventListener('DOMContentLoaded', loadGemsData);

// Load gems data from JSON file
async function loadGemsData() {
    try {
        const response = await fetch('gems_cleaned.json');
        gemsData = await response.json();
        
        // Update gem count
        gemCount.textContent = gemsData.total_count;
        
        // Initialize search functionality
        initializeSearch();
    } catch (error) {
        console.error('Error loading gems data:', error);
        gemCount.textContent = 'Error loading data';
    }
}

// Initialize search functionality
function initializeSearch() {
    gemSearch.addEventListener('input', handleSearch);
    gemSearch.addEventListener('focus', handleSearch);
    gemSearch.addEventListener('blur', hideDropdown);
    
    // Level selector
    levelSelector.addEventListener('change', () => {
        if (selectedGem) {
            generateModifiers();
        }
    });
    
    // Export buttons
    copyBtn.addEventListener('click', copyToClipboard);
    exportBtn.addEventListener('click', exportAsText);
}

// Handle search input
function handleSearch() {
    const query = gemSearch.value.toLowerCase().trim();
    
    if (query.length === 0) {
        hideDropdown();
        return;
    }
    
    // Filter gems based on search query - only active skill gems (no support gems)
    filteredGems = gemsData.skill_gems.filter(gem => 
        gem.name.toLowerCase().includes(query) && !gem.tags.includes('Support')
    );
    
    // Sort by relevance (exact matches first)
    filteredGems.sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(query);
        const bExact = b.name.toLowerCase().startsWith(query);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
    });
    
    // Show dropdown with results
    showDropdown();
}

// Show dropdown with filtered results
function showDropdown() {
    gemDropdown.innerHTML = '';
    
    // Limit results to 10 for performance
    const limitedResults = filteredGems.slice(0, 10);
    
    limitedResults.forEach(gem => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = gem.name;
        item.addEventListener('click', () => selectGem(gem));
        gemDropdown.appendChild(item);
    });
    
    if (limitedResults.length > 0) {
        gemDropdown.classList.remove('hidden');
    } else {
        hideDropdown();
    }
}

// Hide dropdown
function hideDropdown() {
    setTimeout(() => {
        gemDropdown.classList.add('hidden');
    }, 200);
}

// Select a gem
function selectGem(gem) {
    selectedGem = gem;
    gemSearch.value = gem.name;
    hideDropdown();
    
    // Update gem info display
    selectedGemName.textContent = gem.name;
    selectedGemTags.innerHTML = gem.tags.map(tag => 
        `<span class="tag">${tag}</span>`
    ).join('');
    
    gemInfo.style.display = 'block';
    
    // Generate and display modifiers
    generateModifiers();
}

/*
 * Path of Exile Affix System Notes:
 * - Equipment can have 6 explicit affixes maximum
 * - 3x Prefix affixes
 * - 3x Suffix affixes
 * - +# to Level modifiers are SUFFIX affixes
 * - Maximum possible +level from suffixes: 3 (one per suffix slot)
 * - Future: May explore other ways to boost gem levels (prefix mods, implicits, etc.)
 */

// Generate possible modifiers for selected gem
function generateModifiers() {
    if (!selectedGem) return;
    
    const modifiers = [];
    const minLevel = parseInt(levelSelector.value);
    
    // Calculate all available modifiers for this gem
    const availableModifiers = [];
    
    // Generic modifier that affects all skill gems (suffix)
    availableModifiers.push({
        text: '+1 to Level of all Skill Gems',
        type: 'generic',
        priority: 0,
        tag: 'All',
        level: 1
    });
    
    // Explicit amulet suffix modifiers for damage types
    const amuletSuffixes = [
        { text: '+1 to Level of all Lightning Skill Gems', tag: 'Lightning', level: 1 },
        { text: '+1 to Level of all Cold Skill Gems', tag: 'Cold', level: 1 },
        { text: '+1 to Level of all Physical Skill Gems', tag: 'Physical', level: 1 },
        { text: '+1 to Level of all Fire Skill Gems', tag: 'Fire', level: 1 },
        { text: '+1 to Level of all Chaos Skill Gems', tag: 'Chaos', level: 1 }
    ];
    
    // Add matching damage type modifiers
    amuletSuffixes.forEach(modifier => {
        if (selectedGem.tags.includes(modifier.tag)) {
            availableModifiers.push({
                text: modifier.text,
                type: 'specific',
                priority: 1,
                tag: modifier.tag,
                level: modifier.level
            });
        }
    });
    
    // Calculate maximum possible level boost (limited by suffix slots: max 3)
    const maxPossibleLevel = Math.min(3, availableModifiers.reduce((sum, mod) => sum + mod.level, 0));
    
    // Determine which modifiers to show
    let showWarning = false;
    
    if (maxPossibleLevel < minLevel) {
        // Not enough modifiers to reach target level, show all available
        showWarning = true;
        modifiers.push(...availableModifiers);
    } else {
        // Show all available modifiers when target is achievable
        modifiers.push(...availableModifiers);
    }
    
    // Sort modifiers by priority (generic first), then alphabetically
    modifiers.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        return a.text.localeCompare(b.text);
    });
    
    // Display modifiers with warning if needed
    displayModifiers(modifiers, showWarning, maxPossibleLevel, minLevel);
}

// Display modifiers in the results section
function displayModifiers(modifiers, showWarning = false, maxPossibleLevel = 0, targetLevel = 0) {
    modList.innerHTML = '';
    
    // Show warning message if target level cannot be reached
    if (showWarning) {
        const warningMessage = document.createElement('div');
        warningMessage.className = 'warning-message';
        warningMessage.innerHTML = `
            <strong>⚠️ Warning:</strong> Cannot reach +${targetLevel} levels for this gem.<br>
            Maximum possible: +${maxPossibleLevel} levels (showing highest possible combination)
        `;
        modList.appendChild(warningMessage);
    }
    
    if (modifiers.length === 0) {
        const noModsMessage = document.createElement('div');
        noModsMessage.className = 'no-mods-message';
        noModsMessage.textContent = 'No amulet suffix modifiers available for this gem type.';
        modList.appendChild(noModsMessage);
    } else {
        modifiers.forEach(mod => {
            const modItem = document.createElement('div');
            modItem.className = `mod-item ${mod.type}`;
            
            const modText = document.createElement('span');
            modText.className = 'mod-text';
            modText.textContent = mod.text;
            
            const modType = document.createElement('span');
            modType.className = 'mod-type';
            modType.textContent = mod.tag === 'All' ? 'All Gems' : `${mod.tag} Damage`;
            
            modItem.appendChild(modText);
            modItem.appendChild(modType);
            
            modList.appendChild(modItem);
        });
    }
    
    resultsSection.style.display = 'block';
}

// Filter functions removed - no longer needed for amulet-specific modifiers

// Copy modifiers to clipboard
async function copyToClipboard() {
    if (!selectedGem) return;
    
    const modItems = document.querySelectorAll('.mod-item');
    const text = Array.from(modItems).map(item => 
        item.querySelector('.mod-text').textContent
    ).join('\n');
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Show feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
    }
}

// Export as text file
function exportAsText() {
    if (!selectedGem) return;
    
    const modItems = document.querySelectorAll('.mod-item');
    const text = `Path of Exile Gem Level Modifiers for: ${selectedGem.name}\n\n` +
                 Array.from(modItems).map(item => 
                     item.querySelector('.mod-text').textContent
                 ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedGem.name.replace(/\s+/g, '_')}_modifiers.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}