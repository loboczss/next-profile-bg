import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Plane,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contato | Next Profile",
  description:
    "Fale com a equipe Next Profile Luxury Travel para personalizar sua próxima viagem dos sonhos.",
};

const contactChannels = [
  {
    icon: Phone,
    label: "Telefone",
    value: "+55 (11) 3456-7890",
    href: "tel:+551134567890",
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "experiencias@nextprofile.com",
    href: "mailto:experiencias@nextprofile.com",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp Concierge",
    value: "+55 (11) 99876-5432",
    href: "https://wa.me/5511998765432",
  },
  {
    icon: MapPin,
    label: "Endereço",
    value: "Av. Paulista, 1000 – Bela Vista, São Paulo/SP",
  },
  {
    icon: Clock,
    label: "Horário de atendimento",
    value: "Segunda a sexta, das 9h às 19h (BRT)",
  },
];

export default function ContactPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_60%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-32 md:px-10 lg:px-12">
        <section className="space-y-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-sky-600 shadow-sm backdrop-blur">
            <Sparkles className="size-4" aria-hidden="true" />
            Concierge Next Profile
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Como podemos transformar sua próxima jornada?
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-slate-600">
              Nossa equipe está pronta para desenhar roteiros personalizados, sugerir experiências exclusivas e cuidar de cada detalhe da sua viagem. Conte-nos seus planos e retornaremos em até um dia útil.
            </p>
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-xl shadow-sky-100/40 backdrop-blur">
            <h2 className="text-2xl font-semibold text-slate-900">Envie uma mensagem</h2>
            <p className="mt-2 text-slate-600">
              Preencha o formulário e nossa equipe retornará com propostas personalizadas, combinando destinos, hospedagens e experiências que reflitam o seu estilo de viagem.
            </p>
            <form className="mt-8 grid gap-6" aria-label="Formulário de contato">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Como devemos chamá-lo(a)?"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="voce@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Telefone ou WhatsApp
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="(11) 98765-4321"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="destination" className="text-sm font-medium text-slate-700">
                  Destino desejado
                </label>
                <Input
                  id="destination"
                  name="destination"
                  placeholder="Ex.: Maldivas, Itália, Patagônia"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="message" className="text-sm font-medium text-slate-700">
                  Conte-nos mais sobre a experiência dos sonhos
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Preferências, datas aproximadas, número de viajantes, ocasiões especiais..."
                  rows={5}
                  required
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-500">
                  Ao enviar, você concorda em receber contato da equipe Next Profile. Seus dados são tratados conforme a nossa política de privacidade.
                </p>
                <Button type="submit" className="inline-flex items-center gap-2 px-6 py-2 text-base">
                  <Plane className="size-4" aria-hidden="true" />
                  Enviar mensagem
                </Button>
              </div>
            </form>
          </div>

          <aside className="grid gap-8">
            <div className="rounded-3xl border border-sky-200/60 bg-white/80 p-8 shadow-lg shadow-sky-100/50 backdrop-blur">
              <h2 className="text-2xl font-semibold text-slate-900">Canais de contato direto</h2>
              <p className="mt-2 text-slate-600">
                Prefere falar imediatamente? Escolha o canal ideal para você e fale com nosso concierge dedicado.
              </p>
              <ul className="mt-6 space-y-5">
                {contactChannels.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="mt-1 rounded-full bg-sky-500/10 p-2 text-sky-600">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      {href ? (
                        <Link
                          href={href}
                          className="text-base font-semibold text-slate-900 transition-colors hover:text-sky-600"
                        >
                          {value}
                        </Link>
                      ) : (
                        <p className="text-base font-semibold text-slate-900">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-500/10 via-white to-purple-500/10 p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-slate-900">Precisa de inspiração imediata?</h3>
              <p className="mt-3 text-slate-600">
                Explore nossos <Link href="/destinos" className="font-semibold text-sky-600 underline-offset-4 hover:underline">destinos</Link> favoritos ou leia mais <Link href="/sobre-nos" className="font-semibold text-sky-600 underline-offset-4 hover:underline">sobre nossa curadoria</Link> antes de conversar com a equipe.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
