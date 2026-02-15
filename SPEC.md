# Battle House 3D - Technical Specification

## Project Overview

**Project Name:** Battle House 3D  
**Type:** First-Person Shooter (FPS) / Battle Royale Style Game  
**Technology Stack:** 
- Frontend: Three.js (3D Rendering)
- Backend: Node.js with Express
- Real-time: Socket.IO for game state

---

## 1. Core Game Mechanics

### 1.1 Gameplay Loop
- Player spawns in a large house with multiple rooms
- Fight against AI bots (5-8 bots)
- Bots also fight each other
- Time limit: 5 minutes
- Most kills wins
- Auto-respawn on death (3 second delay)

### 1.2 Camera System
- **Type:** Top-down isometric (bird's eye with slight angle)
- **Angle:** 45-60 degrees from vertical
- **Height:** 15-20 units above ground
- **Follow:** Smooth follow on player character

---

## 2. Map & Environment

### 2.1 House Structure
- **Size:** 40x40 units ground floor
- **Rooms:** 6-8 rooms arranged strategically
- **Room Types:**
  - Living Room (main spawn area)
  - Kitchen
  - 2x Bedroom
  - Bathroom
  - Hallway
  - Garage

### 2.2 Walls & Collision
- Wall height: 3 units
- Wall thickness: 0.3 units
- All walls have collision detection

### 2.3 Lighting System
- **Normal Mode:** Ambient light + point lights in each room
- **Dark Mode:** All lights off except flashlights
- **Transition:** 3-second fade between modes
- **Flashlight:** Attached to all characters (player + bots)
- **Flashlight Range:** 15 units
- **Flashlight Angle:** 30 degrees cone

---

## 3. Character System

### 3.1 Player Character
- **Model:** Simple capsule/cylinder with distinct color (blue)
- **Height:** 1.8 units
- **Speed:** 5 units/second (walking), 8 units/second (running)
- **Collision Radius:** 0.5 units

### 3.2 Bot Characters
- **Model:** Capsule/cylinder with different colors (red)
- **Count:** 6 bots
- **AI Behavior:** 
  - Hunt player when visible
  - Fight other bots
  - Random patrol when no targets
  - Health-based retreat (below 30%)

### 3.3 Health System
- **Max Health:** 100 HP
- **Health Bar UI:** Bottom-left corner of screen
- **Bot Health Bar:** Above each bot (3D sprite)
- **Damage Indicators:** Screen flash red on hit

---

## 4. Weapon System

### 4.1 Available Weapons

| Weapon | Damage | Fire Rate | Range | Ammo | Price |
|--------|--------|-----------|-------|------|-------|
| Pistol | 25 | 2/sec | 30 | ∞ | Free |
| Shotgun | 80 | 0.5/sec | 15 | 8 | $500 |
| Sniper | 150 | 0.3/sec | 60 | 5 | $1000 |
| Assault Rifle | 35 | 5/sec | 40 | 30 | $1500 |
| Knife | 50 | 1/sec | 2 | ∞ | Free |
| Stick | 40 | 0.8/sec | 2.5 | ∞ | Free |

### 4.2 Secondary Weapons
- Always available: Knife, Stick
- Selected via number keys (1, 2)

### 4.3 Weapon Selection Screen
- Display all weapons with stats
- Preview model
- Confirm button

---

## 5. Combat System

### 5.1 Hit Detection
- Raycasting from camera
- Bullet trail visual
- Hit confirmation sound

### 5.2 Damage System
- Base damage from weapon
- Headshot: 2x damage
- Distance falloff: None (instant hit weapons)

### 5.3 Death & Respawn
- On death: Character falls, loot drops
- Respawn: 3-second delay
- Respawn location: Random safe room

---

## 6. Economy System

### 6.1 Money Earning
- Hit on enemy: $10
- Kill enemy: $100
- Win game: $500

### 6.2 Shop Items

| Item | Effect | Price |
|------|--------|-------|
| Health Pack | +50 HP | $200 |
| Full Heal | +100 HP | $350 |
| Helmet | -20% headshot damage | $300 |
| Grenade | Throws explosive | $150 |
| Ammo (Shotgun) | +8 shells | $100 |
| Ammo (Sniper) | +5 bullets | $150 |
| Ammo (Rifle) | +30 bullets | $200 |

### 6.3 Shop Access
- Press 'B' to open shop
- Click to buy
- Auto-apply to player

---

## 7. AI System

### 7.1 Bot Behavior States
1. **Idle:** Random movement within house
2. **Alert:** Heard something, investigating
3. **Combat:** Engaging target (player or other bot)
4. **Fleeing:** Health low, retreating

### 7.2 Bot Targeting Priority
1. Nearest visible enemy
2. If player hidden: attack other bots
3. Random patrol

### 7.3 Bot Accuracy
- Base: 40%
- Distance penalty: -5% per 10 units
- Movement penalty: -10% while moving

---

## 8. Visual Effects

### 8.1 Lighting Effects
- Room lights: Soft white point lights
- Flashlights: Cone-shaped spotlight
- Muzzle flash: Brief point light at gun

### 8.2 Hit Effects
- Blood particle burst
- Screen shake
- Hit marker (X) in center

### 8.3 Dark Mode Footprints
- Appear when lights off
- Last 10 seconds
- Different color for player (blue) vs bots (red)
- Fade out over time

### 8.4 Death Effects
- Ragdoll physics
- Fade out after 5 seconds
- Respawn countdown display

---

## 9. Audio System

### 9.1 Music
- **Lights On:** Upbeat action music
- **Lights Off:** Complete silence

### 9.2 Sound Effects
- Gunshot sounds (per weapon)
- Footsteps
- Hit sounds
- Death sounds
- Reload sounds
- Grenade explosion
- UI sounds (shop open, purchase)

### 9.3 Spatial Audio
- 3D positioned sounds
- Volume based on distance

---

## 10. UI Elements

### 10.1 HUD Layout
```
┌─────────────────────────────────────────────┐
│ [Health Bar]              [Timer: 4:32]    │
│                                              │
│                                              │
│                   [+]                       │
│                   (crosshair)                │
│                                              │
│ [Money: $450]              [Kills: 3]      │
│                                              │
│ ┌─────────┐                   ┌───────────┐ │
│ │ WEAPON  │                   │ MINIMAP   │ │
│ │ icon    │                   │ (small)   │ │
│ └─────────┘                   └───────────┘ │
└─────────────────────────────────────────────┘
```

### 10.2 Scoreboard
- Toggle with Tab
- Shows: Name, Kills, Deaths, Money
- Updates in real-time
- Sorted by kills

### 10.3 Weapon Selection
- Number keys 1-6
- Current weapon displayed

### 10.4 Shop UI
- Opens with B key
- Grid of items with prices
- Click to buy

---

## 11. Game Flow

### 11.1 Start Screen
- Game title
- "Start Game" button
- "Select Weapon" button

### 11.2 Weapon Selection
- Grid of weapons
- Stats display
- Confirm selection

### 11.3 Gameplay
- Spawn in random room
- Fight for 5 minutes
- Shop available anytime

### 11.4 End Game
- Show winner
- Display stats
- "Play Again" button

---

## 12. Technical Architecture

### 12.1 File Structure
```
/public
  /js
    game.js        # Main game logic
    player.js      # Player controller
    bot.js         # Bot AI
    weapons.js     # Weapon definitions
    shop.js        # Shop system
    ui.js          # UI management
  /css
    style.css     # UI styles
  /assets
    /sounds        # Audio files
    /models        # 3D models (procedural)
/server.js          # Express + Socket.io server
/package.json       # Dependencies
```

### 12.2 Key Classes
- `Game` - Main game controller
- `Player` - Player entity
- `Bot` - AI entity
- `Weapon` - Weapon data and behavior
- `Bullet` - Projectile
- `Room` - Map room
- `Shop` - Economy system

### 12.3 Performance Targets
- 60 FPS on modern hardware
- Max 10 entities with physics
- Efficient shadow mapping

---

## 13. Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Mouse | Look |
| Left Click | Shoot |
| 1-6 | Select Weapon |
| B | Open Shop |
| Tab | Scoreboard |
| Shift | Run |
| R | Reload |
| G | Throw Grenade |

---

## 14. Implementation Priority

1. Basic scene setup with house
2. Player movement and camera
3. Weapon firing and hit detection
4. Bot AI (basic)
5. Health and damage system
6. UI (health, ammo, score)
7. Shop system
8. Lighting dark mode
9. Footprints
10. Sound and music
11. Polish and optimization

---

*Document Version: 1.0*
*Last Updated: 2026-02-14*
