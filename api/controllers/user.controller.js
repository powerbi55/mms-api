const userService = require('../services/user.service');

/*updateuser ==> อัพเดตข้อมูล user(ต้องมีสิทธิ ADMIN เท่านั้น )*/
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { user_password, user_role, dep_id } = req.body;

    const updateData = {};

    // update password
    if (user_password) {
     updateData.user_password = user_password;
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
        message: 'No data to update'
      });
    }

    await userService.update(user_id, updateData,req.user.pns_id );

    res.json({
      ok: true,
      message: 'User updated'
    });

  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message
    });
}
};

/*ส*/
exports.createUserByAdmin = async (req, res) => {
  try {
    const { pns_id, user_password, user_role } = req.body;

    if (!pns_id || !user_password || !user_role) {
      return res.status(400).json({
        ok: false,
        message: 'Missing required data'
      });
    }

    await userService.createByAdmin({
      pns_id,
      user_password,
      user_role,
      changed_by: req.user.pns_id
    });

    res.status(201).json({
      ok: true,
      message: 'User created by admin'
    });

  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message
    });
  }
};
