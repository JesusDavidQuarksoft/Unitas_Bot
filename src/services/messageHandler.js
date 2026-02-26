import whatsappService from './whatsappService.js';


class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    // Filtrado básico para responder solo a mensajes de texto
    if (message?.type === 'text') {
        const incomingMessage = message.text.body.toLowerCase().trim();
    
        if (this.isGreeting(incomingMessage)){
            await this.sendWelcomeMessage(message.from, message.id, senderInfo);
            await this.sendWelcomeMenu(message.from);
        } else {

            const response = `Echo: ${message.text.body}`;
      await whatsappService.sendMessage(message.from, response, message.id);
        }
         await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
        const option = message?.interactive?.button_reply?.title?.toLowerCase().trim();
        if (option) {
            await this.handleMenuOption(message.from, option);
            await whatsappService.markAsRead(message.id);
        }
    }
  }

  isGreeting(message) {
    const greetings = ['hola', 'hi', 'hello', 'buenos días', 'buenas tardes', 'buenas noches'];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo?.profile?.name || senderInfo.wa_id || 'Humano';
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `¡Hola ${name}! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una opción";
    const buttons = [
        {
            type: "reply", 
            reply: {
                id: 'option_1', 
                title: 'Gestion y tramites'
            }
        },
        {
            type: "reply", 
            reply: {
                id: 'option_2', 
                title: 'Cotizacion y ventas'
            }
        },
        {
            type: "reply", 
            reply: {
                id: 'option_3', 
                title: 'Consulta y recursos'
            }
        }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option) {
    let response;
    switch (option) {
        case 'gestion y tramites':
            response = 'Has seleccionado Gestión y Trámites.';
            break
        case 'cotizacion y ventas':
            response = 'Has seleccionado Cotización y Ventas.';
            break
        case 'consulta y recursos':
            response = 'Has seleccionado Consulta y Recursos.';
            break
        default:
            response = 'Lo siento, no reconozco esa opción. Por favor, elige una opción válida.';
            
    }
    await whatsappService.sendMessage(to, response);


  }
}

export default new MessageHandler();