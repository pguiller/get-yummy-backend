export const generatePasswordResetEmail = (userName: string, userEmail: string, resetLink: string) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de mot de passe - Get Yummy</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: #40863C;
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #555;
        }
        .message {
          font-size: 16px;
          margin-bottom: 30px;
          color: #666;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .reset-button {
          display: inline-block;
          background: #40863C;
          color: white !important;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(64, 134, 60, 0.4);
        }
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(64, 134, 60, 0.6);
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
        .warning strong {
          color: #d63031;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .footer a {
          color: #40863C;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐸 Get Yummy</h1>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour ${userName},
          </div>
          
          <div class="message">
            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Get Yummy. 
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
          </div>
          
          <div class="button-container">
            <a href="${resetLink}" class="reset-button">
              🔐 Réinitialiser mon mot de passe
            </a>
          </div>
          
          <div class="warning">
            ⚠️ Ce lien de réinitialisation expirera dans 1 heure pour des raisons de sécurité.
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 14px; color: #6c757d;">
            Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :<br>
            <a href="${resetLink}" style="color: #40863C; word-break: break-all;">${resetLink}</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé à ${userEmail}</p>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <p>© 2025 Get Yummy. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 