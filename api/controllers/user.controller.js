const userService = require("../services/user.service");
const bcrypt = require("bcrypt");

// ================== GET ME ==================
exports.getMe = async (req, res) => {
  try {
    const { pns_id } = req.user;

    const profile = await userService.getUserProfileByPnsId(pns_id);

    res.json({
      ok: true,
      data: {
        pns_id: profile.pns_id,
        pns_name: profile.pns_name,
        role: profile.user_role,
        dep_id: profile.dep_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

// ================== ADMIN UPDATE USER ==================
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params; // target pns_id
    const { user_password, user_role, dep_id } = req.body;
    const changed_by = req.user.pns_id;

    const updateData = {};

    if (user_password) {
      updateData.user_password = user_password; // plain
    }

    if (user_role) {
      updateData.user_role = user_role;
    }

    if (dep_id) {
      updateData.dep_id = dep_id;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No data to update",
      });
    }

    await userService.updateUserByAdminWithLog({
      target_pns_id: user_id,
      updateData,
      changed_by,
    });

    res.json({
      ok: true,
      message: "User updated",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

// ================== CHANGE MY PASSWORD ==================
exports.changeMyPassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const { pns_id } = req.user;

    if (!old_password || !new_password) {
      return res.status(400).json({
        ok: false,
        message: "Missing password data",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        ok: false,
        message: "New password must be at least 6 characters",
      });
    }

    // 🔐 ใช้ auth function เท่านั้น
    const user = await userService.findUserForAuthByPnsId(pns_id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(
      old_password,
      user.user_password
    );

    if (!match) {
      return res.status(401).json({
        ok: false,
        message: "Old password is incorrect",
      });
    }

    // ✅ ฟังก์ชันที่มี INSERT user_log
    await userService.changeMyPasswordWithLog({
      target_pns_id: pns_id,
      new_password,
      changed_by: pns_id,
    });

    res.json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};
