// Housefire Arena - Input Manager Module
// Klavye ve fare girdi yonetimi

class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldZ: 0,
            buttons: [false, false, false]
        };
        this.callbacks = {
            onKeyDown: [],
            onKeyUp: [],
            onMouseMove: [],
            onMouseDown: [],
            onMouseUp: []
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Klavye olaylari
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.callbacks.onKeyDown.forEach(cb => cb(e));
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.callbacks.onKeyUp.forEach(cb => cb(e));
        });
        
        // Fare olaylari - her zaman pozisyon takibi
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.callbacks.onMouseMove.forEach(cb => cb(e, this.mouse));
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
            this.callbacks.onMouseDown.forEach(cb => cb(e));
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
            this.callbacks.onMouseUp.forEach(cb => cb(e));
        });
    }
    
    // Tus kontrolu
    isKeyDown(key) {
        return this.keys[key.toLowerCase()] === true;
    }
    
    isKeyUp(key) {
        return this.keys[key.toLowerCase()] === false;
    }
    
    // Fare kontrolu
    isMouseDown(button = 0) {
        return this.mouse.buttons[button] === true;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    // World koordinatlarini set et (main.js'ten cagrilacak)
    setWorldMousePosition(worldX, worldZ) {
        this.mouse.worldX = worldX;
        this.mouse.worldZ = worldZ;
    }
    
    getWorldMousePosition() {
        return { x: this.mouse.worldX, z: this.mouse.worldZ };
    }
    
    // Fare ekran pozisyonunu world koordinatlarina cevir (raycasting)
    calculateWorldMousePosition(camera, playerPosition) {
        // Normalize edilmis ekran koordinatlari (-1 to 1)
        const normalizedX = (this.mouse.x / window.innerWidth) * 2 - 1;
        const normalizedY = -(this.mouse.y / window.innerHeight) * 2 + 1;
        
        // Raycaster olustur
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), camera);
        
        // Zemin duzleminde kesisim noktasi bul (y = 0.5, karakter yuksekligi)
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
            this.mouse.worldX = intersection.x;
            this.mouse.worldZ = intersection.z;
            return { x: intersection.x, z: intersection.z };
        }
        
        // Kesisim yoksa mevcut degerleri dondur
        return { x: this.mouse.worldX, z: this.mouse.worldZ };
    }
    
    // Olay dinleyici ekleme
    on(event, callback) {
        const eventMap = {
            'keydown': this.callbacks.onKeyDown,
            'keyup': this.callbacks.onKeyUp,
            'mousemove': this.callbacks.onMouseMove,
            'mousedown': this.callbacks.onMouseDown,
            'mouseup': this.callbacks.onMouseUp,
            'pointerlockchange': this.callbacks.onPointerLockChange
        };
        
        if (eventMap[event]) {
            eventMap[event].push(callback);
        }
    }
    
    // Olay dinleyici kaldirma
    off(event, callback) {
        const eventMap = {
            'keydown': this.callbacks.onKeyDown,
            'keyup': this.callbacks.onKeyUp,
            'mousemove': this.callbacks.onMouseMove,
            'mousedown': this.callbacks.onMouseDown,
            'mouseup': this.callbacks.onMouseUp,
            'pointerlockchange': this.callbacks.onPointerLockChange
        };
        
        if (eventMap[event]) {
            const index = eventMap[event].indexOf(callback);
            if (index > -1) {
                eventMap[event].splice(index, 1);
            }
        }
    }
    
    // Hareket vektoru hesapla (WASD) - izometrik kamera bagimsiz
    getMovementVector() {
        let dx = 0, dz = 0;
        
        // Ekran koordinatlarinda hareket (izometrik icin)
        if (this.isKeyDown('w')) dz -= 1; // Kuzey
        if (this.isKeyDown('s')) dz += 1; // Guney
        if (this.isKeyDown('a')) dx -= 1; // Bati
        if (this.isKeyDown('d')) dx += 1; // Dogu
        
        // Normalize et
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
            dx /= len;
            dz /= len;
        }
        
        return { x: dx, z: dz, moving: len > 0 };
    }
    
    // Kosuyor mu?
    isRunning() {
        return this.isKeyDown('shift');
    }
}

// Global ornek
const inputManager = new InputManager();