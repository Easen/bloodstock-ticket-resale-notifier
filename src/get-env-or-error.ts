export function getEnvVarOrError(envVar: string): string {
    const val = process.env[envVar];
    if (!val) {
        throw new Error(`Missing env var ${envVar}`);
    }
    return val;
}
