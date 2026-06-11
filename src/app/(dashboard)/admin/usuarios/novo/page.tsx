'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState('OPERADOR');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, senha, papel }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Erro ao criar usuário');
        return;
      }

      setSucesso(`Usuário ${data.usuario.nome} criado com sucesso!`);
      setEmail('');
      setNome('');
      setSenha('');
      setPapel('OPERADOR');

      setTimeout(() => {
        router.push('/admin/usuarios');
      }, 2000);
    } catch (err) {
      setErro('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Novo Usuário
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                ✅ {sucesso}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <Input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João Silva"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@sanprev.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha (mín. 12 caracteres)
              </label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                required
                minLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use: maiúsculas, minúsculas, números e símbolos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Papel
              </label>
              <Select value={papel} onValueChange={setPapel} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERADOR">👤 Operador</SelectItem>
                  <SelectItem value="GESTOR">👨‍💼 Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => router.back()}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>📝 Papéis:</strong>
            <ul className="mt-2 space-y-1">
              <li>• <strong>Operador:</strong> Gera guias e relatórios</li>
              <li>• <strong>Gestor:</strong> Gerencia usuários e tudo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
