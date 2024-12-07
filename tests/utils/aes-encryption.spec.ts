import { expect } from "chai";
import { decrypt, encrypt } from "../../src/utils/aes-encryption";

describe("AesEncryptionService", () => {
  it("shoult encrypt and decrypt successful", () => {
    const privateString = "12345";
    const data = "Andy";
    const encrypted = encrypt(data, privateString);

    const decrypted = decrypt(encrypted, privateString);

    expect(data).to.be.eq(decrypted);
  });

  it("shoult throws if private string is invalid", () => {
    const privateString = "12345";
    const data = "Andy";
    const encrypted = encrypt(data, privateString);

    expect(() => decrypt(encrypted, "123")).to.throw();
  });
});
