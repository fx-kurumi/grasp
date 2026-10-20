// Pre-#832 response shape: same data + project fields (projects / heatmap / projectTrends / filterOptions.projects / kpi.projectCount)
const base = JSON.parse(JSON.stringify(require('./mock-token-stats.js')))
const projs = [['p-1', 'Grasp 平台', 0.46], ['p-2', '移动端', 0.24], ['p-3', '数据中台', 0.17], ['p-4', '官网', 0.13]]
const T = base.kpi.total
base.projects = projs.map(([id, name, s], i) => ({ projectId: id, name, total: Math.round(T * s), inputTokens: Math.round(T * s * 0.5), outputTokens: Math.round(T * s * 0.08), cacheReadTokens: Math.round(T * s * 0.38), cacheWriteTokens: Math.round(T * s * 0.04), cost: +(base.kpi.cost * s).toFixed(2), runCount: [224, 117, 83, 62][i], deltaPct: [21.4, -8.2, 35.1, 4.6][i] }))
const models = base.modelRanking.filter((m) => !m.unknown).slice(0, 6)
base.heatmap = { rows: models.map((m) => m.name), cols: projs.map((p) => p[1]), grid: models.map((m) => projs.map(([, , s], j) => Math.round(m.total * s * (0.7 + ((j * 7 + m.total) % 5) / 8)))) }
base.projectTrends = projs.map(([id, name, s]) => ({ key: id, name, trend: base.trend.map((b) => ({ ...b, total: Math.round(b.total * s), inputTokens: Math.round((b.inputTokens || 0) * s), outputTokens: Math.round((b.outputTokens || 0) * s), cacheReadTokens: Math.round((b.cacheReadTokens || 0) * s), cacheWriteTokens: Math.round((b.cacheWriteTokens || 0) * s) })) }))
base.filterOptions = { ...(base.filterOptions || {}), projects: projs.map(([id, name]) => ({ key: id, name })) }
base.kpi.projectCount = projs.length
base.topRuns = (base.topRuns || []).map((r, i) => ({ ...r, projectId: projs[i % 4][0], projectName: projs[i % 4][1] }))
module.exports = base
