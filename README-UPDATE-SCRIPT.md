# PoE Amulet Gem Level Finder - Data Update Utility

## Overview
This utility script fetches the latest skill gem data from the PoE Wiki API and updates the `gems_cleaned.json` file used by the web application.

## Usage

### Prerequisites
- Node.js installed on your system
- Internet connection to access PoE Wiki API

### Running the Script
```bash
# Make the script executable (Linux/Mac)
chmod +x update-gems.js

# Run the script
cd scripts
node update-gems.js
```

### What it does
1. **Queries PoE Wiki API** for skill gem data
2. **Transforms data** to match the application's JSON structure
3. **Filters out support gems** (keeps only active skill gems)
4. **Sorts gems alphabetically** by name
5. **Saves updated data** to `data/gems_cleaned.json`

## Current Status ⚠️

The script successfully fetches ~500 gems from the PoE Wiki API, but there's a **tag structure issue**:

- **API returns**: Generic web tags like `["gem", "default"]`
- **App needs**: Specific damage type tags like `["Fire", "Lightning", "Physical", "Cold", "Chaos"]`

## Next Steps

To fully integrate the API data, we need to:

1. **Research alternative API fields** that contain actual skill gem tags
2. **Try different PoE Wiki tables** that might have better tag data
3. **Consider hybrid approach**: Use API for gem names, maintain manual tag mapping
4. **Investigate skill_gems table** vs items table for better tag information

## File Structure

```
├── update-gems.js          # Main update script
├── gems_cleaned.json       # Output file (used by web app)
├── gems.json              # Original/backup data
└── README-UPDATE-SCRIPT.md # This file
```

## Manual Backup

The original `gems.json` file is preserved as a backup in case the API approach needs refinement.

## For Developers

The script includes:
- Multiple query fallback strategies
- Colored console output for better UX
- Detailed logging of the update process
- Error handling for API failures

When the tag structure is resolved, simply run the script periodically to keep gem data up-to-date!