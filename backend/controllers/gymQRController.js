const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/database');

// Generate or get gym's static QR code
const getGymQR = async (req, res) => {
  try {
    // Check if gym QR already exists
    let result = await pool.query(
      "SELECT * FROM gym_qr_codes WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
    );

    let gymQR;
    
    if (result.rows.length === 0) {
      // Create new gym QR code
      const token = crypto.randomBytes(32).toString('hex');
      const qrPayload = JSON.stringify({ 
        type: 'GYM_CHECKIN',
        token: token,
        gym: 'ATOM FITNESS'
      });
      
      const qrImageData = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: { dark: '#ff3d00', light: '#FFFFFF' },
        width: 400
      });

      const insertResult = await pool.query(
        `INSERT INTO gym_qr_codes (token, qr_image_data, location) 
         VALUES ($1, $2, 'Main Entrance') RETURNING *`,
        [token, qrImageData]
      );
      
      gymQR = insertResult.rows[0];
    } else {
      gymQR = result.rows[0];
    }

    res.json({ success: true, gymQR });
  } catch (err) {
    console.error('Get gym QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Regenerate gym QR (invalidates old one)
const regenerateGymQR = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate all old QR codes
    await client.query("UPDATE gym_qr_codes SET is_active = false");

    // Create new QR
    const token = crypto.randomBytes(32).toString('hex');
    const qrPayload = JSON.stringify({ 
      type: 'GYM_CHECKIN',
      token: token,
      gym: 'ATOM FITNESS'
    });
    
    const qrImageData = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: { dark: '#ff3d00', light: '#FFFFFF' },
      width: 400
    });

    const result = await client.query(
      `INSERT INTO gym_qr_codes (token, qr_image_data, location) 
       VALUES ($1, $2, $3) RETURNING *`,
      [token, qrImageData, req.body.location || 'Main Entrance']
    );

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Gym QR code regenerated', 
      gymQR: result.rows[0] 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Regenerate gym QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = { getGymQR, regenerateGymQR };
