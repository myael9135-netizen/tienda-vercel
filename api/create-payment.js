const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN en Vercel');

    mercadopago.configure({ access_token: token });

    const { playerId, amount, diamonds } = req.body;

    const preference = {
      items: [{ title: `${diamonds} Diamantes ID:${playerId}`, quantity: 1, unit_price: Number(amount), currency_id: 'MXN' }],
      back_urls: { success: `https://${req.headers.host}/?status=success`, failure: `https://${req.headers.host}/?status=failure` },
      auto_return: 'approved',
      external_reference: playerId.toString(),
    };

    const response = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: response.body.init_point, id: response.body.id });

  } catch (e) {
    return res.status(500).json({ error: e.message, details: e.toString() });
  }
};