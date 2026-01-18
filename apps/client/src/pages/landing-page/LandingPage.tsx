import { Link } from 'react-router-dom';
import { Briefcase, Building2, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Navbar } from '../../components/navbar/Navbar';
import { features } from './mockFeatures.data';
import FeatureCard from './components/FeatureCard';
import InternshipGrid from './components/InternshipGrid';
import { userStore } from '../../store/userStore';
import { fetchPublicStats, fetchLatestPosts, type PublicStats } from '../../api/stats';
import type { Internship } from '../../types/internship.types';

export default function LandingPage() {
    const user = userStore((state) => state.access);
    const [activeStep, setActiveStep] = useState(0);
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [internships, setInternships] = useState<Internship[]>([]);
    const [isLoadingInternships, setIsLoadingInternships] = useState(true);
    const stepsRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(stepsRef, { once: true });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchPublicStats();
                setStats(data);
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        const loadInternships = async () => {
            try {
                const data = await fetchLatestPosts(6);
                setInternships(data);
            } catch (error) {
                console.error('Erreur lors du chargement des offres:', error);
            } finally {
                setIsLoadingInternships(false);
            }
        };

        loadStats();
        loadInternships();
    }, []);

    useEffect(() => {
        if (!isInView) return;

        const sequence = [
            { step: 1, delay: 500 },
            { step: 2, delay: 1500 },
            { step: 3, delay: 2500 },
            { step: 4, delay: 3500 },
            { step: 1, delay: 4500 },
        ];

        const timers = sequence.map(({ step, delay }) => setTimeout(() => setActiveStep(step), delay));

        return () => timers.forEach((timer) => clearTimeout(timer));
    }, [isInView]);

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar minimal={!user} />

            <section className="hero min-h-screen bg-base-100">
                <div className="hero-content text-center max-w-5xl px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6 text-primary">
                            Trouvez le stage de vos rêves
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-base-content/70 max-w-3xl mx-auto">
                            Stagora connecte les étudiants aux meilleures opportunités de stage proposées par des
                            entreprises vérifiées.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/home" className="btn btn-primary btn-lg gap-2">
                                <Briefcase className="w-5 h-5" />
                                Découvrir les offres
                            </Link>
                            <Link to="/company/signup" className="btn btn-outline btn-lg gap-2">
                                <Building2 className="w-5 h-5" />
                                Espace entreprise
                            </Link>
                        </div>

                        <div className="stats stats-vertical lg:stats-horizontal shadow-xl mt-12 bg-base-200">
                            {isLoadingStats ? (
                                <div className="stat">
                                    <div className="stat-value">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </div>
                                    <div className="stat-desc">Chargement...</div>
                                </div>
                            ) : stats ? (
                                <>
                                    <motion.div
                                        className="stat"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="stat-value text-primary">{stats.totalPosts}+</div>
                                        <div className="stat-desc text-base-content/70">Offres de stage</div>
                                    </motion.div>
                                    <motion.div
                                        className="stat"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="stat-value text-primary">{stats.totalCompanies}+</div>
                                        <div className="stat-desc text-base-content/70">Entreprises partenaires</div>
                                    </motion.div>
                                    <motion.div
                                        className="stat"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="stat-value text-primary">{stats.totalStudents}+</div>
                                        <div className="stat-desc text-base-content/70">Étudiants inscrits</div>
                                    </motion.div>
                                </>
                            ) : (
                                <div className="stat">
                                    <div className="stat-value text-error">-</div>
                                    <div className="stat-desc">Erreur de chargement</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Pourquoi choisir Stagora ?</h2>
                        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                            Une plateforme complète pour faciliter votre recherche de stage
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Comment ça marche ?</h2>
                        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                            En quelques étapes simples, trouvez votre stage idéal
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto" ref={stepsRef}>
                        <ul className="steps steps-vertical lg:steps-horizontal w-full">
                            <motion.li className={`step ${activeStep >= 1 ? 'step-primary' : ''}`}>
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">1. Créez votre compte</h3>
                                    <p className="text-base-content/70">Inscription rapide et gratuite</p>
                                </div>
                            </motion.li>
                            <motion.li className={`step ${activeStep >= 2 ? 'step-primary' : ''}`}>
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">2. Complétez votre profil</h3>
                                    <p className="text-base-content/70">Ajoutez vos compétences et expériences</p>
                                </div>
                            </motion.li>
                            <motion.li className={`step ${activeStep >= 3 ? 'step-primary' : ''}`}>
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">3. Postulez</h3>
                                    <p className="text-base-content/70">Candidatez aux offres qui vous intéressent</p>
                                </div>
                            </motion.li>
                            <motion.li className={`step ${activeStep >= 4 ? 'step-primary' : ''}`}>
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">4. Décrochez votre stage</h3>
                                    <p className="text-base-content/70">
                                        Suivez vos candidatures et obtenez des réponses
                                    </p>
                                </div>
                            </motion.li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-base-200 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl md:text-5xl font-bold mb-4"
                            viewport={{ once: true }}
                        >
                            Dernières offres de stage
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="text-xl text-base-content/70 max-w-2xl mx-auto"
                        >
                            Découvrez les opportunités les plus récentes proposées par nos entreprises partenaires
                        </motion.p>
                    </div>

                    {isLoadingInternships ? (
                        <div className="flex justify-center items-center py-16">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : internships.length > 0 ? (
                        <InternshipGrid internships={internships} />
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-base-content/70">Aucune offre disponible pour le moment</p>
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="text-center mt-16"
                        viewport={{ once: true }}
                    >
                        <Link to="/home" className="btn btn-primary btn-wide gap-2">
                            Voir toutes les offres
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-base-content">
                            Prêt à commencer votre aventure professionnelle ?
                        </h2>
                        <p className="text-xl mb-8 text-base-content/70">
                            Rejoignez des milliers d'étudiants qui ont trouvé leur stage grâce à Stagora
                        </p>
                        <Link to="/home" className="btn btn-lg btn-primary gap-2">
                            Découvrir les offres
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
