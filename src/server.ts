import 'reflect-metadata';
import express from 'express';
import 'dotenv/config';
import { appDataSource } from './database/appDataSource.js';
import { dashboardRoute } from './routes/dashboardRoute.js';
import { usuarioRoute } from './routes/usuarioRoute.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
app.use(express.json());
app.use(dashboardRoute);
app.use(usuarioRoute);
app.use(errorHandler);


appDataSource.initialize()
    .then(() => {
        console.log('Banco de dados conectado!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erro ao conectar o banco:', error);
    });