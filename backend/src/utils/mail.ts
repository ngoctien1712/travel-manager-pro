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

export const sendVerificationEmail = async (email: string, otp: string) => {
    const mailOptions = {
        from: `"VietTravel" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Xác thực tài khoản VietTravel',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">Xác thực tài khoản</h2>
        <p>Chào bạn,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>VietTravel</b>. Để hoàn tất quá trình đăng ký, vui lòng nhập mã OTP dưới đây:</p>
        <div style="background-color: #f7f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db;">${otp}</span>
        </div>
        <p style="color: #7f8c8d; font-size: 14px;">Mã OTP này có hiệu lực trong vòng <b>5 phút</b>. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #95a5a6; font-size: 12px;">© 2024 VietTravel. All rights reserved.</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendRefundEmail = async (email: string, customerName: string, orderCode: string, amount: number) => {
    const mailOptions = {
        from: `"VietTravel" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Xác nhận hoàn tiền thành công - VietTravel',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #27ae60; text-align: center;">Hoàn tiền thành công</h2>
        <p>Chào <b>${customerName}</b>,</p>
        <p>Chúng tôi xin thông báo yêu cầu hoàn tiền cho đơn hàng <b>${orderCode}</b> đã được phê duyệt và thực hiện thành công.</p>
        <div style="background-color: #f7f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;">Mã đơn hàng: <b>${orderCode}</b></p>
            <p style="margin: 5px 0;">Số tiền hoàn lại: <b style="color: #e74c3c;">${amount.toLocaleString('vi-VN')} VND</b></p>
            <p style="margin: 5px 0;">Phương thức: <b>Chuyển khoản hệ thống</b></p>
        </div>
        <p>Tiền sẽ được hoàn trả về tài khoản thanh toán ban đầu của bạn trong vòng từ 1-3 ngày làm việc tùy thuộc vào ngân hàng.</p>
        <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline hoặc email này.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #95a5a6; font-size: 12px;">© 2024 VietTravel. All rights reserved.</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending refund email:', error);
        throw error;
    }
};
