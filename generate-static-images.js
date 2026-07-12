const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const staticImages = [
    {
        name: 'hero-bottle',
        prompt: 'Chinese Yingge dance green plum wine bottle, elegant green glass bottle with golden cap, traditional Chinese opera mask label design, floating in mid air with soft glow, misty mountain background, rice paper texture, premium product photography, cinematic lighting',
        size: 'portrait_4_3',
        folder: 'products'
    },
    {
        name: 'ancient-plum-tree',
        prompt: 'ancient Chinese green plum tree with twisted old trunk, lush green leaves with small green plum fruits, traditional Chinese ink wash painting style, elegant brush strokes, rice paper texture, transparent background',
        size: 'portrait_4_3',
        folder: 'game'
    },
    {
        name: 'yingge-planter',
        prompt: 'cute cartoon chibi character of Yingge dance opera performer planting green plum sapling, blue and green traditional costume, holding shovel, dynamic action pose, digital art, vibrant colors, rice paper texture, transparent background',
        size: 'square',
        folder: 'game'
    },
    {
        name: 'yingge-waterer',
        prompt: 'cute cartoon chibi character of Yingge dance opera performer watering green plum tree, blue and green traditional costume, holding water bucket, dynamic action pose, digital art, vibrant colors, rice paper texture, transparent background',
        size: 'square',
        folder: 'game'
    },
    {
        name: 'yingge-harvester',
        prompt: 'cute cartoon chibi character of Yingge dance opera performer harvesting green plums, blue and green traditional costume, holding basket of green plums, happy expression, digital art, vibrant colors, rice paper texture, transparent background',
        size: 'square',
        folder: 'game'
    },
    {
        name: 'gift-box-set',
        prompt: 'Chinese traditional green plum wine gift box set, elegant packaging with opera mask design, deep green and gold colors, premium product photography, soft natural lighting, traditional Chinese style',
        size: 'landscape_16_9',
        folder: 'products'
    },
    {
        name: 'green-plum-wine',
        prompt: 'Chinese green plum wine bottle, elegant glass bottle with red label featuring opera mask, traditional Chinese style, premium product photography, soft lighting, minimalist background',
        size: 'square',
        folder: 'products'
    },
    {
        name: 'green-plum-cake',
        prompt: 'Chinese green plum cake tin can, round metal container with opera mask design, dark green and red colors, traditional Chinese style, premium product photography, soft lighting',
        size: 'square',
        folder: 'products'
    },
    {
        name: 'green-plum-dried',
        prompt: 'Chinese green plum dried fruit tin can, round metal container with opera mask design, red and gold colors, traditional Chinese style, premium product photography, soft lighting',
        size: 'square',
        folder: 'products'
    },
    {
        name: 'green-plum-vinegar',
        prompt: 'Chinese green plum vinegar bottle, elegant green glass bottle, traditional Chinese style packaging, premium product photography, soft natural lighting, minimalist background',
        size: 'square',
        folder: 'products'
    },
    {
        name: 'gift-bag-set',
        prompt: 'Chinese traditional gift bag and gift box set, green plum products, elegant packaging with opera mask, cream and green colors, premium product photography, soft lighting',
        size: 'landscape_16_9',
        folder: 'products'
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
    console.log('Generating static images...\n');
    
    let successCount = 0;
    
    for (const img of staticImages) {
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
    
    console.log(`\nDone! ${successCount}/${staticImages.length} images generated successfully.`);
}

main().catch(console.error);
