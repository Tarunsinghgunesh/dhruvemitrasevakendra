/**
 * Razorpay Serverless Function: Verify Payment Signature
 * Computes HMAC-SHA256 signature using RAZORPAY_KEY_SECRET.
 */

const crypto = require('crypto');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay secret key not configured' });
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (isValid) {
      return res.status(200).json({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      return res.status(400).json({
        verified: false,
        error: 'Invalid signature verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: error.message });
  }
};
