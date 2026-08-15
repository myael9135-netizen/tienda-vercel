export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
    if (!token) throw new Error('No hay MERCADOPAGO_ACCESS_TOKEN en Vercel');

    const body = req.body || {};
    console.log('BODY:', body);
    
    let playerId = body.playerId || body.id || body.uid || '000001';
    let amountRaw = body.amount || body.price || body.package || '18';
    if (typeof amountRaw === 'string') amountRaw = amountRaw.replace(/[^0-9.]/g, '').slice(-6);
    let amount = Number(amountRaw);
    if (!amount || amount < 5) amount = 18;

    const host = req.headers.host || '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${host}`;

    // Intentar con SDK nuevo v2
    try {
      const { MercadoPagoConfig, Preference } = await import('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: token });
      const pref = new Preference(client);
      const result = await pref.create({
        body: {
          items: [{ title: 'Diamantes NovaTopUp', quantity: 1, unit_price: amount, currency_id: 'MXN' }],
          external_reference: String(playerId),
          back_urls: { success: baseUrl, failure: baseUrl, pending: baseUrl },
        }
      });
      return res.status(200).json({ init_point: result.init_point || result.sandbox_init_point });
    } catch (e) {
      console.log('Fallo v2, probando v1:', e.message);
    }

    // Fallback SDK viejo v1
    const mercadopago = await import('mercadopago').then(m => m.default || m);
    if (mercadopago.configure) mercadopago.configure({ access_token: token });
    mercadopago.configurations = { access_token: token };
    
    const resultV1 = await mercadopago.preferences.create({
      items: [{ title: 'Diamantes NovaTopUp', quantity: 1, unit_price: amount, currency_id: 'MXN' }],
      external_reference: String(playerId),
      back_urls: { success: baseUrl, failure: baseUrl, pending: baseUrl },
    });
    
    const response = resultV1.body || resultV1;
    return res.status(200).json({ init_point: response.init_point || response.sandbox_init_point });

  } catch (error) {
    console.error('ERROR FINAL:', error);
    return res.status(500).json({ 
      error: error.message || 'Error MercadoPago',
      details: String(error),
      stack: error.stack
    });
  }
}