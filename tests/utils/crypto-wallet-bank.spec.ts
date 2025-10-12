import { describe, it, beforeEach } from "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { CryptoWalletBank } from "../../src/registries";
import {
  WALLET_TYPE,
  WALLET_OWNERSHIP_TYPE,
} from "../../src/common/interfaces";

chai.use(chaiAsPromised);

type CryptoWallet = {
  id: string;
  address: string;
  name: string;
  username: string;
  type: WALLET_TYPE;
  ownershipType: WALLET_OWNERSHIP_TYPE;
  data: any;
};

type WalletCreateInput = Omit<CryptoWallet, "id">;

type WalletStorage = {
  create(data: WalletCreateInput): Promise<CryptoWallet>;
  getOne(query: { username: string; id: string }): Promise<CryptoWallet | null>;
};

type EvmCreateOut = {
  address: string;
  nonce: string;
  userSecretPart: string;
  serverSecretPart: string;
  recoverySecretPart: string;
};

type CryptoWalletEngine = {
  createWallet(userPin?: string): Promise<EvmCreateOut>;
  recoverPrivateKey(args: {
    nonce: string;
    userPin?: string;
    userSecret?: string;
    serverSecret?: string;
    recoverySecret?: string;
  }): Promise<string>;
};

// ----- System under test -----

// ----- In-memory storage mock -----
class InMemoryStorage implements WalletStorage {
  private map = new Map<string, CryptoWallet>();
  private seq = 1;
  async create(data: WalletCreateInput): Promise<CryptoWallet> {
    const id = String(this.seq++);
    const rec: CryptoWallet = { id, ...data };
    this.map.set(id, rec);
    return rec;
  }
  async getOne(query: {
    username: string;
    id: string;
  }): Promise<CryptoWallet | null> {
    const rec = this.map.get(query.id) || null;
    if (rec && rec.username === query.username) return rec;
    return null;
  }
}

// ----- Engine mock -----
class FakeEvmEngine implements CryptoWalletEngine {
  public lastCreatePin?: string;
  public lastRecoverArgs?: any;

  async createWallet(userPin?: string): Promise<EvmCreateOut> {
    this.lastCreatePin = userPin;
    return {
      address: "0x1111111111111111111111111111111111111111",
      nonce: "a".repeat(48), // hex 24 bytes
      userSecretPart: "user-ct-hex",
      serverSecretPart: "server-ct-hex",
      recoverySecretPart: "recovery-ct-hex",
    };
  }

  async recoverPrivateKey(args: {
    nonce: string;
    userPin?: string;
    userSecret?: string;
    serverSecret?: string;
    recoverySecret?: string;
  }): Promise<string> {
    this.lastRecoverArgs = args;

    // Simulate policy:
    // - user flow requires userSecret + serverSecret
    // - recovery flow requires serverSecret + recoverySecret
    const hasUserServer = !!(args.userSecret && args.serverSecret);
    const hasServerRecovery = !!(args.serverSecret && args.recoverySecret);

    if (!hasUserServer && !hasServerRecovery) {
      throw new Error("must provide 2 out of 3 keys");
    }
    if (!/^([a-f0-9]{48})$/i.test(args.nonce)) {
      throw new Error("bad nonce");
    }
    // Return a fixed-looking EVM key
    return "0x" + "b".repeat(64);
  }
}

// ----- Tests -----
describe("CryptoWalletBank", () => {
  let storage: InMemoryStorage;
  let engine: FakeEvmEngine;
  let bank: CryptoWalletBank;

  beforeEach(() => {
    storage = new InMemoryStorage();
    engine = new FakeEvmEngine();
    bank = new CryptoWalletBank(storage as any, engine as any);
  });

  it("createNewWallet persists and returns walletId", async () => {
    const res = await bank.createNewWallet(
      "alice",
      "My Wallet",
      "123456", // user pin
      WALLET_TYPE.EVM,
      {}
    );
    expect(res.success).to.equal(true);
    expect(res.data?.walletId).to.be.a("string");

    const stored = await storage.getOne({
      username: "alice",
      id: res.data!.walletId,
    });
    expect(stored).not.to.equal(null);
    expect(stored!.address).to.equal(
      "0x1111111111111111111111111111111111111111"
    );
    expect(stored!.type).to.equal(WALLET_TYPE.EVM);
    expect(stored!.ownershipType).to.equal(WALLET_OWNERSHIP_TYPE.MASTER);
    expect(engine.lastCreatePin).to.equal("123456");
  });

  it("getWallet uses user+server secrets and returns the private key", async () => {
    const { data } = await bank.createNewWallet(
      "bob",
      "Wallet B",
      "9999",
      WALLET_TYPE.EVM
    );
    const walletId = data!.walletId;

    const pk = await bank.getWallet("bob", walletId, "9999", {
      userSecret: "user-ct-hex",
      serverSecret: "server-ct-hex",
    });
    expect(pk).to.match(/^0x[0-9a-fA-F]{64}$/);

    // Engine saw the right args
    expect(engine.lastRecoverArgs.userPin).to.equal("9999");
    expect(engine.lastRecoverArgs.userSecret).to.equal("user-ct-hex");
    expect(engine.lastRecoverArgs.serverSecret).to.equal("server-ct-hex");
    expect(engine.lastRecoverArgs.recoverySecret).to.equal(undefined);
  });

  it("recoverWallet uses server+recovery secrets and returns the private key", async () => {
    const { data } = await bank.createNewWallet(
      "carol",
      "Wallet C",
      "2468",
      WALLET_TYPE.EVM
    );
    const walletId = data!.walletId;

    const pk = await bank.recoverWallet("carol", walletId, "2468", {
      serverSecret: "server-ct-hex",
      recoverySecret: "recovery-ct-hex",
    });
    expect(pk).to.match(/^0x[0-9a-fA-F]{64}$/);

    expect(engine.lastRecoverArgs.userPin).to.equal("2468");
    expect(engine.lastRecoverArgs.serverSecret).to.equal("server-ct-hex");
    expect(engine.lastRecoverArgs.recoverySecret).to.equal("recovery-ct-hex");
    expect(engine.lastRecoverArgs.userSecret).to.equal(undefined);
  });

  it("getWallet throws when userSecret or serverSecret missing", async () => {
    const { data } = await bank.createNewWallet(
      "dave",
      "Wallet D",
      "0000",
      WALLET_TYPE.EVM
    );
    const walletId = data!.walletId;

    // If you added the validations suggested above:
    await expect(
      bank.getWallet("dave", walletId, "0000", {
        userSecret: "only-user",
      }) as any
    ).to.be.rejected; // if you use chai-as-promised; else wrap expectRejects

    // Without the extra validations, the engine will reject:
    try {
      await bank.getWallet("dave", walletId, "0000", {
        userSecret: "only-user",
      } as any);
      throw new Error("should have thrown");
    } catch (e: any) {
      expect(String(e.message)).to.match(
        /(getWallet requires|must provide 2 out of 3 keys)/i
      );
    }
  });

  it("recoverWallet throws when recoverySecret or serverSecret missing", async () => {
    const { data } = await bank.createNewWallet(
      "erin",
      "Wallet E",
      "1357",
      WALLET_TYPE.EVM
    );
    const walletId = data!.walletId;

    try {
      await bank.recoverWallet("erin", walletId, "1357", {
        recoverySecret: "only-recovery",
      } as any);
      throw new Error("should have thrown");
    } catch (e: any) {
      expect(String(e.message)).to.match(
        /(recoverWallet requires|must provide 2 out of 3 keys)/i
      );
    }
  });

  it("getWallet throws when wallet not found", async () => {
    try {
      await bank.getWallet("zoe", "9999", "pin", {
        userSecret: "u",
        serverSecret: "s",
      });
      throw new Error("should have thrown");
    } catch (e: any) {
      expect(String(e.message)).to.match(/wallet not found/i);
    }
  });

  it("recoverWallet throws when type not supported", async () => {
    // Insert a non-EVM wallet directly into storage
    const created = await (storage as any).create({
      address: "X",
      data: {},
      name: "Weird",
      ownershipType: WALLET_OWNERSHIP_TYPE.MASTER,
      username: "ned",
      type: WALLET_TYPE.SOL, // not supported
    });

    try {
      await bank.recoverWallet("ned", created.id, "pin", {
        serverSecret: "s",
        recoverySecret: "r",
      });
      throw new Error("should have thrown");
    } catch (e: any) {
      expect(String(e.message)).to.match(/wallet type not supported/i);
    }
  });
});
