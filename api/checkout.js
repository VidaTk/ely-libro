const stripe = require('stripe')('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');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypNx8xnd8M24ZbkZuxaEQ0oWwJP1x7cojhANBr4Vk40yaCEoueg2GijJfPERUFlViD/exec';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { name, email, phone, address, city, zipcode, state, quantity, total, envio } = req.body;

      // GUARDAR EN GOOGLE SHEET COMO "PAGADO" DIRECTAMENTE
      try {
        const sheetResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            address,
            state,
            zipcode,
            city,
            quantity,
            envio,
            amount: total,
            status: 'Pagado'  // ✅ GUARDAMOS DIRECTAMENTE COMO PAGADO
          })
        });
        console.log('✅ Pedido guardado como PAGADO en Google Sheet para:', email);
      } catch (sheetError) {
        console.log('Google Sheet error (continuando):', sheetError.message);
      }

      // CREAR CHECKOUT SESSION EN STRIPE
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: `No Estás Rota, Estás en Duelo x${quantity}`,
                description: 'Libro de Ely González',
                images: ['https://libro.elygonz.com/portada.jpeg'],
              },
              unit_amount: total * 100,
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        success_url: `https://libro.elygonz.com/gracias?quantity=${quantity}&total=${total}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
        cancel_url: 'https://libro.elygonz.com/',
        metadata: {
          name,
          phone,
          address,
          city,
          zipcode,
          state,
          quantity,
          envio,
        },
      });

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
