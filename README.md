# one-time-token-session

A lightweight one-time token plugin for Better Auth that generates temporary tokens for existing sessions. Unlike the official one-time-token plugin, this plugin doesn't require additional database tables and works with the existing verification system.

## Key Differences from Official Plugin

- **No Database Schema**: Uses existing verification table instead of dedicated one-time-token table
- **Session-Based**: Generates tokens for existing authenticated sessions
- **Simpler Setup**: No additional database migrations required
- **Lightweight**: Minimal configuration and setup

## Installation

```bash
npm install better-auth
```

## Usage

### Basic Setup

```typescript
import { betterAuth } from "better-auth"
import { oneTimeToken } from "better-auth/plugins/one-time-token-session"

export const auth = betterAuth({
    plugins: [
        oneTimeToken()
    ]
})
```

### Client Setup

```typescript
import { createAuthClient } from "better-auth/client"
import { oneTimeTokenClient } from "better-auth/plugins/one-time-token-session/client"

export const authClient = createAuthClient({
    plugins: [
        oneTimeTokenClient()
    ]
})
```

## Configuration Options

```typescript
oneTimeToken({
    expiresIn: 5,              // Token expires in 5 minutes (default: 3)
    disableClientRequest: true, // Server-only token generation (default: false)
    createSession: false,       // Don't create new session on verify (default: true)
    storeToken: "hashed",      // Hash tokens in database (default: "plain")
})
```

## API Endpoints

### Generate Token
**Requires existing session**

```typescript
// Server
const { token } = await auth.api.generateOneTimeToken({ headers })

// Client  
const { token } = await authClient.oneTimeToken.generate()
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

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `expiresIn` | `3` | Token expiration in minutes |
| `disableClientRequest` | `false` | Block client-side token generation |
| `createSession` | `true` | Create new session when verifying |
| `storeToken` | `"plain"` | Token storage: `"plain"`, `"hashed"`, or custom hasher |

## Use Cases

- **Session Transfer**: Move authenticated session to another device/browser
- **Temporary Links**: Generate short-lived access links for authenticated users
- **API Handoff**: Transfer session context to external services
- **Mobile Deep Links**: Authenticate mobile app from web session

## Security

- Tokens are single-use and auto-deleted after verification
- Expired tokens are automatically cleaned up
- Uses existing Better Auth verification system
- No additional attack surface from new database tables