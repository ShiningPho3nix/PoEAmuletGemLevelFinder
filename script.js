// Global variables
let gemsData = null;
let modifiersData = null;
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

// Load gems data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGemsData();
    initializeFAQ();
});

// Load gems data from JSON file
async function loadGemsData() {
    try {
        // Add cache-busting parameter to prevent browser caching
        const gemsResponse = await fetch(`data/gems_cleaned.json?v=${Date.now()}`);
        gemsData = await gemsResponse.json();
        
        // Load modifiers data - using current PoE database
        const modifiersResponse = await fetch(`data/current_amulet_modifiers.json?v=${Date.now()}`);
        modifiersData = await modifiersResponse.json();
        
        // Update gem count
        gemCount.textContent = gemsData.total_count;
        
        // Initialize search functionality
        initializeSearch();
    } catch (error) {
        console.error('Error loading data:', error);
        gemCount.textContent = 'Error loading data';
    }
}

// Initialize FAQ functionality
function initializeFAQ() {
    const faqHeader = document.getElementById('faq-header');
    const faqSection = document.getElementById('faq-section');
    
    if (faqHeader && faqSection) {
        faqHeader.addEventListener('click', () => {
            faqSection.classList.toggle('collapsed');
        });
    }
}

// Initialize search functionality
function initializeSearch() {
    gemSearch.addEventListener('input', handleSearch);
    gemSearch.addEventListener('focus', handleSearch);
    gemSearch.addEventListener('blur', hideDropdown);
    
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

// Get currency icon based on gem level (representing cost/difficulty)
function getCurrencyIcon(level) {
    if (level >= 8) return 'images/mirror_of_kalandra.png';
    if (level >= 4) return 'images/divine_orb.png';
    if (level >= 2) return 'images/exalted_orb.png';
    return 'images/chaos_orb.png';
}

// Get currency name for alt text
function getCurrencyName(level) {
    if (level >= 8) return 'Mirror of Kalandra - Extremely expensive/rare';
    if (level >= 4) return 'Divine Orb - Very expensive';
    if (level >= 2) return 'Exalted Orb - Expensive';
    return 'Chaos Orb - Moderate cost';
}

// Get CSS class for modifier color based on damage type
function getModifierClass(modifierText) {
    const textLower = modifierText.toLowerCase();
    
    if (textLower.includes('physical')) return 'mod-physical';
    if (textLower.includes('fire')) return 'mod-fire';
    if (textLower.includes('cold')) return 'mod-cold';
    if (textLower.includes('lightning')) return 'mod-lightning';
    if (textLower.includes('chaos')) return 'mod-chaos';
    if (textLower.includes('all skill gems')) return 'mod-all';
    
    return '';
}

// Get CSS class for tag color
function getTagClass(tag) {
    const tagLower = tag.toLowerCase();
    
    // Map tag names to CSS classes
    const tagColorMap = {
        'spell': 'caster',
        'attack': 'attack', 
        'physical': 'physical',
        'movement': 'movement',
        'critical': 'critical',
        'fire': 'fire',
        'cold': 'cold',
        'lightning': 'lightning',
        'chaos': 'chaos',
        'life': 'life',
        'guard': 'defence'
    };
    
    return tagColorMap[tagLower] || '';
}

// Select a gem
function selectGem(gem) {
    selectedGem = gem;
    gemSearch.value = gem.name;
    hideDropdown();
    
    // Update gem info display
    selectedGemName.textContent = gem.name;
    selectedGemTags.innerHTML = gem.tags.map(tag => 
        `<span class="tag ${getTagClass(tag)}">${tag}</span>`
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
    if (!selectedGem || !modifiersData) return;
    
    const modifiers = [];
    
    // Check all available modifiers against the selected gem
    modifiersData.modifiers.forEach(modifier => {
        if (gemMatchesModifier(selectedGem, modifier)) {
            modifiers.push({
                text: modifier.stat_text_raw,
                name: modifier.name,
                type: modifier.generation_type.toLowerCase(),
                priority: getPriorityFromModifier(modifier),
                level: getLevelFromModifier(modifier),
                influence: modifier.influence || null,
                tags: modifier.tags,
                id: modifier.id
            });
        }
    });
    
    // Generate all possible combinations (1 mod and 2 mod combinations)
    const combinations = generateCombinations(modifiers);
    
    // Group combinations by total level boost
    const groupedCombinations = groupCombinationsByLevel(combinations);
    
    // Display grouped combinations
    displayGroupedCombinations(groupedCombinations);
}

// Check if two modifiers can be combined on the same amulet
function canCombineModifiers(mod1, mod2) {
    const text1 = mod1.text.toLowerCase();
    const text2 = mod2.text.toLowerCase();
    
    // Universal modifier (+1 to all skill gems) can combine with any specific modifier
    const isUniversal1 = text1.includes('all skill gems') && !text1.includes('spell');
    const isUniversal2 = text2.includes('all skill gems') && !text2.includes('spell');
    
    // If one is universal, they can combine
    if (isUniversal1 || isUniversal2) {
        return true;
    }
    
    // Check if both are damage-type specific (these cannot combine)
    const damageTypes = ['lightning', 'cold', 'physical', 'fire', 'chaos'];
    const hasElemental1 = damageTypes.some(type => text1.includes(`all ${type} skill gems`));
    const hasElemental2 = damageTypes.some(type => text2.includes(`all ${type} skill gems`));
    
    // If both are elemental/damage-type specific, they cannot combine
    if (hasElemental1 && hasElemental2) {
        return false;
    }
    
    // Other combinations are allowed (e.g., spell modifiers, attribute modifiers, etc.)
    return true;
}

// Generate all possible combinations of modifiers
function generateCombinations(modifiers) {
    const combinations = [];
    
    // Regular amulet combinations
    // Single modifier combinations
    modifiers.forEach(mod => {
        combinations.push({
            modifiers: [mod],
            totalLevel: mod.level,
            displayText: mod.name,
            amuletType: 'regular'
        });
    });
    
    // Pair combinations (no duplicates - each modifier can only appear once)
    for (let i = 0; i < modifiers.length; i++) {
        for (let j = i + 1; j < modifiers.length; j++) {
            const mod1 = modifiers[i];
            const mod2 = modifiers[j];
            
            // Only combine if the modifiers can legally be on the same amulet
            if (canCombineModifiers(mod1, mod2)) {
                combinations.push({
                    modifiers: [mod1, mod2],
                    totalLevel: mod1.level + mod2.level,
                    displayText: `${mod1.name} + ${mod2.name}`,
                    amuletType: 'regular'
                });
            }
        }
    }
    
    // Focused Amulet combinations (doubles the effect)
    // Single modifier on Focused Amulet
    modifiers.forEach(mod => {
        combinations.push({
            modifiers: [mod],
            totalLevel: mod.level * 2,
            displayText: mod.name,
            amuletType: 'focused'
        });
    });
    
    // Pair combinations on Focused Amulet (doubles the effect)
    for (let i = 0; i < modifiers.length; i++) {
        for (let j = i + 1; j < modifiers.length; j++) {
            const mod1 = modifiers[i];
            const mod2 = modifiers[j];
            
            // Only combine if the modifiers can legally be on the same amulet
            if (canCombineModifiers(mod1, mod2)) {
                combinations.push({
                    modifiers: [mod1, mod2],
                    totalLevel: (mod1.level + mod2.level) * 2,
                    displayText: `${mod1.name} + ${mod2.name}`,
                    amuletType: 'focused'
                });
            }
        }
    }
    
    // Reflecting Mist combinations (doubles the effect on regular amulets)
    // Single modifier with Reflecting Mist
    modifiers.forEach(mod => {
        combinations.push({
            modifiers: [mod],
            totalLevel: mod.level * 2,
            displayText: mod.name,
            amuletType: 'reflectingMist'
        });
    });
    
    // Pair combinations with Reflecting Mist (doubles the effect)
    for (let i = 0; i < modifiers.length; i++) {
        for (let j = i + 1; j < modifiers.length; j++) {
            const mod1 = modifiers[i];
            const mod2 = modifiers[j];
            
            // Only combine if the modifiers can legally be on the same amulet
            if (canCombineModifiers(mod1, mod2)) {
                combinations.push({
                    modifiers: [mod1, mod2],
                    totalLevel: (mod1.level + mod2.level) * 2,
                    displayText: `${mod1.name} + ${mod2.name}`,
                    amuletType: 'reflectingMist'
                });
            }
        }
    }
    
    // Focused Amulet + Reflecting Mist combinations (quadruples the effect: 2x focused × 2x reflecting = 4x)
    // Single modifier on Focused Amulet with Reflecting Mist
    modifiers.forEach(mod => {
        combinations.push({
            modifiers: [mod],
            totalLevel: mod.level * 4,
            displayText: mod.name,
            amuletType: 'focusedReflecting'
        });
    });
    
    // Pair combinations on Focused Amulet with Reflecting Mist (quadruples the effect)
    for (let i = 0; i < modifiers.length; i++) {
        for (let j = i + 1; j < modifiers.length; j++) {
            const mod1 = modifiers[i];
            const mod2 = modifiers[j];
            
            // Only combine if the modifiers can legally be on the same amulet
            if (canCombineModifiers(mod1, mod2)) {
                combinations.push({
                    modifiers: [mod1, mod2],
                    totalLevel: (mod1.level + mod2.level) * 4,
                    displayText: `${mod1.name} + ${mod2.name}`,
                    amuletType: 'focusedReflecting'
                });
            }
        }
    }
    
    return combinations;
}

// Group combinations by total level boost
function groupCombinationsByLevel(combinations) {
    const groups = {};
    
    combinations.forEach(combination => {
        const level = combination.totalLevel;
        if (!groups[level]) {
            groups[level] = {
                regular: [],
                focused: [],
                reflectingMist: [],
                focusedReflecting: []
            };
        }
        groups[level][combination.amuletType].push(combination);
    });
    
    // Sort combinations within each group
    Object.keys(groups).forEach(level => {
        groups[level].regular.sort((a, b) => sortCombinations(a, b));
        groups[level].focused.sort((a, b) => sortCombinations(a, b));
        groups[level].reflectingMist.sort((a, b) => sortCombinations(a, b));
        groups[level].focusedReflecting.sort((a, b) => sortCombinations(a, b));
    });
    
    return groups;
}

// Sort combinations: "all skill gems" first, then non-influence, then alphabetically
function sortCombinations(a, b) {
    // Check if either combination contains "all skill gems"
    const aHasAllSkills = a.modifiers.some(mod => mod.text.toLowerCase().includes('all skill gems') && !mod.text.toLowerCase().includes('spell'));
    const bHasAllSkills = b.modifiers.some(mod => mod.text.toLowerCase().includes('all skill gems') && !mod.text.toLowerCase().includes('spell'));
    
    if (aHasAllSkills && !bHasAllSkills) return -1;
    if (!aHasAllSkills && bHasAllSkills) return 1;
    
    // Check influence status
    const aHasInfluence = a.modifiers.some(mod => mod.influence);
    const bHasInfluence = b.modifiers.some(mod => mod.influence);
    
    if (!aHasInfluence && bHasInfluence) return -1;
    if (aHasInfluence && !bHasInfluence) return 1;
    
    // Alphabetical by display text
    return a.displayText.localeCompare(b.displayText);
}

// Check if a gem matches a modifier
function gemMatchesModifier(gem, modifier) {
    const statText = modifier.stat_text_raw.toLowerCase();
    
    // Universal modifiers (affects all gems)
    if (statText.includes('all skill gems')) {
        return true;
    }
    
    // Damage type modifiers
    const damageTypes = ['lightning', 'cold', 'physical', 'fire', 'chaos'];
    for (const damageType of damageTypes) {
        if (statText.includes(`all ${damageType} skill gems`)) {
            return gem.tags.some(tag => tag.toLowerCase() === damageType);
        }
    }
    
    // Spell modifiers
    if (statText.includes('spell skill gems')) {
        if (!gem.tags.includes('Spell')) return false;
        
        // Check specific spell damage types
        for (const damageType of damageTypes) {
            if (statText.includes(`${damageType} spell skill gems`)) {
                return gem.tags.some(tag => tag.toLowerCase() === damageType);
            }
        }
        
        // Generic spell modifier
        if (statText.includes('all spell skill gems')) {
            return true;
        }
    }
    
    // Attribute-based modifiers - only use primary attribute
    if (statText.includes('strength skill gems')) {
        return gem.primary_attribute === 'strength';
    }
    if (statText.includes('dexterity skill gems')) {
        return gem.primary_attribute === 'dexterity';
    }
    if (statText.includes('intelligence skill gems')) {
        return gem.primary_attribute === 'intelligence';
    }
    
    // Minion modifiers
    if (statText.includes('minion skill gems')) {
        return gem.tags.includes('Minion');
    }
    
    // Specific skill modifiers (e.g., Raise Spectre)
    if (statText.includes('raise spectre gems')) {
        return gem.name.toLowerCase().includes('raise spectre');
    }
    
    return false;
}

// Get priority for sorting (lower = higher priority)
function getPriorityFromModifier(modifier) {
    const statText = modifier.stat_text_raw.toLowerCase();
    
    // Universal modifiers first
    if (statText.includes('all skill gems') && !statText.includes('spell')) {
        return 0;
    }
    
    // Specific damage types
    if (statText.includes('lightning') || statText.includes('cold') || 
        statText.includes('physical') || statText.includes('fire') || 
        statText.includes('chaos')) {
        return 1;
    }
    
    // Spell modifiers
    if (statText.includes('spell')) {
        return 2;
    }
    
    // Attribute modifiers
    if (statText.includes('strength') || statText.includes('dexterity') || 
        statText.includes('intelligence')) {
        return 3;
    }
    
    // Minion modifiers
    if (statText.includes('minion')) {
        return 4;
    }
    
    // Specific skills
    return 5;
}

// Extract level bonus from modifier text
function getLevelFromModifier(modifier) {
    const statText = modifier.stat_text_raw;
    const match = statText.match(/\+(\d+)/);
    return match ? parseInt(match[1]) : 1;
}

// Display grouped combinations in the results section
function displayGroupedCombinations(groupedCombinations) {
    modList.innerHTML = '';
    
    const levels = Object.keys(groupedCombinations).map(Number).sort((a, b) => a - b);
    
    if (levels.length === 0) {
        const noModsMessage = document.createElement('div');
        noModsMessage.className = 'no-mods-message';
        noModsMessage.textContent = 'No amulet modifiers available for this gem type.';
        modList.appendChild(noModsMessage);
        resultsSection.style.display = 'block';
        return;
    }
    
    levels.forEach(level => {
        const levelData = groupedCombinations[level];
        
        // Create level group header
        const levelGroup = document.createElement('div');
        levelGroup.className = 'level-group';
        
        const levelHeader = document.createElement('h4');
        levelHeader.className = 'level-header';
        
        // Create header content container
        const headerContent = document.createElement('span');
        headerContent.className = 'level-header-content';
        
        // Create currency icon
        const currencyIcon = document.createElement('img');
        currencyIcon.src = getCurrencyIcon(level);
        currencyIcon.className = 'currency-icon';
        currencyIcon.alt = getCurrencyName(level);
        currencyIcon.title = getCurrencyName(level);
        
        // Create header text span
        const headerText = document.createElement('span');
        headerText.textContent = `+${level} Level${level > 1 ? 's' : ''}`;
        
        // Create collapse icon
        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'collapse-icon';
        collapseIcon.textContent = '▼';
        
        headerContent.appendChild(currencyIcon);
        headerContent.appendChild(headerText);
        levelHeader.appendChild(headerContent);
        levelHeader.appendChild(collapseIcon);
        
        // Add click handler for collapsing
        levelHeader.addEventListener('click', () => {
            levelGroup.classList.toggle('collapsed');
        });
        
        levelGroup.appendChild(levelHeader);
        
        // Create combinations container
        const combinationsContainer = document.createElement('div');
        combinationsContainer.className = 'combinations-container';
        
        // Show regular amulet combinations first
        if (levelData.regular.length > 0) {
            levelData.regular.forEach(combination => {
                const combinationItem = createCombinationItem(combination, 'regular');
                combinationsContainer.appendChild(combinationItem);
            });
        }
        
        // Show focused amulet combinations
        if (levelData.focused.length > 0) {
            // Add focused amulet section header
            const focusedHeader = document.createElement('div');
            focusedHeader.className = 'focused-amulet-header';
            
            const focusedIcon = document.createElement('img');
            focusedIcon.src = 'images/focused_amulet.webp';
            focusedIcon.className = 'focused-amulet-icon';
            focusedIcon.alt = 'Focused Amulet icon - doubles gem level modifier effects in Path of Exile';
            focusedIcon.title = 'Focused Amulet (doubles modifier effects)';
            
            const focusedText = document.createElement('span');
            focusedText.textContent = 'Focused Amulet (doubles effects):';
            focusedText.className = 'focused-amulet-text';
            
            focusedHeader.appendChild(focusedIcon);
            focusedHeader.appendChild(focusedText);
            combinationsContainer.appendChild(focusedHeader);
            
            levelData.focused.forEach(combination => {
                const combinationItem = createCombinationItem(combination, 'focused');
                combinationsContainer.appendChild(combinationItem);
            });
        }
        
        // Show reflecting mist combinations
        if (levelData.reflectingMist.length > 0) {
            // Add reflecting mist section header
            const reflectingHeader = document.createElement('div');
            reflectingHeader.className = 'reflecting-mist-header';
            
            const reflectingIcon = document.createElement('img');
            reflectingIcon.src = 'images/reflecting_mist.webp';
            reflectingIcon.className = 'reflecting-mist-icon';
            reflectingIcon.alt = 'Reflecting Mist icon - doubles amulet modifier effects in Path of Exile';
            reflectingIcon.title = 'Reflecting Mist (doubles modifier effects)';
            
            const reflectingText = document.createElement('span');
            reflectingText.textContent = 'Reflecting Mist (doubles effects):';
            reflectingText.className = 'reflecting-mist-text';
            
            reflectingHeader.appendChild(reflectingIcon);
            reflectingHeader.appendChild(reflectingText);
            combinationsContainer.appendChild(reflectingHeader);
            
            levelData.reflectingMist.forEach(combination => {
                const combinationItem = createCombinationItem(combination, 'reflectingMist');
                combinationsContainer.appendChild(combinationItem);
            });
        }
        
        // Show focused amulet + reflecting mist combinations
        if (levelData.focusedReflecting.length > 0) {
            // Add focused + reflecting mist section header
            const focusedReflectingHeader = document.createElement('div');
            focusedReflectingHeader.className = 'focused-reflecting-header';
            
            const focusedIcon = document.createElement('img');
            focusedIcon.src = 'images/focused_amulet.webp';
            focusedIcon.className = 'focused-amulet-icon';
            focusedIcon.alt = 'Focused Amulet icon - quadruples gem modifier effects when combined with Reflecting Mist';
            focusedIcon.title = 'Focused Amulet + Reflecting Mist (quadruples modifier effects)';
            
            const reflectingIcon = document.createElement('img');
            reflectingIcon.src = 'images/reflecting_mist.webp';
            reflectingIcon.className = 'reflecting-mist-icon';
            reflectingIcon.alt = 'Reflecting Mist icon - quadruples amulet modifier effects when combined with Focused Amulet';
            reflectingIcon.title = 'Focused Amulet + Reflecting Mist (quadruples modifier effects)';
            
            const focusedText = document.createElement('span');
            focusedText.textContent = 'Focused Amulet + ';
            focusedText.className = 'focused-reflecting-text';
            
            const reflectingText = document.createElement('span');
            reflectingText.textContent = 'Reflecting Mist (4x effects):';
            reflectingText.className = 'focused-reflecting-text';
            
            focusedReflectingHeader.appendChild(focusedIcon);
            focusedReflectingHeader.appendChild(focusedText);
            focusedReflectingHeader.appendChild(reflectingIcon);
            focusedReflectingHeader.appendChild(reflectingText);
            combinationsContainer.appendChild(focusedReflectingHeader);
            
            levelData.focusedReflecting.forEach(combination => {
                const combinationItem = createCombinationItem(combination, 'focusedReflecting');
                combinationsContainer.appendChild(combinationItem);
            });
        }
        
        levelGroup.appendChild(combinationsContainer);
        modList.appendChild(levelGroup);
    });
    
    resultsSection.style.display = 'block';
}

// Helper function to create combination items
function createCombinationItem(combination, type) {
    const combinationItem = document.createElement('div');
    combinationItem.className = `combination-item ${type}`;
    
    // Add combination text
    const combinationText = document.createElement('span');
    combinationText.className = 'combination-text';
    combinationText.textContent = combination.displayText;
    
    combinationItem.appendChild(combinationText);
    
    // Add modifier details
    const modifierDetails = document.createElement('div');
    modifierDetails.className = 'modifier-details';
    
    combination.modifiers.forEach((mod, index) => {
        if (index > 0) {
            const separator = document.createElement('span');
            separator.className = 'modifier-separator';
            separator.textContent = ' + ';
            modifierDetails.appendChild(separator);
        }
        
        const modDetail = document.createElement('span');
        
        let modText = mod.text;
        // Show multiplied effect based on type
        if (type === 'focused' || type === 'reflectingMist') {
            modText = mod.text.replace(/\+(\d+)/, (match, num) => `+${num * 2}`);
        } else if (type === 'focusedReflecting') {
            modText = mod.text.replace(/\+(\d+)/, (match, num) => `+${num * 4}`);
        }
        
        modDetail.textContent = modText;
        modDetail.className = `modifier-detail ${getModifierClass(modText)}`;
        
        modifierDetails.appendChild(modDetail);
    });
    
    combinationItem.appendChild(modifierDetails);
    
    return combinationItem;
}

// Filter functions removed - no longer needed for amulet-specific modifiers

