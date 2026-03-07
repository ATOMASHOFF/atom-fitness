const { pool } = require('../config/database');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Get gym's QR code (admin only)
const getGymQR = async (req, res) => {
  try {
    const gym_id = req.user.gym_id;

    // Check if gym QR exists
    const result = await pool.query(
      'SELECT * FROM gym_qr_codes WHERE gym_id = $1 AND is_active = true LIMIT 1',
      [gym_id]
    );

    let qrCode;
    
    if (result.rows.length === 0) {
      // Generate new QR code
      const token = crypto.randomBytes(32).toString('hex');
      const qrData = JSON.stringify({
        type: 'GYM_CHECKIN',
        token: token,
        gym_id: gym_id,
        gym: req.gym?.name || 'GYM'
      });

      const qrImageData = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        color: { dark: '#ff3d00', light: '#ffffff' }
      });

      const insertResult = await pool.query(
        `INSERT INTO gym_qr_codes (token, qr_image_data, gym_id, location, is_active)
         VALUES ($1, $2, $3, 'Main Entrance', true)
         RETURNING *`,
        [token, qrImageData, gym_id]
      );

      qrCode = insertResult.rows[0];
    } else {
      qrCode = result.rows[0];
    }

    res.json({ success: true, qrCode });
    
  } catch (err) {
    console.error('Get gym QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Regenerate gym QR code (admin only)
const regenerateGymQR = async (req, res) => {
  try {
    const gym_id = req.user.gym_id;

    // Deactivate old QR codes for this gym
    await pool.query(
      'UPDATE gym_qr_codes SET is_active = false WHERE gym_id = $1',
      [gym_id]
    );

    // Generate new QR code
    const token = crypto.randomBytes(32).toString('hex');
    const qrData = JSON.stringify({
      type: 'GYM_CHECKIN',
      token: token,
      gym_id: gym_id,
      gym: req.gym?.name || 'GYM'
    });

    const qrImageData = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      color: { dark: '#ff3d00', light: '#ffffff' }
    });

    const result = await pool.query(
      `INSERT INTO gym_qr_codes (token, qr_image_data, gym_id, location, is_active)
       VALUES ($1, $2, $3, 'Main Entrance', true)
       RETURNING *`,
      [token, qrImageData, gym_id]
    );

    res.json({ 
      success: true, 
      message: 'QR code regenerated successfully',
      qrCode: result.rows[0] 
    });
    
  } catch (err) {
    console.error('Regenerate gym QR error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getGymQR, regenerateGymQR };