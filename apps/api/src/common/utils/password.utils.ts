export function generateRandomPassword(n: number = 64): string {
    let s = '';
    for (let i = 0; i < n; i++) {
        s += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    return s;
}
