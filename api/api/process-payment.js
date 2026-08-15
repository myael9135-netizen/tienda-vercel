const mercadopago = require('mercadopago');
mercadopago.configure({ access_token: process.env.MERCADOPAGO_ACCESS_TOKEN });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { token, payment_method_id, payer, amount, playerId, diamonds } = req.body;
    const result = await mercadopago.payment.create({
      transaction_amount: Number(amount),
      token: token,
      description: `${diamonds} Diamantes ID:${playerId}`,
      installments: 1,
      payment_method_id: payment_method_id,
      payer: { email: payer.email }
    });
    return res.status(200).json({ status: result.body.status });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};