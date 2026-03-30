const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const host = process.env.WEB_PROXY_HOST || '127.0.0.1';
const port = Number(process.env.WEB_PROXY_PORT || '8787');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPortOpen = (hostName, portNumber) =>
    new Promise((resolve) => {
        const socket = net.createConnection({ host: hostName, port: portNumber });

        socket.setTimeout(500);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => {
            resolve(false);
        });
    });

const waitForPort = async (hostName, portNumber, attempts = 20) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (await isPortOpen(hostName, portNumber)) {
            return true;
        }
        await sleep(250);
    }

    return false;
};

const startProcess = (command, args, extraEnv = {}) =>
    spawn(command, args, {
        stdio: 'inherit',
        env: {
            ...process.env,
            ...extraEnv,
        },
    });

const run = async () => {
    let proxyProcess = null;

    if (await isPortOpen(host, port)) {
        console.log(`[web-dev] Reusing existing proxy on http://${host}:${port}`);
    } else {
        proxyProcess = startProcess(process.execPath, [path.join(__dirname, 'railway-web-proxy.js')]);

        const proxyReady = await waitForPort(host, port);
        if (!proxyReady) {
            console.error(`[web-dev] Proxy did not become ready on http://${host}:${port}`);
            proxyProcess.kill('SIGINT');
            process.exit(1);
        }
    }

    console.log(`[web-dev] Starting Expo web with proxy http://${host}:${port}/api`);

    const expoProcess = startProcess(
        npxCommand,
        ['expo', 'start', '--web'],
        {
            EXPO_PUBLIC_FORCE_WEB_PROXY: 'true',
        }
    );

    const cleanup = () => {
        if (proxyProcess && !proxyProcess.killed) {
            proxyProcess.kill('SIGINT');
        }
    };

    process.on('SIGINT', () => {
        cleanup();
        expoProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        cleanup();
        expoProcess.kill('SIGTERM');
    });

    expoProcess.on('exit', (code) => {
        cleanup();
        process.exit(code ?? 0);
    });
};

run().catch((error) => {
    console.error('[web-dev] Failed to start web dev server:', error);
    process.exit(1);
});
