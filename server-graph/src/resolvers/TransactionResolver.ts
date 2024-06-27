import faker from "faker";
import neo4j from "neo4j-driver";
export const resolverTransaction = {
    Mutation: {
      createTransaction: async (_parent,{currency}, context, _resolveInfo) => {
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
                const account = findAccountResult.records[0].get('a').properties
                const id= crypto.randomUUID();
                // Generate fake financial data using faker
                const transactionType: string = faker.finance.transactionType();
                let amount: number = parseInt(faker.finance.amount(1,5));
                let balance: number = account.balance;
                const date = neo4j.types.DateTime.fromStandardDate(faker.date.recent(31));
                if (balance <= 0) {
                  throw new Error("You do not have the sufficient funds.");
                }

                // Update account balance depending on the transaction type faker generates
                switch (transactionType) {
                  case "withdrawal":
                    balance -= amount;
                    break;
                  case "deposit":
                    balance += amount;
                    break;
                  case "payment":
                    balance -= amount;
                    break;
                  case "invoice":
                    balance -= amount;
                    break;
                }

                try {
                  const createTransactionResult = await transaction.run(
                    `MATCH (a:Account {id:$accId})
                    CREATE (t:Transaction { transactionType: $transactionType, date: $date,
                      amount:$amount, account:$accId, id: $id
                     })
                    MERGE (a)-[:HAS_TRANSACTION]->(t)
                    SET a.balance = $balance 
                    RETURN a`,
                    { accId:account.id, id, transactionType, date, amount, balance }
                  );
                  return createTransactionResult.records[0].get('a').properties.balance
                } catch (err) {
                  console.log(err);
                  return null;
                }
              } 

             
            } catch (err) {
              console.log(err);
              return null;
            }
            // Return
            return null;
        });
        } finally {
          session.close();
        }
      },
  }
}