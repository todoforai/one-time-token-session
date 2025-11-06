# BetterAuth/plugin: one-time-token-session 

A lightweight one-time token session sharing plugin for the [Better Auth](https://www.better-auth.com/) framework. 

And by default, verifying a token creates a new session (`createSession: true`).
Which automatically sync the useSession() state, so your project auth is simplified! 

So you can transfer login state while not facing with same cookie issues.

The builtin [BetterAuth/OneTimeToken](https://www.better-auth.com/docs/plugins/one-time-token) doesn't work as simply as I want. So I repaired it. 

## Key Differences from Official Plugin

- **No Database Schema**: Uses existing verification table instead of dedicated one-time-token table
- **Session-Based**: Generates tokens for existing authenticated sessions
- **Simpler Setup**: No additional database migrations required
- **Lightweight**: Minimal configuration and setup

## Very simple DEMO

Note we send the generated token via URL protocol! So in the app we simply verify the token and gets the user session! ;)

## Installation

```bash
npm install better-auth-one-time-token-session
```

## Your Plugin is Ready! 🎉
## Usage
### Server Setup

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
const { data } = await auth.api.generateOneTimeToken({})
data.token

// Client  (recommended)
const { data } = await authClient.oneTimeTokenSession.generate({})
data.token
```

### Verify Token
**Creates new session by default**

```typescript
// Server
const response = await auth.api.verifyOneTimeToken({})
const { session, user, token } = response.data

// Client  (recommended)
const response = await authClient.oneTimeTokenSession.verify({ token: "abc123" })
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
- **Temporary token**: Generate short-lived access token for authenticated users
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

## Contributor

https://todofor.ai



