const http = require('http');
const https = require('https');
const tls = require('tls');

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = Number(process.env.WEB_PROXY_PORT || '8787');
const TARGET_HOST = 'ioncare-backend-production.up.railway.app';
const TARGET_IP = process.env.RAILWAY_TARGET_IP || '66.33.22.41';
const ALLOW_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
const DEFAULT_ALLOW_HEADERS = 'Authorization, Content-Type, Accept, Origin, X-Requested-With';

const getCorsHeaders = (req) => {
    const origin = req.headers.origin || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': ALLOW_METHODS,
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || DEFAULT_ALLOW_HEADERS,
        Vary: 'Origin, Access-Control-Request-Headers',
    };
};

const server = http.createServer((req, res) => {
    const corsHeaders = getCorsHeaders(req);
    for (const [key, value] of Object.entries(corsHeaders)) {
        res.setHeader(key, value);
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const forwardedHeaders = {
        host: TARGET_HOST,
    };

    const allowedForwardHeaders = ['authorization', 'content-type', 'accept', 'content-length', 'user-agent'];
    for (const headerName of allowedForwardHeaders) {
        if (req.headers[headerName]) {
            forwardedHeaders[headerName] = req.headers[headerName];
        }
    }

    const proxyReq = https.request(
        {
            hostname: TARGET_HOST,
            port: 443,
            method: req.method,
            path: req.url || '/',
            headers: forwardedHeaders,
            servername: TARGET_HOST,
            createConnection: (options, callback) => {
                const socket = tls.connect({
                    host: TARGET_IP,
                    port: 443,
                    servername: TARGET_HOST,
                    rejectUnauthorized: true,
                }, () => callback(null, socket));

                socket.on('error', callback);
                return socket;
            },
        },
        (proxyRes) => {
            const responseHeaders = { ...proxyRes.headers };
            delete responseHeaders['content-length'];

            res.writeHead(proxyRes.statusCode || 502, {
                ...responseHeaders,
                ...corsHeaders,
            });
            proxyRes.pipe(res);
        }
    );

    proxyReq.on('error', (error) => {
        res.writeHead(502, {
            'Content-Type': 'application/json',
            ...corsHeaders,
        });
        res.end(JSON.stringify({
            success: false,
            message: 'Local proxy could not reach Railway',
            details: error.message,
        }));
    });

    req.pipe(proxyReq);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`[web-proxy] listening on http://${LISTEN_HOST}:${LISTEN_PORT}`);
    console.log(`[web-proxy] forwarding to https://${TARGET_HOST} via ${TARGET_IP}`);
});
