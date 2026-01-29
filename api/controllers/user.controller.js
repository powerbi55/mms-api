const userService = require("../services/user.service");
const bcrypt = require("bcrypt");

// ตรวจหาชื่อเมื่อ login เสร็จว่าใคร login
exports.getMe = async (req, res) => {
  try {
    const user = req.user; // มาจาก JWT middleware

    // สมมติ userService JOIN ตาราง pns
    const profile = await userService.getUserProfile(user.pns_id);

    res.json({
      ok: true,
      data: {
        pns_id: profile.pns_id,
        pns_name: profile.pns_name,
        role: profile.role,
        dep_id: profile.dep_id,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Server error" });
  }
};
//=========================================================================
//=========================================================================

/*updateuser ==> อัพเดตข้อมูล user(ต้องมีสิทธิ ADMIN เท่านั้น )*/
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { user_password, user_role, dep_id } = req.body;

    const updateData = {};

    // update password ปรับแก้ใหม่ ต้องมี hash ไม่งั้นเมื่ออัปเดต login จะพัง
    if (user_password) {
      const hashed = await bcrypt.hash(user_password, 10);
      updateData.user_password = hashed;
    }

    // update role
    if (user_role) {
      updateData.user_role = user_role;
    }

    // update department
    if (dep_id) {
      updateData.dep_id = dep_id;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No data to update",
      });
    }

    await userService.update(user_id, updateData, req.user.pns_id);

    res.json({
      ok: true,
      message: "User updated",
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};
//=========================================================================
//=========================================================================

//==================สร้างผู้ใช้ใหม่ โดยแอดมิน====================================
//=========================================================================
exports.createUserByAdmin = async (req, res) => {
  try {
    const { pns_id, user_password, user_role } = req.body;

    if (!pns_id || !user_password || !user_role) {
      return res.status(400).json({
        ok: false,
        message: "Missing required data",
      });
    }

    await userService.createByAdmin({
      pns_id,
      user_password,
      user_role,
      changed_by: req.user.pns_id,
    });

    res.status(201).json({
      ok: true,
      message: "User created by admin",
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=================เปลี่ยนรหัสผ่านด้วยตัวเอง=====================================
//========================================================================= 
exports.changeMyPassword = async (req, res) => {
  try {
    console.log('>>> CHANGE PASSWORD CONTROLLER HIT');
    const { old_password, new_password } = req.body;

    await userService.changeMyPassword({
      pns_id: req.user.pns_id,
      old_password,
      new_password,
      changed_by: req.user.pns_id
    });

    res.json({ ok: true, message: 'Password changed successfully' });

  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};
//=========================================================================
//=========================================================================