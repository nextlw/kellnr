import axios from 'axios';
import { SURI_CLIENTS } from '../config/suri-api';
import type { ClientDto, CreateClientDto, UpdateClientDto } from '../types/suri';

axios.defaults.withCredentials = true;

/**
 * Servico de CRUD de clientes para o Admin Panel
 * Consome diretamente as APIs do backend Suri
 */
export const SuriClientsService = {
  /**
   * Lista todos os clientes
   * @returns Array de ClientDto
   */
  async listClients(): Promise<ClientDto[]> {
    const response = await axios.get<ClientDto[]>(SURI_CLIENTS.LIST);
    return response.data;
  },

  /**
   * Obtem um cliente por ID
   * @param id ID do cliente
   * @returns ClientDto
   */
  async getClient(id: number): Promise<ClientDto> {
    const response = await axios.get<ClientDto>(SURI_CLIENTS.GET(id));
    return response.data;
  },

  /**
   * Cria um novo cliente
   * @param data Dados do cliente
   * @returns { id: number, message: string }
   */
  async createClient(data: CreateClientDto): Promise<{ id: number; message: string }> {
    const response = await axios.post<{ id: number; message: string }>(
      SURI_CLIENTS.CREATE,
      data
    );
    return response.data;
  },

  /**
   * Atualiza um cliente existente
   * @param id ID do cliente
   * @param data Dados para atualizar (parcial)
   * @returns { message: string }
   */
  async updateClient(id: number, data: UpdateClientDto): Promise<{ message: string }> {
    const response = await axios.put<{ message: string }>(
      SURI_CLIENTS.UPDATE(id),
      data
    );
    return response.data;
  },

  /**
   * Deleta um cliente
   * @param id ID do cliente
   * @returns { message: string }
   */
  async deleteClient(id: number): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(SURI_CLIENTS.DELETE(id));
    return response.data;
  },
};

export default SuriClientsService;

