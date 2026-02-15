// Housefire Arena - HTTP Server
// Express tabanli statik dosya sunucusu

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    let filePath = req.url;
    
    // Ana sayfa
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }
    
    // Dosya yolunu belirle
    // locales klasoru icin ozel durum
    if (filePath.startsWith('/locales/')) {
        filePath = '.' + filePath;
    } else {
        filePath = './public' + filePath;
    }
    
    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 404 - Dosya bulunamadi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Sayfa Bulunamadi</h1>', 'utf-8');
            } else {
                // 500 - Sunucu hatasi
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<h1>500 - Sunucu Hatasi: ${err.code}</h1>`, 'utf-8');
            }
        } else {
            // Basarili
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
========================================
  HOUSEFIRE ARENA v0.1
========================================
  
  Sunucu calisiyor: http://localhost:${PORT}
  
  Dosya yapisi:
  - /            -> Ana sayfa
  - /js/*        -> JavaScript modulleri
  - /css/*       -> Stil dosyalari
  - /locales/*   -> Dil dosyalari (tr.json, en.json)
  
========================================
    `);
});
