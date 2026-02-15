// Housefire Arena - UI Module
// Kullanici arayuzu yonetimi

class UIManager {
    constructor() {
        this.elements = {};
        this.cacheElements();
    }
    
    // Elementleri cache'le
    cacheElements() {
        // Menu
        this.elements.mainMenu = document.getElementById('mainMenu');
        this.elements.weaponSelect = document.getElementById('weaponSelect');
        this.elements.nameInput = document.getElementById('nameInput');
        this.elements.gameEnd = document.getElementById('gameEnd');
        
        // HUD
        this.elements.gameHUD = document.getElementById('gameHUD');
        this.elements.healthFill = document.getElementById('healthFill');
        this.elements.healthText = document.getElementById('healthText');
        this.elements.gameTimer = document.getElementById('gameTimer');
        this.elements.moneyValue = document.getElementById('moneyValue');
        this.elements.killsValue = document.getElementById('killsValue');
        this.elements.weaponName = document.getElementById('weaponName');
        this.elements.ammoDisplay = document.getElementById('ammoDisplay');
        
        // Overlays
        this.elements.respawnOverlay = document.getElementById('respawnOverlay');
        this.elements.respawnTimer = document.getElementById('respawnTimer');
        this.elements.darkModeIndicator = document.getElementById('darkModeIndicator');
        this.elements.hitMarker = document.getElementById('hitMarker');
        
        // Shop
        this.elements.shopUI = document.getElementById('shopUI');
        this.elements.shopMoney = document.getElementById('shopMoney');
        this.elements.shopGrid = document.getElementById('shopGrid');
        
        // Scoreboard
        this.elements.scoreboard = document.getElementById('scoreboard');
        this.elements.scoreBody = document.getElementById('scoreBody');
        
        // Game End
        this.elements.winnerName = document.getElementById('winnerName');
        this.elements.winnerKills = document.getElementById('winnerKills');
        this.elements.finalKills = document.getElementById('finalKills');
        this.elements.finalDeaths = document.getElementById('finalDeaths');
        this.elements.finalMoney = document.getElementById('finalMoney');
    }
    
    // Ekran goster/gizle
    showScreen(screenId) {
        // Tum ekranlari gizle
        ['mainMenu', 'weaponSelect', 'nameInput', 'gameEnd'].forEach(id => {
            if (this.elements[id]) {
                this.elements[id].classList.add('hidden');
            }
        });
        
        // Istekleneni goster
        if (this.elements[screenId]) {
            this.elements[screenId].classList.remove('hidden');
        }
    }
    
    // HUD goster/gizle
    showHUD(show) {
        if (this.elements.gameHUD) {
            this.elements.gameHUD.classList.toggle('hidden', !show);
        }
    }
    
    // Saglik barini guncelle
    updateHealthBar(health, maxHealth) {
        const percent = (health / maxHealth) * 100;
        if (this.elements.healthFill) {
            this.elements.healthFill.style.width = percent + '%';
            
            // Renk degistir
            if (percent > 50) {
                this.elements.healthFill.style.background = 'var(--success)';
            } else if (percent > 25) {
                this.elements.healthFill.style.background = 'var(--warning)';
            } else {
                this.elements.healthFill.style.background = 'var(--danger)';
            }
        }
        if (this.elements.healthText) {
            this.elements.healthText.textContent = `${Math.ceil(health)} / ${maxHealth}`;
        }
    }
    
    // Zamanlayici guncelle
    updateTimer(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (this.elements.gameTimer) {
            this.elements.gameTimer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            
            // Son 30 saniyede kirmizi
            if (seconds <= 30) {
                this.elements.gameTimer.style.color = 'var(--danger)';
            } else {
                this.elements.gameTimer.style.color = '';
            }
        }
    }
    
    // Para guncelle
    updateMoney(money) {
        if (this.elements.moneyValue) {
            this.elements.moneyValue.textContent = `$${money}`;
        }
    }
    
    // Oldurme sayisi guncelle
    updateKills(kills) {
        if (this.elements.killsValue) {
            this.elements.killsValue.textContent = kills;
        }
    }
    
    // Silah gosterimi guncelle
    updateWeaponDisplay(weapon, currentAmmo) {
        if (this.elements.weaponName) {
            this.elements.weaponName.textContent = i18n.t(weapon.nameKey);
        }
        if (this.elements.ammoDisplay) {
            const ammo = weapon.ammo === Infinity ? '8' : currentAmmo;
            this.elements.ammoDisplay.textContent = ammo;
        }
    }
    
    // Respawn overlay
    showRespawnOverlay(show, timer = 3) {
        if (this.elements.respawnOverlay) {
            this.elements.respawnOverlay.classList.toggle('hidden', !show);
        }
        if (show && this.elements.respawnTimer) {
            this.elements.respawnTimer.textContent = timer;
        }
    }
    
    // Dark mode indikatoru
    showDarkModeIndicator(show) {
        if (this.elements.darkModeIndicator) {
            this.elements.darkModeIndicator.classList.toggle('hidden', !show);
        }
    }
    
    // Vurus isareti
    showHitMarker() {
        if (this.elements.hitMarker) {
            this.elements.hitMarker.classList.remove('show');
            void this.elements.hitMarker.offsetWidth;
            this.elements.hitMarker.classList.add('show');
        }
    }
    
    // Magaza
    toggleShop(show, money = 0) {
        if (this.elements.shopUI) {
            this.elements.shopUI.classList.toggle('hidden', !show);
        }
        if (show && this.elements.shopMoney) {
            this.elements.shopMoney.textContent = `$${money}`;
        }
    }
    
    // Magaza icerigini olustur
    populateShop(player) {
        if (!this.elements.shopGrid) return;
        
        this.elements.shopGrid.innerHTML = '';
        
        Object.entries(SHOP_ITEMS).forEach(([id, item]) => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            
            // satin alinabilir mi?
            const canBuy = player.money >= item.price;
            if (!canBuy) {
                div.classList.add('disabled');
            }
            
            // Silah zaten var mi?
            if (item.effect === 'weapon' && player.weapons.includes(item.weapon)) {
                div.classList.add('owned');
            }
            
            div.innerHTML = `
                <span class="shop-item-icon">${this.getShopIcon(item.icon)}</span>
                <span class="shop-item-name" data-i18n="${item.nameKey}">${i18n.t(item.nameKey)}</span>
                <span class="shop-item-price">$${item.price}</span>
            `;
            
            div.addEventListener('click', () => {
                if (canBuy) {
                    this.onShopItemBuy(id, item);
                }
            });
            
            this.elements.shopGrid.appendChild(div);
        });
    }
    
    // Magaza ikonu
    getShopIcon(iconName) {
        const icons = {
            'heart': 'â¤ï¸',
            'heart-full': 'ð',
            'helmet': 'âï¸',
            'grenade': 'ð£',
            'ammo': 'â«',
            'shotgun': 'ð«',
            'sniper': 'ð¯',
            'rifle': 'ð«'
        };
        return icons[iconName] || 'ð';
    }
    
    // Satin alma callback
    onShopItemBuy(itemId, item) {
        // Oyun sinifindan handle edilecek
        if (this.shopBuyCallback) {
            this.shopBuyCallback(itemId, item);
        }
    }
    
    // Satin alma callback set
    setShopBuyCallback(callback) {
        this.shopBuyCallback = callback;
    }
    
    // Skor tablosu
    toggleScoreboard(show) {
        if (this.elements.scoreboard) {
            this.elements.scoreboard.classList.toggle('hidden', !show);
        }
    }
    
    // Skor tablosunu guncelle
    updateScoreboard(player, bots) {
        if (!this.elements.scoreBody) return;
        
        const scores = [
            { name: 'Player', kills: player.kills, deaths: player.deaths, money: player.money, isPlayer: true }
        ];
        
        bots.forEach((bot, i) => {
            scores.push({
                name: `Bot ${i + 1}`,
                kills: bot.kills,
                deaths: bot.deaths,
                money: 0,
                isPlayer: false
            });
        });
        
        // Oldurmeye gore sirala
        scores.sort((a, b) => b.kills - a.kills);
        
        this.elements.scoreBody.innerHTML = scores.map(s => `
            <tr class="${s.isPlayer ? 'player-row' : ''}">
                <td>${s.name}</td>
                <td>${s.kills}</td>
                <td>${s.deaths}</td>
                <td>$${s.money}</td>
            </tr>
        `).join('');
    }
    
    // Oyun sonu ekrani
    showGameEnd(player, winner = 'Player') {
        this.showScreen('gameEnd');
        
        if (this.elements.winnerName) {
            this.elements.winnerName.textContent = winner;
        }
        if (this.elements.winnerKills) {
            this.elements.winnerKills.textContent = `${player.kills} ${i18n.t('game.kills')}`;
        }
        if (this.elements.finalKills) {
            this.elements.finalKills.textContent = player.kills;
        }
        if (this.elements.finalDeaths) {
            this.elements.finalDeaths.textContent = player.deaths;
        }
        if (this.elements.finalMoney) {
            this.elements.finalMoney.textContent = `$${player.money}`;
        }
    }
    
    // Bildirim goster
    showNotification(message, type = 'info', duration = 2000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.8)' : 
                        type === 'success' ? 'rgba(0, 255, 0, 0.8)' : 
                        'rgba(0, 150, 255, 0.8)'};
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            font-family: 'Orbitron', sans-serif;
            z-index: 200;
            border-radius: 5px;
            animation: fadeIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    // Silah secim ekranini olustur
    populateWeaponSelect() {
        const weaponGrid = document.querySelector('.weapon-grid');
        if (!weaponGrid) return;
        
        weaponGrid.innerHTML = '';
        
        Object.entries(WEAPONS).forEach(([id, weapon]) => {
            const card = document.createElement('div');
            card.className = 'weapon-card';
            card.dataset.weapon = id;
            
            card.innerHTML = `
                <div class="weapon-icon ${id}"></div>
                <h3>${i18n.t(weapon.nameKey)}</h3>
                <div class="weapon-stats">
                    <span>${i18n.t('weapons.damage')}: ${weapon.damage}</span>
                    <span>${i18n.t('weapons.range')}: ${weapon.range}</span>
                </div>
                <div class="weapon-price">${weapon.price === 0 ? i18n.t('weapons.free') : `$${weapon.price}`}</div>
            `;
            
            card.addEventListener('click', () => {
                document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
            
            weaponGrid.appendChild(card);
        });
    }
    
    // Dil secici
    createLanguageSelector() {
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.innerHTML = `
            <select id="languageSelect">
                <option value="tr">ð¹ð· Turkce</option>
                <option value="en">ð¬ð§ English</option>
            </select>
        `;
        
        selector.querySelector('#languageSelect').addEventListener('change', (e) => {
            i18n.setLocale(e.target.value);
        });
        
        return selector;
    }
}

// Global ornek
const uiManager = new UIManager();