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
        
        // Sol kol - silah tutan kol - ASAGIYA BAKMALI
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        leftArm.position.set(-0.5, 0.75, 0);  // Omuz seviyesinden asagi
        // leftArm.rotation.x = 0;  // Dikey (asagiya) pozisyon - varsayilan deger
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        this.leftArm = leftArm;
        
        // Sag kol - destek kol - ILERIYE BAKMALI
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 })
        );
        rightArm.position.set(0.5, 1.1, 0);  // Omuz seviyesi
        rightArm.rotation.x = Math.PI / 2;  // Yatay pozisyon (ileriye)
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
        // Feneri saga kola bagla - boylece karakterle birlikte doner
        this.flashlight = new THREE.SpotLight(0xffffcc, 0, 15, Math.PI / 6, 0.5);
        
        // Feneri sag kolun ucuna yerlestir
        if (this.rightArm) {
            this.flashlight.position.set(0, 0.35, 0.2);  // Kolun ucunda, ileriye bakan tarafta
            this.rightArm.add(this.flashlight);
            this.rightArm.add(this.flashlight.target);
            
            // Fener hedefini karakterin onune yerlestir
            this.flashlight.target.position.set(0, 0, 5);
        } else {
            // Yedek: saga baglanamazsa scene'e ekle
            this.flashlight.position.set(0, 1.8, 0);
            this.scene.add(this.flashlight);
            this.scene.add(this.flashlight.target);
        }
        
        // Fener hedefini scene'e ekle ki world transform doğru çalışsın
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
                this.handleAlert(deltaTime, walls);
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
    
    // Hedef bul - oyuncu ve diğer botları değerlendir
    findTarget(player, otherBots, walls) {
        this.target = null;
        this.targetType = null;
        
        let bestTarget = null;
        let bestScore = -Infinity;
        
        // Oyuncu kontrolü
        if (player && player.isAlive) {
            const dist = this.position.distanceTo(player.position);
            if (dist < this.viewRange && this.hasLineOfSight(player.position, walls)) {
                // Oyuncu öncelikli - yüksek skor
                const score = 100 - dist; // Mesafe azaldıkça skor artar
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = player;
                    this.targetType = 'player';
                }
            }
        }
        
        // Diğer botları kontrol et - viewRange içindeki tüm botları değerlendir
        otherBots.forEach(bot => {
            if (bot !== this && bot.isAlive) {
                const dist = this.position.distanceTo(bot.position);
                // Görüş menzili içinde ve görüş hattı varsa
                if (dist < this.viewRange && this.hasLineOfSight(bot.position, walls)) {
                    // Bot skoru - mesafe ve can durumuna göre
                    const healthFactor = 1 - (bot.health / bot.maxHealth) * 0.3; // Düşük canlı hedef öncelikli
                    const score = (50 - dist * 0.5) * healthFactor;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestTarget = bot;
                        this.targetType = 'bot';
                    }
                }
            }
        });
        
        this.target = bestTarget;
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
    
    // Idle durumu - etrafa bakınma ve kısa bekleme
    handleIdle(deltaTime) {
        // Etrafa bakın - rastgele yön değiştir
        if (Math.random() < 0.03) {
            this.rotation += (Math.random() - 0.5) * Math.PI * 0.5;
        }
        
        // Kısa bekleme sonrası patrol'a geç
        if (this.stateTimer > 1 + Math.random() * 2) {
            this.state = BotState.PATROL;
            this.stateTimer = 0;
            this.patrolTarget = this.getRandomPatrolPoint();
        }
        
        // Hedef varsa combat'a geç
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
            if (dist < 1.5) {
                // Hedefe ulaştı, yeni hedef belirle
                this.patrolTarget = this.getRandomPatrolPoint();
                // Kısa bekleme
                this.stateTimer = 0;
            } else {
                // Hedefe doğru hareket et
                const dir = new THREE.Vector3().subVectors(this.patrolTarget, this.position).normalize();
                this.rotation = Math.atan2(dir.x, dir.z);
                
                // Hareket et - patrol hızında
                const speed = CONFIG.BOT_SPEED * 0.6;
                const newX = this.position.x + dir.x * speed * deltaTime;
                const newZ = this.position.z + dir.z * speed * deltaTime;
                
                // Basit collision kontrolü
                if (!this.checkWallCollision(newX, newZ, walls)) {
                    this.position.x = newX;
                    this.position.z = newZ;
                } else {
                    // Duvar varsa yeni hedef belirle
                    this.patrolTarget = this.getRandomPatrolPoint();
                }
            }
        } else {
            // Hedef yoksa yeni hedef belirle
            this.patrolTarget = this.getRandomPatrolPoint();
        }
        
        // Rastgele duraklama ve etrafa bakınma
        if (Math.random() < 0.005) {
            // Dur ve etrafa bak
            this.state = BotState.IDLE;
            this.stateTimer = 0;
        }
    }
    
    // Duvar collision kontrolü
    checkWallCollision(x, z, walls) {
        if (!walls || walls.length === 0) return false;
        
        for (const wall of walls) {
            const box = new THREE.Box3().setFromObject(wall);
            // Bot yarıçapı kadar margin ekle
            const margin = 0.5;
            if (x >= box.min.x - margin && x <= box.max.x + margin &&
                z >= box.min.z - margin && z <= box.max.z + margin) {
                return true;
            }
        }
        return false;
    }
    
    // Alert durumu - son bilinen pozisyona git ve ara
    handleAlert(deltaTime, walls) {
        // Hedef varsa combat'a geç
        if (this.target) {
            this.state = BotState.COMBAT;
            this.stateTimer = 0;
            return;
        }
        
        // Son bilinen hedef pozisyonuna git
        if (this.lastKnownTargetPos) {
            const dist = this.position.distanceTo(this.lastKnownTargetPos);
            if (dist > 2) {
                const dir = new THREE.Vector3().subVectors(this.lastKnownTargetPos, this.position).normalize();
                this.rotation = Math.atan2(dir.x, dir.z);
                const speed = CONFIG.BOT_SPEED * 0.7;
                const newX = this.position.x + dir.x * speed * deltaTime;
                const newZ = this.position.z + dir.z * speed * deltaTime;
                
                if (!this.checkWallCollision(newX, newZ, walls)) {
                    this.position.x = newX;
                    this.position.z = newZ;
                }
            } else {
                // Pozisyona ulaştı, etrafa bakın
                this.rotation += (Math.random() - 0.5) * 0.3;
            }
        }
        
        // Uzun süre hedef bulunamazsa patrol'a dön
        if (this.stateTimer > 5) {
            this.state = BotState.PATROL;
            this.stateTimer = 0;
            this.lastKnownTargetPos = null;
        }
    }
    
    // Combat durumu
    handleCombat(deltaTime, player, otherBots, walls) {
        if (!this.target || !this.target.isAlive) {
            this.target = null;
            this.state = BotState.ALERT;
            this.stateTimer = 0;
            this.lastKnownTargetPos = null;
            return;
        }
        
        const targetPos = this.target.position;
        const dist = this.position.distanceTo(targetPos);
        
        // Hedefin son bilinen pozisyonunu kaydet
        this.lastKnownTargetPos = targetPos.clone();
        
        // Görüş hattı var mı kontrol et
        const hasLOS = this.hasLineOfSight(targetPos, walls);
        
        if (!hasLOS) {
            // Görüş hattı yoksa son bilinen pozisyona git
            if (this.lastKnownTargetPos) {
                const dir = new THREE.Vector3().subVectors(this.lastKnownTargetPos, this.position).normalize();
                this.rotation = Math.atan2(dir.x, dir.z);
                const speed = CONFIG.BOT_SPEED * 0.8;
                this.position.x += dir.x * speed * deltaTime;
                this.position.z += dir.z * speed * deltaTime;
            }
            return;
        }
        
        // AI davranışı - saldırı, cover, veya flanking
        this.updateAIBehavior(deltaTime, targetPos, dist, walls);
        
        // Ateş et
        return this.tryShoot(dist);
    }
    
    // AI davranış güncellemesi - daha insan gibi hareket
    updateAIBehavior(deltaTime, targetPos, dist, walls) {
        // Her 2-4 saniyede yeni strateji belirle
        if (!this.strategyTimer) this.strategyTimer = 0;
        this.strategyTimer += deltaTime;
        
        if (this.strategyTimer > 2 + Math.random() * 2) {
            this.strategyTimer = 0;
            // Rastgele strateji seç: agresif, defansif, flanking
            const rand = Math.random();
            if (rand < 0.4) {
                this.currentStrategy = 'aggressive';
            } else if (rand < 0.7) {
                this.currentStrategy = 'strafe';
            } else {
                this.currentStrategy = 'cover';
            }
        }
        
        // Stratejiye göre hareket
        switch (this.currentStrategy) {
            case 'aggressive':
                this.handleAggressive(deltaTime, targetPos, dist, walls);
                break;
            case 'strafe':
                this.handleStrafe(deltaTime, targetPos, dist, walls);
                break;
            case 'cover':
                this.handleCover(deltaTime, targetPos, dist, walls);
                break;
            default:
                this.handleStrafe(deltaTime, targetPos, dist, walls);
        }
        
        // Hedefe dönük kal
        const lookDir = new THREE.Vector3().subVectors(targetPos, this.position);
        this.rotation = Math.atan2(lookDir.x, lookDir.z);
    }
    
    // Agresif strateji - hedefe doğru ilerle
    handleAggressive(deltaTime, targetPos, dist, walls) {
        if (dist > 5) {
            // Hedefe yaklaş
            const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
            const speed = CONFIG.BOT_SPEED * 1.2;
            const newX = this.position.x + dir.x * speed * deltaTime;
            const newZ = this.position.z + dir.z * speed * deltaTime;
            
            if (!this.checkWallCollision(newX, newZ, walls)) {
                this.position.x = newX;
                this.position.z = newZ;
            }
        } else if (dist < 3) {
            // Çok yakınsa geri çekil
            const dir = new THREE.Vector3().subVectors(this.position, targetPos).normalize();
            const speed = CONFIG.BOT_SPEED * 0.8;
            this.position.x += dir.x * speed * deltaTime;
            this.position.z += dir.z * speed * deltaTime;
        }
    }
    
    // Strafe stratejisi - yana yana hareket
    handleStrafe(deltaTime, targetPos, dist, walls) {
        // Hedef etrafında dairesel hareket
        const angle = Math.atan2(targetPos.z - this.position.z, targetPos.x - this.position.x);
        
        // Sağa veya sola strafe
        if (!this.strafeDirection) this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
        if (Math.random() < 0.02) this.strafeDirection *= -1; // Ara sıra yön değiştir
        
        const strafeAngle = angle + (Math.PI / 2) * this.strafeDirection;
        const strafeDir = new THREE.Vector3(Math.cos(strafeAngle), 0, Math.sin(strafeAngle));
        
        const speed = CONFIG.BOT_SPEED * 0.9;
        const newX = this.position.x + strafeDir.x * speed * deltaTime;
        const newZ = this.position.z + strafeDir.z * speed * deltaTime;
        
        if (!this.checkWallCollision(newX, newZ, walls)) {
            this.position.x = newX;
            this.position.z = newZ;
        }
        
        // İdeal mesafeyi koru
        if (dist > 15) {
            // Yaklaş
            const approachDir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
            this.position.x += approachDir.x * speed * 0.3 * deltaTime;
            this.position.z += approachDir.z * speed * 0.3 * deltaTime;
        } else if (dist < 5) {
            // Uzaklaş
            const retreatDir = new THREE.Vector3().subVectors(this.position, targetPos).normalize();
            this.position.x += retreatDir.x * speed * 0.5 * deltaTime;
            this.position.z += retreatDir.z * speed * 0.5 * deltaTime;
        }
    }
    
    // Cover stratejisi - koruma arkasına git
    handleCover(deltaTime, targetPos, dist, walls) {
        // Cover noktası bul
        if (!this.coverPoint || this.position.distanceTo(this.coverPoint) < 1) {
            this.findCoverPoint(targetPos, walls);
        }
        
        if (this.coverPoint) {
            const coverDist = this.position.distanceTo(this.coverPoint);
            if (coverDist > 1) {
                // Cover'a git
                const dir = new THREE.Vector3().subVectors(this.coverPoint, this.position).normalize();
                const speed = CONFIG.BOT_SPEED * 0.8;
                const newX = this.position.x + dir.x * speed * deltaTime;
                const newZ = this.position.z + dir.z * speed * deltaTime;
                
                if (!this.checkWallCollision(newX, newZ, walls)) {
                    this.position.x = newX;
                    this.position.z = newZ;
                }
            }
        } else {
            // Cover yoksa strafe yap
            this.handleStrafe(deltaTime, targetPos, dist, walls);
        }
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
    
    // Flee durumu - hedeften kaç ve can yenile
    handleFlee(deltaTime, walls) {
        // Hedeften uzaklaş
        let fleeDir;
        if (this.target && this.target.isAlive) {
            // Hedeften ters yönde kaç
            fleeDir = new THREE.Vector3().subVectors(this.position, this.target.position).normalize();
        } else {
            // Rastgele yön
            fleeDir = new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize();
        }
        
        // Kaçış yönüne rastgele sapma ekle (daha doğal hareket)
        const deviation = (Math.random() - 0.5) * 0.5;
        fleeDir.x += deviation;
        fleeDir.z += deviation;
        fleeDir.normalize();
        
        this.rotation = Math.atan2(fleeDir.x, fleeDir.z);
        
        // Hızlı kaç
        const speed = CONFIG.BOT_RUN_SPEED;
        const newX = this.position.x + fleeDir.x * speed * deltaTime;
        const newZ = this.position.z + fleeDir.z * speed * deltaTime;
        
        // Duvar kontrolü
        if (!this.checkWallCollision(newX, newZ, walls)) {
            this.position.x = newX;
            this.position.z = newZ;
        } else {
            // Duvar varsa yan yönde kaç
            const sideDir = new THREE.Vector3(-fleeDir.z, 0, fleeDir.x);
            this.position.x += sideDir.x * speed * deltaTime;
            this.position.z += sideDir.z * speed * deltaTime;
        }
        
        // Sınırlar içinde kal
        const halfSize = CONFIG.MAP_SIZE / 2 - 1;
        this.position.x = Math.max(-halfSize, Math.min(halfSize, this.position.x));
        this.position.z = Math.max(-halfSize, Math.min(halfSize, this.position.z));
        
        // Can yenile (kaçarken yavaşça iyileş)
        if (this.health < this.maxHealth) {
            this.health += deltaTime * 5; // Saniyede 5 can
        }
        
        // Can yenilendiyse veya süre dolduysa patrol'a dön
        if (this.health > this.maxHealth * 0.6 || this.stateTimer > 8) {
            this.state = BotState.PATROL;
            this.stateTimer = 0;
            this.target = null;
        }
    }
    
    // Ates etmeyi dene
    tryShoot(distance) {
        const now = Date.now();
        if (now - this.lastShot < this.fireRate) return null;
        
        this.lastShot = now;
        
        // Muzzle flash göster
        this.showMuzzleFlash();
        
        // Mesafe cezası
        const accuracyPenalty = Math.max(0, (distance - 10) * 0.02);
        const finalAccuracy = this.accuracy - accuracyPenalty;
        
        // Her zaman ateş ettiğini belirt
        const result = {
            shot: true,
            hit: false,
            damage: 0,
            target: this.target,
            targetType: this.targetType
        };
        
        if (Math.random() < finalAccuracy) {
            // Hasar hesapla - mesafeye göre azalan hasar
            const baseDamage = 15 + Math.floor(Math.random() * 10);
            const distancePenalty = Math.max(0.5, 1 - (distance / this.attackRange) * 0.3);
            result.damage = Math.floor(baseDamage * distancePenalty);
            result.hit = true;
        }
        
        return result;
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
        if (!this.flashlight || !this.flashlight.target) return;
        
        // Fener hedefini karakterin bakış yönüne göre world space'de güncelle
        const forwardX = Math.sin(this.rotation);
        const forwardZ = Math.cos(this.rotation);
        
        // Fener hedefini karakterin önünde 5 birim uzağa yerleştir
        this.flashlight.target.position.set(
            this.position.x + forwardX * 5,
            CONFIG.BOT_HEIGHT / 2 + 0.2, // Bot göz hizasında
            this.position.z + forwardZ * 5
        );
        
        // World transform'un güncellendiğinden emin ol
        this.flashlight.target.updateMatrixWorld(true);
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
        // Fener kola bagli oldugu icin parent'tan sil
        if (this.flashlight) {
            if (this.flashlight.parent) {
                this.flashlight.parent.remove(this.flashlight);
            }
            if (this.flashlight.target && this.flashlight.target.parent) {
                this.flashlight.target.parent.remove(this.flashlight.target);
            }
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
    
    // Tum botlari spawn et - rastgele ve farklı noktalar
    spawnAll(spawnPoints) {
        // Spawn noktalarını karıştır
        const shuffledPoints = [...spawnPoints].sort(() => Math.random() - 0.5);
        
        this.bots.forEach((bot, i) => {
            // Her bot için farklı bir spawn noktası seç
            const pointIndex = i % shuffledPoints.length;
            const basePoint = shuffledPoints[pointIndex];
            
            // Spawn noktasına rastgele offset ekle (birbirine yakın spawn olmamaları için)
            const offsetRange = 3;
            const spawnPoint = {
                x: basePoint.x + (Math.random() - 0.5) * offsetRange,
                z: basePoint.z + (Math.random() - 0.5) * offsetRange
            };
            
            bot.spawn(spawnPoint);
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
    
    // Botlari respawn et - rastgele noktada ve diğer botlardan uzakta
    respawnBots(botsToRespawn, spawnPoints) {
        botsToRespawn.forEach(bot => {
            // Yaşayan botların pozisyonlarını al
            const aliveBotPositions = this.bots
                .filter(b => b.isAlive && b !== bot)
                .map(b => b.position);
            
            // En uygun spawn noktasını bul (diğer botlardan en uzak)
            let bestPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            let maxMinDist = 0;
            
            // 3 deneme yap, en iyi noktayı seç
            for (let i = 0; i < 3; i++) {
                const testPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                
                // Bu noktanın diğer botlara olan minimum mesafesi
                let minDist = Infinity;
                aliveBotPositions.forEach(pos => {
                    const dist = Math.sqrt(
                        Math.pow(testPoint.x - pos.x, 2) + 
                        Math.pow(testPoint.z - pos.z, 2)
                    );
                    minDist = Math.min(minDist, dist);
                });
                
                // Daha uzak bir nokta bulduysak güncelle
                if (minDist > maxMinDist) {
                    maxMinDist = minDist;
                    bestPoint = testPoint;
                }
            }
            
            // Spawn noktasına rastgele offset ekle
            const spawnPoint = {
                x: bestPoint.x + (Math.random() - 0.5) * 2,
                z: bestPoint.z + (Math.random() - 0.5) * 2
            };
            
            bot.spawn(spawnPoint);
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