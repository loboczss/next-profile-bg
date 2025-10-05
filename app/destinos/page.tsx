import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Ship, 
  Luggage, 
  Globe, 
  Sparkles,
  TrendingUp,
  Heart,
  Clock,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Check,
  Compass,
  Waves,
  Mountain,
  Palmtree,
  Building,
  Camera
} from "lucide-react";

import { CreateDestinationForm } from "@/components/destinations/create-destination-form";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import {
  DestinationFormState,
  destinationFormSchema,
  type DestinationDeleteState,
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertImage, sanitizeExt } from "@/lib/file";
import { storeDestinationPhoto } from "@/lib/storage";

export const runtime = "nodejs";

// Ação server-side responsável por criar novos destinos a partir do formulário da página.
async function createDestination(
  _prevState: DestinationFormState,
  formData: FormData
): Promise<DestinationFormState> {
  "use server";

  // Garante que apenas usuários autenticados possam cadastrar destinos.
  const session = await auth();
  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para criar um destino.",
    };
  }

  // Normaliza as URLs de fotos informadas manualmente no formulário.
  const photosRaw = String(formData.get("photos") ?? "");
  const manualPhotos = photosRaw
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

  // Separa os arquivos enviados via upload para validação e armazenamento.
  const photoFiles = formData
    .getAll("photoFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const uploadedPhotos: string[] = [];
  const uploadErrors: string[] = [];

  for (const file of photoFiles) {
    try {
      // Valida o tipo do arquivo e encaminha para o storage configurado.
      assertImage(file);
      const ext = sanitizeExt(file.type);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageUrl = await storeDestinationPhoto(String(session.user.id), ext, buffer, {
        originalName: file.name,
      });
      uploadedPhotos.push(imageUrl);
    } catch (error) {
      console.error("Erro ao enviar foto de destino", error);
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo.";
      uploadErrors.push(`${file.name || "Arquivo"}: ${message}`);
    }
  }

  if (uploadErrors.length > 0) {
    return {
      status: "error",
      message: "Não foi possível enviar todas as imagens selecionadas.",
      errors: { photoFiles: uploadErrors },
    };
  }

  // Junta e remove duplicidades entre URLs manuais e fotos recém-enviadas.
  const photos = Array.from(new Set([...manualPhotos, ...uploadedPhotos]));

  // Faz o parse dos campos utilizando o schema do Zod para garantir consistência.
  const parsed = destinationFormSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    description: formData.get("description"),
    price: formData.get("price"),
    peopleCount: formData.get("peopleCount"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rating: formData.get("rating"),
    photos,
  });

  if (!parsed.success) {
    // Retorna os erros de validação para que o formulário mostre mensagens ao usuário.
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      errors,
    };
  }

  try {
    // Persiste o destino no banco, convertendo valores numéricos quando necessário.
    await prisma.destination.create({
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        description: parsed.data.description,
        price: new Prisma.Decimal(parsed.data.price),
        peopleCount: parsed.data.peopleCount,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        rating: parsed.data.rating,
        photos: parsed.data.photos,
        userId: Number(session.user.id),
      },
    });
  } catch (error) {
    console.error("Erro ao criar destino", error);
    return {
      status: "error",
      message: "Não foi possível criar o destino. Tente novamente mais tarde.",
    };
  }

  // Atualiza o cache das páginas que exibem a lista de destinos.
  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino criado com sucesso!",
  };
}

// Ação server-side responsável por remover destinos cadastrados pelo usuário.
async function deleteDestination(
  _prevState: DestinationDeleteState,
  formData: FormData
): Promise<DestinationDeleteState> {
  "use server";

  // Verifica se há um usuário autenticado antes de realizar a exclusão.
  const session = await auth();
  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para excluir um destino.",
    };
  }

  const destinationIdRaw = formData.get("destinationId");
  const destinationId = Number(destinationIdRaw);

  if (!destinationIdRaw || Number.isNaN(destinationId) || !Number.isInteger(destinationId)) {
    // Bloqueia requisições com identificadores inválidos.
    return {
      status: "error",
      message: "Destino inválido.",
    };
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, userId: true },
    });

    if (!destination) {
      return {
        status: "error",
        message: "Destino não encontrado.",
      };
    }

    if (destination.userId !== Number(session.user.id)) {
      // Impede que um usuário exclua destinos de terceiros.
      return {
        status: "error",
        message: "Você não tem permissão para excluir este destino.",
      };
    }

    await prisma.destination.delete({
      where: { id: destinationId },
    });
  } catch (error) {
    console.error("Erro ao excluir destino", error);
    return {
      status: "error",
      message: "Não foi possível excluir o destino. Tente novamente mais tarde.",
    };
  }

  // Revalida as páginas que exibem o destino removido.
  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino excluído com sucesso!",
  };
}

// Página que lista todos os destinos cadastrados e oferece formulários para criação e exclusão.
export default async function DestinationsPage() {
  // Recupera a sessão para saber se o usuário pode gerenciar destinos.
  const session = await auth();

  let destinations: SerializedDestination[] = [];
  let destinationsError = false;
  try {
    // Busca todos os destinos ordenados por data de criação.
    const destinationsFromDb = await prisma.destination.findMany({
      orderBy: { createdAt: "desc" },
    });
    destinations = destinationsFromDb.map(serializeDestination);
  } catch (error) {
    console.error("Erro ao buscar destinos", error);
    destinationsError = true;
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      {/* Elementos decorativos animados de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-teal-200 rounded-full blur-3xl opacity-20 animate-pulse [animation-delay:4s]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Logo e Header Principal */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="relative">
                <Plane className="w-10 h-10 text-blue-600 animate-bounce" />
                <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Evastur
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-700 font-semibold mb-2">
              Transformamos sonhos em viagens inesquecíveis
            </p>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Sua jornada dos sonhos começa aqui! Explore destinos incríveis com os melhores preços e atendimento personalizado.
            </p>
          </div>

          {/* Cards de Serviços */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Plane, title: "Passagens Aéreas", desc: "Melhores tarifas", color: "from-blue-50 to-blue-100", iconColor: "text-blue-600" },
              { icon: Luggage, title: "Pacotes Completos", desc: "Tudo incluído", color: "from-purple-50 to-purple-100", iconColor: "text-purple-600" },
              { icon: Ship, title: "Cruzeiros", desc: "Experiências no mar", color: "from-cyan-50 to-cyan-100", iconColor: "text-cyan-600" },
              { icon: Globe, title: "Viagens Internacionais", desc: "O mundo é seu", color: "from-green-50 to-green-100", iconColor: "text-green-600" }
            ].map((service, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <service.icon className={`w-10 h-10 ${service.iconColor} mb-3 group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="font-bold text-gray-800 mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-600">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefícios */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 mb-12 text-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { icon: Shield, title: "Segurança Total", desc: "Viaje com tranquilidade e proteção completa" },
                { icon: TrendingUp, title: "Melhor Preço", desc: "Garantimos as melhores ofertas do mercado" },
                { icon: Heart, title: "Atendimento VIP", desc: "Suporte 24h com especialistas em viagens" }
              ].map((benefit, index) => (
                <div key={index} className="group">
                  <benefit.icon className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-blue-100 text-sm">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative z-10 text-center">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-spin" style={{ animationDuration: '20s' }} />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Promoções Imperdíveis!
              </h2>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Cadastre-se agora e receba ofertas exclusivas, descontos especiais e as melhores oportunidades de viagem diretamente no seu e-mail.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Phone className="w-5 h-5 group-hover:animate-bounce" />
                  Fale Conosco
                </button>
                <button className="group inline-flex items-center gap-2 bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <MessageCircle className="w-5 h-5 group-hover:animate-bounce" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Destinos */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Header da seção de destinos */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-2 rounded-full mb-4">
            <Compass className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              Destinos Exclusivos
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Descubra Lugares Incríveis
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Selecionamos cuidadosamente os melhores destinos para você viver experiências únicas. 
            De praias paradisíacas a metrópoles vibrantes, temos a viagem perfeita para cada estilo.
          </p>
        </div>

        {/* Categorias de Destinos */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { icon: Waves, label: "Praias", bgColor: "hover:bg-blue-50", iconColor: "text-blue-500" },
            { icon: Mountain, label: "Montanhas", bgColor: "hover:bg-green-50", iconColor: "text-green-500" },
            { icon: Building, label: "Cidades", bgColor: "hover:bg-purple-50", iconColor: "text-purple-500" },
            { icon: Palmtree, label: "Tropical", bgColor: "hover:bg-orange-50", iconColor: "text-orange-500" },
            { icon: Camera, label: "Aventura", bgColor: "hover:bg-red-50", iconColor: "text-red-500" }
          ].map((category, index) => (
            <button
              key={index}
              className={`group inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${category.bgColor}`}
            >
              <category.icon className={`w-5 h-5 ${category.iconColor} group-hover:scale-110 transition-transform`} />
              <span className="font-medium text-gray-700">{category.label}</span>
            </button>
          ))}
        </div>

        {/* Formulário de criação (apenas para usuários logados) */}
        {session?.user && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">Área Administrativa</h3>
              </div>
              <CreateDestinationForm action={createDestination} />
            </div>
          </div>
        )}

        {/* Lista de Destinos */}
        <div className="space-y-6" id="destinos">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-blue-600 animate-bounce" />
              <h3 className="text-2xl font-bold text-gray-800">Destinos Disponíveis</h3>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {destinations.length} {destinations.length === 1 ? 'destino incrível' : 'destinos incríveis'}
              </span>
            </div>
          </div>

          {destinationsError ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
              <div className="bg-amber-100 rounded-full p-2">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 mb-1">Ops! Pequeno contratempo</p>
                <p className="text-sm text-amber-700">
                  Estamos atualizando nossos destinos para você. Por favor, tente novamente em alguns instantes.
                </p>
              </div>
            </div>
          ) : destinations.length === 0 ? (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl p-12 text-center">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" style={{ animationDuration: '20s' }} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Novos destinos em breve!
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Estamos preparando ofertas incríveis para você. Volte em breve ou entre em contato para saber mais.
              </p>
            </div>
          ) : (
            <DestinationGrid
              destinations={destinations}
              onDelete={session?.user ? deleteDestination : undefined}
            />
          )}
        </div>

        {/* Call to Action Final */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          <div className="relative z-10">
            <Heart className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para sua próxima aventura?
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Nossa equipe de especialistas está pronta para criar o roteiro perfeito para você!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <Mail className="w-5 h-5 group-hover:animate-bounce" />
                Solicitar Orçamento
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group inline-flex items-center justify-center gap-2 bg-blue-700 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-800 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <Phone className="w-5 h-5 group-hover:animate-bounce" />
                Ligar Agora
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}