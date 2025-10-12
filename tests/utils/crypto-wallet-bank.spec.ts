// test/EvmCryptoWallet.import.spec.ts
import { describe, it, before } from "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sodium from "libsodium-wrappers";
import { ethers } from "ethers";

import {
  CryptoWalletConfig,
  RecoverPrivateKeyData,
} from "../../src/common/interfaces";
import { EvmCryptoWallet } from "../../src/utils/crypto-wallet";

chai.use(chaiAsPromised);

// --- Test config ---
const TEST_SERVER_KEY_HEX =
  "a304f41c2f61e072d5662ae4c36937fcc03bd2fddae72e784cfdbac255e819d2"; // 32-byte hex
const TEST_ADMIN_PIN = "admin-1234";
const TEST_DEFAULT_USER_PIN = "user-0000";

// Known EVM private key/address pair (Ganache first default account)
const IMPORT_PRIV =
  "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const IMPORT_ADDR = "0x90f8bf6A479f320ead074411a4B0e7944Ea8c9C1".toLowerCase();

describe("EvmCryptoWallet.importWallet", function () {
  this.timeout(30000);

  let cfg: CryptoWalletConfig;

  before(async () => {
    await sodium.ready;
    cfg = {
      privateKey: TEST_SERVER_KEY_HEX,
      adminPin: TEST_ADMIN_PIN,
      defaultUserPin: TEST_DEFAULT_USER_PIN,
    } as CryptoWalletConfig;
  });

  it("imports a wallet and returns correct address + wrapped shares", async () => {
    const svc = new EvmCryptoWallet(cfg);
    const out = await svc.importWallet(IMPORT_PRIV, "123456");

    expect(out.address.toLowerCase()).to.equal(IMPORT_ADDR);
    expect(out.nonce).to.match(/^[a-f0-9]{48}$/); // 24 bytes hex
    expect(out.userSecretPart).to.be.a("string").with.length.greaterThan(0);
    expect(out.serverSecretPart).to.be.a("string").with.length.greaterThan(0);
    expect(out.recoverySecretPart).to.be.a("string").with.length.greaterThan(0);
  });

  it("round-trips: recover with user+server / user+recovery / server+recovery", async () => {
    const svc = new EvmCryptoWallet(cfg);
    const created = await svc.importWallet(IMPORT_PRIV, "123456");

    const nonce = created.nonce;

    async function recoverAndCheck(data: Partial<RecoverPrivateKeyData>) {
      const priv = await svc.recoverPrivateKey({
        userPin: "123456",
        userSecret: data.userSecret,
        serverSecret: data.serverSecret,
        recoverySecret: data.recoverySecret,
        nonce,
      } as RecoverPrivateKeyData);

      expect(priv).to.match(/^0x[0-9a-fA-F]{64}$/);
      const w = new ethers.Wallet(priv);
      expect((await w.getAddress()).toLowerCase()).to.equal(IMPORT_ADDR);
      return priv;
    }

    // user + server
    await recoverAndCheck({
      userSecret: created.userSecretPart,
      serverSecret: created.serverSecretPart,
    });

    // user + recovery (recovery requires both pins → we supplied user pin)
    await recoverAndCheck({
      userSecret: created.userSecretPart,
      recoverySecret: created.recoverySecretPart,
    });

    // server + recovery (needs both pins → still requires the user pin param)
    await recoverAndCheck({
      serverSecret: created.serverSecretPart,
      recoverySecret: created.recoverySecretPart,
    });
  });

  it("wrong user PIN → all pairings reject (recovery needs both pins)", async () => {
    const svc = new EvmCryptoWallet(cfg);
    const created = await svc.importWallet(IMPORT_PRIV, "9999");

    const nonce = created.nonce;

    // {user + server}
    await expect(
      svc.recoverPrivateKey({
        userPin: "WRONG",
        userSecret: created.userSecretPart,
        serverSecret: created.serverSecretPart,
        nonce,
      } as RecoverPrivateKeyData)
    ).to.be.rejectedWith(/must provide 2 out of 3 keys/i);

    // {user + recovery}
    await expect(
      svc.recoverPrivateKey({
        userPin: "WRONG",
        userSecret: created.userSecretPart,
        recoverySecret: created.recoverySecretPart,
        nonce,
      } as RecoverPrivateKeyData)
    ).to.be.rejectedWith(/must provide 2 out of 3 keys/i);

    // {server + recovery}
    await expect(
      svc.recoverPrivateKey({
        userPin: "WRONG",
        serverSecret: created.serverSecretPart,
        recoverySecret: created.recoverySecretPart,
        nonce,
      } as RecoverPrivateKeyData)
    ).to.be.rejectedWith(/must provide 2 out of 3 keys/i);
  });

  it("wrong admin PIN (new instance) → all pairings reject", async () => {
    // Create with correct admin pin
    const goodSvc = new EvmCryptoWallet(cfg);
    const created = await goodSvc.importWallet(IMPORT_PRIV, "1357");
    const nonce = created.nonce;

    // Recover with a service configured with WRONG admin pin
    const badCfg: CryptoWalletConfig = {
      ...cfg,
      adminPin: "ADMIN-WRONG",
    } as CryptoWalletConfig;
    const badSvc = new EvmCryptoWallet(badCfg);

    // {user + server}
    await expect(
      badSvc.recoverPrivateKey({
        userPin: "1357",
        userSecret: created.userSecretPart,
        serverSecret: created.serverSecretPart,
        nonce,
      } as RecoverPrivateKeyData)
    ).to.be.rejected;

    // {user + recovery} (recovery requires admin too → fails)
    await expect(
      badSvc.recoverPrivateKey({
        userPin: "1357",
        userSecret: created.userSecretPart,
        recoverySecret: created.recoverySecretPart,
        nonce,
      } as RecoverPrivateKeyData)
    ).to.be.rejected;

    // {server + recovery} (both wrap depend on admin → fails)
    await expect(
      badSvc.recoverPrivateKey({
        userPin: "1357",
        serverSecret: created.serverSecretPart,
        recoverySecret: created.recoverySecretPart,
        nonce,
      } as RecoverPrivateKeyData)
    ).to.be.rejected;
  });

  it("rejects invalid private key input", async () => {
    const svc = new EvmCryptoWallet(cfg);
    await expect(svc.importWallet("not-a-key", "123456")).to.be.rejected;
  });

  it("does NOT call generateKeyPair during import", async () => {
    // Subclass that would crash if generateKeyPair() is called
    class GuardedWallet extends EvmCryptoWallet {
      protected async generateKeyPair(): Promise<any> {
        throw new Error("generateKeyPair should not be called by importWallet");
      }
    }
    const svc = new GuardedWallet(cfg);
    const out = await svc.importWallet(IMPORT_PRIV, "424242");
    expect(out.address.toLowerCase()).to.equal(IMPORT_ADDR);
  });
});
