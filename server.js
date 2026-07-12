const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(200, CORS_HEADERS);
        res.end();
        return;
    }

    if (pathname === '/api/get-qiniu-token') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        });
        res.end(JSON.stringify({ 
            uploadToken: 'mock-upload-token-for-hackathon',
            expires: 3600 
        }));
        return;
    }

    if (pathname.startsWith('/api/proxy')) {
        const targetUrl = parsedUrl.query.url;
        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
            res.end(JSON.stringify({ error: '缺少目标URL' }));
            return;
        }

        const targetParsed = url.parse(targetUrl);
        const headers = { ...req.headers };
        delete headers.host;
        delete headers.origin;

        const options = {
            hostname: targetParsed.hostname,
            path: targetParsed.path,
            method: req.method,
            headers: headers
        };

        const proxyReq = (targetParsed.protocol === 'https:' ? https : http).request(options, (proxyRes) => {
            const proxyHeaders = { ...proxyRes.headers, ...CORS_HEADERS };
            delete proxyHeaders['set-cookie'];
            res.writeHead(proxyRes.statusCode, proxyHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
            res.end(JSON.stringify({ error: error.message }));
        });

        req.pipe(proxyReq);
        return;
    }

    let filePath = '.' + pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { ...CORS_HEADERS });
                res.end('File not found');
            } else {
                res.writeHead(500, { ...CORS_HEADERS });
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                ...CORS_HEADERS
            });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
    console.log('已启用API代理服务:');
    console.log('  - GET /api/get-qiniu-token (获取七牛云上传凭证)');
    console.log('  - GET/POST /api/proxy?url=xxx (代理请求)');
    console.log('  - CORS已配置，支持OPTIONS预检请求');
});