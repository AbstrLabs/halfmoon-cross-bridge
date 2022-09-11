# Halfmoon Cross Bridge

Backend of the a multichain bridge.

## Run locally

### Install common library
```
cd common
npm i
npm link
cd ..
```

### Setup database
```
cd database
npm i
npm link
npm run migrate
npm run migrate:test
scripts/0-init-tokens.sh
NODE_ENV=test scripts/0-init-tokens.sh
cd ..
```

### Run API
```
cd api
npm i
npm link halfmoon-cross-bridge-common
npm link halfmoon-cross-bridge-database
npm run test
npm run start
```

API Server runs at http://localhost:4190

### Run Worker

**IMPORTANT!** Have a `.env` file in `worker/` (it's git-ignored, ask team member to get it).

```
npm i
npm link halfmoon-cross-bridge-common
npm link halfmoon-cross-bridge-database
npm run build
npm run start
```
