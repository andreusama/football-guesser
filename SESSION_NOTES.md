# Session Notes - October 2025

## Major Changes Implemented

### 1. Color Palette & Styling (STYLE.md)
- Created separate STYLE.md file for color palette documentation
- **Primary Colors**:
  - Pitch Green (Dark): `#1a3a2e` - Main background, dark overlay
  - Grass Green: `#2d5a3d` - Secondary backgrounds
  - Fresh Lime: `#4dd21d` - Highlights, success states
  - Match Day Gold: `#ffd166` - Achievements, secondary actions
  - Pure White: `#ffffff` - Cards, text
- **Feedback Gradients** (simplified to 3 states):
  - Perfect (10pts): Green gradient `linear-gradient(135deg, #4dd21d, #2d5a3d)`
  - Middle ground (7/5/3pts): Gold gradient `linear-gradient(135deg, #ff9800, #ffd166)`
  - Wrong (0pts): Dark green `linear-gradient(135deg, #1a3a2e, #0d1f17)`
- Applied grass.jpg texture to green buttons only
- Gold buttons use solid gradient (no texture)

### 2. Typography
- **Cursed Timer font** (`CursedTimerUlil-Aznm.ttf`) applied ONLY to:
  - Score input fields
  - Actual score display (result)
- Rest of app uses default Segoe UI

### 3. Result Panel Transformation (In-Place Design)
**Problem**: Separate result section appeared below, causing layout shift
**Solution**: Transform guess panel in-place
- Heading text changes: "Guess the final score:" → "Your guessing was:"
- Inputs become read-only (grayed out)
- Result elements use `visibility: hidden` (not `display: none`) to reserve space
- Button transforms: Green "Submit Guess" → Gold "Next Round"
- Result elements moved outside `.guess-section` as siblings for proper vertical flow

### 4. Layout Stability Fixes
- **Space reservation**: Result message and actual score always take up space (invisible when hidden)
- **Button sizing**: Both states same size with `width: 100%; max-width: 300px`
- **Border consistency**: Both buttons have 2px border (transparent on gold, lime on green)
- **Removed mobile override**: Deleted conflicting `.btn-secondary` padding/font-size in mobile media query
- **Spacing reduction**: Changed margins from 20px to 12px for tighter layout

### 5. Debug Mode
- Press `D` to toggle debug panel
- Number keys 1-5 to preview screens with placeholder data
- Updated for new in-place transformation structure

### 6. Champions League Addition
**Competition Code**: `CL` (Football-Data.org)
**League ID**: `4480` (TheSportsDB)
**Badge**: Local file `UEFA_Champions_League.svg.png` (not fetched from API)
**Position**: First in league selection grid
**Icon**: 🏆
**Special handling**: `getLeagueEmblem()` returns local file path for Champions League

### 7. Feedback Messages
- "Correct result" → "Correct winning side" (clearer terminology)
- Shortened format: "pts" instead of "points"
- All middle-ground scores use same gold gradient

## Important Technical Decisions

### Why In-Place Transformation?
- Avoids layout shift when showing results
- Badges stay in exact same position
- Cleaner UX - single panel state change

### Why visibility:hidden instead of display:none?
- Reserves space for result elements
- Prevents container size changes
- Maintains badge positions

### Why Local Champions League Badge?
- TheSportsDB badge not displaying correctly
- Local file ensures consistent quality
- Same pattern could be used for other problematic badges

### Why Grass Texture Only on Green Buttons?
- Gold gradient looks cleaner without texture
- Green buttons mimic football pitch feel
- Maintains visual distinction between button types

## File Structure
```
/public
  - game.js (main game logic)
  - index.html (structure with debug mode)
  - style.css (football pitch theme)
  - grass.jpg (background texture)
  - UEFA_Champions_League.svg.png (local badge)
  /fonts
    - CursedTimerUlil-Aznm.ttf (score display font)
/StylePNG (reference images)
STYLE.md (color palette documentation - isolated from logic)
CLAUDE.md (technical documentation)
```

## Configuration Arrays (game.js)
All 6 leagues need entries in:
1. `LEAGUE_FLAGS` (emoji)
2. `COMPETITION_CODES` (Football-Data.org API codes)
3. `LEAGUE_IDS` (TheSportsDB API IDs)
4. HTML league cards with unique badge IDs
5. Match count display elements
6. Badge loading map

## CSS Classes to Remember
- `.invisible` - visibility:hidden (reserves space)
- `.hidden` - display:none (removes from flow)
- `.btn-primary` - Green grass texture button
- `.btn-secondary` - Gold gradient button
- `.points-earned.excellent/very-good/good/okay/poor` - Feedback gradients
- `.actual-score-inline` - In-flow result display

## Git Commits Made
1. "Apply football pitch color theme and add debug mode"
2. "Transform guess panel to result display in-place"
3. "Fix layout stability and button sizing issues"

## Next Session Priorities
- Consider if other league badges need local files
- Monitor Champions League data loading (125+ matches expected)
- Potential: Add more competitions (Europa League, Conference League?)
- Potential: Refine color palette if bright lime green feels too harsh
