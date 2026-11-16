export default async function handler(req, res) {
  // Garante que a requisição é do tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    // Comunicação segura com a API do Mercado Pago usando a variável de ambiente secreta
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: items.map(item => ({
          title: item.name || item.title || 'Produto Samuka',
          unit_price: Number(item.price),
          quantity: Number(item.quantity || 1),
          currency_id: 'BRL'
        })),
        back_urls: {
          success: `${req.headers.origin || 'https://' + req.headers.host}?status=success`,
          failure: `${req.headers.origin || 'https://' + req.headers.host}?status=failure`,
          pending: `${req.headers.origin || 'https://' + req.headers.host}?status=pending`
        },
        auto_return: 'approved'
      })
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json(data);
    }

    // Retorna o link de pagamento (init_point) gerado pelo Mercado Pago
    return res.status(200).json({ init_point: data.init_point });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}