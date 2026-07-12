const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const additionalImages = [
    {
        name: 'industrial-park-gate',
        prompt: 'aerial view of national level modern agriculture green plum industrial park entrance gate, large green Chinese characters "国家级现代农业(青梅)产业园" on top of gate, green logo with plum blossom emblem on right tower, vertical red Chinese text "中国青梅之乡", grey stone sign on left with gold text "揭阳中元现代农业产业园股份有限公司", mountain hillside background, blue industrial buildings, excavator construction, wide concrete road, sunny day, photorealistic, drone shot',
        size: 'landscape_16_9',
        folder: 'origin'
    },
    {
        name: 'game-avatar',
        prompt: '3D chibi cute Chinese opera character portrait, blue and white traditional costume with gold decorations, elaborate phoenix crown headdress with white pom-poms and red ornaments, big red eyes, red mark on forehead, smiling face, Q version, clay figure style, soft lighting, close up headshot',
        size: 'square',
        folder: 'game'
    }
];

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

async function downloadImage(prompt, size, outputPath) {
    const apiUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
    
    try {
        const { status, contentType, buffer } = await fetchImage(apiUrl);
        
        if (status === 200 && contentType?.includes('image') && buffer.length > 1000) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✓ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
            return true;
        } else {
            console.log(`  ✗ Failed: status=${status}, size=${buffer.length} bytes`);
            return false;
        }
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('Generating additional images...\n');
    
    let successCount = 0;
    
    for (const img of additionalImages) {
        console.log(`Processing: ${img.name}`);
        
        const folderPath = path.join(__dirname, 'images', img.folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const outputPath = path.join(folderPath, `${img.name}.jpg`);
        const result = await downloadImage(img.prompt, img.size, outputPath);
        if (result) successCount++;
        
        console.log('');
    }
    
    console.log(`\nDone! ${successCount}/${additionalImages.length} additional images generated successfully.`);
}

main().catch(console.error);
