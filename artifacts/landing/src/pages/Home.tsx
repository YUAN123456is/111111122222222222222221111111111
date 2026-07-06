import { useLocale } from "@/context/LocaleContext";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { Button } from "@/components/ui/button";
import { Play, Download, Check, Smartphone, Flame, Gift, Star } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  const { t, isRtl, locale, setLocale } = useLocale();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}images/logo-wordmark.png`} alt="Nebula TV" className="h-8 w-auto" />
          </div>
          <Button variant="default" className="rounded-full px-6 font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]">
            {t("downloadNow")}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="" className="w-full h-full object-cover opacity-40 mix-blend-screen" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-20 w-full grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className={`flex flex-col gap-6 ${isRtl ? 'text-right items-end' : 'text-left items-start'}`}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
              #1 Short Drama App
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              {t("heroTitle")}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              {t("heroSubtitle")}
            </motion.p>
            <motion.div variants={fadeUp} className={`flex flex-wrap gap-4 mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button size="lg" className="rounded-full px-8 h-14 text-lg font-semibold bg-white text-black hover:bg-white/90">
                <Download className="w-5 h-5 me-2" />
                {t("downloadNow")}
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-semibold border-white/20 hover:bg-white/10 bg-black/40 backdrop-blur-sm">
                {t("watchFree")}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" as const }}
            className="relative mx-auto lg:ml-auto lg:mr-0 w-full max-w-[320px] aspect-[9/19] rounded-[3rem] border-[8px] border-zinc-900 bg-black overflow-hidden shadow-2xl shadow-primary/20 phone-mask group"
          >
            <img src={`${import.meta.env.BASE_URL}images/poster-1.png`} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-primary/90 rounded text-xs font-bold text-white shadow-[0_0_10px_rgba(225,29,72,0.6)]">EP 12</span>
                <span className="px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-medium text-white">1:02</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">The Billionaire's Secret</h3>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Smartphone className="w-4 h-4" /> Swipe up for next
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                <Flame className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t("featuresTitle")}</h3>
              <p className="text-muted-foreground text-lg">{t("featuresDesc")}</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,204,0,0.2)]">
                <Gift className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t("freeTitle")}</h3>
              <p className="text-muted-foreground text-lg">{t("freeDesc")}</p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Play className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t("genresTitle")}</h3>
              <p className="text-muted-foreground text-lg">{t("genresDesc")}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-zinc-950 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">{t("howItWorksTitle")}</h2>
          </motion.div>
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 relative"
          >
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-white/10 z-0" />
            
            {[
              { title: t("step1Title"), desc: t("step1Desc"), num: "1" },
              { title: t("step2Title"), desc: t("step2Desc"), num: "2" },
              { title: t("step3Title"), desc: t("step3Desc"), num: "3" }
            ].map((step, i) => (
              <motion.div variants={fadeUp} key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-xl">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-lg px-4">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Posters Section */}
      <section className="py-24 bg-background overflow-hidden relative border-t border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-7xl mx-auto px-6 mb-12 text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">{t("genresTitle")}</h2>
          <p className="text-muted-foreground text-lg">{t("genresDesc")}</p>
        </motion.div>
        
        <div className="flex gap-6 px-6 overflow-x-auto pb-12 snap-x no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {[1, 2, 3].map((i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              key={i} className="min-w-[280px] lg:min-w-[340px] aspect-[3/4] rounded-3xl overflow-hidden relative snap-center group border border-white/10"
            >
              <img src={`${import.meta.env.BASE_URL}images/poster-${i}.png`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 group-hover:bg-primary transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <Play className="w-6 h-6 text-white fill-white ms-1" />
                </div>
                <div className="flex gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur rounded text-xs font-bold text-white">100+ EP</span>
                  <span className="px-2 py-1 bg-primary/80 backdrop-blur rounded text-xs font-bold text-white">Exclusive</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-zinc-950 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">{t("testimonialsTitle")}</h2>
          </motion.div>
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[t("testimonial1"), t("testimonial2"), t("testimonial3")].map((text, i) => (
              <motion.div variants={fadeUp} key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-5 h-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-white/90 text-lg leading-relaxed font-medium">"{text}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-background relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">{t("faqTitle")}</h2>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/10">
                <AccordionTrigger className={`text-lg font-semibold text-white hover:text-primary transition-colors py-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t("faq1Q")}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg pb-6">
                  {t("faq1A")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/10">
                <AccordionTrigger className={`text-lg font-semibold text-white hover:text-primary transition-colors py-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t("faq2Q")}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg pb-6">
                  {t("faq2A")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/10">
                <AccordionTrigger className={`text-lg font-semibold text-white hover:text-primary transition-colors py-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t("faq3Q")}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg pb-6">
                  {t("faq3A")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-32 bg-primary relative overflow-hidden text-center">
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay object-cover"
          style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/hero-bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto px-6"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">{t("ctaTitle")}</h2>
          <p className="text-xl text-white/80 mb-10">{t("ctaDesc")}</p>
          <Button size="lg" className="rounded-full px-10 h-16 text-xl font-bold bg-white text-primary hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <Download className="w-6 h-6 me-2" />
            {t("downloadNow")}
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}images/logo-wordmark.png`} alt="Nebula TV" className="h-8 w-auto" />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground font-medium">{t("languageSwitcherLabel")}</label>
            <select 
              value={locale} 
              onChange={(e) => setLocale(e.target.value)}
              className={`bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary outline-none cursor-pointer ${isRtl ? 'pl-8' : 'pr-8'}`}
            >
              {SUPPORTED_LOCALES.map(l => (
                <option key={l.code} value={l.code} className="bg-zinc-900">{l.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("footerRights")}
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">{t("privacyPolicy")}</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">{t("termsOfService")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
