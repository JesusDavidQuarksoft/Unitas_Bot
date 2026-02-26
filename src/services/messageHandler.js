import whatsappService from './whatsappService.js';


class MessageHandler {

    constructor() {
        this.appointmentState = {};

    }


  async handleIncomingMessage(message, senderInfo) {
    // Filtrado básico para responder solo a mensajes de texto
    if (message?.type === 'text') {
        const incomingMessage = message.text.body.toLowerCase().trim();
    
        // Verificar primero si el usuario está en un flujo de conversación
        if (this.appointmentState[message.from]) {
            await this.handleAppointmentFlow(message.from, message.text.body);
        } else if (this.isGreeting(incomingMessage)){
            await this.sendWelcomeMessage(message.from, message.id, senderInfo);
            await this.sendWelcomeMenu(message.from);
        } else if (incomingMessage === 'media'){
            await this.sendMedia(message.from);
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
            this.appointmentState[to] = { step: 'cotizacion' }; // Iniciamos el estado para este usuario
            response = 'Perfecto, ¿en que compañia buscas cotizaciones?';
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

  async sendMedia(to){
    // IMPORTANTE: WhatsApp requiere una URL pública y directa al archivo
    // NO funcionan enlaces de Google Drive, Dropbox sin configurar, etc.
    // Usa servicios como Imgur, ImgBB, Cloudinary o tu propio servidor
    
    // Ejemplo con IMAGEN
    const mediaUrl = 'https://picsum.photos/800/600'; // URL de prueba (genera una imagen aleatoria)
    const caption = 'Bienvenido a Unitas'; 
    const type = 'image'; 
    
    // Ejemplo con AUDIO (descomenta para probar)
    // const mediaUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    // const caption = 'Aquí tienes un audio de ejemplo';
    // const type = 'audio';

    // Ejemplo con VIDEO (descomenta para probar)
    // const mediaUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
    // const caption = 'Aquí tienes un video de ejemplo';
    // const type = 'video';

    // Ejemplo con DOCUMENTO (descomenta para probar)
    // const mediaUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    // const caption = 'Aquí tienes un documento de ejemplo';
    // const type = 'document';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeAppointment(to){
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to]; // Limpiamos el estado del usuario

    const userData = [
        to, 
        appointment.compania, 
        appointment.servicio,
        appointment.confirmacion,
        new Date().toISOString()
    ];

    console.log('Datos del usuario:', userData);

    return `Gracias por tu solicitud, un agente se pondrá en contacto contigo pronto:
    
✅ Tu póliza se cotizará en la compañía: ${appointment.compania}
✅ El servicio que solicitaste es: ${appointment.servicio}
✅ Confirmación de datos: ${appointment.confirmacion}
📅 Fecha de solicitud: ${new Date().toLocaleString()}`;
  }

  async handleAppointmentFlow(to, message){
        // Flujo de conversación para gestión y trámites
        const state = this.appointmentState[to];
        let response;

        switch (state.step) {
            case 'cotizacion':
                state.compania = message;
                state.step = 'servicio';
                response = `Perfecto, has elegido ${message}. ¿Qué tipo de servicio necesitas? (Por ejemplo: seguro de auto, seguro de vida, etc.)`;
                break;

            case 'servicio':
                state.servicio = message;
                state.step = 'confirmacion';
                response = `Entendido. Confirma tus datos:\n\n📋 Compañía: ${state.compania}\n📦 Servicio: ${state.servicio}\n\n¿Es correcta esta información? (Responde "si" o "no")`;
                break;

            case 'confirmacion':
                if (message.toLowerCase() === 'si') {
                    state.confirmacion = 'Confirmado';
                    response = this.completeAppointment(to);
                } else if (message.toLowerCase() === 'no') {
                    delete this.appointmentState[to]; // Limpiar el estado
                    response = 'Entendido. Si deseas volver a empezar, envía "hola".';
                } else {
                    response = 'Por favor responde "si" para confirmar o "no" para cancelar.';
                }
                break;

            default:
                delete this.appointmentState[to];
                response = 'Ha ocurrido un error. Por favor, envía "hola" para comenzar de nuevo.';
        }
        
        await whatsappService.sendMessage(to, response);
  }

}

export default new MessageHandler();