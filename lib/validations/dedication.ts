import { z } from "zod";

const MAX_NAME_LENGTH = 80;
const MAX_SONG_LENGTH = 160;
const MAX_ARTIST_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_INSTAGRAM_LENGTH = 31;

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || undefined)
    .optional();

const spotifyTrackId = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{22}$/, "La canción de Spotify no es válida.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

const spotifyUrl = z
  .string()
  .trim()
  .url("El enlace de Spotify no es válido.")
  .refine(
    (value) => /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}/.test(value),
    "El enlace de Spotify no es válido.",
  )
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

const instagramHandle = z
  .string()
  .trim()
  .max(MAX_INSTAGRAM_LENGTH)
  .refine(
    (value) => value === "" || /^@?[A-Za-z0-9._]+$/.test(value),
    "Ingresa un usuario válido de Instagram.",
  )
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return value.startsWith("@") ? value : `@${value}`;
  })
  .optional();

export const dedicationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "published",
]);

export const adminDedicationStatusUpdateSchema = z.object({
  id: z.uuid("La dedicatoria seleccionada no es válida."),
  status: dedicationStatusSchema,
});

export const dedicationSubmissionSchema = z.object({
  senderName: optionalText(MAX_NAME_LENGTH),
  recipientName: optionalText(MAX_NAME_LENGTH),
  song: z
    .string()
    .trim()
    .min(1, "Indica la canción.")
    .max(MAX_SONG_LENGTH),
  spotifyTrackId,
  spotifyUrl,
  artist: z
    .string()
    .trim()
    .min(1, "Indica el artista.")
    .max(MAX_ARTIST_LENGTH),
  message: z
    .string()
    .trim()
    .min(1, "Cuéntanos tu historia.")
    .max(MAX_MESSAGE_LENGTH),
  instagram: instagramHandle,
  allowPublishing: z.boolean().default(false),
  website: z.string().max(0, "Solicitud rechazada.").optional().default(""),
});

export const privateDedicationSubmissionSchema = z.object({
  artist: z
    .string()
    .trim()
    .min(1, "Indica el artista.")
    .max(MAX_ARTIST_LENGTH),
  message: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje para esa persona.")
    .max(MAX_MESSAGE_LENGTH),
  recipientName: z
    .string()
    .trim()
    .min(1, "Indica para quién es la dedicatoria.")
    .max(MAX_NAME_LENGTH),
  senderName: optionalText(MAX_NAME_LENGTH),
  song: z
    .string()
    .trim()
    .min(1, "Indica la canción.")
    .max(MAX_SONG_LENGTH),
  spotifyTrackId,
  spotifyUrl,
  storyStyle: z.enum(["editorial", "noche", "tinta"]).default("editorial"),
  website: z.string().max(0, "Solicitud rechazada.").optional().default(""),
});

export type DedicationSubmission = z.infer<typeof dedicationSubmissionSchema>;
export type DedicationStatus = z.infer<typeof dedicationStatusSchema>;
export type PrivateDedicationSubmission = z.infer<
  typeof privateDedicationSubmissionSchema
>;
