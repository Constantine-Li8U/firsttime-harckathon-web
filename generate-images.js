const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const faceDataFull = [
    {
        id: 'sun_erniang',
        nickname: '母夜叉',
        character: '孙二娘',
        faceColor: '青面',
        imagePrompt: 'Chinese Yingge dance opera face mask green color, female warrior Sun Erniang, green face with fierce eyes, traditional headdress with green leaves and golden ornaments, elegant but powerful, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Sun Erniang with 母夜叉 Yingge dance opera mask, green face, traditional Chinese green and gold costume, dynamic dance pose, clouds background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 母夜叉 Sun Erniang Yingge opera mask label, green face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'dai_zong',
        nickname: '神行太保',
        character: '戴宗',
        faceColor: '黄面',
        imagePrompt: 'Chinese Yingge dance opera face mask yellow color, Dai Zong the magic runner, yellow face with slender eyes, elaborate headdress with red pom-poms and blue dragon patterns, long black beard, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Dai Zong with 神行太保 Yingge dance opera mask, yellow face, traditional Chinese yellow and gold costume, running pose, wind and clouds background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 神行太保 Dai Zong Yingge opera mask label, yellow face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'zhu_tong',
        nickname: '美髯公',
        character: '朱仝',
        faceColor: '绿面',
        imagePrompt: 'Chinese Yingge dance opera face mask green color, Zhu Tong the beautiful beard, green face with black and white opera patterns, long flowing red beard, golden headband with triangular ornament, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Zhu Tong with 美髯公 Yingge dance opera mask, green face, traditional Chinese green and red costume, long flowing beard, elegant pose, bamboo background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 美髯公 Zhu Tong Yingge opera mask label, green face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'shi_yong',
        nickname: '石将军',
        character: '石勇',
        faceColor: '赭面',
        imagePrompt: 'Chinese Yingge dance opera face mask ochre red color, Shi Yong the stone general, ochre red face with black and white opera patterns, long red beard, ornate golden headdress with red pom-poms and bird motifs, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Shi Yong with 石将军 Yingge dance opera mask, ochre red face, traditional Chinese red and gold armor costume, strong warrior pose, mountain background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 石将军 Shi Yong Yingge opera mask label, ochre red face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'gu_dasao',
        nickname: '母大虫',
        character: '顾大嫂',
        faceColor: '粉面',
        imagePrompt: 'Chinese Yingge dance opera face mask pink color, female warrior Gu Dasao, pink face with elegant black eyes, pink headdress with feather ornament and blue butterfly motif, pearl decorations, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Gu Dasao with 母大虫 Yingge dance opera mask, pink face, traditional Chinese pink and white costume, female warrior pose, cherry blossom background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 母大虫 Gu Dasao Yingge opera mask label, pink face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'song_jiang',
        nickname: '及时雨',
        character: '宋江',
        faceColor: '红面',
        imagePrompt: 'Chinese Yingge dance opera face mask red color, Song Jiang the timely rain, red face with black and white opera patterns, long red beard, elaborate golden headdress with black pom-poms and sun motif, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Song Jiang with 及时雨 Yingge dance opera mask, red face, traditional Chinese red and gold robe, leader pose, hall background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 及时雨 Song Jiang Yingge opera mask label, red face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'wu_song',
        nickname: '行者',
        character: '武松',
        faceColor: '丹红面',
        imagePrompt: 'Chinese Yingge dance opera face mask red color, Wu Song the pilgrim, red dan face with sharp eyes, golden headband with crescent moon ornament and red pom-pom, side hair locks, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Wu Song with 行者 Yingge dance opera mask, red dan face, traditional Chinese red and black traveler costume, fighting pose, forest background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 行者 Wu Song Yingge opera mask label, red dan face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'qin_ming',
        nickname: '霹雳火',
        character: '秦明',
        faceColor: '红面',
        imagePrompt: 'Chinese Yingge dance opera face mask red color, Qin Ming the thunder fire, red face with black blue and white opera flame patterns, long black beard, elaborate golden headdress with red top pom-pom and black side pom-poms, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Qin Ming with 霹雳火 Yingge dance opera mask, red face with flame patterns, traditional Chinese red and black warrior costume, fierce battle pose, fire and lightning background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 霹雳火 Qin Ming Yingge opera mask label, red flame face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'guan_sheng',
        nickname: '大刀',
        character: '关胜',
        faceColor: '红面',
        imagePrompt: 'Chinese Yingge dance opera face mask red color, Guan Sheng the great blade, red face with black and white opera patterns and yin-yang forehead design, long red beard, elaborate golden headdress with red pom-poms and dragon motifs, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Guan Sheng with 大刀 Yingge dance opera mask, red face with yin-yang design, traditional Chinese red and gold general costume, holding guandao weapon, military camp background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 大刀 Guan Sheng Yingge opera mask label, red face with yin-yang design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
    },
    {
        id: 'lu_zhishen',
        nickname: '花和尚',
        character: '鲁智深',
        faceColor: '黑白花面',
        imagePrompt: 'Chinese Yingge dance opera face mask black and white, Lu Zhishen the flower monk, black and white face with red monk hat, thick eyebrows and big nose, long black beard, red hat with swirling patterns and jewel, traditional Chinese opera style, detailed patterns, rice paper texture background',
        characterPrompt: 'cute cartoon chibi character of Lu Zhishen with 花和尚 Yingge dance opera mask, black and white face, monk robe with red sash, holding monk staff, temple background, digital art, vibrant colors, rice paper texture',
        productPrompt: 'premium green plum wine bottle with custom 花和尚 Lu Zhishen Yingge opera mask label, black and white face design, elegant green glass bottle, gold cap, Chinese style packaging, product photography, soft lighting, luxury feel, rice paper texture'
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
    console.log('Starting image generation...\n');
    
    let successCount = 0;
    let totalCount = 0;
    
    for (const face of faceDataFull) {
        console.log(`Processing: ${face.nickname} · ${face.character}`);
        
        const facePath = path.join(__dirname, 'images', 'faces', `${face.id}.jpg`);
        const charPath = path.join(__dirname, 'images', 'characters', `${face.id}.jpg`);
        const prodPath = path.join(__dirname, 'images', 'products', `${face.id}.jpg`);
        
        totalCount += 3;
        
        const r1 = await downloadImage(face.imagePrompt, 'square', facePath);
        const r2 = await downloadImage(face.characterPrompt, 'portrait_4_3', charPath);
        const r3 = await downloadImage(face.productPrompt, 'landscape_16_9', prodPath);
        
        if (r1) successCount++;
        if (r2) successCount++;
        if (r3) successCount++;
        
        console.log('');
    }
    
    console.log(`\nDone! ${successCount}/${totalCount} images generated successfully.`);
}

main().catch(console.error);
