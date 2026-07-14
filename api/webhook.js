const stripe = require('stripe')('sk_test_51Tt4jyCi7Y03eRqbeTg1dhFVeJcEsfU4De2vNQDGbnzblcxFSvFZKLDlZXzPyxLoJCV2gmF5X13ovlCxPURkzLvQ00KSfS5sNU');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypNx8xnd8M24ZbkZuxaEQ0oWwJP1x7cojhANBr4Vk40yaCEoueg2GijJfPERUFlViD/exec';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { name, email, phone, address, city, zipcode, state, quantity, total, envio } = req.body;

      // GUARDAR EN GOOGLE SHEET COMO "PENDIENTE - ESPERANDO PAGO"
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
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
            amount: total
            // NO incluimos 'status' aquí, el script lo pone como "Pendiente - Esperando pago"
          })
        });
        console.log('Pedido registrado en Google Sheet para:', email);
      } catch (sheetError) {
        console.log('Google Sheet error:', sheetError.message);
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
