import 'reflect-metadata';
import express from 'express';
import 'dotenv/config';
import { appDataSource } from './database/appDataSource.js';
import { dashboardRoute } from './routes/dashboardRoute.js';
import { equipamentoRoute } from './routes/equipamentoRoute.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
app.use(express.json());
app.use(dashboardRoute);
app.use(equipamentoRoute);
// Rota de teste para confirmar que o servidor está funcionando
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mensagem: 'Servidor funcionando!' });
});
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