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

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

const contractSource = fs.readFileSync('../contract/CryptoFiat.sol', 'utf8');

const output = solc.compile(contractSource);

if (output.errors) {
    output.errors.forEach(console.error);
    process.exit(1);
}

var installContract = function(name, params) {
    return new Promise(function(resolve, reject) {

        var contract = output.contracts[":" + name];

        var Contract = web3.eth.contract(JSON.parse(contract.interface));

        web3.eth.getAccounts(function (e, accounts) {
            var account = accounts[roles.Master];

            try {
                web3.personal.unlockAccount(account, 'Parool123');
            } catch (e) {
            }

            var contractCreated = function (e, c) {
                if (!e) {
                    if (c.address) {
                        contracts[name] = c;
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

var contractMined = function (name) {
    return function (c) {
        console.log(name + " mined! Address: " + c.address);
    };
};

var approveAccount = function(approver, account) {
    console.log('Approving account ' + account);
    contracts['Approving'].approveAccount(account, {from: approver, gas: 50000000}, function(err, result) {
        if(!err) {
            console.log(result);
        } else {
            console.error(err);
        }
    });
};

var upgrade = function(contract, accounts, id, address) {
    return new Promise(function(resolve, reject) {
        contract.upgrade(id, address, {from: accounts[roles.Master], gas: 50000000}, function(err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

installContract('CryptoFiat').then(function(c) {
    console.log("Cryptofiat mined! Address: " + c.address);
    web3.eth.getAccounts(function (e, accounts) {
        Promise.all([
            installContract('Data', [c.address]).then(function(data) {
                return upgrade(c, accounts, 1, data.address);
            }),
            installContract('Accounts', [c.address]).then(function(data) {
                return upgrade(c, accounts, 2, data.address);
            }),
            installContract('Approving', [c.address, accounts[roles.AccountApprover]]).then(function(data) {
                return upgrade(c, accounts, 3, data.address);
            }),
            installContract('Reserve', [c.address, accounts[roles.Reserve]]).then(function(data) {
                return upgrade(c, accounts, 4, data.address);
            }),
            installContract('Enforcement', [c.address, accounts[roles.LawEnforcer], accounts[roles.Designator], accounts[roles.Account]]).then(function(data) {
                return upgrade(c, accounts, 5, data.address);
            }),
            installContract('AccountRecovery', [c.address]).then(function(data) {
                return upgrade(c, accounts, 6, data.address);
            }),
            installContract('Delegation', [c.address]).then(function(data) {
                return upgrade(c, accounts, 7, data.address);
            })
        ]).then(function () {
            console.log("All contracts mined and registered! Approving accounts");
            approveAccount(accounts[roles.AccountApprover], accounts[roles.Alice]);
            //approveAccount(accounts[roles.AccountApprover], accounts[roles.Bob]);
            //approveAccount(accounts[roles.AccountApprover], accounts[roles.Carol]);
        });
    });
});