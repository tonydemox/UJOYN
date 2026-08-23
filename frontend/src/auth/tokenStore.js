let currentAccessToken = null;

export function getAccessToken() {
    return currentAccessToken;
}

export function setAccessToken(token) {
    currentAccessToken = token;
}