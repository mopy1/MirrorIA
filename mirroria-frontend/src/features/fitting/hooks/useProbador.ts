import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useCategorias } from "@/features/catalog/hooks/useCategorias"
import { useProductos } from "@/features/catalog/hooks/useProductos"
import type { Producto } from "@/features/catalog/types/catalog.types"
import { useCamara } from "./useCamara"
import { useProbadorIA } from "./useProbadorIA"
import { calcularPasos } from "../lib/pasosGuiados"
import {
  debeAplicarPrendaDelEnlace,
  elegirPrendaInicial,
  prendasProbables,
} from "../lib/prendasProbables"
import { promptDePrenda } from "../lib/promptDePrenda"

/** Cuánto se espera antes de liberar la URL del blob de la foto. Tiene que
 * alcanzar para que el navegador arranque la descarga. */
const MS_PARA_LIBERAR_LA_FOTO = 30_000

/** Orquesta el probador entero: cámara, conexión con la IA, catálogo de
 * prendas probables y la foto — la página (`ProbadorPage`) solo renderiza
 * lo que esto devuelve, sin lógica propia (Regla 1.B.2). */
export function useProbador(productoId?: string) {
  const { productos } = useProductos()
  const { categorias } = useCategorias()
  const { stream, estado, reintentar } = useCamara()
  const { remoto, estado: estadoIA, probarPrenda } = useProbadorIA(stream)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [prenda, setPrenda] = useState<Producto | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Ids cuya foto de referencia ya falló en esta sesión: sin esto, si la
  // prenda del enlace no carga, el efecto de abajo la volvería a elegir
  // —siempre la misma, rota— en un bucle sin salida.
  const [fallidas, setFallidas] = useState<ReadonlySet<string>>(() => new Set())
  const enlaceDescarga = useRef<HTMLAnchorElement>(null)

  const probables = useMemo(() => prendasProbables(productos), [productos])

  const alFallarPrenda = useCallback((id: string) => {
    setAviso("Esa prenda no se pudo cargar. Probá con otra.")
    setFallidas((prev) => new Set(prev).add(id))
    setPrenda(null)
  }, [])

  // Único punto que le pide a la IA que vista a la clienta: elige la
  // prenda en la tira/enlace y de inmediato manda su foto + prompt a la
  // sesión ya conectada (`useProbadorIA.probarPrenda`).
  const aplicarPrenda = useCallback(
    async (p: Producto) => {
      setAviso(null)
      setPrenda(p)
      const url = p.imagenes?.[0]?.url
      if (!url) return
      const categoriaNombre = categorias.find((c) => c.id === p.categoriaId)?.nombre
      try {
        const conectada = await probarPrenda(url, promptDePrenda(p, categoriaNombre))
        if (!conectada) setAviso("Todavía se está conectando con la IA. Esperá un segundo y probá de nuevo.")
      } catch {
        alFallarPrenda(p.id)
      }
    },
    [categorias, probarPrenda, alFallarPrenda],
  )

  // La prenda del enlace se aplica UNA sola vez por enlace (ver el porqué
  // en `debeAplicarPrendaDelEnlace`).
  const enlaceAplicado = useRef<string | null>(null)
  useEffect(() => {
    if (!debeAplicarPrendaDelEnlace(enlaceAplicado.current, productoId, productos.length > 0)) return
    enlaceAplicado.current = productoId ?? ""
    const inicial = elegirPrendaInicial(productos, productoId, fallidas)
    if (inicial) aplicarPrenda(inicial)
  }, [productos, productoId, fallidas, aplicarPrenda])

  const pasos = calcularPasos({
    hayCamara: estado === "lista",
    iaConectada: estadoIA === "conectado",
    iaConectando: estadoIA === "conectando",
    prendaElegida: Boolean(prenda),
  })

  // Dibuja el cuadro actual del video (el de la IA si ya conectó, si no el
  // crudo de la cámara) y dispara la descarga. Mucho más simple que la
  // versión anterior con landmarks: Decart ya devuelve la prenda puesta.
  const sacarFoto = useCallback(() => {
    if (!video || !video.videoWidth || !video.videoHeight) {
      setAviso("La cámara todavía no está lista.")
      return
    }
    const ancho = video.clientWidth
    const alto = video.clientHeight
    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setAviso("No se pudo generar la foto.")
      return
    }
    // El stream de Decart ya viene espejado (`mirror: "auto"` en la
    // conexión); el crudo de la cámara se espeja solo con CSS en pantalla,
    // así que acá hay que espejarlo a mano para que la foto coincida con lo
    // que se vio en vivo.
    if (!remoto) {
      ctx.translate(ancho, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, ancho, alto)
    canvas.toBlob((blob) => {
      const enlace = enlaceDescarga.current
      if (!blob || !enlace) {
        setAviso("No se pudo generar la foto.")
        return
      }
      const url = URL.createObjectURL(blob)
      enlace.href = url
      enlace.click()
      setTimeout(() => URL.revokeObjectURL(url), MS_PARA_LIBERAR_LA_FOTO)
    }, "image/png")
  }, [video, remoto])

  return {
    estado,
    reintentar,
    stream,
    remoto,
    video,
    setVideo,
    pasos,
    aviso,
    prenda,
    probables,
    fallidas,
    aplicarPrenda,
    sacarFoto,
    enlaceDescarga,
  }
}
