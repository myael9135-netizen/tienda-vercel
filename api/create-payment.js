import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Falta MERCADOPAGO_ACCESS_TOKEN' });
    }

    const { playerId, amount, product } = req.body;

    if (!playerId || !amount) {
      return res.status(400).json({ error: 'Faltan datos playerId o amount' });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

    const result = await preference.create({
      body: {
        items: [
          {
            title: product || `${amount} Diamantes - NovaTopUp`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'MXN',
          },
        ],
        external_reference: String(playerId),
        back_urls: {
          success: `${baseUrl}/success`,
          failure: `${baseUrl}/failure`,
          pending: `${baseUrl}/pending`,
        },
        auto_return: 'approved',
      },
    });

    return res.status(200).json({ init_point: result.init_point, id: result.id });
  } catch (e) {
    console.error('MP ERROR:', e);
    return res.status(500).json({ error: e.message || 'Error MP' });
  }
}