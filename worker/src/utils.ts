export function pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const retry = (retries: number, fn: Function) => fn().catch((err: any) => retries > 1 ? retry(retries - 1, fn) : Promise.reject(err));

export const backoff = (retries: number, fn: Function, delay = 500) => fn().catch((err: any) => retries > 1
    ? pause(delay).then(() => backoff(retries - 1, fn, delay * 2))
    : Promise.reject(err));

export function env(name: string): string {
    let value = process.env[name];
    if (value) {
        return value
    }
    throw new Error(`env ${name} is required`);
}