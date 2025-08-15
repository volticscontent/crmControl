import fs from 'fs';
import path from 'path';
import { Lead, ContatoTipo } from '../types';
import { evolutionService } from './evolutionService';
import { leadService } from './leadService';
import { mondayService } from './mondayService';
import { edgeCaseHandler } from './edgeCaseHandler';
import { logger, logCrmAction } from '../utils/logger';
import { CONTATOS_CONFIG, PATHS } from '../config/constants';

class ContactService {
  // Processa o disparo de contato para um lead
  async processContactDispatch(lead: Lead): Promise<boolean> {
    try {
      // Validação e correção de dados do Monday
      const validation = await edgeCaseHandler.validateAndFixMondayData(lead.id);
      if (!validation.valid && !validation.fixed) {
        logCrmAction(lead.id, 'VALIDATION_FAILED', `Dados inválidos: ${validation.issues.join(', ')}`, false);
        return false;
      }

      const config = CONTATOS_CONFIG[lead.statusAtual];
      
      // Verifica se o número é válido para WhatsApp
      if (!evolutionService.isValidWhatsAppNumber(lead.telefone)) {
        logCrmAction(lead.id, 'INVALID_PHONE', `Telefone inválido: ${lead.telefone}`, false);
        return false;
      }

      // Lê o arquivo de texto
      const textoMensagem = await this.readTextFile(config.arquivoTexto, lead.nome);
      if (!textoMensagem) {
        logCrmAction(lead.id, 'TEXT_FILE_ERROR', `Erro ao ler arquivo: ${config.arquivoTexto}`, false);
        return false;
      }

      // Tenta enviar mensagem de texto com retry automático
      let textSent = false;
      try {
        textSent = await evolutionService.sendTextMessage(lead.telefone, textoMensagem);
      } catch (error) {
        // Se falhou, usa o sistema de retry
        textSent = await edgeCaseHandler.handleEvoApiFailure(
          lead.telefone, 
          textoMensagem, 
          lead.id
        );
      }

      if (!textSent) {
        await leadService.incrementAttempts(lead.id);
        return false;
      }

      // Se tiver áudio, envia também
      if (config.arquivoAudio) {
        try {
          const audioSent = await evolutionService.sendAudioMessage(
            lead.telefone, 
            config.arquivoAudio,
            `Mensagem de áudio - ${config.tipo}`
          );
          
          if (!audioSent) {
            logger.warn(`Text sent but audio failed for lead ${lead.id}`);
            // Tenta retry do áudio
            await edgeCaseHandler.handleEvoApiFailure(
              lead.telefone, 
              `Áudio: ${config.tipo}`, 
              lead.id,
              config.arquivoAudio
            );
          }
        } catch (error) {
          // Se áudio falhar, tenta retry
          await edgeCaseHandler.handleEvoApiFailure(
            lead.telefone, 
            `Áudio: ${config.tipo}`, 
            lead.id,
            config.arquivoAudio
          );
        }
      }

      // Agenda próximo contato
      await leadService.scheduleNextContact(lead.id);

      logCrmAction(lead.id, 'CONTACT_DISPATCHED', `Contato ${config.tipo} enviado com sucesso`);
      return true;

    } catch (error) {
      logger.error(`Error processing contact dispatch for lead ${lead.id}:`, error);
      logCrmAction(lead.id, 'CONTACT_DISPATCH_ERROR', `Erro: ${error}`, false);
      return false;
    }
  }

  // Processa múltiplos leads pendentes (usado pelo scheduler)
  async processScheduledContacts(): Promise<void> {
    try {
      const leadsForDispatch = await leadService.getLeadsForDispatch();
      
      if (leadsForDispatch.length === 0) {
        logger.info('No leads scheduled for dispatch');
        return;
      }

      logger.info(`Processing ${leadsForDispatch.length} scheduled contacts`);

      // Processa leads com delay entre eles para evitar spam
      for (let i = 0; i < leadsForDispatch.length; i++) {
        const lead = leadsForDispatch[i];
        
        if (!lead) {
          logger.warn(`Lead ${i} is undefined, skipping`);
          continue;
        }
        
        logger.info(`Processing scheduled contact ${i + 1}/${leadsForDispatch.length} - Lead ${lead.id}`);
        
        await this.processContactDispatch(lead);
        
        // Delay de 5 segundos entre envios para evitar rate limit
        if (i < leadsForDispatch.length - 1) {
          await this.delay(5000);
        }
      }

      logger.info(`Completed processing ${leadsForDispatch.length} scheduled contacts`);

    } catch (error) {
      logger.error('Error processing scheduled contacts:', error);
    }
  }

  // Lê arquivo de texto e substitui placeholders
  private async readTextFile(fileName: string, nomeCliente: string): Promise<string | null> {
    try {
      const filePath = path.join(PATHS.ASSETS, fileName);
      
      if (!fs.existsSync(filePath)) {
        logger.error(`Text file not found: ${filePath}`);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Substitui placeholder do nome do cliente
      return content.replace(/\{nome\}/g, nomeCliente);
      
    } catch (error) {
      logger.error(`Error reading text file ${fileName}:`, error);
      return null;
    }
  }

  // Função auxiliar para delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cria arquivos de exemplo se não existirem
  async createExampleFiles(): Promise<void> {
    try {
      // Garante que o diretório assets existe
      if (!fs.existsSync(PATHS.ASSETS)) {
        fs.mkdirSync(PATHS.ASSETS, { recursive: true });
        logger.info(`Created assets directory: ${PATHS.ASSETS}`);
      }

      // Conteúdos de exemplo
      const examples = {
        'primeiro-contato.txt': `Oi {nome}! 👋

Tudo bem? Aqui é da equipe de vendas.

Recebemos seu interesse em nossos serviços e queremos te apresentar uma oportunidade incrível!

Você tem alguns minutos para uma conversa rápida sobre como podemos te ajudar a alcançar seus objetivos?

Aguardo seu retorno! 🚀`,

        'segundo-contato.txt': `Oi {nome}! 

Passando aqui novamente para saber se você viu nossa mensagem anterior.

Temos uma proposta muito interessante que pode fazer a diferença no seu negócio.

Quando você teria um tempinho para conversarmos? 

É só uns 15 minutinhos! 😊`,

        'terceiro-contato.txt': `{nome}, oi! 

Última tentativa por aqui... 

Sei que você está ocupado(a), mas realmente acredito que nossa solução pode te ajudar muito.

Se tiver interesse, me responde aqui que agendamos um horário que seja bom para você.

Caso contrário, sem problemas! 

Abraço! 🤝`,

        'ultimo-contato.txt': `{nome}, espero que esteja bem! 

Esta é minha última mensagem sobre nossa oportunidade.

Se mudou de ideia ou tiver interesse no futuro, estarei sempre disponível.

Desejo muito sucesso para você! 

Grande abraço! ✨`
      };

      // Cria arquivos de exemplo se não existirem
      for (const [fileName, content] of Object.entries(examples)) {
        const filePath = path.join(PATHS.ASSETS, fileName);
        
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, content, 'utf-8');
          logger.info(`Created example file: ${fileName}`);
        }
      }

      logger.info('Example contact files are ready');

    } catch (error) {
      logger.error('Error creating example files:', error);
    }
  }
}

export const contactService = new ContactService();

// Função exportada para uso nos controllers
export const processContactDispatch = contactService.processContactDispatch.bind(contactService);
