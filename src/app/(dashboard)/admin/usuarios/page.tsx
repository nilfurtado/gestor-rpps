'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Usuario {
  id: number;
  email: string;
  nome: string;
  role: string;
  createdAt: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    try {
      const response = await fetch('/api/admin/usuarios');
      const data = await response.json();

      if (response.ok) {
        setUsuarios(data);
      } else {
        setErro(data.erro || 'Erro ao carregar usuários');
      }
    } catch (err) {
      setErro('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
        <Link href="/admin/usuarios/novo">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            + Novo Usuário
          </Button>
        </Link>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Criado em
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {usuario.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {usuario.email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        usuario.role === 'GESTOR'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {usuario.role === 'GESTOR' ? '👨‍💼 Gestor' : '👤 Operador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>💡 Total de usuários:</strong> {usuarios.length}
        </p>
      </div>
    </div>
  );
}
