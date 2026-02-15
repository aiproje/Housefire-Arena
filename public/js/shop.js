// Housefire Arena - Shop Module
// Magaza ve ekonomi sistemi

class Shop {
    constructor() {
        this.items = SHOP_ITEMS;
        this.isOpen = false;
        this.onPurchase = null;
    }
    
    // Magaza ac/kapa
    toggle() {
        this.isOpen = !this.isOpen;
        return this.isOpen;
    }
    
    // Satin alma islemi
    buy(itemId, player) {
        const item = this.items[itemId];
        
        if (!item) {
            return { success: false, message: 'Item not found' };
        }
        
        // Para kontrolu
        if (player.money < item.price) {
            return { success: false, message: i18n.t('shop.noMoney') };
        }
        
        // Efekti uygula
        let result = this.applyEffect(item, player);
        
        if (result.success) {
            // Parayi dus
            player.money -= item.price;
            
            // Callback
            if (this.onPurchase) {
                this.onPurchase(itemId, item);
            }
            
            return { 
                success: true, 
                message: i18n.t('shop.purchased', { name: i18n.t(item.nameKey) })
            };
        }
        
        return result;
    }
    
    // Efekt uygula
    applyEffect(item, player) {
        switch (item.effect) {
            case 'health':
                // Can zaten full mu?
                if (player.health >= player.maxHealth) {
                    return { success: false, message: 'Health is full' };
                }
                player.heal(item.value);
                return { success: true };
                
            case 'armor':
                // Kask zaten var mi?
                if (player.helmet) {
                    return { success: false, message: 'Already have helmet' };
                }
                player.helmet = true;
                return { success: true };
                
            case 'grenade':
                player.grenades += item.value;
                return { success: true };
                
            case 'ammo':
                // Silah var mi?
                if (!player.weapons.includes(item.weapon)) {
                    return { success: false, message: 'Weapon not owned' };
                }
                player.addAmmo(item.weapon, item.value);
                return { success: true };
                
            case 'weapon':
                // Silah zaten var mi?
                if (player.weapons.includes(item.weapon)) {
                    return { success: false, message: 'Weapon already owned' };
                }
                player.addWeapon(item.weapon);
                return { success: true };
                
            default:
                return { success: false, message: 'Unknown effect' };
        }
    }
    
    // Satin alinabilir mi?
    canBuy(itemId, player) {
        const item = this.items[itemId];
        if (!item) return false;
        
        // Para kontrolu
        if (player.money < item.price) return false;
        
        // Ozel kontroller
        switch (item.effect) {
            case 'health':
                return player.health < player.maxHealth;
            case 'armor':
                return !player.helmet;
            case 'weapon':
                return !player.weapons.includes(item.weapon);
            default:
                return true;
        }
    }
    
    // Fiyat getir
    getPrice(itemId) {
        const item = this.items[itemId];
        return item ? item.price : 0;
    }
    
    // Item bilgisi getir
    getItem(itemId) {
        return this.items[itemId] || null;
    }
    
    // Tum itemleri getir
    getAllItems() {
        return Object.entries(this.items).map(([id, item]) => ({
            id,
            ...item
        }));
    }
    
    // Kategoriye gore getir
    getItemsByCategory(category) {
        return this.getAllItems().filter(item => {
            if (category === 'weapons') {
                return item.effect === 'weapon';
            }
            if (category === 'consumables') {
                return ['health', 'armor', 'grenade'].includes(item.effect);
            }
            if (category === 'ammo') {
                return item.effect === 'ammo';
            }
            return true;
        });
    }
    
    // Callback set et
    setOnPurchase(callback) {
        this.onPurchase = callback;
    }
}

// Global ornek
const shop = new Shop();