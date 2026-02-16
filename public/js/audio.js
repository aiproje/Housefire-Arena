// Housefire Arena - Audio Module
// Ses sistemi ve efektleri

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        
        this.sounds = {};
        this.music = null;
        
        this.enabled = true;
        this.sfxVolume = 0.5;
        this.musicVolume = 0.3;
        
        this.soundsLoaded = false;
        this.soundLoadPromise = null;
        
        this.init();
    }
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            // SFX gain
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            // Music gain
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);
            
            // Ses dosyalarini yukle (async)
            this.soundLoadPromise = this.loadSounds().then(() => {
                this.soundsLoaded = true;
                console.log('Ses dosyalari yuklendi');
            }).catch((err) => {
                console.error('Ses dosyalari yuklenirken hata:', err);
                this.soundsLoaded = true; // Hata olsa bile devam et
            });
            
            // Sesleri olustur
            this.createSounds();
            
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    // Ses dosyalarini yukle
    async loadSounds() {
        this.soundBuffers = {};
        
        // Context'i resume et (browser politikasi)
        if (this.context.state === 'suspended') {
            await this.context.resume();
            console.log('[Audio] Context resume edildi');
        }
        
        const soundFiles = {
            single: 'gun_voices/single.mp3',
            double_tap: 'gun_voices/double_tap.mp3',
            burst: 'gun_voices/burst.mp3',
            spray: 'gun_voices/spray.mp3'
        };
        
        let loadedCount = 0;
        let failedCount = 0;
        
        try {
            for (const [name, path] of Object.entries(soundFiles)) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        this.soundBuffers[name] = await this.context.decodeAudioData(arrayBuffer);
                        console.log(`[Audio] Ses dosyasi yuklendi: ${name} (${path})`);
                        loadedCount++;
                    } else {
                        console.warn(`[Audio] Ses dosyasi bulunamadi: ${path} (HTTP ${response.status})`);
                        failedCount++;
                    }
                } catch (err) {
                    console.error(`[Audio] Ses dosyasi cozumleme hatasi: ${name}`, err);
                    failedCount++;
                }
            }
            console.log(`[Audio] Yukleme tamamlandi: ${loadedCount} basarili, ${failedCount} basarisiz`);
        } catch (e) {
            console.error('[Audio] Ses dosyalari yuklenirken hata:', e);
        }
    }
    
    // Ses dosyasi cal
    async playBuffer(name) {
        // Sesler yüklenene kadar bekle
        if (this.soundLoadPromise && !this.soundsLoaded) {
            await this.soundLoadPromise;
        }
        
        if (!this.soundBuffers[name]) return;
        
        const source = this.context.createBufferSource();
        source.buffer = this.soundBuffers[name];
        source.connect(this.sfxGain);
        source.start();
    }
    
    // Silah sesi cal (async)
    async playGunSound(name) {
        // Sesi cal
        if (this.soundBuffers[name]) {
            await this.playBuffer(name);
        } else {
            this.createGunSound(800, 0.1, 'square');
        }
    }
    
    // Silah sesi cal - async versiyon
    async playGunSoundBuffered(name) {
        if (!this.enabled || !this.context) return;
        
        // AudioContext'i resume et (browser politikasi) - beklemeden yap
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Sesler yüklenmemişsesen sentetik ses kullan - BEKLEME!
        // Bu, ilk ateşte lag'ı önlemek için önemli
        if (!this.soundsLoaded || !this.soundBuffers[name]) {
            // Arka planda sesleri yüklemeye devam et ama oyunu blocklama
            if (this.soundLoadPromise && !this.soundsLoaded) {
                this.soundLoadPromise.catch(() => {}); // Hataları sessizce yoksay
            }
            // Sentetik ses kullan
            this.createGunSound(800, 0.1, 'square');
            return;
        }
        
        // Ses dosyasini cal
        const source = this.context.createBufferSource();
        source.buffer = this.soundBuffers[name];
        source.connect(this.sfxGain);
        source.start();
    }
    
    // Sesleri olustur (prosedurel)
    createSounds() {
        // Tabanca - gercek ses
        this.sounds.pistol = async () => {
            await this.playGunSoundBuffered('single');
        };
        
        // Pompali - gercek ses
        this.sounds.shotgun = async () => {
            await this.playGunSoundBuffered('double_tap');
        };
        
        // Keskin nisanci - gercek ses
        this.sounds.sniper = async () => {
            await this.playGunSoundBuffered('single');
        };
        
        // Tufek - gercek ses
        this.sounds.rifle = async () => {
            await this.playGunSoundBuffered('burst');
        };
        
        // Spray - gercek ses
        this.sounds.spray = async () => {
            await this.playGunSoundBuffered('spray');
        };
        
        // Yakin dovus
        this.sounds.melee = () => this.createMeleeSound();
        
        // Vurus
        this.sounds.hit = () => this.createHitSound();
        
        // Olum
        this.sounds.death = () => this.createDeathSound();
        
        // Adim
        this.sounds.footstep = () => this.createFootstepSound();
        
        // Sarjor degistirme
        this.sounds.reload = () => this.createReloadSound();
        
        // UI
        this.sounds.click = () => this.createClickSound();
        
        // Satin alma
        this.sounds.purchase = () => this.createPurchaseSound();
        
        // Bomba
        this.sounds.explosion = () => this.createExplosionSound();
    }
    
    // Silah sesi olustur
    createGunSound(frequency, duration, waveType) {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(frequency, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + duration);
        
        // Gurultu ekle
        this.addNoise(duration * 0.5, 0.1);
    }
    
    // Gurultu ekle
    addNoise(duration, volume) {
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        noise.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start();
        noise.stop(this.context.currentTime + duration);
    }
    
    // Yakin dovus sesi
    createMeleeSound() {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }
    
    // Vurus sesi
    createHitSound() {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    }
    
    // Olum sesi
    createDeathSound() {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.5);
    }
    
    // Adim sesi
    createFootstepSound() {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.context.currentTime);
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    }
    
    // Sarjor sesi
    createReloadSound() {
        if (!this.enabled || !this.context) return;
        
        // Metal sesi
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.setValueAtTime(600, this.context.currentTime + 0.1);
        osc.frequency.setValueAtTime(1000, this.context.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.setValueAtTime(0.01, this.context.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }
    
    // UI tiklama
    createClickSound() {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.context.currentTime);
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    }
    
    // Satin alma sesi
    createPurchaseSound() {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.context.currentTime);
        osc.frequency.setValueAtTime(700, this.context.currentTime + 0.1);
        osc.frequency.setValueAtTime(900, this.context.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }
    
    // Patlama sesi
    createExplosionSound() {
        if (!this.enabled || !this.context) return;
        
        // Gurultu bazli patlama
        const bufferSize = this.context.sampleRate * 0.5;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.5);
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start();
        noise.stop(this.context.currentTime + 0.5);
    }
    
    // Ses cal
    play(soundName) {
        if (!this.enabled) return;
        
        // AudioContext'i resume et (browser politikasi)
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
        
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    // Ses cal (async versiyon)
    async playAsync(soundName) {
        if (!this.enabled) return;
        
        // AudioContext'i resume et (browser politikasi)
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
        
        if (this.sounds[soundName]) {
            await this.sounds[soundName]();
        }
    }
    
    // SFX ses seviyesi
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }
    
    // Muzik ses seviyesi
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }
    
    // Sesi ac/kapat
    toggle() {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.enabled ? 1 : 0;
        }
        return this.enabled;
    }
    
    // Context'i resume et
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}

// Global ornek
const audioManager = new AudioManager();