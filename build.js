const execSync = require('child_process').execSync;
const yaml = require('js-yaml');
const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const web3 = new Web3();

const roles = {
    Master: 0,
    Reserve: 1,
    AccountApprover: 2,
    LawEnforcer: 3,
    Designator: 4,
    Account: 5,
    Alice: 6,
    Bob: 7,
    Carol: 8,
    Erin: 9
};

const contracts = {};

web3.setProvider(new web3.providers.HttpProvider('http://geth:8545'));

var compileContracts = function() {

    const contractSource = fs.readFileSync('CryptoFiat.sol', 'utf8');

    const output = solc.compile(contractSource);

    if (output.errors) {
        output.errors.forEach(console.error);
        process.exit(1);
    }
    console.log('Contracts compiled successfully!');
    return output;
};

const output = compileContracts();

var unlockAccount = function(account) {
    try {
        web3.personal.unlockAccount(account, 'Parool123');
    } catch (e) {
    }
};

var installContract = function(name, params) {
    return function() {
        console.log('Installing contract ' + name);
        return new Promise(function(resolve, reject) {

            var contract = output.contracts[":" + name];

            var Contract = web3.eth.contract(JSON.parse(contract.interface));

            web3.eth.getAccounts(function (e, accounts) {
                var account = accounts[roles.Master];
                unlockAccount(account);

                var contractCreated = function (e, c) {
                    if (!e) {
                        if (c.address) {
                            contracts[name] = c;
                            console.log(name + " mined! Address: " + c.address);
                            resolve(c);
                        }
                    } else {
                        reject(e);
                    }
                };

                var contractParams = { from: account, data: '0x' + contract.bytecode, gas: 50000000 };

                if (params) {
                    Contract.new(params, contractParams, contractCreated);
                } else {
                    Contract.new(contractParams, contractCreated);
                }
            });
        });
    };
};

var approveAccount = function(approver, account) {
    return function() {
        console.log('Approving account ' + account);
        return new Promise(function(resolve, reject) {
            unlockAccount(approver);
            contracts['Approving'].approveAccount(account, {from: approver, gas: 50000000}, function(err, result) {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
};

var upgrade = function(CryptoFiat, accounts, id) {
    return function(contract) {
        console.log('Upgrading contract at ' + id + ' to address ' + contract.address);
        return new Promise(function(resolve, reject) {
            CryptoFiat.upgrade(id, contract.address, {from: accounts[roles.Master], gas: 50000000}, function(err, result) {
                if(err) {
                    reject(err);
                } else {
                    console.log('Contract at ' + id + ' upgraded');
                    resolve(result);
                }
            });
        });
    };
};

var increaseSupply = function(accounts, amount) {
    return function() {
        console.log('Increasing CryptoFiat reserve supply by ' + amount);
        return new Promise(function(resolve, reject) {
            unlockAccount(accounts[roles.Reserve]);
            contracts['Reserve'].increaseSupply(amount, {from: accounts[roles.Reserve], gas: 50000000}, function(err, result) {
                if(err) {
                    reject(err);
                } else {
                    console.log('Reserve supply increased by ' + amount);
                    resolve(result);
                }
            });
        });
    };
};

var transfer = function(from, to, amount) {
    return function() {
        console.log('Transferring ' + amount + ' of CryptoFiat from ' + from + ' to ' + to);
        return new Promise(function(resolve, reject) {
            unlockAccount(from);
            contracts['Accounts'].transfer(to, amount, {from: from, gas: 50000000}, function(err, result) {
                if(err) {
                    reject(err);
                } else {
                    console.log(amount + ' of CryptoFiat from ' + from + ' to ' + to + ' transferred!');
                    resolve(result);
                }
            });
        });
    };
};

var generateConfigFile = function(contracts, accounts) {
    console.log('Generating config file');
    const CryptoFiat = contracts['CryptoFiat'];
    const config = {
        "sponsor": {
            "ethereum": {
                "address": accounts[roles.Reserve]
            }
        },
        "contract": {
            "ethereum": {
                "address": CryptoFiat.address,
                "block": web3.eth.getTransaction(CryptoFiat.transactionHash).blockNumber
            }
        },
        "ethereum": {
            "node": {
                "url": 'http://localhost:8545'
            }
        }
    };
    fs.writeFileSync('/config/application.yml', yaml.safeDump(config));
};

var installContracts = function() {
    installContract('CryptoFiat')().then(function(c) {
        web3.eth.getAccounts(function (e, accounts) {
                installContract('Data', [c.address])()
                .then(upgrade(c, accounts, 1))
                .then(installContract('Accounts', [c.address]))
                .then(upgrade(c, accounts, 2))
                .then(installContract('Approving', [c.address, accounts[roles.AccountApprover]]))
                .then(upgrade(c, accounts, 3))
                .then(installContract('Reserve', [c.address, accounts[roles.Reserve]]))
                .then(upgrade(c, accounts, 4))
                .then(installContract('Enforcement', [c.address, accounts[roles.LawEnforcer], accounts[roles.Designator], accounts[roles.Account]])).then(upgrade(c, accounts, 5))
                .then(installContract('AccountRecovery', [c.address]))
                .then(upgrade(c, accounts, 6))
                .then(installContract('Delegation', [c.address]))
                .then(upgrade(c, accounts, 7))
                .then(function () {
                    console.log("All contracts mined and registered! Approving accounts");
                    approveAccount(accounts[roles.AccountApprover], accounts[roles.Alice])()
                    .then(approveAccount(accounts[roles.AccountApprover], accounts[roles.Bob]))
                    .then(approveAccount(accounts[roles.AccountApprover], accounts[roles.Carol]))
                    .then(increaseSupply(accounts, 10000))
                    .then(transfer(accounts[roles.Reserve], accounts[roles.Alice], 1000))
                    .then(transfer(accounts[roles.Reserve], accounts[roles.Bob], 1000))
                    .then(transfer(accounts[roles.Reserve], accounts[roles.Carol], 1000)).then(function() {
                        console.log('Setup finished successfully! Generating config file');
                        generateConfigFile(contracts, accounts);
                    });
                });
        });
    });
};

installContracts();