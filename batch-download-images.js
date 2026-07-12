const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

const textToImageRegex = /https:\/\/trae-api-cn\.mchost\.guru\/api\/ide\/v1\/text_to_image\?prompt=([^&]+)&image_size=([a-z_0-9]+)/g;

const imagesToDownload = [];
let match;

while ((match = textToImageRegex.exec(htmlContent)) !== null) {
    const fullUrl = match[0];
    const prompt = decodeURIComponent(match[1]);
    const size = match[2];
    imagesToDownload.push({ fullUrl, prompt, size });
}

console.log(`Found ${imagesToDownload.length} text_to_image URLs in HTML`);
console.log('Unique images:', new Set(imagesToDownload.map(i => i.prompt + '|' + i.size)).size);
console.log('');

function fetchImage(urlStr, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error('Too many redirects'));
            return;
        }
        
        const parsedUrl = new URL(urlStr);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const req = client.get(options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers['location']) {
                const redirectUrl = new URL(res.headers['location'], urlStr).href;
                fetchImage(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
                return;
            }
            
            let data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                resolve({ status: res.statusCode, contentType: res.headers['content-type'], buffer });
            });
        });
        
        req.on('error', reject);
    });
}

function getImageFolder(index, prompt) {
    if (prompt.includes('face mask') || prompt.includes('opera face')) return 'faces';
    if (prompt.includes('cartoon') || prompt.includes('chibi character')) return 'characters';
    if (prompt.includes('green plum wine') && prompt.includes('custom')) return 'products';
    if (prompt.includes('green plum wine bottle') && prompt.includes('red label')) return 'products';
    if (prompt.includes('gift box') || prompt.includes('gift bag')) return 'products';
    if (prompt.includes('green plum cake')) return 'products';
    if (prompt.includes('green plum dried')) return 'products';
    if (prompt.includes('green plum vinegar')) return 'products';
    if (prompt.includes('green plum tree')) return 'game';
    if (prompt.includes('Yingge dance') && (prompt.includes('planting') || prompt.includes('shovel') || prompt.includes('digging'))) return 'game';
    if (prompt.includes('Yingge dance') && (prompt.includes('watering') || prompt.includes('water can'))) return 'game';
    if (prompt.includes('Yingge dance') && (prompt.includes('harvest') || prompt.includes('basket') || prompt.includes('plums'))) return 'game';
    if (prompt.includes('portrait') && prompt.includes('opera character')) return 'game';
    if (prompt.includes('industrial park') || prompt.includes('青梅产业园')) return 'origin';
    if (prompt.includes('green plum wine bottle') && prompt.includes('transparent background')) return 'products';
    return 'misc';
}

async function main() {
    const uniqueImages = new Map();
    
    for (let i = 0; i < imagesToDownload.length; i++) {
        const img = imagesToDownload[i];
        const key = img.prompt + '|' + img.size;
        
        if (uniqueImages.has(key)) {
            console.log(`[${i + 1}/${imagesToDownload.length}] Already downloaded: ${img.size}`);
            continue;
        }
        
        const folder = getImageFolder(i, img.prompt);
        const folderPath = path.join(__dirname, 'images', folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const filename = `img_${String(i + 1).padStart(2, '0')}.jpg`;
        const outputPath = path.join(folderPath, filename);
        const relativePath = `images/${folder}/${filename}`;
        
        console.log(`[${i + 1}/${imagesToDownload.length}] Downloading ${img.size}...`);
        
        try {
            const { status, contentType, buffer } = await fetchImage(img.fullUrl);
            
            if (status === 200 && contentType?.includes('image') && buffer.length > 1000) {
                fs.writeFileSync(outputPath, buffer);
                console.log(`  ✓ Saved to ${relativePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
                uniqueImages.set(key, relativePath);
            } else {
                console.log(`  ✗ Failed: status=${status}, size=${buffer.length} bytes`);
            }
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('Replacing URLs in HTML...');
    
    let replaceCount = 0;
    for (const img of imagesToDownload) {
        const key = img.prompt + '|' + img.size;
        const localPath = uniqueImages.get(key);
        
        if (localPath) {
            const oldStr = img.fullUrl;
            if (htmlContent.includes(oldStr)) {
                htmlContent = htmlContent.split(oldStr).join(localPath);
                replaceCount++;
            }
        }
    }
    
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`  ✓ Replaced ${replaceCount} URLs`);
    console.log('\nDone! All images downloaded and HTML updated.');
}

main().catch(console.error);
