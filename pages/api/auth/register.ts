import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { hashPassword, generateToken } from '../../../lib/auth';
import { RegisterForm, ApiResponse, User } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, name }: RegisterForm = req.body;

    // Validación
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password y nombre son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const existingUsers = await query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este email ya está registrado'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const result = await query<any>(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email.toLowerCase(), hashedPassword, name]
    );

    const userId = result.insertId;

    // Crear suscripción gratuita
    const freePlan = await query<any[]>(
      'SELECT id FROM subscription_plans WHERE slug = "free" LIMIT 1'
    );

    if (freePlan.length > 0) {
      await query(
        `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
         VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [userId, freePlan[0].id]
      );
    }

    // Obtener datos del usuario creado
    const users = await query<User[]>(
      'SELECT id, email, name, created_at, avatar_url FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];

    // Generar token
    const token = generateToken(user.id, user.email);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        },
        token
      },
      message: 'Usuario registrado exitosamente'
    });

  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar usuario'
    });
  }
}
