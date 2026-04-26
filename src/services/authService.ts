import { DataSource, Repository } from "typeorm"; // TypeORM: Acesso ao banco de dados
import { compare } from "bcryptjs"; // bcryptjs: Compara senhas com segurança
import { createHash } from "crypto"; // crypto: Cria hash do refresh token (será armazenado no banco)
import jwt, { JwtPayload } from "jsonwebtoken"; // jsonwebtoken: Criar e validar JWT tokens
import { Usuarios } from "../entities/usuarioEntity"; 
import { Sessao } from "../entities/sessaoEntity";
import { AppError } from "../errors/AppError"; // Sua classe de erro customizada

//O que será retornado ao fazer login
interface LoginResponse {
    accessToken: string;  // Token curto (1 hora)
    refreshToken: string; // Token longo (14 dias)
    usuario: {
        idUsuario: string;
        nomeUsuario: string;
        emailUsuario: string;
        perfilUsuario: string;
    };
}

//O que é retornado ao renovar o token
interface RefreshResponse {
      accessToken: string; // Novo token curto
      refreshToken: string; // Pode ser novo ou igual
        usuario: {
            idUsuario: string;
            nomeUsuario: string;
            emailUsuario: string;
            perfilUsuario: string;
        };
}

export class AuthService {
    //Acessam o banco de dados
    private usuarioRepository : Repository<Usuarios>;
    private sessaoRepository : Repository<Sessao>;

    //Método contrutor inicializa o serviço
    constructor(dataSource: DataSource){
        this.usuarioRepository = dataSource.getRepository(Usuarios);
        this.sessaoRepository = dataSource.getRepository(Sessao);
    }

    //Se alguém ver o banco, não consegue usar o token direto
    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    // Gera Access Token (curto)
    private generateAccessToken(usuario: Usuarios): string {
        return (jwt.sign)(
            // PAYLOAD: Dados dentro do token
            { sub: // "sub" = subject (padrão JWT)
                usuario.idUsuario,   
                perfil: usuario.perfilUsuario
            },
            // Chave secreta mantida no arquivo .env
            process.env.JWT_ACCESS_SECRET!, 
            { expiresIn: "1h"}
        );
    }

    // Gera Access Token (longo)
    private generateRefreshToken(usuarioId: string): string{
        return (jwt.sign)(
            // PAYLOAD: Apenas o ID do usuário
            {
                sub: usuarioId, },
            
            // CHAVE SECRETA diferente do access token
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn:"14d"}
        );
    }

    //Método para realizar LOGIN
    public async login(
        emailUsuario: string, 
        senhaUsuario: string,
        //Metadata são informações opcionais do dispositivo
        metadata?: {
        ip?: string;
        userAgent?: string;
        }
        ): Promise<LoginResponse> {
        //Buscar usuário no banco pelo e-mail
        const usuario = await this.usuarioRepository.findOne({
            where: { emailUsuario },
        });
        //Valida se usuário existe
        if(!usuario) {
            throw new AppError ("Credenciais Inválidas", 401); //Não informar login inválido para não facilitar vazar segurança
        }
        //Compara (texto,hash) com booleano
        const senhaCorreta = await compare(senhaUsuario, usuario.senhaHash);

        if(!senhaCorreta){
            throw new AppError ("Credenciais Inválidas", 401); //Não informar login inválido para não facilitar vazar segurança
        }

        //Gera tokens (access + refresh)
        const accessToken = this.generateAccessToken(usuario);
        const refreshToken = this.generateRefreshToken(usuario.idUsuario);

        //Cria sessão no banco
        const sessao = this.sessaoRepository.create({
            usuario,
            refreshTokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(Date.now()+ 14 * 24 * 60 * 60 *1000),    //Calculo padrão para transformar a data em milissegundos
            ip: metadata?.ip,                  // IP do usuário - dado opcional
            userAgent: metadata?.userAgent,    //Browser/app do usuário - dado opcional
        });

        //Salva sessão no banco
        await this.sessaoRepository.save(sessao);

        //Retorna tokens + dados do usuário
        return {
            accessToken,
            refreshToken,
             usuario: {
                idUsuario: usuario.idUsuario,
                nomeUsuario: usuario.nomeUsuario,
                emailUsuario: usuario.emailUsuario,
                perfilUsuario: usuario.perfilUsuario,
             },
        };
    }

    //Método para renovar o access token
    public async refresh(refreshToken: string): Promise<RefreshResponse> {

        // Passo 1 - Decodificar e validar o refresh token
        let payload: JwtPayload;
        try {
            payload = jwt.verify(
                refreshToken,   // jwt.verify() valida a assinatura e expiração
                process.env.JWT_REFRESH_SECRET!
                ) as JwtPayload;
        } catch {
            throw new AppError("Refresh token inválido ou expirado", 401);
        }

        //Passo 2 - Extrai ID do usuário do token
        const usuarioId = payload.sub as string;
        if (!usuarioId){
            throw new AppError("Refresh token inválido", 401);
        }
        
        //Passo 3 - Busca a sessão associada ao token - verifica se existe e se está ativa no banco
        const sessao = await this.sessaoRepository.findOne({
            where: {
                usuario: { idUsuario: usuarioId }
            },
            relations: { usuario: true }, //Carrega dados do usuário
            order: { createdAt: "DESC" }
        });
        //Passo 4 - Tratar os erros
        if (!sessao) {
            throw new AppError("Sessão não encontrada", 401);
        }

        if (sessao.expiresAt < new Date()) {
        throw new AppError("Sessão expirada", 401);
        }

        if (sessao.revokedAt) {
        throw new AppError("Sessão revogada", 401);
        }

        if (sessao.refreshTokenHash !== this.hashToken(refreshToken)) {
        throw new AppError("Refresh token inválido", 401);
        }

        //Passo 5 - Gerar novo ACESS TOKEN  
        const novoAccessToken = this.generateAccessToken(sessao.usuario);

        //Passo 6 - Renovar o Refresh Token (Opcional)
        const novoRefreshToken = this.generateRefreshToken(usuarioId);

        //Passo 7 - Atualizar sessão com novo REFRESH TOKEN
        sessao.refreshTokenHash = this.hashToken(novoRefreshToken);
        sessao.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await this.sessaoRepository.save(sessao);

        //Passo 8 - Retornar novos tokens
        return {
            accessToken: novoAccessToken,
            refreshToken: novoRefreshToken,
            usuario: {
                idUsuario: sessao.usuario.idUsuario,
                nomeUsuario: sessao.usuario.nomeUsuario,
                emailUsuario: sessao.usuario.emailUsuario,
                perfilUsuario: sessao.usuario.perfilUsuario,
            },
        };
    }

    // Método LOGOUT
    public async logout (refreshToken: string): Promise<void> {
        let payload: JwtPayload;
        try{
            payload = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET!
            ) as JwtPayload;
        } catch {
            throw new AppError("Refresh Token Inválido", 401);
        }

        const usuarioId = payload.sub as string;
        if(!usuarioId) {
            throw new AppError("Refresh Token Inválido", 401);
        }
        const sessao = await this.sessaoRepository.findOne({
            where: { usuario: { idUsuario: usuarioId } },
            relations: { usuario: true },
            order: { createdAt: "DESC" }
        });

        if (!sessao) {
            throw new AppError("Sessão não encontrada", 401);
        }
        sessao.revokedAt = new Date();  // Data/hora do logout
        await this.sessaoRepository.save(sessao);
    };
}
