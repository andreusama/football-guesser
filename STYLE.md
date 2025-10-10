# Football Guesser - Style Guide

## Color Palette

### Primary Colors
- **Pitch Green (Dark)**: `#1a3a2e` - Main background, dark overlay
- **Grass Green**: `#2d5a3d` - Secondary backgrounds, button overlays
- **Fresh Lime**: `#4dd21d` - Highlights, success states, hover effects
- **Match Day Gold**: `#ffd166` - Achievements, secondary actions, focus states
- **Pure White**: `#ffffff` - Cards, text, clean surfaces

### Neutral Colors
- **Light Gray**: `#e0e0e0` - Input borders (default state)
- **Medium Gray**: `#bdbdbd` - Placeholder text
- **Dark Text**: `#1a3a2e` - Text on light backgrounds

### Gradient Colors (Feedback System)
- **Green Gradient**: `linear-gradient(135deg, #4dd21d, #2d5a3d)` - 10 points (Exact score)
- **Cyan Gradient**: `linear-gradient(135deg, #4dd21d, #00bcd4)` - 7 points (Goal difference)
- **Gold Gradient**: `linear-gradient(135deg, #ffd166, #ff9800)` - 5 points (Correct result)
- **Orange Gradient**: `linear-gradient(135deg, #ff9800, #ff5722)` - 3 points (One score)
- **Red Gradient**: `linear-gradient(135deg, #ff5722, #d32f2f)` - 0 points (Wrong)

### Button Gradients
- **Primary Button (Green)**:
  ```css
  linear-gradient(135deg, rgba(45, 90, 61, 0.9), rgba(26, 58, 46, 0.9))
  ```
  - Border: `#4dd21d` (2px solid)
  - Hover Shadow: `rgba(77, 210, 29, 0.4)`

- **Secondary Button (Gold)**:
  ```css
  linear-gradient(135deg, #ffd166, #ff9800)
  ```
  - Hover Shadow: `rgba(255, 209, 102, 0.4)`

### Background Overlays
- **Main Background Overlay**: `rgba(26, 58, 46, 0.85)` - 85% opacity over grass texture
- **Card Shadow**: `rgba(0, 0, 0, 0.3)` - Heavy shadow for depth
- **Badge Shadow**: `rgba(0, 0, 0, 0.2)` - Drop shadow for badges

### Focus States
- **Input Focus Border**: `#ffd166` (Match Day Gold)
- **Input Focus Shadow**: `rgba(255, 209, 102, 0.2)` - 3px spread

---

**Design Philosophy**: Modern minimalist with football pitch theme using green, gold, and white as core colors.
