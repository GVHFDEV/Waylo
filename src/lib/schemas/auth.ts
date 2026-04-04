import * as z from 'zod'

/**
 * Esquema de validação para autenticação (Login e Cadastro).
 * 
 * Atualizado na Missão 06:
 * - Adicionado fullName para o fluxo de cadastro.
 */
export const authSchema = z.object({
  fullName: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Insira um e-mail válido'),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

/**
 * Tipo inferido a partir do esquema para uso com React Hook Form.
 */
export type AuthFormValues = z.infer<typeof authSchema>
