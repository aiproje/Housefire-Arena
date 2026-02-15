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
        this.coverPoint = null;  // Cover system
        this.flankingAngle = 0;  // Flanking için
        
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
        
        // Sol kol - silah tutan kol yukarıda
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        leftArm.position.set(-0.5, 1.1, 0);  // Omuz seviyesi
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        this.leftArm = leftArm;
        
        // Sag kol - destek kol
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        rightArm.position.set(0.5, 1.0, 0);  // Omuz seviyesi
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        this.rightArm = rightArm;
        
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
        
        // Bot silahı - nişan pozisyonunda
        this.createWeaponMesh();
        
        this.scene.add(this.mesh);
    }
    
    // Bot silah mesh'i oluştur
    createWeaponMesh() {
        const weaponGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
        const weaponMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
        this.weaponMesh = new THREE.Mesh(weaponGeo, weaponMat);
        this.weaponMesh.position.set(0.4, 1.2, 0.3);  // Göz hizasında nişan
        this.weaponMesh.castShadow = true;
        this.mesh.add(this.weaponMesh);
        
        // Muzzle flash için ışık noktası
        this.muzzleLight = new THREE.PointLight(0xffaa00, 0, 5);
        this.muzzleLight.position.set(0.4, 1.2, 0.6);
        this.mesh.add(this.muzzleLight);
    }
    
    // Muzzle flash efekti
    showMuzzleFlash() {
        if (this.muzzleLight) {
            this.muzzleLight.intensity = 2;
            setTimeout(() => {
                if (this.muzzleLight) this.muzzleLight.intensity = 0;
            }, 50);
        }
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
        
        // AI davranışı - saldırı, cover, veya flanking
        this.updateAIBehavior(deltaTime, targetPos, dist, walls);
        
        // Ates et
        this.tryShoot(dist);
    }
    
    // AI davranış güncellemesi
    updateAIBehavior(deltaTime, targetPos, dist, walls) {
        // Cover noktası kontrolü veya flanking
        if (!this.coverPoint || this.stateTimer > 3) {
            this.findCoverPoint(targetPos, walls);
        }
        
        // Cover noktasına git veya flanking yap
        if (this.coverPoint) {
            const coverDist = this.position.distanceTo(this.coverPoint);
            if (coverDist > 1) {
                // Cover'a hareket et
                const dir = new THREE.Vector3().subVectors(this.coverPoint, this.position).normalize();
                this.rotation = Math.atan2(dir.x, dir.z);
                const speed = CONFIG.BOT_SPEED * 0.7;
                this.position.x += dir.x * speed * deltaTime;
                this.position.z += dir.z * speed * deltaTime;
            } else {
                // Cover'da bekle ve ara sıra peek yap
                if (Math.random() < 0.02) {
                    // Rastgele yönlere bak
                    const angle = Math.random() * Math.PI * 2;
                    this.rotation = Math.atan2(Math.sin(angle), Math.cos(angle));
                }
            }
        } else {
            // Flanking - hedefin yanlarına hareket et
            this.handleFlanking(deltaTime, targetPos, dist);
        }
        
        // Hedefe dönük kal
        const lookDir = new THREE.Vector3().subVectors(targetPos, this.position);
        this.rotation = Math.atan2(lookDir.x, lookDir.z);
    }
    
    // Flanking davranışı
    handleFlanking(deltaTime, targetPos, dist) {
        // Hedefin yanına dairesel hareket
        const angle = Math.atan2(targetPos.z - this.position.z, targetPos.x - this.position.x);
        const flankingAngle = angle + (Math.random() > 0.5 ? Math.PI / 3 : -Math.PI / 3);
        
        let moveDir;
        if (dist > 10) {
            // Yaklaş
            moveDir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
        } else if (dist < 5) {
            // Uzaklaş
            moveDir = new THREE.Vector3().subVectors(targetPos, this.position).normalize().negate();
        } else {
            // Flanking hareketi
            moveDir = new THREE.Vector3(Math.cos(flankingAngle), 0, Math.sin(flankingAngle));
        }
        
        const speed = CONFIG.BOT_SPEED * 0.8;
        this.position.x += moveDir.x * speed * deltaTime;
        this.position.z += moveDir.z * speed * deltaTime;
    }
    
    // Cover noktası bul
    findCoverPoint(targetPos, walls) {
        // Basit cover sistemi - duvar arkası nokta bul
        if (!walls || walls.length === 0) {
            this.coverPoint = null;
            return;
        }
        
        // Rastgele duvar seç ve arkasında nokta bul
        const randomWall = walls[Math.floor(Math.random() * walls.length)];
        if (randomWall && randomWall.position) {
            const wallPos = randomWall.position;
            const dirFromTarget = new THREE.Vector3().subVectors(wallPos, targetPos).normalize();
            
            this.coverPoint = new THREE.Vector3(
                wallPos.x + dirFromTarget.x * 2,
                0,
                wallPos.z + dirFromTarget.z * 2
            );
        }
    }
    
    // Waypoint sistemi için rastgele patrol noktası
    getSmartPatrolPoint(mapSize) {
        // Daha akıllı patrol - haritanın farklı bölgelerini gez
        const quadrant = Math.floor(Math.random() * 4);
        const halfSize = mapSize / 2 - 5;
        let x, z;
        
        switch (quadrant) {
            case 0: x = Math.random() * halfSize; z = Math.random() * halfSize; break;
            case 1: x = -Math.random() * halfSize; z = Math.random() * halfSize; break;
            case 2: x = Math.random() * halfSize; z = -Math.random() * halfSize; break;
            case 3: x = -Math.random() * halfSize; z = -Math.random() * halfSize; break;
        }
        
        return new THREE.Vector3(x, 0, z);
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