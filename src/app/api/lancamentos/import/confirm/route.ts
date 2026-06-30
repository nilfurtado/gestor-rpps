import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageLancamentos, forbidden } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import {
  calcularValorARecolher,
  calcularDiferenca,
  calcularFolhaTotal,
  calcularTotalARecolher,
  calcularTotalRecolhido,
  calcularDeficitTotal,
} from "@/lib/tipo-folha-service";
import { calcularLancamento } from "@/lib/calc/lancamento";
import type { PreviewRow } from "@/app/api/lancamentos/import/preview/route";

/**
 * Confirm API endpoint for lancamentos import
 * POST /api/lancamentos/import/confirm
 *
 * Receives validated preview data from Tarefa 2 and creates FolhaPrevidenciaria
 * records with associated LancamentoFolha entries in the database.
 */

export interface ConfirmRequest {
  preview: PreviewRow[];
}

export interface ConfirmResponse {
  created: number;
  errors: string[];
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication and permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageLancamentos(session.user.role)) {
      return forbidden();
    }

    // 2. Parse request body
    const body = await req.json();
    const { preview } = body as ConfirmRequest;

    // 3. Validate preview array
    if (!Array.isArray(preview)) {
      return NextResponse.json(
        { error: "Preview deve ser um array" },
        { status: 400 }
      );
    }

    if (preview.length === 0) {
      return NextResponse.json(
        {
          created: 0,
          errors: [],
          message: "Nenhuma linha para processar",
        } as ConfirmResponse,
        { status: 200 }
      );
    }

    // 4. Process each valid row
    let created = 0;
    const errors: string[] = [];
    const userId = Number(session.user.id);

    for (let idx = 0; idx < preview.length; idx++) {
      const row = preview[idx];

      // Skip invalid rows
      if (!row.valid) {
        errors.push(
          `Linha ${idx + 2}: Dados inválidos (${row.fieldErrors.map((e) => e.message).join(", ")})`
        );
        continue;
      }

      try {
        // Validate required fields
        if (!row.orgaoId) {
          errors.push(`Linha ${idx + 2}: Órgão não encontrado`);
          continue;
        }
        if (!row.competenciaId) {
          errors.push(`Linha ${idx + 2}: Competência não encontrada`);
          continue;
        }

        // Prepare folhas data from tiposFolhasEnriched
        const folhasData = (row.tiposFolhasEnriched || [])
          .filter((tf) => tf.tipoFolhaId !== null)
          .map((tf) => {
            const aliquota = row.aliquota;
            const valor = tf.valor;
            const valorARecolher = calcularValorARecolher(valor, aliquota);
            const valorRecolhido = 0; // Initial state
            const diferenca = calcularDiferenca(valorARecolher, valorRecolhido);

            return {
              tipoFolhaId: tf.tipoFolhaId!,
              valor,
              aliquota,
              valorARecolher,
              valorRecolhido,
              diferenca,
            };
          });

        // Calculate totals
        const folhaTotal = calcularFolhaTotal(folhasData);
        const totalARecolher = calcularTotalARecolher(folhasData);
        const totalRecolhido = calcularTotalRecolhido(folhasData);
        const deficitTotal = calcularDeficitTotal(folhasData);

        // Use totals if folhas exist, otherwise use preview values
        const valorRecolher =
          folhasData.length > 0 ? totalARecolher : row.valorRecolher;
        const valorRecolhido =
          folhasData.length > 0 ? totalRecolhido : row.valorRecolhido;

        // Calculate lancamento status/deficit fields
        const calc = calcularLancamento({
          valorRecolher,
          valorRecolhido,
          multas: 0,
          juros: 0,
          acrescimo: 0,
          parcelado: false,
          diferenca_aprovada: false,
        });

        // Create lancamento with folhas in transaction
        const lancamento = await prisma.$transaction(async (tx) => {
          return await tx.folhaPrevidenciaria.create({
            data: {
              orgaoId: row.orgaoId!,
              tipo: row.tipo,
              exercicioId: row.exercicioId,
              competenciaId: row.competenciaId!,
              aliquota: row.aliquota,
              valorRecolher,
              valorRecolherCalculado: totalARecolher,
              valorRecolhido,
              quantidadeServidores: row.quantidadeServidores || 0,
              folhaBase: row.folhaBase,
              deficit: calc.deficit,
              inadimplencia: calc.inadimplencia,
              status: row.status,
              responsavelId: userId,
              // Totals for dynamic folhas
              folhaTotal:
                folhasData.length > 0 ? folhaTotal : (row.folhaBase ?? 0),
              totalARecolher,
              totalRecolhido,
              deficitTotal,
              // Dynamic folhas
              ...(folhasData.length > 0 && {
                folhas: {
                  create: folhasData,
                },
              }),
            },
            include: {
              orgao: true,
              exercicio: true,
              competencia: true,
              folhas: { include: { tipoFolha: true } },
            },
          });
        });

        // Record audit
        await recordAudit({
          entityType: "FolhaPrevidenciaria",
          entityId: lancamento.id,
          action: "CREATE",
          after: lancamento,
          userId,
        });

        created++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`Linha ${idx + 2}: ${msg}`);
      }
    }

    // 5. Return response
    return NextResponse.json(
      {
        created,
        errors,
        message: `${created} lançamento(s) criado(s)${errors.length > 0 ? ` com ${errors.length} erro(s)` : ""}`,
      } as ConfirmResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao confirmar lançamentos:", error);
    return NextResponse.json(
      { error: "Erro ao processar confirmação" },
      { status: 500 }
    );
  }
}
