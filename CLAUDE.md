# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lightweight web application for finding Path of Exile amulet modifiers that boost active skill gem levels. The application helps players identify which amulet gem level modifiers will benefit their selected skill gems, including combinations and special amulet types.

## Architecture

### Core Components
- **Frontend**: Vanilla JavaScript web application with HTML/CSS
- **Data Layer**: Static JSON file (`gems_cleaned.json`) containing active skill gems (updated via utility script)
- **Search System**: Client-side autocomplete with real-time filtering
- **Modifier Engine**: Tag-based matching system for amulet prefix modifiers

### Key Files
- `index.html`: Main application structure
- `script.js`: Core application logic and search functionality
- `styles.css`: UI styling and responsive design
- `data/gems_cleaned.json`: Gem database with name and tag arrays (updated via script)
- `data/current_amulet_modifiers.json`: Current amulet gem level modifiers data
- `scripts/update-gems.js`: Data update utility script for fetching latest gem data
- `scripts/fetch-modifiers.js`: Script for fetching modifier data from PoE Wiki API
- `images/focused_amulet.webp`: Focused Amulet icon for UI
- `images/reflecting_mist.webp`: Reflecting Mist icon for UI
- `README-UPDATE-SCRIPT.md`: Documentation for the update script

### Data Model
```javascript
{
  "total_count": 500,
  "skill_gems": [
    {
      "name": "Gem Name",
      "tags": ["Tag1", "Tag2", "Damage Type", ...]
    }
  ],
  "last_updated": "2025-07-16T14:47:23.511Z",
  "source": "PoE Wiki API"
}
```

## Development Commands

### Local Development
```bash
# Start local web server
python3 -m http.server 8000

# Access application
# Open http://localhost:8000 in browser
```

### Data Updates
```bash
# Update gem data from PoE Wiki API
cd scripts
node update-gems.js
```

### Testing
- No automated test suite currently exists
- Manual testing through browser console

## Key Functionality

### Search System (`script.js:53-78`)
- Filters only active skill gems (excludes support gems)
- Real-time autocomplete with 10-result limit
- Prioritizes exact matches over partial matches

### Modifier Generation and Combinations
- Matches gems to amulet modifiers based on damage type tags
- Supported damage types: Lightning, Cold, Physical, Fire, Chaos
- Shows explicit amulet modifiers (+1 to Level of all X Skill Gems)
- Maximum of 2 modifiers per amulet
- Four amulet categories: Regular, Focused Amulet (2x), Reflecting Mist (2x), Focused + Reflecting Mist (4x)
- Level-based grouping with combination generation

### Path of Exile Amulet Modifier System
- Amulets can have up to 2 gem level modifiers (both prefixes)
- Maximum base level boost: +2 levels (from 2 different modifiers)
- Generic modifier: "+1 to Level of all Skill Gems" (affects all gems)
- Specific modifiers: "+1 to Level of all [Type] Skill Gems" (damage type specific)
- Special amulets can double modifier effects (Focused Amulet, Reflecting Mist)

### Data Filtering
- Active skill gems: Searchable gems (support gems excluded)
- Damage type tags determine available modifiers
- Data updated via `update-gems.js` utility script

## Important Implementation Details

### Tag-Based Matching
The application uses a strict tag-based system where gems must have specific damage type tags (`Lightning`, `Cold`, `Physical`, `Fire`, `Chaos`) to match with corresponding amulet prefix modifiers.

### No Build System
This is a static web application with no build process, bundling, or dependencies. All code is vanilla JavaScript/HTML/CSS.

### Export Functionality
- Copy to clipboard using `navigator.clipboard.writeText()`
- Export as text file using Blob API and download links
- Results formatted for Path of Exile trading/planning

## Deployment

### GitHub Pages
The application is designed for GitHub Pages deployment:
1. Push to main branch
2. Enable Pages in repository settings
3. Deploy from root directory

### Local Hosting
Requires local web server due to CORS restrictions on JSON file loading.