import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-slate-100 text-slate-900">
      <div className="min-h-dvh bg-white/80">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 pb-16 pt-32">
          <header className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Sobre nós
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Conectamos pessoas às suas melhores histórias visuais
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              A Next Profile BG nasceu da vontade de facilitar o gerenciamento de fotos
              de perfil e planos de fundo em experiências digitais. Nossa plataforma
              foi construída para ser simples, acessível e capaz de criar conexões
              autênticas através de imagens.
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Nossa missão</h2>
              <p className="mt-3 text-sm text-slate-600">
                Empoderar pessoas e equipes a compartilharem identidades visuais
                marcantes, oferecendo ferramentas intuitivas para personalização de
                fotos de perfil e backgrounds em poucos cliques.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Nossos valores</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <strong className="font-semibold text-slate-800">Simplicidade:</strong> cada
                  funcionalidade foi desenhada para facilitar o dia a dia.
                </li>
                <li>
                  <strong className="font-semibold text-slate-800">Colaboração:</strong> ouvimos nossa
                  comunidade para evoluir constantemente.
                </li>
                <li>
                  <strong className="font-semibold text-slate-800">Segurança:</strong> tratamos cada
                  imagem com o máximo cuidado e privacidade.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Nosso compromisso</h2>
              <p className="mt-3 text-sm text-slate-600">
                Queremos que você se sinta em casa enquanto cria experiências visuais. Por
                isso, investimos em uma infraestrutura estável, suporte acolhedor e uma
                comunidade ativa para compartilhar descobertas.
              </p>
            </div>
          </div>

          <section className="grid gap-8 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-sm md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">
                Uma equipe que acredita no poder das imagens
              </h2>
              <p className="text-sm text-slate-600">
                Nossa equipe multidisciplinar reúne especialistas em design, engenharia,
                fotografia e experiência do usuário. Trabalhamos lado a lado com nossos
                clientes para entender suas necessidades e transformar feedback em novas
                possibilidades dentro da plataforma.
              </p>
              <p className="text-sm text-slate-600">
                Acreditamos que cada perfil conta uma história única e estamos aqui para
                ajudar você a compartilhá-la com o mundo.
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="text-lg font-semibold text-primary">Quer conversar?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Estamos prontos para ajudar você e sua equipe a criar experiências visuais
                inesquecíveis.
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700">
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-primary/80">
                    E-mail
                  </span>
                  contato@nextprofilebg.com
                </p>
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-primary/80">
                    Endereço
                  </span>
                  Avenida das Imagens, 123 - São Paulo, SP
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Pronto para criar memórias visuais marcantes?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Faça login para personalizar fotos de perfil, backgrounds e compartilhar
                com sua comunidade.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Acessar conta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
