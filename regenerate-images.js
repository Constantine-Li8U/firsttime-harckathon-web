const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PLACEHOLDER_SIZE = 176626;
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

const faceDataFull = [
    { id: 'sun_erniang', character: '孙二娘', nickname: '母夜叉', faceColor: '青面' },
    { id: 'dai_zong', character: '戴宗', nickname: '神行太保', faceColor: '黄面' },
    { id: 'zhu_tong', character: '朱仝', nickname: '美髯公', faceColor: '绿面' },
    { id: 'shi_yong', character: '石勇', nickname: '石将军', faceColor: '赭面' },
    { id: 'gu_dasao', character: '顾大嫂', nickname: '母大虫', faceColor: '粉面' },
    { id: 'song_jiang', character: '宋江', nickname: '及时雨', faceColor: '红面' },
    { id: 'wu_song', character: '武松', nickname: '行者', faceColor: '丹红面' },
    { id: 'qin_ming', character: '秦明', nickname: '霹雳火', faceColor: '红面' },
    { id: 'guan_sheng', character: '关胜', nickname: '大刀', faceColor: '红面' },
    { id: 'lu_zhishen', character: '鲁智深', nickname: '花和尚', faceColor: '黑白花面' }
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadWithRetry(prompt, size, outputPath, faceId) {
    const apiUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`  [${faceId}] Attempt ${attempt}/${MAX_RETRIES}...`);
        
        try {
            const { status, contentType, buffer } = await fetchImage(apiUrl);
            
            if (status === 200 && contentType?.includes('image')) {
                const isPlaceholder = Math.abs(buffer.length - PLACEHOLDER_SIZE) < 1000;
                
                if (!isPlaceholder && buffer.length > 1000) {
                    fs.writeFileSync(outputPath, buffer);
                    console.log(`  ✓ Success! Size: ${(buffer.length / 1024).toFixed(1)} KB`);
                    return true;
                } else {
                    console.log(`    Got placeholder (${(buffer.length / 1024).toFixed(1)} KB), waiting...`);
                }
            } else {
                console.log(`    Failed: status=${status}, size=${buffer.length}`);
            }
        } catch (error) {
            console.log(`    Error: ${error.message}`);
        }
        
        if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY);
        }
    }
    
    console.log(`  ✗ Failed after ${MAX_RETRIES} attempts`);
    return false;
}

async function main() {
    console.log('Regenerating character and product images with retry...\n');
    
    let successCount = 0;
    const total = faceDataFull.length * 2;
    
    const charDir = path.join(__dirname, 'images', 'characters');
    const prodDir = path.join(__dirname, 'images', 'products');
    
    for (const face of faceDataFull) {
        const charPrompt = `cute cartoon chibi character of ${face.character} with ${face.nickname} Yingge dance opera mask, ${face.faceColor} face, traditional Chinese green and gold costume, dynamic dance pose, clouds background, digital art, vibrant colors, rice paper texture`;
        const charPath = path.join(charDir, `${face.id}.jpg`);
        
        console.log(`Character: ${face.nickname} · ${face.character}`);
        const r1 = await downloadWithRetry(charPrompt, 'portrait_4_3', charPath, `${face.id}-char`);
        if (r1) successCount++;
        console.log('');
        
        const prodPrompt = `premium green plum wine bottle with custom ${face.nickname} ${face.character} Yingge opera mask label, ${face.faceColor} face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture`;
        const prodPath = path.join(prodDir, `${face.id}.jpg`);
        
        console.log(`Product: ${face.nickname} · ${face.character}`);
        const r2 = await downloadWithRetry(prodPrompt, 'landscape_16_9', prodPath, `${face.id}-prod`);
        if (r2) successCount++;
        console.log('');
    }
    
    console.log(`\nDone! ${successCount}/${total} images regenerated successfully.`);
}

main().catch(console.error);
