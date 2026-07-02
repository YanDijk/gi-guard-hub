import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Loader2, Download, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/professor/fotos")({
  head: () => ({ meta: [{ title: "Foto do Dia — TatameOS" }] }),
  component: Fotos,
});

type Photo = { id: string; photo_path: string; taken_on: string; caption: string | null; url: string };

function Fotos() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("training_photos")
        .select("*")
        .order("taken_on", { ascending: false })
        .limit(120);
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
      setPreview(null);
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
        if (up.error) { toast.error(up.error.message); continue; }
        const ins = await supabase.from("training_photos").insert({ photo_path: path, uploaded_by: userId });
        if (ins.error) { toast.error(ins.error.message); continue; }
        ok++;
      }
      if (ok > 0) toast.success(`${ok} foto(s) enviada(s)`);
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const grouped = useMemo(() => {
    const filtered = filterDate ? photos.filter((p) => p.taken_on === filterDate) : photos;
    const groups = new Map<string, Photo[]>();
    filtered.forEach((p) => {
      const arr = groups.get(p.taken_on) ?? [];
      arr.push(p);
      groups.set(p.taken_on, arr);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [photos, filterDate]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  function labelForDate(iso: string) {
    if (iso === todayIso) return "Hoje";
    if (iso === yesterdayIso) return "Ontem";
    return new Date(iso + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }

  return (
    <ProfessorShell
      title="Foto do Dia"
      actions={
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-3 sm:px-4 bg-brand text-brand-foreground rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            <span className="hidden sm:inline">{uploading ? "Enviando..." : "Enviar fotos"}</span>
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="h-9 px-2 bg-background border border-border rounded text-sm"
        />
        {filterDate && (
          <button onClick={() => setFilterDate("")} className="text-xs text-brand uppercase tracking-widest">
            Limpar filtro
          </button>
        )}
        <div className="text-xs text-muted-foreground ml-auto">
          {photos.length} foto(s) no total
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          {filterDate ? "Nenhuma foto nesta data." : "Nenhuma foto ainda. Envie a primeira para começar."}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, list]) => (
            <section key={date}>
              <h2 className="font-display text-lg mb-3 flex items-center gap-2">
                <span className="capitalize">{labelForDate(date)}</span>
                <span className="text-xs text-muted-foreground font-sans font-normal">· {list.length} foto(s)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {list.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreview(p)}
                    className="aspect-square rounded-lg overflow-hidden bg-surface border border-border relative group"
                  >
                    {p.url ? (
                      <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">indisponível</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                      <div className="text-[10px] text-white/80">{new Date(p.taken_on).toLocaleDateString("pt-BR")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
          onClick={() => setPreview(null)}
        >
          <div className="flex items-center justify-between p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs sm:text-sm text-white/80">
              {new Date(preview.taken_on).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={preview.url}
                download={`tatame-${preview.taken_on}-${preview.id.slice(0, 6)}.jpg`}
                target="_blank"
                rel="noopener"
                className="h-9 px-3 bg-white/10 hover:bg-white/20 rounded-md text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1"
              >
                <Download className="size-4" /> Baixar
              </a>
              <button
                onClick={() => { if (confirm("Excluir esta foto?")) deleteMutation.mutate({ id: preview.id, photo_path: preview.photo_path }); }}
                className="h-9 px-3 bg-red-500/20 hover:bg-red-500/30 rounded-md text-xs font-bold uppercase tracking-wider text-red-300 flex items-center gap-1"
              >
                <Trash2 className="size-4" /> Excluir
              </button>
              <button onClick={() => setPreview(null)} className="size-9 grid place-items-center bg-white/10 hover:bg-white/20 rounded-md text-white">
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <img src={preview.url} alt={preview.caption ?? ""} className="max-w-full max-h-full object-contain" />
          </div>
          {preview.caption && (
            <div className="p-3 text-center text-sm text-white/80" onClick={(e) => e.stopPropagation()}>{preview.caption}</div>
          )}
        </div>
      )}
    </ProfessorShell>
  );
}
