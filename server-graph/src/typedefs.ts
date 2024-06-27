export const typeDefs =`
  type Query {
    me: User @auth
  }
  type User @authentication @authorization(filter: [
    { where: { node: { id: "$jwt.userId" }  } }
]){
    id: ID! @id
    email: String! @unique
    firstName: String!
    lastName: String!
    dateOfBirth: String!
    streetAddress: String!
    postCode: String!
    city: String!
    country: String!
    accounts: [Account!]! @relationship(type: "OWNS", direction: OUT)
    cards: [Card!]! @relationship(type: "OWNS", direction: OUT)
	  tokenVersion: Int! @default(value: 0)
    password: String! @selectable(onRead: false, onAggregate: false)
  }
  type Account @authentication @authorization(filter: [
    { where: { node: { owner: { id: "$jwt.userId" } } } }
]) {
    id: ID! @id
    sortCode: String  @default(value: "00-00-00")
    iban: String
    bic: String
    currency: String!
    balance: Float! @default(value: 1000.0)
    owner: User! @relationship(type: "OWNS", direction: IN)
    transactions: [Transaction!]! @relationship(type: "HAS_TRANSACTION", direction: OUT)
  }
  type Transaction @authentication @authorization(filter: [
    { where: { node: { account: { owner: { id: "$jwt.userId" } } } } }
]) {
    id: ID! @id
    transactionType: String!
    date: DateTime! @timestamp
    amount: String!
    account: Account @relationship(type: "HAS_TRANSACTION", direction: IN)
    card: Card @relationship(type: "HAS_TRANSACTION", direction: IN)
  }
  type Card @authentication @authorization(filter: [
    { where: { node: { owner: { id: "$jwt.userId" } } } }
]) {
    id: ID! @id
    cardNumber: String!
    pin: Int!
    expiresIn: DateTime! @timestamp
    cvv: Int!
    monthlySpendingLimit: Float!
    owner: User! @relationship(type: "OWNS", direction: IN)
    transactions: [Transaction!]! @relationship(type: "HAS_TRANSACTION", direction: OUT)
  }
  type Mutation {
    logout: Boolean! @auth
    revokeRefreshTokensForUser(userId: ID!): Boolean! @auth
    login(password: String!, email: String!): LoginResponse!
    register(
      country: String!
      city: String!
      postCode: String!
      streetAddress: String!
      dateOfBirth: String!
      lastName: String!
      firstName: String!
      password: String!
      email: String!
    ): Boolean! 
    updatePassword(newPassword: String!, oldPassword: String!): Boolean! @auth
    destroyAccount: Boolean! @auth
    addMoney(currency: String!, amount: Float!): AccountResponse! @auth
    exchange(
      amount: Float!
      toAccountCurrency: String!
      selectedAccountCurrency: String!
    ): AccountResponse! @auth
    createAccount(currency: String!): Boolean! @auth
    deleteAccount(currency: String!): Boolean! @auth
    createTransaction(currency: String!): Float @auth
    createCard: Boolean! @auth
  }
  type LoginResponse @query(read: false, aggregate: false){
    accessToken: String!
    user: User!
  }
  type AccountResponse @query(read: false, aggregate: false){
    account: Account!
    message: String!
  }
  extend schema @mutation(operations: [])
`;