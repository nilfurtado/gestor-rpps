import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageLancamentos, forbidden } from "@/lib/permissions";
import { parseLancamentosFile, type ParseError } from "@/lib/import/lancamentos-parser";

/**
 * Preview API endpoint for lancamentos import
 * POST /api/lancamentos/import/preview
 *
 * Receives CSV file, validates against database, and returns enriched preview data
 * with calculated fields (valorRecolher, deficit, inadimplencia)
 */

export interface PreviewRow {
  // From parser
  orgaoSigla: string;
  competenciaMes: string;
  tipo: "PATRONAL" | "SEGURADO";
  folhaBase: number;
  aliquota: number;
  valorRecolhido: number;
  tiposFolhas?: Array<{ nome: string; valor: number }>;
  // Enriched fields
  exercicioId: number;
  orgaoId: number | null;
  competenciaId: number | null;
  valorRecolher: number;
  deficit: number;
  inadimplencia: number;
  status: "LANCADO";
  valid: boolean;
  fieldErrors: ParseError[];
  tiposFolhasEnriched?: Array<{ nome: string; valor: number; tipoFolhaId: number | null }>;
}

export interface PreviewResponse {
  preview: PreviewRow[];
  errors: ParseError[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageLancamentos(session.user.role)) {
      return forbidden();
    }

    // Extract file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      );
    }

    // Parse CSV or XLSX file
    const { rows: parsedRows, errors: parseErrors } = await parseLancamentosFile(file);

    // Get current active exercício
    const exercicio = await prisma.exercicio.findFirst({
      where: { status: "ABERTO" },
      orderBy: { ano: "desc" },
    });

    if (!exercicio) {
      return NextResponse.json(
        { error: "Nenhum exercício aberto disponível" },
        { status: 400 }
      );
    }

    // Fetch lookup tables in parallel
    const [orgaos, competencias, tiposFolha] = await Promise.all([
      prisma.orgao.findMany(),
      prisma.competencia.findMany(),
      prisma.tipoFolha.findMany(),
    ]);

    // Enrich each parsed row
    const preview: PreviewRow[] = parsedRows.map((row, idx) => {
      const fieldErrors: ParseError[] = [];

      // Find órgão by sigla or nome
      const orgao = orgaos.find(
        (o) =>
          o.sigla.toLowerCase() === row.orgaoSigla.toLowerCase() ||
          o.nome.toLowerCase() === row.orgaoSigla.toLowerCase()
      );

      if (!orgao) {
        fieldErrors.push({
          row: idx + 2,
          field: "Órgão",
          message: "Órgão não encontrado",
        });
      }

      // Find competência by mês (case-insensitive)
      const competencia = competencias.find(
        (c) => c.mes.toLowerCase() === row.competenciaMes.toLowerCase()
      );

      if (!competencia) {
        fieldErrors.push({
          row: idx + 2,
          field: "Competência",
          message: "Competência não encontrada",
        });
      }

      // Validate and enrich tipos de folhas
      const tiposFolhasEnriched = (row.tiposFolhas || []).map((tf) => {
        const tipoFound = tiposFolha.find((t) => t.nome === tf.nome);
        if (!tipoFound) {
          fieldErrors.push({
            row: idx + 2,
            field: `TipoFolha:${tf.nome}`,
            message: "Tipo de folha não encontrado",
          });
        }
        return { ...tf, tipoFolhaId: tipoFound?.id || null };
      });

      // Calculate derived fields
      const valorRecolher = (row.folhaBase * row.aliquota) / 100;
      const deficit = valorRecolher - row.valorRecolhido;
      const inadimplencia = Math.max(0, deficit);

      return {
        ...row,
        exercicioId: exercicio.id,
        orgaoId: orgao?.id || null,
        competenciaId: competencia?.id || null,
        valorRecolher: Math.round(valorRecolher * 100) / 100,
        deficit: Math.round(deficit * 100) / 100,
        inadimplencia: Math.round(inadimplencia * 100) / 100,
        status: "LANCADO" as const,
        valid: fieldErrors.length === 0,
        fieldErrors,
        tiposFolhasEnriched,
      };
    });

    // Collect all errors
    const allErrors = [
      ...parseErrors,
      ...preview.flatMap((p) => p.fieldErrors),
    ];

    // Return preview response
    return NextResponse.json({
      preview,
      errors: allErrors,
      stats: {
        total: preview.length,
        valid: preview.filter((p) => p.valid).length,
        invalid: preview.filter((p) => !p.valid).length,
      },
    } as PreviewResponse);
  } catch (error) {
    console.error("Erro ao fazer preview:", error);
    return NextResponse.json(
      { error: "Erro ao processar arquivo" },
      { status: 500 }
    );
  }
}
