// Coleções de conteúdo: artigos do blog (Markdown em src/content/artigos).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const artigos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artigos' }),
  schema: z.object({
    titulo: z.string(),
    subtitulo: z.string().optional(),
    resumo: z.string(),
    autores: z.array(z.object({ nome: z.string(), afiliacao: z.string().optional() })).min(1),
    data: z.coerce.date(),
    actualizado: z.coerce.date().optional(),
    categoria: z.enum(['Investigação', 'Tecnologia', 'Política pública', 'Dados e estatística', 'Notícias']),
    palavrasChave: z.array(z.string()).default([]),
    // Idioma do texto (BCP 47), para leitores de ecrã e motores de busca.
    idioma: z.string().default('pt-PT'),
    rascunho: z.boolean().default(false),
  }),
});

export const collections = { artigos };
