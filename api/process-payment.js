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

    let paymentData = {
        transaction_amount: Number(amount),
        description: `${diamonds} Diamantes ID:${playerId}`,
        payment_method_id: payment_method_id,
        payer: { email: payer.email },
        external_reference: playerId.toString(),
    };

    // Solo si es tarjeta, agregamos el token
    if (payment_method_id !== 'oxxo') {
        paymentData.token = cardToken;
        paymentData.installments = 1;
    }

    const payment = await mercadopago.payment.create(paymentData);

    return res.status(200).json({
        status: payment.body.status,
        id: payment.body.id,
        ticket_url: payment.body.transaction_details ? payment.body.transaction_details.external_resource_url : null
    });

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};