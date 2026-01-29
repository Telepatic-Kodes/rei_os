# AIAIAI OS - Modern Luxury Design System

## Color Palette

### Primary Colors
```
Navy Base:      #0a1428  - Deep, sophisticated, command center feel
Navy Secondary: #1a2646  - Slightly lighter, used for contrast
Navy Tertiary:  #252f4a  - Darkest accent areas
```

### Accent Colors
```
Gold:           #d4af37  - Premium, luxury, high-value (primary CTA)
Gold Light:     rgba(212, 175, 55, 0.15)  - Subtle backgrounds
Gold Glow:      0 0 20px rgba(212, 175, 55, 0.2)  - Hover effects

Emerald:        #2d9d78  - Trust, growth, success
Emerald Light:  rgba(45, 157, 120, 0.15)  - Subtle backgrounds
Emerald Glow:   0 0 20px rgba(45, 157, 120, 0.2)  - Hover effects

Steel Blue:     #4a9eff  - Executive, information, secondary accent
Primary Accent: Linear gradient(135deg, #d4af37 0%, #4a9eff 100%)
```

### Semantic Colors
```
Success:    #2d9d78  (Emerald)
Warning:    #f4a942  (Gold variant)
Error:      #e85d4d  (Coral red)
Info:       #6c9eff  (Steel blue)
```

---

## Typography System

### Display Font
```
Font:           Georgia / Crimson Text (Serif)
Usage:          H1, H2, H3, Major headings
Qualities:      Elegant, executive, refined
Weight:         Regular (400), Bold (700)
```

### Body Font
```
Font:           System fonts (-apple-system, Segoe UI, etc.)
Usage:          Body text, labels, descriptions
Qualities:      Clean, efficient, readable
Weight:         Regular (400), Medium (500), Bold (600)
```

### Font Sizes
```
Display (H1):   36px
Heading 1 (H2): 28px
Heading 2 (H3): 22px
Heading 3 (H4): 16px (bold)
Body:           15px
Small:          13px
Tiny:           11px
```

### Letter Spacing
```
Tight:   -0.5px  (Display fonts, luxury feel)
Normal:   0px    (Body text)
Wide:     1px    (Buttons, badges, uppercase labels)
```

---

## Components

### Card Component

**Structure:**
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

**Styling:**
- Background: `var(--bg-glass)` - Semi-transparent navy with blur
- Border: `1px solid var(--border-light)`
- Border Radius: `var(--radius-lg)` (16px)
- Box Shadow: `var(--shadow-md)` - Luxury depth
- Backdrop Filter: `blur(10px)` - Glass effect

**Animated Top Border:**
```
Position: Absolute top
Height: 3px
Gradient: Gold → Emerald → Blue
Animation: Shimmer 3s infinite
```

**Hover State:**
- Border becomes gold
- Box shadow increases
- Slight translate up (-2px)
- Smooth transition (200ms)

**Visual Example:**
```
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Animated gradient border
│                                 │
│  Premium Card Title             │  ← Georgia serif, emerald gradient
│  This is elegant card content   │
│  with refined typography        │
│                                 │
└─────────────────────────────────┘
        (subtle shadow below)
```

---

### Button Component

**Primary Button (Gold)**
```
Background:  Linear gradient(135deg, #d4af37 → #c99d33)
Color:       #0a1428 (navy text)
Text:        Uppercase, 500 weight, 1px letter-spacing
Padding:     8px 24px
Border:      1px solid rgba(212, 175, 55, 0.5)
Shadow:      var(--shadow-md)
```

**Hover State:**
```
Background:  Gradient brightens slightly
Shadow:      var(--shadow-lg) + gold glow
Transform:   translateY(-1px)
Transition:  200ms ease
```

**Secondary Button (Gold Outline)**
```
Background:  Transparent
Color:       Gold (#d4af37)
Border:      1px solid gold
Padding:     8px 24px
```

**Hover State:**
```
Background:  var(--accent-gold-light)
Shadow:      Gold glow effect
```

**Success Button (Emerald)**
```
Background:  Linear gradient(135deg, #2d9d78 → #25a86d)
Color:       White
Text:        Uppercase, bold
```

**Disabled State (All Buttons)**
```
Opacity:     0.5
Cursor:      not-allowed
No transform/shadow changes
```

---

### Modal Component

**Container:**
```
Background:  Linear gradient(135deg, #1a2646 → #0a1428)
Border:      1px solid var(--border-gold)
Border Radius: var(--radius-xl) (20px)
Box Shadow:  var(--shadow-xl) - Deep luxury
Backdrop:    blur(20px) + semi-transparent overlay
```

**Header:**
```
Background:  Linear gradient(90deg, rgba(#d4af37, 0.1), transparent)
Border-Bottom: 1px solid var(--border-gold)
Padding:     var(--space-lg) (24px)

Title:
  Font:      Georgia serif
  Gradient:  Gold → Blue
  Size:      28px (H2)
```

**Content:**
```
Padding:     24px
Color:       Lighter navy with refined text
```

**Footer:**
```
Border-Top:  1px solid var(--border-gold)
Display:     Flex, justify-end, gap 16px
Padding:     24px
Buttons:     Primary (gold) + Secondary (outline)
```

---

### Input Component

**Default State:**
```
Background:  rgba(26, 38, 70, 0.8) - Semi-transparent navy
Border:      1px solid var(--border) - Dark gray
Color:       var(--text-primary) - Light text
Padding:     8px 16px
Border Radius: var(--radius-md) (12px)
Font Size:   13px
```

**Focus State:**
```
Outline:     None
Border:      Gold (#d4af37)
Background:  rgba(26, 38, 70, 1) - More opaque
Box Shadow:  0 0 0 3px var(--accent-gold-light)
Transition:  200ms ease
```

**Placeholder:**
```
Color:       var(--text-tertiary) - Muted gray
```

---

### Table Component

**Header Row:**
```
Background:  Linear gradient(90deg, rgba(#d4af37, 0.1), rgba(#2d9d78, 0.1))
Border-Bottom: 2px solid var(--border-gold)
Text Color:  Gold (#d4af37)
Font Size:   12px
Font Weight: 600
Text Transform: Uppercase
Letter Spacing: 1px
```

**Body Rows:**
```
Background:  var(--bg-glass)
Border-Bottom: 1px solid var(--border-light)
Padding:     16px
```

**Row Hover:**
```
Background:  rgba(212, 175, 55, 0.05) - Subtle gold tint
Transition:  200ms ease
```

---

### Progress Bar Component

**Container:**
```
Background:  rgba(26, 38, 70, 0.8)
Border:      1px solid var(--border-light)
Border Radius: var(--radius-full) (999px)
Height:      8px
```

**Fill:**
```
Background:  Linear gradient(90deg, #d4af37 → #2d9d78)
Height:      100%
Border Radius: 999px
Box Shadow:  0 0 10px rgba(212, 175, 55, 0.5) - Gold glow
Transition:  300ms ease (smooth animation)
```

---

### Badge Component

**Container:**
```
Display:     Inline-flex
Padding:     4px 8px
Border Radius: var(--radius-full) (999px)
Background:  var(--bg-tertiary)
Border:      1px solid gold
Font Size:   11px
Font Weight: 600
Text Transform: Uppercase
Letter Spacing: 1px
```

**Color Variants:**
- Default: Gold text + border, navy background
- Success: Emerald text + border, emerald-light background
- Warning: Orange text + border, orange-light background
- Error: Red text + border, red-light background

---

### Navigation Component

**Container:**
```
Background:  Linear gradient(180deg, rgba(#0a1428, 0.9), rgba(#1a2646, 0.95))
Border:      1px solid var(--border-gold)
Backdrop:    blur(20px)
```

**Navigation Item:**
```
Padding:     16px
Border Radius: var(--radius-md) (12px)
Color:       var(--text-secondary) - Muted
Transition:  200ms ease
```

**Hover State:**
```
Color:       Gold (#d4af37)
Background:  var(--accent-gold-light)
```

**Active State:**
```
Color:       Gold
Background:  var(--accent-gold-light)
Left Border: 3px solid gold (vertical bar)
```

---

### Sidebar Component

**Container:**
```
Background:  Linear gradient(180deg, #0a1428, #1a2646)
Border-Right: 1px solid var(--border-gold)
```

**Sidebar Item:**
```
Padding:     16px
Border Radius: var(--radius-md)
Color:       var(--text-secondary)
Transition:  200ms ease
Display:     Flex, align-center, gap 16px
```

**Active Item:**
```
Background:  Linear gradient(90deg, var(--accent-gold-light), transparent)
Color:       Gold
Border-Right: 3px solid gold
```

---

## Spacing System

```
XS:   4px
SM:   8px
MD:   16px  (standard)
LG:   24px  (generous)
XL:   32px  (section separation)
2XL:  48px  (major separation)
3XL:  64px  (page sections)
```

---

## Border Radius System

```
SM:   8px   (small elements)
MD:   12px  (buttons, inputs)
LG:   16px  (cards)
XL:   20px  (modals)
FULL: 999px (pills, badges)
```

---

## Shadow System

### Premium Luxury Shadows
```
SM:   0 2px 8px rgba(0, 0, 0, 0.3)
MD:   0 8px 24px rgba(0, 0, 0, 0.4)
LG:   0 16px 48px rgba(0, 0, 0, 0.5)
XL:   0 32px 80px rgba(0, 0, 0, 0.6)
```

### Colored Glows
```
Gold:    0 0 20px rgba(212, 175, 55, 0.2)
Emerald: 0 0 20px rgba(45, 157, 120, 0.2)
Blue:    0 0 20px rgba(74, 158, 255, 0.2)
```

---

## Animation System

### Transitions
```
Fast:  0.15s ease
Base:  0.2s ease
Slow:  0.3s ease
```

### Keyframe Animations

**Shimmer (Gradient borders)**
```
0%:    background-position: 0% 0%
50%:   background-position: 100% 0%
100%:  background-position: 0% 0%
Duration: 3s infinite
```

**Fade In Up (Card load)**
```
From: opacity 0, transform translateY(20px)
To:   opacity 1, transform translateY(0)
Duration: 500ms ease-out
```

**Slide In (Sidebar items)**
```
From: opacity 0, transform translateX(-10px)
To:   opacity 1, transform translateX(0)
Duration: 300ms ease-out
```

---

## Responsive Breakpoints

```
Mobile:  ≤ 768px
Tablet:  769px - 1024px
Desktop: ≥ 1025px
```

### Mobile Adjustments
- Font sizes reduce by 10-15%
- Spacing reduces by 20-30%
- Cards stack vertically
- Buttons become 44px minimum height
- Modals go fullscreen

---

## Accessibility

### Contrast Ratios
- Gold on navy: 8.5:1 (AAA)
- Emerald on navy: 6.8:1 (AA)
- White on navy: 13:1 (AAA)

### Focus States
- All interactive elements have visible focus
- Keyboard navigation works smoothly
- Color not sole differentiator

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** Backdrop filter fallback to `background: rgba()` for unsupported browsers

---

*Design System v1.0 - AIAIAI OS Modern Luxury Aesthetic*
*Last updated: 2026-01-29*
