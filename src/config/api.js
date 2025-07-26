// API配置文件
export const API_CONFIG = {
    // 后端API基础URL
    BASE_URL: 'http://39.102.214.115:3000/api',

    // 超时设置
    TIMEOUT: 30000,

    // 请求头配置
    HEADERS: {
        'Content-Type': 'application/json',
    },

    // SSE配置
    SSE_CONFIG: {
        withCredentials: false,
        headers: {
            'Cache-Control': 'no-cache',
        }
    }
}

// 响应状态码
export const RESPONSE_CODES = {
    SUCCESS: 0,
    ERROR: 1,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
}

// 环境变量配置
if (import.meta.env.VITE_API_BASE_URL) {
    API_CONFIG.BASE_URL = import.meta.env.VITE_API_BASE_URL
}

export default API_CONFIG 