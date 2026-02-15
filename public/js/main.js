// Housefire Arena - Main Game Module
// Ana oyun dongusu ve koordinasyon

class Game {
    constructor() {
        // Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Oyun bileenleri
        this.map = null;
        this.player = null;
        this.botManager = null;
        this.weaponSystem = null;
        this.effects = null;
        this.cameraController = null;
        
        // Oyun durumu
        this.state = {
            isPlaying: false,
            isPaused: false,
            gameTime: CONFIG.GAME_TIME,
            darkMode: false,
            darkModeTimer: 0
        };
        
        // Zamanlama
        this.lastTime = 0;
        this.timeAccumulator = 0;
        
        // FPS
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
    }
    
    // Baslat
    async init() {
        // Three.js kurulumu
        this.setupThreeJS();
        
        // Dil yukle
        await i18n.loadLocale('tr');
        
        // Olay dinleyicileri
        this.setupEventListeners();
        
        // Harita olustur
        this.map = new GameMap(this.scene);
        
        // Isiklandirma
        this.setupLighting();
        
        // Efektler
        this.effects = new EffectsManager(this.scene);
        
        // Silah sistemi
        this.weaponSystem = new WeaponSystem(this.scene);
        
        // Kamera kontrolu
        this.cameraController = new CameraController(this.camera);
        
        // UI
        uiManager.populateWeaponSelect();
        uiManager.setShopBuyCallback((itemId, item) => {
            this.handleShopPurchase(itemId, item);
        });
        
        // Animasyon dongusu
        this.animate();
    }
    
    // Three.js kurulumu
    setupThreeJS() {
        // Sahne
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        this.scene.fog = new THREE.Fog(0x0a0a0f, 30, 60);
        
        // Kamera
        this.camera = createIsometricCamera();
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Pencere boyutu degisimi
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    // Isiklandirma
    setupLighting() {
        // Ambient
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        // Directional
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight.position.set(20, 30, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);
    }
    
    // Olay dinleyicileri
    setupEventListeners() {
        // Menu dugmeleri
        document.getElementById('startGameBtn')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('joinGame')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('playAgain')?.addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('closeShop')?.addEventListener('click', () => {
            this.toggleShop();
        });
        
        // Klavye
        inputManager.on('keydown', (e) => this.handleKeyDown(e));
        
        // Fare
        inputManager.on('mousedown', (e) => this.handleMouseDown(e));
        inputManager.on('mousemove', (e, mouse) => this.handleMouseMove(e, mouse));
        inputManager.on('pointerlockchange', (isLocked) => this.handlePointerLockChange(isLocked));
        
        // Silah secimi
        document.querySelectorAll('.weapon-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
    }
    
    // Oyunu baslat
    startGame() {
        uiManager.showScreen(null);
        uiManager.showHUD(true);
        
        // Oyuncu olustur
        this.player = new Player(this.scene);
        this.player.respawn(SPAWN_POINTS);
        this.cameraController.setTarget(this.player);
        this.cameraController.snapTo(this.player.position);
        
        // Botlari olustur
        this.botManager = new BotManager(this.scene);
        this.botManager.createBots(CONFIG.BOT_COUNT);
        this.botManager.spawnAll(SPAWN_POINTS);
        
        // Oyun durumunu sifirla
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.gameTime = CONFIG.GAME_TIME;
        this.state.darkMode = false;
        this.state.darkModeTimer = 0;
        
        // Zamanlayici
        this.lastTime = performance.now();
        this.timeAccumulator = 0;
        
        // UI guncelle
        uiManager.updateHealthBar(this.player.health, this.player.maxHealth);
        uiManager.updateMoney(this.player.money);
        uiManager.updateKills(this.player.kills);
        uiManager.updateWeaponDisplay(WEAPONS[this.player.currentWeapon], this.player.ammo[this.player.currentWeapon]);
        
        // Ses context resume
        audioManager.resume();
    }
    
    // Oyunu bitir
    endGame() {
        this.state.isPlaying = false;
        
        // Kazanan belirle
        let winner = 'Player';
        let maxKills = this.player.kills;
        
        this.botManager.bots.forEach((bot, i) => {
            if (bot.kills > maxKills) {
                maxKills = bot.kills;
                winner = `Bot ${i + 1}`;
            }
        });
        
        uiManager.showGameEnd(this.player, winner);
    }
    
    // Ana dongu
    animate(currentTime = 0) {
        requestAnimationFrame((t) => this.animate(t));
        
        // FPS hesapla
        this.frameCount++;
        this.fpsTime += currentTime - this.lastTime;
        if (this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        // Oyun dongusu
        if (this.state.isPlaying && !this.state.isPaused) {
            this.gameLoop(currentTime);
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    // Oyun dongusu
    gameLoop(currentTime) {
        // Delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 1 saniyelik timer
        this.timeAccumulator += deltaTime;
        while (this.timeAccumulator >= 1) {
            this.updateSecond();
            this.timeAccumulator -= 1;
        }
        
        // Oyuncu guncelle
        if (this.player.isAlive) {
            this.player.update(deltaTime, inputManager, this.map.getWalls());
        } else {
            // Respawn kontrolu
            this.handlePlayerDeath();
        }
        
        // Botlari guncelle
        const respawnRequests = this.botManager.update(deltaTime, this.player, this.map.getWalls(), this.effects);
        
        // Botlari respawn et
        if (respawnRequests.length > 0) {
            this.botManager.respawnBots(respawnRequests, SPAWN_POINTS);
        }
        
        // Bot atislari
        this.handleBotShooting();
        
        // Dark mode bot görünürlük kontrolü
        if (this.state.darkMode) {
            this.updateBotVisibility();
        }
        
        // Mermileri guncelle
        this.weaponSystem.update(this.map.getWalls(), this.botManager.bots, this.player, this.effects);
        
        // Efektleri guncelle
        this.effects.update();
        
        // Kamerayi guncelle
        this.cameraController.update(deltaTime);
        
        // UI guncelle
        this.updateUI();
    }
    
    // Saniyelik guncelleme
    updateSecond() {
        this.state.gameTime--;
        this.state.darkModeTimer++;
        
        // Dark mode
        if (this.state.darkModeTimer >= CONFIG.DARK_MODE_INTERVAL) {
            this.state.darkMode = !this.state.darkMode;
            this.state.darkModeTimer = 0;
            this.toggleDarkMode(this.state.darkMode);
        }
        
        // Zamanlayici
        uiManager.updateTimer(this.state.gameTime);
        
        // Oyun bitti mi?
        if (this.state.gameTime <= 0) {
            this.endGame();
        }
    }
    
    // UI guncelle
    updateUI() {
        if (!this.player) return;
        
        uiManager.updateHealthBar(this.player.health, this.player.maxHealth);
        uiManager.updateMoney(this.player.money);
        uiManager.updateKills(this.player.kills);
    }
    
    // Klavye girdisi
    handleKeyDown(e) {
        if (!this.state.isPlaying) return;
        
        // Silah secimi (1-5)
        if (e.key >= '1' && e.key <= '5') {
            const weaponKeys = ['pistol', 'shotgun', 'sniper', 'rifle', 'stick'];
            const index = parseInt(e.key) - 1;
            if (weaponKeys[index] && this.player.weapons.includes(weaponKeys[index])) {
                this.player.selectWeapon(weaponKeys[index]);
                uiManager.updateWeaponDisplay(
                    WEAPONS[weaponKeys[index]], 
                    this.player.ammo[weaponKeys[index]]
                );
                audioManager.play('click');
            }
        }
        
        // Magaza (B)
        if (e.key.toLowerCase() === 'b') {
            this.toggleShop();
        }
        
        // Skor tablosu (Tab)
        if (e.key === 'Tab') {
            e.preventDefault();
            uiManager.toggleScoreboard(true);
            uiManager.updateScoreboard(this.player, this.botManager.bots);
        }
        
        // Bomba (G)
        if (e.key.toLowerCase() === 'g') {
            this.throwGrenade();
        }
    }
    
    // Fare girdisi
    handleMouseDown(e) {
        if (!this.state.isPlaying) return;
        
        if (e.button === 0 && this.player.isAlive) { // Sol tik
            this.shoot();
        }
    }
    
    // Fare hareketi - mouse takipli donus
    handleMouseMove(e, mouse) {
        if (!this.state.isPlaying || !this.player) return;
        
        // Fare world pozisyonunu hesapla
        const worldPos = inputManager.calculateWorldMousePosition(this.camera, this.player.position);
        
        // Karakteri farenin oldugu yone dondur
        this.player.rotateTowards(worldPos);
    }
    
    // Pointer lock degisimi
    handlePointerLockChange(isLocked) {
        // Artik kullanilmiyor
    }
    
    // Ates et
    shoot() {
        const result = this.player.shoot(this.botManager.bots, this.effects, audioManager);
        
        if (!result) return;
        
        // Mermi bitti
        if (result.outOfAmmo) {
            uiManager.showNotification(i18n.t('shop.noAmmo'), 'error');
            return;
        }
        
        // Mermi olustur
        if (result.bullet) {
            this.weaponSystem.createBullet(
                result.bullet.position,
                result.bullet.direction,
                result.bullet.weapon,
                this.effects
            );
        }
        
        // Vurus
        if (result.hit) {
            const hitResult = result.hit.bot.takeDamage(result.weapon.damage);
            
            // Para kazan
            this.player.addMoney(CONFIG.HIT_REWARD);
            
            if (hitResult.died) {
                this.player.kills++;
                this.player.addMoney(CONFIG.KILL_REWARD);
            }
            
            // Efektler
            this.effects.createBloodSplatter(result.hit.bot.position);
            uiManager.showHitMarker();
            
            // Kamera sarsintisi
            this.cameraController.applyRecoil(result.weapon.recoil);
        }
        
        // Ses
        audioManager.play(result.weapon.sound);
        
        // UI guncelle
        uiManager.updateWeaponDisplay(
            WEAPONS[this.player.currentWeapon],
            this.player.ammo[this.player.currentWeapon]
        );
    }
    
    // Bot atislari - hem oyuncuya hem diger botlara
    handleBotShooting() {
        this.botManager.bots.forEach(bot => {
            if (!bot.isAlive) return;
            if (!bot.target) return;
            
            // Combat durumunda ateş et
            if (bot.state !== BotState.COMBAT) return;
            
            const dist = bot.position.distanceTo(bot.target.position);
            const result = bot.tryShoot(dist);
            
            if (!result || !result.shot) return;
            
            // Ateş sesi
            audioManager.play('pistol');
            
            if (result.hit) {
                if (bot.targetType === 'player') {
                    // Oyuncuya hasar
                    const damageResult = this.player.takeDamage(result.damage);
                    
                    // Efektler
                    this.effects.showDamageFlash();
                    this.effects.createBloodSplatter(this.player.position);
                    
                    // Ölüm
                    if (damageResult.isDead) {
                        bot.kills++;
                        this.player.deaths++;
                    }
                } else if (bot.targetType === 'bot') {
                    // Diğer bota hasar
                    const targetBot = bot.target;
                    if (targetBot && targetBot.isAlive) {
                        const damageResult = targetBot.takeDamage(result.damage);
                        this.effects.createBloodSplatter(targetBot.position);
                        
                        // Bot ölürse
                        if (damageResult.died) {
                            bot.kills++;
                            targetBot.deaths++;
                        }
                    }
                }
            }
        });
    }
    
    // Oyuncu olumu
    handlePlayerDeath() {
        let remainingTime = CONFIG.RESPAWN_TIME;
        
        // Respawn overlay goster
        uiManager.showRespawnOverlay(true, remainingTime);
        
        // Countdown timer
        const countdown = setInterval(() => {
            remainingTime--;
            if (remainingTime > 0) {
                uiManager.showRespawnOverlay(true, remainingTime);
            } else {
                clearInterval(countdown);
                if (this.state.isPlaying) {
                    this.player.respawn(SPAWN_POINTS);
                    uiManager.showRespawnOverlay(false);
                    uiManager.updateHealthBar(this.player.health, this.player.maxHealth);
                }
            }
        }, 1000);
    }
    
    // Magaza
    toggleShop() {
        const isOpen = shop.toggle();
        uiManager.toggleShop(isOpen, this.player.money);
        
        if (isOpen) {
            uiManager.populateShop(this.player);
        }
    }
    
    // Magaza satin alma
    handleShopPurchase(itemId, item) {
        const result = shop.buy(itemId, this.player);
        
        if (result.success) {
            uiManager.showNotification(result.message, 'success');
            audioManager.play('purchase');
            uiManager.updateMoney(this.player.money);
            uiManager.populateShop(this.player);
        } else {
            uiManager.showNotification(result.message, 'error');
        }
    }
    
    // Bomba at
    throwGrenade() {
        if (this.player.grenades <= 0) {
            uiManager.showNotification(i18n.t('shop.noGrenades'), 'error');
            return;
        }
        
        this.player.grenades--;
        this.effects.createExplosion(this.player.position);
        audioManager.play('explosion');
        
        // Botlara hasar
        this.botManager.bots.forEach(bot => {
            if (bot.isAlive) {
                const dist = this.player.position.distanceTo(bot.position);
                if (dist < 5) {
                    bot.takeDamage(50);
                }
            }
        });
    }
    
    // Dark mode
    toggleDarkMode(enabled) {
        this.map.setLightsEnabled(!enabled);
        
        // Fenerler
        this.player.setFlashlightEnabled(enabled);
        this.botManager.bots.forEach(bot => {
            bot.setFlashlightEnabled(enabled);
        });
        
        // UI
        uiManager.showDarkModeIndicator(enabled);
    }
    
    // Dark mode bot görünürlük kontrolü
    updateBotVisibility() {
        const FLASHLIGHT_RANGE = 15;  // Fener menzili
        const playerPos = this.player.position;
        
        this.botManager.bots.forEach(bot => {
            if (!bot.isAlive || !bot.mesh) return;
            
            const distance = playerPos.distanceTo(bot.position);
            
            // Oyuncu fener menzilinde ve görüş hattında ise görünür
            if (distance < FLASHLIGHT_RANGE) {
                // Basit görüş hattı kontrolü - duvar yoksa görünür
                const direction = new THREE.Vector3().subVectors(bot.position, playerPos).normalize();
                const raycaster = new THREE.Raycaster(playerPos, direction, 0, distance);
                const walls = this.map.getWalls();
                const intersects = raycaster.intersectObjects(walls, true);
                
                // Duvar yoksa görünür
                if (intersects.length === 0) {
                    bot.mesh.visible = true;
                } else {
                    bot.mesh.visible = false;
                }
            } else {
                // Fener menzilinde değilse görünmez
                bot.mesh.visible = false;
            }
        });
    }
    
    // Pencere boyutu
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Oyunu baslat
const game = new Game();
document.addEventListener('DOMContentLoaded', () => {
    game.init();
});