// Standard success envelope: { success: true, data }
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

module.exports = { sendSuccess };
