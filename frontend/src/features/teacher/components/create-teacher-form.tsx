"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/shared/hooks/use-auth";
import { teacherService } from "@/features/teacher/services/teacher-service";
import type { TeacherSummary } from "@/features/teacher/types/teacher.types";

const createTeacherSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  displayName: z
    .string()
    .min(2, "Ad soyad en az 2 karakter olmalı")
    .max(120, "Ad soyad en fazla 120 karakter olabilir"),
  subject: z
    .string()
    .min(2, "Branş en az 2 karakter olmalı")
    .max(60, "Branş en fazla 60 karakter olabilir"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(64, "Şifre en fazla 64 karakter olabilir")
    .optional()
    .or(z.literal("")),
  organizationId: z.string().optional(),
});

type CreateTeacherFormValues = z.infer<typeof createTeacherSchema>;

export function CreateTeacherForm() {
  const { roles, organizationId, organizationName } = useAuth();
  const isSystemAdmin = roles.includes("system-admin");
  const [pending, setPending] = useState(false);
  const [lastCreated, setLastCreated] = useState<TeacherSummary | null>(null);

  const form = useForm<CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      email: "",
      displayName: "",
      subject: "",
      password: "",
      organizationId: organizationId ?? "",
    },
  });

  const onSubmit = async (values: CreateTeacherFormValues) => {
    try {
      setPending(true);
      setLastCreated(null);

      const payload = {
        email: values.email,
        displayName: values.displayName,
        subject: values.subject,
        password: values.password?.trim() ? values.password : undefined,
        organizationId: isSystemAdmin
          ? values.organizationId?.trim() || undefined
          : undefined,
      };

      const response = await teacherService.createTeacher(payload);
      setLastCreated(response);
      toast.success("Öğretmen oluşturuldu");
      form.reset({
        email: "",
        displayName: "",
        subject: "",
        password: "",
        organizationId: isSystemAdmin ? payload.organizationId ?? "" : organizationId ?? "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Öğretmen ekleme başarısız";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Yeni Öğretmen Ekle</h2>
        <p className="text-sm text-muted-foreground">
          E-posta, ad-soyad ve branş bilgilerini girerek öğretmen hesabı oluşturun. Şifre girmezseniz sistem sizin için
          geçici bir şifre üretir.
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad</FormLabel>
                <FormControl>
                  <Input placeholder="Örn. Ayşe Yılmaz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="ogretmen@badi.local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branş</FormLabel>
                <FormControl>
                  <Input placeholder="Örn. Müzik" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre (Opsiyonel)</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="En az 8 karakter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isSystemAdmin ? (
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kurum ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Kurum UUID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
              <p>
                Öğretmenler otomatik olarak <strong>{organizationName ?? "tanımlı kurum"}</strong> kurumuna bağlanır.
              </p>
            </div>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Öğretmen ekleniyor..." : "Öğretmen ekle"}
          </Button>
        </form>
      </Form>

      {lastCreated ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm">
          <h3 className="text-base font-semibold">Oluşturulan Öğretmen</h3>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">E-posta:</span> {lastCreated.email}
            </li>
            <li>
              <span className="font-medium text-foreground">Branş:</span> {lastCreated.subject}
            </li>
            <li>
              <span className="font-medium text-foreground">Kurum ID:</span> {lastCreated.organizationId ?? "-"}
            </li>
            {lastCreated.temporaryPassword ? (
              <li className="text-amber-600">
                <span className="font-medium text-foreground">Geçici Şifre:</span> {lastCreated.temporaryPassword}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
