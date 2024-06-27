import { createRandomSortCode, createRandomIbanCode, createRandomBicCode } from "../utils/createRandom";
import { ErrorMessages, SuccessMessages } from "../utils/messages";

export const resolverAccounts = {
    Mutation: {
      createAccount: async (_parent,{currency}, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return false;
          }
          const userId = context.payload.userId;
          return await session.writeTransaction(async (transaction) => {

            try {

               // Find the Account node with the provided currency
              const findAccountResult = await transaction.run(
                'MATCH (a:Account {owner:$userId , currency: $currency}) RETURN a',
                { userId, currency }
              );
      
              if (findAccountResult.records.length > 0) {
                throw new Error(`You already have a ${currency} account`);
              } 
              const id= crypto.randomUUID();
              // Create the Account
              await transaction.run(
                `MATCH (a:User {id: $userId})
                 CREATE (u:Account {owner: $owner, currency: $currency,
                  sortCode: $sortCode, iban: $iban, bic: $bic,
                  balance: $balance, id: $id
                 })
                 MERGE (a)-[:OWNS]->(u)
                 RETURN u`,{
                  userId, owner:userId, currency: currency,
                  sortCode: currency === "GBP" ? createRandomSortCode() : "00-00-00",
                  iban: createRandomIbanCode(), bic: createRandomBicCode(),
                  balance: 1000, id:id
                }
              );
            } catch (err) {
              console.log(err);
              return false;
            }
            // Return
            return true;
        });
        } finally {
          session.close();
        }
      },
      deleteAccount: async (_parent, {currency}, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return false;
          }
          const userId = context.payload.userId;
         
          return await session.writeTransaction(async (transaction) => {

            try{
                // Find the Account node with the provided id
                const findAccountResult = await transaction.run(
                  `MATCH (a:Account {owner: $userId,currency:$currency}) RETURN a`,
                  { userId,currency }
                );
                
                if (findAccountResult.records.length > 0) {
                  const account = findAccountResult.records[0].get('a').properties
                  if (account.balance == 0) {
                
                     await transaction.run(
                      `MATCH path = (a:Account {id: $accId})--() DETACH DELETE path`,
                      { accId:account.id }
                    );
                  
                  } else if (account.balance < 0) {
                    throw new Error(ErrorMessages.BALANCE_LESS_THAN);
                  } else if (account.balance > 0) {
                    throw new Error(ErrorMessages.BALANCE_GREATER_THAN);
                  }
                }
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
           
          });
        } finally {
          session.close();
        }
      },
      exchange: async (_parent, {selectedAccountCurrency,toAccountCurrency,amount}, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return null;
          }
          const userId = context.payload.userId;
         
          return await session.writeTransaction(async (transaction) => {

            try{
                // Find the Account node with the provided id
               
               const currentAccountResult = await transaction.run(
                `MATCH (a:Account {owner: $userId,currency:$selectedAccountCurrency}) RETURN a`,
                { userId,selectedAccountCurrency }
                );
                
                if (currentAccountResult.records.length > 0) {
                  const currentAccount = currentAccountResult.records[0].get('a').properties
                  if (currentAccount.balance >= amount) {
                
                      const toAccountResult = await transaction.run(
                        `MATCH (a:Account {owner: $userId,currency:$toAccountCurrency}) RETURN a`,
                        { userId,toAccountCurrency }
                      );
                      if (toAccountResult.records.length > 0) {
                        const toAccount = toAccountResult.records[0].get('a').properties
                        try {
                          let amountWithConversion: number = 0;
            
                          // Apply conversion rates for each currency
                          if (selectedAccountCurrency === "EUR" && toAccountCurrency === "USD") {
                            amountWithConversion = amount * 1.11;
                          } else if (selectedAccountCurrency === "EUR" && toAccountCurrency === "GBP") {
                            amountWithConversion = amount * 0.89;
                          } else if (selectedAccountCurrency === "USD" && toAccountCurrency === "EUR") {
                            amountWithConversion = amount * 0.9;
                          } else if (selectedAccountCurrency === "USD" && toAccountCurrency === "GBP") {
                            amountWithConversion = amount * 0.8;
                          } else if (selectedAccountCurrency === "GBP" && toAccountCurrency === "USD") {
                            amountWithConversion = amount * 1.25;
                          } else if (selectedAccountCurrency === "GBP" && toAccountCurrency === "EUR") {
                            amountWithConversion = amount * 1.13;
                          }
            
                          // Only update the account balances if the current accounts balance doesn't fall below 0 after applying conversion rates
                          if (currentAccount.balance - amount >= 0) {

                            const updatedAccountResult = await transaction.run(
                              `MATCH (a1:Account {id:$currentAccountId}) 
                              MATCH (a2:Account {id:$toAccountId})
                              SET a1.balance = a1.balance - $amount
                              SET a2.balance = a2.balance + $amountWithConversion
                              RETURN a1`,
                              { currentAccountId:currentAccount.id, toAccountId:toAccount.id,
                                amount: amount, amountWithConversion: Math.round(amountWithConversion) }
                            );
                            
                            return {
                              account: updatedAccountResult.records[0].get('a1').properties,
                              message: SuccessMessages.EXCHANGE,
                            };
                          } else {
                            throw new Error(ErrorMessages.EXCHANGE);
                          }
                        } catch (error) {
                          console.log(error);
                          throw new Error(ErrorMessages.EXCHANGE);
                        }
                      }
                  }else{
                    throw new Error(ErrorMessages.EXCHANGE);
                  }
                }
                return null;
            }catch(err){
                console.log(err);
                return false;
            }
           
          });
        } finally {
          session.close();
        }
      },
      addMoney: async (_parent, {amount,currency}, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return null;
          }
          const userId = context.payload.userId;
         
          return await session.writeTransaction(async (transaction) => {

            try{
                // Find the Account node with the provided id
                const findAccountResult = await transaction.run(
                  `MATCH (a:Account {owner: $userId,currency:$currency})
                    SET a.balance = a.balance + $amount
                   RETURN a`,
                  { userId,currency,amount }
                );
                
                if (findAccountResult.records.length > 0) {
                  const account = findAccountResult.records[0].get('a').properties
                  return {
                    account: account,
                    message: SuccessMessages.ADD_MONEY,
                  };
                }
                return null;
            }catch(err){
              throw new Error(ErrorMessages.ADD_MONEY);
            }
          });
        } finally {
          session.close();
        }
      },
    }
  }