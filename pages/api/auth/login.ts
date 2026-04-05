import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { verifyPassword, generateToken } from '../../../lib/auth';
import { LoginForm, ApiResponse } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password }: LoginForm = req.body;

    // Validación
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const users = await query<any[]>(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generar token
    const token = generateToken(user.id, user.email);

    // Obtener empresas del usuario
    const companies = await query<any[]>(
      `SELECT c.id, c.slug, c.name, c.logo_url
       FROM companies c
       JOIN company_members cm ON cm.company_id = c.id
       WHERE cm.user_id = ? AND cm.status = 'active' AND c.is_active = TRUE
       ORDER BY c.created_at DESC`,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
        },
        token,
        companies
      },
      message: 'Login exitoso'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
}
