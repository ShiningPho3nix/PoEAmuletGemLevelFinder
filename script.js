// Global variables
let gemsData = null;
let filteredGems = [];
let selectedGem = null;

// DOM elements
const gemSearch = document.getElementById('gem-search');
const gemDropdown = document.getElementById('gem-dropdown');
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
    
    // Filter buttons (removed - no longer needed)
    
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

// Generate possible modifiers for selected gem
function generateModifiers() {
    if (!selectedGem) return;
    
    const modifiers = [];
    
    // Only explicit amulet prefix modifiers for damage types
    const amuletPrefixes = [
        { text: '+1 to Level of all Lightning Skill Gems', tag: 'Lightning' },
        { text: '+1 to Level of all Cold Skill Gems', tag: 'Cold' },
        { text: '+1 to Level of all Physical Skill Gems', tag: 'Physical' },
        { text: '+1 to Level of all Fire Skill Gems', tag: 'Fire' },
        { text: '+1 to Level of all Chaos Skill Gems', tag: 'Chaos' }
    ];
    
    // Only include modifiers that match the selected gem's tags
    amuletPrefixes.forEach(modifier => {
        if (selectedGem.tags.includes(modifier.tag)) {
            modifiers.push({
                text: modifier.text,
                type: 'specific',
                priority: 1,
                tag: modifier.tag
            });
        }
    });
    
    // Sort modifiers alphabetically
    modifiers.sort((a, b) => a.text.localeCompare(b.text));
    
    // Display modifiers
    displayModifiers(modifiers);
}

// Display modifiers in the results section
function displayModifiers(modifiers) {
    modList.innerHTML = '';
    
    if (modifiers.length === 0) {
        const noModsMessage = document.createElement('div');
        noModsMessage.className = 'no-mods-message';
        noModsMessage.textContent = 'No amulet prefix modifiers available for this gem type.';
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
            modType.textContent = `${mod.tag} Damage`;
            
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