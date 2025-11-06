import type {
	BetterAuthPlugin,
	GenericEndpointContext,
} from "@better-auth/core";
import { createAuthEndpoint } from "better-auth/api";
import { sessionMiddleware } from "better-auth/api";
import { generateRandomString } from "better-auth/crypto";
import type { Session, User } from "better-auth/types";
import { setSessionCookie } from "better-auth/cookies";
import * as z from "zod";
import { defaultKeyHasher } from "./utils";

export interface OneTimeTokenSessionOptions {
	/**
	 * Expires in minutes
	 *
	 * @default 3
	 */
	expiresIn?: number | undefined;
	/**
	 * Only allow server initiated requests
	 */
	disableClientRequest?: boolean | undefined;
	/**
	 * Generate a custom token
	 */
	generateToken?:
		| ((
				session: {
					user: User & Record<string, any>;
					session: Session & Record<string, any>;
				},
				ctx: GenericEndpointContext,
		  ) => Promise<string>)
		| undefined;
	/**
	 * This option allows you to configure how the token is stored in your database.
	 * Note: This will not affect the token that's sent, it will only affect the token stored in your database.
	 *
	 * @default "plain"
	 */
	storeToken?:
		| (
				| "plain"
				| "hashed"
				| { type: "custom-hasher"; hash: (token: string) => Promise<string> }
		  )
		| undefined;
	/**
	 * Create a new session when verifying the token
	 * 
	 * @default true
	 */
	createSession?: boolean | undefined;
}

export const oneTimeTokenSession = (options?: OneTimeTokenSessionOptions) => {
	const opts = {
		storeToken: "plain" as const,
		createSession: true,
		expiresIn: 3,
		...options,
	} satisfies OneTimeTokenSessionOptions;

	async function storeToken(ctx: GenericEndpointContext, token: string) {
		if (opts.storeToken === "hashed") {
			return await defaultKeyHasher(token);
		}
		if (
			typeof opts.storeToken === "object" &&
			"type" in opts.storeToken &&
			opts.storeToken.type === "custom-hasher"
		) {
			return await opts.storeToken.hash(token);
		}

		return token;
	}

	return {
		id: "one-time-token-session",
		endpoints: {
			/**
			 * ### Endpoint
			 *
			 * GET `/one-time-token-session/generate`
			 *
			 * ### API Methods
			 *
			 * **server:**
			 * `auth.api.generateOneTimeTokenSession`
			 *
			 * **client:**
			 * `authClient.oneTimeTokenSession.generate`
			 *
			 */
			generateOneTimeTokenSession: createAuthEndpoint(
				"/one-time-token-session/generate",
				{
					method: "GET",
					use: [sessionMiddleware],
				},
				async (c) => {
					if (opts.disableClientRequest && c.request) {
						throw c.error("BAD_REQUEST", {
							message: "Client requests are disabled",
						});
					}
					
					const session = c.context.session;
					const token = opts.generateToken
						? await opts.generateToken(session, c)
						: generateRandomString(32);
					
					const expiresAt = new Date(
						Date.now() + opts.expiresIn * 60 * 1000,
					);
					
					const storedToken = await storeToken(c, token);
					
					await c.context.internalAdapter.createVerificationValue({
						value: session.session.token,
						identifier: `one-time-token:${storedToken}`,
						expiresAt,
					});
					
					return c.json({ token });
				},
			),
			/**
			 * ### Endpoint
			 *
			 * POST `/one-time-token-session/verify`
			 *
			 * ### API Methods
			 *
			 * **server:**
			 * `auth.api.verifyOneTimeTokenSession`
			 *
			 * **client:**
			 * `authClient.oneTimeTokenSession.verify`
			 *
			 */
			verifyOneTimeTokenSession: createAuthEndpoint(
				"/one-time-token-session/verify",
				{
					method: "POST",
					body: z.object({
						token: z.string().min(1, "Token is required"),
					}),
				},
				async (c) => {
					const { token } = c.body;
					const storedToken = await storeToken(c, token);
					
					const verificationValue =
						await c.context.internalAdapter.findVerificationValue(
							`one-time-token:${storedToken}`,
						);
					
					if (!verificationValue) {
						throw c.error("BAD_REQUEST", {
							message: "Invalid token",
						});
					}
					
					if (verificationValue.expiresAt < new Date()) {
						await c.context.internalAdapter.deleteVerificationValue(
							verificationValue.id,
						);
						throw c.error("BAD_REQUEST", {
							message: "Token expired",
						});
					}
					
					// Delete the verification value first to prevent reuse
					await c.context.internalAdapter.deleteVerificationValue(
						verificationValue.id,
					);
					
					const session = await c.context.internalAdapter.findSession(
						verificationValue.value,
					);
					
					if (!session) {
						throw c.error("BAD_REQUEST", {
							message: "Session not found",
						});
					}

					if (opts.createSession) {
						// Create a new session
						const newSession = await c.context.internalAdapter.createSession(
							session.session.userId,
							c,
						);
						
						// Set session cookie
						await setSessionCookie(c, {
							session: newSession,
							user: session.user,
						});

						return c.json({
							session: newSession,
							user: session.user,
							token: newSession.token,
						});
					}

					return c.json({
						session: session.session,
						user: session.user,
						token: null,
					});
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
