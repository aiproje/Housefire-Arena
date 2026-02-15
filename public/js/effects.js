// Housefire Arena - Effects Module
// Gorsel efektler ve partikul sistemi

class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.footprints = [];
        this.trails = [];
        
        this.maxFootprints = CONFIG.MAX_FOOTPRINTS;
        this.maxParticles = 200;
    }
    
    // Kan sivi efekti
    createBloodSplatter(position, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 1
                })
            );
            particle.position.copy(position);
            particle.position.y = 1.2;
            this.scene.add(particle);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.3
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 60,
                maxLife: 60,
                gravity: true
            });
        }
    }
    
    // Kivilcim efekti
    createSparks(position, direction, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    transparent: true,
                    opacity: 1
                })
            );
            particle.position.copy(position);
            this.scene.add(particle);
            
            const velocity = new THREE.Vector3(
                direction.x * -0.2 + (Math.random() - 0.5) * 0.2,
                Math.random() * 0.3,
                direction.z * -0.2 + (Math.random() - 0.5) * 0.2
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 30,
                maxLife: 30,
                gravity: true
            });
        }
    }
    
    // Patlama efekti
    createExplosion(position, radius = 5) {
        // Isik
        const light = new THREE.PointLight(0xff4400, 5, 15);
        light.position.copy(position);
        light.position.y = 1;
        this.scene.add(light);
        
        // Isik fade out
        const fadeLight = () => {
            light.intensity -= 0.5;
            if (light.intensity > 0) {
                requestAnimationFrame(fadeLight);
            } else {
                this.scene.remove(light);
            }
        };
        setTimeout(fadeLight, 50);
        
        // Partikuller
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0xff4400 : 0xffaa00,
                    transparent: true,
                    opacity: 1
                })
            );
            particle.position.copy(position);
            particle.position.y = 1;
            this.scene.add(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.3;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 0.4,
                Math.sin(angle) * speed
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 60,
                maxLife: 60,
                gravity: true
            });
        }
        
        // Duman
        for (let i = 0; i < 10; i++) {
            const smoke = new THREE.Mesh(
                new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x444444,
                    transparent: true,
                    opacity: 0.6
                })
            );
            smoke.position.copy(position);
            smoke.position.y = 0.5 + Math.random();
            smoke.position.x += (Math.random() - 0.5) * 2;
            smoke.position.z += (Math.random() - 0.5) * 2;
            this.scene.add(smoke);
            
            this.particles.push({
                mesh: smoke,
                velocity: new THREE.Vector3(0, 0.02, 0),
                life: 120,
                maxLife: 120,
                gravity: false,
                scale: true,
                scaleSpeed: 0.02
            });
        }
    }
    
    // Ayak izi
    addFootprint(position, color = 0x00ff88) {
        // Limit kontrolu
        if (this.footprints.length >= this.maxFootprints) {
            const oldest = this.footprints.shift();
            this.scene.remove(oldest.mesh);
        }
        
        const footprint = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.5),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.6
            })
        );
        footprint.rotation.x = -Math.PI / 2;
        footprint.position.set(
            position.x + (Math.random() - 0.5) * 0.3,
            0.02,
            position.z + (Math.random() - 0.5) * 0.3
        );
        footprint.rotation.z = Math.random() * Math.PI;
        this.scene.add(footprint);
        
        this.footprints.push({
            mesh: footprint,
            life: CONFIG.FOOTPRINT_LIFETIME,
            maxLife: CONFIG.FOOTPRINT_LIFETIME
        });
    }
    
    // Mermi izi
    createBulletTrail(start, end, color = 0xffff00) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        // Daha belirgin mermi izi - daha kalın ve daha uzun
        const trail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, length * 2.5, 6),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0
            })
        );
        
        // Pozisyon ve rotasyon
        trail.position.copy(start).add(direction.multiplyScalar(0.5));
        trail.lookAt(end);
        trail.rotateX(Math.PI / 2);
        
        this.scene.add(trail);
        
        this.trails.push({
            mesh: trail,
            life: 60,
            maxLife: 60
        });
    }
    
    // Hasar indikatoru (ekranda)
    createDamageIndicator(direction) {
        const indicator = document.createElement('div');
        indicator.className = 'damage-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            margin: -50px 0 0 -50px;
            pointer-events: none;
            z-index: 100;
        `;
        
        // Ok isareti
        const arrow = document.createElement('div');
        const angle = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
        arrow.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 20px solid rgba(255, 0, 0, 0.8);
            transform: translateX(-50%) rotate(${angle}deg);
            transform-origin: center 50px;
        `;
        indicator.appendChild(arrow);
        document.body.appendChild(indicator);
        
        // Fade out
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.3s';
            setTimeout(() => indicator.remove(), 300);
        }, 500);
    }
    
    // Vurus isareti (crosshair'da)
    showHitMarker() {
        const marker = document.getElementById('hitMarker');
        if (marker) {
            marker.classList.remove('show');
            void marker.offsetWidth; // Reflow
            marker.classList.add('show');
        }
    }
    
    // Hasar flashi
    showDamageFlash() {
        let flash = document.querySelector('.damage-flash');
        if (!flash) {
            flash = document.createElement('div');
            flash.className = 'damage-flash';
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center, transparent 0%, rgba(255, 0, 0, 0.3) 100%);
                pointer-events: none;
                z-index: 99;
                opacity: 0;
                transition: opacity 0.1s;
            `;
            document.body.appendChild(flash);
        }
        
        flash.style.opacity = '1';
        setTimeout(() => {
            flash.style.opacity = '0';
        }, 100);
    }
    
    // Olum patlamasi - bot parcalanma efekti
    createDeathExplosion(position, color) {
        const pieceCount = 12;
        
        for (let i = 0; i < pieceCount; i++) {
            const size = 0.1 + Math.random() * 0.2;
            const piece = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                new THREE.MeshStandardMaterial({
                    color: color,
                    transparent: true,
                    opacity: 1
                })
            );
            
            piece.position.copy(position);
            piece.position.y += Math.random() * 1.5;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            
            this.scene.add(piece);
            
            this.particles.push({
                mesh: piece,
                velocity: velocity,
                life: 60 + Math.random() * 30,
                maxLife: 90,
                gravity: true,
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.2,
                    Math.random() * 0.2,
                    Math.random() * 0.2
                )
            });
        }
    }
    
    // Guncelleme
    update() {
        // Partikuller
        this.particles = this.particles.filter(p => {
            p.life--;
            
            // Hareket
            p.mesh.position.add(p.velocity);
            
            // Yercekimi
            if (p.gravity) {
                p.velocity.y -= 0.01;
            }
            
            // Olcek
            if (p.scale) {
                p.mesh.scale.addScalar(p.scaleSpeed);
            }
            
            // Opaklik
            p.mesh.material.opacity = p.life / p.maxLife;
            
            // Temizle
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                return false;
            }
            return true;
        });
        
        // Ayak izleri
        this.footprints = this.footprints.filter(fp => {
            fp.life--;
            fp.mesh.material.opacity = (fp.life / fp.maxLife) * 0.6;
            
            if (fp.life <= 0) {
                this.scene.remove(fp.mesh);
                fp.mesh.geometry.dispose();
                fp.mesh.material.dispose();
                return false;
            }
            return true;
        });
        
        // Mermi izleri
        this.trails = this.trails.filter(t => {
            t.life--;
            t.mesh.material.opacity = t.life / t.maxLife;
            
            if (t.life <= 0) {
                this.scene.remove(t.mesh);
                t.mesh.geometry.dispose();
                t.mesh.material.dispose();
                return false;
            }
            return true;
        });
    }
    
    // Temizle
    clear() {
        this.particles.forEach(p => {
            this.scene.remove(p.mesh);
        });
        this.particles = [];
        
        this.footprints.forEach(fp => {
            this.scene.remove(fp.mesh);
        });
        this.footprints = [];
        
        this.trails.forEach(t => {
            this.scene.remove(t.mesh);
        });
        this.trails = [];
    }
    
    // Dispose
    dispose() {
        this.clear();
    }
}