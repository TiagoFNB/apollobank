import { createRandomCardNumber, createRandomNumber } from "../utils/createRandom";

export const resolverCard = {
    Mutation: {
      createCard: async (_parent,_params, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return false;
          }
          const userId = context.payload.userId;
          return await session.writeTransaction(async (transaction) => {

            const id= crypto.randomUUID();
            
            try {
              // Create the Card
              const createCardResult = await transaction.run(
                `MATCH (a:User {id: $userId})
                 CREATE (u:Card {owner: $owner, cardNumber: $cardNumber,
                  expiresIn: date("2026-06-02"), pin: $pin, cvv: $cvv,
                  monthlySpendingLimit: $monthlySpendingLimit, id: $id
                 })
                 MERGE (a)-[:OWNS]->(u)
                 RETURN u`,{
                  userId, owner:userId,
                  cardNumber: createRandomCardNumber(),
                  pin: parseInt(createRandomNumber(4)),
                  cvv: parseInt(createRandomNumber(3)),
                  monthlySpendingLimit: 500,
                  id:id
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
    }
  }
