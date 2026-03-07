import { Nota } from "../types/nota";

const STORAGE_KEY = "madera_boutique_notas";
const COUNTER_KEY = "madera_boutique_counter";

export const storageUtils = {
  getNotas: (): Nota[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error al cargar notas:", error);
      return [];
    }
  },

  saveNotas: (notas: Nota[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
    } catch (error) {
      console.error("Error al guardar notas:", error);
    }
  },

  getNextNumeroNota: (): string => {
    try {
      const counter = localStorage.getItem(COUNTER_KEY);
      const nextNumber = counter ? parseInt(counter) + 1 : 1;
      localStorage.setItem(COUNTER_KEY, nextNumber.toString());
      return nextNumber.toString().padStart(5, "0");
    } catch (error) {
      console.error("Error al generar número de nota:", error);
      return "00001";
    }
  },

  createNota: (nota: Omit<Nota, "id" | "numeroNota" | "createdAt" | "updatedAt">): Nota => {
    const notas = storageUtils.getNotas();
    const newNota: Nota = {
      ...nota,
      id: crypto.randomUUID(),
      numeroNota: storageUtils.getNextNumeroNota(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Valores por defecto para nuevos campos
      terminada: nota.terminada ?? false,
      pagada: nota.pagada ?? false,
      entregada: nota.entregada ?? false,
      asignadoA: nota.asignadoA ?? null,
      viaWhatsapp: nota.viaWhatsapp ?? false,
      imagenesReferencia: nota.imagenesReferencia ?? [],
      abonos: nota.abonos ?? [],
    };
    notas.push(newNota);
    storageUtils.saveNotas(notas);
    return newNota;
  },

  updateNota: (id: string, updates: Partial<Nota>): Nota | null => {
    const notas = storageUtils.getNotas();
    const index = notas.findIndex((n) => n.id === id);
    if (index === -1) return null;

    notas[index] = {
      ...notas[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storageUtils.saveNotas(notas);
    return notas[index];
  },

  deleteNota: (id: string): boolean => {
    const notas = storageUtils.getNotas();
    const filtered = notas.filter((n) => n.id !== id);
    if (filtered.length === notas.length) return false;
    storageUtils.saveNotas(filtered);
    return true;
  },

  getNotaById: (id: string): Nota | null => {
    const notas = storageUtils.getNotas();
    return notas.find((n) => n.id === id) || null;
  },
};