import type { BetterAuthClientPlugin } from "@better-auth/core";
import type { oneTimeTokenSession } from "./index";

export const oneTimeTokenSessionClient = () => {
	return {
		id: "one-time-token-session",
		$InferServerPlugin: {} as ReturnType<typeof oneTimeTokenSession>,
	} satisfies BetterAuthClientPlugin;
};