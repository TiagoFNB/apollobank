import { hash, compare } from "bcryptjs";
import { createAccessToken } from "../utils/auth";
import { ErrorMessages } from "../utils/messages";
import { sendRefreshToken } from "../utils/sendRefreshToken";
import { registerSchema, loginSchema, changePasswordSchema } from "../utils/validation";

export const resolversUser = {
    Query: {
      // Custom query resolver to find a Movie by its title
      me: async (_parent, _params, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return false;
          }
          const userId = context.payload.userId;
          return await session.writeTransaction(async (transaction) => {
           // Find the User node with the provided id
           const findUserResult = await transaction.run(
            'MATCH (a:User {id: $userId}) RETURN a',
            { userId }
          );
  
          if (findUserResult.records.length > 0) {
            return findUserResult.records[0].get('a').properties;
          } else {
            return null;
          }
          })
        } finally {
          session.close();
        }
      },
    },
  
    Mutation: {
      register: async (_parent, { country, city, postCode, streetAddress, dateOfBirth, lastName, firstName, password, email, }, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          // Server side validation for registering using Joi
          try {
            await registerSchema.validateAsync({email: email, password: password,dateOfBirth: dateOfBirth,});
          } catch (error) {
            console.log(error);
            return false;
          }
          return await session.writeTransaction(async (transaction) => {

          // Find the User node with the provided email
          const findUserResult = await transaction.run(
            'MATCH (a:User {email: $email}) RETURN a',
            { email }
          );

          if (findUserResult.records.length != 0) {
            return false;
          }

          const hashedPassword: string = await hash(password, 12);
          const id= crypto.randomUUID();
          // Create the User node
          const createUserResult = await transaction.run(
            `CREATE (u:User {country: $country, city: $city, postCode: $postCode, 
              streetAddress: $streetAddress, dateOfBirth: $dateOfBirth, lastName: $lastName, 
              firstName: $firstName, password: $hashedPassword, email: $email, id: $id
            }) RETURN u`,
            {
              country, city, postCode, streetAddress, dateOfBirth, lastName, firstName, hashedPassword, email,id:id
            }
          );
          // Return the newly created User node
          return true;
        });
        } finally {
          session.close();
        }
      },
      login: async (_parent, { 
        password,
        email, }, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
         // Server side validation for login using Joi
          try {
            await loginSchema.validateAsync({ email: email, password: password });
          } catch (error) {
            throw new Error("Something went wrong.");
          }

          const user = await session.writeTransaction(async (transaction) => {
         
          // Find the User node with the provided email
          const findUserResult = await transaction.run(
            'MATCH (a:User {email: $email}) RETURN a',
            { email }
          );

            if (findUserResult.records.length == 0) {
              throw new Error(ErrorMessages.LOGIN);
            }
            return findUserResult.records[0].get('a').properties;

          });

          const valid: boolean = await compare(password, user.password);
    
          if (!valid) {
            throw new Error(ErrorMessages.PASSWORD);
          }

          return { accessToken: createAccessToken(user), user:user,};
        } finally {
          session.close();
        }
      },
      logout: async (_parent, _params, context, _resolveInfo) => {
        sendRefreshToken(context.res, "");
		    return true;
      },
      revokeRefreshTokensForUser: async (_parent, {userId}, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          return await session.writeTransaction(async (transaction) => {
            // Find the User node with the provided id
            const findUserResult = await transaction.run(
              'MATCH (a:User {id: $userId}) SET a.tokenVersion = a.tokenVersion+1 RETURN a',
              { userId }
            );
    
            return true;
          });
        } finally {
          session.close();
        }
      },
      updatePassword: async (_parent, {oldPassword,newPassword}, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return false;
          }
          const userId = context.payload.userId;
          // Server side validation for changing password
          try {
            await changePasswordSchema.validateAsync({oldPassword: oldPassword, newPassword: newPassword,});
          } catch (error) {
            console.log(error);
            return false;
          }
          return await session.writeTransaction(async (transaction) => {
            
             // Find the User node with the provided id
             const findUserResult = await transaction.run(
              'MATCH (a:User {id: $userId}) RETURN a',
              { userId }
            );
            
            if (findUserResult.records.length == 0) {
              return true;
            }
            const user= findUserResult.records[0].get('a').properties;
        
            if (user) {
              const valid = await compare(oldPassword, user.password);
        
              if (valid) {
                const updatedPassword: string = await hash(newPassword, 12);
        
                try {
                  const updateUserResult = await transaction.run(
                    'MATCH (a:User {id: $userId}) SET a.password = $updatedPassword  RETURN a',
                    { userId,updatedPassword }
                  );
                } catch (err) {
                  console.log(err);
                  return false;
                }
              } else {
                throw new Error(ErrorMessages.UPDATE_PASSWORD);
              }
            }
            return true;
           
          });
        } finally {
          session.close();
        }
      },
      destroyAccount: async (_parent, _params, context, _resolveInfo) => {
        const session = context.executionContext.session();
        try {
          if (!context.payload) {
            return false;
          }
          const userId = context.payload.userId;
         
          return await session.writeTransaction(async (transaction) => {

            try{
             // Find the User node with the provided id
              const findUserResult = await transaction.run(
                `MATCH path = (a:User {id: $userId})--()--() DETACH DELETE path`,
                { userId }
              );
              if (findUserResult.records.length == 0) {
                return true;
              }
            }catch(err){
              throw new Error(ErrorMessages.DELETE_ACCOUNT);
            }
           
          });
        } finally {
          session.close();
        }
      },
    },

  };