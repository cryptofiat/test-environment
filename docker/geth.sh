#!/bin/bash

/geth --datadir=/root/.ethereum/devchain init /root/files/genesis.json
/geth --datadir=/root/.ethereum/devchain --nodekeyhex=091bd6067cb4612df85d9c1ff85cc47f259ced4d4cd99816b14f35650f59c322 --ipcapi='admin,db,eth,debug,miner,net,shh,txpool,personal,web3' --rpcapi "db,personal,eth,net,web3" --rpccorsdomain='*' --networkid=1234 --rpc --rpcaddr="0.0.0.0" --mine --minerthreads 1