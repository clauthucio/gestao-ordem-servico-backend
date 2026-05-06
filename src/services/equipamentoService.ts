import { appDataSource } from "../database/appDataSource";
import { AppError } from "../errors/AppError"
import { CreateEquipamentoDTO, UpdateEquipamentoDTO } from "../schemas/equipamentoSchema";
import { Equipamento } from "../entities/equipamentoEntity";
import { Repository } from "typeorm";

export class EquipamentoService{
    private equipamentoRepository: Repository<Equipamento>;

    constructor(){
        this.equipamentoRepository = appDataSource.getRepository(Equipamento);
    }
    //GET
    public async findById(id:string): Promise<Equipamento> {
        const equipamento = await this.equipamentoRepository.findOne({
            where:{id}})

        if (!equipamento){
            throw new AppError("Equipamento não encontrado",404);
        }

        return equipamento;

    }
    public async findAll(): Promise<Equipamento[]>{
        const equipamentos = await this.equipamentoRepository.find({
            order:{nome:"ASC"},
        });
        
        return equipamentos;
    }

    //CREATE
    public async CreateEquipamento (data: CreateEquipamentoDTO): Promise<Equipamento>{
        // Se o código não foi fornecido pelo frontend, gera automaticamente
        if (!data.codigo) {
            // Ordenar por código DESC garante pegar o maior número já salvo (Ex: EQ-010 > EQ-009)
            const ultimoEquipamento = await this.equipamentoRepository.findOne({
                where: {},
                order: { codigo: "DESC" }
            });

            let proximoNumero = 1;

            if (ultimoEquipamento && ultimoEquipamento.codigo) {
                const numeroUltimo = parseInt(ultimoEquipamento.codigo.replace(/\D/g, ""), 10);
                if (!isNaN(numeroUltimo)) {
                    proximoNumero = numeroUltimo + 1;
                }
            }

            data.codigo = `EQ-${String(proximoNumero).padStart(3, "0")}`;
        } else {
            // Se o código foi fornecido manualmente, valida duplicidade
            const equipamentoExistente = await this.equipamentoRepository.findOne({
                where: {codigo:data.codigo},
            });
            if(equipamentoExistente){
                throw new AppError(`Já existe um equipamento com o código: ${data.codigo}`,409);
            }
        }

        const novoEquipamento = this.equipamentoRepository.create(data);
        const equipamentoSalvo = await this.equipamentoRepository.save(novoEquipamento);

        return equipamentoSalvo;
    }
    
    //UPDATE
    public async updateEquipamento(id:string,data: UpdateEquipamentoDTO): Promise<Equipamento>{
        const equipamento = await this.findById(id);

        if(data.codigo && data.codigo !== equipamento.codigo) {
            const codigoExistente = await this.equipamentoRepository.findOne({
                where: {codigo: data.codigo},

            });

            if (codigoExistente) {
                throw new AppError(`Já existe um equipamento com o código: ${data.codigo}`,409);
            }
        }
        const equipamentoAtualizado = Object.assign(equipamento,data);
        const equipamentoSalvo = await this.equipamentoRepository.save(equipamentoAtualizado);

        return equipamentoSalvo;
    }

    //DELETE
    public async deleteEquipamento (id:string) : Promise<void>{
        const equipamento = await this.findById(id);
        await this.equipamentoRepository.remove(equipamento);
    }
}