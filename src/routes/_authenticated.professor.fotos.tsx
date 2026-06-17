import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/professor/fotos")({
  head: () => ({ meta: [{ title: "Foto do Dia — TatameOS" }] }),
  component: Fotos,
});

function Fotos() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_photos")
        .select("*")
        .order("taken_on", { ascending: false })
        .limit(60);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const paths = data.map((p) => p.photo_path);
      const { data: signed } = await supabase.storage.from("training-photos").createSignedUrls(paths, 3600);
      const urlMap = new Map(signed?.map((s) => [s.path, s.signedUrl]) ?? []);
      return data.map((p) => ({ ...p, url: urlMap.get(p.photo_path) ?? "" }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (photo: { id: string; photo_path: string }) => {
      await supabase.storage.from("training-photos").remove([photo.photo_path]);
      const { error } = await supabase.from("training_photos").delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Foto removida");
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      let ok = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("training-photos").upload(path, file, { contentType: file.type });
        if (up.error) {
          toast.error(up.error.message);
          continue;
        }
        const ins = await supabase.from("training_photos").insert({
          photo_path: path,
          uploaded_by: userId,
        });
        if (ins.error) {
          toast.error(ins.error.message);
          continue;
        }
        ok++;
      }
      if (ok > 0) toast.success(`${ok} foto(s) enviada(s)`);
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <ProfessorShell
      title="Foto do Dia"
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Enviando..." : "Enviar fotos"}
          </button>
        </>
      }
    >
      <div className="text-sm text-muted-foreground mb-6">
        Fotos e momentos dos treinos. Visíveis para todos os alunos autenticados.
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          Nenhuma foto ainda. Envie a primeira para começar.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-surface border border-border relative group">
              {p.url ? (
                <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">indisponível</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <div className="text-xs">
                  <div className="font-semibold">{new Date(p.taken_on).toLocaleDateString("pt-BR")}</div>
                  {p.caption && <div className="text-muted-foreground">{p.caption}</div>}
                </div>
                <button
                  onClick={() => {
                    if (confirm("Remover foto?")) deleteMutation.mutate({ id: p.id, photo_path: p.photo_path });
                  }}
                  className="size-7 grid place-items-center bg-black/60 rounded text-white hover:text-red-400"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfessorShell>
  );
}
