import { readFileSync, writeFileSync } from 'fs';
export function readState<T extends unknown>(file: string, initialValue = {}): T {
    let state = initialValue;
    try {
        state = JSON.parse(readFileSync(file).toString());
    } catch (err) {
        writeFileSync(file, JSON.stringify(state));
    }
    return state as T;
}

export function writeState(file: string, data: unknown) {
    writeFileSync(file, JSON.stringify(data));
}

