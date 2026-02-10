# Discord Token Joiner

> A powerful Discord bot that leverages OAuth2 to seamlessly add user tokens to specified guilds.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Commands](#commands)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- OAuth2-based token authorization
- Automatic access token caching (7-day validity)
- Duplicate token detection and removal
- Invalid token auto-cleanup
- Real-time progress tracking
- Email verification error handling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20.0.0 or higher
- **npm** or **yarn** package manager
- **Discord Bot Token** with appropriate permissions
- **Discord Application** with OAuth2 configured

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd joiner
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
CLIENT_TOKEN=your_bot_token_here
CLIENT_SECRET=your_oauth2_client_secret
REDIRECT_URL=http://localhost:3000
NESTS=your_discord_user_id
```

| Variable | Description |
|----------|-------------|
| `CLIENT_TOKEN` | Your Discord bot token |
| `CLIENT_SECRET` | OAuth2 client secret from Discord Developer Portal |
| `REDIRECT_URL` | OAuth2 redirect URI (must match Discord app settings) |
| `AUTHORIZED_USER_ID` | Discord user ID allowed to execute commands |

### Token Configuration

Add user tokens to `tokens.txt` (one token per line):

```txt
MTA1MjM0NTY3ODkwMTIzNDU2Nzg.GaBcDe.FgHiJkLmNoPqRsTuVwXyZ123456789
MTA5ODc2NTQzMjEwOTg3NjU0MzI.GxYzWv.UtSrQpOnMlKjIhGfEdCbA987654321
```

## Usage

### Development Mode

Run the bot:

```bash
npm start
```

Or:

```bash
npm run dev
```

### Production Mode

Run the bot:

```bash
npm start
```

## Commands

### `&jointokens <guild_id>`

Joins all tokens from `tokens.txt` to the specified guild.

**Example:**
```
&jointokens 1234567890123456789
```

**Process:**
1. Authenticates each token
2. Authorizes OAuth2 access
3. Retrieves access tokens
4. Adds users to target guild
5. Caches tokens in `access_tokens.json`

**Response:**
```
> Starting (0/50)
> Starting (25/50)
> Starting (50/50)
```

## Project Structure

```
joiner/
├── src/
│   └── utils.js          # Utility functions and helpers
├── .env                  # Environment configuration
├── index.js              # Main application entry point
├── tokens.txt            # User tokens (one per line)
├── access_tokens.json    # Cached OAuth2 access tokens
├── package.json          # Project dependencies
└── README.md            # Project documentation
```

## Troubleshooting

### Common Issues

#### Invalid Guild ID
**Problem:** Bot cannot find the specified guild.

**Solution:**
- Verify the bot is a member of the target guild
- Ensure the guild ID is correct (18-19 digits)
- Check bot permissions in the guild

#### OAuth2 Authorization Failed
**Problem:** Unable to authorize tokens.

**Solution:**
- Verify `CLIENT_SECRET` in `.env` matches Discord Developer Portal
- Ensure `REDIRECT_URL` matches your OAuth2 application settings
- Confirm tokens in `tokens.txt` are valid and not expired

#### Token Verification Errors
**Problem:** Tokens fail to join the guild.

**Solution:**
- Tokens requiring email verification are automatically removed
- Check console logs for detailed error messages
- Ensure tokens have not been flagged or banned

#### Rate Limiting
**Problem:** Too many requests to Discord API.

**Solution:**
- The bot handles rate limits automatically
- Consider reducing the number of tokens processed simultaneously
- Wait for the cooldown period to expire

### Debug Mode

Enable detailed logging by checking console output:

```bash
npm run dev
```

Look for:
- `[tokens]` - Token processing logs
- `[Error]` - Error messages
- `[Auto-Clean]` - Automatic token removal logs

## Best Practices

- Keep your `.env` file secure and never commit it to version control
- Regularly clean up invalid tokens from `tokens.txt`
- Monitor console logs for errors and warnings
- Ensure your Discord application has proper OAuth2 scopes configured
- Use a dedicated Discord account for bot operations

## Security Notice

This tool is for educational purposes only. Ensure you comply with Discord's Terms of Service and Community Guidelines. Misuse of this tool may result in account termination.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Copyright

Copyright (c) 1972 tiredreal. All rights reserved.

---

**Note:** This bot requires proper Discord OAuth2 configuration. Refer to the [Discord Developer Documentation](https://discord.com/developers/docs) for detailed setup instructions.
