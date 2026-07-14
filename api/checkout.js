const stripe = require('stripe')('sk_test_51Tt4jyCi7Y03eRqbeTg1dhFVeJcEsfU4De2vNQDGbnzblcxFSvFZKLDlZXzPyxLoJCV2gmF5X13ovlCxPURkzLvQ00KSfS5sNU');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { name, email, phone, address, city, zipcode, state, quantity, total, envio } = req.body;

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
              unit_amount: total * 100, // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        success_url: `https://libro.elygonz.com/gracias?quantity=${quantity}&total=${total}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`,
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
