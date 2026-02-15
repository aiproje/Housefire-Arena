// Housefire Arena - Camera Module
// Kamera kontrolu - Sabit aci, karakter donusu

class CameraController {
    constructor(camera, config = {}) {
        this.camera = camera;
        
        // Kamera ayarlari
        this.height = config.height || CONFIG.CAMERA_HEIGHT;
        this.distance = config.distance || CONFIG.CAMERA_DISTANCE;
        this.angle = config.angle || CONFIG.CAMERA_ANGLE;
        
        // Hedef takip
        this.target = null;
        this.offset = new THREE.Vector3(0, 0, 0);
        
        // Sarsinti efekti
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = new THREE.Vector3();
        
        // Smooth follow
        this.smoothSpeed = 0.1;
        this.currentPosition = new THREE.Vector3();
    }
    
    // Takip edilecek hedef
    setTarget(target) {
        this.target = target;
    }
    
    // Kamera pozisyonunu guncelle
    update(deltaTime) {
        if (!this.target) return;
        
        // Hedef pozisyonu
        const targetPos = this.target.position.clone();
        
        // Izometrik kamera pozisyonu (sabit aci)
        const cameraX = targetPos.x;
        const cameraZ = targetPos.z + this.distance;
        const cameraY = this.height;
        
        // Smooth follow
        this.currentPosition.x += (cameraX - this.currentPosition.x) * this.smoothSpeed;
        this.currentPosition.y += (cameraY - this.currentPosition.y) * this.smoothSpeed;
        this.currentPosition.z += (cameraZ - this.currentPosition.z) * this.smoothSpeed;
        
        // Sarsinti efekti
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeOffset.set(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity
            );
            this.shakeIntensity *= 0.9; // Azalt
        } else {
            this.shakeOffset.set(0, 0, 0);
        }
        
        // Kamerayi uygula
        this.camera.position.copy(this.currentPosition).add(this.shakeOffset);
        
        // Hedefe bak
        this.camera.lookAt(targetPos.x, 0, targetPos.z);
    }
    
    // Sarsinti efekti ekle
    addShake(intensity, duration = 100) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }
    
    // Geri tepme efekti
    applyRecoil(amount) {
        this.addShake(amount * 0.5, 50);
    }
    
    // Aninda pozisyona git
    snapTo(position) {
        this.currentPosition.set(
            position.x,
            this.height,
            position.z + this.distance
        );
        this.camera.position.copy(this.currentPosition);
    }
    
    // Kamera mesafesini ayarla
    setDistance(distance) {
        this.distance = distance;
    }
    
    // Kamera yuksekligini ayarla
    setHeight(height) {
        this.height = height;
    }
    
    // Zoom efekti
    zoom(factor, duration = 500) {
        const targetDistance = this.distance * factor;
        const startDistance = this.distance;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            this.distance = startDistance + (targetDistance - startDistance) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // Ekrandaki pozisyona donustur
    worldToScreen(worldPos) {
        const vector = worldPos.clone();
        vector.project(this.camera);
        
        return {
            x: (vector.x + 1) / 2 * window.innerWidth,
            y: -(vector.y - 1) / 2 * window.innerHeight,
            z: vector.z
        };
    }
    
    // Ekrandaki pozisyondan dunya pozisyonuna
    screenToWorld(screenX, screenY, planeY = 0) {
        const vector = new THREE.Vector3(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = (planeY - this.camera.position.y) / dir.y;
        
        return this.camera.position.clone().add(dir.multiplyScalar(distance));
    }
    
    // Frustum icinde mi?
    isInFrustum(position, radius = 0) {
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projScreenMatrix);
        
        const sphere = new THREE.Sphere(position, radius);
        return frustum.intersectsSphere(sphere);
    }
}

// Izometrik kamera olusturucu
function createIsometricCamera(aspect = window.innerWidth / window.innerHeight) {
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, CONFIG.CAMERA_HEIGHT, CONFIG.CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    
    return camera;
}