export type Belt = "branca" | "azul" | "roxa" | "marrom" | "preta";

export const beltColors: Record<Belt, { bg: string; label: string }> = {
  branca: { bg: "#f5f5f5", label: "Branca" },
  azul: { bg: "#2563eb", label: "Azul" },
  roxa: { bg: "#7c3aed", label: "Roxa" },
  marrom: { bg: "#78350f", label: "Marrom" },
  preta: { bg: "#0a0a0a", label: "Preta" },
};

export type Student = {
  id: string;
  name: string;
  belt: Belt;
  stripes: number;
  weight: number;
  birthdate: string;
  phone: string;
  status: "ativo" | "inadimplente" | "inativo";
  attendance30d: number;
  monthlyFee: number;
  paid: boolean;
  avatar: string;
};

const names = [
  "Lucas Almeida", "Bruna Carvalho", "Rafael Souza", "Mariana Lima", "Pedro Henrique",
  "Camila Rocha", "Felipe Tavares", "Juliana Mendes", "Diego Pereira", "Larissa Castro",
  "Gustavo Ribeiro", "Patrícia Nunes", "Tiago Oliveira", "Renata Barros", "André Martins",
  "Beatriz Cardoso", "Vinícius Costa", "Amanda Freitas", "Marcelo Dias", "Carolina Pinto",
];

const belts: Belt[] = ["branca", "azul", "roxa", "marrom", "preta"];

export const students: Student[] = names.map((name, i) => ({
  id: `s${i + 1}`,
  name,
  belt: belts[i % 5],
  stripes: i % 5,
  weight: 60 + (i * 3) % 40,
  birthdate: `19${85 + (i % 15)}-0${(i % 9) + 1}-1${i % 9}`,
  phone: `(11) 9${1000 + i}-${2000 + i * 3}`,
  status: i % 7 === 0 ? "inadimplente" : i % 11 === 0 ? "inativo" : "ativo",
  attendance30d: 8 + (i * 2) % 16,
  monthlyFee: i % 3 === 0 ? 250 : 200,
  paid: i % 7 !== 0,
  avatar: `https://i.pravatar.cc/120?img=${i + 5}`,
}));

export const todayClasses = [
  { id: "c1", time: "06:30", name: "Fundamentos", level: "Iniciante", confirmed: 12, capacity: 20 },
  { id: "c2", time: "12:00", name: "No-Gi", level: "Todos", confirmed: 8, capacity: 18 },
  { id: "c3", time: "19:00", name: "Avançado", level: "Roxa+", confirmed: 16, capacity: 22 },
  { id: "c4", time: "20:30", name: "Competição", level: "Convocados", confirmed: 10, capacity: 14 },
];

export const tournaments = [
  { id: "t1", name: "Copa Pódio SP", date: "2026-07-12", city: "São Paulo", registered: 8 },
  { id: "t2", name: "Brasileiro CBJJ", date: "2026-08-22", city: "Rio de Janeiro", registered: 4 },
  { id: "t3", name: "Open de Inverno", date: "2026-09-05", city: "Curitiba", registered: 12 },
];

export const graduations = [
  { id: "g1", studentId: "s3", name: "Rafael Souza", from: "azul-2", to: "azul-3", date: "2026-06-20" },
  { id: "g2", studentId: "s7", name: "Felipe Tavares", from: "roxa-1", to: "roxa-2", date: "2026-06-20" },
  { id: "g3", studentId: "s12", name: "Tiago Oliveira", from: "marrom-3", to: "marrom-4", date: "2026-07-04" },
];

export const currentStudent = students[6];
