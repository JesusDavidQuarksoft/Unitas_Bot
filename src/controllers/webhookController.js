import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';

class WebhookController {
    // Logica para manejar mensajes entrantes y verificación del webhook
  async handleIncoming(req, res) {
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    // Constante para obtener los datos del usuario y regresar un saludo personalizado
    const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];

    if (message) {
      await messageHandler.handleIncomingMessage(message, senderInfo);
    }
    res.sendStatus(200);
  }

  // logica para verificar el webhook con Meta
  // Se verifica que el token enviado por Meta coincida con el token configurado en el servidor
  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('Webhook verified successfully!');
    } else {
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();