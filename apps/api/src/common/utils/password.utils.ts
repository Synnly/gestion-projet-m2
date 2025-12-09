
// All possible caracters for the generated passwords.
const lower: string = 'abcdefghijklmnopqrstuvwxyz';
const upper: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers: string = '0123456789';
const symbols: string = '!@#$%^&*()-+_=';
const allCharacters: string = lower + upper + numbers + symbols;

const getRandomChar = (charSet: string): string => {
    const randomIndex: number = Math.floor(Math.random() * charSet.length);
    return charSet.charAt(randomIndex);
};

/**
 * Generate a random string for a strong password.
 * Guarantees at least one lowercase, uppercase, number, and symbol.
 *
 * @param length Number of character in the generated password (default: 20).
 * @returns The generated password as a string.
 */
export function generateRandomPassword(length: number = 20): string {
    if (length < 8) length = 8;

    let password: string[] = [];
    // force at least 1 character of each category in the password
    password.push(getRandomChar(lower));
    password.push(getRandomChar(upper));
    password.push(getRandomChar(numbers));
    password.push(getRandomChar(symbols));

    // fill the rest of the password
    const remainingLength: number = length - 4;
    for (let i = 0; i < remainingLength; i++) {
        password.push(getRandomChar(allCharacters));
    }

    // mix the characters order in the password
    for (let i = password.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1));
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}