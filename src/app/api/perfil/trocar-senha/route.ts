import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { senhaAtual, senhaNova } = await request.json();

    // Validar entrada
    if (!senhaAtual || !senhaNova) {
      return NextResponse.json(
        { erro: 'Senha atual e nova são obrigatórias' },
        { status: 400 }
      );
    }

    // Validar força de senha (mínimo 12 caracteres)
    if (senhaNova.length < 12) {
      return NextResponse.json(
        { erro: 'Senha deve ter no mínimo 12 caracteres' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Validar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.passwordHash);
    if (!senhaValida) {
      return NextResponse.json(
        { erro: 'Senha atual inválida' },
        { status: 401 }
      );
    }

    // Não permitir reutilizar a mesma senha
    const mesmaSenha = await bcrypt.compare(senhaNova, usuario.passwordHash);
    if (mesmaSenha) {
      return NextResponse.json(
        { erro: 'Nova senha não pode ser igual à anterior' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const novoHash = await bcrypt.hash(senhaNova, 10);

    // Atualizar no banco
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { passwordHash: novoHash },
    });

    return NextResponse.json(
      { mensagem: 'Senha alterada com sucesso!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    return NextResponse.json(
      { erro: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
}
