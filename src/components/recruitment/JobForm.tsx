
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { getCommunes, createJob } from "@/services/jobsService";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { logger } from "@/utils/logger";

const schema = z.object({
  title: z.string().min(3).max(100),
  commune: z.string().min(1),
  description: z.string().min(20).max(1000),
  skills: z.array(z.string()).optional().default([]),
  contact: z.string().min(6),
  deadline: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export const JobForm: React.FC = () => {
  const { toast } = useToast();
  const [communes, setCommunes] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [skillInput, setSkillInput] = React.useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      commune: "",
      description: "",
      skills: [],
      contact: "",
      deadline: undefined,
    },
  });

  React.useEffect(() => {
    getCommunes()
      .then((d) => setCommunes(d.communes))
      .catch(() => setCommunes([]));
  }, []);

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    const arr = form.getValues("skills") ?? [];
    if (arr.includes(v)) return;
    form.setValue("skills", [...arr, v]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => {
    const arr = form.getValues("skills") ?? [];
    form.setValue("skills", arr.filter((x) => x !== s));
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        commune: values.commune,
        description: values.description,
        skills: values.skills ?? [],
        contact: values.contact,
        deadline: values.deadline ? values.deadline.toISOString().slice(0, 10) : null,
      };
      logger.info('job_create_submit', { title: payload.title, commune: payload.commune }, 'JobForm');
      const res = await createJob(payload);
      logger.info('job_create_success', { id: (res as any).id, status: res.status }, 'JobForm');
      toast({
        title: "Annonce soumise",
        description: res.status === "pending"
          ? "Votre annonce a été envoyée et sera visible après modération."
          : "Votre annonce a été publiée.",
      });
      form.reset();
    } catch (e: any) {
      logger.error('job_create_error', e, 'JobForm');
      toast({ title: "Erreur", description: e.message ?? "Impossible de publier l'annonce", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre du poste</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Agent de police municipale" {...field} />
                </FormControl>
                <FormDescription>Max 100 caractères.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commune"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commune</FormLabel>
                <FormControl>
                  <Input list="communes-list" placeholder="Commune" {...field} />
                </FormControl>
                <datalist id="communes-list">
                  {communes.map((c) => (
                    <option value={c} key={c} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description du poste</FormLabel>
                <FormControl>
                  <Textarea rows={6} placeholder="Missions, conditions, profil recherché..." {...field} />
                </FormControl>
                <FormDescription>Max 1000 caractères.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Compétences (optionnel)</label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ajoutez une compétence et appuyez sur Entrée"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addSkill}>Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.watch("skills") ?? []).map((s) => (
                <Badge key={s} variant="outline" className="cursor-pointer" onClick={() => removeSkill(s)}>
                  {s} ✕
                </Badge>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Email ou téléphone" {...field} />
                </FormControl>
                <FormDescription>Indiquez un email ou un numéro de téléphone valide.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date limite (optionnel)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="justify-start">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {field.value ? field.value.toLocaleDateString("fr-FR") : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(d) => field.onChange(d ?? null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Optionnel.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-3">
            <Button type="submit" disabled={loading}>
              Publier
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
