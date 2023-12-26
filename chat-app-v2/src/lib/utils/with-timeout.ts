const REQUEST_TIMEOUT_TIME = 5000;

export function withTimeout<T>(callback: (r: (value: T) => void) => void) {
    return new Promise<T>((resolve, reject) => {
        setTimeout(reject, REQUEST_TIMEOUT_TIME);

        callback(resolve);
    })
}