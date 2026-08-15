const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    mercadopago.configure({ access_token: token });

    const { token: cardToken, payment_method_id, payer, amount, playerId, diamonds } = req.body;

    const payment = await mercadopago.payment.create({
      transaction_amount: Number(amount),
      token: cardToken,
      description: `${diamonds} Diamantes ID:${playerId}`,
      installments: 1,
      payment_method_id: payment_method_id,
      payer: { email: payer.email, identification: payer.identification },
      external_reference: playerId.toString(),
    });

    return res.status(200).json({ status: payment.body.status, detail: payment.body.status_detail, id: payment.body.id });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};