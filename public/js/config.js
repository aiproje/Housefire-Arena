// Housefire Arena - Configuration Module
// Oyun sabitleri ve ayarlar

const CONFIG = {
    // Oyuncu ayarlari
    PLAYER_SPEED: 8.0,
    PLAYER_RUN_SPEED: 12.0,
    PLAYER_HEIGHT: 1.8,
    PLAYER_RADIUS: 0.4,
    
    // Kamera ayarlari
    CAMERA_HEIGHT: 18,
    CAMERA_DISTANCE: 12,
    CAMERA_ANGLE: 45, // derece
    
    // Bot ayarlari
    BOT_COUNT: 8,
    BOT_SPEED: 8.0,
    BOT_RUN_SPEED: 12.0,
    BOT_HEIGHT: 1.8,
    BOT_RADIUS: 0.4,
    BOT_RESPAWN_TIME: 3000, // ms
    BOT_VIEW_RANGE: 35,
    BOT_ATTACK_RANGE: 25,
    BOT_ACCURACY: 0.5,
    
    // Oyun ayarlari
    GAME_TIME: 300, // saniye
    DARK_MODE_INTERVAL: 30, // saniye
    RESPAWN_TIME: 3, // saniye
    
    // Harita ayarlari
    MAP_SIZE: 40,
    WALL_HEIGHT: 3,
    WALL_THICKNESS: 0.3,
    DOOR_WIDTH: 2,
    
    // Ekonomi
    STARTING_MONEY: 0,
    HIT_REWARD: 10,
    KILL_REWARD: 100,
    WIN_REWARD: 500,
    
    // Performans
    MAX_FOOTPRINTS: 100,
    MAX_BULLETS: 50,
    FOOTPRINT_LIFETIME: 600, // frame
};

// Silah tanimlari (bicak kaldirildi)
const WEAPONS = {
    pistol: {
        id: 'pistol',
        nameKey: 'weapons.pistol',
        damage: 25,
        fireRate: 500, // ms
        range: 30,
        ammo: Infinity,
        maxAmmo: Infinity,
        price: 0,
        color: 0xffff00,
        recoil: 0.1,
        spread: 0.02,
        automatic: false,
        sound: 'pistol',
        animation: 'single'
    },
    shotgun: {
        id: 'shotgun',
        nameKey: 'weapons.shotgun',
        damage: 80,
        fireRate: 2000,
        range: 15,
        ammo: 8,
        maxAmmo: 8,
        price: 500,
        color: 0xff8800,
        recoil: 0.4,
        spread: 0.15,
        automatic: false,
        sound: 'shotgun',
        animation: 'pump',
        pellets: 8
    },
    sniper: {
        id: 'sniper',
        nameKey: 'weapons.sniper',
        damage: 150,
        fireRate: 3333,
        range: 60,
        ammo: 5,
        maxAmmo: 5,
        price: 1000,
        color: 0x00ff00,
        recoil: 0.6,
        spread: 0,
        automatic: false,
        sound: 'sniper',
        animation: 'bolt'
    },
    rifle: {
        id: 'rifle',
        nameKey: 'weapons.rifle',
        damage: 35,
        fireRate: 200,
        range: 40,
        ammo: 30,
        maxAmmo: 30,
        price: 1500,
        color: 0x00ffff,
        recoil: 0.08,
        spread: 0.03,
        automatic: true,
        sound: 'rifle',
        animation: 'auto'
    },
    stick: {
        id: 'stick',
        nameKey: 'weapons.stick',
        damage: 40,
        fireRate: 1250,
        range: 2.5,
        ammo: Infinity,
        maxAmmo: Infinity,
        price: 0,
        color: 0x8b4513,
        recoil: 0,
        spread: 0,
        automatic: false,
        sound: 'melee',
        animation: 'swing',
        isMelee: true
    }
};

// Magaza urunleri
const SHOP_ITEMS = {
    health50: {
        id: 'health50',
        nameKey: 'shop.health50',
        price: 200,
        icon: 'heart',
        effect: 'health',
        value: 50
    },
    health100: {
        id: 'health100',
        nameKey: 'shop.health100',
        price: 350,
        icon: 'heart-full',
        effect: 'health',
        value: 100
    },
    helmet: {
        id: 'helmet',
        nameKey: 'shop.helmet',
        price: 300,
        icon: 'helmet',
        effect: 'armor',
        value: 20
    },
    grenade: {
        id: 'grenade',
        nameKey: 'shop.grenade',
        price: 150,
        icon: 'grenade',
        effect: 'grenade',
        value: 1
    },
    ammo_shotgun: {
        id: 'ammo_shotgun',
        nameKey: 'shop.ammoShotgun',
        price: 100,
        icon: 'ammo',
        effect: 'ammo',
        weapon: 'shotgun',
        value: 8
    },
    ammo_sniper: {
        id: 'ammo_sniper',
        nameKey: 'shop.ammoSniper',
        price: 150,
        icon: 'ammo',
        effect: 'ammo',
        weapon: 'sniper',
        value: 5
    },
    ammo_rifle: {
        id: 'ammo_rifle',
        nameKey: 'shop.ammoRifle',
        price: 200,
        icon: 'ammo',
        effect: 'ammo',
        weapon: 'rifle',
        value: 30
    },
    weapon_shotgun: {
        id: 'weapon_shotgun',
        nameKey: 'shop.weaponShotgun',
        price: 500,
        icon: 'shotgun',
        effect: 'weapon',
        weapon: 'shotgun'
    },
    weapon_sniper: {
        id: 'weapon_sniper',
        nameKey: 'shop.weaponSniper',
        price: 1000,
        icon: 'sniper',
        effect: 'weapon',
        weapon: 'sniper'
    },
    weapon_rifle: {
        id: 'weapon_rifle',
        nameKey: 'shop.weaponRifle',
        price: 1500,
        icon: 'rifle',
        effect: 'weapon',
        weapon: 'rifle'
    }
};

// Oda duzeni
const ROOM_LAYOUT = [
    { x: -10, z: -10, w: 8, h: 8, name: 'bedroom1', doors: ['south', 'east'] },
    { x: 2, z: -10, w: 8, h: 8, name: 'bedroom2', doors: ['south', 'west'] },
    { x: -10, z: 2, w: 8, h: 8, name: 'living', doors: ['north', 'east', 'south'] },
    { x: 2, z: 2, w: 8, h: 8, name: 'kitchen', doors: ['north', 'west', 'south'] },
    { x: -10, z: 10, w: 8, h: 6, name: 'bathroom', doors: ['north'] },
    { x: 2, z: 10, w: 8, h: 6, name: 'garage', doors: ['north'] }
];

// Spawn noktalari - daha fazla nokta
const SPAWN_POINTS = [
    { x: -15, z: -15 },
    { x: 15, z: -15 },
    { x: -15, z: 15 },
    { x: 15, z: 15 },
    { x: 0, z: -15 },
    { x: 0, z: 15 },
    { x: -8, z: 0 },
    { x: 8, z: 0 },
    { x: -12, z: -8 },
    { x: 12, z: -8 },
    { x: -12, z: 8 },
    { x: 12, z: 8 },
    { x: 0, z: 0 },
    { x: -5, z: -5 },
    { x: 5, z: -5 },
    { x: -5, z: 5 },
    { x: 5, z: 5 }
];

// Bot renkleri - her bot farklı renkte
const BOT_COLORS = [
    0xff0000, // Kırmızı
    0x00ff00, // Yeşil
    0x0000ff, // Mavi
    0xffff00, // Sarı
    0xff00ff, // Mor
    0x00ffff, // Cyan
    0xff8800, // Turuncu
    0xff0088, // Pembe
    0x8800ff, // Eflatun
    0x00ff88, // Açık yeşil
    0x0088ff, // Açık mavi
    0xffcc00  // Altın sarısı
];

// Export (ES6 modul sistemi)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, WEAPONS, SHOP_ITEMS, ROOM_LAYOUT, SPAWN_POINTS, BOT_COLORS };
}