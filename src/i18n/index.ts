// ===== CAMBIAR IDIOMA AQUÍ =====
const LANG = 'es'; // 'es' = español, 'de' = alemán
// ================================

import es from './es.json';
import de from './de.json';
import introsEs from './intros-es.json';
import introsDe from './intros-de.json';
import exercisesEs from '../data/exercises-es.json';
import exercisesDe from '../data/exercises-de.json';

const translations = { es, de };
const intros = { es: introsEs, de: introsDe };
const exercises = { es: exercisesEs, de: exercisesDe };

const t = translations[LANG];
export const introsData = intros[LANG];
export const exercisesData = exercises[LANG];
export default t;
