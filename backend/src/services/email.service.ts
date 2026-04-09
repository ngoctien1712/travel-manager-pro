import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class EmailService {
  /**
   * Send notification to Admin and Provider about a new refund request
   */
  static async notifyRefundRequest({
    orderCode,
    customerName,
    amount,
    reason,
    adminEmail,
    providerEmail,
    providerName,
  }: {
    orderCode: string;
    customerName: string;
    amount: number;
    reason: string;
    adminEmail: string;
    providerEmail: string;
    providerName: string;
  }) {
    const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const adminMailOptions = {
      from: `"Trip Mana Pro" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `[Yêu cầu hoàn tiền] Đơn hàng ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #ff5722;">Yêu cầu hoàn tiền mới</h2>
          <p>Chào Admin,</p>
          <p>Hệ thống vừa nhận được yêu cầu hoàn tiền mới từ khách hàng.</p>
          <hr />
          <p><strong>Mã đơn hàng:</strong> ${orderCode}</p>
          <p><strong>Khách hàng:</strong> ${customerName}</p>
          <p><strong>Nhà cung cấp:</strong> ${providerName} (${providerEmail})</p>
          <p><strong>Số tiền yêu cầu:</strong> <span style="color: #d32f2f; font-weight: bold;">${formattedAmount}</span></p>
          <p><strong>Lý do:</strong> ${reason}</p>
          <hr />
          <p>Vui lòng đăng nhập vào trang quản trị để xem chi tiết và phê duyệt.</p>
          <a href="${process.env.FRONTEND_URL}/admin/refunds" style="display: inline-block; padding: 10px 20px; background-color: #ff5722; color: #fff; text-decoration: none; border-radius: 5px;">Đi tới trang quản trị</a>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">Đây là email tự động từ hệ thống Trip Mana Pro.</p>
        </div>
      `,
    };

    const providerMailOptions = {
      from: `"Trip Mana Pro" <${process.env.EMAIL_USER}>`,
      to: providerEmail,
      subject: `[Thông báo] Yêu cầu hoàn tiền đơn hàng ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2196f3;">Thông báo yêu cầu hoàn tiền</h2>
          <p>Chào đối tác ${providerName},</p>
          <p>Khách hàng đã gửi yêu cầu hoàn tiền cho đơn hàng dịch vụ của bạn.</p>
          <hr />
          <p><strong>Mã đơn hàng:</strong> ${orderCode}</p>
          <p><strong>Số tiền:</strong> ${formattedAmount}</p>
          <p><strong>Lý do hoàn tiền:</strong> ${reason}</p>
          <hr />
          <p style="color: #666; font-style: italic;">Lưu ý: Quản trị viên hệ thống sẽ là người trực tiếp phê duyệt và thực hiện giao dịch hoàn tiền này.</p>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">Trân trọng,<br/>Đội ngũ Trip Mana Pro</p>
        </div>
      `,
    };

    try {
      await Promise.all([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(providerMailOptions),
      ]);
      console.log(`[EmailService] Refund request notifications sent for ${orderCode}`);
    } catch (error) {
      console.error('[EmailService] Failed to send refund notification:', error);
    }
  }

  /**
   * Notify Customer about refund result
   */
  static async notifyRefundDecision({
    customerEmail,
    orderCode,
    isApproved,
    adminNote,
    amount
  }: {
    customerEmail: string;
    orderCode: string;
    isApproved: boolean;
    adminNote?: string;
    amount: number;
  }) {
    const statusText = isApproved ? 'Đã được chấp nhận' : 'Bị từ chối';
    const statusColor = isApproved ? '#4caf50' : '#f44336';
    const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const mailOptions = {
      from: `"Trip Mana Pro" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `[Trip Mana Pro] Kết quả yêu cầu hoàn tiền đơn hàng ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: ${statusColor};">Yêu cầu hoàn tiền ${statusText.toLowerCase()}</h2>
          <p>Chào bạn,</p>
          <p>Quản trị viên đã xử lý yêu cầu hoàn tiền cho đơn hàng <strong>${orderCode}</strong>.</p>
          <hr />
          <p><strong>Trạng thái:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
          <p><strong>Số tiền:</strong> ${formattedAmount}</p>
          ${adminNote ? `<p><strong>Ghi chú từ Admin:</strong> ${adminNote}</p>` : ''}
          <hr />
          <p>${isApproved ? 'Tiền sẽ được hoàn lại vào tài khoản của bạn trong vòng vài ngày làm việc.' : 'Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.'}</p>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">Trân trọng,<br/>Đội ngũ Trip Mana Pro</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('[EmailService] Failed to send decision email:', error);
    }
  }
}
