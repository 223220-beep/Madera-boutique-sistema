const DISENADORES_KEY = "madera_boutique_disenadores";

const DISENADORES_DEFAULT = ["Elian", "Hashly", "Sofia"];

export const disenadoresUtils = {
  getDisenadores: (): string[] => {
    try {
      const data = localStorage.getItem(DISENADORES_KEY);
      if (data) {
        const disenadores = JSON.parse(data);
        return disenadores.length > 0 ? disenadores : DISENADORES_DEFAULT;
      }
      return DISENADORES_DEFAULT;
    } catch (error) {
      console.error("Error al cargar diseñadores:", error);
      return DISENADORES_DEFAULT;
    }
  },

  saveDisenadores: (disenadores: string[]): void => {
    try {
      localStorage.setItem(DISENADORES_KEY, JSON.stringify(disenadores));
    } catch (error) {
      console.error("Error al guardar diseñadores:", error);
    }
  },

  addDisenador: (nombre: string): boolean => {
    const disenadores = disenadoresUtils.getDisenadores();
    if (disenadores.includes(nombre)) {
      return false; // Ya existe
    }
    disenadores.push(nombre);
    disenadoresUtils.saveDisenadores(disenadores);
    return true;
  },

  updateDisenador: (oldNombre: string, newNombre: string): boolean => {
    const disenadores = disenadoresUtils.getDisenadores();
    const index = disenadores.indexOf(oldNombre);
    if (index === -1) return false;
    
    disenadores[index] = newNombre;
    disenadoresUtils.saveDisenadores(disenadores);
    return true;
  },

  deleteDisenador: (nombre: string): boolean => {
    const disenadores = disenadoresUtils.getDisenadores();
    const filtered = disenadores.filter((d) => d !== nombre);
    if (filtered.length === disenadores.length) return false;
    
    disenadoresUtils.saveDisenadores(filtered);
    return true;
  },
};
