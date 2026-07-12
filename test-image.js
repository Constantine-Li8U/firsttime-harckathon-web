const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');

function fetchImage(urlStr, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error('Too many redirects'));
            return;
        }
        
        const parsedUrl = url.parse(urlStr);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        console.log(`[${redirectCount}] Fetching: ${urlStr}`);
        
        const req = client.get(options, (res) => {
            console.log(`[${redirectCount}] Status: ${res.statusCode}`);
            console.log(`[${redirectCount}] Content-Type: ${res.headers['content-type']}`);
            console.log(`[${redirectCount}] Location: ${res.headers['location'] || 'none'}`);
            
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers['location']) {
                const redirectUrl = url.resolve(urlStr, res.headers['location']);
                fetchImage(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
                return;
            }
            
            let data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                console.log(`[${redirectCount}] Total size: ${buffer.length} bytes`);
                if (buffer.length > 0 && buffer.length < 500) {
                    console.log(`[${redirectCount}] Body preview: ${buffer.toString('utf8', 0, Math.min(200, buffer.length))}`);
                }
                resolve({ status: res.statusCode, contentType: res.headers['content-type'], buffer });
            });
        });
        
        req.on('error', reject);
    });
}

const testUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=test&image_size=square';

fetchImage(testUrl)
    .then(({ status, contentType, buffer }) => {
        console.log('\nFinal result:');
        console.log('Status:', status);
        console.log('Content-Type:', contentType);
        console.log('Size:', buffer.length, 'bytes');
        
        if (contentType?.includes('image') && buffer.length > 1000) {
            fs.writeFileSync('./test-output.png', buffer);
            console.log('Image saved to test-output.png');
        }
    })
    .catch(err => {
        console.error('Error:', err.message);
    });
