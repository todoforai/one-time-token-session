import { createHash } from "crypto";

export const defaultKeyHasher = async (token: string) => {
	const hash = createHash("sha256")
		.update(token)
		.digest();
	return hash.toString("base64url");
};
