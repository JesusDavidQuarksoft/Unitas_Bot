

import express from "express";
import axios from "axios";
import 'dotenv/config'; 

const app = express();
app.use(express.json());


const { WEBHOOK_VERIFY_TOKEN, API_TOKEN, BUSINESS_PHONE, API_VERSION, PORT } = process.env; 

app.post("/webhook", async (req, res) => {
  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  if (message?.type === "text") {
    try {
      // Enviar mensaje de respuesta
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: "5214791014453", // Número autorizado (reemplaza con tu número de prueba)
          text: { body: "Echo: " + message.text.body },
          context: {
            message_id: message.id, 
          },
        },
      });

      // Marcar mensaje como leído
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
      });

      console.log("Mensaje enviado exitosamente");
    } catch (error) {
      console.error("Error al enviar mensaje:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("URL:", `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}/messages`);
      console.error("Token (primeros 20 caracteres):", API_TOKEN?.substring(0, 20));
    }
  }

  res.sendStatus(200);
});


app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
