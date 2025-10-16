declare module 'swiper' {
  export interface SwiperOptions {
    slidesPerView?: number
    breakpoints?: Record<number, any>
    grabCursor?: boolean
    loop?: boolean
    centeredSlides?: boolean
    initialSlide?: number
    spaceBetween?: number
    watchSlidesProgress?: boolean
    navigation?: {
      nextEl?: string
      prevEl?: string
    }
    pagination?: {
      el?: string
      clickable?: boolean
    }
  }

  export class Navigation {}
  export class Pagination {}

  export default class Swiper {
    constructor(selector: string, options?: SwiperOptions)
    static use(modules: any[]): void
  }
}

declare module 'swiper/swiper.min.css'
