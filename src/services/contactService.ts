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

      // Lê o arquivo de texto usando fileManager ou usa texto inline
      let textoMensagem = await this.getProcessedMessage(config, lead.nome);
      
      if (!textoMensagem) {
        logCrmAction(lead.id, 'TEXT_ERROR', `Erro ao obter mensagem para ${config.tipo}`, false);
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

      // ⚠️ NÃO agenda mais próximo contato aqui - será feito pelo webhook
      // O Monday.com atualizará o status via automação e o webhook marcará a data
      
      logCrmAction(lead.id, 'CONTACT_DISPATCHED', `Contato ${config.tipo} enviado com sucesso`);
      return true;

    } catch (error) {
      logger.error(`Error processing contact dispatch for lead ${lead.id}:`, error);
      logCrmAction(lead.id, 'CONTACT_DISPATCH_ERROR', `Erro: ${error}`, false);
      return false;
    }
  }



  // 📝 OBTÉM MENSAGEM PROCESSADA (nova abordagem modular) COM FALLBACK
  private async getProcessedMessage(config: any, nomeCliente: string): Promise<string | null> {
    try {
      logger.info(`📝 Processando mensagem para ${config.tipo}:`, {
        temArquivoTexto: !!config.arquivoTexto,
        temMensagemTexto: !!config.mensagemTexto,
        arquivoTexto: config.arquivoTexto,
        nomeCliente
      });

      const { fileManager } = await import('./fileManager');
      
      // Primeiro tenta ler do arquivo
      if (config.arquivoTexto) {
        logger.info(`📂 Tentando ler arquivo: ${config.arquivoTexto}`);
        const fileContent = await fileManager.readTextFile(config.arquivoTexto);
        
        if (fileContent) {
          logger.info(`✅ Arquivo lido com sucesso, processando variáveis...`);
          const processedMessage = await fileManager.processMessage(fileContent, { nome: nomeCliente });
          logger.info(`📝 Mensagem final processada:`, { preview: processedMessage?.substring(0, 100) + '...' });
          return processedMessage;
        }
        logger.warn(`❌ Arquivo não encontrado: ${config.arquivoTexto}, usando texto inline`);
      }
      
      // Fallback para texto inline
      if (config.mensagemTexto) {
        logger.info(`📝 Usando texto inline como fallback`);
        const processedMessage = await fileManager.processMessage(config.mensagemTexto, { nome: nomeCliente });
        logger.info(`📝 Mensagem inline processada:`, { preview: processedMessage?.substring(0, 100) + '...' });
        return processedMessage;
      }
      
      // 🆘 FALLBACK FINAL: Templates hardcoded (para produção sem arquivos)
      logger.warn(`⚠️ Usando template hardcoded para ${config.tipo}`);
      return this.getHardcodedTemplate(config.tipo, nomeCliente);
      
    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem para ${config.tipo}:`, error);
      // Em caso de erro, usar template hardcoded
      logger.warn(`🆘 Usando template hardcoded de emergência para ${config.tipo}`);
      return this.getHardcodedTemplate(config.tipo, nomeCliente);
    }
  }

  // 🆘 TEMPLATES HARDCODED (para quando arquivos não estão disponíveis)
  private getHardcodedTemplate(tipoContato: string, nomeCliente: string): string {
    const templates: Record<string, string> = {
      'Primeiro Contato': `Boa tarde ${nomeCliente}! Tudo bem?

É realmente do seu interesse entender como estruturar uma operação de Drop Global para faturar 50 mil euros por mês?`,

      'Segundo Contato': `${nomeCliente}, tudo bem? - PRIMEIRA MENSAGEM

É realmente do seu interesse entender como estruturar uma operação de Drop Global para faturar 50 mil euros por mês? - SEGUNDA MENSAGEM`,

      'Terceiro Contato': `${nomeCliente}, devido a falta de resposta, entendemos que não é do seu interesse entender como você pode faturar 50 mil euros por mês.

Com isso iremos tirar você da nossa base de contatos. Caso seja do seu interesse trocar essa papo, pode me sinalizar aqui.`,

      'Ultimo Contato': `${nomeCliente}, devido a falta de retorno, estamos tirando você da nossa lista. De qualquer maneira, obrigado.`
    };

    const template = templates[tipoContato];
    if (template) {
      logger.info(`✅ Template hardcoded usado para ${tipoContato}`);
      return template;
    }

    // Último recurso
    logger.error(`❌ Nenhum template encontrado para ${tipoContato}`);
    return `Olá ${nomeCliente}, entraremos em contato em breve.`;
  }

  // 📄 MÉTODO LEGADO (mantido para compatibilidade)
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
