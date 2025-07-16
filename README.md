# PoE Gem Level Finder

A lightweight web application to find Path of Exile amulet prefix modifiers that boost active skill gem levels.

## Features

- **Active Skill Gem Search**: Search through 512 active skill gems with autocomplete (support gems excluded)
- **Amulet Prefix Modifiers**: Shows only explicit amulet prefix modifiers for damage types
- **Damage Type Matching**: Automatically matches gems to available Lightning, Cold, Physical, Fire, and Chaos modifiers
- **Export**: Copy to clipboard or export as text file
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Select an Active Skill Gem**: Type in the search box to find any active skill gem
2. **View Results**: All relevant amulet prefix modifiers will be displayed
3. **Export**: Copy the results to clipboard or download as a text file

## Technical Details

### Files Structure
```
/
├── index.html          # Main application
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── gems_cleaned.json   # Gem database (719 gems)
└── README.md          # This file
```

### Data Source
- **Total Gems**: 719 (512 active skill gems + 207 support gems)
- **Searchable**: Only 512 active skill gems (support gems excluded from search)
- **Source**: Path of Exile community data
- **Format**: JSON with gem names and tag arrays

### Deployment Options

#### Local Development
1. Clone/download the repository
2. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

#### GitHub Pages Deployment
1. Fork this repository
2. Go to repository Settings > Pages
3. Set source to "Deploy from a branch"
4. Select `main` branch and `/ (root)` folder
5. Your site will be available at `https://yourusername.github.io/PoePlusGemLevelFinder/`

## How It Works

1. **Gem Selection**: User types to search through 512 active skill gems
2. **Tag Analysis**: The app analyzes the selected gem's damage type tags (Fire, Cold, Lightning, Physical, Chaos)
3. **Mod Generation**: Shows only explicit amulet prefix modifiers that match the gem's damage types:
   - +1 to Level of all Lightning Skill Gems
   - +1 to Level of all Cold Skill Gems
   - +1 to Level of all Physical Skill Gems
   - +1 to Level of all Fire Skill Gems
   - +1 to Level of all Chaos Skill Gems
4. **Results Display**: Shows matching modifiers or "No amulet prefix modifiers available"

## Example Usage

**Selected Gem**: Fireball
- **Tags**: Spell, Fire, AoE, Projectile
- **Available Amulet Modifiers**:
  - +1 to Level of all Fire Skill Gems

**Selected Gem**: Lightning Strike
- **Tags**: Attack, Lightning, Projectile, Melee
- **Available Amulet Modifiers**:
  - +1 to Level of all Lightning Skill Gems

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

This project is for educational and community use. Path of Exile is a trademark of Grinding Gear Games.

## Contributing

Feel free to contribute improvements or report issues. The gem database can be updated by replacing `gems_cleaned.json` with newer data.