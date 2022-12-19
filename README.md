# Abra Frontend

This repository contains the web client for the Abracadabra Lending Protocol.

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies:

Clone Repository

```sh
git clone https://github.com/waichung/abra-frontend.git
```

Install dependencies

```sh
cd abra-frontend
yarn
```

Set up environment variables

```sh
cp .env.example .env
```

Run test

```sh
yarn run test
```

Note: Test will only pass once for now due to the limitations of the current set up. In future, test will pass on every single run.

## In the event you need to rerun the tests

1. Create a new tenderly fork
2. Copy the RPC_URL
3. Replace the PROVIDER_URL in the .env with the copied RPC_URL
4. Fund the address 0xe086c546c3B4A1d4Fa646690AaaB90C6C43aB566 with 1000000000 SHIB tokens using https://tenderlytap.vercel.app/
5. Run test

## To Dos

- [ ] Typescript (3hrs)
- [ ] Set up frontend repository (1hr)
- [ ] Integrate state management layer with smart contract (3hrs)
- [ ] MVP (5hrs)
- [ ] Write integration tests for leveraged borrows (1-2days)
- [ ] Automate wallet funding with SHIB tokens (1-2days)
- [ ] Automate new fork creation (1-2days)
- [ ] E2E tests with Playwright (1-2days)
- [ ] Improve look n feel (1-2days)
- [ ] Automate CICD (1-2days)
