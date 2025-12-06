export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route requests
            if (path === '/api/auth/register') {
                return await handleRegister(request, env, corsHeaders);
            } else if (path === '/api/auth/login') {
                return await handleLogin(request, env, corsHeaders);
            } else if (path === '/api/sync/pull') {
                return await handlePull(request, env, corsHeaders);
            } else if (path === '/api/sync/push') {
                return await handlePush(request, env, corsHeaders);
            } else {
                return jsonResponse({ error: '未找到' }, 404, corsHeaders);
            }
        } catch (error) {
            return jsonResponse({ error: error.message }, 500, corsHeaders);
        }
    },
};

// Helper: JSON response
function jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });
}

// Helper: Hash password
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Helper: Generate token
function generateToken() {
    return crypto.randomUUID();
}

// Helper: Verify token
async function verifyToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('未授权');
    }

    const token = authHeader.substring(7);
    const email = await env.SYNC_KV.get(`token:${token}`);

    if (!email) {
        throw new Error('无效的令牌');
    }

    return email;
}

// Handler: Register
async function handleRegister(request, env, corsHeaders) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return jsonResponse({ error: '需要邮箱和密码' }, 400, corsHeaders);
    }

    // Check if user exists
    const existingUser = await env.SYNC_KV.get(`user:${email}`);
    if (existingUser) {
        return jsonResponse({ error: '用户已存在' }, 409, corsHeaders);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = {
        email,
        passwordHash,
        createdAt: Date.now(),
    };

    await env.SYNC_KV.put(`user:${email}`, JSON.stringify(user));

    // Generate token
    const token = generateToken();
    await env.SYNC_KV.put(`token:${token}`, email, { expirationTtl: 86400 * 30 }); // 30 days

    return jsonResponse({ token, email }, 201, corsHeaders);
}

// Handler: Login
async function handleLogin(request, env, corsHeaders) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return jsonResponse({ error: 'Email and password required' }, 400, corsHeaders);
    }

    // Get user
    const userData = await env.SYNC_KV.get(`user:${email}`);
    if (!userData) {
        return jsonResponse({ error: '凭证无效' }, 401, corsHeaders);
    }

    const user = JSON.parse(userData);

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
        return jsonResponse({ error: '凭证无效' }, 401, corsHeaders);
    }

    // Generate token
    const token = generateToken();
    await env.SYNC_KV.put(`token:${token}`, email, { expirationTtl: 86400 * 30 }); // 30 days

    return jsonResponse({ token, email }, 200, corsHeaders);
}

// Handler: Pull data
async function handlePull(request, env, corsHeaders) {
    const email = await verifyToken(request, env);

    // Get sync data
    const syncData = await env.SYNC_KV.get(`sync:${email}`);

    if (!syncData) {
        return jsonResponse({ data: null }, 200, corsHeaders);
    }

    return jsonResponse({ data: JSON.parse(syncData) }, 200, corsHeaders);
}

// Handler: Push data
async function handlePush(request, env, corsHeaders) {
    const email = await verifyToken(request, env);
    const data = await request.json();

    // Validate data structure
    if (!data.shortcuts || !data.gridConfig || !data.bgConfig) {
        return jsonResponse({ error: '无效的数据结构' }, 400, corsHeaders);
    }

    // Add timestamp
    const syncData = {
        ...data,
        updatedAt: Date.now(),
    };

    // Save to KV
    await env.SYNC_KV.put(`sync:${email}`, JSON.stringify(syncData));

    return jsonResponse({ success: true, updatedAt: syncData.updatedAt }, 200, corsHeaders);
}
