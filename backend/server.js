/**
 * NeuralWriter Local Development Server
 * Provides a proxy for Perplexity API calls to avoid CORS issues
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Frontend directory
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

/**
 * Serve static files from frontend directory
 */
function serveStaticFile(req, res) {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query strings
    filePath = filePath.split('?')[0];
    
    const fullPath = path.join(FRONTEND_DIR, filePath);
    const ext = path.extname(fullPath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Server Error</h1>');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

/**
 * Handle API proxy requests to Perplexity
 */
function handleAPIRequest(req, res, body) {
    const parsedUrl = new URL(PERPLEXITY_API_URL);
    
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Length': Buffer.byteLength(body)
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        
        proxyRes.on('data', (chunk) => {
            data += chunk;
        });
        
        proxyRes.on('end', () => {
            // Set CORS headers
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(data);
        });
    });

    proxyReq.on('error', (error) => {
        console.error('Proxy error:', error);
        res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
}

/**
 * Main request handler
 */
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    // API proxy endpoint
    if (req.url === '/api/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            handleAPIRequest(req, res, body);
        });
        return;
    }

    // Health check endpoint
    if (req.url === '/api/health') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        }));
        return;
    }

    // Serve static files
    serveStaticFile(req, res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║   🚀 NeuralWriter Development Server                     ║');
    console.log('║                                                          ║');
    console.log(`║   Local:   http://localhost:${PORT}                         ║`);
    console.log('║   API:     http://localhost:' + PORT + '/api/generate             ║');
    console.log('║   Health:  http://localhost:' + PORT + '/api/health               ║');
    console.log('║                                                          ║');
    console.log('║   Press Ctrl+C to stop                                   ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
