import { CreateOrdemServicoDTO, UpdateOrdemServicoDTO } from './../schemas/ordemServicoSchema';
import { appDataSource } from "../database/appDataSource";
import { AppError } from "../errors/AppError"
import { Repository } from "typeorm";
import { OrdemServico } from "../entities/ordemServicoEntity";

export default class OrdemServicoService {
    private ordemServicoRepository: Repository <OrdemServico>;

    constructor(){
        this.ordemServicoRepository = appDataSource.getRepository(OrdemServico);
    }

    //GET
    public async  findAll(): Promise<OrdemServico[]> {
        return await this.ordemServicoRepository.find({ 
            order: { aberturaEm: "DESC"}
        });
    };

    public async findById (idOrdemServico: string): Promise<OrdemServico> {
        const ordemServico = await this.ordemServicoRepository.findOne({
            where: { idOrdemServico}
        });
        if (!ordemServico){
            throw new AppError ("Ordem de Serviço não encontrada", 404);
        }
        return ordemServico;
    }

    //CREATE
    public async createOrdemServico(data: CreateOrdemServicoDTO): Promise<OrdemServico> {
        const numeroOSExistente = await this.ordemServicoRepository.findOne({
            where: { numeroOrdemServico: data.numeroOrdemServico}
        });
        if (numeroOSExistente){
            throw new AppError(`Já existe uma Ordem de Serviço com o número: ${data.numeroOrdemServico}`, 409);
        }
        
        // NOVO
        const novaOrdemServico = new OrdemServico(data);
        
        /* ANTES
        const novaOrdemServico = this.ordemServicoRepository.create({
            numeroOrdemServico: data.numeroOrdemServico,
            idEquipamento: data.idEquipamento,
            idSolicitante: data.idSolicitante,
            idTecnico: data.idTecnico,
            tipoManutencao: data.tipoManutencao,
            prioridadeOrdemServico: data.prioridadeOrdemServico,
            statusOrdemServico: data.statusOrdemServico,
            descricaoFalha: data.descricaoFalha,
            descricaoServico: data.descricaoServico,
            pecasUtilizadas: data.pecasUtilizadas,
            horasTrabalhadas: data.horasTrabalhadas,
            inicioEm: data.inicioEm,
            conclusaoEm: data.conclusaoEm,
            aberturaEm: data.aberturaEm
        });
        */
        
        return await this.ordemServicoRepository.save(novaOrdemServico);
    }

    //UPDATE
    public async updateOrdemServico(idOrdemServico: string, data: UpdateOrdemServicoDTO): Promise<OrdemServico> {
        const ordemServico = await this.findById(idOrdemServico);

        if(data.numeroOrdemServico && data.numeroOrdemServico !== ordemServico.numeroOrdemServico){
            const numeroExistente = await this.ordemServicoRepository.findOne({
                where: { numeroOrdemServico: data.numeroOrdemServico }
            });

            if (numeroExistente){
                throw new AppError (`Já existe uma Ordem de Serviço com o número: ${data.numeroOrdemServico}`, 409);
            }
        }
        
        // [AGORA] Usando Constructor Pattern para mapear dados parciais
        Object.assign(ordemServico, new OrdemServico(data));
        
        /* [ANTES] Atribuindo diretamente sem constructor
        Object.assign(ordemServico, data);
        */
        
        return await this.ordemServicoRepository.save(ordemServico);
    }

    //DELETE
    public async deleteOrdemServico(idOrdemServico: string): Promise<void> {
        const ordemServico = await this.findById(idOrdemServico);
        await this.ordemServicoRepository.remove(ordemServico);
    };
}
