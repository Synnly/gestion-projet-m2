import { Link } from 'react-router-dom';
import { Briefcase, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from '../../components/navbar/Navbar';
import { mockInternships } from './mockInternships.data';
import { features } from './mockFeatures.data';
import { stats } from './mockStats';
import FeatureCard from './components/FeatureCard';
import InternshipGrid from './components/InternshipGrid';
import { userStore } from '../../store/userStore';
export default function LandingPage() {
    const user = userStore((state) => state.access);
    return (
        <div className="min-h-screen bg-base-100">
            <Navbar minimal={!user} />

            <section className="hero min-h-[90vh] bg-base-100">
                <div className="hero-content text-center max-w-5xl px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
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
                            <Link to="/signup/company" className="btn btn-outline btn-lg gap-2">
                                <Building2 className="w-5 h-5" />
                                Espace entreprise
                            </Link>
                        </div>

                        <div className="stats stats-vertical lg:stats-horizontal shadow-xl mt-12 bg-base-200">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className="stat"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 * index }}
                                >
                                    <div className="stat-value text-primary">{stat.value}</div>
                                    <div className="stat-desc text-base-content/70">{stat.label}</div>
                                </motion.div>
                            ))}
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

                    <div className="max-w-6xl mx-auto">
                        <ul className="steps steps-vertical lg:steps-horizontal w-full">
                            <li className="step step-primary">
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">1. Créez votre compte</h3>
                                    <p className="text-base-content/70">Inscription rapide et gratuite</p>
                                </div>
                            </li>
                            <li className="step step-primary">
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">2. Complétez votre profil</h3>
                                    <p className="text-base-content/70">Ajoutez vos compétences et expériences</p>
                                </div>
                            </li>
                            <li className="step step-primary">
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">3. Postulez</h3>
                                    <p className="text-base-content/70">Candidatez aux offres qui vous intéressent</p>
                                </div>
                            </li>
                            <li className="step">
                                <div className="text-left mt-4">
                                    <h3 className="font-bold text-lg">4. Décrochez votre stage</h3>
                                    <p className="text-base-content/70">
                                        Suivez vos candidatures et obtenez des réponses
                                    </p>
                                </div>
                            </li>
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
                        >
                            Offres de stage populaires
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-xl text-base-content/70 max-w-2xl mx-auto"
                        >
                            Découvrez les opportunités les plus consultées par les étudiants
                        </motion.p>
                    </div>

                    <InternshipGrid internships={mockInternships} />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="text-center mt-16"
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

            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Ce qu'ils en disent</h2>
                        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                            Les témoignages de nos utilisateurs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="card bg-base-100 shadow-xl"
                        >
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rating rating-sm pointer-events-none">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <input
                                                key={i}
                                                type="radio"
                                                name="rating-1"
                                                className="mask mask-star-2 bg-warning"
                                                checked
                                                readOnly
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-base-content/70">
                                    "Grâce à Stagora, j'ai trouvé mon stage de rêve en moins de deux semaines.
                                    L'interface est intuitive et les offres sont de qualité."
                                </p>
                                <div className="mt-4">
                                    <p className="font-bold">Marie Dupont</p>
                                    <p className="text-sm text-base-content/60">Étudiante en Marketing</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="card bg-base-100 shadow-xl"
                        >
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rating rating-sm pointer-events-none">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <input
                                                key={i}
                                                type="radio"
                                                name="rating-2"
                                                className="mask mask-star-2 bg-warning"
                                                checked
                                                readOnly
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-base-content/70">
                                    "En tant qu'entreprise, Stagora nous permet de trouver facilement des stagiaires
                                    motivés et qualifiés. Un vrai gain de temps !"
                                </p>
                                <div className="mt-4">
                                    <p className="font-bold">Jean Martin</p>
                                    <p className="text-sm text-base-content/60">DRH - TechCorp</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="card bg-base-100 shadow-xl"
                        >
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rating rating-sm pointer-events-none">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <input
                                                key={i}
                                                type="radio"
                                                name="rating-3"
                                                className="mask mask-star-2 bg-warning"
                                                checked
                                                readOnly
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-base-content/70">
                                    "La plateforme est très bien conçue. Le suivi des candidatures est clair et les
                                    entreprises répondent rapidement."
                                </p>
                                <div className="mt-4">
                                    <p className="font-bold">Sophie Leblanc</p>
                                    <p className="text-sm text-base-content/60">Étudiante en Informatique</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
