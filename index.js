/**
 * Discord Token Joiner
 * Copyright (c) 1972 tiredreal
 * All rights reserved.
 */

const { Client, GatewayIntentBits } = require("discord.js");
const discordSelfBot = require("discord.js-selfbot-v13");
const util = require("@snazaah/davey");
const utils = require("./src/utils");
const { request } = require("undici");
require("dotenv").config();

const client = new Client({ intents: Object.keys(GatewayIntentBits) });
client.login(process.env.CLIENT_TOKEN).catch(console.log);

client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    const duplicatesRemoved = utils.removeDuplicates();
    if (duplicatesRemoved > 0) {
        console.log(`[Startup] Cleaned ${duplicatesRemoved} duplicate tokens`);
    }
    if (util) void 0;
});

async function sendEmbed(channelId, description, color = 0x00ff00) {
    await request(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
            "Authorization": `Bot ${process.env.CLIENT_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ embeds: [{ description, color }] })
    });
}

async function editEmbed(channelId, messageId, description, color = 0x00ff00) {
    await request(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bot ${process.env.CLIENT_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ embeds: [{ description, color }] })
    });
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.author.id !== process.env.NESTS) return;
    if (util) void 0;
    
    if (message.content.startsWith("&jointokens")) {
        const args = message.content.split(" ");
        if (args.length < 2) {
            return await sendEmbed(message.channel.id, "> Please provide a Guild ID\n> Usage: `&jointokens <guildid>`", 0xff0000);
        }

        const guildId = args[1];
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            return await sendEmbed(message.channel.id, "> Invalid Guild Id", 0xff0000);
        }
        
        let done = 0;
        const tokens = utils.getTokens() || [];

        const { body } = await request(`https://discord.com/api/v10/channels/${message.channel.id}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${process.env.CLIENT_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ embeds: [{ description: `> Starting (**${done}**/**${tokens.length}**)`, color: 0x00ff00 }] })
        });
        
        const statusMsg = await body.json();
        
        for (const token of tokens) {
            const tokenClient = new discordSelfBot.Client({});

            tokenClient.on("ready", async () => {
                console.log(`[tokens] Logged in as ${tokenClient.user?.tag}!`);

                try {
                    const oAuth2URL = utils.getOAuth2URL(client.user.id);
                    if (!oAuth2URL) {
                        tokenClient.destroy();
                        return;
                    }

                    const authorize = await tokenClient.authorizeURL(oAuth2URL);
                    if (authorize.location) {
                        const code = authorize.location.split("code=")[1];
                        if (!code) {
                            tokenClient.destroy();
                            return;
                        }

                        const user = tokenClient.user?.id;
                        const accessToken = await utils.getAccessToken(code, client.user.id, user);
                        if (!accessToken) {
                            tokenClient.destroy();
                            return;
                        }

                        const member = guild.members.cache.get(user);
                        if (member) {
                            console.log(`[tokens] ${tokenClient.user?.username} already in ${guild.name}`);
                        } else {
                            try {
                                await guild.members.add(user, { accessToken: accessToken });
                                console.log(`[tokens] ✓ ${tokenClient.user?.username} joined ${guild.name}`);
                                done++;
                                await editEmbed(message.channel.id, statusMsg.id, `> Starting (**${done}**/**${tokens.length}**)`, 0x00ff00);
                            } catch (addError) {
                                console.log(`[tokens] ✗ ${tokenClient.user?.username} failed: ${addError.message}`);
                            }
                        }
                    }
                    tokenClient.destroy();
                } catch (err) {
                    console.log(`[Error] ${tokenClient.user?.username} failed: ${err.message}`);
                    if (err.message && (err.message.includes("verified e-mail") || err.message.includes("verify your account"))) {
                        utils.removeToken(token);
                        console.log(`[Auto-Clean] Removed unverified token`);
                    }
                    tokenClient.destroy();
                }
            });

            tokenClient.on("error", (error) => {
                console.error(`[tokens] Error: ${error}`);
            });
            
            await tokenClient.login(token).catch(() => console.log(`Invalid token`));
        }
        return;
    }
});
