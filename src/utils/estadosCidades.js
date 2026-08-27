/**
 * Módulo para carregar estados e cidades do Brasil via Brasil API
 * Dados em tempo real do IBGE
 */

const BRASIL_API = 'https://brasilapi.com.br/api/ibge'

/**
 * Carrega lista de todos os estados brasileiros
 * @returns {Promise<Array>} Array com {sigla, nome, regiao}
 */
export async function carregarEstados() {
  try {
    const res = await fetch(`${BRASIL_API}/uf/v1`)
    if (!res.ok) throw new Error('Erro ao carregar estados')
    const estados = await res.json()
    return estados.sort((a, b) => a.nome.localeCompare(b.nome))
  } catch (e) {
    console.error('Erro ao carregar estados:', e)
    return []
  }
}

/**
 * Carrega lista de cidades de um estado específico
 * @param {string} uf - Sigla do estado (ex: 'SP')
 * @returns {Promise<Array>} Array com {nome, codigo_ibge}
 */
export async function carregarCidades(uf) {
  if (!uf) return []
  try {
    const res = await fetch(`${BRASIL_API}/municipios/v1/${uf}`)
    if (!res.ok) throw new Error(`Erro ao carregar cidades de ${uf}`)
    const cidades = await res.json()
    return cidades
      .map(c => c.nome)
      .sort((a, b) => a.localeCompare(b))
  } catch (e) {
    console.error(`Erro ao carregar cidades de ${uf}:`, e)
    return []
  }
}
