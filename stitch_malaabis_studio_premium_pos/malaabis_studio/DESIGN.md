---
name: Malaabis Studio
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#d0cecd'
  on-tertiary: '#313030'
  tertiary-container: '#b5b2b2'
  on-tertiary-container: '#454545'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  touch-target-min: 48px
  section-gap: 40px
---

## Brand & Style
This design system embodies the essence of a high-end Pakistani fashion atelier. The visual language is rooted in **Modern Minimalism** with a **Luxury Noir** aesthetic, designed to evoke feelings of exclusivity, heritage, and contemporary sophistication. 

The UI is mobile-first, prioritizing high-fashion photography and tactile interactions. It utilizes a deep, monochromatic foundation to allow the craftsmanship of the garments and the elegance of the gold accents to take center stage. The experience should feel like walking through a private boutique—hushed, curated, and premium.

## Colors
The palette is strictly curated to maintain a premium atmosphere. 

- **Pure Black (#000000):** Used for the primary canvas and deep backgrounds to provide an infinite sense of space.
- **Deep Charcoal (#121212):** Used for elevated surfaces, cards, and containers to create subtle depth without breaking the dark aesthetic.
- **Pure White (#FFFFFF):** Reserved for primary body text and high-priority icons to ensure maximum legibility and a crisp finish.
- **Elegant Gold (#D4AF37):** Used sparingly as an accent for call-to-actions, active states, and premium borders. 

Avoid mid-tone grays; maintain high contrast between the background and the content to reflect luxury editorial standards.

## Typography
The typography strategy relies on a classic serif/sans-serif pairing. 

**Playfair Display** serves as the display typeface, bringing a sense of traditional craftsmanship and editorial elegance. It should be used for product titles, collection names, and large hero statements.

**Inter** provides a functional, neutral counterpoint. It is used for all UI elements, descriptions, and data-heavy components to ensure clarity and modern utility. 

**Formatting Rules:**
- Use `label-caps` for category headers and small navigation elements to introduce a structured, architectural feel.
- Maintain generous line heights for body text to improve readability against the dark background.

## Layout & Spacing
The layout follows a **Fixed Grid** approach for mobile, with 24px side margins to create a "frame" around the content, reinforcing the premium boutique feel. 

- **Grid:** Use a 4-column grid for mobile and a 12-column grid for tablet/desktop.
- **Rhythm:** Spacing follows an 8px incremental scale.
- **Touch Targets:** All interactive elements (buttons, links, chips) must maintain a minimum hit area of 48x48px, adhering to Android accessibility standards.
- **White Space:** Be intentional with "Negative Space." Large gaps between sections (40px+) are encouraged to prevent the dark UI from feeling cramped.

## Elevation & Depth
In this dark theme, depth is communicated through **Tonal Layering** and **Soft Ambient Shadows** rather than heavy shadows.

- **Level 0 (Base):** Pure Black (#000000).
- **Level 1 (Cards/Surfaces):** Deep Charcoal (#121212).
- **Level 2 (Modals/Popovers):** Deep Charcoal (#1C1C1C) with a soft, diffused shadow (0px 8px 24px rgba(0,0,0,0.5)).
- **Accents:** Use a 0.5px border of Gold (#D4AF37) at 30% opacity to define premium elements without creating visual clutter.

Avoid traditional "glows" except on primary gold buttons to suggest a subtle metallic sheen.

## Shapes
The shape language is modern and approachable. While the brand is luxury, the use of rounded corners softens the high-contrast color palette.

- **Cards & Containers:** Use `rounded-xl` (1.5rem / 24px) to create the signature "modern card" look.
- **Buttons:** Use `rounded-lg` (1rem / 16px) for a sophisticated yet comfortable feel.
- **Inputs:** Use `rounded-md` (0.5rem / 8px) to maintain structural integrity.
- **Images:** All product imagery should follow the container's corner radius for a cohesive, integrated appearance.

## Components

### Buttons
- **Primary:** Gold background (#D4AF37) with Pure Black text. Heavy weight, uppercase Inter.
- **Secondary:** Outlined with a 1px Gold border. Text is Gold or White.
- **Ghost:** White text with no background, used for low-priority actions like "Cancel."

### Cards
- Background: Deep Charcoal (#121212).
- Radius: 24px.
- Padding: 16px or 24px depending on content density.
- Imagery: Full-bleed at the top with a subtle inner gradient overlay to ensure text legibility if placed over photos.

### Input Fields
- Style: Underlined or subtly boxed with #1C1C1C background.
- Active State: Border color shifts to Gold (#D4AF37).
- Label: Floating label using `label-caps` for a professional look.

### Chips & Tags
- Used for sizing (S, M, L, XL) and categories.
- Background: Black with a 1px Charcoal border.
- Selected State: Gold border and Gold text.

### Lists
- Clean dividers using #1C1C1C (1px).
- Large 24px padding on top and bottom to accommodate mobile thumb tap zones.