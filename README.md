# Cryptofiat test environment setup

## Running
- Install dependencies `npm install`
- Run testrpc `npm install -g ethereumjs-testrpc` and `npm run testrpc` or run geth in Docker `npm run docker`
- Start `npm start`

## Accounts

Both testrpc and geth in container contain following accounts.

### Roles
- 0xbe86853b5edccd6862e3b7b964cbaccbd7d1b140 **Master**
- 0x2226c12185773216ac10eb4f059110206503a9f4 **Reserve Bank**
- 0x9f18a8ab9d0d149356c1581a82ac732df83653f5 **AccountApprover**
- 0x7f9e9f7650388f1ccb8053f827471e5db33d7927 **Law Enforcer**
- 0x00eeb3082988faaba45e041cfc2982b69598264e **Account Designator**
- 0xfd8989348deca20c0839b1c17fe33ce6a0080394 **Account**

### Test accounts
- 0xb9447b40e761cadf48d088e76b1d45df6a6332cd **Alice** (Approved with 1000 CryptoEuro)
- 0xbddb7a84303a955cd74be8a24f5b67e827d6e70f **Bob** (Approved with 1000 CryptoEuro)
- 0x8bc72212834de16211f31855df83376199de5429 **Carol** (Approved with 1000 CryptoEuro)
- 0xf4661f0029d6901629df80e8d96260f9590d9404 **Erin** (Unapproved)