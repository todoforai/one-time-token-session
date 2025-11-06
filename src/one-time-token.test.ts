import { APIError } from "better-call";
import { describe, expect, it, vi } from "vitest";
import { getTestInstance } from "../../../test-utils/test-instance";
import { oneTimeTokenSession } from ".";
import { oneTimeTokenSessionClient } from "./client";
import { defaultKeyHasher } from "./utils";

describe("One-time token session", async () => {
	const { auth, signInWithTestUser, client } = await getTestInstance(
		{
			plugins: [oneTimeTokenSession()],
		},
		{
			clientOptions: {
				plugins: [oneTimeTokenSessionClient()],
			},
		},
	);
	it("should work", async () => {
		const { headers } = await signInWithTestUser();
		const response = await auth.api.generateOneTimeToken({
			headers,
		});
		expect(response.token).toBeDefined();
		const verifyResponse = await auth.api.verifyOneTimeToken({
			body: {
				token: response.token,
			},
		});
		expect(verifyResponse.session).toBeDefined();
		expect(verifyResponse.user).toBeDefined();
		expect(verifyResponse.token).toBeDefined(); // Should have token when createSession is true
		
		const shouldFail = await auth.api
			.verifyOneTimeToken({
				body: {
					token: response.token,
				},
			})
			.catch((e) => e);
		expect(shouldFail).toBeInstanceOf(APIError);
	});

	it("should expire", async () => {
		const { headers } = await signInWithTestUser();
		const response = await auth.api.generateOneTimeToken({
			headers,
		});
		vi.useFakeTimers();
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		const shouldFail = await auth.api
			.verifyOneTimeToken({
				body: {
					token: response.token,
				},
			})
			.catch((e) => e);
		expect(shouldFail).toBeInstanceOf(APIError);
		vi.useRealTimers();
	});

	it("should work with client", async () => {
		const { headers } = await signInWithTestUser();
		const response = await client.oneTimeToken.generate({
			fetchOptions: {
				headers,
				throw: true,
			},
		});
		expect(response.token).toBeDefined();
		const verifyResponse = await client.oneTimeToken.verify({
			token: response.token,
		});
		expect(verifyResponse.data?.session).toBeDefined();
		expect(verifyResponse.data?.user).toBeDefined();
		expect(verifyResponse.data?.token).toBeDefined();
	});

	it("should create new session when verifying token", async () => {
		const { headers } = await signInWithTestUser();
		const response = await auth.api.generateOneTimeToken({
			headers,
		});
		expect(response.token).toBeDefined();
		
		const verifyResponse = await auth.api.verifyOneTimeToken({
			body: {
				token: response.token,
			},
		});
		
		expect(verifyResponse.session).toBeDefined();
		expect(verifyResponse.user).toBeDefined();
		expect(verifyResponse.token).toBeDefined();
		expect(verifyResponse.session.id).toBeDefined();
		expect(verifyResponse.session.token).toBeDefined();
	});

	it("should not create new session when createSession is false", async () => {
		const { auth: authNoSession, signInWithTestUser: signInNoSession } = await getTestInstance({
			plugins: [oneTimeTokenSession({ createSession: false })],
		});

		const { headers } = await signInNoSession();
		const response = await authNoSession.api.generateOneTimeToken({
			headers,
		});
		
		const verifyResponse = await authNoSession.api.verifyOneTimeToken({
			body: {
				token: response.token,
			},
		});
		
		// Should return the original session format without new token
		expect(verifyResponse.user).toBeDefined();
		expect(verifyResponse.session).toBeDefined();
		expect(verifyResponse.token).toBeNull();
	});

	describe("should work with different storeToken options", () => {
		describe("hashed", async () => {
			const { auth, signInWithTestUser, client } = await getTestInstance(
				{
					plugins: [
						oneTimeTokenSession({
							storeToken: "hashed",
							async generateToken(session, ctx) {
								return "123456";
							},
						}),
					],
				},
				{
					clientOptions: {
						plugins: [oneTimeTokenSessionClient()],
					},
				},
			);
			const { internalAdapter } = await auth.$context;

			it("should work with hashed", async () => {
				const { headers } = await signInWithTestUser();
				const response = await auth.api.generateOneTimeToken({
					headers,
				});
				expect(response.token).toBeDefined();
				expect(response.token).toBe("123456");

				const hashedToken = await defaultKeyHasher(response.token);
				const storedToken = await internalAdapter.findVerificationValue(
					`one-time-token:${hashedToken}`,
				);
				expect(storedToken).toBeDefined();

				const verifyResponse = await auth.api.verifyOneTimeToken({
					body: {
						token: response.token,
					},
				});
				expect(verifyResponse.session).toBeDefined();
				expect(verifyResponse.user).toBeDefined();
				expect(verifyResponse.user.email).toBeDefined();
			});
		});

		describe("custom hasher", async () => {
			const { auth, signInWithTestUser, client } = await getTestInstance({
				plugins: [
					oneTimeTokenSession({
						storeToken: {
							type: "custom-hasher",
							hash: async (token) => {
								return token + "hashed";
							},
						},
						async generateToken(session, ctx) {
							return "123456";
						},
					}),
				],
			});
			const { internalAdapter } = await auth.$context;
			it("should work with custom hasher", async () => {
				const { headers } = await signInWithTestUser();
				const response = await auth.api.generateOneTimeToken({
					headers,
				});
				expect(response.token).toBeDefined();
				expect(response.token).toBe("123456");

				const hashedToken = response.token + "hashed";
				const storedToken = await internalAdapter.findVerificationValue(
					`one-time-token:${hashedToken}`,
				);
				expect(storedToken).toBeDefined();

				const verifyResponse = await auth.api.verifyOneTimeToken({
					body: {
						token: response.token,
					},
				});
				expect(verifyResponse.session).toBeDefined();
				expect(verifyResponse.user).toBeDefined();
			});
		});
	});
});
