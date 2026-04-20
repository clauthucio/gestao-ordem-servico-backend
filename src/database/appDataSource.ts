import { DataSource } from 'typeorm';
export const appDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER as string,
    password: process.env.DB_PASS as string,
    database: process.env.DB_NAME as string,

    // NUNCA usar "synchronize: true" em produção:
    //synchronize: false = É possível controlar mudanças manualmente com MIGRATIONS
    synchronize: true,
    logging: false,
    // Ajuste de entities para funcionar fora do src, antes estava apontando só para src/entities//*.ts.
    entities: [process.env.NODE_ENV === "production" ? "dist/entities//*.js" : "src/entities//*.ts"]
})