import mercadopago from "mercadopago";
mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { title, price, quantity } = req.body;
    const preference = {
      items: [{ title, unit_price: Number(price), quantity: Number(quantity) || 1 }],
      back_urls: {
        success: "https://myael9135-netizen.github.io/",
        failure: "https://myael9135-netizen.github.io/",
        pending: "https://myael9135-netizen.github.io/"
      },
      auto_return: "approved"
    };
    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ id: response.body.id, init_point: response.body.init_point });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
