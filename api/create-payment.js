const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN en Vercel');

    const { playerId, amount, diamonds } = req.body;
    if (!playerId || !amount) throw new Error('Falta playerId o amount');

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [{ title: `${diamonds} Diamantes - ID:${playerId}`, quantity: 1, unit_price: Number(amount), currency_id: 'MXN' }],
        back_urls: { success: `https://${req.headers.host}/?status=success`, failure: `https://${req.headers.host}/?status=failure`, pending: `https://${req.headers.host}/?status=pending` },
        auto_return: 'approved',
        external_reference: playerId.toString(),
      }
    });

    return res.status(200).json({ init_point: result.init_point, id: result.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message, details: e.toString(), cause: e.cause || null });
  }
};