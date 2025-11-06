import type { BetterAuthClientPlugin } from "@better-auth/core";
import type { oneTimeTokenSession } from "./index";

export const oneTimeTokenSessionClient = () => {
	return {
		id: "one-time-token-session",
		$InferServerPlugin: {} as ReturnType<typeof oneTimeTokenSession>,
		// Path methods are inferred correctly: GET for generate, POST for verify
		pathMethods: {
			"/one-time-token-session/generate": "GET",
			"/one-time-token-session/verify": "POST",
		},
	} satisfies BetterAuthClientPlugin;
};