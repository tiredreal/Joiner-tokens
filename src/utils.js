/**
 * Discord Token Joiner - Utility Functions
 * Copyright (c) 1972 tiredreal
 * All rights reserved.
 */

const fs = require("fs");
const path = require("path");

module.exports = {
    getTokens() {
        const tokensPath = path.join(__dirname, "..", "tokens.txt");

        if (fs.existsSync(tokensPath)) {
            const tokens = fs.readFileSync(tokensPath, "utf-8")
                .split("\n")
                .map(token => token.trim())
                .filter(Boolean);
            return tokens.length ? tokens : null;
        }
        return null;
    },
    
    removeToken(token) {
        const tokensPath = path.join(__dirname, "..", "tokens.txt");
        
        if (!fs.existsSync(tokensPath)) {
            console.log(`[Utils] tokens.txt not found`);
            return false;
        }
        
        try {
            const originalContent = fs.readFileSync(tokensPath, "utf-8");
            const tokens = originalContent
                .split("\n")
                .map(t => t.trim())
                .filter(t => t && t !== token);
            
            const newContent = tokens.length > 0 ? tokens.join("\n") + "\n" : "";
            fs.writeFileSync(tokensPath, newContent, "utf-8");
            
            console.log(`[Utils] Removed token from tokens.txt: ${token.substring(0, 20)}...`);
            console.log(`[Utils] Tokens remaining: ${tokens.length}`);
            return true;
        } catch (error) {
            console.error(`[Utils] Error removing token:`, error);
            return false;
        }
    },
    
    removeDuplicates() {
        const tokensPath = path.join(__dirname, "..", "tokens.txt");
        
        if (!fs.existsSync(tokensPath)) return 0;
        
        const tokens = fs.readFileSync(tokensPath, "utf-8")
            .split("\n")
            .map(t => t.trim())
            .filter(Boolean);
        
        const uniqueTokens = [...new Set(tokens)];
        const duplicatesRemoved = tokens.length - uniqueTokens.length;
        
        if (duplicatesRemoved > 0) {
            fs.writeFileSync(tokensPath, uniqueTokens.join("\n") + "\n", "utf-8");
            console.log(`[Utils] Removed ${duplicatesRemoved} duplicate tokens`);
        }
        
        return duplicatesRemoved;
    },
    
    getOAuth2URL(clientId) {
        const redirectUrl = process.env.REDIRECT_URL;
        const scopes = "guilds.join+identify";
        if (clientId && redirectUrl) {
            return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=${scopes}`;
        }
        return null;
    },
    
    async getAccessToken(code, clientId, userId) {
        const ClientSecret = process.env.CLIENT_SECRET;
        const redirectUrl = process.env.REDIRECT_URL;

        if (!clientId || !ClientSecret || !redirectUrl) return null;

        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("client_secret", ClientSecret);
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("redirect_uri", redirectUrl);

        try {
            const response = await fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: params.toString()
            });

            if (!response.ok) {
                console.error(`[getAccessToken] Failed: ${response.status}`);
                return null;
            }

            const data = await response.json();
            
            if (data.access_token && userId) {
                this.saveAccessToken(userId, data.access_token, data.token_type, data.expires_in, data.scope);
            }
            
            return data.access_token || null;
        } catch (error) {
            console.error("Error fetching access token", error);
            return null;
        }
    },
    
    async checkAuthorization(token, applicationId) {
        try {
            const response = await fetch(`https://discord.com/api/v9/oauth2/tokens`, {
                method: "GET",
                headers: {
                    "Authorization": token
                }
            });

            if (!response.ok) {
                return false;
            }

            const authorizations = await response.json();
            return authorizations.some(auth => auth.application?.id === applicationId);
        } catch (error) {
            return false;
        }
    },
    
    async validateToken(token) {
        try {
            const response = await fetch(`https://discord.com/api/v9/users/@me`, {
                method: "GET",
                headers: {
                    "Authorization": token,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    "DNT": "1",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache"
                }
            });

            if (response.status === 200) {
                const user = await response.json();
                return { valid: true, user };
            } else if (response.status === 401) {
                return { valid: false, error: "Invalid token" };
            } else if (response.status === 403) {
                return { valid: false, error: "Token lacks permissions" };
            } else if (response.status === 429) {
                return { valid: false, error: "Rate limited" };
            } else {
                return { valid: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { valid: false, error: "Network error" };
        }
    },
    
    saveAccessToken(userId, accessToken, tokenType, expiresIn, scope) {
        const accessTokensPath = path.join(__dirname, "..", "access_tokens.json");
        
        let accessTokens = {};
        
        if (fs.existsSync(accessTokensPath)) {
            try {
                const data = fs.readFileSync(accessTokensPath, "utf-8");
                accessTokens = JSON.parse(data);
            } catch (error) {
                console.error("[Utils] Error reading access_tokens.json:", error);
            }
        }
        
        accessTokens[userId] = {
            userId,
            accessToken,
            tokenType,
            expiresIn,
            scope,
            timestamp: Date.now()
        };
        
        fs.writeFileSync(accessTokensPath, JSON.stringify(accessTokens, null, 2), "utf-8");
        console.log(`[Utils] Saved access token for user ${userId}`);
    },
    
    getAccessTokenFromFile(userId) {
        const accessTokensPath = path.join(__dirname, "..", "access_tokens.json");
        
        if (!fs.existsSync(accessTokensPath)) {
            return null;
        }
        
        try {
            const data = fs.readFileSync(accessTokensPath, "utf-8");
            const accessTokens = JSON.parse(data);
            
            const tokenData = accessTokens[userId];
            if (!tokenData) return null;
            
            const expirationTime = tokenData.timestamp + (tokenData.expiresIn * 1000) - (5 * 60 * 1000);
            if (Date.now() > expirationTime) {
                console.log(`[Utils] Access token for user ${userId} has expired`);
                return null;
            }
            
            return tokenData;
        } catch (error) {
            console.error("[Utils] Error reading access_tokens.json:", error);
            return null;
        }
    },
    
    getAllAccessTokens() {
        const accessTokensPath = path.join(__dirname, "..", "access_tokens.json");
        
        if (!fs.existsSync(accessTokensPath)) {
            return {};
        }
        
        try {
            const data = fs.readFileSync(accessTokensPath, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.error("[Utils] Error reading access_tokens.json:", error);
            return {};
        }
    },
    
    async removeAuthorization(token, applicationId) {
        try {
            const response = await fetch(`https://discord.com/api/v9/oauth2/tokens/${applicationId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": token
                }
            });

            return response.status === 204 || response.status === 200;
        } catch (error) {
            return false;
        }
    },
    
    removeInvalidTokens(invalidTokens) {
        const tokensPath = path.join(__dirname, "..", "tokens.txt");
        
        if (!fs.existsSync(tokensPath)) {
            console.log(`[Utils] tokens.txt not found`);
            return 0;
        }
        
        try {
            const originalContent = fs.readFileSync(tokensPath, "utf-8");
            const allTokens = originalContent
                .split("\n")
                .map(t => t.trim())
                .filter(Boolean);
            
            const validTokens = allTokens.filter(token => !invalidTokens.includes(token));
            const removedCount = allTokens.length - validTokens.length;
            
            const newContent = validTokens.length > 0 ? validTokens.join("\n") + "\n" : "";
            fs.writeFileSync(tokensPath, newContent, "utf-8");
            
            console.log(`[Utils] Removed ${removedCount} invalid tokens from tokens.txt`);
            console.log(`[Utils] Tokens remaining: ${validTokens.length}`);
            return removedCount;
        } catch (error) {
            console.error(`[Utils] Error removing invalid tokens:`, error);
            return 0;
        }
    }
};
