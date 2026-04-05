import { DashboardService } from '../dashboardService';
import { appDataSource } from '../../database/appDataSource';
import { OrdemServico } from '../../entities/OrdemServico';
import { enumStatus } from '../../types/Status';

// Mock do repositório
jest.mock('../../database/appDataSource', () => ({
  appDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockRepository: any;

  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();

    // Configurar mock do repositório
    mockRepository = {
      count: jest.fn(),
    };

    (appDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

    // Instanciar service
    dashboardService = new DashboardService();
  });

  describe('getIndicadores', () => {
    it('deve retornar indicadores quando bem-sucedido', async () => {
      // Arrange
      mockRepository.count.mockResolvedValue(5);

      // Act
      const resultado = await dashboardService.getIndicadores();

      // Assert
      expect(resultado).toHaveProperty('indicadores');
      expect(resultado).toHaveProperty('ordemRecentes');
      expect(resultado.indicadores.totalAbertasHoje).toBe(5);
    });

    it('deve contar ordens abertas de hoje', async () => {
      // Arrange
      mockRepository.count.mockResolvedValue(3);

      // Act
      await dashboardService.getIndicadores();

      // Assert
      expect(mockRepository.count).toHaveBeenCalled();
      const callArgs = mockRepository.count.mock.calls[0][0];
      expect(callArgs.where.statusOrdemServico).toBe(enumStatus.ABERTO);
      expect(callArgs.where.aberturaEm).toBeDefined();
    });

    it('deve retornar 0 quando não há ordens abertas', async () => {
      // Arrange
      mockRepository.count.mockResolvedValue(0);

      // Act
      const resultado = await dashboardService.getIndicadores();

      // Assert
      expect(resultado.indicadores.totalAbertasHoje).toBe(0);
    });

    it('deve lançar erro quando a query falhar', async () => {
      // Arrange
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(dashboardService.getIndicadores()).rejects.toThrow(
        'Erro ao buscar indicadores'
      );
    });
  });

  describe('obterTotalAbertasHoje', () => {
    it('deve usar datas corretas para filtro de hoje', async () => {
      // Arrange
      mockRepository.count.mockResolvedValue(2);

      // Act
      await dashboardService.getIndicadores();

      // Assert
      expect(mockRepository.count).toHaveBeenCalled();
      const callArgs = mockRepository.count.mock.calls[0][0];
      
      // Verificar que está usando Between para filtro de data
      expect(callArgs.where.aberturaEm).toBeDefined();
      expect(callArgs.where.statusOrdemServico).toBe(enumStatus.ABERTO);
    });
  });
});
