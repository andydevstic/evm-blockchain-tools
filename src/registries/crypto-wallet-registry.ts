import { WalletStorage } from "../common/interfaces";

export class CryptoWalletRegistry {
  constructor(protected storageEngine: WalletStorage) {}

  // public async initMasterWallet(): Promise<WithdrawWalletDTO> {
  //   const existingMasterWallet = await this.getMasterWallet();
  //   if (existingMasterWallet) {
  //     throw new Error("master wallet already exists");
  //   }

  //   const newWallet = await this.createBlockchainWallet();

  //   await this.storageEngine.bulkCreate([
  //     {
  //       ...newWallet,
  //       name: "master_wallet",
  //       type: WALLET_TYPE.MASTER,
  //     },
  //   ]);

  //   return this.getMasterWallet();
  // }

  // public async getWalletById(
  //   id: string,
  //   adminPin: string,
  //   userPin?: string
  // ): Promise<WithdrawWalletDTO & HasPrivateKey> {
  //   const foundWallet = await this.storageEngine.getOne({
  //     id,
  //   });

  //   if (!foundWallet) {
  //     throw new Error(`wallet with id ${id} not found`);
  //   }

  //   const privateKey = await this.recoverWalletPrivateKey(
  //     foundWallet,
  //     adminPin,
  //     userPin
  //   );

  //   return {
  //     ...this.walletToDTO(foundWallet),
  //     privateKey,
  //   };
  // }

  // public async getWalletsByFilter(
  //   filter: Record<any, any>,
  //   adminPin: string,
  //   userPin?: string
  // ): Promise<(WithdrawWalletDTO & HasPrivateKey)[]> {
  //   const foundWallets = await this.storageEngine.getMany(filter);

  //   if (!foundWallets.length) {
  //     return [];
  //   }

  //   const recoverredWallets = await Promise.all(
  //     foundWallets.map(async (wallet) => {
  //       const privateKey = await this.recoverWalletPrivateKey(
  //         wallet,
  //         adminPin,
  //         userPin
  //       );

  //       return {
  //         ...this.walletToDTO(wallet),
  //         privateKey,
  //       };
  //     })
  //   );

  //   return recoverredWallets;
  // }

  // protected walletToDTO(wallet: WithdrawWallet): WithdrawWalletDTO {
  //   return {
  //     address: wallet.address,
  //     id: wallet.id,
  //     name: wallet.name,
  //     type: wallet.type,
  //   };
  // }

  // protected async recoverWalletPrivateKey(
  //   wallet: WithdrawWallet,
  //   adminPin: string,
  //   userPin?: string
  // ): Promise<string> {
  //   const { privateKey: secret, defaultUserPin } = this.config;
  //   const { serverSecretPart, userSecretPart, nonce } = wallet;

  //   const decodedServerSecret = decrypt(
  //     serverSecretPart,
  //     `${secret}_${encrypt(adminPin, secret)}`
  //   );

  //   const decodedUserSecret = decrypt(
  //     userSecretPart,
  //     `${secret}_${encrypt(userPin || defaultUserPin, secret)}`
  //   );

  //   const originalPrivateKey = await recoverPrivateKey({
  //     nonce,
  //     serverSecret: decodedServerSecret,
  //     userSecret: decodedUserSecret,
  //   });

  //   return originalPrivateKey;
  // }

  // public async createWallets(
  //   data: CreateSlaveWalletData[],
  //   type: WALLET_TYPE
  // ): Promise<WithdrawWalletDTO[]> {
  //   const payload = await Promise.all(
  //     data.map(async (i) => {
  //       const { address, serverSecretPart, userSecretPart, nonce } =
  //         await this.createBlockchainWallet(i.pin);

  //       return {
  //         name: i.name,
  //         nonce,
  //         tags: i.tags,
  //         address,
  //         type,
  //         serverSecretPart,
  //         userSecretPart,
  //       };
  //     })
  //   );

  //   const createdWallets = await this.storageEngine.bulkCreate(payload);

  //   return createdWallets.map(this.walletToDTO);
  // }

  // protected async createBlockchainWallet(userPin?: string) {
  //   const { privateKey: secret, adminPin, defaultUserPin } = this.config;
  //   const { privateKey, publicKey } = await generateKeyPair();
  //   const nonce = crypto.randomBytes(24);
  //   const [userSecret, serverSecret] = splitPrivateKeyToParts(
  //     privateKey,
  //     nonce
  //   );

  //   const signedUserSecret = encrypt(
  //     userSecret,
  //     `${secret}_${encrypt(userPin || defaultUserPin, secret)}`
  //   );

  //   const signedServerSecret = encrypt(
  //     serverSecret,
  //     `${secret}_${encrypt(adminPin, secret)}`
  //   );

  //   return {
  //     address: publicKey,
  //     nonce: nonce.toString("hex"),
  //     serverSecretPart: signedServerSecret,
  //     userSecretPart: signedUserSecret,
  //   };
  // }

  // public async getMasterWallet(): Promise<WithdrawWalletDTO> {
  //   const masterWallet = await this.storageEngine.getOne({
  //     type: WALLET_TYPE.MASTER,
  //   });

  //   return this.walletToDTO(masterWallet);
  // }

  // public paginateSlaveWallets(
  //   filters: Record<any, any>,
  //   limit = 2000,
  //   offset = 0
  // ): Promise<WithdrawWallet[]> {
  //   return this.storageEngine.paginate(
  //     {
  //       ...filters,
  //       type: WALLET_TYPE.SLAVE,
  //     },
  //     limit,
  //     offset
  //   );
  // }
}
