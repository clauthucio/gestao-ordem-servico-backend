import 'dotenv/config';
import 'reflect-metadata';
import { appDataSource } from './database/appDataSource.js';
import { dashboardRoute } from './routes/dashboardRoute.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ordemServicoRoute } from './routes/ordemServicoRoute.js';
import { usuarioRoute } from './routes/usuarioRoute.js';
import { equipamentoRoute } from './routes/equipamentoRoute.js';
import { authRoute } from './routes/authRoute.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 3000;
app.use(express.json());
app.use(authRoute);
app.use(dashboardRoute);
app.use(usuarioRoute);
app.use(ordemServicoRoute);
app.use(equipamentoRoute);
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