const stripe = require('stripe')('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');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypNx8xnd8M24ZbkZuxaEQ0oWwJP1x7cojhANBr4Vk40yaCEoueg2GijJfPERUFlViD/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const event = req.body;

    // CUANDO SE CONFIRMA EL PAGO
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const { customer_email, metadata } = session;
      const { name, phone, address, city, zipcode, state, quantity, envio } = metadata;

      console.log('✅ Pago confirmado para:', customer_email);

      // ACTUALIZAR GOOGLE SHEET A "PAGADO"
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_payment',
            email: customer_email,
            status: 'Pagado'
          })
        });
        console.log('✅ Google Sheet actualizado a Pagado para:', customer_email);
      } catch (sheetError) {
        console.log('❌ Error actualizando Google Sheet:', sheetError.message);
      }
    }

    // CUANDO SE CANCELA EL PAGO
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      console.log('⏱️ Pago expirado para:', session.customer_email);

      // ACTUALIZAR A "CANCELADO"
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_payment',
            email: session.customer_email,
            status: 'Cancelado'
          })
        });
      } catch (sheetError) {
        console.log('Error actualizando estado a cancelado:', sheetError.message);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}
