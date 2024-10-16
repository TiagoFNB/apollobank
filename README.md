(this repository was created in an academic context for my dissertation project, which can be read [here](document/DM_TiagoBarbosa_2024_MEI.pdf).)
# apollobank 🚀

A fullstack GraphQL banking application built using React, Node & TypeScript.

🔥Any contribution activity including finding/report/fixing issues, and pull requests are Welcome!👋 <br/>
Now it is fully open source. Check the contribution guide [here](CONTRIBUTING.md).

## Running

### Prerequirement
- Node.js
- PostgreSQL 13
  - create database name "apollobank"
- Neo4j Desktop (if using server-graph)
  - create database name "apollobank"
- Git clone
```bash
git clone https://github.com/TiagoFNB/apollobank.git
cd apollobank
```

### Run backend
```bash
cd server
npm install
npm start
```
- check ormconfig.json file to check or update database connection info.
- create .env file with necessary values
- 
### Run frontend
```bash
cd client
npm install
npm start
```
- It will server at http://localhost:3000/
![dashboard](images/first.png)

### Using
- Register fist.
![dashboard](images/register.png)
- And then login.
![dashboard](images/blank.png)
- Add account and transaction! Play it!
![dashboard](images/dashboard.png)

## Functions

- Login/register
- Dashboard
- Accounts
- Transactions
- Credit cards
- Settings
- Spending for this month chart
- Dummy data generator using faker

## Tech Stack

### Server side

- Apollo Server
- bcryptjs
- cors
- Express
- GraphQL
- faker
- jsonwebtoken
- TypeGraphQL
- TypeORM
- TypeScript
- PostgreSQL
  
### Server side (Graph)

- Apollo Server
- bcryptjs
- cors
- Express
- GraphQL
- faker
- jsonwebtoken
- Neo4jGraphQL
- TypeScript
- Neo4j

### Client side

- Apollo React Hooks
- FontAwesome Icons
- Material UI
- Recharts
- Formik
- Yup

## Todo

- [ ] Don't allow the user to destroy an account if they are in debt or their account balance > 0
- [ ] When deleting and destroying an account, alert the user with another dialog to check if they would like to proceed with this action.
- [ ] Update the chart on the dashboard to show spending such that the y axis is the users account balance.
- [ ] Sort transactions by date & sort chart data by date.
- [ ] Fetch exchange rates from an API.


# Documentation

## Domain diagram

![domain](diagrams/Domain.svg)

## High level sequence diagram of how Neo4jGraphQL operates

![neo4jgraphql](diagrams/SD_Neo4jGraphQL.svg)

## High level sequence diagram of account creation on initial backend with relational database (server)

![domain](diagrams/SD_RELATIONAL.svg)

## High level sequence diagram of account creation on new backend with graph database (server-graph)

![domain](diagrams/SD_GRAPH.svg)
