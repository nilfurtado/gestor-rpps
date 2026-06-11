import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// GET: Listar usuários (apenas GESTOR)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é GESTOR
    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (usuario?.role !== 'GESTOR') {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas GESTOR' },
        { status: 403 }
      );
    }

    // Listar todos os usuários
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { erro: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

// POST: Criar novo usuário (apenas GESTOR)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é GESTOR
    const gestor = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (gestor?.role !== 'GESTOR') {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas GESTOR pode criar usuários' },
        { status: 403 }
      );
    }

    const { email, nome, senha, papel } = await request.json();

    // Validar entrada
    if (!email || !nome || !senha) {
      return NextResponse.json(
        { erro: 'Email, nome e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar email
    const emailJaExiste = await prisma.user.findUnique({
      where: { email },
    });

    if (emailJaExiste) {
      return NextResponse.json(
        { erro: 'Este email já está registrado' },
        { status: 400 }
      );
    }

    // Validar força de senha (mínimo 12 caracteres)
    if (senha.length < 12) {
      return NextResponse.json(
        { erro: 'Senha deve ter no mínimo 12 caracteres' },
        { status: 400 }
      );
    }

    // Validar papel
    const papelValido = ['OPERADOR', 'GESTOR'].includes(papel);
    if (!papelValido) {
      return NextResponse.json(
        { erro: 'Papel deve ser OPERADOR ou GESTOR' },
        { status: 400 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const novoUsuario = await prisma.user.create({
      data: {
        email,
        nome,
        passwordHash: senhaHash,
        role: papel === 'GESTOR' ? 'GESTOR' : 'OPERADOR',
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        mensagem: 'Usuário criado com sucesso!',
        usuario: novoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { erro: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
