import { describe, it, before, beforeEach } from "mocha";
import { expect } from "chai";
import sodium from "libsodium-wrappers";
import crypto from "crypto";
import { ethers } from "ethers";

import { EvmCryptoWallet } from "../../src/utils/crypto-wallet/evm-crypto-wallet";
import {
  CryptoWalletConfig,
  RecoverPrivateKeyData,
} from "../../src/common/interfaces";

// --- constants / helpers ---
const TEST_SERVER_KEY_HEX =
  "a304f41c2f61e072d5662ae4c36937fcc03bd2fddae72e784cfdbac255e819d2";
const TEST_ADMIN_PIN = "admin-1234";
const TEST_DEFAULT_USER_PIN = "user-0000";

function flipOneHexNibble(hex: string): string {
  const buf = Buffer.from(hex, "hex");
  buf[0] ^= 0x01;
  return buf.toString("hex");
}

async function expectRejects(promise: Promise<any>, re?: RegExp) {
  let threw = false;
  try {
    await promise;
  } catch (err: any) {
    threw = true;
    if (re) {
      expect(String(err?.message || err)).to.match(re);
    }
  }
  if (!threw) throw new Error("Expected promise to reject, but it resolved.");
}

describe("EvmCryptoWallet (Mocha + Chai)", function () {
  this.timeout(30000);

  let cfg: CryptoWalletConfig;
  let svc: EvmCryptoWallet;

  before(async () => {
    await sodium.ready;
    cfg = {
      privateKey: TEST_SERVER_KEY_HEX,
      adminPin: TEST_ADMIN_PIN,
      defaultUserPin: TEST_DEFAULT_USER_PIN,
    } as CryptoWalletConfig;
  });

  beforeEach(() => {
    // fresh instance each test (simulates a clean service process)
    svc = new EvmCryptoWallet(cfg);
  });

  describe("createWallet", () => {
    it("returns address, hex nonce, and 3 wrapped shares", async () => {
      const out = await svc.createWallet(TEST_DEFAULT_USER_PIN);

      expect(out.address).to.match(/^0x[a-fA-F0-9]{40}$/);
      // nonce is 24 random bytes → 48 hex chars
      expect(out.nonce).to.match(/^[a-f0-9]{48}$/);

      expect(out.userSecretPart).to.be.a("string").with.length.greaterThan(0);
      expect(out.serverSecretPart).to.be.a("string").with.length.greaterThan(0);
      expect(out.recoverySecretPart)
        .to.be.a("string")
        .with.length.greaterThan(0);
    });
  });

  describe("recovery 2-of-3 happy paths", () => {
    let created: Awaited<ReturnType<EvmCryptoWallet["createWallet"]>>;
    let nonce: string;
    let address: string;

    before(async () => {
      created = await svc.createWallet("123456"); // simulate user PIN
      nonce = created.nonce;
      address = created.address;
    });

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
      const got = await w.getAddress();
      expect(got).to.equal(address);
      return priv;
    }

    it("user + server", async () => {
      await recoverAndCheck({
        userSecret: created.userSecretPart,
        serverSecret: created.serverSecretPart,
      });
    });

    it("user + recovery", async () => {
      await recoverAndCheck({
        userSecret: created.userSecretPart,
        recoverySecret: created.recoverySecretPart,
      });
    });

    it("server + recovery", async () => {
      await recoverAndCheck({
        serverSecret: created.serverSecretPart,
        recoverySecret: created.recoverySecretPart,
      });
    });
  });

  describe("failure modes", () => {
    let created: Awaited<ReturnType<EvmCryptoWallet["createWallet"]>>;
    let nonce: string;

    before(async () => {
      created = await svc.createWallet("9999");
      nonce = created.nonce;
    });

    it("only one share → rejects", async () => {
      await expectRejects(
        svc.recoverPrivateKey({
          userPin: "9999",
          userSecret: created.userSecretPart,
          nonce,
        } as RecoverPrivateKeyData),
        /must provide 2 out of 3 keys/i
      );
    });

    it("wrong user PIN → all pairings reject (recovery requires both pins)", async () => {
      // {user + server}
      await expectRejects(
        svc.recoverPrivateKey({
          userPin: "WRONG",
          userSecret: created.userSecretPart,
          serverSecret: created.serverSecretPart,
          nonce,
        } as RecoverPrivateKeyData),
        /must provide 2 out of 3 keys \(share unwrap failed\)/i
      );
      // {user + recovery}
      await expectRejects(
        svc.recoverPrivateKey({
          userPin: "WRONG",
          userSecret: created.userSecretPart,
          recoverySecret: created.recoverySecretPart,
          nonce,
        } as RecoverPrivateKeyData),
        /must provide 2 out of 3 keys \(share unwrap failed\)/i
      );
      // {server + recovery}
      await expectRejects(
        svc.recoverPrivateKey({
          userPin: "WRONG",
          serverSecret: created.serverSecretPart,
          recoverySecret: created.recoverySecretPart,
          nonce,
        } as RecoverPrivateKeyData),
        /must provide 2 out of 3 keys \(share unwrap failed\)/i
      );
    });

    it("wrong admin PIN (new instance) → all pairings reject", async () => {
      // simulate operator misconfig with different admin PIN
      const badCfg: CryptoWalletConfig = {
        privateKey: TEST_SERVER_KEY_HEX,
        adminPin: "ADMIN-WRONG",
        defaultUserPin: TEST_DEFAULT_USER_PIN,
      } as CryptoWalletConfig;
      const badSvc = new EvmCryptoWallet(badCfg);

      // {user + server}
      await expectRejects(
        badSvc.recoverPrivateKey({
          userPin: "9999",
          userSecret: created.userSecretPart,
          serverSecret: created.serverSecretPart,
          nonce,
        } as RecoverPrivateKeyData)
      );
      // {user + recovery}
      await expectRejects(
        badSvc.recoverPrivateKey({
          userPin: "9999",
          userSecret: created.userSecretPart,
          recoverySecret: created.recoverySecretPart,
          nonce,
        } as RecoverPrivateKeyData)
      );
      // {server + recovery}
      await expectRejects(
        badSvc.recoverPrivateKey({
          userPin: "9999",
          serverSecret: created.serverSecretPart,
          recoverySecret: created.recoverySecretPart,
          nonce,
        } as RecoverPrivateKeyData)
      );
    });

    it("tampered user share → {user + server} fails; {server + recovery} still succeeds with correct pins", async () => {
      const tamperedUser = flipOneHexNibble(created.userSecretPart);

      await expectRejects(
        svc.recoverPrivateKey({
          userPin: "9999",
          userSecret: tamperedUser,
          serverSecret: created.serverSecretPart,
          nonce,
        } as RecoverPrivateKeyData)
      );

      // correct user PIN; recovery share uses both pins internally, so this should succeed
      const ok = await svc.recoverPrivateKey({
        userPin: "9999",
        serverSecret: created.serverSecretPart,
        recoverySecret: created.recoverySecretPart,
        nonce,
      } as RecoverPrivateKeyData);
      expect(ok).to.match(/^0x[0-9a-fA-F]{64}$/);
    });

    it("nonce tamper → final secretbox open fails", async () => {
      const badNonce = crypto.randomBytes(24).toString("hex");
      await expectRejects(
        svc.recoverPrivateKey({
          userPin: "9999",
          userSecret: created.userSecretPart,
          serverSecret: created.serverSecretPart,
          nonce: badNonce,
        } as RecoverPrivateKeyData)
      );
    });
  });
});
