# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lightweight web application for finding Path of Exile amulet prefix modifiers that boost active skill gem levels. The application helps players identify which amulet modifiers will benefit their selected skill gems.

## Architecture

### Core Components
- **Frontend**: Vanilla JavaScript web application with HTML/CSS
- **Data Layer**: Static JSON file (`gems_cleaned.json`) containing 719 gems (512 active + 207 support)
- **Search System**: Client-side autocomplete with real-time filtering
- **Modifier Engine**: Tag-based matching system for amulet prefix modifiers

### Key Files
- `index.html`: Main application structure
- `script.js`: Core application logic and search functionality
- `styles.css`: UI styling and responsive design
- `gems_cleaned.json`: Gem database with name and tag arrays
- `test.html`: Testing interface

### Data Model
```javascript
{
  "total_count": 719,
  "skill_gems": [
    {
      "name": "Gem Name",
      "tags": ["Tag1", "Tag2", "Damage Type", ...]
    }
  ]
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

### Testing
- Use `test.html` for development testing
- No automated test suite currently exists
- Manual testing through browser console

## Key Functionality

### Search System (`script.js:53-78`)
- Filters only active skill gems (excludes support gems)
- Real-time autocomplete with 10-result limit
- Prioritizes exact matches over partial matches

### Modifier Generation (`script.js:128-159`)
- Matches gems to amulet prefix modifiers based on damage type tags
- Supported damage types: Lightning, Cold, Physical, Fire, Chaos
- Only shows explicit amulet prefix modifiers (+1 to Level of all X Skill Gems)

### Data Filtering
- Active skill gems: 512 searchable gems
- Support gems: 207 gems (excluded from search)
- Damage type tags determine available modifiers

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