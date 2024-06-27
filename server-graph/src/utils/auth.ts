import { sign, verify } from "jsonwebtoken";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'

export const createAccessToken = (user: any): string => {
	return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
};

export const createRefreshToken = (user:any): string => {
	return sign(
		{ userId: user.id, tokenVersion: user.tokenVersion },
		process.env.REFRESH_TOKEN_SECRET!,
		{ expiresIn: "7d" }
	);
};


export function authDirective(
	directiveName: string,
  ) {
	const typeDirectiveArgumentMaps: Record<string, any> = {}
	return {
	  authDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
	  authDirectiveTransformer: (schema: GraphQLSchema) =>
		mapSchema(schema, {
			[MapperKind.TYPE]: type => {
				const authDirective = getDirective(schema, type, directiveName)?.[0]
				if (authDirective) {
				  typeDirectiveArgumentMaps[type.name] = authDirective
				}
				return undefined
			  },
			  [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
				const authDirective =
				  getDirective(schema, fieldConfig, directiveName)?.[0] ??
				  typeDirectiveArgumentMaps[typeName]
				if (authDirective) {
					const { resolve = defaultFieldResolver } = fieldConfig
					fieldConfig.resolve = function (source, args, context, info) {

					const authorization: string | undefined = context.req.headers["authorization"];

					if (!authorization) {
						throw new Error("Not authenticated");
					}

					try {
						const token: string = authorization.split(" ")[1];
						const payload: string | object = verify(token, process.env.ACCESS_TOKEN_SECRET!);
						context.payload = payload as any;
					} catch (err) {
						console.log(err);
						throw new Error("Not authenticated");
					}

					  return resolve(source, args, context, info)
					}
					
				}
				return fieldConfig
			  }
			})
		}
	  }

