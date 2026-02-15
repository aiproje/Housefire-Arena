// Housefire Arena - Bot AI Module
// Gelmis bot yapay zekasi ve respawn sistemi

// AI State Machine durumlar
const BotState = {
    IDLE: 'idle',
    PATROL: 'patrol',
    ALERT: 'alert',
    COMBAT: 'combat',
    FLEE: 'flee',
    DEAD: 'dead'
};

class Bot {
    constructor(scene, index, config = {}) {
        this.scene = scene;
        this.index = index;
        
        // Pozisyon ve donus
        this.position = new THREE.Vector3();
        this.rotation = 0;
        
        // Durum
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.state = BotState.IDLE;
        
        // AI parametreleri
        this.viewRange = CONFIG.BOT_VIEW_RANGE;
        this.attackRange = CONFIG.BOT_ATTACK_RANGE;
        this.accuracy = CONFIG.BOT_ACCURACY;
        this.stateTimer = 0;
        this.patrolTarget = null;
        this.lastKnownTargetPos = null;
        
        // Ates
        this.lastShot = 0;
        this.fireRate = 1000; // ms
        
        // Istatistikler
        this.kills = 0;
        this.deaths = 0;
        
        // Respawn
        this.respawnTimer = 0;
        
        // 3D model
        this.mesh = null;
        this.healthBar = null;
        this.flashlight = null;
        this.color = BOT_COLORS[index % BOT_COLORS.length];
        
        // Hedef
        this.target = null;
        this.targetType = null; // 'player' veya 'bot'
        
        this.createMesh();
        this.createHealthBar();
        this.createFlashlight();
    }
    
    createMesh() {
        // Roblox tarzı karakter modeli
        this.mesh = new THREE.Group();
        
        // Kafa (üstte) - ten rengi
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.7 })
        );
        head.position.y = 1.4;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Govde
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.4),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        torso.position.y = 0.8;
        torso.castShadow = true;
        this.mesh.add(torso);
        
        // Sol kol
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        leftArm.position.set(-0.5, 0.85, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        
        // Sag kol
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        rightArm.position.set(0.5, 0.85, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        
        // Sol bacak
        const leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.6, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
        );
        leftLeg.position.set(-0.15, 0.3, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);
        
        // Sag bacak
        const rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.6, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
        );
        rightLeg.position.set(0.15, 0.3, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        
        this.scene.add(this.mesh);
    }
    
    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        this.healthBar = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        this.healthBar.scale.set(2, 0.5, 1);
        this.healthBar.position.y = 2.5;
        this.scene.add(this.healthBar);
        
        // Update fonksiyonu
        this.healthBar.updateHealth = (health, maxHealth) => {
            const p = health / maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, 64, 16);
            ctx.fillStyle = p > 0.5 ? '#44ff44' : p > 0.25 ? '#ffaa00' : '#ff4444';
            ctx.fillRect(2, 2, 60 * p, 12);
            texture.needsUpdate = true;
        };
    }
    
    createFlashlight() {
        this.flashlight = new THREE.SpotLight(0xffffcc, 0, 15, Math.PI / 6, 0.5);
        this.flashlight.position.set(0, 1.8, 0);
        this.scene.add(this.flashlight);
        this.scene.add(this.flashlight.target);
    }
    
    // Spawn noktasina yerles
    spawn(spawnPoint) {
        this.position.set(spawnPoint.x, CONFIG.BOT_HEIGHT / 2, spawnPoint.z);
        this.rotation = Math.random() * Math.PI * 2;
        this.health = this.maxHealth;
        this.isAlive = true;
        this.state = BotState.IDLE;
        this.target = null;
        this.respawnTimer = 0;
        
        this.mesh.visible = true;
        this.healthBar.visible = true;
        
        this.updateMesh();
    }
    
    // Tum botlari guncelle
    update(deltaTime, player, otherBots, walls, effects) {
        if (!this.isAlive) {
            // Respawn kontrolu - deltaTime saniye, timer milisaniye
            this.respawnTimer -= deltaTime * 1000;
            if (this.respawnTimer <= 0) {
                return { needsRespawn: true };
            }
            return null;
        }
        
        // State machine guncelleme
        this.updateStateMachine(deltaTime, player, otherBots, walls);
        
        // Hareket ve pozisyon guncelleme
        this.updateMovement(deltaTime, walls);
        
        // Mesh guncelleme
        this.updateMesh();
        
        // Fener guncelleme
        this.updateFlashlight();
        
        // Health bar guncelleme
        this.healthBar.updateHealth(this.health, this.maxHealth);
        
        return null;
    }
    
    // State machine
    updateStateMachine(deltaTime, player, otherBots, walls) {
        this.stateTimer += deltaTime;
        
        // Hedef bul
        this.findTarget(player, otherBots, walls);
        
        switch (this.state) {
            case BotState.IDLE:
                this.handleIdle(deltaTime);
                break;
            case BotState.PATROL:
                this.handlePatrol(deltaTime, walls);
                break;
            case BotState.ALERT:
                this.handleAlert(deltaTime);
                break;
            case BotState.COMBAT:
                this.handleCombat(deltaTime, player, otherBots, walls);
                break;
            case BotState.FLEE:
                this.handleFlee(deltaTime, walls);
                break;
        }
        
        // Can azaldiginda kac
        if (this.health < this.maxHealth * 0.3 && this.state !== BotState.FLEE) {
            this.state = BotState.FLEE;
            this.stateTimer = 0;
        }
    }
    
    // Hedef bul
    findTarget(player, otherBots, walls) {
        this.target = null;
        this.targetType = null;
        
        // Oyuncu kontrolu
        if (player && player.isAlive) {
            const dist = this.position.distanceTo(player.position);
            if (dist < this.viewRange && this.hasLineOfSight(player.position, walls)) {
                this.target = player;
                this.targetType = 'player';
                return;
            }
        }
        
        // Diger botlari kontrol et
        let closestBot = null;
        let closestDist = Infinity;
        
        otherBots.forEach(bot => {
            if (bot !== this && bot.isAlive) {
                const dist = this.position.distanceTo(bot.position);
                if (dist < this.attackRange && dist < closestDist) {
                    if (this.hasLineOfSight(bot.position, walls)) {
                        closestBot = bot;
                        closestDist = dist;
                    }
                }
            }
        });
        
        if (closestBot) {
            this.target = closestBot;
            this.targetType = 'bot';
        }
    }
    
    // Gorus hatti kontrolu
    hasLineOfSight(targetPos, walls) {
        const direction = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
        const distance = this.position.distanceTo(targetPos);
        
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(this.position.x, CONFIG.BOT_HEIGHT / 2, this.position.z),
            direction,
            0,
            distance
        );
        
        const intersects = raycaster.intersectObjects(walls);
        return intersects.length === 0;
    }
    
    // Idle durumu
    handleIdle(deltaTime) {
        if (this.stateTimer > 2) {
            this.state = BotState.PATROL;
            this.stateTimer = 0;
            this.patrolTarget = this.getRandomPatrolPoint();
        }
        
        if (this.target) {
            this.state = BotState.COMBAT;
            this.stateTimer = 0;
        }
    }
    
    // Patrol durumu
    handlePatrol(deltaTime, walls) {
        if (this.target) {
            this.state = BotState.COMBAT;
            this.stateTimer = 0;
            return;
        }
        
        // Patrol hedefine git
        if (this.patrolTarget) {
            const dist = this.position.distanceTo(this.patrolTarget);
            if (dist < 1) {
                this.patrolTarget = this.getRandomPatrolPoint();
            } else {
                const dir = new THREE.Vector3().subVectors(this.patrolTarget, this.position).normalize();
                this.rotation = Math.atan2(dir.x, dir.z);
            }
        }
        
        // Rastgele donus
        if (Math.random() < 0.01) {
            this.rotation += (Math.random() - 0.5) * 0.5;
        }
    }
    
    // Alert durumu
    handleAlert(deltaTime) {
        if (this.target) {
            this.state = BotState.COMBAT;
            this.stateTimer = 0;
            return;
        }
        
        if (this.stateTimer > 5) {
            this.state = BotState.PATROL;
            this.stateTimer = 0;
        }
    }
    
    // Combat durumu
    handleCombat(deltaTime, player, otherBots, walls) {
        if (!this.target || !this.target.isAlive) {
            this.target = null;
            this.state = BotState.ALERT;
            this.stateTimer = 0;
            return;
        }
        
        const targetPos = this.target.position;
        const dist = this.position.distanceTo(targetPos);
        
        // Hedefe don
        const dir = new THREE.Vector3().subVectors(targetPos, this.position);
        this.rotation = Math.atan2(dir.x, dir.z);
        
        // Mesafeye gore hareket
        if (dist > 10) {
            // Yaklas
            const moveDir = dir.normalize();
            const speed = CONFIG.BOT_SPEED;
            this.position.x += moveDir.x * speed;
            this.position.z += moveDir.z * speed;
        } else if (dist < 5) {
            // Uzaklas
            const moveDir = dir.normalize().negate();
            const speed = CONFIG.BOT_SPEED * 0.5;
            this.position.x += moveDir.x * speed;
            this.position.z += moveDir.z * speed;
        }
        
        // Ates et
        this.tryShoot(dist);
    }
    
    // Flee durumu
    handleFlee(deltaTime, walls) {
        // En uzak noktaya kac
        const fleeDir = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();
        
        this.rotation = Math.atan2(fleeDir.x, fleeDir.z);
        
        const speed = CONFIG.BOT_RUN_SPEED;
        this.position.x += fleeDir.x * speed;
        this.position.z += fleeDir.z * speed;
        
        // Sinirlar icinde kal
        const halfSize = CONFIG.MAP_SIZE / 2 - 1;
        this.position.x = Math.max(-halfSize, Math.min(halfSize, this.position.x));
        this.position.z = Math.max(-halfSize, Math.min(halfSize, this.position.z));
        
        // Can yenilendiyse patrol'a don
        if (this.health > this.maxHealth * 0.5 || this.stateTimer > 10) {
            this.state = BotState.PATROL;
            this.stateTimer = 0;
        }
    }
    
    // Ates etmeyi dene
    tryShoot(distance) {
        const now = Date.now();
        if (now - this.lastShot < this.fireRate) return null;
        
        // Mesafe cezas
        const accuracyPenalty = Math.max(0, (distance - 10) * 0.02);
        const finalAccuracy = this.accuracy - accuracyPenalty;
        
        if (Math.random() < finalAccuracy) {
            this.lastShot = now;
            
            // Hasar hesapla
            const damage = 15 + Math.floor(Math.random() * 10);
            
            return {
                hit: true,
                damage: damage,
                target: this.target,
                targetType: this.targetType
            };
        }
        
        this.lastShot = now;
        return { hit: false };
    }
    
    // Hareket guncelleme
    updateMovement(deltaTime, walls) {
        // Basit collision avoidance
        const halfSize = CONFIG.MAP_SIZE / 2 - 1;
        
        // Harita sinirlari
        this.position.x = Math.max(-halfSize, Math.min(halfSize, this.position.x));
        this.position.z = Math.max(-halfSize, Math.min(halfSize, this.position.z));
        
        // Duvar collision
        for (const wall of walls) {
            const box = new THREE.Box3().setFromObject(wall);
            if (box.containsPoint(new THREE.Vector3(this.position.x, CONFIG.BOT_HEIGHT / 2, this.position.z))) {
                // Geri it
                this.position.x -= Math.sin(this.rotation) * 0.2;
                this.position.z -= Math.cos(this.rotation) * 0.2;
            }
        }
    }
    
    // Mesh guncelleme
    updateMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.healthBar.position.set(this.position.x, 2.5, this.position.z);
    }
    
    // Fener guncelleme
    updateFlashlight() {
        this.flashlight.position.set(this.position.x, 1.8, this.position.z);
        this.flashlight.target.position.set(
            this.position.x - Math.sin(this.rotation) * 5,
            0,
            this.position.z - Math.cos(this.rotation) * 5
        );
    }
    
    // Fener ac/kapat
    setFlashlightEnabled(enabled) {
        this.flashlight.intensity = enabled ? 1.5 : 0;
    }
    
    // Rastgele patrol noktasi
    getRandomPatrolPoint() {
        const halfSize = CONFIG.MAP_SIZE / 2 - 5;
        return new THREE.Vector3(
            (Math.random() - 0.5) * halfSize * 2,
            0,
            (Math.random() - 0.5) * halfSize * 2
        );
    }
    
    // Hasar al
    takeDamage(amount) {
        if (!this.isAlive) return { died: false };
        
        this.health -= amount;
        
        // Alert moduna gec
        if (this.state === BotState.PATROL || this.state === BotState.IDLE) {
            this.state = BotState.ALERT;
            this.stateTimer = 0;
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.die(this.effects);
            return { died: true };
        }
        
        return { died: false };
    }
    
    // Olum
    die(effects) {
        this.isAlive = false;
        this.state = BotState.DEAD;
        this.deaths++;
        this.mesh.visible = false;
        this.healthBar.visible = false;
        // FENERİ GİZLE - önceki ışıklar oyunda kalmıyordu
        this.flashlight.intensity = 0;
        this.respawnTimer = CONFIG.BOT_RESPAWN_TIME;
        
        // Parcalanma efekti
        if (effects) {
            effects.createDeathExplosion(this.position, this.color);
        }
    }
    
    // Respawn hazir mi?
    isReadyToRespawn() {
        return !this.isAlive && this.respawnTimer <= 0;
    }
    
    // Temizle
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.healthBar) {
            this.scene.remove(this.healthBar);
        }
        if (this.flashlight) {
            this.scene.remove(this.flashlight);
            this.scene.remove(this.flashlight.target);
        }
    }
}

// Bot yoneticisi
class BotManager {
    constructor(scene) {
        this.scene = scene;
        this.bots = [];
    }
    
    // Botlari olustur
    createBots(count = CONFIG.BOT_COUNT) {
        for (let i = 0; i < count; i++) {
            const bot = new Bot(this.scene, i);
            this.bots.push(bot);
        }
        return this.bots;
    }
    
    // Tum botlari spawn et
    spawnAll(spawnPoints) {
        this.bots.forEach((bot, i) => {
            const point = spawnPoints[i % spawnPoints.length];
            bot.spawn(point);
        });
    }
    
    // Tum botlari guncelle
    update(deltaTime, player, walls, effects) {
        const respawnRequests = [];
        
        this.bots.forEach(bot => {
            const result = bot.update(deltaTime, player, this.bots, walls, effects);
            if (result && result.needsRespawn) {
                respawnRequests.push(bot);
            }
        });
        
        return respawnRequests;
    }
    
    // Botlari respawn et
    respawnBots(botsToRespawn, spawnPoints) {
        botsToRespawn.forEach(bot => {
            const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            bot.spawn(point);
        });
    }
    
    // Canli bot sayisi
    getAliveCount() {
        return this.bots.filter(b => b.isAlive).length;
    }
    
    // Temizle
    dispose() {
        this.bots.forEach(bot => bot.dispose());
        this.bots = [];
    }
}