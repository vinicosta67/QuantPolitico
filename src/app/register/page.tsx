"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: "Preencha os campos", description: "Todos os campos são obrigatórios." });
      return;
    }
    setLoading(true);
    try {
      // Mock register + login
      localStorage.setItem("qp_auth", JSON.stringify({ name, email, ts: Date.now() }));
      toast({ title: "Conta criada com sucesso" });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Criando..." : "Registrar"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-sm">
            Já tem conta? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


