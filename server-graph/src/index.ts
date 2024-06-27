import express, { Request, Response } from "express";
import { ApolloServer } from "@apollo/server";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authDirective, createAccessToken, createRefreshToken } from "./utils/auth";
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import "dotenv/config";
import "reflect-metadata";
import { Neo4jGraphQL  } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { typeDefs } from "./typedefs";
import { MyContext } from "./MyContext";
import http from 'http';
import { resolverAccounts } from "./resolvers/AccountResolver";
import { resolverCard } from "./resolvers/CardResolver";
import { resolverTransaction } from "./resolvers/TransactionResolver";
import { resolversUser } from "./resolvers/UserResolver";
import { verify } from "jsonwebtoken";
import { sendRefreshToken } from "./utils/sendRefreshToken";

(async () => {
	try{
	const app = express();
	const httpServer = http.createServer(app);
	
	const driver = neo4j.driver(process.env.NEO4J_DATABASE_URL!, neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!));

	const { authDirectiveTypeDefs, authDirectiveTransformer } = authDirective('auth');
	const neoSchema = new Neo4jGraphQL({ 
	typeDefs: [
        authDirectiveTypeDefs,
        typeDefs,
    ],
	resolvers:[resolversUser,resolverCard,resolverAccounts,resolverTransaction], 
	driver,
	features: {
		authorization: {
			key: process.env.ACCESS_TOKEN_SECRET!,
		},
    }, 
	//debug: true,
	});
	const schema = authDirectiveTransformer(await neoSchema.getSchema());
	const server = new ApolloServer<MyContext>({
		schema: schema,
		introspection: true,
		plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
	});
	
	await server.start();
	
	app.use(
		'/graphql',
		//cors<cors.CorsRequest>(),
		express.json(),
		expressMiddleware(server, {
		  context: async ({ req, res }) => {
			return {
				req:req,
			res: res, executionContext: driver,
			token: req.headers.authorization,
			}	
			},
		}),
	  );
	  
	app.use(cookieParser());
	app.use(
		cors({
			origin:
				process.env.NODE_ENV === "production"
					? "https://vigilant-goldwasser-9ac664.netlify.app"
					: "http://localhost:3000",
			credentials: true,
		})
	);

	app.get("/", (_req: Request, res: Response) => {
		res.send("🚀 Server is running");
	});

	app.post("/refresh_token", async (req: Request, res: Response) => {
		const token = req.cookies.jid;
		if (!token) {
			return res.send({ ok: false, accessToken: "" });
		}
		const session = driver.session();
		let payload: any = null;

		try {
			payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
		} catch (err) {
			console.log(err);
			return res.send({ ok: false, accessToken: "" });
		}
		const userId = payload.userId;
		
		const user = await session.executeRead(async (transaction) => {
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

		if (!user) {
			return res.send({ ok: false, accessToken: "" });
		}

		if (user.tokenVersion !== payload.tokenVersion) {
			return res.send({ ok: true, accessToken: createAccessToken(user) });
		}

		sendRefreshToken(res, createRefreshToken(user));

		return res.send({ ok: true, accessToken: createAccessToken(user) });
	});

		httpServer.listen(process.env.PORT || 4000, () => {
			console.log(`🚀 Server ready at ${process.env.PORT || 4000}/graphql`);
		});
	}catch(error){
	console.log(error);
	}
})();


