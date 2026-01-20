const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const userService = require('../services/user.service');

// role ที่อนุญาต (ต้องตรง ENUM)
const ALLOWED_ROLES = ['ADMIN', 'ChiefTechnician', 'Technician'];

/**
 * REGISTER
 * - client ส่ง pns_id, user_password, user_role
 * - server validate role
 */
exports.register = async (req, res) => {
  try {
    const { pns_id, user_password, user_role } = req.body;

    if (!pns_id || !user_password || !user_role) {
      return res.status(400).json({
        ok: false,
        message: 'Missing required data'
      });
    }

    // normalize + validate role
    const role = user_role.trim();

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid user role'
      });
    }

    await userService.register({
      pns_id,
      user_password,
      user_role: role
    });

    res.status(201).json({
      ok: true,
      message: 'Register success'
    });

  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message
    });
  }
};

/**
 * LOGIN
 * - ใช้ pns_id + password
 * - ใส่ role + dep_id ใน JWT
 */
exports.login = async (req, res) => {
  try {
    const { pns_id, password } = req.body;

    if (!pns_id || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Missing data'
      });
    }

    const user = await userService.findByPnsId(pns_id);
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid pns_id or password'
      });
    }

    const match = await bcrypt.compare(password, user.user_password);
    if (!match) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid pns_id or password'
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        pns_id: user.pns_id,
        role: user.user_role,
        dep_id: user.dep_id
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      ok: true,
      token,
      user: {
        user_id: user.user_id,
        pns_id: user.pns_id,
        role: user.user_role,
        dep_id: user.dep_id
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: 'Server error'
    });
  }
};
