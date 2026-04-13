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
        const equipamentoExistente = await this.equipamentoRepository.findOne({
            where: {codigo:data.codigo},
        });

        //Em JS/TS tudo é avaliado como true ou false em condicionais:
        // FindOne retorna:
        // 1- um objeto (se achou um equipamento) → true
        // 2- null (se não achou nada) → false
        if(equipamentoExistente){
            throw new AppError("Já existe um equipamento com esse código",409);
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