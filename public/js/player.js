// Housefire Arena - Player Module
// Oyuncu karakteri yonetimi

class Player {
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Pozisyon ve donus
        this.position = new THREE.Vector3(0, CONFIG.PLAYER_HEIGHT / 2, 0);
        this.rotation = 0;
        this.velocity = new THREE.Vector3();
        
        // Durum
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.isDead = false;
        
        // Envanter
        this.money = CONFIG.STARTING_MONEY;
        this.weapons = ['pistol']; // Baslangicta sadece pistol
        this.currentWeapon = 'pistol';
        this.ammo = {
            shotgun: 0,
            sniper: 0,
            rifle: 0
        };
        this.grenades = 0;
        this.helmet = false;
        
        // Ates
        this.lastShot = 0;
        this.isReloading = false;
        
        // Istatistikler
        this.kills = 0;
        this.deaths = 0;
        
        // 3D model
        this.mesh = null;
        this.weaponMesh = null;
        this.flashlight = null;
        
        this.createMesh();
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
            new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.7 })
        );
        torso.position.y = 0.8;
        torso.castShadow = true;
        this.mesh.add(torso);
        
        // Sol kol - silah tutan kol - ASAGIYA BAKMALI
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.7 })
        );
        leftArm.position.set(-0.5, 0.75, 0);  // Omuz seviyesinden asagi
        // leftArm.rotation.x = 0;  // Dikey (asagiya) pozisyon - varsayilan deger
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        this.leftArm = leftArm;
        
        // Sag kol - destek kol - ILERIYE BAKMALI
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.7 })
        );
        rightArm.position.set(0.5, 1.1, 0);  // Omuz seviyesi
        rightArm.rotation.x = Math.PI / 2;  // Yatay pozisyon (ileriye)
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        this.rightArm = rightArm;
        
        console.log('[DEBUG] Right arm initial rotation:', rightArm.rotation);
        
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
        
        // Silah modeli
        this.createWeaponMesh();
    }
    
    createWeaponMesh() {
        // Silah gosterimi (basit kutu)
        const weaponGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
        const weaponMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3
        });
        this.weaponMesh = new THREE.Mesh(weaponGeo, weaponMat);
        this.weaponMesh.position.set(0.4, 1.0, 0.3);  // Göz hizasında nişan
        this.mesh.add(this.weaponMesh);
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
    }
    
    // Hareket guncelle
    update(deltaTime, input, walls) {
        if (!this.isAlive) return;
        
        // Hiz belirle
        const speed = input.isRunning() ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_SPEED;
        
        // Hareket vektoru
        const move = input.getMovementVector();
        
        // Yeni pozisyon hesapla
        const newX = this.position.x + move.x * speed * deltaTime;
        const newZ = this.position.z + move.z * speed * deltaTime;
        
        // Carpisma kontrolu
        if (this.canMove(newX, this.position.z, walls)) {
            this.position.x = newX;
        }
        if (this.canMove(this.position.x, newZ, walls)) {
            this.position.z = newZ;
        }
        
        // Mesh guncelle
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        
        // Fener guncelle
        this.updateFlashlight();
    }
    
    // Fare ile donus
    rotate(mouseDelta) {
        this.rotation += mouseDelta.x * 0.003;
    }
    
    // Hedef world pozisyonuna don
    rotateTowards(targetWorldPosition) {
        // Hedef noktaya bakacak sekilde rotation hesapla
        const angle = Math.atan2(
            this.position.x - targetWorldPosition.x,
            this.position.z - targetWorldPosition.z
        );
        this.rotation = angle;
    }
    
    // Hareket edebilir mi?
    canMove(x, z, walls) {
        const halfSize = CONFIG.MAP_SIZE / 2;
        const radius = CONFIG.PLAYER_RADIUS;
        
        // Player radius dahil edilerek sinir kontrolu
        if (x < -halfSize + radius || x > halfSize - radius || 
            z < -halfSize + radius || z > halfSize - radius) {
            console.log('[Collision] Boundary hit:', { x, z, halfSize, radius });
            return false;
        }
        
        // Player radius dahil edilerek duvar kontrolu
        for (const wall of walls) {
            const box = new THREE.Box3().setFromObject(wall);
            
            // Playeri bir nokta yerine kure olarak kontrol et
            const playerSphere = new THREE.Sphere(
                new THREE.Vector3(x, CONFIG.PLAYER_HEIGHT / 2, z),
                radius
            );
            
            if (box.intersectsSphere(playerSphere)) {
                console.log('[Collision] Wall hit:', { x, z, wallPos: wall.position.toArray() });
                return false;
            }
        }
        return true;
    }
    
    // Fener guncelle
    updateFlashlight() {
        // Fener artik kola bagli oldugu icin otomatik olarak karakterle birlikte doner
        // Sadece hedef pozisyonunu guncel tut
        if (this.flashlight && this.flashlight.target) {
            // Hedefi karakterin onune yerlestir (local space'de)
            this.flashlight.target.position.set(0, -0.2, 5);
        }
    }
    
    // Fener ac/kapat
    setFlashlightEnabled(enabled) {
        this.flashlight.intensity = enabled ? 1.5 : 0;
    }
    
    // Ates et
    shoot(bots, walls, effects, audio) {
        if (!this.isAlive || this.isReloading) return null;
        
        const now = Date.now();
        const weapon = WEAPONS[this.currentWeapon];
        
        if (!weapon) return null;
        
        // Ates hizi kontrolu
        if (now - this.lastShot < weapon.fireRate) return null;
        
        // Mermi kontrolu
        if (weapon.ammo !== Infinity) {
            if ((this.ammo[this.currentWeapon] || 0) <= 0) {
                return { outOfAmmo: true };
            }
            this.ammo[this.currentWeapon]--;
        }
        
        this.lastShot = now;
        
        // Yon vektoru
        const dir = new THREE.Vector3(
            -Math.sin(this.rotation),
            0,
            -Math.cos(this.rotation)
        );
        
        // Silah animasyonu
        this.playWeaponAnimation(weapon.animation);
        
        // Geri tepme
        this.applyRecoil(weapon.recoil);
        
        // Mermi ve efekt olustur
        const bulletData = {
            position: this.position.clone(),
            direction: dir,
            weapon: weapon,
            color: weapon.color
        };
        
        // Hedef kontrolu - ONCE duvar kontrolu yap!
        let hitResult = null;
        
        // Oyuncu pozisyonundan silah mesafesini hesapla
        const shootOrigin = this.position.clone();
        shootOrigin.y = CONFIG.PLAYER_HEIGHT * 0.8; // Goz hizasi
        
        // Duvarlari kontrol et - eger duvar varsa hedefi vuramaz
        let wallInWay = false;
        if (walls && walls.length > 0) {
            const raycaster = new THREE.Raycaster(shootOrigin, dir, 0, weapon.range);
            const wallIntersects = raycaster.intersectObjects(walls);
            if (wallIntersects.length > 0) {
                wallInWay = true;
            }
        }
        
        // Sadece duvar yoksa hedefi kontrol et
        if (!wallInWay) {
            bots.forEach((bot, i) => {
                if (bot.isAlive && !hitResult) {
                    const dist = this.position.distanceTo(bot.position);
                    if (dist <= weapon.range) {
                        const toBot = new THREE.Vector3().subVectors(bot.position, this.position).normalize();
                        if (toBot.dot(dir) > 0.85) {
                            hitResult = {
                                bot: bot,
                                index: i,
                                distance: dist
                            };
                        }
                    }
                }
            });
        }
        
        return {
            bullet: bulletData,
            hit: hitResult,
            weapon: weapon
        };
    }
    
    // Silah animasyonu
    playWeaponAnimation(type) {
        if (!this.weaponMesh) return;
        
        const originalPos = { x: 0.4, y: 0.3, z: 0.3 };
        let animData;
        
        switch (type) {
            case 'single':
                animData = [
                    { t: 0, z: 0.3 },
                    { t: 50, z: 0.1 },
                    { t: 100, z: 0.3 }
                ];
                break;
            case 'pump':
                animData = [
                    { t: 0, z: 0.3, ry: 0 },
                    { t: 100, z: 0.1 },
                    { t: 200, z: 0.1, ry: -0.3 },
                    { t: 400, z: 0.3, ry: 0 }
                ];
                break;
            case 'bolt':
                animData = [
                    { t: 0, z: 0.3, ry: 0 },
                    { t: 100, z: 0.1 },
                    { t: 300, z: 0.1, ry: 0.5 },
                    { t: 500, z: 0.3, ry: 0 }
                ];
                break;
            case 'auto':
                animData = [
                    { t: 0, z: 0.3 },
                    { t: 30, z: 0.2 },
                    { t: 60, z: 0.3 }
                ];
                break;
            case 'swing':
                animData = [
                    { t: 0, rx: 0 },
                    { t: 100, rx: -1 },
                    { t: 200, rx: 0 }
                ];
                break;
        }
        
        // Basit animasyon (gercek implementasyonda requestAnimationFrame kullanilacak)
        if (animData && animData.length > 1) {
            this.weaponMesh.position.z = animData[1].z || originalPos.z;
            setTimeout(() => {
                if (this.weaponMesh) {
                    this.weaponMesh.position.z = originalPos.z;
                }
            }, animData[animData.length - 1].t);
        }
    }
    
    // Geri tepme
    applyRecoil(amount) {
        // Kamera/silah sarsintisi
        // Bu kamera modulunde uygulanacak
    }
    
    // Hasar al
    takeDamage(amount, isHeadshot = false) {
        if (!this.isAlive) return;
        
        let damage = amount;
        
        // Kask korumas
        if (isHeadshot && this.helmet) {
            damage *= 0.8;
        }
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        return { damage: damage, isDead: !this.isAlive };
    }
    
    // Olum
    die() {
        this.isAlive = false;
        this.isDead = true;
        this.deaths++;
        this.mesh.visible = false;
    }
    
    // Yeniden dog
    respawn(spawnPoints) {
        const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        this.position.set(point.x, CONFIG.PLAYER_HEIGHT / 2, point.z);
        this.health = this.maxHealth;
        this.isAlive = true;
        this.isDead = false;
        this.mesh.visible = true;
        this.rotation = Math.random() * Math.PI * 2;
    }
    
    // Silah ekle
    addWeapon(weaponId) {
        if (!this.weapons.includes(weaponId)) {
            this.weapons.push(weaponId);
            // Silahla birlikte mermi ver
            const weapon = WEAPONS[weaponId];
            if (weapon && weapon.ammo !== Infinity) {
                this.ammo[weaponId] = weapon.maxAmmo;
            }
        }
    }
    
    // Silah sec
    selectWeapon(weaponId) {
        if (this.weapons.includes(weaponId)) {
            this.currentWeapon = weaponId;
            this.updateWeaponMesh();
            return true;
        }
        return false;
    }
    
    // Silah modelini guncelle
    updateWeaponMesh() {
        const weapon = WEAPONS[this.currentWeapon];
        if (!weapon || !this.weaponMesh) return;
        
        // Silah boyutunu tipine gore ayarla
        const scales = {
            pistol: { x: 0.15, y: 0.15, z: 0.4 },
            shotgun: { x: 0.18, y: 0.18, z: 0.8 },
            sniper: { x: 0.12, y: 0.12, z: 1.0 },
            rifle: { x: 0.15, y: 0.2, z: 0.7 },
            stick: { x: 0.08, y: 0.08, z: 0.8 }
        };
        
        const scale = scales[this.currentWeapon] || scales.pistol;
        this.weaponMesh.scale.set(scale.x, scale.y, scale.z);
    }
    
    // Sifa al
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    // Mermi ekle
    addAmmo(weaponId, amount) {
        if (this.ammo.hasOwnProperty(weaponId)) {
            this.ammo[weaponId] += amount;
        }
    }
    
    // Para ekle
    addMoney(amount) {
        this.money += amount;
    }
    
    // Temizle
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
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