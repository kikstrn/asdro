import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,

      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet,
            headers
          ) {
            // ----------------------------------------------
            // Met à jour les cookies de la requête
            // ----------------------------------------------

            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            // ----------------------------------------------
            // Recrée la réponse avec la requête mise à jour
            // ----------------------------------------------

            supabaseResponse =
              NextResponse.next({
                request,
              });

            // ----------------------------------------------
            // Réinjecte les cookies Supabase dans la réponse
            // ----------------------------------------------

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );

            // ----------------------------------------------
            // IMPORTANT :
            // Supabase SSR fournit notamment les headers
            // anti-cache nécessaires.
            // ----------------------------------------------

            if (headers) {
              Object.entries(
                headers
              ).forEach(
                ([
                  key,
                  value,
                ]) => {
                  supabaseResponse.headers.set(
                    key,
                    value
                  );
                }
              );
            }
          },
        },
      }
    );

  // ==========================================================
  // RAFRAÎCHISSEMENT / VALIDATION DE LA SESSION
  // ==========================================================

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims();

  if (error) {
    console.error(
      "Supabase auth proxy error:",
      error.message
    );
  }

  console.log(
    "Supabase proxy session:",
    Boolean(
      data?.claims
    )
  );

  return supabaseResponse;
}