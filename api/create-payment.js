import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN en Vercel');

    console.log('BODY RECIBIDO:', req.body);
    let { playerId, amount, product, id, uid, price, package: pkg } = req.body || {};

    // Aceptar cualquier nombre que mande tu frontend
    const finalPlayerId = playerId || id || uid || '123456';
    let finalAmount = amount || price || 0;
    const finalProduct = product || pkg || 'Diamantes';

    // Si viene como "110 - $18" sacamos el 18
    if (typeof finalAmount === 'string' && finalAmount.includes('$')) {
      const match = finalAmount.match(/\$([\d.]+)/);
      if (match) finalAmount = match[1];
    }
    // Si viene como "110 - $18" en product también
    if (typeof finalAmount === 'string' && finalAmount.includes('-')) {
       const parts = finalAmount.split('-');
       if(parts.length > 1) finalAmount = parts[1];
    }

    finalAmount = Number(String(finalAmount).replace(/[^0-9.]/g, ''));
    if (!finalAmount || finalAmount < 1) finalAmount = 18;

    console.log('FINAL:', { finalPlayerId, finalAmount, finalProduct });

    const client = new MercadoPagoConfig({ accessToken: token.trim() });
    const preference = new Preference(client);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

    const result = await preference.create({
      body: {
        items: [{
          title: `${finalProduct} - NovaTopUp`,
          quantity: 1,
          unit_price: finalAmount,
          currency_id: 'MXN',
        }],
        external_reference: String(finalPlayerId),
        back_urls: {
          success: `${baseUrl}`,
          failure: `${baseUrl}`,
          pending: `${baseUrl}`,
        },
        auto_return: 'approved',
      },
    });

    return res.status(200).json({ init_point: result.init_point, id: result.id });

  } catch (e) {
    console.error('MP ERROR REAL:', JSON.stringify(e, null, 2));
    return res.status(500).json({
      error: e.message,
      details: e.cause || e,
      bodyRecibido: req.body
    });
  }
}