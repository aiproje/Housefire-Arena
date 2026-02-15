// Housefire Arena - Map Module
// Harita, odalar ve kapilar

class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.doors = [];
        this.roomLights = [];
        this.floor = null;
        
        this.createFloor();
        this.createRooms();
        this.createOuterWalls();
    }
    
    // Zemin olustur
    createFloor() {
        const floorGeo = new THREE.PlaneGeometry(CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a25,
            roughness: 0.8,
            metalness: 0.1
        });
        this.floor = new THREE.Mesh(floorGeo, floorMat);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
    }
    
    // Odalari olustur
    createRooms() {
        ROOM_LAYOUT.forEach((room, index) => {
            this.createRoom(room, index);
        });
    }
    
    // Tek oda olustur
    createRoom(room, index) {
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a35,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const thickness = CONFIG.WALL_THICKNESS;
        const doorWidth = CONFIG.DOOR_WIDTH;
        
        // Duvar pozisyonlari
        const wallPositions = [
            { side: 'north', x: room.x, z: room.z - room.h / 2, sx: room.w, sz: thickness, door: 'south' },
            { side: 'south', x: room.x, z: room.z + room.h / 2, sx: room.w, sz: thickness, door: 'north' },
            { side: 'west', x: room.x - room.w / 2, z: room.z, sx: thickness, sz: room.h, door: 'east' },
            { side: 'east', x: room.x + room.w / 2, z: room.z, sx: thickness, sz: room.h, door: 'west' }
        ];
        
        wallPositions.forEach(wp => {
            // Bu duvarda kapi var mi?
            const hasDoor = room.doors && room.doors.includes(wp.door);
            
            if (hasDoor) {
                // Kapili duvar - iki parca
                this.createWallWithDoor(wp, room, wallMat, doorWidth);
            } else {
                // Kapisi olmayan duvar
                this.createSolidWall(wp, wallMat);
            }
        });
        
        // Oda isigi
        this.createRoomLight(room);
    }
    
    // Kapili duvar olustur
    createWallWithDoor(wp, room, material, doorWidth) {
        const thickness = CONFIG.WALL_THICKNESS;
        const wallHeight = CONFIG.WALL_HEIGHT;
        
        // Kapi acikligi hesapla
        const isHorizontal = wp.sx > wp.sz;
        const totalLength = isHorizontal ? wp.sx : wp.sz;
        const doorStart = (totalLength - doorWidth) / 2;
        const doorEnd = doorStart + doorWidth;
        
        if (isHorizontal) {
            // Yatay duvar (kuzey/guney)
            // Sol parca
            if (doorStart > 0.5) {
                const leftWall = new THREE.Mesh(
                    new THREE.BoxGeometry(doorStart, wallHeight, thickness),
                    material
                );
                leftWall.position.set(
                    wp.x - totalLength / 2 + doorStart / 2,
                    wallHeight / 2,
                    wp.z
                );
                leftWall.castShadow = true;
                leftWall.receiveShadow = true;
                this.scene.add(leftWall);
                this.walls.push(leftWall);
            }
            
            // Sag parca
            if (totalLength - doorEnd > 0.5) {
                const rightWall = new THREE.Mesh(
                    new THREE.BoxGeometry(totalLength - doorEnd, wallHeight, thickness),
                    material
                );
                rightWall.position.set(
                    wp.x + totalLength / 2 - (totalLength - doorEnd) / 2,
                    wallHeight / 2,
                    wp.z
                );
                rightWall.castShadow = true;
                rightWall.receiveShadow = true;
                this.scene.add(rightWall);
                this.walls.push(rightWall);
            }
            
            // Kapi ust parca
            const topWall = new THREE.Mesh(
                new THREE.BoxGeometry(doorWidth, wallHeight * 0.3, thickness),
                material
            );
            topWall.position.set(
                wp.x,
                wallHeight * 0.85,
                wp.z
            );
            this.scene.add(topWall);
            this.walls.push(topWall);
            
        } else {
            // Dikey duvar (dogu/bati)
            // Alt parca
            if (doorStart > 0.5) {
                const bottomWall = new THREE.Mesh(
                    new THREE.BoxGeometry(thickness, wallHeight, doorStart),
                    material
                );
                bottomWall.position.set(
                    wp.x,
                    wallHeight / 2,
                    wp.z - totalLength / 2 + doorStart / 2
                );
                bottomWall.castShadow = true;
                bottomWall.receiveShadow = true;
                this.scene.add(bottomWall);
                this.walls.push(bottomWall);
            }
            
            // Ust parca
            if (totalLength - doorEnd > 0.5) {
                const topWall = new THREE.Mesh(
                    new THREE.BoxGeometry(thickness, wallHeight, totalLength - doorEnd),
                    material
                );
                topWall.position.set(
                    wp.x,
                    wallHeight / 2,
                    wp.z + totalLength / 2 - (totalLength - doorEnd) / 2
                );
                topWall.castShadow = true;
                topWall.receiveShadow = true;
                this.scene.add(topWall);
                this.walls.push(topWall);
            }
            
            // Kapi ust parca
            const overDoor = new THREE.Mesh(
                new THREE.BoxGeometry(thickness, wallHeight * 0.3, doorWidth),
                material
            );
            overDoor.position.set(
                wp.x,
                wallHeight * 0.85,
                wp.z
            );
            this.scene.add(overDoor);
            this.walls.push(overDoor);
        }
        
        // Kapi cercevesi (gorsel)
        this.createDoorFrame(wp, isHorizontal, doorWidth);
    }
    
    // Kapi cercevesi olustur
    createDoorFrame(wp, isHorizontal, doorWidth) {
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x4a3520,
            roughness: 0.6
        });
        
        const frameThickness = 0.1;
        const frameHeight = CONFIG.WALL_HEIGHT * 0.7;
        
        if (isHorizontal) {
            // Sol cerceve
            const leftFrame = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
                frameMat
            );
            leftFrame.position.set(
                wp.x - doorWidth / 2,
                frameHeight / 2,
                wp.z
            );
            this.scene.add(leftFrame);
            
            // Sag cerceve
            const rightFrame = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
                frameMat
            );
            rightFrame.position.set(
                wp.x + doorWidth / 2,
                frameHeight / 2,
                wp.z
            );
            this.scene.add(rightFrame);
        } else {
            // Alt cerceve
            const bottomFrame = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
                frameMat
            );
            bottomFrame.position.set(
                wp.x,
                frameHeight / 2,
                wp.z - doorWidth / 2
            );
            this.scene.add(bottomFrame);
            
            // Ust cerceve
            const topFrame = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
                frameMat
            );
            topFrame.position.set(
                wp.x,
                frameHeight / 2,
                wp.z + doorWidth / 2
            );
            this.scene.add(topFrame);
        }
    }
    
    // Duvar olustur (kapisiz)
    createSolidWall(wp, material) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(wp.sx, CONFIG.WALL_HEIGHT, wp.sz),
            material
        );
        wall.position.set(wp.x, CONFIG.WALL_HEIGHT / 2, wp.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        this.walls.push(wall);
    }
    
    // Dis duvarlar
    createOuterWalls() {
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x151520,
            roughness: 0.6,
            metalness: 0.2
        });
        
        const size = CONFIG.MAP_SIZE;
        const t = 0.5;
        const h = CONFIG.WALL_HEIGHT;
        
        const outerWalls = [
            { x: 0, z: -size / 2 - t / 2, sx: size + t * 2, sz: t },
            { x: 0, z: size / 2 + t / 2, sx: size + t * 2, sz: t },
            { x: -size / 2 - t / 2, z: 0, sx: t, sz: size },
            { x: size / 2 + t / 2, z: 0, sx: t, sz: size }
        ];
        
        outerWalls.forEach(p => {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(p.sx, h, p.sz),
                wallMat
            );
            wall.position.set(p.x, h / 2, p.z);
            wall.castShadow = true;
            this.scene.add(wall);
            this.walls.push(wall);
        });
    }
    
    // Oda isigi
    createRoomLight(room) {
        const light = new THREE.PointLight(0xffffee, 0.8, 15);
        light.position.set(room.x, CONFIG.WALL_HEIGHT - 0.5, room.z);
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        this.scene.add(light);
        this.roomLights.push(light);
    }
    
    // Isiklari ac/kapat (dark mode)
    setLightsEnabled(enabled) {
        this.roomLights.forEach(light => {
            light.intensity = enabled ? 0.8 : 0;
        });
    }
    
    // Tum duvarlari dondur
    getWalls() {
        return this.walls;
    }
    
    // Rastgele spawn noktasi
    getRandomSpawnPoint() {
        const room = ROOM_LAYOUT[Math.floor(Math.random() * ROOM_LAYOUT.length)];
        return {
            x: room.x + (Math.random() - 0.5) * (room.w - 2),
            z: room.z + (Math.random() - 0.5) * (room.h - 2)
        };
    }
    
    // Guvenli spawn noktasi (diger oyunculardan uzak)
    getSafeSpawnPoint(positions, minDistance = 10) {
        for (let attempt = 0; attempt < 20; attempt++) {
            const point = this.getRandomSpawnPoint();
            
            let isSafe = true;
            for (const pos of positions) {
                const dist = Math.sqrt(
                    Math.pow(point.x - pos.x, 2) +
                    Math.pow(point.z - pos.z, 2)
                );
                if (dist < minDistance) {
                    isSafe = false;
                    break;
                }
            }
            
            if (isSafe) {
                return point;
            }
        }
        
        // Guvenli nokta bulunamadi, rastgele dondur
        return this.getRandomSpawnPoint();
    }
    
    // Temizle
    dispose() {
        // Zemin
        if (this.floor) {
            this.scene.remove(this.floor);
            this.floor.geometry.dispose();
            this.floor.material.dispose();
        }
        
        // Duvarlar
        this.walls.forEach(wall => {
            this.scene.remove(wall);
            wall.geometry.dispose();
            wall.material.dispose();
        });
        this.walls = [];
        
        // Isiklar
        this.roomLights.forEach(light => {
            this.scene.remove(light);
        });
        this.roomLights = [];
    }
}