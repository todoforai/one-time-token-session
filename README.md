# one-time-token-session

A lightweight one-time token plugin for the Better Auth framework that generates temporary tokens for existing authenticated sessions. Unlike the official one-time-token plugin, this plugin doesn't require additional database tables and works with the existing verification system.

**Note:** This plugin requires an existing authenticated session to generate tokens. By default, verifying a token creates a new session (`createSession: true`).

## Key Differences from Official Plugin

- **No Database Schema**: Uses existing verification table instead of dedicated one-time-token table
- **Session-Based**: Generates tokens for existing authenticated sessions
- **Simpler Setup**: No additional database migrations required
- **Lightweight**: Minimal configuration and setup

## Installation

```bash
npm install better-auth
```

## Your Plugin is Ready! 🎉

Your current implementation is already a complete Better Auth plugin. Users can:

### Use it directly from Better Auth:
```typescript
import { betterAuth } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { oneTimeTokenSession } from "better-auth/plugins/one-time-token-session";
import { oneTimeTokenSessionClient } from "better-auth/plugins/one-time-token-session/client";

// Server
const auth = betterAuth({
  plugins: [oneTimeTokenSession()]
});

// Client
const authClient = createAuthClient({
  plugins: [oneTimeTokenSessionClient()]
});
```

### Or as a standalone package:
```typescript
import { oneTimeTokenSession } from "better-auth-one-time-token-session";
```

## File Structure

The plugin consists of:
- `index.ts` - Main plugin implementation
- `client.ts` - Client-side plugin
- `utils.ts` - Utility functions
- `README.md` - Documentation
- `one-time-token.test.ts` - Test suite

## Usage

### Basic Setup

```typescript
import { betterAuth } from "better-auth"
import { oneTimeTokenSession } from "better-auth/plugins/one-time-token-session"

export const auth = betterAuth({
    // ... other config options
    plugins: [
        oneTimeTokenSession()
    ]
})
```

### Client Setup

```typescript
import { createAuthClient } from "better-auth/client"
import { oneTimeTokenSessionClient } from "better-auth/plugins/one-time-token-session/client"

export const authClient = createAuthClient({
    // ... other config options
    plugins: [
        oneTimeTokenSessionClient()
    ]
})
```

## Configuration Options

```typescript
oneTimeTokenSession({
    expiresIn: 5,              // Token expires in 5 minutes (default: 3)
    disableClientRequest: true, // Server-only token generation (default: false)
    createSession: false,       // Don't create new session on verify (default: true)
    storeToken: "hashed",      // Hash tokens in database (default: "plain")
})
```

## API Methods

### Generate Token
**Requires existing authenticated session**

```typescript
// Server
const { token } = await auth.api.generateOneTimeToken({
    headers: { /* session headers */ }
})

// Client
const { token } = await authClient.oneTimeToken.generate({
    fetchOptions: {
        headers: { /* session headers */ }
    }
})
```

### Verify Token
**Creates new session by default**

```typescript
// Server
const { session, user, token } = await auth.api.verifyOneTimeToken({
    body: { token: "abc123" }
})

// Client
const response = await authClient.oneTimeToken.verify({ token: "abc123" })
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `expiresIn` | `number` | `3` | Token expiration time in minutes |
| `disableClientRequest` | `boolean` | `false` | Only allow server-initiated token generation |
| `createSession` | `boolean` | `true` | Create new session when verifying token |
| `storeToken` | `"plain" \| "hashed" \| CustomHasher` | `"plain"` | How tokens are stored in database |
| `generateToken` | `function` | `undefined` | Custom token generation function |

## Use Cases

- **Session Transfer**: Move authenticated session to another device/browser
- **Temporary Links**: Generate short-lived access links for authenticated users
- **API Handoff**: Transfer session context to external services
- **Mobile Deep Links**: Authenticate mobile app from web session

## Security Notes

- Tokens are single-use and automatically deleted after verification
- Expired tokens are automatically cleaned up
- Uses existing Better Auth verification system
- No additional attack surface from new database tables
- Use `storeToken: "hashed"` for additional security in production
- Consider setting `disableClientRequest: true` for server-only token generation
- Default expiration of 3 minutes provides good security/usability balance