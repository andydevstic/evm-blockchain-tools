import * as crypto from "crypto";

const algorithm = "aes-256-gcm"; // Switch to AES-GCM
const ivLength = 12; // IV length recommended for AES-GCM is 12 bytes
const saltLength = 16; // Salt length

// Helper to generate random bytes
function generateRandomBytes(length: number) {
  return crypto.randomBytes(length);
}

// Derive a key from the private string and the real salt
function getKeyFromPrivateString(privateString: string, realSalt: Buffer) {
  return crypto.scryptSync(privateString, realSalt, 32); // AES-256 requires 32-byte key
}

export function genSalt(length = saltLength): Buffer {
  return generateRandomBytes(length);
}

// Encrypt function with AES-GCM and one real salt and three dummy salts
export function encrypt(text: string, privateString: string) {
  const iv = generateRandomBytes(ivLength); // Generate IV
  const salt = genSalt();

  const key = getKeyFromPrivateString(privateString, salt);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag(); // Get the authentication tag (essential for GCM)

  // Concatenate IV, authTag, encrypted text, and salt into a single buffer
  const combined = Buffer.concat([iv, authTag, encrypted, salt]);

  // Return the entire buffer as a hex string
  return combined.toString("hex");
}

// Decrypt function with AES-GCM (need to extract the real salt from the shuffled salts)
export function decrypt(encryptedMessage: string, privateString: string) {
  try {
    // Convert the encrypted hex string back to a buffer
    const data = Buffer.from(encryptedMessage, "hex");

    // Extract IV, authTag, encrypted text, and salt based on their known lengths
    const iv = data.subarray(0, ivLength);
    const authTag = data.subarray(ivLength, ivLength + 16); // AuthTag is 16 bytes for AES-GCM
    const salt = data.subarray(data.length - saltLength); // Salt is the last part
    const encryptedText = data.subarray(
      ivLength + 16,
      data.length - saltLength
    ); // The rest is the ciphertext

    const key = getKeyFromPrivateString(privateString, salt);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag); // Set the authentication tag for AES-GCM

    let decrypted = decipher.update(encryptedText, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`failed to decrypt: ${error.message}`);
  }
}
