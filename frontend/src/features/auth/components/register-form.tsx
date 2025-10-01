"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/molecules/form";
import { useRegisterForm } from "../hooks/use-register";
import type { RegisterPayload } from "../services/auth-service";

const registerSchema = z
  .object({
    email: z.string().email("Geçerli bir e-posta giriniz"),
    password: z.string().min(8, "Şifreniz en az 8 karakter olmalıdır"),
    confirmPassword: z.string().min(8, "Şifre tekrarı en az 8 karakter olmalıdır"),
    displayName: z
      .string()
      .min(2, "İsim en az 2 karakter olmalıdır")
      .max(120, "İsim en fazla 120 karakter olabilir")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", displayName: "" },
  });
  const { handleSubmit, pending } = useRegisterForm();

  const submit = async (values: RegisterFormValues) => {
    const registerPayload: RegisterPayload = {
      email: values.email,
      password: values.password,
      displayName: values.displayName?.trim() ? values.displayName.trim() : undefined,
    };

    await handleSubmit(registerPayload);
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="displayName">Ad Soyad</Label>
              <FormControl>
                <Input id="displayName" placeholder="Örn. Ayşe Yılmaz" {...field} />
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
              <Label htmlFor="email">E-posta</Label>
              <FormControl>
                <Input id="email" type="email" autoComplete="email" placeholder="ornek@badi.local" {...field} />
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
              <Label htmlFor="password">Şifre</Label>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="confirmPassword">Şifre (Tekrar)</Label>
              <FormControl>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="default" className="w-full" disabled={pending}>
          {pending ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </Button>
      </form>
    </Form>
  );
}
