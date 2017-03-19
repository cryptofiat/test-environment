FROM node

WORKDIR contracts

COPY test-environment/build.js .
COPY test-environment/package.json .
COPY contract/CryptoFiat.sol .

RUN npm install

CMD npm start