// Housefire Arena - Weapons Module
// Silah sistemi ve mermi yonetimi

class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
        this.muzzleFlashes = [];
    }
    
    // Mermi olustur
    createBullet(position, direction, weapon, effects) {
        const bullet = {
            position: position.clone(),
            position3D: new THREE.Vector3(position.x, 1.5, position.z),
            direction: direction.clone(),
            weapon: weapon,
            life: Math.ceil(weapon.range / 2),
            speed: 2,
            damage: weapon.damage,
            color: weapon.color
        };
        
        // 3D mesh
        const bulletGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const bulletMat = new THREE.MeshBasicMaterial({ 
            color: weapon.color,
            transparent: true,
            opacity: 0.9
        });
        bullet.mesh = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.mesh.position.copy(bullet.position3D);
        this.scene.add(bullet.mesh);
        
        // Muzzle flash
        this.createMuzzleFlash(position, direction, weapon);
        
        // Pellet (shotgun icin)
        if (weapon.pellets && weapon.pellets > 1) {
            for (let i = 1; i < weapon.pellets; i++) {
                const spreadDir = direction.clone();
                spreadDir.x += (Math.random() - 0.5) * weapon.spread;
                spreadDir.z += (Math.random() - 0.5) * weapon.spread;
                spreadDir.normalize();
                
                const pellet = {
                    position: position.clone(),
                    position3D: new THREE.Vector3(position.x, 1.5, position.z),
                    direction: spreadDir,
                    weapon: weapon,
                    life: Math.ceil(weapon.range / 2),
                    speed: 2,
                    damage: weapon.damage / weapon.pellets,
                    color: weapon.color,
                    mesh: null
                };
                
                // Pellet mesh (daha kucuk)
                const pelletGeo = new THREE.SphereGeometry(0.04, 6, 6);
                const pelletMat = new THREE.MeshBasicMaterial({ 
                    color: weapon.color,
                    transparent: true,
                    opacity: 0.7
                });
                pellet.mesh = new THREE.Mesh(pelletGeo, pelletMat);
                pellet.mesh.position.copy(pellet.position3D);
                this.scene.add(pellet.mesh);
                
                this.bullets.push(pellet);
            }
        }
        
        this.bullets.push(bullet);
        return bullet;
    }
    
    // Muzzle flash efekti
    createMuzzleFlash(position, direction, weapon) {
        const flashSize = weapon.id === 'shotgun' ? 0.5 : 
                          weapon.id === 'sniper' ? 0.6 : 
                          weapon.id === 'rifle' ? 0.3 : 0.25;
        
        const flashGeo = new THREE.SphereGeometry(flashSize, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.set(position.x, 1.5, position.z);
        flash.position.add(direction.clone().multiplyScalar(0.8));
        this.scene.add(flash);
        
        // Isik efekti
        const light = new THREE.PointLight(0xffff00, 2, 5);
        light.position.copy(flash.position);
        this.scene.add(light);
        
        // Fade out animasyonu
        const fadeOut = () => {
            flashMat.opacity -= 0.15;
            light.intensity -= 0.3;
            
            if (flashMat.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(flash);
                this.scene.remove(light);
                flashMat.dispose();
                flashGeo.dispose();
            }
        };
        
        requestAnimationFrame(fadeOut);
    }
    
    // Mermileri guncelle
    update(walls, bots, player, effects) {
        const hits = [];
        
        this.bullets = this.bullets.filter(bullet => {
            // Hareket
            bullet.position3D.add(bullet.direction.clone().multiplyScalar(bullet.speed));
            bullet.life--;
            
            // Mesh guncelle
            if (bullet.mesh) {
                bullet.mesh.position.copy(bullet.position3D);
            }
            
            // Duvar carptimi?
            let hitWall = false;
            for (const wall of walls) {
                const box = new THREE.Box3().setFromObject(wall);
                if (box.containsPoint(bullet.position3D)) {
                    hitWall = true;
                    // Duvar carpmasi efekti
                    if (effects) {
                        effects.createSparks(bullet.position3D, bullet.direction);
                    }
                    break;
                }
            }
            
            // Bot carptimi?
            if (!hitWall && bots) {
                for (const bot of bots) {
                    if (bot.isAlive) {
                        const dist = bullet.position3D.distanceTo(bot.position);
                        if (dist < 0.8) {
                            // Hasar ver
                            const result = bot.takeDamage(bullet.damage);
                            hits.push({
                                bot: bot,
                                damage: bullet.damage,
                                died: result.died
                            });
                            hitWall = true; // Mermiyi yok et
                            
                            // Kan efekti
                            if (effects) {
                                effects.createBloodSplatter(bot.position);
                            }
                            break;
                        }
                    }
                }
            }
            
            // Oyuncu carptimi? (botlarin mermileri icin)
            if (!hitWall && player && player.isAlive && bullet.isEnemy) {
                const dist = bullet.position3D.distanceTo(player.position);
                if (dist < 0.8) {
                    // Oyuncuya hasar
                    const result = player.takeDamage(bullet.damage);
                    hits.push({
                        player: player,
                        damage: bullet.damage,
                        died: result.isDead
                    });
                    hitWall = true;
                    
                    if (effects) {
                        effects.createBloodSplatter(player.position);
                    }
                }
            }
            
            // Mermi suresi doldu veya carpti
            if (bullet.life <= 0 || hitWall) {
                if (bullet.mesh) {
                    this.scene.remove(bullet.mesh);
                }
                return false;
            }
            
            return true;
        });
        
        return hits;
    }
    
    // Mermi sayisi
    getBulletCount() {
        return this.bullets.length;
    }
    
    // Temizle
    clear() {
        this.bullets.forEach(bullet => {
            if (bullet.mesh) {
                this.scene.remove(bullet.mesh);
            }
        });
        this.bullets = [];
    }
    
    // Dispose
    dispose() {
        this.clear();
    }
}

// Silah modeli olusturucu
class WeaponModelFactory {
    static createWeaponModel(weaponId) {
        const weapon = WEAPONS[weaponId];
        if (!weapon) return null;
        
        let geometry, material;
        
        switch (weaponId) {
            case 'pistol':
                geometry = new THREE.BoxGeometry(0.1, 0.15, 0.35);
                material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 });
                break;
                
            case 'shotgun':
                geometry = new THREE.BoxGeometry(0.12, 0.12, 0.7);
                material = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 });
                break;
                
            case 'sniper':
                geometry = new THREE.BoxGeometry(0.08, 0.1, 0.9);
                material = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });
                break;
                
            case 'rifle':
                geometry = new THREE.BoxGeometry(0.1, 0.15, 0.6);
                material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 });
                break;
                
            case 'stick':
                geometry = new THREE.CylinderGeometry(0.03, 0.04, 0.8, 8);
                material = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
                material = new THREE.MeshStandardMaterial({ color: 0x333333 });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        
        return mesh;
    }
    
    // Silah ikonu (UI icin)
    static getWeaponIcon(weaponId) {
        const icons = {
            pistol: 'P',
            shotgun: 'S',
            sniper: 'R',
            rifle: 'A',
            stick: '|'
        };
        return icons[weaponId] || '?';
    }
}